export const sourceCopy = Object.freeze({
  header: Object.freeze({
    name: "The Blue Corner",
  }),
  hero: Object.freeze({
    eyebrow: "Round one is coming",
    heading: "Nobody fights alone.",
    lead: "Three in four suicides in Canada are men. Let that sit for a second.",
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
      Object.freeze({
        heading: "No drive. No sleep.",
        body: "Waking up already tired of the day. Burnout that nobody clocks, carried quietly because saying it out loud still feels like losing.",
      }),
      Object.freeze({
        heading: "Numbing out to get through it.",
        body: "The drink. The doomscroll. The porn. The bet. Anything that turns the volume down for an hour.",
      }),
      Object.freeze({
        heading: "Focus gone. Brain rot.",
        body: "Work slipping. Can't lock in. Walking into a room and forgetting why you're standing there.",
      }),
      Object.freeze({
        heading: "The people closest to him paying for it.",
        body: "Distance from his partner and his kids. The heaviest thing he carries, and the one he'll never name.",
      }),
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
    member: Object.freeze({
      eyebrow: "For men",
      heading: "Join the corner",
      button: "Save my spot",
      note: "We'll only use this to tell you when we launch. No spam, ever.",
    }),
    fields: Object.freeze([
      Object.freeze({ name: "name", label: "Name", type: "text", inputmode: null, autocomplete: "name", placeholder: "Your name" }),
      Object.freeze({ name: "email", label: "Email", type: "email", inputmode: "email", autocomplete: "email", placeholder: "you@email.com" }),
      Object.freeze({ name: "phone", label: "Phone", type: "tel", inputmode: "tel", autocomplete: "tel", placeholder: "(000) 000 0000" }),
    ]),
  }),
  footer: Object.freeze({
    promise: "Nobody fights alone. In your corner, every round.",
    name: "The Blue Corner",
    category: "Men's mental health · Canada",
    domain: "thebluecorner.ca",
  }),
});

export const conceptAdditions = Object.freeze({
  openingLines: Object.freeze({
    title: "No perfect words needed",
    intro: "Starting can be the hardest part. Any one of these is enough to open the door.",
    items: Object.freeze([
      "I haven't felt like myself lately.",
      "I don't know where to start, but I know something needs to change.",
      "Can we talk for ten minutes? I could use someone in my corner.",
    ]),
  }),
  firstTenMinutes: Object.freeze({
    title: "The first ten minutes",
    intro: "A first conversation can stay simple. You set the pace, and nothing needs to come out in perfect order.",
    items: Object.freeze([
      "Arrive as you are. There is no story to prepare.",
      "Say what feels okay to cover and what can wait.",
      "Start with the one thing that feels hardest to carry today.",
      "Before you leave, ask what the next step could be and decide whether it feels right for you.",
    ]),
  }),
  cornerStandard: Object.freeze({
    title: "The Corner Standard",
    intro: "Trust should be visible before a member shares anything personal. These are the basics Blue Corner expects.",
    items: Object.freeze([
      "Registered, insured, and in good standing with the relevant provincial regulator.",
      "Experienced in supporting men's mental health without stereotypes, shame, or pressure.",
      "Clear about scope, confidentiality, fees, and available next steps before care begins.",
      "Trauma-informed, culturally humble, and led by the member's consent.",
      "Open to a fit check that leaves the member free to say no.",
    ]),
  }),
  betweenRoundPlan: Object.freeze({
    title: "Between-round plan",
    intro: "A private take-home plan could keep the next step visible without turning progress into a promise or a deadline.",
    items: Object.freeze([
      "The one priority you chose to focus on.",
      "People, services, or resources you want close at hand.",
      "A small action that feels realistic to you.",
      "Signs that would tell you to reach out for more support.",
      "Crisis contacts kept visible if safety becomes urgent.",
    ]),
  }),
  trustedPerson: Object.freeze({
    title: "Bring someone into your corner",
    intro: "Support from a trusted person is optional. You decide who is involved, what they know, and what help looks like.",
    items: Object.freeze([
      "Choose who, if anyone, you want involved.",
      "Agree on what may be shared before anyone is contacted.",
      "Choose the role: listen, join a conversation, or help with one practical next step.",
      "Change your mind or withdraw consent at any time.",
    ]),
  }),
});

export const safetyCopy = Object.freeze({
  utility: "Need support right now? Call or text 9-8-8. If you are in immediate danger, call 9-1-1.",
  call: "Call 9-8-8",
  text: "Text 9-8-8",
  resources: "Crisis resources",
  footer: "Blue Corner is not an emergency service. Call or text 9-8-8 for suicide crisis support. Call 9-1-1 for immediate danger.",
  prototype: "Design-review prototype only—details are validated locally and are never sent or stored.",
  editorialReview: "Designer review only — the 85%, #1 and ~300% figures require source verification before production.",
  prototypeDisclosure: "Prototype — use test details only. Nothing is transmitted or stored.",
  prototypeLoading: "Checking…",
  prototypeSuccessTitle: "Prototype complete.",
  prototypeSuccessBody: "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.",
});
