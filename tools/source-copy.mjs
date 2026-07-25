export const referenceHero = Object.freeze({
  // Recoloured from blue-corner-reference-ring.webp by tools/recolor-hero.mjs.
  image: "blue-corner-reference-ring-brand-v3.webp",
  width: 1774,
  height: 887,
  alt: "An empty boxing-ring corner with yellow ropes, a bright-blue padded corner post, a black stool, and a deep blue backdrop.",
});

export const sourceCopy = Object.freeze({
  header: Object.freeze({ name: "The Blue Corner" }),
  hero: Object.freeze({
    eyebrow: "Round one is coming",
    heading: "Nobody Fights Alone.",
    leadFirst: "Three in four suicides in Canada are men.",
    leadSecond: "Let that sit for a second.",
    body: "The crisis isn't loud. It hides in plain sight. Canada's corner for men is about to open.",
    memberCta: "Get early access",
    therapistCta: "Therapists, join us",
  }),
  stats: Object.freeze({
    eyebrow: "The crisis we've agreed to whisper about",
    heading: "It isn't just bad. It's getting worse.",
    items: Object.freeze([
      Object.freeze({ value: "85%", label: "of working men have already hit burnout" }),
      Object.freeze({ value: "2×", label: "anxiety disorders have doubled in a decade" }),
      Object.freeze({ value: "#1", label: "cause of death for men 20 to 49 is overdose" }),
      Object.freeze({ value: "~300%", label: "more young men now seeking gambling help" }),
    ]),
    source: "Sources: Statistics Canada · Public Health Agency of Canada · CMAJ · Cogent Mental Health.",
    gamblingSource: "Gambling figure: help-seeking among men aged 15 to 24 in Ontario after online betting was legalized in 2022 (CMAJ, 2026).",
  }),
  symptoms: Object.freeze({
    eyebrow: "It doesn't always look like what you'd expect",
    heading: "It looks like this.",
    items: Object.freeze([
      Object.freeze({ heading: "No drive. No sleep." }),
      Object.freeze({ heading: "Numbing out to get through it." }),
      Object.freeze({ heading: "Focus gone. Brain rot." }),
      Object.freeze({ heading: "The people closest to him paying for it." }),
    ]),
  }),
  meaning: Object.freeze({
    eyebrow: "What Blue Corner is",
    heading: "Not a clinic. A Corner.",
    bodyFirst: "The blue corner is where the underdog's people patch him up between rounds and tell him he's still in it. That's what this is.",
    bodySecond: "Real people who've been there, in your corner—because you're not broken. You've just been fighting without one.",
  }),
  roadmap: Object.freeze({
    eyebrow: "This is just the first bell",
    heading: "We start with therapy. The rest of the corner is on its way.",
    items: Object.freeze([
      Object.freeze({ name: "Therapy", status: "First" }),
      Object.freeze({ name: "Coaching", status: "Soon" }),
      Object.freeze({ name: "Nutrition", status: "Soon" }),
      Object.freeze({ name: "IV Wellness", status: "Soon" }),
      Object.freeze({ name: "Diagnostics", status: "Soon" }),
    ]),
  }),
  conversion: Object.freeze({
    eyebrow: "Get in before the first bell",
    heading: "Be one of the first in the corner.",
    body: "Founding members get in ahead of everyone. Leave your details and we'll reach out the moment we open.",
    member: Object.freeze({ eyebrow: "For men", heading: "Join the corner", button: "Save my spot", note: "We'll only use this to tell you when we launch. No spam, ever." }),
    fields: Object.freeze([
      Object.freeze({ name: "name", label: "Name", type: "text", inputmode: null, placeholder: "Your name" }),
      Object.freeze({ name: "email", label: "Email", type: "email", inputmode: "email", placeholder: "you@email.com" }),
      Object.freeze({ name: "phone", label: "Phone", type: "tel", inputmode: "tel", placeholder: "(000) 000 0000" }),
    ]),
  }),
  footer: Object.freeze({ name: "The Blue Corner", line: "Nobody fights alone." }),
});

export const safetyCopy = Object.freeze({
  prototypeDisclosure: "Prototype — use test details only. Nothing is transmitted or stored.",
  prototypeLoading: "Checking…",
  prototypeSuccessTitle: "Prototype complete.",
  prototypeSuccessBody: "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.",
});
