import { referenceHero } from "./concepts.mjs";
import { conceptAdditions, sourceCopy, safetyCopy } from "./source-copy.mjs";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const renderCrisisUtility = () => `
    <div class="crisis-bar page-frame" role="region" aria-label="Immediate support">
      <p class="crisis-bar__message">${escapeHtml(safetyCopy.utility)}</p>
      <div class="crisis-bar__links">
        <a href="tel:988">${escapeHtml(safetyCopy.call)}</a>
        <a href="sms:988">${escapeHtml(safetyCopy.text)}</a>
        <a href="https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html" target="_blank" rel="noopener noreferrer">${escapeHtml(safetyCopy.resources)}</a>
      </div>
    </div>`;

const renderFields = (audience) => sourceCopy.conversion.fields.map((field) => {
  const id = `${audience}-${field.name}`;
  const inputmode = field.inputmode ? ` inputmode="${escapeHtml(field.inputmode)}"` : "";
  return `
                    <div class="field">
                      <label for="${id}">${escapeHtml(field.label)}</label>
                      <input id="${id}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type)}"${inputmode} autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" required aria-describedby="${id}-error">
                      <p class="field-error" id="${id}-error" data-field-error="${escapeHtml(field.name)}" aria-live="polite"></p>
                    </div>`;
}).join("");

const renderMemberForm = (copy) => {
  const audience = "member";
  const disclosureId = "member-prototype-disclosure";
  return `
            <article class="conversion-path conversion-path--${audience}" id="${audience}-form" data-reveal>
              <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
              <h3>${escapeHtml(copy.heading)}</h3>
              <p class="prototype-disclosure" id="${disclosureId}">${escapeHtml(safetyCopy.prototypeDisclosure)}</p>
              <form class="prototype-form" data-prototype-form data-audience="${audience}" data-loading-label="${escapeHtml(safetyCopy.prototypeLoading)}" data-success-title="${escapeHtml(safetyCopy.prototypeSuccessTitle)}" data-success-body="${escapeHtml(safetyCopy.prototypeSuccessBody)}" method="post" autocomplete="off" aria-describedby="${disclosureId}" novalidate>
                <fieldset data-form-fields>
                  <legend class="sr-only">Men's early-access interest</legend>
                  <fieldset class="prototype-role" data-role-group>
                    <legend>I'm joining as</legend>
                    <div class="prototype-role__choices">
                      <label class="prototype-role__choice" for="${audience}-role-patient">
                        <input id="${audience}-role-patient" name="role" type="radio" value="Patient" autocomplete="off" required aria-describedby="${audience}-role-error">
                        <span>Patient</span>
                      </label>
                      <label class="prototype-role__choice" for="${audience}-role-therapist">
                        <input id="${audience}-role-therapist" name="role" type="radio" value="Therapist" autocomplete="off" required aria-describedby="${audience}-role-error">
                        <span>Therapist</span>
                      </label>
                    </div>
                    <p class="field-error" id="${audience}-role-error" data-role-error aria-live="polite"></p>
                  </fieldset>
                  <div class="field-grid">${renderFields(audience)}
                  </div>
                  <button class="button button--signal" type="submit" data-submit>${escapeHtml(copy.button)}</button>
                  <p class="conversion-path__note">${escapeHtml(copy.note)}</p>
                </fieldset>
                <div class="form-status" data-form-status tabindex="-1" role="status" aria-live="polite" aria-atomic="true" hidden>
                  <h4 data-status-title></h4>
                  <p data-status-body></p>
                </div>
              </form>
            </article>`;
};

const renderChoiceGroup = ({ legend, name, values }) => {
  const choices = values.map((value, index) => {
    const id = `${name}-${index + 1}`;
    return `
                  <label class="concept-addition__choice" for="${id}">
                    <input id="${id}" name="${escapeHtml(name)}" type="radio" value="${escapeHtml(value)}" autocomplete="off">
                    <span>${escapeHtml(value)}</span>
                  </label>`;
  }).join("");
  return `
              <fieldset class="concept-addition__fieldset">
                <legend>${escapeHtml(legend)}</legend>
                <div class="concept-addition__choices">${choices}
                </div>
              </fieldset>`;
};

