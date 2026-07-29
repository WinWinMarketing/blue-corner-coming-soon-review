import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { referenceHero, safetyCopy, sourceCopy } from "./source-copy.mjs";
import { CACHE_KEYED_ASSETS, fileCacheKey, renderHomePage, renderPrivacyPage, syncCacheKeys } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const failures = [];
const strictImages = process.argv.includes("--strict-images");
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "a80fc3111bf8b07398eb344d855e302a1e748678d6164c0f1999cee842cf25f6",
  "assets/brand/archivo-latin.woff2": "7150c0ec5ad356453013d11affec1fbab95de0dd2dcecb043b4f1cb7f87c4ba4",
  "assets/brand/jetbrains-mono-latin-500.woff2": "615a7673d37b1dd624e2deeb572a1a238f9b32981bf3fc44f87aa14f3bd7d04b",
  "assets/art/blue-corner-reference-ring.webp": "22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2",
  "assets/art/blue-corner-reference-ring-human-v1.webp": "d93177bf051bf8a5ded782cb5acd8d99ad9cc2a22541397c9fec7c70c148b054",
  "assets/art/room-01-unmade-bed-v2.webp": "62d313ff550ca7c07647c8ef41e9a9b23f9c58fec47aa5ab268c67629e27b399",
  "assets/art/room-02-garage-v2.webp": "84a3ab6f192a161909ce07281b38d9568298323b806de6d53dc29e967d329b89",
  "assets/art/room-03-desk-v2.webp": "8ac7a79a6516161f98b8bd89dbbf8ef130c9d302ec906166f31375f96adf71ec",
  "assets/art/room-04-kitchen-v2.webp": "9f3e5a5581b8e8c1e60ade60435bd481a092045fa477937de9fc0b55605a62d0",
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
// The yellow rule belongs to "Alone." and nothing else. Underlining "Three" as
// well put two different yellow emphases in one eyeful of each other and made
// the statistic compete with the headline it is supposed to be evidence for.
if (!home.includes('class="concept-hero__lead-line">Three in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">Let that sit for a second.</span>')) {
  fail("Hero support copy must be the locked lines with no second underline");
}
if (/concept-hero__lead[\s\S]{0,120}concept-hero__underline/.test(home)) {
  fail("The retired yellow underline under Three must remain removed");
}
// The break falls between the two words of the phrase, not inside it: "Nobody
// Fights" is the sentence and "Alone." is the turn, so the yellow rule and the
// blue both land on a line of their own.
if (!home.includes('class="concept-hero__headline-line" aria-hidden="true">Nobody Fights</span><span class="concept-hero__headline-line" aria-hidden="true"><span class="concept-hero__accent concept-hero__underline">Alone.</span>')) {
  fail("Hero must keep the two-line lock with Alone. alone on the second line");
}
// Design review item 2: the floating corner glyph over the photograph is gone.
if (/concept-hero__corner/.test(home)) fail("The hero photograph must not carry the floating corner glyph");
// Design review item 4: the right-column line matches the left column's voice,
// and it now breaks on its own sentence so the two columns square up line for
// line instead of the right one wrapping mid-clause after "Not for much".
if (!home.includes(`<p class="concept-hero__body"><span class="concept-hero__body-line">${sourceCopy.hero.bodyFirst}</span> <span class="concept-hero__body-line">${sourceCopy.hero.bodySecond.replaceAll("'", "&#39;")}</span></p>`)) {
  fail("Hero right-column copy must be the two approved sentences, one per line");
}
if (`${sourceCopy.hero.bodyFirst} ${sourceCopy.hero.bodySecond}` !== sourceCopy.hero.body) {
  fail("The hero's two right-column lines must still read as the approved og:description sentence");
}
if (!/@media \(min-width: 48\.0625rem\)\s*\{\s*\.concept-hero__lead-line,\s*\.concept-hero__body-line\s*\{\s*display:\s*block;/.test(await readFile(path.join(rootDirectory, "assets/styles/concept-base.css"), "utf8"))) {
  fail("Both hero columns must take their locked line breaks at the same breakpoint");
}
// 50ch, not 42ch: with the break explicit the measure only has to hold the
// longer of the two sentences without wrapping it a third time. Size, weight
// and leading stay pinned here so widening cannot become a licence to shrink
// the type.
if (!/\.concept-hero__body\s*\{[^}]*max-inline-size:\s*50ch;[^}]*font-size:\s*clamp\(1\.375rem, 1\.78vw, 1\.75rem\);[^}]*font-weight:\s*var\(--font-weight-bold\);[^}]*line-height:\s*1\.2;/.test(await readFile(path.join(rootDirectory, "assets/styles/concept-base.css"), "utf8"))) {
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
// A card holding one word had to be inflated to ~250px to look like a card at
// all. Every service now carries a line of detail, so the box is earned and can
// size to its own content.
if (count(home, 'class="roadmap-item__detail">') !== sourceCopy.roadmap.items.length
  || sourceCopy.roadmap.items.some((item) => !item.detail || !home.includes(`<span class="roadmap-item__detail">${item.detail}</span>`))) {
  fail("Every plan card must carry its one-line description");
}
if (home.includes("IV Wellness")) fail("Nutrition and IV Wellness must stay collapsed into one item");
if (home.includes("Nutrition &amp; wellness")) fail("The plan card is titled Nutrition; its detail line carries the wellness half");

// ------------------------------------------------------------------ page 6
if (!home.includes('<h2 id="conversion-title" aria-label="Be first in the corner.">Be <span class="marker-band">first</span> in the corner.</h2>')) {
  fail("Sign-up headline must be the approved single inline sentence with first highlighted");
}
if (home.includes("Be one of") || home.includes(">For men<")) fail("The retired nine-word headline and the FOR MEN eyebrow must remain removed");
if (!home.includes(`<p class="conversion__body">${sourceCopy.conversion.body}</p>`) || /conversion__body-line/.test(home)) {
  fail("Sign-up sub-copy must be one line, not the retired two");
}
if (count(home, "data-prototype-form") !== 1 || /<form\b[^>]*\baction=/i.test(home)) fail("Root must retain one local-only form without an action");
const roleInputs = [...home.matchAll(/<input\b(?=[^>]*\bname="role"(?=[\s>]))(?=[^>]*\btype="radio"(?=[\s>]))[^>]*>/gi)]
  .map(([input]) => input);
if (roleInputs.length !== 2 || !home.includes("<legend>I'm joining as</legend>")) fail("Root form must retain exactly two named role radios");
for (const role of ["Patient", "Therapist"]) {
  const input = roleInputs.find((candidate) => candidate.includes(`value="${role}"`)) ?? "";
  if (!input || !home.includes(`>${role}</span>`)) fail(`Root role choice is missing ${role}`);
  if (!/\srequired(?:\s|=|\/?>)/i.test(input) || !/\saria-describedby="member-role-error"(?:\s|\/?>)/i.test(input)) {
    fail(`Root ${role} role choice must retain required accessible validation`);
  }
  if (/\schecked(?:\s|=|\/?>)/i.test(input)) fail(`Root ${role} role choice must not be checked by default`);
}
if (count(home, "data-role-error") !== 1) {
  fail("Root role selector must have the local accessible validation contract");
}

// ------------------------------------------------------------------ page 7
// The navy support route closes every content screen; the light sign-off row
// runs only once after all five screens.
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
for (const retiredAsset of [
  "assets/art/blue-corner-reference-ring-brand-v4.webp",
  "assets/art/room-01-unmade-bed.webp",
  "assets/art/room-02-garage-tv-glow.webp",
  "assets/art/room-03-desk-at-dusk.webp",
  "assets/art/room-04-kitchen-table.webp",
]) {
  if (await exists(path.join(rootDirectory, retiredAsset))) fail(`${retiredAsset} must be absent`);
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
const fontFaceBlocks = [...conceptCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, block]) => block);
const archivoFamilyUses = [...conceptCss.matchAll(/font-family:\s*(?:"Archivo"|'Archivo'|Archivo)(?=\s*[,;])/g)].length;
const jetBrainsFamilyUses = [...conceptCss.matchAll(/font-family:\s*(?:"JetBrains Mono"|'JetBrains Mono'|JetBrains Mono)(?=\s*[,;])/g)].length;
const hasLocalFontFace = (family, weight, fileName) => fontFaceBlocks.some((block) =>
  block.includes(`font-family: "${family}";`)
  && block.includes("font-style: normal;")
  && block.includes(`font-weight: ${weight};`)
  && block.includes("font-display: swap;")
  && block.includes(`src: url("../brand/${fileName}") format("woff2");`));
