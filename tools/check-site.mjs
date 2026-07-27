import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { referenceHero, sourceCopy } from "./source-copy.mjs";
import { CACHE_KEYED_ASSETS, fileCacheKey, renderHomePage, renderPrivacyPage, syncCacheKeys } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const failures = [];
const strictImages = process.argv.includes("--strict-images");
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "a80fc3111bf8b07398eb344d855e302a1e748678d6164c0f1999cee842cf25f6",
  "assets/art/blue-corner-reference-ring.webp": "22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2",
  "assets/art/blue-corner-reference-ring-human-v1.webp": "d93177bf051bf8a5ded782cb5acd8d99ad9cc2a22541397c9fec7c70c148b054",
  "assets/art/room-01-unmade-bed.webp": "5d957222c538091e3c088b127baf8fcff60998240148523b53b20f46e78b6da2",
  "assets/art/room-02-garage-tv-glow.webp": "b57140168b9de6b4d0b9f3ab49ca7729f1404feb791f15cb3732e90daaa63e01",
  "assets/art/room-03-desk-at-dusk.webp": "5a856fb0c3e0dc5635137d5da4153d931c9e9ba27e4c30f300ae60d86b2751a3",
  "assets/art/room-04-kitchen-table.webp": "39dc0bab9a8b11dd1f58d14cdd079067139ff33aa41f394b7ef712c9d3acd390",
});

const fail = (message) => failures.push(message);
const count = (value, token) => value.split(token).length - 1;
const exists = async (target) => {
  try {
    return await stat(target);
  } catch {
    return null;
  }
};

const checkLocalReferences = async (html, htmlPath) => {
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|tel:|sms:|mailto:|data:|#)/.test(reference)) continue;
    if (reference.startsWith("/assets")) fail(`Pages must use project-relative assets, not ${reference}`);
    const target = path.resolve(path.dirname(htmlPath), reference.split(/[?#]/, 1)[0]);
    const result = await exists(target);
    if (!result) {
      const message = `Missing local reference: ${reference}`;
      if (strictImages || !reference.includes("assets/art/")) fail(message);
    }
  }
};

await syncCacheKeys();
const cacheKeys = {};
for (const [name, relativePath] of Object.entries(CACHE_KEYED_ASSETS)) {
  cacheKeys[name] = await fileCacheKey(relativePath);
}

const indexPath = path.join(rootDirectory, "index.html");
const privacyPath = path.join(rootDirectory, "privacy.html");
const home = await readFile(indexPath, "utf8");
const privacy = await readFile(privacyPath, "utf8");
if (home !== renderHomePage()) fail("Root index.html is stale; run node tools/generate.mjs");
if (privacy !== renderPrivacyPage()) fail("privacy.html is stale; run node tools/generate.mjs");

const rootEntries = await readdir(rootDirectory, { withFileTypes: true });
if (rootEntries.some((entry) => entry.name === "concepts")) fail("Public concepts directory must not exist");
if (rootEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".html")).map((entry) => entry.name).sort().join("|") !== "index.html|privacy.html") {
  fail("Root must expose exactly two HTML pages: index.html and privacy.html");
}
for (const removedPath of ["assets/styles/gallery.css", "tools/concepts.mjs", "CONCEPT-GOALS.md"]) {
  if (await exists(path.join(rootDirectory, removedPath))) fail(`${removedPath} must be removed with the retired variants`);
}
// Superseded hero renders are removed, not left beside the live one: check-site
// cannot tell which of three near-identical webps the page actually ships.
for (const retiredHero of ["assets/art/blue-corner-reference-ring-brand-v2.webp", "assets/art/blue-corner-reference-ring-brand-v3.webp"]) {
  if (await exists(path.join(rootDirectory, retiredHero))) fail(`${retiredHero} is superseded by the brand-blue hero and must be removed`);
}

if (!home.includes('<body class="concept-page">')) fail("Root must retain the canonical homepage body");
if (/(?:concept-addition|data-module|data-concept-nav|gallery-|Twelve ways|Concept add-on)/i.test(home)) fail("Root homepage includes retired gallery or variant markup");
if (home.includes("Designer review only")) fail("Root must not expose the retired editorial review note");

// ------------------------------------------------------------------ page 1
if (!home.includes('class="concept-hero__lead-line"><span class="concept-hero__underline">Three</span> in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">Let that sit for a second.</span>')) {
  fail("Hero support copy must preserve the locked lines and yellow Three underline");
}
if (!home.includes('class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">Fights <span class="concept-hero__accent concept-hero__underline">Alone.</span>')) {
  fail("Hero must keep the two-line lock with blue and yellow-underlined Alone.");
}
// Design review item 2: the floating corner glyph over the photograph is gone.
if (/concept-hero__corner/.test(home)) fail("The hero photograph must not carry the floating corner glyph");
// Design review item 4: the right-column line matches the left column's voice.
if (!home.includes(`<p class="concept-hero__body">${sourceCopy.hero.body.replaceAll("'", "&#39;")}</p>`)) {
  fail("Hero right-column copy must be the approved line");
}
if (!/\.concept-hero__body\s*\{[^}]*max-inline-size:\s*34ch;[^}]*font-size:\s*clamp\(1\.375rem, 1\.78vw, 1\.75rem\);[^}]*font-weight:\s*var\(--font-weight-bold\);[^}]*line-height:\s*1\.2;/.test(await readFile(path.join(rootDirectory, "assets/styles/concept-base.css"), "utf8"))) {
  fail("Hero right-column line must share the left column's family, weight, size and leading on a short measure");
}

