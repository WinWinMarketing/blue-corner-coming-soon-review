export const referenceHero = Object.freeze({
  image: "blue-corner-reference-ring-human-v1.webp",
  width: 2400,
  height: 1600,
  alt: "A solemn man seated in a boxing-ring corner holds a sign reading “HELP IS ON THE WAY,” framed by yellow ropes and a blue corner pad.",
});

export const sourceCopy = Object.freeze({
  header: Object.freeze({ name: "The Blue Corner" }),
  hero: Object.freeze({
    eyebrow: "Round one is coming",
    heading: "Nobody Fights Alone.",
    leadFirst: "Three in four suicides in Canada are men.",
    leadSecond: "Let that sit for a second.",
    // The right column breaks on its own sentence, not wherever the measure runs
    // out. Two sentences, two lines, so it squares up with the two lines of the
    // left column instead of reading as a ragged paragraph beside them.
    bodyFirst: "Most men fight this alone and in silence.",
    bodySecond: "Not for much longer — your corner opens soon.",
    body: "Most men fight this alone and in silence. Not for much longer — your corner opens soon.",
    memberCta: "Get early access",
    therapistCta: "Therapists, join us",
  }),
  stats: Object.freeze({
    eyebrow: "The crisis we've agreed to whisper about",
    heading: "Every year we stay quiet, the numbers climb.",
    items: Object.freeze([
      Object.freeze({ value: "85%", label: "of working men have already hit burnout" }),
      Object.freeze({ value: "2×", label: "anxiety disorders have doubled in a decade" }),
      Object.freeze({ value: "#1", label: "cause of death for men 20 to 49 is overdose" }),
      Object.freeze({ value: "3×", label: "more young men now seeking gambling help" }),
    ]),
    source: "Sources: Statistics Canada · Public Health Agency of Canada · CMAJ · Cogent Mental Health.",
    gamblingSource: "Gambling figure: help-seeking among men aged 15 to 24 in Ontario after online betting was legalized in 2022 (CMAJ, 2026).",
  }),
  // Four rooms. These generated review placeholders preserve the empty-room
  // scenes; commissioned or licensed photography is still required for launch.
  rooms: Object.freeze({
    eyebrow: "Depression in men rarely looks like depression",
    heading: "It looks like an ordinary week.",
    items: Object.freeze([
      Object.freeze({
        slot: "Photo 01",
        image: "room-01-unmade-bed-v2.webp",
        width: 1086,
        height: 1448,
        alt: "An unmade bed in cool predawn light with a softly glowing phone on the rumpled bedding.",
        heading: "Wired at 3am. Flat by 9.",
        support: "No rest, no drive.",
      }),
      Object.freeze({
        slot: "Photo 02",
        image: "room-02-garage-v2.webp",
        width: 1086,
        height: 1448,
        alt: "An empty garage chair faces a softly glowing television, with five unbranded cans lined on the concrete floor.",
        heading: "Numb is the only setting.",
        support: "Drink, bet, scroll, repeat.",
      }),
      Object.freeze({
        slot: "Photo 03",
        image: "room-03-desk-v2.webp",
        width: 1086,
        height: 1448,
        alt: "An empty desk chair sits before a softly lit blank monitor in a home office at dusk.",
        heading: "Ten tabs. Nothing finished.",
        support: "Hours gone, nothing kept.",
      }),
      Object.freeze({
        slot: "Photo 04",
        image: "room-04-kitchen-v2.webp",
        width: 1086,
        height: 1448,
        alt: "Two mugs remain on a kitchen table beside an empty chair pulled away in blue evening light.",
        heading: "Fine at work. Short at home.",
        support: "They pay for it first.",
      }),
    ]),
  }),
  meaning: Object.freeze({
    eyebrow: "What Blue Corner is",
    heading: "Not a clinic. A Corner.",
    body: "You're not broken. You've just been fighting without one.",
  }),
  roadmap: Object.freeze({
    eyebrow: "This is just the first bell",
    heading: "We start with therapy.",
    support: "The rest of the corner is on its way.",
    // One line of detail per service. A card holding a single word had to be
    // padded to 250px to look like a card at all; with a description under the
    // name the box is earned and sizes to its own content. "Nutrition &
    // wellness" shortens to "Nutrition" here because the detail line carries
    // what the second word was doing.
    items: Object.freeze([
      Object.freeze({ name: "Therapy", status: "Live at launch", detail: "Registered therapists, one-to-one." }),
      Object.freeze({ name: "Coaching", status: "Next", detail: "Habits, work, direction." }),
      Object.freeze({ name: "Nutrition", status: "Next", detail: "Food, sleep, training." }),
      Object.freeze({ name: "Diagnostics", status: "Next", detail: "Bloodwork and screening." }),
    ]),
  }),
  conversion: Object.freeze({
    eyebrow: "Get in before the first bell",
    heading: "Be first in the corner.",
    body: "Leave your details. Founding members hear from us the day we open.",
    member: Object.freeze({ heading: "Join the corner", button: "Save my spot", note: "We'll only use this to tell you when we launch. No spam, ever." }),
    fields: Object.freeze([
      Object.freeze({ name: "name", label: "Name", type: "text", inputmode: null, placeholder: "Your name" }),
      Object.freeze({ name: "email", label: "Email", type: "email", inputmode: "email", placeholder: "you@email.com" }),
      Object.freeze({ name: "phone", label: "Phone", type: "tel", inputmode: "tel", placeholder: "(000) 000 0000" }),
    ]),
    /* Express consent, unchecked by default. CASL requires it before a single
       launch email can go out to a Canadian address, and an implied-consent
       reading of "they typed their address in" does not survive contact with
       the fact that this is a health brand. The checker asserts it is present,
       required, and NOT pre-checked. */
    consent: Object.freeze({
      name: "consent",
      label: "Email me when The Blue Corner opens.",
    }),
    /* Bot trap. Not display:none — scrapers increasingly skip those — and
       aria-hidden + tabindex="-1" keep it away from assistive tech and the tab
       order, so no human ever reaches it. A filled value is answered with a
       normal success response so the bot learns nothing. */
    honeypot: Object.freeze({
      name: "website",
      label: "Leave this field empty",
    }),
  }),
  // The single navy crisis band closes the landing page. Someone in trouble
  // scans for a number, so the numbers are tap targets, not underlined links,
  // and the helpline is named so there is no doubt about who picks up.
  // The band no longer repeats "Nobody fights alone." — that line belongs to the
  // hero, and saying it five more times stretched every band by ~50px while
  // pushing the only thing worth finding fast into a corner.
  crisis: Object.freeze({
    label: "Need someone now",
    actions: Object.freeze([
      Object.freeze({ label: "Call 9-8-8", href: "tel:988", tone: "signal" }),
      Object.freeze({ label: "Text 9-8-8", href: "sms:988", tone: "signal" }),
      Object.freeze({ label: "9-1-1 if in danger", href: "tel:911", tone: "outline" }),
    ]),
    note: "Suicide Crisis Helpline · 24/7, free, across Canada.",
  }),
  footer: Object.freeze({
    name: "The Blue Corner",
    links: Object.freeze([
      Object.freeze({ label: "Crisis resources", href: "https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html", external: true }),
      Object.freeze({ label: "Therapists, join us", href: "#roadmap-title", external: false }),
      Object.freeze({ label: "Privacy", href: "privacy.html", external: false }),
    ]),
    legal: "© 2026 Blue Corner",
  }),
});