for (const [family, weight, fileName] of [
  ["Archivo", 400, "archivo-latin.woff2"],
  ["Archivo", 500, "archivo-latin.woff2"],
  ["Archivo", 600, "archivo-latin.woff2"],
  ["Archivo", 700, "archivo-latin.woff2"],
  ["JetBrains Mono", 500, "jetbrains-mono-latin-500.woff2"],
]) {
  if (!hasLocalFontFace(family, weight, fileName)) {
    fail(`Local font contract is missing ${family} ${weight} from ${fileName}`);
  }
}
if (!/\.rooms,\s*\.meaning,\s*\.roadmap,\s*\.conversion\s*\{[^}]*font-family:\s*"Archivo", Helvetica, Arial, sans-serif;/.test(conceptCss)
  || archivoFamilyUses !== 5
  || !/\.roadmap-item__status\s*\{[^}]*font-family:\s*"JetBrains Mono", monospace;/.test(conceptCss)
  || jetBrainsFamilyUses !== 2) {
  fail("Local feedback fonts must remain scoped to the reviewed sections and roadmap status labels");
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
// The block insets wrap the ink, they do not trace the text box. Measured in
// Proxima Nova Condensed Bold: the inline box is 1.4258em with the baseline
// 1.0645em down it, the tallest banded ink rises 0.7031em above the baseline
// and the deepest falls 0.1953em below, so the full box left 0.361em of dead
// yellow above the letters against 0.166em below. That imbalance is what made
// the band under "climb." sit high and reach into the line above it.
if (!/\.marker-band\s*\{[^}]*position:\s*relative;[^}]*padding-inline:\s*0;[^}]*white-space:\s*nowrap;/.test(conceptCss)
  || !/\.marker-band::before\s*\{[^}]*z-index:\s*-1;[^}]*inset-block:\s*0\.28em;[^}]*inset-inline:\s*-0\.125em;[^}]*background:\s*var\(--brand-yellow\);/.test(conceptCss)
  || /transparent 0 14%|--marker-band-height/.test(`${conceptCss}\n${brandCss}`)) {
  fail("Marker highlights must wrap their ink evenly on a no-padding inline with balanced inline breathing room");
}
// An em inset is only balanced against the font it was measured on. Archivo
// reports a 1.093em inline box against Proxima Nova Condensed's 1.426em, so the
// three Archivo headings need their own figure or the same rule clips their
// caps. Any future banded section must declare which of the two it is in.
if (!/\.rooms \.marker-band::before,\s*\.meaning \.marker-band::before,\s*\.conversion \.marker-band::before\s*\{\s*inset-block:\s*0\.055em 0\.1em;\s*\}/.test(conceptCss)) {
  fail("Marker highlights in the Archivo sections must use Archivo's own measured inset");
}
if (!/\.concept-hero h1,\s*\.section-heading h2,\s*\.meaning h2\s*\{[^}]*isolation:\s*isolate;/.test(conceptCss)) {
  fail("Headings holding a marker band must isolate, or the band sinks behind the section background");
}
if (!/--page-max:\s*100%;/.test(brandCss)) {
  fail("Sections must run full bleed; the retired 96rem page cap left them narrow on wide screens");
}