const renderCheckboxList = ({ name, values, dataAttribute }) => values.map((value, index) => {
  const id = `${name}-${index + 1}`;
  const dataHook = dataAttribute ? ` ${dataAttribute}` : "";
  return `
                  <label class="concept-addition__choice" for="${id}">
                    <input id="${id}" name="${escapeHtml(name)}" type="checkbox" value="${escapeHtml(value)}" autocomplete="off"${dataHook}>
                    <span>${escapeHtml(value)}</span>
                  </label>`;
}).join("");

const renderSentenceStarter = (addition) => {
  const choices = addition.starters.map((starter, index) => {
    const id = `sentence-starter-${index + 1}`;
    return `
                  <label class="concept-addition__choice" for="${id}">
                    <input id="${id}" name="sentence-starter" type="radio" value="${escapeHtml(starter)}" autocomplete="off">
                    <span>${escapeHtml(starter)}</span>
                  </label>`;
  }).join("");
  return `
          <form class="concept-addition__workspace" data-sentence-form>
            <fieldset class="concept-addition__fieldset">
              <legend>Choose a sentence starter</legend>
              <div class="concept-addition__choices">${choices}
              </div>
            </fieldset>
            <div class="concept-addition__field">
              <label for="sentence-editor">Your line</label>
              <p id="sentence-editor-hint">Edit the starter, or write your own. Nothing is sent or stored.</p>
              <textarea id="sentence-editor" data-sentence-editor maxlength="240" rows="4" autocomplete="off" aria-describedby="sentence-editor-hint"></textarea>
            </div>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="copy" disabled>Copy line</button>
              <button class="button button--ghost" type="reset">Reset</button>
            </div>
            <p class="concept-addition__warning">Copying puts this line on your device clipboard, where other apps may be able to read it.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose a starter or write your own line.</p>
          </form>`;
};

const renderFirstTenMinutes = (addition) => {
  const steps = addition.steps.map((step) => `
              <li class="concept-addition__timeline-step" data-step data-minute="${escapeHtml(step.minute)}">
                <span class="concept-addition__minute">Minute ${escapeHtml(step.minute)}</span>
                <div>
                  <h3>${escapeHtml(step.heading)}</h3>
                  <p>${escapeHtml(step.body)}</p>
                </div>
              </li>`).join("");
  return `
          <div class="concept-addition__workspace" data-timeline>
            <ol class="concept-addition__timeline">${steps}
            </ol>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="next">Show next step</button>
              <button class="button button--ghost" type="button" data-action="show-all">Show all</button>
              <button class="button button--ghost" type="button" data-action="copy">Copy outline</button>
              <button class="button button--ghost" type="button" data-action="reset" disabled>Reset</button>
            </div>
            <div class="concept-addition__field" data-copy-fallback hidden>
              <label for="timeline-copy-fallback">Copy the outline manually</label>
              <textarea id="timeline-copy-fallback" rows="8" autocomplete="off" readonly></textarea>
            </div>
            <p class="concept-addition__warning">Copying puts this outline on your device clipboard, where other apps may be able to read it.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Start at minute 0, or show the complete outline.</p>
          </div>`;
};

