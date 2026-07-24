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
const approvedHomeSha256 = "b647cce7e05850bfe8f195183650d1e98fa791800b8c5d24d0148c5d3aa3541e";
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "a49a7859dea92a8c092f751d61f68c6f86a3b82521c8bef868cf1e330697a478",
  "assets/styles/shared.css": "3198759ed41f78f8719a9355f9c48868c8473f0fb9d10b71be368073921e20ad",
  "assets/styles/concept-base.css": "706bf81692a4382bbb0221881178036d51aaa3b0e6f7f65ca999d72b5efcb34e",
  "assets/scripts/shared.js": "5d77e4a770625571bd3e97257be4e2be0f1e303503cc813d5d98ded91618cd36",
  "assets/art/blue-corner-reference-ring-brand-v2.webp": "b7681e542ac272951e5be0d86ce6c6eae06f5e10a5fb73293a751da3ee4bf4db",
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
if (count(home, 'href="assets/styles/concept-base.css?v=706bf816"') !== 1) {
  fail("Homepage must version the corrected core stylesheet for cache refresh");
}
if (!home.includes(`src="assets/art/${referenceHero.image}"`) || /(?:href|src)="\/assets\//.test(home)) {
  fail("Homepage assets must be project-relative and use the approved hero");
}
await checkLocalReferences(home, indexPath);

for (const [relativePath, expectedHash] of Object.entries(approvedAssets)) {
  const actualHash = createHash("sha256").update(await readFile(path.join(rootDirectory, relativePath))).digest("hex");
  if (actualHash !== expectedHash) fail(`${relativePath} changed from the approved baseline`);
}

const brandCss = await readFile(path.join(rootDirectory, "assets/styles/brand.css"), "utf8");
const sharedCss = await readFile(path.join(rootDirectory, "assets/styles/shared.css"), "utf8");
const conceptCss = await readFile(path.join(rootDirectory, "assets/styles/concept-base.css"), "utf8");
const sharedScript = await readFile(path.join(rootDirectory, "assets/scripts/shared.js"), "utf8");
if (!/--font-brand:\s*"proxima-nova-condensed"/.test(brandCss) || !/--font-weight-regular:\s*400;/.test(brandCss) || !/--font-weight-semibold:\s*700;/.test(brandCss) || !/--font-size-support:\s*1\.125rem;/.test(brandCss)) {
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
if (count(home, 'class="meaning__body-line"') !== 2 || !home.includes("That&#39;s what this is.</span>")) {
  fail("Manifesto body must retain its two deliberate desktop lines");
}
if (count(home, "roadmap-item--current") !== 1 || count(home, "roadmap-item--future") !== 4) {
  fail("Roadmap must keep one dominant Therapy item and four muted future services");
}
if (!/\.concept-hero__accent\s*\{[^}]*color:\s*var\(--brand-blue\);/.test(conceptCss) || !/letter-spacing:\s*-0\.035em;/.test(conceptCss)) {
  fail("Hero accent and restrained condensed-display tracking are required");
}
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*clamp\(4\.5rem, 9\.17vw, 8\.25rem\);/.test(conceptCss)) {
  fail("Desktop conversion headline must use the locked hero display scale");
}
if (!/@media \(min-width: 48\.0625rem\) and \(max-width: 64rem\)\s*\{\s*\.conversion__heading h2\s*\{[^}]*font-size:\s*clamp\(4rem, 7\.2vw, 4\.75rem\);/.test(conceptCss)) {
  fail("Intermediate conversion headline must match the hero display scale");
}
if (/inline-size:\s*min\(100%, 79rem\)/.test(conceptCss)) {
  fail("Hero and masthead must span the full page frame, not the retired 79rem width");
}
if (!/@media \(min-width: 64\.0625rem\)\s*\{\s*\.concept-hero\s*\{[^}]*min-block-size:\s*calc\(100svh - var\(--header-h\) - var\(--signal-bar\)\);/.test(conceptCss)) {
  fail("Header plus hero must fit one desktop viewport (svh-based hero height)");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.concept-hero h1\s*\{[^}]*font-size:\s*7\.25rem;/.test(conceptCss)) {
  fail("Wide-desktop hero display must cap at 7.25rem to preserve the image gap");
}
if (!/\.site-header__actions \.button\s*\{[^}]*min-block-size:\s*2\.75rem;[^}]*font-size:\s*1rem;/.test(conceptCss)
  || !/\.concept-hero__inner\s*\{[^}]*row-gap:\s*clamp\(0\.75rem, 1\.2vw, 1rem\);[^}]*min-block-size:\s*clamp\(35rem, 43vw, 39\.5rem\);/.test(conceptCss)) {
  fail("Compact masthead and desktop hero fit contract is missing");
}
if (!/\.stats__sources\s*\{[^}]*grid-template-columns:\s*1fr;/.test(conceptCss)
  || /\.stats__grid\s*\{[^}]*border-block/.test(conceptCss)) {
  fail("Statistics must keep stacked sources and vertical dividers only");
}
if (!/\.roadmap__list\s*\{[^}]*grid-template-columns:[^}]*\}[^@]*?\.roadmap-item\s*\{[^}]*border-inline-end:\s*1px solid var\(--brand-navy\);/.test(conceptCss)
  || /\.roadmap__list\s*\{[^}]*border-block/.test(conceptCss)
  || !/\.roadmap-item--future\s*\{[^}]*background:\s*color-mix\(in oklch, var\(--brand-navy\) 13%, var\(--brand-off-white\)\);[^}]*color:\s*var\(--color-muted\);/.test(conceptCss)) {
  fail("Roadmap must stay dense with vertical dividers and muted future services");
}
if (!/@media \(min-width: 80rem\)\s*\{[\s\S]*?\.meaning__body-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;/.test(conceptCss)) {
  fail("Desktop manifesto body must hold its two deliberate lines");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.conversion__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 40\.625rem\);/.test(conceptCss)) {
  fail("Wide-desktop 650px conversion form track is required");
}
if (!/\.conversion__forms\s*\{[^}]*align-self:\s*start;/.test(conceptCss)
  || !/\.conversion-path\s*\{[^}]*align-self:\s*start;[^}]*padding:\s*1\.25rem clamp\(1\.5rem, 2vw, 1\.75rem\);/.test(conceptCss)
  || !/\.conversion-path h3\s*\{[^}]*margin:\s*var\(--space-sm\) 0;/.test(conceptCss)
  || !/@media \(min-width: 48\.0625rem\) and \(max-width: 64rem\)\s*\{[\s\S]*?\.conversion-path\s*\{[^}]*padding-block:\s*var\(--space-md\);[\s\S]*?\.conversion \.prototype-form fieldset\s*\{[^}]*gap:\s*var\(--space-sm\);[\s\S]*?\.conversion \.field-error:empty\s*\{[^}]*min-block-size:\s*0;/.test(conceptCss)) {
  fail("Conversion card must self-start and retain its compact desktop spacing contract");
}
if (!/\.meaning\s*\{[^}]*background:\s*var\(--brand-blue\);/.test(conceptCss) || !/\.meaning__mark\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptCss)) {
  fail("Manifesto must retain its navy rail and bright-blue content field");
}
if (/(?:concept-addition|data-module|data-concept-nav|initializeSentenceStarter|navigator\.clipboard|localStorage|sessionStorage|fetch\()/.test(sharedScript)) {
  fail("Shared runtime includes retired variant or privacy-sensitive behavior");
}
if (/\.js\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/.test(sharedCss)) fail("Core content must remain visible without JavaScript");

if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Site check passed for the canonical homepage${strictImages ? " with strict images" : ""}.`);
}
