import { referenceHero, safetyCopy, sourceCopy } from "./source-copy.mjs";

const HERO_CACHE_KEY = "ac190f62";
const BOOT_SCRIPT_CACHE_KEY = "7d7ce8ca";
const CONCEPT_CSS_CACHE_KEY = "5b0f978d";
const SHARED_CSS_CACHE_KEY = "96271cce";
const SHARED_SCRIPT_CACHE_KEY = "c15703cd";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const renderFields = () => sourceCopy.conversion.fields.map((field) => {
  const id = `member-${field.name}`;
  const inputmode = field.inputmode ? ` inputmode="${escapeHtml(field.inputmode)}"` : "";
  return `
                    <div class="field">
                      <label for="${id}">${escapeHtml(field.label)}</label>
                      <input id="${id}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type)}"${inputmode} autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" required aria-describedby="${id}-error">
                      <p class="field-error" id="${id}-error" data-field-error="${escapeHtml(field.name)}" aria-live="polite"></p>
                    </div>`;
}).join("");

const renderMemberForm = () => {
  const { member } = sourceCopy.conversion;
  return `
            <article class="conversion-path conversion-path--member" id="member-form" data-reveal>
              <p class="eyebrow">${escapeHtml(member.eyebrow)}</p>
              <h3>${escapeHtml(member.heading)}</h3>
              <p class="prototype-disclosure" id="member-prototype-disclosure">${escapeHtml(safetyCopy.prototypeDisclosure)}</p>
              <form class="prototype-form" data-prototype-form data-loading-label="${escapeHtml(safetyCopy.prototypeLoading)}" data-success-title="${escapeHtml(safetyCopy.prototypeSuccessTitle)}" data-success-body="${escapeHtml(safetyCopy.prototypeSuccessBody)}" method="post" autocomplete="off" aria-describedby="member-prototype-disclosure" novalidate>
                <fieldset data-form-fields>
                  <legend class="sr-only">Men's early-access interest</legend>
                  <fieldset class="prototype-role" data-role-group>
                    <legend>I'm joining as</legend>
                    <div class="prototype-role__choices">
                      <label class="prototype-role__choice" for="member-role-patient">
                        <input id="member-role-patient" name="role" type="radio" value="Patient" autocomplete="off" required aria-describedby="member-role-error">
                        <span>Patient</span>
                      </label>
                      <label class="prototype-role__choice" for="member-role-therapist">
                        <input id="member-role-therapist" name="role" type="radio" value="Therapist" autocomplete="off" required aria-describedby="member-role-error">
                        <span>Therapist</span>
                      </label>
                    </div>
                    <p class="field-error" id="member-role-error" data-role-error aria-live="polite"></p>
                  </fieldset>
                  <div class="field-grid">${renderFields()}
                  </div>
                  <button class="button button--signal" type="submit" data-submit>${escapeHtml(member.button)}</button>
                  <p class="conversion-path__note">${escapeHtml(member.note)}</p>
                </fieldset>
                <div class="form-status" data-form-status tabindex="-1" role="status" aria-live="polite" aria-atomic="true" hidden>
                  <h4 data-status-title></h4>
                  <p data-status-body></p>
                </div>
              </form>
            </article>`;
};

const renderConversionBody = () => {
  const copy = sourceCopy.conversion.body;
  const sentenceBreak = copy.indexOf(". ");
  if (sentenceBreak < 0) return escapeHtml(copy);
  const first = copy.slice(0, sentenceBreak + 1);
  const second = copy.slice(sentenceBreak + 2);
  return `<span class="conversion__body-line">${escapeHtml(first)}</span> <span class="conversion__body-line">${escapeHtml(second)}</span>`;
};