const renderCornerStandard = (addition) => {
  const standards = addition.standards.map((item, index) => {
    const reviewId = `corner-standard-review-${index + 1}`;
    return `
              <details class="concept-addition__standard">
                <summary>${escapeHtml(item.standard)}</summary>
                <dl>
                  <div>
                    <dt>Evidence to look for</dt>
                    <dd>${escapeHtml(item.evidence)}</dd>
                  </div>
                  <div>
                    <dt>How to verify it</dt>
                    <dd>${escapeHtml(item.verifier)}</dd>
                  </div>
                  <div>
                    <dt>Current verification</dt>
                    <dd>${escapeHtml(item.verification)}</dd>
                  </div>
                </dl>
                <label class="concept-addition__review" for="${reviewId}">
                  <input id="${reviewId}" type="checkbox" data-review-check autocomplete="off">
                  <span>Reviewed here</span>
                </label>
              </details>`;
  }).join("");
  return `
          <div class="concept-addition__workspace" data-corner-standard>
            <div class="concept-addition__standards">${standards}
            </div>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--ghost" type="button" data-action="clear-review" disabled>Clear reviewed indicators</button>
            </div>
            <p class="concept-addition__warning">“Reviewed here” is a local reading aid, not a credential check or certification. It is not saved.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">0 of ${addition.standards.length} standards reviewed here.</p>
          </div>`;
};

const renderBetweenRoundPlan = (addition) => {
  const fields = addition.prompts.map((prompt) => `
              <div class="concept-addition__field">
                <label for="plan-${escapeHtml(prompt.key)}">${escapeHtml(prompt.label)}</label>
                <p id="plan-${escapeHtml(prompt.key)}-hint">${escapeHtml(prompt.hint)} Maximum ${escapeHtml(prompt.maxLength)} characters.</p>
                <textarea id="plan-${escapeHtml(prompt.key)}" name="${escapeHtml(prompt.key)}" rows="3" maxlength="${escapeHtml(prompt.maxLength)}" autocomplete="off" aria-describedby="plan-${escapeHtml(prompt.key)}-hint"></textarea>
              </div>`).join("");
  const preview = addition.prompts.map((prompt) => `
                <div data-preview-row="${escapeHtml(prompt.key)}" hidden>
                  <dt>${escapeHtml(prompt.label)}</dt>
                  <dd data-preview-value="${escapeHtml(prompt.key)}"></dd>
                </div>`).join("");
  return `
          <form class="concept-addition__workspace" data-plan-form>${fields}
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="generate">Build preview</button>
              <button class="button button--ghost" type="button" data-action="copy" disabled>Copy plan</button>
              <button class="button button--ghost" type="button" data-action="print" disabled>Print</button>
              <button class="button button--ghost" type="reset">Clear</button>
            </div>
            <div class="concept-addition__preview" data-plan-preview role="region" aria-labelledby="plan-preview-title" hidden>
              <p class="concept-addition__print-label">Blue Corner · Local plan</p>
              <h3 id="plan-preview-title">Your between-round plan</h3>
              <dl>${preview}
              </dl>
              <p class="concept-addition__print-disclosure">Printing may create a PDF, an operating-system print-spool file, or a physical copy. Handle or delete copies according to your needs.</p>
            </div>
            <div class="concept-addition__field" data-copy-fallback hidden>
              <label for="plan-copy-fallback">Copy the plan manually</label>
              <textarea id="plan-copy-fallback" rows="10" autocomplete="off" readonly></textarea>
            </div>
            <p class="concept-addition__safety">${escapeHtml(addition.safety)}</p>
            <p class="concept-addition__warning">Until you choose Copy or Print, this plan stays in this page and is not saved or sent. Copying puts it on your device clipboard; printing may create a PDF, an operating-system spool file, or a physical copy.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Complete any prompt to build a partial or complete preview.</p>
          </form>`;
};

const renderConsentInvite = (addition) => `
          <form class="concept-addition__workspace" data-consent-form>
${renderChoiceGroup({ legend: "Who do you want to invite?", name: "consent-role", values: addition.roles })}
${renderChoiceGroup({ legend: "What can they know?", name: "consent-boundary", values: addition.boundaries })}
${renderChoiceGroup({ legend: "What would help?", name: "consent-help", values: addition.help })}
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="generate" disabled>Draft invitation</button>
              <button class="button button--ghost" type="reset">Reset</button>
            </div>
            <div class="concept-addition__preview" data-invite-preview hidden>
              <div class="concept-addition__field">
                <label for="consent-invite-editor">Your invitation</label>
                <p id="consent-invite-hint">Edit this before sharing it yourself. Nothing sends from this page.</p>
                <textarea id="consent-invite-editor" data-invite-editor rows="7" maxlength="600" autocomplete="off" aria-describedby="consent-invite-hint"></textarea>
              </div>
              <button class="button button--ghost" type="button" data-action="copy" disabled>Copy invitation</button>
            </div>
            <p class="concept-addition__warning">Nothing sends from this page. Copying puts the invitation on your device clipboard, where other apps may be able to read it.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose one option in each group to draft an invitation.</p>
          </form>`;