// ------------------------------------------------------ crisis band, per screen
if (/\.crisis-band\s*\{[^}]*position:\s*fixed/.test(`${conceptCss}\n${sharedCss}`)
  || /\.crisis-band[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden|opacity:\s*0)/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("Crisis support must be permanent, visible, in-flow content inside every screen — never a fixed or hidden overlay");
}
if (!/\.crisis-band\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.crisis-action\s*\{[^}]*min-block-size:\s*2\.75rem;/.test(conceptCss)
  || !/\.crisis-action--signal\s*\{[^}]*background:\s*var\(--brand-yellow\);[^}]*color:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.crisis-action--outline\s*\{[^}]*border:\s*2px solid var\(--brand-off-white\);/.test(conceptCss)
  || !/\.crisis-band__label\s*\{[^}]*color:\s*var\(--brand-yellow\);/.test(conceptCss)) {
  fail("The crisis band must be navy with yellow 44px tap targets under a yellow label");
}
// "Nobody fights alone." belongs to the hero. Repeated in all five bands it
// added a third stacked row to each one, cost ~50px of every screen, and put a
// slogan where the only thing that has to be found fast is a phone number.
if (/crisis-band__(?:line|accent)/.test(`${home}\n${privacy}\n${conceptCss}\n${sharedCss}`)
  || count(home, "Nobody fights") !== 0) {
  fail("The crisis band must not repeat the hero line");
}
if (!/<div class="crisis-band__support">\s*<p class="crisis-band__label">[^<]*<\/p>\s*<p class="crisis-band__note">[^<]*<\/p>\s*<\/div>\s*<div class="crisis-band__actions">/.test(home)) {
  fail("The crisis band must be two blocks: the named helpline beside its numbers");
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
  || !/\.room__copy h3\s*\{[^}]*color:\s*var\(--brand-yellow\);/.test(conceptCss)) {
  fail("Four rooms must be a four-column grid of photo slots over navy caption blocks with yellow headings");
}
if (!/\.roadmap__list\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/.test(conceptCss)
  || !/\.roadmap-item--current\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)
  || !/\.roadmap-item--future\s*\{[^}]*background:\s*color-mix\(in oklch, var\(--brand-navy\) 13%, var\(--brand-off-white\)\);[^}]*color:\s*color-mix\(in oklch, var\(--brand-navy\) 78%, var\(--brand-off-white\)\);/.test(conceptCss)
  || /\.roadmap-item\s*\{[^}]*border-inline-end/.test(conceptCss)) {
  fail("The plan must be four cards — one dark live card and three muted Next cards — not a five-column tab row");
}

