import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { privacyCopy, referenceHero, safetyCopy, sourceCopy } from "./source-copy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* Every ?v= key is the first eight characters of its file's SHA-256, derived
   from the file itself rather than pasted by hand. Hand-maintained keys drifted
   from their contents twice and shipped a stale stylesheet to warm caches. */
export const CACHE_KEYED_ASSETS = Object.freeze({
  hero: `assets/art/${referenceHero.image}`,
  boot: "assets/scripts/boot.js",
  sharedScript: "assets/scripts/shared.js",
  sharedCss: "assets/styles/shared.css",
  conceptCss: "assets/styles/concept-base.css",
});

const cacheKeys = { hero: "", boot: "", sharedScript: "", sharedCss: "", conceptCss: "" };

export const fileCacheKey = async (relativePath) =>
  createHash("sha256").update(await readFile(path.join(ROOT, relativePath))).digest("hex").slice(0, 8);

export const syncCacheKeys = async () => {
  for (const [name, relativePath] of Object.entries(CACHE_KEYED_ASSETS)) {
    cacheKeys[name] = await fileCacheKey(relativePath);
  }
  return { ...cacheKeys };
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' https://use.typekit.net; img-src 'self' data:; font-src 'self' https://use.typekit.net; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests";

const documentHead = ({ title, description, canonicalStyles = true }) => `    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="Content-Security-Policy" content="${CSP}">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="theme-color" content="#197CE3">${canonicalStyles ? `
    <meta property="og:title" content="The Blue Corner — Nobody Fights Alone.">
    <meta property="og:description" content="${escapeHtml(sourceCopy.hero.body)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://winwinmarketing.github.io/blue-corner-coming-soon-review/assets/art/${escapeHtml(referenceHero.image)}?v=${cacheKeys.hero}">` : ""}
    <link rel="icon" href="assets/brand/mark-blue.png" type="image/png">
    <script src="assets/scripts/boot.js?v=${cacheKeys.boot}"></script>
    <link rel="stylesheet" href="https://use.typekit.net/ciy6txz.css">
    <link rel="stylesheet" href="assets/styles/brand.css">
    <link rel="stylesheet" href="assets/styles/shared.css?v=${cacheKeys.sharedCss}">
    <link rel="stylesheet" href="assets/styles/concept-base.css?v=${cacheKeys.conceptCss}">
    <script src="assets/scripts/shared.js?v=${cacheKeys.sharedScript}" defer></script>`;

/* The navy crisis band closes every screen. The numbers are large tap targets
   rather than underlined links, and the helpline is named so nobody has to
   guess who answers. Nothing inside carries an id because it is emitted five
   times on the landing page. */
const renderCrisisBand = () => {
  const { crisis } = sourceCopy;
  const [line, accent] = [crisis.line, crisis.lineAccent];
  const lead = line.slice(0, line.length - accent.length);
  const actions = crisis.actions.map((action) => `
            <a class="crisis-action crisis-action--${escapeHtml(action.tone)}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`).join("");
  return `
        <aside class="crisis-band" aria-label="Crisis support">
          <div class="crisis-band__inner page-frame">
            <p class="crisis-band__line">${escapeHtml(lead)}<span class="crisis-band__accent">${escapeHtml(accent)}</span></p>
            <div class="crisis-band__support">
              <p class="crisis-band__label">${escapeHtml(crisis.label)}</p>
              <div class="crisis-band__actions">${actions}
              </div>
              <p class="crisis-band__note">${escapeHtml(crisis.note)}</p>
            </div>
          </div>
        </aside>`;
};

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
              <h3>${escapeHtml(member.heading)}</h3>
              <p class="prototype-disclosure" id="member-prototype-disclosure">${escapeHtml(safetyCopy.prototypeDisclosure)}</p>
              <form class="prototype-form" data-prototype-form data-loading-label="${escapeHtml(safetyCopy.prototypeLoading)}" data-success-title="${escapeHtml(safetyCopy.prototypeSuccessTitle)}" data-success-body="${escapeHtml(safetyCopy.prototypeSuccessBody)}" method="post" autocomplete="off" aria-describedby="member-prototype-disclosure" novalidate>
                <fieldset data-form-fields>
                  <legend class="sr-only">Early-access interest</legend>
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

/* `home` is false on any page that is not the landing page: an in-page anchor
   like #roadmap-title only resolves there, so elsewhere it has to be rewritten
   to ./#roadmap-title or the link silently goes nowhere. */
const renderSignOff = ({ home = true } = {}) => {
  const { footer } = sourceCopy;
  const links = footer.links.map((link) => {
    const inPage = !link.external && link.href.startsWith("#");
    const href = inPage && !home ? `./${link.href}` : link.href;
    const attributes = link.external
      ? ' target="_blank" rel="noopener noreferrer"'
      : (inPage && home ? " data-scroll-link" : "");
    return `
            <a href="${escapeHtml(href)}"${attributes}>${escapeHtml(link.label)}</a>`;
  }).join("");
  return `
    <footer class="concept-footer">
      <div class="concept-footer__signoff page-frame">
        <a class="concept-footer__brand" href="./" aria-label="${escapeHtml(footer.name)} home">
          <img src="assets/brand/logo-horizontal-blue.png" width="1655" height="170" alt="${escapeHtml(footer.name)}">
        </a>
        <div class="concept-footer__meta">
          <nav class="concept-footer__links" aria-label="Site information">${links}
          </nav>
          <p class="concept-footer__legal">${escapeHtml(footer.legal)}</p>
        </div>
      </div>
    </footer>`;
};

export const renderHomePage = () => {
  const stats = sourceCopy.stats.items.map((item) => `
              <article class="stat">
                <strong class="stat__value">${escapeHtml(item.value)}</strong>
                <p>${escapeHtml(item.label)}</p>
              </article>`).join("");
  const rooms = sourceCopy.rooms.items.map((item) => `
              <article class="room" data-reveal>
                <div class="room__slot" data-room-slot>
                  <img src="assets/art/${escapeHtml(item.image)}" width="${escapeHtml(item.width)}" height="${escapeHtml(item.height)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
                </div>
                <div class="room__copy">
                  <h3>${escapeHtml(item.heading)}</h3>
                  <p>${escapeHtml(item.support)}</p>
                </div>
              </article>`).join("");
  const roadmap = sourceCopy.roadmap.items.map((item, index) => `
              <li class="roadmap-item ${index === 0 ? "roadmap-item--current" : "roadmap-item--future"}">
                <span class="roadmap-item__status">${escapeHtml(item.status)}</span>
                <span class="roadmap-item__name">${escapeHtml(item.name)}</span>
              </li>`).join("");

  return `<!doctype html>
<html lang="en-CA">
  <head>
${documentHead({
    title: "The Blue Corner — Nobody Fights Alone.",
    description: `${sourceCopy.hero.heading} A Canadian men's mental-health coming-soon concept.`,
  })}
  </head>
  <body class="concept-page">
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="site-header">
      <div class="site-header__inner page-frame">
        <a class="site-header__brand" href="./" aria-label="${escapeHtml(sourceCopy.header.name)} home">
          <img src="assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
        </a>
        <nav class="site-header__actions" aria-label="Blue Corner access">
          <a class="button button--signal" href="#member-form" data-scroll-link>${escapeHtml(sourceCopy.hero.memberCta)}</a>
          <a class="button button--ghost" href="#roadmap-title" data-scroll-link>${escapeHtml(sourceCopy.hero.therapistCta)}</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <div class="screen screen--hero">
        <section class="concept-hero" aria-labelledby="hero-title">
          <div class="concept-hero__inner page-frame">
            <div class="concept-hero__copy" data-reveal>
              <p class="eyebrow">${escapeHtml(sourceCopy.hero.eyebrow)}</p>
              <h1 id="hero-title" aria-label="Nobody Fights Alone."><span class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">Fights <span class="concept-hero__accent concept-hero__underline">Alone.</span></span></h1>
            </div>
            <figure class="concept-hero__media image-frame" data-image-frame data-image-fallback-label="Blue Corner hero image">
              <img class="concept-hero__image" src="assets/art/${escapeHtml(referenceHero.image)}?v=${cacheKeys.hero}" width="${escapeHtml(referenceHero.width)}" height="${escapeHtml(referenceHero.height)}" alt="${escapeHtml(referenceHero.alt)}" loading="eager" fetchpriority="high" decoding="async" data-fallback-image>
            </figure>
            <p class="concept-hero__lead" data-reveal><span class="concept-hero__lead-line"><span class="concept-hero__underline">Three</span> in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">${escapeHtml(sourceCopy.hero.leadSecond)}</span></p>
            <div class="concept-hero__details" data-reveal>
              <p class="concept-hero__body">${escapeHtml(sourceCopy.hero.body)}</p>
            </div>
          </div>
        </section>