const renderReadinessCheck = (addition) => {
  const prompts = addition.prompts.map((prompt) => renderChoiceGroup({
    legend: prompt.legend,
    name: `readiness-${prompt.key}`,
    values: prompt.options,
  })).join("");
  return `
          <form class="concept-addition__workspace" data-readiness-form>${prompts}
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="review" disabled>Review my choices</button>
              <button class="button button--ghost" type="reset">Clear</button>
            </div>
            <div class="concept-addition__preview" data-readiness-preview hidden>
              <h3>Your private reflection</h3>
              <ul data-readiness-summary></ul>
              <p>No score or diagnosis is created.</p>
            </div>
            <p class="concept-addition__warning">${escapeHtml(addition.note)}</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose any answer to begin. There is no preferred result.</p>
          </form>`;
};

const renderResetCard = (addition) => {
  const steps = addition.steps.map((step, index) => `
              <li class="concept-addition__reset-step" data-reset-step>
                <span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>${escapeHtml(step.heading)}</h3>
                  <p>${escapeHtml(step.body)}</p>
                </div>
              </li>`).join("");
  return `
          <div class="concept-addition__workspace" data-reset-card>
            <ol class="concept-addition__reset-list">${steps}
            </ol>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="next">Start the reset</button>
              <button class="button button--ghost" type="button" data-action="show-all">Show all steps</button>
              <button class="button button--ghost" type="button" data-action="reset" disabled>Reset</button>
            </div>
            <p class="concept-addition__warning">${escapeHtml(addition.note)}</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">All three steps are available. Start when you want.</p>
          </div>`;
};

const renderSupportRequest = (addition) => `
          <form class="concept-addition__workspace" data-support-form>
${renderChoiceGroup({ legend: "Who do you want to ask?", name: "support-person", values: addition.people })}
${renderChoiceGroup({ legend: "What would help?", name: "support-ask", values: addition.asks })}
            <div class="concept-addition__field">
              <label for="support-detail">Optional detail</label>
              <p id="support-detail-hint">Add a time, place, or boundary if it would make the ask clearer.</p>
              <textarea id="support-detail" data-support-detail rows="3" maxlength="240" autocomplete="off" aria-describedby="support-detail-hint"></textarea>
            </div>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="generate" disabled>Draft request</button>
              <button class="button button--ghost" type="reset">Reset</button>
            </div>
            <div class="concept-addition__preview" data-support-preview hidden>
              <div class="concept-addition__field">
                <label for="support-request-editor">Your request</label>
                <p id="support-request-hint">Edit it before sharing it yourself. Nothing sends from this page.</p>
                <textarea id="support-request-editor" data-support-editor rows="6" maxlength="600" autocomplete="off" aria-describedby="support-request-hint"></textarea>
              </div>
              <button class="button button--ghost" type="button" data-action="copy" disabled>Copy request</button>
            </div>
            <p class="concept-addition__warning">Nothing is sent or saved. Copying puts the request on your device clipboard.</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose a person and a specific ask to draft a request.</p>
          </form>`;

