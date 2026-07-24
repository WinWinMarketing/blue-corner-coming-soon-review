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
const approvedHomeSha256 = "cb267807aa21517cf3b2d89363928f85033eaae0bf95e64f8d7ed3f4fcf1d677";
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "86c57f4478c132ae687d6857352b9eefa7cd24ee83c4ff8e7240c560ea409370",
  "assets/styles/shared.css": "1e54cbfc50352431ee3182ba29692c693311f39f811b56563e5d7beb2d421e6a",
  "assets/styles/concept-base.css": "897bc7ffd1963cf8eeb405ec222d5839a467d4ea046e365e22ded13ebffdef45",
  "assets/scripts/shared.js": "5d77e4a770625571bd3e97257be4e2be0f1e303503cc813d5d98ded91618cd36",
  "assets/art/blue-corner-reference-ring.webp": "22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2",
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
if (!home.includes('class="concept-hero__lead-line">Three in four suicides in Canada are men.</span> <span class="concept-hero__lead-line">Let that sit for a second.</span>')) {
  fail("Hero support copy must preserve the requested desktop line break with semantic text");
}
if (count(home, "data-prototype-form") !== 1 || /<form\b[^>]*\baction=/i.test(home)) fail("Root must retain one local-only form without an action");
if (count(home, 'name="role" type="radio"') !== 2 || !home.includes("<legend>I'm joining as</legend>")) fail("Root form must retain exactly two named role radios");
for (const role of ["Patient", "Therapist"]) {
  if (!home.includes(`value="${role}"`) || !home.includes(`>${role}</span>`)) fail(`Root role choice is missing ${role}`);
}
if (!/name="role"[^>]*required[^>]*aria-describedby="member-role-error"/.test(home) || count(home, "data-role-error") !== 1) {
  fail("Root role selector must have the local accessible validation contract");
}
if (!home.includes('class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">Fights <span class="concept-hero__accent">Alone.</span>')) {
  fail("Hero must keep the two-line Nobody / Fights Alone. lock with a semantic Alone. accent");
}
for (const section of ["concept-hero", "stats", "symptoms", "meaning", "roadmap", "conversion"]) {
  if (!home.includes(`class="${section}`)) fail(`Core ${section} section is missing`);
}
if (!/^\s*<header class="site-header">\s*<div class="site-header__inner page-frame">/m.test(home)) {
  fail("Homepage masthead must be full-bleed with a page-frame inner");
}
if (count(home, 'href="https://use.typekit.net/ciy6txz.css"') !== 1
  || !home.includes("style-src 'self' https://use.typekit.net;")
  || !home.includes("font-src 'self' https://use.typekit.net;")) {
  fail("Typekit stylesheet and constrained style/font CSP are required");
}
if (count(home, 'href="assets/styles/concept-base.css?v=897bc7ff"') !== 1) {
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
if (!/--font-brand:\s*"proxima-nova-condensed"/.test(brandCss) || !/--font-weight-regular:\s*400;/.test(brandCss) || !/--font-weight-semibold:\s*700;/.test(brandCss) || !/--font-size-support:\s*1rem;/.test(brandCss)) {
  fail("Brand typography must lead with Proxima Nova Condensed and use 400/700 weights");
}
for (const typographyRule of ["font-kerning: normal", "text-rendering: optimizeLegibility", 'font-feature-settings: "kern" 1, "liga" 1, "clig" 1']) {
  if (!sharedCss.includes(typographyRule)) fail(`Shared typography is missing ${typographyRule}`);
}
for (const readabilityRule of [
  /\.stat p\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.stats__sources\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.prototype-disclosure\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.5;/,
  /\.prototype-role > legend\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
  /\.field-error\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.45;/,
  /\.concept-footer__support a\s*\{[^}]*font-size:\s*var\(--font-size-support\);[^}]*line-height:\s*1\.35;/,
]) {
  if (!readabilityRule.test(`${conceptCss}\n${sharedCss}`)) fail("Supporting copy must use the readable 1rem scale");
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
if (!/@media \(min-width: 82\.0625rem\)\s*\{\s*\.site-header__inner\.page-frame,\s*\.concept-hero__inner\.page-frame\s*\{[^}]*inline-size:\s*min\(100%, 79rem\);/.test(conceptCss)) {
  fail("Only the wide-desktop masthead and hero must use the tightened 79rem frame");
}
if (!/@media \(min-width: 82\.0625rem\)\s*\{[\s\S]*?\.concept-hero h1\s*\{[^}]*font-size:\s*7\.25rem;/.test(conceptCss)) {
  fail("Wide-desktop hero display must cap at 7.25rem to preserve the image gap");
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