${renderCrisisBand()}
      </div>

      <div class="screen screen--stats">
        <section class="stats" aria-labelledby="stats-title">
          <div class="stats__inner page-frame">
            <header class="section-heading stats__heading" data-reveal>
              <p class="eyebrow eyebrow--wide">${escapeHtml(sourceCopy.stats.eyebrow)}</p>
              <h2 id="stats-title" aria-label="${escapeHtml(sourceCopy.stats.heading)}"><span aria-hidden="true">Every year we stay quiet,</span><span aria-hidden="true">the numbers <span class="marker-band">climb.</span></span></h2>
            </header>
            <div class="stats__grid" data-reveal>${stats}
            </div>
            <div class="stats__sources" data-reveal>
              <p>${escapeHtml(sourceCopy.stats.source)}</p>
              <p>${escapeHtml(sourceCopy.stats.gamblingSource)}</p>
            </div>
          </div>
        </section>
${renderCrisisBand()}
      </div>

      <div class="screen screen--rooms">
        <section class="rooms" aria-labelledby="rooms-title">
          <div class="rooms__inner page-frame">
            <header class="section-heading rooms__heading" data-reveal>
              <p class="eyebrow eyebrow--wide">${escapeHtml(sourceCopy.rooms.eyebrow)}</p>
              <h2 id="rooms-title" aria-label="${escapeHtml(sourceCopy.rooms.heading)}"><span aria-hidden="true">It looks like</span><span aria-hidden="true"><span class="marker-band">an ordinary week.</span></span></h2>
            </header>
            <div class="rooms__grid">${rooms}
            </div>
          </div>
        </section>