// ------------------------------------------------------------- conversion UI
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*3\.5rem;/.test(conceptCss)) {
  fail("Desktop conversion headline must use the locked display scale");
}
if (!/\.conversion__body\s*\{[^}]*max-inline-size:\s*38ch;[^}]*font-size:\s*1\.5rem;/.test(conceptCss)) {
  fail("Sign-up sub-copy must hold the 24px large-text threshold on a short measure");
}
const lateDesktopStart = conceptCss.lastIndexOf("@media (min-width: 64.0625rem)");
const mobileContractStart = conceptCss.indexOf("@media (max-width: 64rem)", lateDesktopStart + 1);
const lateDesktopCss = lateDesktopStart >= 0 && mobileContractStart > lateDesktopStart
  ? conceptCss.slice(lateDesktopStart, mobileContractStart)
  : "";
const wideDesktopStart = conceptCss.indexOf("@media (min-width: 82.0625rem)");
const wideDesktopCss = wideDesktopStart >= 0 && lateDesktopStart > wideDesktopStart
  ? conceptCss.slice(wideDesktopStart, lateDesktopStart)
  : "";
const mobileContractEnd = conceptCss.indexOf("@media (max-width: 48rem)", mobileContractStart + 1);
const mobileContractCss = mobileContractStart >= 0 && mobileContractEnd > mobileContractStart
  ? conceptCss.slice(mobileContractStart, mobileContractEnd)
  : "";
