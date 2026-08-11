/* The Blue Corner sign-up endpoint.
 *
 * One job: take the coming-soon form's POST, and email it to the team. It does
 * not have a database, a session, a cookie, or a dependency. Node builtins
 * only, matching the rest of this repo, which has no package.json at all.
 *
 * It binds to loopback and is only ever reached through Caddy. Nothing here
 * should be exposed directly to the internet — several of the decisions below
 * (trusting X-Forwarded-For, for one) are only safe because of that.
 *
 * Run:  node server/signup-api.mjs
 * Env:  RESEND_API_KEY, EMAIL_FROM, EMAIL_TO, ALLOWED_ORIGIN, PORT
 */
import http from "node:http";
import { appendFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import { confirmationEmail, notificationEmail } from "./emails.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = "127.0.0.1";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM?.trim() ?? "";
const EMAIL_TO = process.env.EMAIL_TO?.trim() ?? "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN?.trim() ?? "";
/* Where a reply to the confirmation email should land: a human mailbox, not the
   no-reply sender. */
const REPLY_TO = process.env.REPLY_TO?.trim() || EMAIL_TO;
/* The confirmation email to the person who signed up. Toggleable without a code
   change, because it is the one outbound message aimed at the public and it may
   need to be stopped in a hurry. */
const AUTOREPLY_ENABLED = (process.env.AUTOREPLY_ENABLED?.trim().toLowerCase() ?? "true") !== "false";
/* Written to ONLY when Resend refuses the message, so a provider outage cannot
   silently destroy someone's signup. The happy path persists nothing. 0600, and
   the privacy page discloses it. */
const FAILED_LOG = process.env.FAILED_LOG?.trim() || "/var/lib/blue-corner/failed-signups.jsonl";

/* Fail fast rather than start half-configured. A server that accepts signups it
   cannot deliver is worse than one that is loudly down: the person gets a
   success message and is never heard from again. systemd restarts on failure,
   so a missing key is noisy instead of silent. */
for (const [name, value] of [["RESEND_API_KEY", RESEND_API_KEY], ["EMAIL_FROM", EMAIL_FROM], ["EMAIL_TO", EMAIL_TO]]) {
  if (!value) {
    console.error(`[signup] ${name} is not set. Refusing to start.`);
    process.exit(1);
  }
}

const MAX_BODY_BYTES = 4096;
const RATE_WINDOW_MS = 60 * 60 * 1000;
/* Two tiers, because requests and sends are not the same risk.

   Counting every request against one low cap looks tidy and is wrong in
   practice: someone who mistypes their email four times and then fixes it has
   spent five requests and would be locked out for an hour at the moment they
   finally got it right. So requests get a loose cap that only stops probing
   floods, and the send — the expensive, abusable action, the one that costs
   money and can be aimed at a stranger's inbox — gets the strict one. */
const MAX_REQUESTS_PER_IP = 30;
const MAX_SENDS_PER_IP = 5;
/* A ceiling on what a distributed flood can cost. Past this the endpoint sheds
   load rather than billing the Resend account for it. */
const MAX_GLOBAL_SENDS_PER_WINDOW = 200;
/* Nobody reads this page, fills five fields and ticks a box in under three
   seconds. Scripted posts do it in tens of milliseconds. */
const MIN_ELAPSED_MS = 3000;

const LIMITS = { name: 100, email: 254, phone: 32, role: 32 };
const ROLES = new Set(["Patient", "Therapist"]);
/* Deliberately the same shape the browser enforces. Not RFC 5322 — that
   accepts addresses no mail system will take — just "one @, a dot after it,
   no spaces". */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Per-process salt: IP hashes in the log are useful for spotting one abuser
   across a few minutes, and useless for identifying anyone or for correlating
   across restarts. */
const IP_SALT = randomBytes(16);
const hashIp = (ip) => createHash("sha256").update(IP_SALT).update(ip).digest("hex").slice(0, 8);

/* Caddy APPENDS the real peer to any X-Forwarded-For the client sent, so the
   client controls every entry except the last one. Taking the first would let
   anyone spoof a fresh identity per request and walk straight through the rate
   limit. Take the last. */
const clientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const parts = forwarded.split(",");
    const last = parts[parts.length - 1].trim();
    if (last) return last;
  }
  return req.socket.remoteAddress ?? "unknown";
};