${renderCrisisBand()}
      </div>

      <div class="screen screen--corner">
        <div class="corner-block">
          <section class="meaning" aria-labelledby="meaning-title">
            <div class="meaning__inner">
              <div class="meaning__mark" aria-hidden="true">
                <img src="assets/brand/corner-off-white.png" width="255" height="248" alt="">
              </div>
              <div class="meaning__copy" data-reveal>
                <p class="eyebrow">${escapeHtml(sourceCopy.meaning.eyebrow)}</p>
                <h2 id="meaning-title" aria-label="${escapeHtml(sourceCopy.meaning.heading)}"><span aria-hidden="true">Not a clinic. <span class="marker-band">A Corner.</span></span></h2>
                <p class="meaning__body">${escapeHtml(sourceCopy.meaning.body)}</p>
              </div>
            </div>
          </section>

          <section class="roadmap" aria-labelledby="roadmap-title">
            <div class="roadmap__inner page-frame">
              <header class="section-heading roadmap__heading" data-reveal>
                <p class="eyebrow">${escapeHtml(sourceCopy.roadmap.eyebrow)}</p>
                <h2 id="roadmap-title">${escapeHtml(sourceCopy.roadmap.heading)}</h2>
                <p class="roadmap__support">${escapeHtml(sourceCopy.roadmap.support)}</p>
              </header>
              <ol class="roadmap__list" data-reveal>${roadmap}
              </ol>
            </div>
          </section>
        </div>
${renderCrisisBand()}
      </div>

      <div class="screen screen--join">
        <section class="conversion" aria-labelledby="conversion-title">
          <div class="conversion__inner page-frame">
            <header class="section-heading conversion__heading" data-reveal>
              <p class="eyebrow">${escapeHtml(sourceCopy.conversion.eyebrow)}</p>
              <h2 id="conversion-title" aria-label="${escapeHtml(sourceCopy.conversion.heading)}">Be <span class="marker-band">first</span> in the corner.</h2>
              <p class="conversion__body">${escapeHtml(sourceCopy.conversion.body)}</p>
            </header>
            <div class="conversion__forms">${renderMemberForm()}
            </div>
          </div>
        </section>
${renderCrisisBand()}
      </div>
    </main>
${renderSignOff({ home: true })}
  </body>
</html>
`;
};

export const renderPrivacyPage = () => {
  const sections = privacyCopy.sections.map((section) => `
          <section class="prose__section">
            <h2>${escapeHtml(section.heading)}</h2>
            <p>${escapeHtml(section.body)}</p>
          </section>`).join("");

  return `<!doctype html>
<html lang="en-CA">
  <head>
${documentHead({ title: privacyCopy.title, description: privacyCopy.lead, canonicalStyles: false })}
  </head>
  <body class="concept-page concept-page--prose">
    <a class="skip-link" href="#main">Skip to main content</a>

    <header class="site-header">
      <div class="site-header__inner page-frame">
        <a class="site-header__brand" href="./" aria-label="${escapeHtml(sourceCopy.header.name)} home">
          <img src="assets/brand/logo-horizontal-white.png" width="1655" height="170" alt="${escapeHtml(sourceCopy.header.name)}">
        </a>
        <nav class="site-header__actions" aria-label="Blue Corner access">
          <a class="button button--ghost" href="./">${escapeHtml(privacyCopy.back)}</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <div class="screen screen--prose">
        <section class="prose" aria-labelledby="privacy-title">
          <div class="prose__inner page-frame">
            <header class="section-heading" data-reveal>
              <p class="eyebrow eyebrow--wide">${escapeHtml(privacyCopy.eyebrow)}</p>
              <h1 id="privacy-title">${escapeHtml(privacyCopy.heading)}</h1>
            </header>
            <p class="prose__lead" data-reveal>${escapeHtml(privacyCopy.lead)}</p>
            <div class="prose__body" data-reveal>${sections}
            </div>
          </div>
        </section>
${renderCrisisBand()}
      </div>
    </main>
${renderSignOff({ home: false })}
  </body>
</html>
`;
};