// The reviewed mock is authored at 1280px wide. Its values are reproduced as
// multiples of --u (one mock pixel), never as fixed rem, so that the design's
// RATIOS survive a 2048px screen instead of flattening. Pinning the multiplier
// pins the mock's own number, which is a stricter contract than the old rem was.
const u = (n) => String.raw`calc\(var\(--u\) \* ${n}\)`;
const desktopFeedbackContracts = [
  // Pinned, not auto. A 3:4 tile in a quarter-width column is ~630px tall on a
  // 2048px screen, which put this block 110px over one page at 1200 and 459px
  // over at 830 — the one screen you had to scroll inside. A definite height
  // gives the grid row something to shrink against.
  ["rooms screen is one page", /\.screen--rooms\s*\{[^}]*block-size:\s*100svh;/],
  ["rooms photographs take the slack", /\.rooms__grid\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-block-size:\s*0;/],
  ["rooms captions keep their height", /\.room__slot\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-block-size:\s*0;[\s\S]*?\.room__copy\s*\{[^}]*flex:\s*0 0 auto;/],
  ["reviewed scale unit", /\.screen--corner,\s*\.screen--join\s*\{\s*--u:\s*min\(0\.078125vw,\s*0.1115svh\);\s*--frame:\s*calc\(var\(--u\) \* 1280\);/],
  // Full bleed, like every other band. A centred frame held the mock's ratios
  // more exactly but left empty gutters down both sides that matched neither
  // the mock nor the rest of the page.
  ["reviewed blocks run full bleed", /\.meaning__inner,\s*\.roadmap__inner,\s*\.conversion__inner\s*\{[^}]*max-inline-size:\s*none;[^}]*margin-inline:\s*0;/],
  // Sized to content. Stretching the row to the page's leftover height is what
  // produced a ~250px card holding one word in its top corner and nothing
  // underneath; the leftover belongs to the block, split evenly above and below.
  ["plan cards are sized to their content", /\.roadmap__list\s*\{[^}]*flex:\s*0 0 auto;/],
  ["plan block padding is even", new RegExp(String.raw`\.roadmap__inner\s*\{[^}]*padding:\s*${u(56)};`)],
  ["rooms field", /\.rooms,\s*\.roadmap\s*\{[^}]*background:\s*#eef3fb;/],
  // Vertical values scale continuously with svh so a short window spends its
  // height on the photographs rather than on padding; the ceilings are still
  // the reviewed 1280px mock's own numbers, so a tall window is unchanged.
  ["rooms padding", /\.rooms__inner\s*\{[^}]*padding:\s*clamp\(1\.75rem, 4\.3svh, 3\.5rem\) 3rem clamp\(2rem, 4\.6svh, 3\.75rem\);/],
  ["rooms heading rhythm", /\.rooms__heading\s*\{[^}]*gap:\s*clamp\(0\.75rem, 1\.6svh, 1\.375rem\);/],
  ["rooms kicker", /\.rooms__heading \.eyebrow\s*\{[^}]*padding:\s*0\.625rem 1\.125rem;[^}]*font-size:\s*1\.1875rem;[^}]*font-weight:\s*700;[^}]*letter-spacing:\s*0\.14em;/],
  ["rooms heading", /\.rooms__heading h2\s*\{[^}]*max-inline-size:\s*20ch;[^}]*font-size:\s*min\(4\.5rem, 7\.2svh\);[^}]*font-weight:\s*800;[^}]*line-height:\s*0\.98;/],
  ["rooms grid", /\.rooms__grid\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);[^}]*gap:\s*1\.25rem;[^}]*margin-block-start:\s*clamp\(1\.25rem, 3\.4svh, 2\.75rem\);/],
  ["rooms portrait slots", /\.room__slot\s*\{[^}]*aspect-ratio:\s*3 \/ 4;/],
  ["rooms copy panel", /\.room__copy\s*\{[^}]*gap:\s*0\.5rem;[^}]*padding:\s*1\.125rem 1\.125rem 1\.375rem;[^}]*background:\s*#0d2b6b;/],
  ["rooms title", /\.room__copy h3\s*\{[^}]*color:\s*#f5c518;[^}]*font-size:\s*1\.5rem;/],
  ["rooms support", /\.room__copy p\s*\{[^}]*color:\s*#c6d5f2;[^}]*font-size:\s*0\.875rem;/],
  ["meaning field", /\.meaning\s*\{[^}]*min-block-size:\s*auto;[^}]*background:\s*#1273e0;/],
  // The corner mark closes the RIGHT edge. Held on the left it read as a
  // floating slab and left the band's whole right two-thirds over.
  ["meaning rail closes the right edge", new RegExp(String.raw`\.meaning__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) ${u(190)};`)],
  ["meaning divider", new RegExp(String.raw`\.meaning__mark\s*\{[^}]*grid-column:\s*2;[^}]*border-inline-end:\s*0;[^}]*border-inline-start:\s*${u(4)} solid #f5c518;[^}]*background:\s*#0d2b6b;`)],
  ["meaning corner mark", new RegExp(String.raw`\.meaning__mark::before\s*\{[^}]*inline-size:\s*${u(64)};[^}]*block-size:\s*${u(64)};[^}]*border-block-start:\s*${u(20)} solid #eef3fb;[^}]*border-inline-end:\s*${u(20)} solid #eef3fb;`)],
  // The corner screen is one page, so its bands are a zero-sum split: the height
  // the crisis band gave back goes to the manifesto, not to the plan block below
  // it, which is where the reviewed mock puts it.
  ["meaning content", new RegExp(String.raw`\.meaning__copy\s*\{[^}]*grid-column:\s*1;[^}]*gap:\s*${u(20)};[^}]*padding:\s*${u(76)} ${u(56)} ${u(80)};`)],
  ["meaning heading", new RegExp(String.raw`\.meaning h2\s*\{[^}]*font-size:\s*${u(62)};`)],
  ["meaning final marker clearance reset", /\.meaning h2:has\(> span:last-child > \.marker-band:last-child\)\s*\{[^}]*padding-block-end:\s*0;/],
  ["meaning body", new RegExp(String.raw`\.meaning__body\s*\{[^}]*max-inline-size:\s*46ch;[^}]*color:\s*#dce9fb;[^}]*font-size:\s*max\(1\.5rem, ${u(22)}\);[^}]*text-wrap:\s*pretty;[^}]*white-space:\s*normal;`)],
  ["roadmap padding", new RegExp(String.raw`\.roadmap__inner\s*\{[^}]*gap:\s*${u(22)};`)],
  ["roadmap heading", new RegExp(String.raw`\.roadmap__heading h2\s*\{[^}]*font-size:\s*${u(62)};`)],
  ["proposed-panel eyebrow leading", new RegExp(String.raw`\.meaning__copy \.eyebrow,\s*\.roadmap__heading \.eyebrow,\s*\.conversion__heading \.eyebrow\s*\{[^}]*font-size:\s*${u(15)};[^}]*line-height:\s*normal;`)],
  ["roadmap support", new RegExp(String.raw`\.roadmap__support\s*\{[^}]*color:\s*#31508f;[^}]*font-size:\s*${u(20)};[^}]*line-height:\s*normal;`)],
  ["roadmap grid", new RegExp(String.raw`\.roadmap__list\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);[^}]*gap:\s*${u(14)};[^}]*margin-block-start:\s*${u(14)};`)],
  ["roadmap cards", new RegExp(String.raw`\.roadmap-item\s*\{[^}]*gap:\s*${u(10)};[^}]*padding:\s*${u(22)} ${u(22)} ${u(24)};`)],
  ["roadmap live palette", /\.roadmap-item--current\s*\{[^}]*background:\s*#0d2b6b;[^}]*color:\s*#fff;/],
  ["roadmap future palette", /\.roadmap-item--future\s*\{[^}]*background:\s*#dbe4f4;[^}]*color:\s*#31508f;/],
  ["roadmap status", new RegExp(String.raw`\.roadmap-item__status\s*\{[^}]*font-size:\s*${u(11)};[^}]*line-height:\s*normal;`)],
  // Full navy. NEXT is the label that says a service is not live yet, and at
  // 11px the retired #5b6f9c was the least readable thing on the page: 3.91:1,
  // under the 4.5:1 small-text rule.
  ["plan NEXT label is readable", /\.roadmap-item--future \.roadmap-item__status,\s*\.roadmap-item--future \.roadmap-item__name\s*\{\s*color:\s*#0d2b6b;/],
  ["roadmap name", new RegExp(String.raw`\.roadmap-item__name\s*\{[^}]*font-size:\s*${u(28)};[^}]*line-height:\s*normal;`)],
  ["roadmap detail", new RegExp(String.raw`\.roadmap-item__detail\s*\{[^}]*font-size:\s*${u(15)};`)],
  ["signup field", /\.conversion\s*\{[^}]*background:\s*#1273e0;/],
  ["signup grid", new RegExp(String.raw`\.conversion__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 1fr\);[^}]*gap:\s*${u(48)};[^}]*padding:\s*${u(56)} ${u(56)} ${u(60)};`)],
  ["signup heading rhythm", new RegExp(String.raw`\.conversion__heading\s*\{[^}]*gap:\s*${u(26)};`)],
  ["signup heading", new RegExp(String.raw`\.conversion__heading h2\s*\{[^}]*font-size:\s*${u(56)};`)],
  ["signup body", new RegExp(String.raw`\.conversion__body\s*\{[^}]*max-inline-size:\s*38ch;[^}]*font-size:\s*max\(1\.5rem, ${u(21)}\);`)],
  ["signup panel", new RegExp(String.raw`\.conversion-path\s*\{[^}]*gap:\s*${u(22)};[^}]*padding:\s*${u(34)} ${u(34)} ${u(38)};[^}]*background:\s*#eef3fb;`)],
  ["signup signal border", new RegExp(String.raw`\.conversion-path--member\s*\{[^}]*border-block-start:\s*${u(8)} solid #f5c518;`)],
  ["signup semantic fieldset inset", new RegExp(String.raw`\.conversion \.prototype-form > fieldset\s*\{[^}]*padding-block-start:\s*${u(10)};[^}]*padding-block-end:\s*0;`)],
  ["signup title", new RegExp(String.raw`\.conversion-path h3\s*\{[^}]*font-size:\s*${u(34)};`)],
  ["signup notice", new RegExp(String.raw`\.prototype-disclosure\s*\{[^}]*padding:\s*${u(12)} ${u(14)};[^}]*border:\s*1px solid #c3d3ec;[^}]*background:\s*#dce9fb;[^}]*font-size:\s*${u(14)};`)],
  ["signup choices", new RegExp(String.raw`\.prototype-role__choices\s*\{[^}]*gap:\s*${u(12)};`)],
  ["signup field grid", new RegExp(String.raw`\.conversion \.field-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[^}]*column-gap:\s*${u(14)};`)],
  ["signup field rhythm", new RegExp(String.raw`\.conversion \.field\s*\{[^}]*gap:\s*${u(8)};`)],
  ["signup controls", new RegExp(String.raw`\.conversion \.field input\s*\{[^}]*padding:\s*${u(14)} ${u(16)};[^}]*font-size:\s*${u(16)};`)],
  ["signup CTA", new RegExp(String.raw`\.conversion-path \.button--signal\s*\{[^}]*padding:\s*${u(18)};[^}]*font-size:\s*${u(19)};`)],
  ["signup privacy", new RegExp(String.raw`\.conversion-path__note\s*\{[^}]*font-size:\s*${u(14)};`)],
];
const missingDesktopFeedback = desktopFeedbackContracts
  .filter(([, contract]) => !contract.test(lateDesktopCss))
  .map(([name]) => name);
const missingFeedbackScopes = [
  ...(!lateDesktopCss ? ["desktop ≥64.0625rem scope"] : []),
  ...(!/\.rooms__grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/.test(mobileContractCss)
    ? ["mobile ≤64rem scope"]
    : []),
  ...(/\.conversion(?:__inner|__forms|-path)\b/.test(wideDesktopCss)
    ? ["desktop contract isolated from the ≥82.0625rem hero scope"]
    : []),
];
if (missingDesktopFeedback.length || missingFeedbackScopes.length) {
  fail(`Final desktop feedback contract is incomplete: ${[...missingDesktopFeedback, ...missingFeedbackScopes].join(", ")}`);
}
if (!/@media \(max-width: 20rem\)\s*\{\s*\.rooms h2\s*\{[^}]*letter-spacing:\s*-0\.04em;/.test(conceptCss)) {
  fail("The 320px rooms heading must retain its narrow-screen tracking correction");
}
const conversionErrorRule = conceptCss.match(/\.conversion \.field-error\s*\{([^}]*)\}/)?.[1] ?? "";
for (const rule of [
  /position:\s*absolute;/,
  /inline-size:\s*1px;/,
  /block-size:\s*1px;/,
  /min-block-size:\s*0;/,
  /margin:\s*-1px;/,
  /overflow:\s*hidden;/,
  /clip:\s*rect\(0 0 0 0\);/,
  /clip-path:\s*inset\(50%\);/,
  /white-space:\s*nowrap;/,
]) {
  if (!rule.test(conversionErrorRule)) fail("Conversion field errors must remain linked, visually hidden live regions without occupying form space");
}
if (/\.conversion \.field-error[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden)/.test(conceptCss)) {
  fail("Conversion field-error live regions must never be removed from the accessibility tree");
}
if (!/const originalDisclosure = disclosure\?\.textContent \?\? "";/.test(sharedScript)
  || !/disclosure\.dataset\.originalText = originalDisclosure;/.test(sharedScript)
  || !/const syncValidationSummary = \(\) => \{/.test(sharedScript)
  || !/const hasExistingError = field\.getAttribute\("aria-invalid"\) === "true";/.test(sharedScript)
  || !/Boolean\(errorFor\(field\)\) && \(validationAttempted \|\| hasExistingError\)/.test(sharedScript)
  || !/disclosure\.textContent = message \|\| originalDisclosure;/.test(sharedScript)
  || !/disclosure\.dataset\.validationState = "error";/.test(sharedScript)
  || !/delete disclosure\.dataset\.validationState;/.test(sharedScript)
  || !/field\.addEventListener\("blur", \(\) => \{\s*renderFieldState\(form, field\);\s*syncValidationSummary\(\);\s*\}\);/.test(sharedScript)
  || !/validationAttempted = false;[\s\S]*?syncValidationSummary\(\);/.test(sharedScript)) {
  fail("The visible prototype disclosure must mirror submit and pre-submit blur errors, then restore its original notice");
}
// The disclosure reserves a fixed height at every breakpoint so a validation
// message swapping in cannot move the submit button under the cursor. On desktop
// that height is now a multiple of the mock unit rather than a rem, but it is
// still a reserved height, which is what this contract is protecting.
for (const size of ["calc(var(--u) * 41)", "4.625rem", "2.8125rem", "4.75rem", "6.6875rem"]) {
  if (!conceptCss.includes(`block-size: ${size};`)) fail(`Prototype disclosure is missing its no-shift ${size} block-size contract`);
}
if (!/\.field input\s*\{[^}]*min-block-size:\s*2\.75rem;/.test(sharedCss)
  || !/@media \(pointer: coarse\)[\s\S]*?min-block-size:\s*3\.25rem;/.test(sharedCss)) {
  fail("Inputs must hold the 44px floor and grow on coarse pointers");
}
if (!/\.prototype-disclosure\s*\{[^}]*padding:\s*0\.375rem var\(--space-sm\);[^}]*border:\s*1px solid color-mix\([^;]+\);[^}]*background:\s*color-mix\(in oklch, var\(--brand-yellow\) 9%, var\(--brand-off-white\)\);[^}]*font-size:\s*var\(--font-size-support\);[^}]*font-weight:\s*var\(--font-weight-regular\);/.test(conceptCss)
  || /\.prototype-disclosure\s*\{[^}]*(?:opacity:\s*0\s*;|font-size:\s*(?:0(?:rem|em|px)?|(?:[1-9]|1[0-3])(?:\.\d+)?px)\s*;)/.test(conceptCss)) {
  fail("Prototype disclosure must remain readable and visually quiet");
}
// The standing notice is gone from the card — the privacy page carries it and
// the CSP enforces it — but the element is NOT: it is this form's only visible
// error summary, because the per-field messages are screen-reader-only. Empty
// it must paint nothing and still hold its reserved height, or a failed submit
// either looks like nothing happened or moves the button under the cursor.
if (safetyCopy.prototypeDisclosure !== "") fail("The sign-up card must not carry a standing prototype notice");
if (!home.includes('<p class="prototype-disclosure" id="member-prototype-disclosure"></p>')) {
  fail("The error-summary element must still render, and render empty");
}
// :empty may only change what the slot PAINTS, never what it occupies. A
// margin, height or display change here stops applying the moment a message
// arrives, which moves the submit button under the cursor at the exact instant
// it was clicked. Measured at 11px and reverted; this guard is the receipt.
if (!/\.prototype-disclosure:empty\s*\{\s*border-color:\s*transparent;\s*background:\s*transparent;\s*\}/.test(conceptCss)
  || /\.prototype-disclosure:empty\s*\{[^}]*(?:display|block-size|min-block-size|visibility|margin|padding|inset)/.test(conceptCss)) {
  fail("The empty error summary must be invisible without giving up any of the space it reserves");
}
if (!/aria-describedby="member-prototype-disclosure"/.test(home) || count(home, "data-form-status") !== 1) {
  fail("The form must keep its accessible description and status wiring");
}
const roleInputRule = conceptCss.match(/\.prototype-role__choice input\s*\{([^}]*)\}/)?.[1] ?? "";
if (!/position:\s*absolute;/.test(roleInputRule)
  || !/inline-size:\s*1px;/.test(roleInputRule)
  || !/block-size:\s*1px;/.test(roleInputRule)
  || !/padding:\s*0;/.test(roleInputRule)
  || !/margin:\s*-1px;/.test(roleInputRule)
  || !/overflow:\s*hidden;/.test(roleInputRule)
  || !/clip:\s*rect\(0 0 0 0\);/.test(roleInputRule)
  || !/border:\s*0;/.test(roleInputRule)
  || !/white-space:\s*nowrap;/.test(roleInputRule)
  || /(?:display:\s*none|visibility:\s*hidden)/.test(roleInputRule)) {
  fail("Role choices must use visually hidden, focusable real radio inputs");
}
if (!/\.prototype-role__choice\s*\{[^}]*position:\s*relative;[^}]*display:\s*block;[^}]*padding:\s*0\.9375rem 1rem;[^}]*border:\s*1px solid #c3d3ec;[^}]*background:\s*#fff;[^}]*color:\s*#5b6f9c;[^}]*cursor:\s*pointer;/.test(conceptCss)) {
  fail("Role labels must retain the custom unselected choice-card treatment");
}
if (/\.prototype-role__choices:not\(:has\(input:checked\)\)\s+\.prototype-role__choice:first-child/.test(conceptCss)) {
  fail("Role choice cards must not imply a selection while no radio is checked");
}
if (!/\.prototype-role__choice:has\(input:checked\)\s*\{[^}]*padding:\s*0\.875rem 1rem;[^}]*border:\s*2px solid var\(--brand-navy\);[^}]*background:\s*#fff;[^}]*color:\s*var\(--brand-navy\);/.test(conceptCss)) {
  fail("Role choice cards must emphasize only the checked card");
}
if (!/\.prototype-role__choice:has\(input:focus-visible\)\s*\{[^}]*outline:\s*3px solid var\(--brand-navy\);[^}]*outline-offset:\s*2px;[^}]*box-shadow:\s*0 0 0 6px var\(--color-focus\);/.test(conceptCss)) {
  fail("Role choice cards must expose a visible focus affordance for their real radios");
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