/* Bounded by construction: every check prunes expired entries first, so neither
   map can grow without limit under a sustained flood of unique IPs. */
const requestHits = new Map();
const sendHits = new Map();
let globalWindowStart = Date.now();
let globalSends = 0;

const prune = (map, now) => {
  for (const [key, stamps] of map) {
    const live = stamps.filter((stamp) => now - stamp < RATE_WINDOW_MS);
    if (live.length === 0) map.delete(key);
    else map.set(key, live);
  }
};

const overLimit = (map, ip, cap, now) => {
  prune(map, now);
  const stamps = map.get(ip) ?? [];
  if (stamps.length >= cap) return true;
  stamps.push(now);
  map.set(ip, stamps);
  return false;
};

/* Loose: stops probing and flooding, never a real person correcting a typo. */
const requestLimited = (ip) => overLimit(requestHits, ip, MAX_REQUESTS_PER_IP, Date.now());

/* Strict, and only consulted immediately before an actual send. */
const sendLimited = (ip) => {
  const now = Date.now();
  if (now - globalWindowStart > RATE_WINDOW_MS) {
    globalWindowStart = now;
    globalSends = 0;
  }
  if (globalSends >= MAX_GLOBAL_SENDS_PER_WINDOW) return true;
  if (overLimit(sendHits, ip, MAX_SENDS_PER_IP, now)) return true;
  globalSends += 1;
  return false;
};

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  let overflowed = false;
  req.on("data", (chunk) => {
    if (overflowed) return;
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      /* Stop accumulating before parsing anything. A 4 KB cap on a form whose
         largest field is a 254-character email is generous; anything past it is
         not a signup.

         Deliberately NOT req.destroy() here. Destroying the socket kills the
         connection before the 413 can be written, so the browser sees a reset
         rather than an error it can show the user. Pause instead, answer
         properly, and let the response close the connection. */
      overflowed = true;
      req.pause();
      reject(new Error("payload too large"));
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => { if (!overflowed) resolve(Buffer.concat(chunks).toString("utf8")); });
  req.on("error", reject);
});

const json = (res, status, payload, { close = false } = {}) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    /* No CORS headers anywhere, by design: this endpoint is same-origin only,
       so a browser on any other site cannot read a response from it. */
    /* Set when the request body was never fully read — keeping the connection
       alive with unread bytes still buffered desynchronises the next request
       on it. */
    ...(close ? { Connection: "close" } : {}),
  });
  res.end(body);
};

const validate = (data) => {
  if (typeof data !== "object" || data === null) return "malformed";
  const role = typeof data.role === "string" ? data.role.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  if (!ROLES.has(role)) return "role";
  if (!name || name.length > LIMITS.name) return "name";
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) return "email";
  if (!phone || phone.length > LIMITS.phone || phone.replace(/\D/g, "").length < 10) return "phone";
  /* Express consent, checked server-side too. The browser can be bypassed;
     this is the copy that counts. */
  if (data.consent !== true) return "consent";
  return { role, name, email, phone };
};

/* Shared Resend call. `from`, `to`, `subject` and `replyTo` are decided by the
   caller from constants or already-validated values — never from raw input. */
const resendSend = async ({ to, replyTo, subject, html, text }) => {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], reply_to: replyTo, subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    let detail = "";
    try { detail = await response.text(); } catch { /* body is optional */ }
    /* Resend's error body never echoes the key, but truncate anyway so a
       verbose provider error cannot fill the journal. */
    throw new Error(`resend ${response.status}: ${detail.slice(0, 200)}`);
  }
};

/* Both messages are built in ./emails.mjs. They share one layout so the mail
   the team sees and the mail the public sees are visibly the same brand. */
const sendConfirmation = async (entry) => {
  const { subject, html, text } = confirmationEmail(entry);
  await resendSend({ to: entry.email, replyTo: REPLY_TO, subject, html, text });
};

const sendEmail = async (entry) => {
  const { subject, html, text } = notificationEmail(entry);
  /* reply_to is the submitter's address so replying reaches them directly. It
     has already passed EMAIL_RE, and it is a JSON field rather than a raw
     header, so there is no CRLF header-injection path. */
  await resendSend({ to: EMAIL_TO, replyTo: entry.email, subject, html, text });
};

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(`[signup] unhandled: ${error.message}`);
    if (!res.headersSent) json(res, 500, { error: "server error" });
    else res.end();
  });
});

