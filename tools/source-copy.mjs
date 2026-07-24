export const referenceHero = Object.freeze({
  image: "blue-corner-reference-ring.webp",
  width: 1774,
  height: 887,
  alt: "An empty black boxing-ring corner with white ropes and a single wooden stool.",
});

export const sourceCopy = Object.freeze({
  header: Object.freeze({ name: "The Blue Corner" }),
  hero: Object.freeze({
    eyebrow: "Round one is coming",
    heading: "Nobody Fights Alone.",
    leadFirst: "Three in four suicides in Canada are men.",
    leadSecond: "Let that sit for a second.",
    body: "The crisis isn't loud. It hides in plain sight. The guy who looks fine, says \"good\" when you ask, and is quietly running on empty. Canada's corner for men is about to open.",
    memberCta: "Get early access",
    therapistCta: "Therapists, join us",
  }),
  stats: Object.freeze({
    eyebrow: "The crisis we've agreed to whisper about",
    heading: "It isn't just bad. It's getting worse.",
    items: Object.freeze([
      Object.freeze({ value: "85%", label: "of working men have hit burnout" }),
      Object.freeze({ value: "2×", label: "anxiety disorders have doubled in a decade" }),
      Object.freeze({ value: "#1", label: "cause of death for men aged 20 to 49 is overdose" }),
      Object.freeze({ value: "~300%", label: "more young men seeking gambling help since legalization" }),
    ]),
    source: "Sources: Statistics Canada · Public Health Agency of Canada · CMAJ · Cogent Mental Health.",
    gamblingSource: "Gambling figure: help-seeking among men aged 15 to 24 in Ontario after online betting was legalized in 2022 (CMAJ, 2026).",
  }),
  symptoms: Object.freeze({
    eyebrow: "It doesn't always look like what you'd expect",
    heading: "It looks like this.",
    items: Object.freeze([
      Object.freeze({ heading: "No drive. No sleep.", body: "Waking up already tired of the day. Burnout that nobody clocks, carried quietly because saying it out loud still feels like losing." }),
      Object.freeze({ heading: "Numbing out to get through it.", body: "The drink. The doomscroll. The porn. The bet. Anything that turns the volume down for an hour." }),
      Object.freeze({ heading: "Focus gone. Brain rot.", body: "Work slipping. Can't lock in. Walking into a room and forgetting why you're standing there." }),
      Object.freeze({ heading: "The people closest to him paying for it.", body: "Distance from his partner and his kids. The heaviest thing he carries, and the one he'll never name." }),
    ]),
  }),
  meaning: Object.freeze({
    eyebrow: "What Blue Corner is",
    heading: "Not a clinic. A corner.",
    body: "In boxing, the underdog fights out of the blue corner. It's where his people wait between rounds, patch him up, and tell him he's still in it. That's what this is. Real people who've been there, in your corner for the guy who never asks. You're not broken. You've just been fighting without a corner.",
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
  footer: Object.freeze({ name: "The Blue Corner" }),
});

export const safetyCopy = Object.freeze({
  prototypeDisclosure: "Prototype — use test details only. Nothing is transmitted or stored.",
  prototypeLoading: "Checking…",
  prototypeSuccessTitle: "Prototype complete.",
  prototypeSuccessBody: "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.",
});