const renderWorkdayBoundary = (addition) => `
          <form class="concept-addition__workspace" data-workday-form>
${renderChoiceGroup({ legend: "Where is the boundary needed?", name: "workday-context", values: addition.contexts })}
${renderChoiceGroup({ legend: "Choose a starting line", name: "workday-boundary", values: addition.boundaries })}
            <div class="concept-addition__field">
              <label for="workday-detail">Optional detail</label>
              <p id="workday-detail-hint">Add a time or practical next step without sharing more than you want.</p>
              <textarea id="workday-detail" data-workday-detail rows="3" maxlength="240" autocomplete="off" aria-describedby="workday-detail-hint"></textarea>
            </div>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="generate" disabled>Draft boundary</button>
              <button class="button button--ghost" type="reset">Reset</button>
            </div>
            <div class="concept-addition__preview" data-workday-preview hidden>
              <div class="concept-addition__field">
                <label for="workday-boundary-editor">Your boundary</label>
                <p id="workday-boundary-hint">Edit it to fit your workplace and share it yourself.</p>
                <textarea id="workday-boundary-editor" data-workday-editor rows="6" maxlength="600" autocomplete="off" aria-describedby="workday-boundary-hint"></textarea>
              </div>
              <button class="button button--ghost" type="button" data-action="copy" disabled>Copy boundary</button>
            </div>
            <p class="concept-addition__warning">${escapeHtml(addition.note)}</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose a context and starting line to draft a boundary.</p>
          </form>`;

const renderBodySignal = (addition) => `
          <form class="concept-addition__workspace" data-body-form>
            <fieldset class="concept-addition__fieldset">
              <legend>What do you notice?</legend>
              <div class="concept-addition__choices">${renderCheckboxList({ name: "body-signal", values: addition.signals, dataAttribute: "data-body-signal" })}
              </div>
            </fieldset>
            <fieldset class="concept-addition__fieldset">
              <legend>What response might help?</legend>
              <div class="concept-addition__choices">${renderCheckboxList({ name: "body-response", values: addition.responses, dataAttribute: "data-body-response" })}
              </div>
            </fieldset>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="review" disabled>Review check-in</button>
              <button class="button button--ghost" type="reset">Clear</button>
            </div>
            <div class="concept-addition__preview" data-body-preview hidden>
              <h3>Your check-in, not a diagnosis</h3>
              <p data-body-output></p>
            </div>
            <p class="concept-addition__warning">${escapeHtml(addition.note)}</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Choose a signal and a possible response to review the check-in.</p>
          </form>`;

const renderBookingQuestions = (addition) => `
          <form class="concept-addition__workspace" data-booking-form>
            <fieldset class="concept-addition__fieldset">
              <legend>Select questions to keep</legend>
              <div class="concept-addition__choices">${renderCheckboxList({ name: "booking-question", values: addition.questions, dataAttribute: "data-booking-question" })}
              </div>
            </fieldset>
            <div class="concept-addition__controls" data-js-controls hidden>
              <button class="button button--signal" type="button" data-action="copy" disabled>Copy selected questions</button>
              <button class="button button--ghost" type="button" data-action="select-all">Select all</button>
              <button class="button button--ghost" type="reset">Clear</button>
            </div>
            <div class="concept-addition__field" data-copy-fallback hidden>
              <label for="booking-copy-fallback">Copy the questions manually</label>
              <textarea id="booking-copy-fallback" rows="10" autocomplete="off" readonly></textarea>
            </div>
            <p class="concept-addition__warning">${escapeHtml(addition.note)}</p>
            <p class="concept-addition__status" data-module-status role="status" aria-live="polite">Select one or more questions to copy.</p>
          </form>`;

const additionRenderers = Object.freeze({
  "sentence-starter": renderSentenceStarter,
  "first-ten-minutes": renderFirstTenMinutes,
  "corner-standard": renderCornerStandard,
  "between-round-plan": renderBetweenRoundPlan,
  "consent-invite": renderConsentInvite,
  "readiness-check": renderReadinessCheck,
  "reset-card": renderResetCard,
  "support-request": renderSupportRequest,
  "workday-boundary": renderWorkdayBoundary,
  "body-signal": renderBodySignal,
  "booking-questions": renderBookingQuestions,
});

