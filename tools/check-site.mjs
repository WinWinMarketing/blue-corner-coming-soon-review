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
const approvedHomeSha256 = "d8a3cff83f9b1a9d21f5268ff61943c7993f4edf81764eae2d1ffeb07cf62255";
const approvedAssets = Object.freeze({
  "assets/styles/brand.css": "7ee7f24f04f7cc6c14ca3eaffc9c5e263342cc60b9070d3c35460e3cee5c3613",
  "assets/styles/shared.css": "30af41cf2be7a0951e4e123702da7263c9fd2bb3f5f63a791cd3065665d7dc60",
  "assets/styles/concept-base.css": "9f7823347ce45c7c0603d3d72abad04d2ff48598eacabf02fdc54a83cff0b557",
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
if (count(home, 'href="assets/styles/concept-base.css?v=9f782334"') !== 1) {
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
if (!/--font-brand:\s*"proxima-nova-condensed"/.test(brandCss) || !/--font-weight-regular:\s*400;/.test(brandCss) || !/--font-weight-semibold:\s*700;/.test(brandCss)) {
  fail("Brand typography must lead with Proxima Nova Condensed and use 400/700 weights");
}
for (const typographyRule of ["font-kerning: normal", "text-rendering: optimizeLegibility", 'font-feature-settings: "kern" 1, "liga" 1, "clig" 1']) {
  if (!sharedCss.includes(typographyRule)) fail(`Shared typography is missing ${typographyRule}`);
}
if (!/\.concept-hero__accent\s*\{[^}]*color:\s*var\(--brand-blue\);/.test(conceptCss) || !/letter-spacing:\s*-0\.035em;/.test(conceptCss)) {
  fail("Hero accent and restrained condensed-display tracking are required");
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