// ------------------------------------------------------------------ page 2
if (!home.includes('<span aria-hidden="true">Every year we stay quiet,</span><span aria-hidden="true">the numbers <span class="marker-band">climb.</span></span>')) {
  fail("Statistics headline must be the approved two-line lock with climb. highlighted");
}
if (home.includes("It isn’t just bad.") || home.includes("It isn't just bad.")) fail("Retired statistics headline must remain removed");
if (count(home, 'class="eyebrow eyebrow--wide"') !== 2) fail("The statistics and rooms kickers must both use the one-line wide eyebrow");

// ------------------------------------------------------------------ page 3
const roomsGrid = home.match(/<div class="rooms__grid">([\s\S]*?)\n            <\/div>/)?.[1] ?? "";
if (count(roomsGrid, '<article class="room"') !== 4
  || count(roomsGrid, "data-room-slot") !== 4
  || count(roomsGrid, "<img ") !== 4
  || count(roomsGrid, "<h3>") !== 4) {
  fail("Four rooms must render four scenes, each with a photograph and a heading");
}
for (const item of sourceCopy.rooms.items) {
  const image = `<img src="assets/art/${item.image}" width="${item.width}" height="${item.height}" alt="${item.alt.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" loading="lazy" decoding="async">`;
  if (!roomsGrid.includes(image)
    || !roomsGrid.includes(`<h3>${item.heading}</h3>`)
    || !roomsGrid.includes(`<p>${item.support}</p>`)) {
    fail(`Four rooms is missing the approved copy for ${item.slot}`);
  }
}
if (/room__slot-(?:label|brief)/.test(home) || /data-room-slot[^>]*aria-hidden/.test(home)) {
  fail("Delivered room photography must replace the commissioning-brief overlays and remain available to assistive technology");
}
for (const retired of ["Numbing out to get through it.", "Focus gone. Brain rot.", "No drive. No sleep.", "The people closest to him paying for it."]) {
  if (home.includes(retired)) fail(`Retired symptom copy must remain removed: ${retired}`);
}
if (/class="symptom/.test(home)) fail("The retired symptoms list must not remain");

// -------------------------------------------------------------- pages 4 + 5
if (!/<div class="corner-block">[\s\S]*?<section class="meaning"[\s\S]*?<section class="roadmap"[\s\S]*?<\/section>\s*<\/div>/.test(home)) {
  fail("The manifesto and the plan must share one screen inside .corner-block");
}
if (!home.includes(`<p class="meaning__body">${sourceCopy.meaning.body.replaceAll("'", "&#39;")}</p>`)
  || home.includes("patch him up between rounds")) {
  fail("Manifesto must be the single approved line, with the retired two-sentence explanation removed");
}
if (!home.includes("<h2 id=\"roadmap-title\">We start with therapy.</h2>")
  || !home.includes('<p class="roadmap__support">The rest of the corner is on its way.</p>')) {
  fail("The plan headline must be one line with the rest dropped to a supporting line");
}
if (count(home, "roadmap-item--current") !== 1
  || count(home, "roadmap-item--future") !== 3
  || count(home, 'class="roadmap-item__status">Next</span>') !== 3
  || !home.includes('class="roadmap-item__status">Live at launch</span>')) {
  fail("The plan must be four cards: Therapy live at launch and three labelled Next");
}
if (home.includes("IV Wellness")) fail("Nutrition and IV Wellness must stay collapsed into one item");

// ------------------------------------------------------------------ page 6
if (!home.includes('<span aria-hidden="true">Be <span class="marker-band">first</span> in</span><span aria-hidden="true">the corner.</span>')) {
  fail("Sign-up headline must be the approved two-line lock with first highlighted");
}
if (home.includes("Be one of") || home.includes(">For men<")) fail("The retired nine-word headline and the FOR MEN eyebrow must remain removed");
if (!home.includes(`<p class="conversion__body">${sourceCopy.conversion.body}</p>`) || /conversion__body-line/.test(home)) {
  fail("Sign-up sub-copy must be one line, not the retired two");
}
if (count(home, "data-prototype-form") !== 1 || /<form\b[^>]*\baction=/i.test(home)) fail("Root must retain one local-only form without an action");
if (count(home, 'name="role" type="radio"') !== 2 || !home.includes("<legend>I'm joining as</legend>")) fail("Root form must retain exactly two named role radios");
for (const role of ["Patient", "Therapist"]) {
  if (!home.includes(`value="${role}"`) || !home.includes(`>${role}</span>`)) fail(`Root role choice is missing ${role}`);
}
if (!/name="role"[^>]*required[^>]*aria-describedby="member-role-error"/.test(home) || count(home, "data-role-error") !== 1) {
  fail("Root role selector must have the local accessible validation contract");
}

// ------------------------------------------------------------------ page 7
// The band repeats once per screen; the light sign-off row runs only at the end.
const crisisBandCount = count(home, '<aside class="crisis-band" aria-label="Crisis support">');
if (crisisBandCount !== 5) fail(`The navy crisis band must close all five screens; found ${crisisBandCount}`);
if (count(privacy, '<aside class="crisis-band" aria-label="Crisis support">') !== 1) fail("The privacy page must also close on the crisis band");
for (const action of ['<a class="crisis-action crisis-action--signal" href="tel:988">Call 9-8-8</a>',
  '<a class="crisis-action crisis-action--signal" href="sms:988">Text 9-8-8</a>',
  '<a class="crisis-action crisis-action--outline" href="tel:911">9-1-1 if in danger</a>']) {
  if (count(home, action) !== crisisBandCount) fail(`Every crisis band must carry the same tap target: ${action}`);
}
if (count(home, sourceCopy.crisis.note) !== crisisBandCount || !home.includes("Suicide Crisis Helpline")) {
  fail("Every crisis band must name the helpline so nobody has to guess who answers");
}
if (count(home, 'class="concept-footer__signoff page-frame"') !== 1) fail("The light sign-off row must appear exactly once, at the end");
if (/concept-footer__wordmark/.test(home) || /concept-footer__support/.test(home)) {
  fail("The decorative ghost wordmark and the retired underlined crisis row must remain removed");
}
if (!home.includes('<a href="privacy.html">Privacy</a>')) fail("The sign-off row must link the privacy page");
if (!privacy.includes('<a href="./#roadmap-title">Therapists, join us</a>')) fail("Off-home sign-off anchors must resolve back to the landing page");

// ------------------------------------------------------- structure and shell
for (const section of ["concept-hero", "stats", "rooms", "meaning", "roadmap", "conversion", "crisis-band"]) {
  if (!home.includes(`class="${section}`)) fail(`Core ${section} section is missing`);
}
if (count(home, '<div class="screen ') !== 5) fail("The landing page must be exactly five one-screen blocks");
if (!/^\s*<header class="site-header">\s*<div class="site-header__inner page-frame">/m.test(home)) {
  fail("Homepage masthead must be full-bleed with a page-frame inner");
}
if (!/<nav class="site-header__actions"[^>]*>[\s\S]*?Get early access[\s\S]*?Therapists, join us[\s\S]*?<\/nav>/.test(home) || home.includes("concept-hero__actions")) {
  fail("Both hero actions must live only in the compact masthead");
}
for (const [label, page] of [["Homepage", home], ["Privacy page", privacy]]) {
  if (count(page, 'href="https://use.typekit.net/ciy6txz.css"') !== 1
    || !page.includes("style-src 'self' https://use.typekit.net;")
    || !page.includes("font-src 'self' https://use.typekit.net;")
    || !page.includes("connect-src 'none'; form-action 'none';")) {
    fail(`${label} needs the Typekit stylesheet and the constrained style/font/connect CSP`);
  }
  if (count(page, `href="assets/styles/concept-base.css?v=${cacheKeys.conceptCss}"`) !== 1
    || count(page, `href="assets/styles/shared.css?v=${cacheKeys.sharedCss}"`) !== 1
    || count(page, `src="assets/scripts/shared.js?v=${cacheKeys.sharedScript}"`) !== 1) {
    fail(`${label} must version every stylesheet and script with the first eight characters of its SHA-256`);
  }
  if (count(page, `src="assets/scripts/boot.js?v=${cacheKeys.boot}"`) !== 1
    || page.indexOf(`src="assets/scripts/boot.js?v=${cacheKeys.boot}"`) > page.indexOf('<link rel="stylesheet"')
    || /<script[^>]+src="assets\/scripts\/boot\.js[^"]*"[^>]+(?:async|defer)/.test(page)) {
    fail(`${label} must load the versioned reveal boot synchronously before styles`);
  }
  if (/(?:href|src)="\/assets\//.test(page)) fail(`${label} assets must be project-relative`);
}
if (count(home, `src="assets/art/${referenceHero.image}?v=${cacheKeys.hero}"`) !== 1
  || count(home, `assets/art/${referenceHero.image}?v=${cacheKeys.hero}`) !== 2) {
  fail("Homepage must reference the approved hero from both the og:image and the img");
}
if (!home.includes(`width="${referenceHero.width}" height="${referenceHero.height}" alt="${referenceHero.alt.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" loading="eager" fetchpriority="high" decoding="async"`)
  || !/HELP IS ON THE WAY/.test(referenceHero.alt)) {
  fail("Hero must reserve its image geometry, load at high priority, and describe the ring-card message");
}
await checkLocalReferences(home, indexPath);
await checkLocalReferences(privacy, privacyPath);

for (const [relativePath, expectedHash] of Object.entries(approvedAssets)) {
  const actualHash = createHash("sha256").update(await readFile(path.join(rootDirectory, relativePath))).digest("hex");
  if (actualHash !== expectedHash) fail(`${relativePath} changed from the approved baseline`);
}

const brandCss = await readFile(path.join(rootDirectory, "assets/styles/brand.css"), "utf8");
const sharedCss = await readFile(path.join(rootDirectory, "assets/styles/shared.css"), "utf8");
const conceptCss = await readFile(path.join(rootDirectory, "assets/styles/concept-base.css"), "utf8");
const bootScript = await readFile(path.join(rootDirectory, "assets/scripts/boot.js"), "utf8");
const sharedScript = await readFile(path.join(rootDirectory, "assets/scripts/shared.js"), "utf8");
const impeccableSpec = await readFile(path.join(rootDirectory, ".impeccable.md"), "utf8");
const recolorScript = await readFile(path.join(rootDirectory, "tools/recolor-hero.mjs"), "utf8");
if (/(?:\.concept-addition(?:__[\w-]+)?|data-print-plan|data-plan-(?:form|preview))/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("Retired concept-addition selectors must not remain in the canonical stylesheets");
}
if (!/scrollbar-color:\s*transparent transparent;/.test(sharedCss)
  || !/scrollbar-width:\s*thin;/.test(sharedCss)
  || !/html\.is-scrollbar-active,\s*html\.is-scrollbar-edge\s*\{[^}]*scrollbar-color:\s*var\(--brand-navy\) transparent;/.test(sharedCss)
  || !/html::\-webkit-scrollbar\s*\{[^}]*inline-size:\s*0\.75rem;[^}]*block-size:\s*0\.75rem;/.test(sharedCss)
  || !/html\.is-scrollbar-active::\-webkit-scrollbar-thumb,\s*html\.is-scrollbar-edge::\-webkit-scrollbar-thumb\s*\{[^}]*background-color:\s*var\(--brand-navy\);/.test(sharedCss)
  || !/window\.addEventListener\("scroll", showActiveScrollbar, \{ passive: true \}\)/.test(sharedScript)
  || !/window\.addEventListener\("pointermove", trackScrollbarEdge, \{ passive: true \}\)/.test(sharedScript)
  || !/window\.innerWidth - event\.clientX <= 12/.test(sharedScript)
  || !/const handleScrollbarPageHide = \(event\) => \{\s*if \(!event\.persisted\) cleanupScrollbar\(\);\s*\};/.test(sharedScript)
  || !/window\.addEventListener\("pagehide", handleScrollbarPageHide\)/.test(sharedScript)
  || !/window\.removeEventListener\("pagehide", handleScrollbarPageHide\)/.test(sharedScript)
  || !/window\.removeEventListener\("scroll", showActiveScrollbar\)/.test(sharedScript)
  || /(?:edge-progress|data-scroll-indicator|--edge-thumb-(?:size|offset))/.test(`${home}\n${sharedCss}\n${sharedScript}`)
  || !/@media \(forced-colors: active\)[\s\S]*?scrollbar-color:\s*auto;/.test(sharedCss)
  || /scrollbar-gutter/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("Scrollbar must remain native/draggable, transparent at rest, and visible only while scrolling or near the right edge");
}
const bootGuard = bootScript.indexOf("if (reducedMotion.matches");
const prepActivation = bootScript.indexOf('classList.add("reveal-prep")');
const observerConstruction = sharedScript.indexOf("new IntersectionObserver");
const firstActivationFrame = sharedScript.indexOf("revealActivationFrame = window.requestAnimationFrame");
const secondActivationFrame = sharedScript.indexOf("revealActivationFrame = window.requestAnimationFrame", firstActivationFrame + 1);
const initialMeasurement = sharedScript.indexOf("const initialRevealTargets", secondActivationFrame);
const revealReadiness = sharedScript.indexOf('classList.add("reveal-ready")', initialMeasurement);
const prepRelease = sharedScript.indexOf('classList.remove("reveal-prep")', revealReadiness);
const revealFrame = sharedScript.indexOf("revealActivationFrame = window.requestAnimationFrame", prepRelease);
const initialReveal = sharedScript.indexOf("initialRevealTargets.forEach", revealFrame);
if (bootGuard < 0 || prepActivation < bootGuard
  || bootScript.indexOf('classList.add("js")') < 0
  || !/if \(reducedMotion\.matches \|\| !\("IntersectionObserver" in window\) \|\| !\("requestAnimationFrame" in window\)\) return;/.test(bootScript)
  || !/fallbackTimer = window\.setTimeout\(release, 1500\);/.test(bootScript)
  || !/const release = \(\) => \{[\s\S]*?classList\.remove\("reveal-prep"\);/.test(bootScript)) {
  fail("Reveal boot must prepare before first paint only when motion and browser capabilities allow, then fail open on timeout");
}
if (observerConstruction < 0
  || firstActivationFrame < observerConstruction
  || secondActivationFrame <= firstActivationFrame
  || initialMeasurement < secondActivationFrame
  || revealReadiness < initialMeasurement
  || prepRelease < revealReadiness
  || revealFrame < prepRelease
  || initialReveal < revealFrame
  || !/if \(!root\.classList\.contains\("reveal-ready"\)\) return;/.test(sharedScript)
  || !/if \(typeof window\.cancelAnimationFrame === "function"\) window\.cancelAnimationFrame\(revealActivationFrame\);/.test(sharedScript)
  || !/const disableReveals = \(\) => \{[\s\S]*?classList\.remove\("reveal-ready"\);[\s\S]*?disconnect\(\);[\s\S]*?releaseRevealPrep\(\);/.test(sharedScript)
  || !/\|\| !root\.classList\.contains\("reveal-prep"\)\) \{\s*disableReveals\(\);/.test(sharedScript)
  || !/initialRevealTargets\.forEach\(\(target\) => \{[\s\S]*?classList\.add\("is-visible"\);[\s\S]*?observer\.unobserve\(target\);/.test(sharedScript)
  || !/catch \{\s*disableReveals\(\);\s*\}/.test(sharedScript)) {
  fail("Reveal activation must observe first, preserve a rendered prep frame, enable transitions, then animate only initially visible targets and fail open");
}
if (!/\.reveal-prep \[data-reveal\],[\s\S]*?opacity:\s*0;[\s\S]*?transform:\s*translateY\(1rem\);[\s\S]*?transition:\s*none !important;/.test(sharedCss)
  || !/\.reveal-ready \[data-reveal\][\s\S]*?opacity:\s*0;[\s\S]*?transform:\s*translateY\(1rem\);/.test(sharedCss)
  || !/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.reveal-prep \[data-reveal\],[\s\S]*?opacity:\s*1 !important;[\s\S]*?transform:\s*none !important;[\s\S]*?transition:\s*none !important;/.test(sharedCss)
  || /\.js\s+\[data-reveal\]/.test(sharedCss)) {
  fail("Reveal CSS must freeze the early prep state, remain readiness-gated, and immediately neutralize under reduced motion");
}
for (const staggerContract of [
  /\.stats__grid \.stat:nth-child\(4\)/,
  /\.rooms__grid \.room:nth-child\(4\)/,
  /\.roadmap__list \.roadmap-item:nth-child\(4\)/,
  /\.conversion-path\[data-reveal\]/,
]) {
  if (!staggerContract.test(sharedCss)) fail("Reveal stagger must remain short, CSS-defined, and applied to section wrappers and repeated rows");
}
if (/\.roadmap__list \.roadmap-item:nth-child\(5\)/.test(sharedCss)) fail("The retired fifth roadmap column must not keep a stagger delay");
if (!/\.reveal-ready \.conversion-path\[data-reveal\] > \.eyebrow,[\s\S]*?transform var\(--duration-reveal\) cubic-bezier\(0\.16, 1, 0\.3, 1\),[\s\S]*?opacity var\(--duration-reveal\) cubic-bezier\(0\.16, 1, 0\.3, 1\);/.test(sharedCss)
  || !/--conversion-reveal-delay:\s*270ms;/.test(sharedCss)
  || !/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.reveal-ready \.conversion-path\[data-reveal\] \.conversion-path__note\s*\{[^}]*opacity:\s*1 !important;[^}]*transform:\s*none !important;[^}]*transition:\s*none !important;/.test(sharedCss)) {
  fail("Conversion entrance must use a capped transform/opacity stagger and disappear under reduced motion");
}
if (/transition(?:-property)?:[^;]*(?:background|color|border|inline-size|block-size|width|height|top|left)/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("Motion must animate only transform and opacity");
}
if (!/--font-brand:\s*"proxima-nova-condensed"/.test(brandCss) || !/--font-weight-regular:\s*400;/.test(brandCss) || !/--font-weight-semibold:\s*700;/.test(brandCss) || !/--font-size-support:\s*1\.25rem;/.test(brandCss)) {
  fail("Brand typography must lead with Proxima Nova Condensed and use 400/700 weights");
}
for (const typographyRule of ["font-kerning: normal", "text-rendering: optimizeLegibility", 'font-feature-settings: "kern" 1, "liga" 1, "clig" 1']) {
  if (!sharedCss.includes(typographyRule)) fail(`Shared typography is missing ${typographyRule}`);
}
for (const readabilityRule of [
  /\.stat p\s*\{[^}]*font-size:\s*clamp\([^;]*\);[^}]*font-weight:\s*var\(--font-weight-semibold\);[^}]*line-height:\s*1\.35;/,
  /\.prototype-disclosure\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.prototype-role > legend\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
  /\.field-error\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.45;/,
  /\.concept-footer__links a\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
]) {
  if (!readabilityRule.test(`${conceptCss}\n${sharedCss}`)) fail("Supporting copy must use the readable scale");
}
// Design review item 8: the footnotes are noticeably smaller than body copy and
// set tight, but never below 1rem and never below a 1.3 line-height.
if (!/--font-size-small:\s*1rem;/.test(brandCss)
  || !/\.stats__sources\s*\{[^}]*gap:\s*0;[^}]*font-size:\s*var\(--font-size-small\);[^}]*line-height:\s*1\.35;/.test(conceptCss)
  || !/@media \(max-width: 48rem\)[\s\S]*?\.stats__sources,\s*\.prototype-disclosure,\s*\.conversion-path__note\s*\{[^}]*line-height:\s*1\.55;/.test(conceptCss)) {
  fail("Statistics footnotes must be the small scale, set tight, with comfortable mobile leading");
}
if (!/\.eyebrow\s*\{[^}]*max-inline-size:\s*min\(100%, 34ch\);[^}]*background:\s*var\(--brand-yellow\);[^}]*color:\s*var\(--brand-navy\);[^}]*font-size:\s*clamp\([^;]*\);/.test(sharedCss)) {
  fail("Eyebrows must use the readable navy-on-yellow two-line treatment");
}
// The wide kicker drops its measure, never its type size.
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.eyebrow--wide\s*\{\s*max-inline-size:\s*none;\s*white-space:\s*nowrap;\s*\}\s*\}/.test(sharedCss)
  || /\.eyebrow--wide\s*\{[^}]*font-size/.test(sharedCss)) {
  fail("The one-line kicker must widen its block rather than shrink below the shared eyebrow size");
}
if (!/html\s*\{[^}]*min-inline-size:\s*20rem;/.test(sharedCss)
  || !/body\s*\{[^}]*min-inline-size:\s*20rem;/.test(sharedCss)
  || !/@media \(max-width: 20rem\)\s*\{\s*html,\s*body\s*\{\s*min-inline-size:\s*0;\s*\}\s*\}/.test(sharedCss)) {
  fail("The desktop width floor must release exactly at 20rem so 320px viewports do not overflow");
}
if (count(home, 'class="marker-band"') !== 4
  || !home.includes('<span class="marker-band">climb.</span>')
  || !home.includes('<span class="marker-band">an ordinary week.</span>')
  || !home.includes('<span class="marker-band">A Corner.</span>')
  || !home.includes('<span class="marker-band">first</span>')) {
  fail("The four approved marker-band highlights must remain, one per screen that has a kicker chip");
}
if (!/\.section-heading h2 > span\s*\{[^}]*display:\s*block;/.test(conceptCss)
  || !/\.marker-band\s*\{[^}]*display:\s*inline;/.test(conceptCss)) {
  fail("Heading line locks must not force nested marker bands into full-width rows");
}
if (!/\.marker-band\s*\{[^}]*position:\s*relative;[^}]*padding-inline:\s*0;[^}]*white-space:\s*nowrap;/.test(conceptCss)
  || !/\.marker-band::before\s*\{[^}]*z-index:\s*-1;[^}]*inset-block:\s*0;[^}]*inset-inline:\s*-0\.125em;[^}]*background:\s*var\(--brand-yellow\);/.test(conceptCss)
  || /transparent 0 14%|--marker-band-height/.test(`${conceptCss}\n${brandCss}`)) {
  fail("Marker highlights must preserve the no-padding selection box with balanced visual inline breathing room");
}
if (!/\.concept-hero h1,\s*\.section-heading h2,\s*\.meaning h2\s*\{[^}]*isolation:\s*isolate;/.test(conceptCss)) {
  fail("Headings holding a marker band must isolate, or the band sinks behind the section background");
}
if (!/--page-max:\s*100%;/.test(brandCss)) {
  fail("Sections must run full bleed; the retired 96rem page cap left them narrow on wide screens");
}