const renderConceptAddition = (concept) => {
  if (!concept.additionKey) return "";
  const addition = conceptAdditions[concept.additionKey];
  if (!addition) throw new Error(`Unknown concept addition: ${concept.additionKey}`);
  const renderModule = additionRenderers[addition.type];
  if (!renderModule) throw new Error(`Unknown concept addition type: ${addition.type}`);
  return `
      <section class="concept-addition" data-module="${escapeHtml(addition.type)}" data-state="idle" aria-labelledby="concept-addition-title">
        <div class="concept-addition__inner page-frame">
          <header class="concept-addition__heading" data-reveal>
            <p class="eyebrow">Concept add-on</p>
            <h2 id="concept-addition-title">${escapeHtml(addition.title)}</h2>
            <p>${escapeHtml(addition.intro)}</p>
          </header>
${renderModule(addition)}
          <noscript>
            <p class="concept-addition__fallback">${escapeHtml(addition.fallback)}</p>
          </noscript>
        </div>
      </section>
`;
};

export const renderConceptPage = (concept) => {
  const stats = sourceCopy.stats.items.map((item) => `
            <article class="stat">
              <strong class="stat__value">${escapeHtml(item.value)}</strong>
              <p>${escapeHtml(item.label)}</p>
            </article>`).join("");
  const symptoms = sourceCopy.symptoms.items.map((item, index) => `
            <article class="symptom" data-reveal>
              <span class="symptom__number" aria-hidden="true">0${index + 1}</span>
              <h3>${escapeHtml(item.heading)}</h3>
              <p>${escapeHtml(item.body)}</p>
            </article>`).join("");
  const roadmap = sourceCopy.roadmap.items.map((item) => `
            <li class="roadmap-item">
              <span>${escapeHtml(item.name)}</span>
              <strong>${escapeHtml(item.status)}</strong>
            </li>`).join("");

  return `<!doctype html>
<html lang="en-CA">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' https://use.typekit.net; img-src 'self' data:; font-src 'self' https://use.typekit.net; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests">
    <title>The Blue Corner — Nobody fights alone.</title>
    <meta name="description" content="${escapeHtml(sourceCopy.hero.heading)} A Canadian men's mental-health coming-soon concept.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="The Blue Corner — Nobody fights alone.">
    <meta property="og:description" content="${escapeHtml(sourceCopy.hero.body)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/art/${escapeHtml(referenceHero.image)}">
    <link rel="icon" href="../../assets/brand/mark-blue.png" type="image/png">
    <script src="../../assets/scripts/boot.js"></script>
    <link rel="stylesheet" href="https://use.typekit.net/ciy6txz.css">
    <link rel="stylesheet" href="../../assets/styles/brand.css">
    <link rel="stylesheet" href="../../assets/styles/shared.css">
    <link rel="stylesheet" href="../../assets/styles/concept-base.css">
    <link rel="stylesheet" href="style.css">
    <script src="../../assets/scripts/shared.js" defer></script>
  </head>
  <body class="concept-page">
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="site-header">
      <div class="site-header__inner page-frame">
      <a class="site-header__brand" href="../../index.html" aria-label="The Blue Corner — all concepts">
        <img src="../../assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
      </a>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <section class="concept-hero" aria-labelledby="hero-title">
        <div class="concept-hero__inner page-frame">
          <div class="concept-hero__copy" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.hero.eyebrow)}</p>
            <h1 id="hero-title" aria-label="${escapeHtml(sourceCopy.hero.heading)}"><span class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">fights alone.</span></h1>
          </div>
          <figure class="concept-hero__media image-frame" data-image-frame data-image-fallback-label="Blue Corner hero image">
            <img class="concept-hero__image" src="../../assets/art/${escapeHtml(referenceHero.image)}" width="${escapeHtml(referenceHero.width)}" height="${escapeHtml(referenceHero.height)}" alt="${escapeHtml(referenceHero.alt)}" fetchpriority="high" data-fallback-image>
            <span class="concept-hero__corner" aria-hidden="true"></span>
          </figure>
          <p class="concept-hero__lead" data-reveal>${escapeHtml(sourceCopy.hero.lead)}</p>
          <div class="concept-hero__details" data-reveal>
            <p class="concept-hero__body">${escapeHtml(sourceCopy.hero.body)}</p>
            <div class="concept-hero__actions">
              <a class="button button--signal" href="#member-form" data-scroll-link>${escapeHtml(sourceCopy.hero.memberCta)}</a>
              <a class="button button--ghost" href="#roadmap-title" data-scroll-link>${escapeHtml(sourceCopy.hero.therapistCta)}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="stats" aria-labelledby="stats-title">
        <div class="stats__inner page-frame">
          <header class="section-heading stats__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.stats.eyebrow)}</p>
            <h2 id="stats-title" aria-label="${escapeHtml(sourceCopy.stats.heading)}"><span aria-hidden="true">It isn’t just bad.</span><span aria-hidden="true">It’s getting worse.</span></h2>
          </header>
          <div class="stats__grid" data-reveal>${stats}
          </div>
          <div class="stats__sources" data-reveal>
            <p>${escapeHtml(sourceCopy.stats.source)}</p>
            <p>${escapeHtml(sourceCopy.stats.gamblingSource)}</p>
          </div>
          <p class="stats__review-notice" data-reveal>${escapeHtml(safetyCopy.editorialReview)}</p>
        </div>
      </section>

      <section class="symptoms page-frame" aria-labelledby="symptoms-title">
        <header class="section-heading symptoms__heading" data-reveal>
          <p class="eyebrow">${escapeHtml(sourceCopy.symptoms.eyebrow)}</p>
          <h2 id="symptoms-title" aria-label="${escapeHtml(sourceCopy.symptoms.heading)}"><span aria-hidden="true">It looks</span><span aria-hidden="true">like this.</span></h2>
        </header>
        <div class="symptoms__grid">${symptoms}
        </div>
      </section>

      <section class="meaning" aria-labelledby="meaning-title">
        <div class="meaning__inner page-frame">
          <div class="meaning__mark" aria-hidden="true">
            <img src="../../assets/brand/corner-off-white.png" width="255" height="248" alt="">
          </div>
          <div class="meaning__copy" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.meaning.eyebrow)}</p>
            <h2 id="meaning-title">${escapeHtml(sourceCopy.meaning.heading)}</h2>
            <p>${escapeHtml(sourceCopy.meaning.body)}</p>
          </div>
        </div>
      </section>

      <section class="roadmap page-frame" aria-labelledby="roadmap-title">
        <header class="section-heading roadmap__heading" data-reveal>
          <p class="eyebrow">${escapeHtml(sourceCopy.roadmap.eyebrow)}</p>
          <h2 id="roadmap-title" aria-label="${escapeHtml(sourceCopy.roadmap.heading)}"><span aria-hidden="true">We start with therapy. The</span><span aria-hidden="true">rest of the corner is on its way.</span></h2>
        </header>
        <ol class="roadmap__list" data-reveal>${roadmap}
        </ol>
      </section>
${renderConceptAddition(concept)}

      <section class="conversion" aria-labelledby="conversion-title">
        <div class="conversion__inner page-frame">
          <header class="section-heading conversion__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.conversion.eyebrow)}</p>
            <h2 id="conversion-title" aria-label="${escapeHtml(sourceCopy.conversion.heading)}"><span aria-hidden="true">Be one of</span><span aria-hidden="true">the first in</span><span aria-hidden="true">the corner.</span></h2>
            <p>${escapeHtml(sourceCopy.conversion.body)}</p>
          </header>
          <div class="conversion__forms">${renderMemberForm(sourceCopy.conversion.member)}
          </div>
        </div>
      </section>
    </main>

    <footer class="concept-footer">
      <img class="concept-footer__wordmark" src="../../assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.footer.name)}">
      <nav class="concept-footer__support" aria-label="Crisis support">
        <a href="tel:988">Call 9-8-8</a>
        <a href="sms:988">Text 9-8-8</a>
        <a href="https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html" target="_blank" rel="noopener noreferrer">Crisis resources</a>
        <a href="tel:911">Call 9-1-1 for immediate danger</a>
      </nav>
    </footer>
  </body>
</html>
`;
};

