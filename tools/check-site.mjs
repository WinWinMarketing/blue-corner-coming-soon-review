import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { concepts } from "./concepts.mjs";
import { sourceCopy } from "./source-copy.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const failures = [];
const warnings = [];
const strictImages = process.argv.includes("--strict-images");

const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const exists = async (target) => {
  try {
    return await stat(target);
  } catch {
    return null;
  }
};

const count = (value, token) => value.split(token).length - 1;
const visibleSourceStrings = [
  sourceCopy.header.name,
  sourceCopy.header.launch,
  ...Object.values(sourceCopy.hero),
  sourceCopy.stats.eyebrow,
  sourceCopy.stats.heading,
  ...sourceCopy.stats.items.flatMap((item) => [item.value, item.label]),
  sourceCopy.stats.source,
  sourceCopy.stats.gamblingSource,
  sourceCopy.symptoms.eyebrow,
  sourceCopy.symptoms.heading,
  ...sourceCopy.symptoms.items.flatMap((item) => [item.heading, item.body]),
  ...Object.values(sourceCopy.meaning),
  sourceCopy.roadmap.eyebrow,
  sourceCopy.roadmap.heading,
  ...sourceCopy.roadmap.items.flatMap((item) => [item.name, item.status]),
  sourceCopy.conversion.eyebrow,
  sourceCopy.conversion.heading,
  sourceCopy.conversion.body,
  ...Object.values(sourceCopy.conversion.member),
  ...Object.values(sourceCopy.conversion.therapist),
  ...sourceCopy.conversion.fields.flatMap((field) => [field.label, field.placeholder]),
  ...Object.values(sourceCopy.footer),
];

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const checkLocalReferences = async (html, htmlPath) => {
  const referencePattern = /\b(?:href|src)="([^"]+)"/g;
  for (const match of html.matchAll(referencePattern)) {
    const reference = match[1];
    if (/^(?:https?:|tel:|sms:|mailto:|data:|#)/.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/, 1)[0];
    const resolved = path.resolve(path.dirname(htmlPath), cleanReference);
    const result = await exists(resolved);
    if (!result) {
      const relativeHtml = path.relative(rootDirectory, htmlPath);
      if (/assets[\\/]art[\\/]blue-corner-\d{2}-/.test(resolved)) {
        const message = `${relativeHtml}: planned image is not present yet (${reference})`;
        if (strictImages) fail(message);
        else warn(message);
      } else {
        fail(`${relativeHtml}: missing local reference ${reference}`);
      }
      continue;
    }
    if (result.isDirectory() && !(await exists(path.join(resolved, "index.html")))) {
      fail(`${path.relative(rootDirectory, htmlPath)}: directory link has no index.html (${reference})`);
    }
  }
};

const sectionOrder = ["concept-hero", "stats", "symptoms", "meaning", "roadmap", "conversion"];

for (const concept of concepts) {
  const htmlPath = path.join(rootDirectory, "concepts", concept.slug, "index.html");
  const stylePath = path.join(rootDirectory, "concepts", concept.slug, "style.css");
  if (!(await exists(htmlPath))) {
    fail(`${concept.slug}: index.html was not generated`);
    continue;
  }
  if (!(await exists(stylePath))) fail(`${concept.slug}: style.css is missing`);

  const html = await readFile(htmlPath, "utf8");
  if (!html.includes("noindex, nofollow, noarchive")) fail(`${concept.slug}: noindex metadata is missing`);
  if (!html.includes("Content-Security-Policy")) fail(`${concept.slug}: CSP metadata is missing`);
  if (!html.includes("connect-src 'none'; form-action 'none'")) fail(`${concept.slug}: CSP does not block data submission`);
  if (count(html, "data-prototype-form") !== 2) fail(`${concept.slug}: expected two prototype forms`);
  if (count(html, "<fieldset") !== 2) fail(`${concept.slug}: expected two form fieldsets`);
  if (count(html, "<h1") !== 1) fail(`${concept.slug}: expected exactly one h1`);
  if (count(html, "data-fallback-image") < 1) fail(`${concept.slug}: image fallback hook is missing`);
  if (/<form\b[^>]*\baction=/i.test(html)) fail(`${concept.slug}: prototype form must not declare an action`);
  if (/\son[a-z]+\s*=/i.test(html)) fail(`${concept.slug}: inline event handler violates CSP`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`${concept.slug}: duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);
  for (const match of html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)) {
    if (!html.includes(`<label for="${match[1]}">`)) fail(`${concept.slug}: input ${match[1]} has no matching label`);
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(match[0])) fail(`${concept.slug}: target=_blank link lacks noopener noreferrer`);
  }

  let priorIndex = -1;
  for (const section of sectionOrder) {
    const sectionIndex = html.indexOf(`class="${section}`);
    if (sectionIndex < 0) fail(`${concept.slug}: ${section} section is missing`);
    if (sectionIndex >= 0 && sectionIndex < priorIndex) fail(`${concept.slug}: ${section} is out of source order`);
    priorIndex = Math.max(priorIndex, sectionIndex);
  }

  for (const sourceString of visibleSourceStrings) {
    if (!html.includes(htmlEscape(sourceString))) fail(`${concept.slug}: source copy is missing: ${sourceString}`);
  }

  await checkLocalReferences(html, htmlPath);
}

const galleryPath = path.join(rootDirectory, "index.html");
const gallery = await readFile(galleryPath, "utf8");
if (count(gallery, 'class="concept-tile ') !== concepts.length) fail(`Gallery has ${count(gallery, 'class="concept-tile ')} tiles; expected ${concepts.length}`);
for (const concept of concepts) {
  if (!gallery.includes(`concepts/${concept.slug}/`)) fail(`Gallery link missing for ${concept.slug}`);
  if (!gallery.includes(`assets/art/${concept.image}`)) fail(`Gallery image mapping missing for ${concept.title}`);
}
await checkLocalReferences(gallery, galleryPath);

const cssFiles = [
  "assets/styles/brand.css",
  "assets/styles/shared.css",
  "assets/styles/concept-base.css",
  "assets/styles/gallery.css",
];
const allowedColors = new Set(["#197ce3", "#042874", "#efc82c", "#eff3f9"]);
for (const relativePath of cssFiles) {
  const content = await readFile(path.join(rootDirectory, relativePath), "utf8");
  for (const match of content.matchAll(/#[0-9a-f]{6}\b/gi)) {
    if (!allowedColors.has(match[0].toLowerCase())) fail(`${relativePath}: non-brand color ${match[0]}`);
  }
  for (const match of content.matchAll(/font-weight:\s*(\d+)/g)) {
    if (Number(match[1]) > 700) fail(`${relativePath}: font weight ${match[1]} exceeds 700`);
  }
}

const sharedScript = await readFile(path.join(rootDirectory, "assets/scripts/shared.js"), "utf8");
for (const forbiddenApi of ["fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "sendBeacon"]) {
  if (sharedScript.includes(forbiddenApi)) fail(`shared.js uses forbidden network/storage API: ${forbiddenApi}`);
}

warnings.forEach((message) => console.warn(`WARN: ${message}`));
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  console.error(`Site check failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`Site check passed for ${concepts.length} concepts${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
}
