/* Email templates for The Blue Corner.
 *
 * Both messages share one layout so the notification the team sees and the
 * confirmation the public sees are visibly the same brand.
 *
 * Three deliberate constraints, because email is not the web:
 *
 * 1. NO REMOTE IMAGES. Gmail, Outlook and Apple Mail all block images from
 *    unknown senders by default, which is exactly what a brand's first email
 *    is. A logo that renders as a broken box for most recipients is worse than
 *    no logo, so the wordmark is set in type. It also means the email has no
 *    dependency on the site's origin, which is still changing.
 * 2. TABLES AND INLINE STYLES. Outlook renders with Word's engine: no flexbox,
 *    no grid, no <style> block worth relying on, and margins are unreliable.
 *    Spacing is done with padding on table cells.
 * 3. WEB-SAFE FONTS. The brand face is licensed from Typekit and cannot load in
 *    an email client, so the stack falls through to what people actually have.
 *    The brand carries on colour and structure instead.
 *
 * The navy crisis band is not decoration. The site closes all five screens with
 * it; someone who signs up to a suicide-prevention service may need those
 * numbers today, and the email should not be the one place they are missing.
 */

const NAVY = "#042874";
const BLUE = "#197CE3";
const YELLOW = "#EFC82C";
const OFF_WHITE = "#EFF3F9";
const WHITE = "#ffffff";
const INK_MUTED = "#5b6f9c";

const FONT = "'Helvetica Neue',Helvetica,Arial,'Segoe UI',sans-serif";

export const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

/* Sits at the very top of the HTML, hidden. It is what Gmail and Apple Mail show
   as the grey preview line beside the subject. Without it they scrape the first
   visible text, which here is the wordmark, and every email previews as
   "THE BLUE CORNER THE BLUE CORNER". */
const preheader = (text) => `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(text)}</div>`;

const CRISIS_BAND = `
        <tr>
          <td style="background:${NAVY};padding:24px 32px">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${YELLOW};font-weight:700">Need someone now</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.5;color:${OFF_WHITE}">
              Call or text <strong style="color:${WHITE}">9-8-8</strong> &mdash; Suicide Crisis Helpline. 24/7, free, across Canada.<br>
              If you are in immediate danger, call <strong style="color:${WHITE}">9-1-1</strong>.
            </p>
            <a href="tel:988" style="display:inline-block;background:${YELLOW};color:${NAVY};font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;padding:11px 18px;margin-right:8px">Call 9-8-8</a>
            <a href="sms:988" style="display:inline-block;background:${YELLOW};color:${NAVY};font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;padding:11px 18px">Text 9-8-8</a>
          </td>
        </tr>`;