export const renderGallery = (concepts) => {
  const tiles = concepts.map((concept) => `
          <a class="concept-tile concept-tile--${escapeHtml(concept.ordinal)}" href="concepts/${escapeHtml(concept.slug)}/" data-reveal>
            <span class="concept-tile__media image-frame" data-image-frame data-image-fallback-label="Preview in production">
              <img class="concept-tile__art" src="assets/art/${escapeHtml(referenceHero.image)}" alt="" width="${escapeHtml(referenceHero.width)}" height="${escapeHtml(referenceHero.height)}" loading="lazy" data-fallback-image>
            </span>
            <span class="concept-tile__meta">
              <span class="concept-tile__number">${escapeHtml(concept.ordinal)}</span>
              <span class="concept-tile__copy">
                <strong>${escapeHtml(concept.title)}</strong>
                <small>${escapeHtml(concept.descriptor)}</small>
              </span>
              <span class="concept-tile__arrow" aria-hidden="true">↗</span>
            </span>
          </a>`).join("");

  return `<!doctype html>
<html lang="en-CA">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' https://use.typekit.net; img-src 'self' data:; font-src 'self' https://use.typekit.net; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests">
    <title>The Blue Corner — Coming-soon concepts</title>
    <meta name="description" content="Twelve reference-led directions for The Blue Corner's Canadian men's mental-health coming-soon experience.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="Blue Corner — Twelve coming-soon concepts">
    <meta property="og:description" content="Twelve responsive directions for Blue Corner's therapy-first launch.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/social-preview.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="assets/brand/mark-blue.png" type="image/png">
    <script src="assets/scripts/boot.js"></script>
    <link rel="stylesheet" href="https://use.typekit.net/ciy6txz.css">
    <link rel="stylesheet" href="assets/styles/brand.css">
    <link rel="stylesheet" href="assets/styles/shared.css">
    <link rel="stylesheet" href="assets/styles/gallery.css">
    <script src="assets/scripts/shared.js" defer></script>
  </head>
  <body class="gallery-page">
    <a class="skip-link" href="#main">Skip to concepts</a>
${renderCrisisUtility()}

    <header class="gallery-hero">
      <div class="gallery-hero__inner page-frame">
        <div class="gallery-hero__topline">
          <img class="gallery-logo" src="assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="The Blue Corner">
          <span>Canada · Launching 2026</span>
        </div>
        <div class="gallery-hero__copy">
          <p class="eyebrow">Coming-soon direction study</p>
          <h1>Twelve ways into<br>the corner.</h1>
          <p>One exact reference page. Eleven useful additions, each tested without changing the base.</p>
        </div>
        <a class="gallery-down" href="#main" data-scroll-link>
          <span>Explore all twelve</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <section class="gallery-section page-frame" aria-labelledby="gallery-title">
        <div class="gallery-intro" data-reveal>
          <p class="eyebrow">Choose a direction</p>
          <h2 id="gallery-title">The base stays fixed.</h2>
          <p>Concept 01 is the supplied reference. Concepts 02–12 preserve it exactly and insert one clearly labeled, practical module before signup.</p>
        </div>
        <aside class="editorial-note" aria-label="Editorial verification note" data-reveal>
          <strong>Before production launch</strong>
          <p>The reference copy is preserved for design review. Verify the 85%, #1, and ~300% claims before publishing to a public audience.</p>
        </aside>
        <div class="concept-grid" data-concept-nav>${tiles}
        </div>
      </section>
    </main>

    <footer class="gallery-footer">
      <div class="page-frame">
        <img src="assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="The Blue Corner">
        <p>Nobody fights alone. In your corner, every round.</p>
        <p>Blue Corner is not an emergency service.</p>
      </div>
    </footer>
  </body>
</html>
`;
};
