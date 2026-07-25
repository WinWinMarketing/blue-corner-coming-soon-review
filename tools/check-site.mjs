import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { referenceHero } from "./source-copy.mjs";
import { renderHomePage } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const failures = [];
const strictImages = process.argv.includes("--strict-images");
const approvedHomeSha256 = "29716de9238a99e8b3b2958ed59b20384e1ddc70d23c35e721dbcf436fd08f06";
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "a80fc3111bf8b07398eb344d855e302a1e748678d6164c0f1999cee842cf25f6",
  "assets/styles/shared.css": "96271ccef58c41144f4124397f7984792afb4928011deeaa26d6b0ef3842ec68",
  "assets/styles/concept-base.css": "5b0f978d61fcc2ee2c3d401a1049e124f8cadc76061f410a2dee483dc2cceb8c",
  "assets/scripts/boot.js": "7d7ce8cadca26959367c68f2ac381e0fe661a3a7a1f4eeb3b514c07326f90f1e",
  "assets/scripts/shared.js": "c15703cd87d196be855dd729dc2c4b4f48a33e11e6d42b8db7cbd6f6b67e97fc",
  "assets/art/blue-corner-reference-ring.webp": "22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2",
  "assets/art/blue-corner-reference-ring-brand-v3.webp": "ac190f623adc1e2f7cd474853c39917912ea381c8657a69c8c278ebbd497ea84",
});
const bootScriptCacheKey = approvedAssets["assets/scripts/boot.js"].slice(0, 8);
const sharedScriptCacheKey = approvedAssets["assets/scripts/shared.js"].slice(0, 8);
const sharedCssCacheKey = approvedAssets["assets/styles/shared.css"].slice(0, 8);
const conceptCssCacheKey = approvedAssets["assets/styles/concept-base.css"].slice(0, 8);
const heroCacheKey = approvedAssets["assets/art/blue-corner-reference-ring-brand-v3.webp"].slice(0, 8);

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
    if (reference.startsWith("/assets")) fail(`Root page must use project-relative assets, not ${reference}`);
    const target = path.resolve(path.dirname(htmlPath), reference.split(/[?#]/, 1)[0]);
    const result = await exists(target);
    if (!result) {
      const message = `Missing local reference: ${reference}`;
      if (strictImages || !reference.includes("assets/art/")) fail(message);
    }
  }
};

const indexPath = path.join(rootDirectory, "index.html");
const home = await readFile(indexPath, "utf8");
if (home !== renderHomePage()) fail("Root index.html is stale; run node tools/generate.mjs");
if (createHash("sha256").update(home).digest("hex") !== approvedHomeSha256) fail("Root homepage hash changed from the approved baseline");

const rootEntries = await readdir(rootDirectory, { withFileTypes: true });
if (rootEntries.some((entry) => entry.name === "concepts")) fail("Public concepts directory must not exist");
if (rootEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".html")).map((entry) => entry.name).join("|") !== "index.html") {
  fail("Root must expose exactly one HTML page: index.html");
}
for (const removedPath of ["assets/styles/gallery.css", "tools/concepts.mjs", "CONCEPT-GOALS.md"]) {
  if (await exists(path.join(rootDirectory, removedPath))) fail(`${removedPath} must be removed with the retired variants`);
}