// ------------------------------------------------- crisis band, every screen
if (/\.crisis-band\s*\{[^}]*position:\s*fixed/.test(`${conceptCss}\n${sharedCss}`)
  || /\.crisis-band[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden|opacity:\s*0)/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("Crisis support must be permanent, visible, in-flow content on every screen — never a fixed or hidden overlay");
}
if (!/\.crisis-band\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.crisis-action\s*\{[^}]*min-block-size:\s*2\.75rem;/.test(conceptCss)
  || !/\.crisis-action--signal\s*\{[^}]*background:\s*var\(--brand-yellow\);[^}]*color:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.crisis-action--outline\s*\{[^}]*border:\s*2px solid var\(--brand-off-white\);/.test(conceptCss)
  || !/\.crisis-band__accent\s*\{[^}]*color:\s*var\(--brand-yellow\);/.test(conceptCss)) {
  fail("The crisis band must be navy with yellow 44px tap targets and a yellow closing accent");
}
if (!/@media \(pointer: coarse\)[\s\S]*?\.crisis-action\s*\{[^}]*min-block-size:\s*3\.25rem;/.test(sharedCss)) {
  fail("Crisis tap targets must grow on coarse pointers");
}
if (!/@media \(forced-colors: active\)[\s\S]*?\.crisis-action--signal\s*\{[^}]*border:\s*2px solid CanvasText;/.test(sharedCss)) {
  fail("Crisis tap targets must stay distinguishable in forced colours, where their yellow fill is dropped");
}
if (/text-decoration:\s*underline/.test(conceptCss.match(/\.crisis-action\s*\{[^}]*\}/)?.[0] ?? "")) {
  fail("Crisis numbers must be tap targets, not underlined links");
}