export const renderHomePage = () => {
  const stats = sourceCopy.stats.items.map((item) => `
            <article class="stat">
              <strong class="stat__value">${escapeHtml(item.value)}</strong>
              <p>${escapeHtml(item.label)}</p>
            </article>`).join("");
  const symptoms = sourceCopy.symptoms.items.map((item, index) => `
            <article class="symptom" data-reveal>
              <span class="symptom__number" aria-hidden="true">0${index + 1}</span>
              <h3>${escapeHtml(item.heading)}</h3>
            </article>`).join("");
  const roadmap = sourceCopy.roadmap.items.map((item, index) => `
            <li class="roadmap-item ${index === 0 ? "roadmap-item--current" : "roadmap-item--future"}">
              <span class="roadmap-item__name">${index === 0 ? `<span class="marker-band">${escapeHtml(item.name)}</span>` : escapeHtml(item.name)}</span>
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
    <title>The Blue Corner — Nobody Fights Alone.</title>
    <meta name="description" content="${escapeHtml(sourceCopy.hero.heading)} A Canadian men's mental-health coming-soon concept.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="The Blue Corner — Nobody Fights Alone.">
    <meta property="og:description" content="${escapeHtml(sourceCopy.hero.body)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/art/${escapeHtml(referenceHero.image)}?v=${HERO_CACHE_KEY}">
    <link rel="icon" href="assets/brand/mark-blue.png" type="image/png">
    <script src="assets/scripts/boot.js?v=${BOOT_SCRIPT_CACHE_KEY}"></script>
    <link rel="stylesheet" href="https://use.typekit.net/ciy6txz.css">
    <link rel="stylesheet" href="assets/styles/brand.css">
    <link rel="stylesheet" href="assets/styles/shared.css?v=${SHARED_CSS_CACHE_KEY}">
    <link rel="stylesheet" href="assets/styles/concept-base.css?v=${CONCEPT_CSS_CACHE_KEY}">
    <script src="assets/scripts/shared.js?v=${SHARED_SCRIPT_CACHE_KEY}" defer></script>
  </head>
  <body class="concept-page">
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="site-header">
      <div class="site-header__inner page-frame">
        <a class="site-header__brand" href="./" aria-label="The Blue Corner home">
          <img src="assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
        </a>
        <nav class="site-header__actions" aria-label="Blue Corner access">
          <a class="button button--signal" href="#member-form" data-scroll-link>${escapeHtml(sourceCopy.hero.memberCta)}</a>
          <a class="button button--ghost" href="#roadmap-title" data-scroll-link>${escapeHtml(sourceCopy.hero.therapistCta)}</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <section class="concept-hero" aria-labelledby="hero-title">
        <div class="concept-hero__inner page-frame">
          <div class="concept-hero__copy" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.hero.eyebrow)}</p>
            <h1 id="hero-title" aria-label="Nobody Fights Alone."><span class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">Fights <span class="concept-hero__accent concept-hero__underline">Alone.</span></span></h1>
          </div>
          <figure class="concept-hero__media image-frame" data-image-frame data-image-fallback-label="Blue Corner hero image">
            <img class="concept-hero__image" src="assets/art/${escapeHtml(referenceHero.image)}?v=${HERO_CACHE_KEY}" width="${escapeHtml(referenceHero.width)}" height="${escapeHtml(referenceHero.height)}" alt="${escapeHtml(referenceHero.alt)}" fetchpriority="high" data-fallback-image>
            <span class="concept-hero__corner" aria-hidden="true"></span>
          </figure>
          <p class="concept-hero__lead" data-reveal><span class="concept-hero__lead-line"><span class="concept-hero__underline">Three</span> in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">${escapeHtml(sourceCopy.hero.leadSecond)}</span></p>
          <div class="concept-hero__details" data-reveal>
            <p class="concept-hero__body">${escapeHtml(sourceCopy.hero.body)}</p>
          </div>
        </div>
      </section>

      <section class="stats" aria-labelledby="stats-title">
        <div class="stats__inner page-frame">
          <header class="section-heading stats__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.stats.eyebrow)}</p>
            <h2 id="stats-title" aria-label="${escapeHtml(sourceCopy.stats.heading)}"><span aria-hidden="true">It isn’t just bad.</span><span aria-hidden="true">It’s getting <span class="marker-band">worse.</span></span></h2>
          </header>
          <div class="stats__grid" data-reveal>${stats}
          </div>
          <div class="stats__sources" data-reveal>
            <p>${escapeHtml(sourceCopy.stats.source)}</p>
            <p>${escapeHtml(sourceCopy.stats.gamblingSource)}</p>
          </div>
        </div>
      </section>

      <div class="corner-block">
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
              <img src="assets/brand/corner-off-white.png" width="255" height="248" alt="">
            </div>
            <div class="meaning__copy" data-reveal>
              <p class="eyebrow">${escapeHtml(sourceCopy.meaning.eyebrow)}</p>
              <h2 id="meaning-title" aria-label="${escapeHtml(sourceCopy.meaning.heading)}"><span aria-hidden="true">Not a clinic. <span class="marker-band">A Corner.</span></span></h2>
              <p class="meaning__body"><span class="meaning__body-line">${escapeHtml(sourceCopy.meaning.bodyFirst)}</span> <span class="meaning__body-line">${escapeHtml(sourceCopy.meaning.bodySecond)}</span></p>
            </div>
          </div>
        </section>
      </div>

      <section class="roadmap page-frame" aria-labelledby="roadmap-title">
        <header class="section-heading roadmap__heading" data-reveal>
          <p class="eyebrow">${escapeHtml(sourceCopy.roadmap.eyebrow)}</p>
          <h2 id="roadmap-title" aria-label="${escapeHtml(sourceCopy.roadmap.heading)}"><span aria-hidden="true">We start with <span class="marker-band">therapy.</span></span><span aria-hidden="true">The rest of the corner is on its way.</span></h2>
        </header>
        <ol class="roadmap__list" data-reveal>${roadmap}
        </ol>
      </section>

      <section class="conversion" aria-labelledby="conversion-title">
        <div class="conversion__inner page-frame">
          <header class="section-heading conversion__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.conversion.eyebrow)}</p>
            <h2 id="conversion-title" aria-label="${escapeHtml(sourceCopy.conversion.heading)}"><span aria-hidden="true">Be <span class="marker-band">one</span> of</span><span aria-hidden="true">the first in</span><span aria-hidden="true">the corner.</span></h2>
            <p>${renderConversionBody()}</p>
          </header>
          <div class="conversion__forms">${renderMemberForm()}
          </div>
        </div>
      </section>
    </main>

    <footer class="concept-footer">
      <div class="concept-footer__bar page-frame">
        <p class="concept-footer__line">${escapeHtml(sourceCopy.footer.line)}</p>
        <nav class="concept-footer__support" aria-label="Crisis support">
          <a href="tel:988">Call 9-8-8</a>
          <a href="sms:988">Text 9-8-8</a>
          <a href="https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html" target="_blank" rel="noopener noreferrer">Crisis resources</a>
          <a href="tel:911">Call 9-1-1 for immediate danger</a>
        </nav>
      </div>
      <img class="concept-footer__wordmark" src="assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.footer.name)}">
    </footer>
  </body>
</html>
`;
};