if (!home.includes('<body class="concept-page">')) fail("Root must retain the canonical homepage body");
if (/(?:concept-addition|data-module|data-concept-nav|gallery-|Twelve ways|Concept add-on)/i.test(home)) fail("Root homepage includes retired gallery or variant markup");
if (home.includes("Designer review only")) fail("Root must not expose the retired editorial review note");
if (!home.includes('class="concept-hero__lead-line"><span class="concept-hero__underline">Three</span> in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">Let that sit for a second.</span>')) {
  fail("Hero support copy must preserve the locked lines and yellow Three underline");
}
if (home.includes('The guy who looks fine, says "good" when you ask, and is quietly running on empty.')) fail("Retired hero sentence must remain removed");
if (count(home, "data-prototype-form") !== 1 || /<form\b[^>]*\baction=/i.test(home)) fail("Root must retain one local-only form without an action");
if (count(home, 'name="role" type="radio"') !== 2 || !home.includes("<legend>I'm joining as</legend>")) fail("Root form must retain exactly two named role radios");
for (const role of ["Patient", "Therapist"]) {
  if (!home.includes(`value="${role}"`) || !home.includes(`>${role}</span>`)) fail(`Root role choice is missing ${role}`);
}
if (!/name="role"[^>]*required[^>]*aria-describedby="member-role-error"/.test(home) || count(home, "data-role-error") !== 1) {
  fail("Root role selector must have the local accessible validation contract");
}
if (!home.includes('class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">Fights <span class="concept-hero__accent concept-hero__underline">Alone.</span>')) {
  fail("Hero must keep the two-line lock with blue and yellow-underlined Alone.");
}
for (const section of ["concept-hero", "stats", "symptoms", "meaning", "roadmap", "conversion"]) {
  if (!home.includes(`class="${section}`)) fail(`Core ${section} section is missing`);
}
if (!/^\s*<header class="site-header">\s*<div class="site-header__inner page-frame">/m.test(home)) {
  fail("Homepage masthead must be full-bleed with a page-frame inner");
}
if (!/<nav class="site-header__actions"[^>]*>[\s\S]*?Get early access[\s\S]*?Therapists, join us[\s\S]*?<\/nav>/.test(home) || home.includes("concept-hero__actions")) {
  fail("Both hero actions must live only in the compact masthead");
}
if (count(home, 'href="https://use.typekit.net/ciy6txz.css"') !== 1
  || !home.includes("style-src 'self' https://use.typekit.net;")
  || !home.includes("font-src 'self' https://use.typekit.net;")) {
  fail("Typekit stylesheet and constrained style/font CSP are required");
}
if (count(home, `href="assets/styles/concept-base.css?v=${conceptCssCacheKey}"`) !== 1) {
  fail("Homepage must version the corrected core stylesheet for cache refresh");
}
if (count(home, `href="assets/styles/shared.css?v=${sharedCssCacheKey}"`) !== 1) {
  fail("Homepage must version reveal styles with the first eight characters of their approved SHA-256");
}
if (count(home, `src="assets/scripts/boot.js?v=${bootScriptCacheKey}"`) !== 1
  || home.indexOf(`src="assets/scripts/boot.js?v=${bootScriptCacheKey}"`) > home.indexOf('<link rel="stylesheet"')
  || /<script[^>]+src="assets\/scripts\/boot\.js[^"]*"[^>]+(?:async|defer)/.test(home)) {
  fail("Homepage must load the versioned reveal boot synchronously before styles");
}
if (count(home, `src="assets/scripts/shared.js?v=${sharedScriptCacheKey}"`) !== 1) {
  fail("Homepage must version shared.js with the first eight characters of its approved SHA-256");
}
if (count(home, `src="assets/art/${referenceHero.image}?v=${heroCacheKey}"`) !== 1
  || count(home, `assets/art/${referenceHero.image}?v=${heroCacheKey}`) !== 2
  || /(?:href|src)="\/assets\//.test(home)) {
  fail("Homepage assets must be project-relative and use the approved hero");
}
if (!home.includes('alt="An empty boxing-ring corner with yellow ropes, a dark navy corner pad, a black wall, a gray floor, and a black stool."')) {
  fail("Hero alt text must accurately describe the recoloured original");
}
await checkLocalReferences(home, indexPath);

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
  /\.symptoms \.symptom:nth-child\(4\)/,
  /\.roadmap__list \.roadmap-item:nth-child\(5\)/,
  /\.conversion-path\[data-reveal\]/,
]) {
  if (!staggerContract.test(sharedCss)) fail("Reveal stagger must remain short, CSS-defined, and applied to section wrappers and repeated rows");
}
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
  /\.stat p\s*\{[^}]*font-size:\s*clamp\([^;]*\);[^}]*line-height:\s*1\.4;/,
  /\.stats__sources\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.prototype-disclosure\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.prototype-role > legend\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
  /\.field-error\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.45;/,
  /\.concept-footer__support a\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
]) {
  if (!readabilityRule.test(`${conceptCss}\n${sharedCss}`)) fail("Supporting copy must use the readable scale");
}
if (!/\.eyebrow\s*\{[^}]*max-inline-size:\s*min\(100%, 34ch\);[^}]*background:\s*var\(--brand-yellow\);[^}]*color:\s*var\(--brand-navy\);[^}]*font-size:\s*clamp\([^;]*\);/.test(sharedCss)) {
  fail("Eyebrows must use the readable navy-on-yellow two-line treatment");
}
if (!/html\s*\{[^}]*min-inline-size:\s*20rem;/.test(sharedCss)
  || !/body\s*\{[^}]*min-inline-size:\s*20rem;/.test(sharedCss)
  || !/@media \(max-width: 20rem\)\s*\{\s*html,\s*body\s*\{\s*min-inline-size:\s*0;\s*\}\s*\}/.test(sharedCss)) {
  fail("The desktop width floor must release exactly at 20rem so 320px viewports do not overflow");
}
if (count(home, 'class="marker-band"') !== 5
  || !home.includes('<span class="marker-band">worse.</span>')
  || !home.includes('<span class="marker-band">A Corner.</span>')
  || !home.includes('<span class="marker-band">therapy.</span>')
  || !home.includes('<span class="marker-band">Therapy</span>')
  || !home.includes('<span class="marker-band">one</span>')) {
  fail("The five approved marker-band highlights must remain");
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
if (!/\.concept-hero h1,\s*\.section-heading h2,\s*\.meaning h2\s*\{[^}]*isolation:\s*isolate;/.test(conceptCss)
  || !/\.roadmap-item__name\s*\{[^}]*isolation:\s*isolate;/.test(conceptCss)) {
  fail("Headings holding a marker band must isolate, or the band sinks behind the section background");
}
if (!/--page-max:\s*100%;/.test(brandCss)) {
  fail("Sections must run full bleed; the retired 96rem page cap left them narrow on wide screens");
}
if (/\.concept-footer__support\s*\{[^}]*position:\s*fixed/.test(sharedCss)) {
  fail("Crisis support must be permanent, visible footer content, not a focus-only overlay");
}
if (!/<footer class="concept-footer">\s*<div class="concept-footer__bar page-frame">[\s\S]*?<\/div>\s*<img class="concept-footer__wordmark"/.test(home)) {
  fail("Footer must open with its content bar above the wordmark");
}
const crisisLinks = [
  '<a href="tel:988">Call 9-8-8</a>',
  '<a href="sms:988">Text 9-8-8</a>',
  "Crisis resources</a>",
  '<a href="tel:911">Call 9-1-1 for immediate danger</a>',
];
if (crisisLinks.some((link) => count(home, link) !== 1)
  || !/@media \(max-width: 47\.99rem\)[\s\S]*?\.concept-footer__support\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?\.concept-footer__support a\s*\{[^}]*min-block-size:\s*2\.75rem;/.test(sharedCss)
  || /\.concept-footer__support[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden|opacity:\s*0)/.test(`${conceptCss}\n${sharedCss}`)) {
  fail("All four crisis links must stay visible in order with 44px mobile targets and a readable two-column reflow");
}
if (!/@media \(min-width: 64\.0625rem\)[\s\S]*?\.roadmap\s*\{[^}]*min-block-size:\s*100svh;/.test(conceptCss)) {
  fail("The roadmap must be its own full desktop page");
}
if (/scroll-snap/.test(`${conceptCss}\n${sharedCss}\n${brandCss}`)) {
  fail("Scroll snapping must stay off; scrolling is never locked to a block");
}
if (!/html\s*\{[^}]*scroll-behavior:\s*auto;/.test(sharedCss)
  || /scroll-behavior:\s*smooth/.test(`${conceptCss}\n${sharedCss}\n${brandCss}`)) {
  fail("Page scrolling must remain native and immediate; forced smooth scrolling is not allowed");
}
if (!/<div class="corner-block">[\s\S]*?<section class="symptoms page-frame"[\s\S]*?<section class="meaning"[\s\S]*?<\/div>/.test(home)
  || !/@media \(min-width: 64\.0625rem\)[\s\S]*?\.corner-block\s*\{[^}]*min-block-size:\s*100svh;/.test(conceptCss)) {
  fail("Symptoms and the manifesto must share one desktop page inside .corner-block");
}
if (!/@media \(min-width: 64\.0625rem\) and \(max-height: 50rem\)\s*\{\s*\.stats__inner\s*\{\s*padding-block:\s*clamp\(0\.75rem, 1\.8svh, 3rem\);\s*\}\s*\.meaning\s*\{\s*min-block-size:\s*21rem;\s*\}\s*\.meaning__copy\s*\{\s*padding-block:\s*clamp\(0\.75rem, 1\.8svh, 3rem\);\s*\}\s*\}/.test(conceptCss)) {
  fail("Short desktop viewports must compact only stats/manifesto padding and the manifesto height floor");
}
if (!/\.meaning__inner\s*\{[^}]*grid-template-columns:\s*12\.6% minmax\(0, 87\.4%\);/.test(conceptCss)
  || !/\.stats__heading h2\s*\{[^}]*font-size:\s*clamp\(3\.75rem, min\(7\.6vw, 16svh\), 10rem\);/.test(conceptCss)) {
  fail("Compact-height spacing must preserve the manifesto rail ratio and statistics display type");
}
const symptomsGrid = home.match(/<div class="symptoms__grid">([\s\S]*?)<\/div>/)?.[1] ?? "";
if (/<p[\s>]/.test(symptomsGrid) || count(symptomsGrid, '<article class="symptom"') !== 4 || count(symptomsGrid, "<h3>") !== 4) {
  fail("Symptoms must stay heading-only: four statements, no supporting paragraphs");
}
if (count(home, 'class="meaning__body-line"') !== 2 || !home.includes("That&#39;s what this is.</span>")) {
  fail("Manifesto body must retain its two deliberate desktop lines");
}
if (count(home, "roadmap-item--current") !== 1 || count(home, "roadmap-item--future") !== 4) {
  fail("Roadmap must keep one dominant Therapy item and four muted future services");
}
if (!/\.concept-hero__accent\s*\{[^}]*color:\s*var\(--brand-blue\);/.test(conceptCss) || !/letter-spacing:\s*-0\.035em;/.test(conceptCss)) {
  fail("Hero accent and restrained condensed-display tracking are required");
}
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*clamp\(4\.5rem, 9\.17vw, 12rem\);/.test(conceptCss)) {
  fail("Desktop conversion headline must use the locked hero display scale");
}
if (!/@media \(min-width: 48\.0625rem\) and \(max-width: 64rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*clamp\(4rem, 7\.2vw, 4\.75rem\);/.test(conceptCss)) {
  fail("Intermediate conversion headline must match the hero display scale");
}
if (/inline-size:\s*min\(100%, 79rem\)/.test(conceptCss)) {
  fail("Hero and masthead must span the full page frame, not the retired 79rem width");
}
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.concept-hero\s*\{[\s\S]*?min-block-size:\s*calc\(100svh - var\(--header-h\)\);/.test(conceptCss)
  || !/--header-h:\s*clamp\(5\.5rem, 7vw, 6rem\);/.test(conceptCss)) {
  fail("Header plus hero must fit one desktop viewport (svh-based hero height)");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.concept-hero h1\s*\{[^}]*font-size:\s*clamp\(7\.5rem, 7\.7vw, 10\.2rem\);/.test(conceptCss)
  || !/@media \(min-width: 75rem\)\s*\{\s*\.roadmap__heading h2\s*\{\s*font-size:\s*clamp\(3\.75rem, 6\.94vw, 7\.9rem\);\s*\}[\s\S]*?\.roadmap__heading h2 span\s*\{\s*white-space:\s*nowrap;/.test(conceptCss)) {
  fail("Wide-desktop hero and roadmap display must preserve their locked lines with at least 12px container safety");
}
if (/html\s*\{[^}]*overflow-x:\s*(?:hidden|clip);/.test(sharedCss)
  || /\.concept-hero h1\s*\{[^}]*overflow(?:-x)?:\s*(?:hidden|clip);/.test(conceptCss)
  || /\.roadmap__heading h2\s*\{[^}]*overflow(?:-x)?:\s*(?:hidden|clip);/.test(conceptCss)) {
  fail("Desktop headline fit must come from responsive typography, not root or heading overflow clipping");
}
if (!/\.site-header__actions \.button\s*\{[^}]*min-block-size:\s*2\.75rem;[^}]*font-size:\s*1\.1875rem;/.test(conceptCss)
  || !/\.concept-hero__inner\s*\{[^}]*row-gap:\s*clamp\(0\.75rem, 1\.2vw, 1rem\);[^}]*min-block-size:\s*clamp\(35rem, 43vw, 39\.5rem\);/.test(conceptCss)) {
  fail("Compact masthead and desktop hero fit contract is missing");
}
if (!/\.stats__sources\s*\{[^}]*grid-template-columns:\s*1fr;/.test(conceptCss)
  || /\.stats__grid\s*\{[^}]*border-block/.test(conceptCss)) {
  fail("Statistics must keep stacked sources and vertical dividers only");
}
if (!/\.roadmap__list\s*\{[^}]*grid-template-columns:[^}]*\}[^@]*?\.roadmap-item\s*\{[^}]*border-inline-end:\s*1px solid var\(--brand-navy\);/.test(conceptCss)
  || /\.roadmap__list\s*\{[^}]*border-block/.test(conceptCss)
  || !/\.roadmap__list\s*\{[^}]*margin:\s*clamp\(1\.5rem, 2\.4vw, 2\.25rem\) 0 clamp\(0\.75rem, 1\.4svh, 1\.25rem\);/.test(conceptCss)
  || !/@media \(min-width: 64\.0625rem\)[\s\S]*?\.roadmap__list\s*\{[^}]*flex:\s*0 0 auto;[^}]*block-size:\s*clamp\(22rem, 48svh, 27rem\);[^}]*max-block-size:\s*27rem;/.test(conceptCss)
  || !/@media \(min-width: 64\.0625rem\) and \(max-height: 55rem\)\s*\{\s*\.roadmap\s*\{[^}]*padding-block:\s*clamp\(2rem, 4svh, 3rem\);/.test(conceptCss)
  || !/\.roadmap-item--future\s*\{[^}]*background:\s*color-mix\(in oklch, var\(--brand-navy\) 13%, var\(--brand-off-white\)\);[^}]*color:\s*color-mix\(in oklch, var\(--brand-navy\) 78%, var\(--brand-off-white\)\);/.test(conceptCss)) {
  fail("Roadmap must keep five columns and the exact bounded 48svh desktop table with short-height breathing room");
}
if (count(impeccableSpec, "720px maximum card") !== 1 || impeccableSpec.includes("680px maximum card")) {
  fail("Impeccable specification must pin the conversion card maximum to 720px");
}
if (!/\.meaning__body\s*\{[^}]*max-inline-size:\s*58ch;/.test(conceptCss)
  || !/@media \(min-width: 88rem\)\s*\{[\s\S]*?\.meaning__body-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;[\s\S]*?\.meaning__body\s*\{[^}]*max-inline-size:\s*none;/.test(conceptCss)) {
  fail("Desktop manifesto body must hold its two deliberate lines");
}
if (count(home, 'class="conversion__body-line"') !== 2
  || !home.includes('<span class="conversion__body-line">Founding members get in ahead of everyone.</span> <span class="conversion__body-line">Leave your details and we&#39;ll reach out the moment we open.</span>')
  || !/@media \(min-width: 82\.0625rem\)[\s\S]*?\.conversion__body-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;/.test(conceptCss)) {
  fail("Wide-desktop conversion body must preserve the approved copy in exactly two locked lines");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.conversion__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 45rem\);/.test(conceptCss)
  || !/\.conversion__forms\s*\{[^}]*max-inline-size:\s*45rem;/.test(conceptCss)) {
  fail("Wide-desktop conversion form must use the responsive 45rem track");
}
if (!/\.conversion__forms\s*\{[^}]*align-self:\s*start;/.test(conceptCss)
  || !/\.conversion-path\s*\{[^}]*align-self:\s*start;[^}]*padding:\s*1\.25rem clamp\(1\.5rem, 2vw, 1\.75rem\);/.test(conceptCss)
  || !/\.conversion-path h3\s*\{[^}]*margin:\s*var\(--space-sm\) 0;/.test(conceptCss)
  || !/@media \(min-width: 48\.0625rem\) and \(max-width: 64rem\)\s*\{[\s\S]*?\.conversion-path\s*\{[^}]*padding-block:\s*var\(--space-md\);[\s\S]*?\.conversion \.prototype-form fieldset\s*\{[^}]*gap:\s*var\(--space-sm\);[\s\S]*?\.conversion \.field-error:empty\s*\{[^}]*min-block-size:\s*0;/.test(conceptCss)) {
  fail("Conversion card must self-start and retain its compact desktop spacing contract");
}
if (!/\.prototype-disclosure\s*\{[^}]*padding:\s*0\.375rem var\(--space-sm\);[^}]*border:\s*1px solid color-mix\([^;]+\);[^}]*background:\s*color-mix\(in oklch, var\(--brand-yellow\) 9%, var\(--brand-off-white\)\);[^}]*font-size:\s*var\(--font-size-support\);[^}]*font-weight:\s*var\(--font-weight-regular\);/.test(conceptCss)
  || /\.prototype-disclosure\s*\{[^}]*(?:opacity:\s*0|font-size:\s*(?:0\.|[1-9][0-9]?px))/.test(conceptCss)
  || /\.prototype-role__choice:has\(input:checked\)\s*\{[^}]*border-width/.test(conceptCss)
  || !/\.prototype-role__choice:has\(input:checked\)\s*\{[^}]*outline:\s*2px solid var\(--brand-navy\);/.test(conceptCss)) {
  fail("Prototype disclosure and checked radios must be quieter without reduced legibility or layout-shifting borders");
}
if (!/@media \(max-width: 48rem\)[\s\S]*?\.stats__sources,\s*\.prototype-disclosure,\s*\.conversion-path__note\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.55;/.test(conceptCss)) {
  fail("Mobile source and prototype/legal text must remain at least 1rem with comfortable leading");
}
if (!/:focus-visible\s*\{[^}]*outline:\s*3px solid/.test(sharedCss)
  || !/@media \(forced-colors: active\)[\s\S]*?:focus-visible\s*\{[^}]*outline:\s*3px solid Highlight;/.test(sharedCss)
  || !/@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.button:hover/.test(sharedCss)) {
  fail("Interactive states must retain 3px focus rings, forced-colors distinction, and pointer-gated hover");
}
if (!/\.meaning\s*\{[^}]*background:\s*var\(--brand-blue\);/.test(conceptCss) || !/\.meaning__mark\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)) {
  fail("Manifesto must retain its navy rail and bright-blue content field");
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
if (/\.js\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/.test(sharedCss)) fail("Core content must remain visible without JavaScript");

if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Site check passed for the canonical homepage${strictImages ? " with strict images" : ""}.`);
}
