export const referenceHero = Object.freeze({
  // Recoloured from blue-corner-reference-ring.webp by tools/recolor-hero.mjs.
  // v4 carries the design-review change: the corner pad is --brand-blue, the
  // same blue as the wordmark, instead of --brand-navy.
  image: "blue-corner-reference-ring-brand-v4.webp",
  width: 1774,
  height: 887,
  alt: "An empty boxing-ring corner with yellow ropes, a bright blue corner pad, a black wall, a gray floor, and a black stool.",
  // Temporary lettered-chair fallback pending commissioned casting; this is
  // not the final hero photograph.
  temporaryCard: "HELP IS ON THE WAY",
});

export const sourceCopy = Object.freeze({
  header: Object.freeze({ name: "The Blue Corner" }),
  hero: Object.freeze({
    eyebrow: "Round one is coming",
    heading: "Nobody Fights Alone.",
    leadFirst: "Three in four suicides in Canada are men.",
    leadSecond: "Let that sit for a second.",
    body: "Most men fight this alone and in silence. Not for much longer — Canada's corner for men opens soon.",
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
      Object.freeze({ value: "~300%", label: "more young men now seeking gambling help" }),
    ]),
    source: "Sources: Statistics Canada · Public Health Agency of Canada · CMAJ · Cogent Mental Health.",
    gamblingSource: "Gambling figure: help-seeking among men aged 15 to 24 in Ontario after online betting was legalized in 2022 (CMAJ, 2026).",
  }),
  // Four rooms. Each item is a scene the reader recognises rather than a
  // category, and each photograph is deliberately empty so the viewer supplies
  // the man himself. `slot` and `brief` render the commissioning brief inside
  // the frame until the four shots are delivered.
  rooms: Object.freeze({
    eyebrow: "Depression in men rarely looks like depression",
    heading: "It looks like an ordinary week.",
    items: Object.freeze([
      Object.freeze({
        slot: "Photo 01",
        brief: Object.freeze(["unmade bed, phone lit,", "3am light"]),
        heading: "Wired at 3am. Flat by 9.",
        support: "No rest, no drive.",
      }),
      Object.freeze({
        slot: "Photo 02",
        brief: Object.freeze(["garage, cans lined up,", "TV glow"]),
        heading: "Numb is the only setting.",
        support: "Drink, bet, scroll, repeat.",
      }),
      Object.freeze({
        slot: "Photo 03",
        brief: Object.freeze(["desk at dusk, screen on,", "chair empty"]),
        heading: "Ten tabs. Nothing finished.",
        support: "Hours gone, nothing kept.",
      }),
      Object.freeze({
        slot: "Photo 04",
        brief: Object.freeze(["kitchen table, two mugs,", "one chair pushed back"]),
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
    items: Object.freeze([
      Object.freeze({ name: "Therapy", status: "Live at launch" }),
      Object.freeze({ name: "Coaching", status: "Next" }),
      Object.freeze({ name: "Nutrition & wellness", status: "Next" }),
      Object.freeze({ name: "Diagnostics", status: "Next" }),
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
  }),
  // The navy crisis band closes every screen. Someone in trouble scans for a
  // number, so the numbers are tap targets, not underlined links, and the
  // helpline is named so there is no doubt about who picks up.
  crisis: Object.freeze({
    line: "Nobody fights alone.",
    lineAccent: "alone.",
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

export const privacyCopy = Object.freeze({
  title: "Privacy — The Blue Corner",
  heading: "Privacy",
  eyebrow: "What this prototype does with your details",
  lead: "Nothing on this page is transmitted, stored, or added to a waitlist.",
  sections: Object.freeze([
    Object.freeze({
      heading: "The form",
      body: "The early-access form is a prototype. It validates in your browser and nothing more. There is no server, no database, and no third-party form service behind it. The page's Content-Security-Policy blocks outbound connections and form submissions outright, so the details you type cannot leave your device even by accident.",
    }),
    Object.freeze({
      heading: "Analytics and cookies",
      body: "There are none. No analytics, no tag manager, no advertising pixels, no cookies, and no local or session storage.",
    }),
    Object.freeze({
      heading: "What loads from elsewhere",
      body: "One stylesheet and its font files load from Adobe Typekit at use.typekit.net, which is how the licensed brand typeface is served. Everything else — images, styles, and scripts — is served from this site.",
    }),
    Object.freeze({
      heading: "When we launch",
      body: "The live Blue Corner will collect and protect personal health information under Canadian privacy law, and it will publish its own policy before anyone can sign up. This page covers the coming-soon prototype only.",
    }),
  ]),
  back: "Back to The Blue Corner",
});

export const safetyCopy = Object.freeze({
  prototypeDisclosure: "Prototype — use test details only. Nothing is transmitted or stored.",
  prototypeLoading: "Checking…",
  prototypeSuccessTitle: "Prototype complete.",
  prototypeSuccessBody: "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.",
});