const handle = async (req, res) => {
  const ip = clientIp(req);

  if (req.method === "GET" && req.url === "/api/health") {
    json(res, 200, { ok: true });
    return;
  }
  if (req.method !== "POST" || req.url !== "/api/signup") {
    json(res, 404, { error: "not found" });
    return;
  }
  /* A cross-origin POST cannot read the response, but it can still cause a
     send. Reject any Origin that is not ours. */
  const origin = req.headers.origin;
  if (typeof origin === "string" && ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    console.warn(`[signup] rejected reason=origin ip=${hashIp(ip)}`);
    json(res, 403, { error: "forbidden" });
    return;
  }
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    json(res, 415, { error: "unsupported media type" });
    return;
  }
  if (requestLimited(ip)) {
    console.warn(`[signup] rejected reason=rate ip=${hashIp(ip)}`);
    json(res, 429, { error: "too many requests" });
    return;
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    console.warn(`[signup] rejected reason=size ip=${hashIp(ip)}`);
    if (!res.headersSent) json(res, 413, { error: "payload too large" }, { close: true });
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`[signup] rejected reason=json ip=${hashIp(ip)}`);
    json(res, 400, { error: "invalid request" });
    return;
  }
  /* `null` and `[]` are both valid JSON and both survive JSON.parse. Without
     this guard the bot-trap check below dereferences them and throws, which
     killed the process — a four-byte denial of service. Everything downstream
     assumes a plain object; this is where that assumption is made true. */
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    console.warn(`[signup] rejected reason=shape ip=${hashIp(ip)}`);
    json(res, 400, { error: "invalid request" });
    return;
  }

  /* Both bot signals answer 200. Telling a bot why it failed just teaches it
     which field to leave alone next time. */
  const trapped = (typeof data.website === "string" && data.website.trim() !== "")
    || (typeof data.elapsedMs === "number" && data.elapsedMs < MIN_ELAPSED_MS);
  if (trapped) {
    console.warn(`[signup] dropped reason=bot ip=${hashIp(ip)}`);
    json(res, 200, { ok: true });
    return;
  }

  const result = validate(data);
  if (typeof result === "string") {
    /* The field name is logged, never its value. */
    console.warn(`[signup] rejected reason=invalid:${result} ip=${hashIp(ip)}`);
    json(res, 400, { error: "invalid request" });
    return;
  }

  /* Checked here and not earlier: only a request that has survived validation,
     the bot traps and the request cap is allowed to consume send budget. */
  if (sendLimited(ip)) {
    console.warn(`[signup] rejected reason=send-rate ip=${hashIp(ip)}`);
    json(res, 429, { error: "too many requests" });
    return;
  }

  const entry = { ...result, receivedAt: new Date().toISOString() };
  try {
    await sendEmail(entry);
    /* Note what is NOT here: no name, no email, no phone, no role. A signup
       that succeeded leaves no trace on this box at all. */
    console.log(`[signup] accepted ip=${hashIp(ip)}`);
    json(res, 200, { ok: true });

    /* Deliberately AFTER the response, and deliberately not allowed to fail the
       request. The signup is already captured the moment the team notification
       lands; if the courtesy confirmation bounces, that is worth a log line and
       nothing more. Failing here would show the person an error and invite a
       retry that duplicates a signup we already have. */
    if (AUTOREPLY_ENABLED) {
      try {
        await sendConfirmation(entry);
        console.log(`[signup] confirmation sent ip=${hashIp(ip)}`);
      } catch (replyError) {
        console.error(`[signup] confirmation failed ip=${hashIp(ip)}: ${replyError.message}`);
      }
    }
  } catch (error) {
    console.error(`[signup] send failed ip=${hashIp(ip)}: ${error.message}`);
    /* Last resort so the person is not lost. If even this fails there is
       nothing left to try, and the browser shows the retry message. */
    try {
      await appendFile(FAILED_LOG, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
      console.error("[signup] captured to the failure log for manual recovery");
    } catch (writeError) {
      console.error(`[signup] failure log unwritable: ${writeError.message}`);
    }
    json(res, 502, { error: "send failed" });
  }
};

server.listen(PORT, HOST, () => {
  console.log(`[signup] listening on ${HOST}:${PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