/* `footnote` is raw HTML from the caller, never from user input. */
const layout = ({ preview, body, footnote }) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>The Blue Corner</title>
</head>
<body style="margin:0;padding:0;background:${OFF_WHITE};-webkit-text-size-adjust:100%">
${preheader(preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${OFF_WHITE}">
  <tr>
    <td align="center" style="padding:32px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${WHITE};border-top:6px solid ${YELLOW}">

        <tr>
          <td style="background:${BLUE};padding:26px 32px">
            <p style="margin:0;font-family:${FONT};font-size:21px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${WHITE}">The Blue Corner</p>
            <p style="margin:5px 0 0;font-family:${FONT};font-size:13px;letter-spacing:.08em;color:${OFF_WHITE}">Nobody Fights Alone.</p>
          </td>
        </tr>

        <tr><td style="padding:34px 32px 30px">${body}</td></tr>
${CRISIS_BAND}

        <tr>
          <td style="background:${OFF_WHITE};padding:20px 32px">
            <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${INK_MUTED}">${footnote}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body></html>`;

/* ------------------------------------------------------------------ *
 * 1. Confirmation to the person who signed up.
 * ------------------------------------------------------------------ */

/* The greeting is the ONLY place a submitted value reaches this message, and it
   goes to an address a stranger typed — so a forged signup could otherwise use
   the brand's own domain to deliver arbitrary text to a victim. The name is used
   only if it looks like a name; anything else falls back to an unaddressed
   greeting. Everything else in the email is a constant. */
const NAME_SHAPE = /^[\p{L}][\p{L}\p{M}\s'’.-]{0,59}$/u;
export const safeGreetingName = (name) =>
  (NAME_SHAPE.test(name) && !/\d|https?:|www\./i.test(name) ? name : "");

export const confirmationEmail = (entry) => {
  const name = safeGreetingName(entry.name);
  const greeting = name ? `Thank you, ${name}.` : "Thank you.";

  const body = `
            <h1 style="margin:0 0 18px;font-family:${FONT};font-size:30px;line-height:1.15;font-weight:700;color:${NAVY}">${escapeHtml(greeting)}</h1>
            <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${NAVY}">
              We've got your details. Someone from The Blue Corner will reach out to you personally to
              get you on the list and answer anything you want to ask.
            </p>
            <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.6;color:${NAVY}">
              There's nothing else you need to do for now, and we won't pass your details to anyone.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px">
              <tr><td style="border-left:4px solid ${YELLOW};padding:4px 0 4px 14px">
                <p style="margin:0;font-family:${FONT};font-size:19px;line-height:1.4;font-weight:700;color:${NAVY}">Nobody fights alone.</p>
              </td></tr>
            </table>`;

  const text = `${greeting}

We've got your details. Someone from The Blue Corner will reach out to you personally to get you on the list and answer anything you want to ask.

There's nothing else you need to do for now, and we won't pass your details to anyone.

Nobody fights alone.

--------------------------------------------------
NEED SOMEONE NOW?
Call or text 9-8-8 - Suicide Crisis Helpline. 24/7, free, across Canada.
If you are in immediate danger, call 9-1-1.
--------------------------------------------------

You're receiving this because you asked us to tell you when The Blue Corner opens.
Reply to this email and we'll delete your details, no questions.`;

  return {
    subject: "Thank you — we'll be in touch",
    html: layout({
      preview: "We've got your details. Someone will reach out to you personally.",
      body,
      footnote: `You're receiving this because you asked us to tell you when The Blue Corner opens.
              Reply to this email and we'll take you off the list and delete your details, no questions.`,
    }),
    text,
  };
};

/* ------------------------------------------------------------------ *
 * 2. Notification to the team.
 * ------------------------------------------------------------------ */

/* The stored timestamp stays ISO 8601 because the recovery log has to be
   machine-readable, but nobody wants to read 2026-07-29T18:19:10.481Z in an
   inbox. Displayed in Toronto time, since that is where this is read. */
const formatReceived = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(date) + " (Toronto)";
};

export const notificationEmail = (entry) => {
  const rows = [
    ["Joining as", entry.role],
    ["Name", entry.name],
    ["Email", entry.email],
    ["Phone", entry.phone],
    ["Consent given", "Yes — express, via the form's checkbox"],
    ["Received", formatReceived(entry.receivedAt)],
  ];

  /* Every value is escaped. `entry` has passed validation, but escaping is what
     makes that irrelevant: even if validation were loosened later, nothing here
     can break out into markup. */
  const table = rows.map(([label, value], i) => `
              <tr>
                <td style="padding:11px 14px;background:${i % 2 ? OFF_WHITE : WHITE};font-family:${FONT};font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${INK_MUTED};font-weight:700;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
                <td style="padding:11px 14px;background:${i % 2 ? OFF_WHITE : WHITE};font-family:${FONT};font-size:16px;color:${NAVY};vertical-align:top">${escapeHtml(value)}</td>
              </tr>`).join("");

  const body = `
            <h1 style="margin:0 0 6px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:700;color:${NAVY}">New signup</h1>
            <p style="margin:0 0 22px;font-family:${FONT};font-size:15px;line-height:1.5;color:${INK_MUTED}">
              Someone joined the corner as <strong style="color:${NAVY}">${escapeHtml(entry.role)}</strong>.
              Reply to this email to reach them directly.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #c3d3ec">${table}
            </table>
            <p style="margin:22px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${INK_MUTED}">
              They have been sent an automatic confirmation saying someone will reach out to them personally.
            </p>`;

  const text = `NEW SIGNUP — ${entry.role}

${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}

Reply to this email to reach them directly.
They have been sent an automatic confirmation saying someone will reach out to them personally.`;

  return {
    subject: `New Blue Corner signup — ${entry.role}`,
    html: layout({
      preview: `${entry.role} — ${entry.name}`,
      body,
      footnote: `Sent automatically by the Blue Corner coming-soon page.
              This message contains personal information: handle and store it accordingly.`,
    }),
    text,
  };
};
