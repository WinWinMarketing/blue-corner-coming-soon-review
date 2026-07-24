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
    type: "sentence-starter",
    title: "No perfect words needed",
    intro: "Starting can be the hardest part. Any one of these is enough to open the door.",
    starters: Object.freeze([
      "I haven't felt like myself lately.",
      "I don't know where to start, but I know something needs to change.",
      "Can we talk for ten minutes? I could use someone in my corner.",
    ]),
    fallback: "JavaScript is optional. Choose a starter, then copy or adapt it manually in any notes app you trust.",
  }),
  firstTenMinutes: Object.freeze({
    type: "first-ten-minutes",
    title: "The first ten minutes",
    intro: "A first conversation can stay simple. You set the pace, and nothing needs to come out in perfect order.",
    steps: Object.freeze([
      Object.freeze({ minute: "0", heading: "Arrive as you are", body: "There is no story to prepare and no right place to begin." }),
      Object.freeze({ minute: "2", heading: "Set the pace", body: "Say what feels okay to cover and what can wait." }),
      Object.freeze({ minute: "5", heading: "Name one thing", body: "Start with the one thing that feels hardest to carry today." }),
      Object.freeze({ minute: "10", heading: "Choose what comes next", body: "Ask what a next step could be, then decide whether it feels right for you." }),
    ]),
    fallback: "JavaScript is optional. The complete 0, 2, 5, and 10-minute outline is already shown below for reading or manual copying.",
  }),
  cornerStandard: Object.freeze({
    type: "corner-standard",
    title: "The Corner Standard",
    intro: "Trust should be visible before a member shares anything personal. These are the basics Blue Corner expects.",
    standards: Object.freeze([
      Object.freeze({
        standard: "Registered, insured, and in good standing",
        evidence: "A current public registry entry and professional-liability coverage.",
        verifier: "Check the relevant provincial regulator's public register.",
        verification: "Not yet verified in this design-review prototype.",
      }),
      Object.freeze({
        standard: "Experienced without stereotypes or shame",
        evidence: "Relevant training and examples of supporting men's mental health without forcing one idea of masculinity.",
        verifier: "Ask the therapist how their experience applies to the support you want.",
        verification: "Not yet verified in this design-review prototype.",
      }),
      Object.freeze({
        standard: "Clear about scope, privacy, fees, and next steps",
        evidence: "Plain-language intake information available before care begins.",
        verifier: "Review the therapist's written policies and ask questions before agreeing.",
        verification: "Not yet verified in this design-review prototype.",
      }),
      Object.freeze({
        standard: "Trauma-informed, culturally humble, and consent-led",
        evidence: "A clear explanation of choice, boundaries, and how consent can change during care.",
        verifier: "Ask how the therapist handles consent, identity, culture, and difficult disclosures.",
        verification: "Not yet verified in this design-review prototype.",
      }),
      Object.freeze({
        standard: "Open to a fit check and a member's no",
        evidence: "A fit conversation that does not pressure a member to continue.",
        verifier: "Ask what happens when the fit does not feel right or a referral is needed.",
        verification: "Not yet verified in this design-review prototype.",
      }),
    ]),
    fallback: "JavaScript is optional. Open any standard to read its evidence, verifier, and current verification note.",
  }),
  betweenRoundPlan: Object.freeze({
    type: "between-round-plan",
    title: "Between-round plan",
    intro: "A private take-home plan could keep the next step visible without turning progress into a promise or a deadline.",
    prompts: Object.freeze([
      Object.freeze({ key: "priority", label: "Priority", hint: "The one thing you want to keep in view.", maxLength: 160 }),
      Object.freeze({ key: "support", label: "Support or resource", hint: "A person, service, or resource you want close at hand.", maxLength: 180 }),
      Object.freeze({ key: "action", label: "Realistic action", hint: "One small step that feels possible to you.", maxLength: 160 }),
      Object.freeze({ key: "warning", label: "Warning sign", hint: "A sign that would tell you to reach out for more support.", maxLength: 180 }),
    ]),
    safety: "Keep crisis contacts visible if safety becomes urgent. Call or text 9-8-8 in Canada; call 9-1-1 for immediate danger.",
    fallback: "JavaScript is optional. Use the four prompts as a private written outline; generating, copying, and printing require JavaScript.",
  }),
  trustedPerson: Object.freeze({
    type: "consent-invite",
    title: "Bring someone into your corner",
    intro: "Support from a trusted person is optional. You decide who is involved, what they know, and what help looks like.",
    roles: Object.freeze([
      "a friend",
      "my partner",
      "a family member",
      "another person I trust",
    ]),
    boundaries: Object.freeze([
      "that I'm looking for support, without details",
      "the parts I choose in the moment",
      "only what I write in this invitation",
    ]),
    help: Object.freeze([
      "listen without trying to fix it",
      "check in after I ask",
      "help me take one practical next step",
    ]),
    fallback: "JavaScript is optional. Use the role, sharing-boundary, and requested-help choices below to draft an invitation manually. Nothing sends.",
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
