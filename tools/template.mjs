import { sourceCopy, safetyCopy } from "./source-copy.mjs";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const className = (value) => String(value)
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const renderCrisisUtility = (assetPrefix = "") => `
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

const renderForm = (audience, copy) => {
  const isMember = audience === "member";
  const disclosureId = `${audience}-prototype-disclosure`;
  return `
            <article class="conversion-path conversion-path--${audience}" data-reveal>
              <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
              <h3>${escapeHtml(copy.heading)}</h3>
              <p class="prototype-disclosure" id="${disclosureId}">${escapeHtml(safetyCopy.prototypeDisclosure)}</p>
              <form class="prototype-form" id="${audience}-form" data-prototype-form data-audience="${audience}" data-loading-label="${escapeHtml(safetyCopy.prototypeLoading)}" data-success-title="${escapeHtml(safetyCopy.prototypeSuccessTitle)}" data-success-body="${escapeHtml(safetyCopy.prototypeSuccessBody)}" method="post" autocomplete="off" aria-describedby="${disclosureId}" novalidate>
                <fieldset data-form-fields>
                  <legend class="sr-only">${isMember ? "Men's early-access interest" : "Therapist interest"}</legend>
                  <div class="field-grid">${renderFields(audience)}
                  </div>
                  <button class="button${isMember ? " button--signal" : ""}" type="submit" data-submit>${escapeHtml(copy.button)}</button>
                  <p class="conversion-path__note">${escapeHtml(copy.note)}</p>
                </fieldset>
                <div class="form-status" data-form-status tabindex="-1" role="status" aria-live="polite" aria-atomic="true" hidden>
                  <h4 data-status-title></h4>
                  <p data-status-body></p>
                </div>
              </form>
            </article>`;
};

export const renderConceptPage = (concept) => {
  const bodyClass = `${className(concept.title)}-page`;
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
    <title>${escapeHtml(concept.title)} — The Blue Corner</title>
    <meta name="description" content="${escapeHtml(sourceCopy.hero.heading)} A Canadian men's mental-health coming-soon concept.">
    <meta name="theme-color" content="#197CE3">
    <meta property="og:title" content="${escapeHtml(concept.title)} — The Blue Corner">
    <meta property="og:description" content="${escapeHtml(sourceCopy.hero.body)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/art/${escapeHtml(concept.image)}">
    <link rel="icon" href="../../assets/brand/mark-blue.png" type="image/png">
    <script src="../../assets/scripts/boot.js"></script>
    <link rel="stylesheet" href="../../assets/styles/brand.css">
    <link rel="stylesheet" href="../../assets/styles/shared.css">
    <link rel="stylesheet" href="../../assets/styles/concept-base.css">
    <link rel="stylesheet" href="style.css">
    <script src="../../assets/scripts/shared.js" defer></script>
  </head>
  <body class="concept-page concept--${escapeHtml(concept.number)} ${bodyClass}" data-concept="${escapeHtml(concept.slug)}" data-concept-number="${escapeHtml(concept.number)}">
    <a class="skip-link" href="#main">Skip to main content</a>
${renderCrisisUtility("../../")}

    <header class="site-header page-frame">
      <a class="site-header__brand" href="../../index.html" aria-label="The Blue Corner — all concepts">
        <img src="../../assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
      </a>
      <p class="site-header__launch">${escapeHtml(sourceCopy.header.launch)}</p>
      <a class="site-header__review" href="../../index.html">Concept ${escapeHtml(concept.number)} of 12 · ${escapeHtml(concept.title)}</a>
    </header>

    <main id="main" tabindex="-1">
      <section class="concept-hero" aria-labelledby="hero-title">
        <div class="concept-hero__inner page-frame">
          <div class="concept-hero__copy" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.hero.eyebrow)}</p>
            <h1 id="hero-title">${escapeHtml(sourceCopy.hero.heading)}</h1>
            <p class="concept-hero__lead">${escapeHtml(sourceCopy.hero.lead)}</p>
            <p class="concept-hero__body">${escapeHtml(sourceCopy.hero.body)}</p>
            <div class="concept-hero__actions">
              <a class="button button--signal" href="#member-form" data-scroll-link>${escapeHtml(sourceCopy.hero.memberCta)}</a>
              <a class="button button--ghost" href="#therapist-form" data-scroll-link>${escapeHtml(sourceCopy.hero.therapistCta)}</a>
            </div>
          </div>
          <figure class="concept-hero__media image-frame" data-image-frame data-image-fallback-label="${escapeHtml(concept.title)} image in production">
            <img class="concept-hero__image" src="../../assets/art/${escapeHtml(concept.image)}" width="1536" height="1024" alt="${escapeHtml(concept.alt)}" fetchpriority="high" data-fallback-image>
            <figcaption><span>${escapeHtml(concept.number)}</span> ${escapeHtml(concept.title)}</figcaption>
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
            <img src="../../assets/brand/mark-white.png" width="405" height="402" alt="">
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

      <section class="conversion" aria-labelledby="conversion-title">
        <div class="conversion__inner page-frame">
          <header class="section-heading conversion__heading" data-reveal>
            <p class="eyebrow">${escapeHtml(sourceCopy.conversion.eyebrow)}</p>
            <h2 id="conversion-title">${escapeHtml(sourceCopy.conversion.heading)}</h2>
            <p>${escapeHtml(sourceCopy.conversion.body)}</p>
          </header>
          <div class="conversion__forms">${renderForm("member", sourceCopy.conversion.member)}
${renderForm("therapist", sourceCopy.conversion.therapist)}
          </div>
        </div>
      </section>
    </main>

    <footer class="concept-footer">
      <div class="concept-footer__inner page-frame">
        <div class="concept-footer__brand">
          <img src="../../assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.footer.name)}">
          <p>${escapeHtml(sourceCopy.footer.promise)}</p>
        </div>
        <div class="concept-footer__meta">
          <p>${escapeHtml(sourceCopy.footer.name)}</p>
          <p>${escapeHtml(sourceCopy.footer.category)}</p>
          <a href="https://${escapeHtml(sourceCopy.footer.domain)}">${escapeHtml(sourceCopy.footer.domain)}</a>
        </div>
        <div class="concept-footer__safety">
          <p>Blue Corner is not an emergency service.</p>
          <p>Call or text <a href="tel:988">9-8-8</a> for suicide crisis support. Call <a href="tel:911">9-1-1</a> for immediate danger.</p>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
};

export const renderGallery = (concepts) => {
  const tiles = concepts.map((concept) => `
          <a class="concept-tile concept-tile--${escapeHtml(concept.number)}" href="concepts/${escapeHtml(concept.slug)}/" data-reveal>
            <span class="concept-tile__media image-frame" data-image-frame data-image-fallback-label="Preview in production">
              <img class="concept-tile__art" src="assets/art/${escapeHtml(concept.image)}" alt="" width="1536" height="1024" loading="lazy" data-fallback-image>
            </span>
            <span class="concept-tile__meta">
              <span class="concept-tile__number">${escapeHtml(concept.number)}</span>
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
    <meta name="description" content="Twelve production-minded directions for The Blue Corner's Canadian men's mental-health coming-soon experience.">
    <meta name="theme-color" content="#042874">
    <meta property="og:title" content="Blue Corner — Twelve coming-soon concepts">
    <meta property="og:description" content="Twelve distinctive, responsive directions for Blue Corner's therapy-first launch.">
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
          <h1>Twelve ways into<br>the corner.</h1>
          <p>One locked story. Twelve distinct ways to make reaching out feel human, credible, and possible.</p>
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
          <h2 id="gallery-title">Same corner. Different signal.</h2>
          <p>Every concept uses the same supplied copy, realistic human imagery, therapy-first path, local-only form demonstration, and exact Blue Corner palette.</p>
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
        <img src="assets/brand/mark-white.png" width="405" height="402" alt="" aria-hidden="true">
        <p>Nobody fights alone. In your corner, every round.</p>
        <p>Blue Corner is not an emergency service.</p>
      </div>
    </footer>
  </body>
</html>
`;
};