// ------------------------------------------------------- one screen per page
if (!/@media \(min-width: 64\.0625rem\)[\s\S]*?\.screen\s*\{[^}]*min-block-size:\s*100svh;/.test(conceptCss)
  || !/@media \(min-width: 64\.0625rem\)[\s\S]*?\.screen--hero\s*\{[^}]*min-block-size:\s*calc\(100svh - var\(--header-h\)\);/.test(conceptCss)
  || !/--header-h:\s*clamp\(5\.5rem, 7vw, 6rem\);/.test(conceptCss)) {
  fail("Every block must fill exactly one desktop viewport, with the masthead subtracted from the hero screen");
}
// The crisis band is auto-height and the content row takes the slack, so adding
// the band shrinks the section rather than pushing the screen past the fold.
if (!/\.screen\s*\{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*minmax\(0, 1fr\) auto;/.test(conceptCss)) {
  fail("Each screen must give its content the flexible row and the crisis band the auto row");
}
if (/scroll-snap/.test(`${conceptCss}\n${sharedCss}\n${brandCss}`)) {
  fail("Scroll snapping must stay off; scrolling is never locked to a block");
}
if (!/html\s*\{[^}]*scroll-behavior:\s*auto;/.test(sharedCss)
  || /scroll-behavior:\s*smooth/.test(`${conceptCss}\n${sharedCss}\n${brandCss}`)) {
  fail("Page scrolling must remain native and immediate; forced smooth scrolling is not allowed");
}
// Vertical rhythm must scale CONTINUOUSLY with svh. A max-height breakpoint
// compacts spacing below its threshold and leaves it full size just above, so
// the section overflows one screen in the band immediately over the cliff —
// which is exactly where a real browser window sits.
if (/@media[^{]*max-height:/.test(conceptCss)
  || !/\.stats__inner\s*\{[^}]*padding-block:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)
  || !/\.rooms__inner\s*\{[^}]*padding-block:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)
  || !/\.roadmap__inner\s*\{[^}]*padding-block:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)
  || !/\.meaning__copy\s*\{[^}]*padding:\s*clamp\([^)]*svh[^)]*\)[^;]*;/.test(conceptCss)) {
  fail("Desktop vertical rhythm must scale continuously with svh, never step at a max-height breakpoint");
}
if (!/\.meaning__inner\s*\{[^}]*grid-template-columns:\s*12\.6% minmax\(0, 87\.4%\);/.test(conceptCss)) {
  fail("The manifesto rail ratio is locked at 12.6%");
}
if (!/\.meaning\s*\{[^}]*background:\s*var\(--brand-blue\);/.test(conceptCss) || !/\.meaning__mark\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)) {
  fail("Manifesto must retain its navy rail and bright-blue content field");
}