/* This page is load-bearing, not decoration. Until 2026-07-29 it promised that
   nothing left your device, which was true of the prototype form. The form now
   sends. Every sentence here was rewritten in the same change that turned it on
   — a privacy page describing a version of the site that no longer exists is
   worse than no privacy page at all. If the form changes again, this changes
   with it, in the same commit. */
export const privacyCopy = Object.freeze({
  title: "Privacy — The Blue Corner",
  heading: "Privacy",
  eyebrow: "What we do with the details you leave",
  lead: "One form, one purpose: to email you when we open. Nothing else, and nobody else.",
  sections: Object.freeze([
    Object.freeze({
      heading: "What the form collects",
      body: "Whether you are joining as a patient or a therapist, your name, your email address, your phone number, and your tick confirming we may email you. The form only sends when you tick that box, and it is never ticked for you. Nothing is collected anywhere else on this site.",
    }),
    Object.freeze({
      heading: "Where it goes",
      body: "Straight to The Blue Corner team as a single email, and nowhere else. It is not added to a mailing list, an advertising audience, or a customer database, and it is never sold or shared. That email, and the confirmation we send you, are delivered by Resend, our email provider, which processes them on servers in the United States. If delivery to us fails, your details are held in a private file on our server so your signup is not lost, and nothing else is kept.",
    }),
    Object.freeze({
      heading: "Analytics and cookies",
      body: "There are none. No analytics, no tag manager, no advertising pixels, no cookies, and no local or session storage. We do not track you across this site or any other.",
    }),
    Object.freeze({
      heading: "What loads from elsewhere",
      body: "One stylesheet and its font files load from Adobe Typekit at use.typekit.net, which is how the licensed brand typeface is served. Everything else — images, styles, and scripts — is served from this site.",
    }),
    Object.freeze({
      heading: "What you'll receive",
      body: "An email straight away confirming we have your details, then someone from The Blue Corner getting in touch personally to put you on the list, and a note on the day we open. No newsletter, and nothing from anybody else.",
    }),
    Object.freeze({
      heading: "Changing your mind",
      body: "Reply to either email and we will take you off the list and delete your details, with no questions and no delay. You can do that at any time, including before we launch.",
    }),
    Object.freeze({
      heading: "When we launch",
      body: "The live Blue Corner will collect and protect personal health information under Canadian privacy law, and it will publish its own fuller policy before anyone can book care. This page covers the coming-soon page and its one form.",
    }),
  ]),
  back: "Back to The Blue Corner",
});

/* The card carries no standing notice: the privacy page says it at length. The
   element stays because it is the form's only visible message surface — the
   per-field messages are screen-reader-only on desktop — so it renders empty,
   holds its reserved height, and paints only when there is something to say.
   Deleting it outright would leave a submit that visibly does nothing.

   It now carries TWO kinds of message: local validation errors (as before) and
   send failures. Reusing it for both is deliberate — a separate failure element
   would add a second reserved height to an already height-locked card, and the
   acceptance suite checks this card does not shift when messages appear. */
export const safetyCopy = Object.freeze({
  prototypeDisclosure: "",
  prototypeLoading: "Sending…",
  prototypeSuccessTitle: "You're in.",
  prototypeSuccessBody: "We've got your details. Someone will reach out to you personally to get you on the list.",
  /* Shown in the disclosure when the request fails. It must not imply the
     signup was saved — it wasn't — and it must invite a retry, because the
     fields stay filled and enabled on failure. */
  sendErrorMessage: "We couldn't send that just now. Please try again in a moment.",
});
