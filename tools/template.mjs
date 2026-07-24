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
            <article class="conversion-path conversion-path--${audience}" data-reveal>
              <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
              <h3>${escapeHtml(copy.heading)}</h3>
              <p class="prototype-disclosure" id="${disclosureId}">${escapeHtml(safetyCopy.prototypeDisclosure)}</p>
              <form class="prototype-form" id="${audience}-form" data-prototype-form data-audience="${audience}" data-loading-label="${escapeHtml(safetyCopy.prototypeLoading)}" data-success-title="${escapeHtml(safetyCopy.prototypeSuccessTitle)}" data-success-body="${escapeHtml(safetyCopy.prototypeSuccessBody)}" method="post" autocomplete="off" aria-describedby="${disclosureId}" novalidate>
                <fieldset data-form-fields>
                  <legend class="sr-only">Men's early-access interest</legend>
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

const renderConceptAddition = (concept) => {
  if (!concept.additionKey) return "";
  const addition = conceptAdditions[concept.additionKey];
  if (!addition) throw new Error(`Unknown concept addition: ${concept.additionKey}`);
  const items = addition.items.map((item, index) => `
              <li class="concept-addition__item">
                <span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <p>${escapeHtml(item)}</p>
              </li>`).join("");
  return `
      <section class="concept-addition" aria-labelledby="concept-addition-title">
        <div class="concept-addition__inner page-frame">
          <header class="concept-addition__heading" data-reveal>
            <p class="eyebrow">Concept add-on</p>
            <h2 id="concept-addition-title">${escapeHtml(addition.title)}</h2>
            <p>${escapeHtml(addition.intro)}</p>
          </header>
          <ol class="concept-addition__list" data-reveal>${items}
          </ol>
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests">
    <title>The Blue Corner — Nobody fights alone.</title>
    <meta name="description" content="${escapeHtml(sourceCopy.hero.heading)} A Canadian men's mental-health coming-soon concept.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="The Blue Corner — Nobody fights alone.">
    <meta property="og:description" content="${escapeHtml(sourceCopy.hero.body)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/art/${escapeHtml(referenceHero.image)}">
    <link rel="icon" href="../../assets/brand/mark-blue.png" type="image/png">
    <script src="../../assets/scripts/boot.js"></script>
    <link rel="stylesheet" href="../../assets/styles/brand.css">
    <link rel="stylesheet" href="../../assets/styles/shared.css">
    <link rel="stylesheet" href="../../assets/styles/concept-base.css">
    <link rel="stylesheet" href="style.css">
    <script src="../../assets/scripts/shared.js" defer></script>
  </head>
  <body class="concept-page">
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="site-header page-frame">
      <a class="site-header__brand" href="../../index.html" aria-label="The Blue Corner — all concepts">
        <img src="../../assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
      </a>
    </header>

    <main id="main" tabindex="-1">
      <section class="concept-hero" aria-labelledby="hero-title">
        <div class="concept-hero__inner page-frame">
          <div class="concept-hero__copy" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.hero.eyebrow)}</p>
            <h1 id="hero-title" aria-label="${escapeHtml(sourceCopy.hero.heading)}"><span class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">fights alone.</span></h1>
            <p class="concept-hero__lead">${escapeHtml(sourceCopy.hero.lead)}</p>
            <p class="concept-hero__body">${escapeHtml(sourceCopy.hero.body)}</p>
            <div class="concept-hero__actions">
              <a class="button button--signal" href="#member-form" data-scroll-link>${escapeHtml(sourceCopy.hero.memberCta)}</a>
              <a class="button button--ghost" href="#roadmap-title" data-scroll-link>${escapeHtml(sourceCopy.hero.therapistCta)}</a>
            </div>
          </div>
          <figure class="concept-hero__media image-frame" data-image-frame data-image-fallback-label="Blue Corner hero image">
            <img class="concept-hero__image" src="../../assets/art/${escapeHtml(referenceHero.image)}" width="${escapeHtml(referenceHero.width)}" height="${escapeHtml(referenceHero.height)}" alt="${escapeHtml(referenceHero.alt)}" fetchpriority="high" data-fallback-image>
          </figure>
        </div>
      </section>

      <section class="stats" aria-labelledby="stats-title">
        <div class="stats__inner page-frame">
          <header class="section-heading stats__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.stats.eyebrow)}</p>
            <h2 id="stats-title">${escapeHtml(sourceCopy.stats.heading)}</h2>
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
          <h2 id="symptoms-title">${escapeHtml(sourceCopy.symptoms.heading)}</h2>
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
          <h2 id="roadmap-title">${escapeHtml(sourceCopy.roadmap.heading)}</h2>
        </header>
        <ol class="roadmap__list" data-reveal>${roadmap}
        </ol>
      </section>
${renderConceptAddition(concept)}

      <section class="conversion" aria-labelledby="conversion-title">
        <div class="conversion__inner page-frame">
          <header class="section-heading conversion__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.conversion.eyebrow)}</p>
            <h2 id="conversion-title">${escapeHtml(sourceCopy.conversion.heading)}</h2>
            <p>${escapeHtml(sourceCopy.conversion.body)}</p>
          </header>
          <div class="conversion__forms">${renderMemberForm(sourceCopy.conversion.member)}
          </div>
        </div>
      </section>
    </main>

    <footer class="concept-footer">
      <div class="concept-footer__inner page-frame">
        <div class="concept-footer__brand">
          <img src="../../assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.footer.name)}">
          <p>${escapeHtml(sourceCopy.footer.promise)}</p>
        </div>
        <div class="concept-footer__meta">
          <p>${escapeHtml(sourceCopy.footer.name)}</p>
          <p>${escapeHtml(sourceCopy.footer.category)}</p>
          <a href="https://${escapeHtml(sourceCopy.footer.domain)}">${escapeHtml(sourceCopy.footer.domain)}</a>
        </div>
        <div class="concept-footer__safety">
          <p>Blue Corner is not an emergency service.</p>
          <div class="concept-footer__help">
            <a href="tel:988">Call 9-8-8</a>
            <a href="sms:988">Text 9-8-8</a>
            <a href="https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html" target="_blank" rel="noopener noreferrer">Crisis resources</a>
          </div>
          <p>Call <a href="tel:911">9-1-1</a> for immediate danger.</p>
        </div>
      </div>
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests">
    <title>The Blue Corner — Coming-soon concepts</title>
    <meta name="description" content="Six reference-led directions for The Blue Corner's Canadian men's mental-health coming-soon experience.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="Blue Corner — Six coming-soon concepts">
    <meta property="og:description" content="Six distinctive, responsive directions for Blue Corner's therapy-first launch.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/social-preview.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="assets/brand/mark-blue.png" type="image/png">
    <script src="assets/scripts/boot.js"></script>
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
          <h1>Six ways into<br>the corner.</h1>
          <p>One exact reference page. Five useful additions, each tested without changing the base.</p>
        </div>
        <a class="gallery-down" href="#main" data-scroll-link>
          <span>Explore all six</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <section class="gallery-section page-frame" aria-labelledby="gallery-title">
        <div class="gallery-intro" data-reveal>
          <p class="eyebrow">Choose a direction</p>
          <h2 id="gallery-title">The base stays fixed.</h2>
          <p>Concept 01 is the supplied reference. Concepts 02–06 preserve it exactly and insert one clearly labeled, practical module before signup.</p>
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