// ------------------------------------------------- statistics on a navy band
if (!/\.stats__grid\s*\{[^}]*background:\s*var\(--brand-navy\);[^}]*color:\s*var\(--brand-off-white\);/.test(conceptCss)
  || !/\.stat__value\s*\{[^}]*color:\s*var\(--brand-yellow\);/.test(conceptCss)
  || !/\.stat p\s*\{[^}]*color:\s*var\(--brand-off-white\);/.test(conceptCss)) {
  fail("Statistics must sit on a navy band with yellow figures and white captions");
}
if (/\.stat__value\s*\{[^}]*text-decoration:\s*underline/.test(conceptCss)
  || /\.stat\s*\{[^}]*border-inline-end/.test(conceptCss)
  || /\.stats__grid\s*\{[^}]*border-block/.test(conceptCss)) {
  fail("The four yellow rules under the figures and the vertical dividers must remain removed");
}

// ---------------------------------------------------------- rooms and cards
if (!/\.rooms__grid\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/.test(conceptCss)
  || !/\.room__copy\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.room__copy h3\s*\{[^}]*color:\s*var\(--brand-yellow\);/.test(conceptCss)
  || !/\.room__slot img\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*inline-size:\s*100%;[^}]*block-size:\s*100%;[^}]*object-fit:\s*cover;/.test(conceptCss)) {
  fail("Four rooms must be a four-column grid of photo slots over navy caption blocks with yellow headings");
}
if (!/\.roadmap__list\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/.test(conceptCss)
  || !/\.roadmap-item--current\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.roadmap-item--future\s*\{[^}]*background:\s*color-mix\(in oklch, var\(--brand-navy\) 13%, var\(--brand-off-white\)\);[^}]*color:\s*color-mix\(in oklch, var\(--brand-navy\) 78%, var\(--brand-off-white\)\);/.test(conceptCss)
  || /\.roadmap-item\s*\{[^}]*border-inline-end/.test(conceptCss)) {
  fail("The plan must be four cards — one dark live card and three muted Next cards — not a five-column tab row");
}

