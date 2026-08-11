# Security and privacy

This is the Blue Corner coming-soon page: a static site plus one endpoint.

## What it collects

The sign-up form collects a role (Patient or Therapist), name, email address, phone number, and an
express consent tick. It sends them to `POST /api/signup` on the same origin, which emails them to
the team via Resend and sends the person a confirmation. There is no database, no session, no cookie,
no analytics, and no local or session storage. `privacy.html` is the user-facing version of this and
is kept in step with it.

### The confirmation email is the sharpest edge here

It goes to an address the submitter typed, which makes this endpoint a mailer pointed at a third
party. Someone can enter a victim's address with an abusive or phishing "name" and have The Blue
Corner's own verified domain deliver it. Controls:

- The greeting uses the submitted name **only if it passes a conservative name shape** (letters, marks,
  spaces, apostrophes, hyphens, periods; 60 chars max; no digits, no `http:`/`www.`). Anything else is
  dropped and the email falls back to an unaddressed "Hi,". Every other word in the message is a
  constant — nothing else the submitter typed appears in it.
- Send rate limits bound the volume: 5/hour/IP and 200/hour globally.
- It is sent **after** the response and its failure is logged, never surfaced. A bounced courtesy
  email must not tell the person their signup failed and invite a duplicate retry.
- `AUTOREPLY_ENABLED=false` turns it off without a code change, because it is the one outbound message
  aimed at the public and may need stopping in a hurry.

Because someone self-identifying as a patient on a mental-health site is health-adjacent personal
information, treat every one of these values as sensitive. In particular, do not move it into a CRM,
an advertising audience, or a spreadsheet in shared storage without deciding deliberately that you
may.

## What protects it

- The browser never talks to Resend. The API key lives only in the server process, is read from a
  root-owned `0600` env file, and is never logged, returned, or bundled.
- The page's CSP is `connect-src 'self'` and `form-action 'none'`. The runtime is allowed exactly one
  network call, to `/api/signup`, and `tools/check-site.mjs` fails if a second one appears, if the
  target becomes an absolute URL, or if any absolute URL enters the runtime at all.
- The endpoint binds to `127.0.0.1` and is reachable only through Caddy.
- Requests are capped at 4 KB, must be `application/json`, and must not carry a foreign `Origin`.
- Two rate limits: a loose per-IP request cap that stops probing, and a strict per-IP and global cap
  on sends, so a flood cannot bill the email account. The client IP is taken from the **last**
  `X-Forwarded-For` entry, because every earlier entry is attacker-controlled.
- A honeypot field and a minimum time-to-submit both answer `200`, so a bot learns nothing.
- Submitted values are HTML-escaped before entering the email body. `from`, `to` and `subject` are
  constants: no submitted value ever reaches a mail header.
- Logs record an outcome, a rejection reason, and a per-process-salted 8-character IP hash. They
  never contain a name, email, phone, or role.
- If Resend rejects a message, that one record is appended to
  `/var/lib/blue-corner/failed-signups.jsonl` (`0600`) so a provider outage cannot silently destroy
  someone's signup. Nothing is written on the success path. That file does contain personal
  information: it is disclosed in `privacy.html`, and it should be drained and emptied once the
  records in it have been recovered.

## Still outstanding before a public launch

- The 85%, #1 and ~300% statistics are design-review copy and are not yet sourced.
- The photography is generated placeholder, not licensed or commissioned.
- The page is `noindex, nofollow, noarchive` and `robots.txt` disallows everything. Both should stay
  that way until the two items above are resolved.

If you identify a security or privacy concern, contact the repository owner privately before sharing
sensitive details in a public issue.