// ------------------------------------------------------------- conversion UI
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*clamp\(4rem, min\(8\.4vw, 17svh\), 11rem\);/.test(conceptCss)) {
  fail("Desktop conversion headline must use the locked display scale");
}
if (!/\.conversion__body\s*\{[^}]*max-inline-size:\s*38ch;[^}]*font-size:\s*1\.5rem;/.test(conceptCss)) {
  fail("Sign-up sub-copy must hold the 24px large-text threshold on a short measure");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.conversion__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 45rem\);/.test(conceptCss)
  || !/\.conversion__forms\s*\{[^}]*max-inline-size:\s*45rem;/.test(conceptCss)
  || !/\.conversion__forms\s*\{[^}]*align-self:\s*start;/.test(conceptCss)
  || !/\.conversion-path\s*\{[^}]*align-self:\s*start;[^}]*padding:\s*clamp\([^)]*svh[^)]*\) clamp\(1\.5rem, 2vw, 1\.75rem\);/.test(conceptCss)) {
  fail("Conversion card must self-start, keep the responsive 45rem track, and scale its rhythm with svh");
}
// The card is the tallest element on the sign-up screen. Fixed rem spacing made
// it rigid at every window height and overflowed the screen by 113px at 830px.
if (!/\.conversion \.prototype-form,\s*\.conversion \.prototype-form fieldset\s*\{[^}]*gap:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)
  || !/\.conversion \.field-grid\s*\{[^}]*gap:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)
  || !/\.conversion__inner\s*\{[^}]*padding-block:\s*clamp\([^)]*svh[^)]*\);/.test(conceptCss)) {
  fail("Sign-up card spacing must scale continuously with svh, not sit at a fixed rem height");
}
// Reserved, not collapsed: an empty slot that disappears shifts the submit
// button under the cursor exactly when a user is correcting a field.
if (!/\.field-error\s*\{[^}]*min-block-size:\s*1\.45em;/.test(sharedCss)) {
  fail("Field error slots must stay reserved so validation never shifts the form");
}
if (!/\.field input\s*\{[^}]*min-block-size:\s*2\.75rem;/.test(sharedCss)
  || !/@media \(pointer: coarse\)[\s\S]*?min-block-size:\s*3\.25rem;/.test(sharedCss)) {
  fail("Inputs must hold the 44px floor and grow on coarse pointers");
}
if (!/\.prototype-disclosure\s*\{[^}]*padding:\s*0\.375rem var\(--space-sm\);[^}]*border:\s*1px solid color-mix\([^;]+\);[^}]*background:\s*color-mix\(in oklch, var\(--brand-yellow\) 9%, var\(--brand-off-white\)\);[^}]*font-size:\s*var\(--font-size-support\);[^}]*font-weight:\s*var\(--font-weight-regular\);/.test(conceptCss)
  || /\.prototype-disclosure\s*\{[^}]*(?:opacity:\s*0|font-size:\s*(?:0\.|[1-9][0-9]?px))/.test(conceptCss)
  || /\.prototype-role__choice:has\(input:checked\)\s*\{[^}]*border-width/.test(conceptCss)
  || !/\.prototype-role__choice:has\(input:checked\)\s*\{[^}]*outline:\s*2px solid var\(--brand-navy\);/.test(conceptCss)) {
  fail("Prototype disclosure and checked radios must be quieter without reduced legibility or layout-shifting borders");
}
if (!/:focus-visible\s*\{[^}]*outline:\s*3px solid/.test(sharedCss)
  || !/@media \(forced-colors: active\)[\s\S]*?:focus-visible\s*\{[^}]*outline:\s*3px solid Highlight;/.test(sharedCss)
  || !/@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.button:hover/.test(sharedCss)) {
  fail("Interactive states must retain 3px focus rings, forced-colors distinction, and pointer-gated hover");
}
if (count(impeccableSpec, "720px maximum card") !== 1 || impeccableSpec.includes("680px maximum card")) {
  fail("Impeccable specification must pin the conversion card maximum to 720px");
}
if (/(?:concept-addition|data-module|data-concept-nav|initializeSentenceStarter|navigator\.clipboard|localStorage|sessionStorage|fetch\()/.test(sharedScript)) {
  fail("Shared runtime includes retired variant or privacy-sensitive behavior");
}
if (!/const SOURCE = path\.join\(ROOT, "assets\/art\/blue-corner-reference-ring\.webp"\);/.test(recolorScript)
  || !/const ROPE_SEGMENTS = \[/.test(recolorScript)
  || !/const PAD_POLYGON = \[/.test(recolorScript)
  || !/\.webp\(\{ lossless: true, effort: 6 \}\)/.test(recolorScript)
  || !/if \(changedMask\[pixel\]\) continue;/.test(recolorScript)
  || !/Unmasked decoded pixel changed/.test(recolorScript)
  || /\.webp\(\{[^}]*quality:/.test(recolorScript)) {
  fail("Hero recolour must use the original photo, explicit rope/pad masks, lossless output, and decoded unmasked-pixel verification");
}
// Design review item 1: the pad is the wordmark blue, not navy.
if (!/const PAD_BLUE = \[/.test(recolorScript) || /const NAVY = \[/.test(recolorScript)) {
  fail("The corner pad must recolour to the wordmark blue, not the retired navy ramp");
}
if (/\.js\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/.test(sharedCss)) fail("Core content must remain visible without JavaScript");

if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Site check passed for the canonical homepage and privacy page${strictImages ? " with strict images" : ""}.`);
}
