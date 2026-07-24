import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { concepts, referenceHero } from "./concepts.mjs";
import { conceptAdditions, sourceCopy } from "./source-copy.mjs";
import { renderConceptPage, renderGallery } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const failures = [];
const warnings = [];
const strictImages = process.argv.includes("--strict-images");
const approvedCornerSha256 = "e3209fe0d7cdd29e4f17cbbea3c19325a783a3a1d2a5cb8d2c66e2e1db27c758";
const approvedHeroSha256 = "22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2";
const approvedMasterSha256 = "4f76e1f9eb59ad79d6a40a46819badf7f362fed5c601363fbbb67e602219a0a8";
const approvedGallerySha256 = "795395e92eb6c8640c8bf4d5ee40f49d18015b3027e062a461e3097402440034";
const approvedSharedVisualHashes = Object.freeze({
  "assets/styles/brand.css": "7ee7f24f04f7cc6c14ca3eaffc9c5e263342cc60b9070d3c35460e3cee5c3613",
  "assets/styles/concept-base.css": "45df394133ef526d43b3fe9e670fa1d526b42917d90abaa9a0bf71dfa659f551",
  "assets/styles/shared.css": "6e43251497390a25cdee9bf44bc4680af93bf94eb68c3f67c845e9818a83f0aa",
  "assets/scripts/shared.js": "be3d26257ba132989d9b6d9e654b4f4751bb391751823f237b83f73b49d23f36",
  "assets/brand/logo-horizontal-white.png": "34ff2dae53d8b9911cf1aafe708bca41cc5e22469d5847cb99fdf1a93936545b",
  "assets/brand/logo-horizontal-blue.png": "c70f50961a611cf0e357cdb08ec71f241c86b7afcceb9a486180eccf4b60bed3",
});

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
const expectedRouteOrder = [
  "04-first-bell",
  "03-open-corner",
  "06-kitchen-light",
  "09-listening-room",
  "11-on-the-other-end",
  "12-two-ways-in",
  "01-ringside-signal",
  "02-between-rounds",
  "05-someone-in-your-corner",
  "07-workday-pause",
  "08-what-hands-say",
  "10-blue-margin",
];
const expectedAdditionTitles = [
  null,
  "No perfect words needed",
  "The first ten minutes",
  "The Corner Standard",
  "Between-round plan",
  "Bring someone into your corner",
  "Private readiness check",
  "Between-round reset",
  "Ask for support",
  "Workday boundary",
  "Body-signal check-in",
  "Questions before booking",
];
const expectedModuleTypes = [
  null,
  "sentence-starter",
  "first-ten-minutes",
  "corner-standard",
  "between-round-plan",
  "consent-invite",
  "readiness-check",
  "reset-card",
  "support-request",
  "workday-boundary",
  "body-signal",
  "booking-questions",
];
const coreSectionClasses = ["concept-hero", "stats", "symptoms", "meaning", "roadmap", "conversion"];
const extractSection = (html, className) => html.match(new RegExp(`<section class="${className}"[\\s\\S]*?<\\/section>`))?.[0] ?? "";
const extractMasthead = (html) => html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? "";
const normalizeConceptPage = (html) => html
  .replace(/\s*<section class="concept-addition"[\s\S]*?<\/section>\s*/g, "\n")
  .replace(/\s+/g, " ")
  .trim();
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
const visibleSourceStrings = [
  sourceCopy.header.name,
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
  ...sourceCopy.conversion.fields.flatMap((field) => [field.label, field.placeholder]),
  sourceCopy.footer.name,
];

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const additionSourceStrings = (addition) => {
  const common = [addition.title, addition.intro, addition.fallback];
  if (addition.type === "sentence-starter") return [...common, ...addition.starters];
  if (addition.type === "first-ten-minutes") {
    return [...common, ...addition.steps.flatMap((step) => [step.minute, step.heading, step.body])];
  }
  if (addition.type === "corner-standard") {
    return [...common, ...addition.standards.flatMap((item) => [item.standard, item.evidence, item.verifier, item.verification])];
  }
  if (addition.type === "between-round-plan") {
    return [...common, addition.safety, ...addition.prompts.flatMap((prompt) => [prompt.label, prompt.hint, prompt.maxLength])];
  }
  if (addition.type === "consent-invite") return [...common, ...addition.roles, ...addition.boundaries, ...addition.help];
  if (addition.type === "readiness-check") {
    return [...common, addition.note, ...addition.prompts.flatMap((prompt) => [prompt.legend, ...prompt.options])];
  }
  if (addition.type === "reset-card") {
    return [...common, addition.note, ...addition.steps.flatMap((step) => [step.heading, step.body])];
  }
  if (addition.type === "support-request") return [...common, ...addition.people, ...addition.asks];
  if (addition.type === "workday-boundary") return [...common, addition.note, ...addition.contexts, ...addition.boundaries];
  if (addition.type === "body-signal") return [...common, addition.note, ...addition.signals, ...addition.responses];
  if (addition.type === "booking-questions") return [...common, addition.note, ...addition.questions];
  return common;
};

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

const approvedCornerPath = path.join(rootDirectory, "assets", "brand", "corner-off-white.png");
const approvedCornerBytes = await readFile(approvedCornerPath);
const approvedCornerHash = createHash("sha256").update(approvedCornerBytes).digest("hex");
if (approvedCornerHash !== approvedCornerSha256) {
  fail("assets/brand/corner-off-white.png does not match the approved Asset_84x-8.png");
}

const approvedHeroPath = path.join(rootDirectory, "assets", "art", referenceHero.image);
const approvedHeroBytes = await readFile(approvedHeroPath);
const approvedHeroHash = createHash("sha256").update(approvedHeroBytes).digest("hex");
if (approvedHeroHash !== approvedHeroSha256) {
  fail(`${referenceHero.image} does not match the approved optimized ring image`);
}
for (const [relativePath, expectedHash] of Object.entries(approvedSharedVisualHashes)) {
  const bytes = await readFile(path.join(rootDirectory, relativePath));
  const receivedHash = createHash("sha256").update(bytes).digest("hex");
  if (receivedHash !== expectedHash) {
    fail(`${relativePath} changed from the browser-approved visual baseline: expected ${expectedHash}, received ${receivedHash}`);
  }
}

if (concepts.length !== 12) fail(`Concept configuration has ${concepts.length} entries; expected exactly 12`);
if (conceptAdditions.openingLines.starters.length !== 3) fail("No perfect words needed must contain exactly three opening lines");
if (conceptAdditions.firstTenMinutes.steps.map((step) => step.minute).join("|") !== "0|2|5|10") {
  fail("The first ten minutes must preserve the semantic 0, 2, 5, and 10-minute sequence");
}
if (conceptAdditions.cornerStandard.standards.length !== 5) fail("The Corner Standard must contain exactly five standards");
if (conceptAdditions.betweenRoundPlan.prompts.length !== 4) fail("Between-round plan must contain exactly four prompts");
if (conceptAdditions.readinessCheck.prompts.length !== 3) fail("Private readiness check must contain exactly three unscored prompts");
if (conceptAdditions.resetCard.steps.length !== 3) fail("Between-round reset must contain exactly three steps");
if (conceptAdditions.bookingQuestions.questions.length !== 6) fail("Booking questions must contain exactly six questions");
if (concepts.map((concept) => concept.slug).join("|") !== expectedRouteOrder.join("|")) {
  fail(`Concept route order must be ${expectedRouteOrder.join(", ")}`);
}
const generatedPages = [];
for (const [index, concept] of concepts.entries()) {
  const expectedOrdinal = String(index + 1).padStart(2, "0");
  if (concept.ordinal !== expectedOrdinal) fail(`${concept.slug}: configured ordinal must be ${expectedOrdinal}`);
  const addition = concept.additionKey ? conceptAdditions[concept.additionKey] : null;
  if ((addition?.title ?? null) !== expectedAdditionTitles[index]) {
    fail(`${concept.slug}: configured add-on title must be ${expectedAdditionTitles[index] ?? "absent"}`);
  }
  if ((addition?.type ?? null) !== expectedModuleTypes[index]) {
    fail(`${concept.slug}: configured add-on module must be ${expectedModuleTypes[index] ?? "absent"}`);
  }
}

const conceptsDirectory = path.join(rootDirectory, "concepts");
const configuredConceptSlugs = new Set(concepts.map((concept) => concept.slug));
const conceptDirectories = (await readdir(conceptsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const directory of conceptDirectories) {
  if (!configuredConceptSlugs.has(directory)) fail(`Unexpected public concept route directory: concepts/${directory}/`);
}
for (const slug of configuredConceptSlugs) {
  if (!conceptDirectories.includes(slug)) fail(`Configured concept route directory is missing: concepts/${slug}/`);
}

for (const [index, concept] of concepts.entries()) {
  const htmlPath = path.join(rootDirectory, "concepts", concept.slug, "index.html");
  const stylePath = path.join(rootDirectory, "concepts", concept.slug, "style.css");
  if (!(await exists(htmlPath))) {
    fail(`${concept.slug}: index.html was not generated`);
    continue;
  }
  if (!(await exists(stylePath))) fail(`${concept.slug}: style.css is missing`);

  const html = await readFile(htmlPath, "utf8");
  const renderedHtml = renderConceptPage(concept);
  if (html !== renderedHtml) fail(`${concept.slug}: generated index.html is stale; run node tools/generate.mjs`);
  if (!html.includes("noindex, nofollow, noarchive")) fail(`${concept.slug}: noindex metadata is missing`);
  if (!/<meta name="theme-color" content="#197CE3">/i.test(html)) fail(`${concept.slug}: theme-color must use the primary light blue #197CE3`);
  if (!html.includes("Content-Security-Policy")) fail(`${concept.slug}: CSP metadata is missing`);
  if (!html.includes("connect-src 'none'; form-action 'none'")) fail(`${concept.slug}: CSP does not block data submission`);
  if (!html.includes("style-src 'self' https://use.typekit.net;") || !html.includes("font-src 'self' https://use.typekit.net;")) {
    fail(`${concept.slug}: CSP must allow the licensed Typekit stylesheet and fonts only`);
  }
  if (count(html, 'href="https://use.typekit.net/ciy6txz.css"') !== 1) fail(`${concept.slug}: licensed Typekit stylesheet must be included exactly once`);
  if (!html.includes('<body class="concept-page">') || /\sdata-concept(?:-ordinal)?=/.test(html)) {
    fail(`${concept.slug}: concept page body must not expose route-specific attributes`);
  }
  if (count(html, "data-prototype-form") !== 1) fail(`${concept.slug}: expected exactly one prototype form`);
  const prototypeForm = html.match(/<form\b[^>]*data-prototype-form[\s\S]*?<\/form>/)?.[0] ?? "";
  if (count(prototypeForm, "<fieldset") !== 2) fail(`${concept.slug}: prototype form must contain the interest and role fieldsets`);
  if (!prototypeForm.includes("<legend>I'm joining as</legend>") || count(prototypeForm, 'name="role" type="radio"') !== 2) {
    fail(`${concept.slug}: prototype form must offer exactly two native role radios`);
  }
  for (const role of ["Patient", "Therapist"]) {
    if (!prototypeForm.includes(`value="${role}"`) || !prototypeForm.includes(`>${role}</span>`)) {
      fail(`${concept.slug}: prototype role option is missing ${role}`);
    }
  }
  if (count(prototypeForm, "data-role-error") !== 1 || !/name="role"[^>]*required[^>]*aria-describedby="member-role-error"/.test(prototypeForm)) {
    fail(`${concept.slug}: prototype role radios require an accessible local validation contract`);
  }
  if (count(html, "<h1") !== 1) fail(`${concept.slug}: expected exactly one h1`);
  const masthead = extractMasthead(html);
  if (!/^<header class="site-header">\s*<div class="site-header__inner page-frame">[\s\S]*<\/div>\s*<\/header>$/.test(masthead)
    || count(masthead, "<img") !== 1 || count(masthead, "<a") !== 1 || /<p\b|Launching 2026/i.test(masthead)) {
    fail(`${concept.slug}: reference masthead must contain only the linked logo`);
  }
  const heroSection = extractSection(html, "concept-hero");
  if (count(heroSection, 'class="button ') !== 2) fail(`${concept.slug}: reference hero must contain exactly two CTAs`);
  if (!heroSection.includes(`href="#member-form" data-scroll-link>${htmlEscape(sourceCopy.hero.memberCta)}</a>`)) {
    fail(`${concept.slug}: member hero CTA does not match the reference`);
  }
  if (!heroSection.includes(`href="#roadmap-title" data-scroll-link>${htmlEscape(sourceCopy.hero.therapistCta)}</a>`)) {
    fail(`${concept.slug}: therapist hero CTA must target the shared roadmap without adding a form`);
  }
  if (!html.includes('<span class="concept-hero__headline-line" aria-hidden="true">Nobody</span><span class="concept-hero__headline-line" aria-hidden="true">fights alone.</span>')) {
    fail(`${concept.slug}: hero headline must render as the two reference lines "Nobody" and "fights alone."`);
  }
  for (const lockedHeading of [
    '<span aria-hidden="true">It isn’t just bad.</span><span aria-hidden="true">It’s getting worse.</span>',
    '<span aria-hidden="true">It looks</span><span aria-hidden="true">like this.</span>',
    '<span aria-hidden="true">We start with therapy. The</span><span aria-hidden="true">rest of the corner is on its way.</span>',
    '<span aria-hidden="true">Be one of</span><span aria-hidden="true">the first in</span><span aria-hidden="true">the corner.</span>',
  ]) {
    if (!html.includes(lockedHeading)) fail(`${concept.slug}: locked core heading line break is missing`);
  }
  for (const [headingId, expectedLines] of [
    ["stats-title", 2],
    ["symptoms-title", 2],
    ["meaning-title", 1],
    ["roadmap-title", 2],
    ["conversion-title", 3],
  ]) {
    const headingBody = html.match(new RegExp(`<h2 id="${headingId}"[^>]*>([\\s\\S]*?)<\\/h2>`))?.[1] ?? "";
    const lockedSpans = count(headingBody, '<span aria-hidden="true">');
    const sourceLines = lockedSpans || (headingBody ? 1 : 0);
    if (sourceLines !== expectedLines || /<br\b/i.test(headingBody)) {
      fail(`${concept.slug}: ${headingId} must preserve exactly ${expectedLines} source-locked line(s)`);
    }
  }
  if (!heroSection.includes('class="concept-hero__corner" aria-hidden="true"')) {
    fail(`${concept.slug}: hero must include the DOM-rendered Blue Corner glyph`);
  }
  if (html.includes('class="site-header__review"') || /Concept \d{2} of \d{2}/.test(html) || html.includes("<figcaption")) {
    fail(`${concept.slug}: concept labels or review chrome must not appear inside the reference page`);
  }
  if (html.includes('class="crisis-bar')) fail(`${concept.slug}: crisis access must be in the footer, not top chrome`);
  const expectedHeroImage = `src="../../assets/art/${referenceHero.image}" width="${referenceHero.width}" height="${referenceHero.height}" alt="${htmlEscape(referenceHero.alt)}"`;
  if (!html.includes(expectedHeroImage)) fail(`${concept.slug}: hero image must match the shared reference asset, dimensions, and alt`);
  if (count(html, `../../assets/art/${referenceHero.image}`) !== 1) fail(`${concept.slug}: shared reference hero must appear exactly once in page content`);
  if (count(html, "data-fallback-image") < 1) fail(`${concept.slug}: image fallback hook is missing`);
  if (/<form\b[^>]*\baction=/i.test(html)) fail(`${concept.slug}: prototype form must not declare an action`);
  if (/\son[a-z]+\s*=/i.test(html)) fail(`${concept.slug}: inline event handler violates CSP`);

  const additionCount = count(html, 'class="concept-addition"');
  const expectedAdditionTitle = expectedAdditionTitles[index];
  const expectedModuleType = expectedModuleTypes[index];
  if (index === 0 && additionCount !== 0) fail(`${concept.slug}: reference master must not contain a concept add-on`);
  if (index > 0 && additionCount !== 1) fail(`${concept.slug}: expected exactly one concept add-on`);
  if (expectedAdditionTitle) {
    const additionMarkup = html.match(/<section class="concept-addition"[\s\S]*?<\/section>/)?.[0] ?? "";
    if (!html.includes("<p class=\"eyebrow\">Concept add-on</p>")) fail(`${concept.slug}: add-on label is missing`);
    if (!html.includes(`<h2 id="concept-addition-title">${htmlEscape(expectedAdditionTitle)}</h2>`)) {
      fail(`${concept.slug}: add-on title must be ${expectedAdditionTitle}`);
    }
    const addition = conceptAdditions[concept.additionKey];
    if (!additionMarkup.includes(`data-module="${expectedModuleType}"`) || !additionMarkup.includes('data-state="idle"')) {
      fail(`${concept.slug}: add-on must declare data-module="${expectedModuleType}" and start at data-state="idle"`);
    }
    if (count(additionMarkup, "<noscript>") !== 1 || !additionMarkup.includes(htmlEscape(addition.fallback))) {
      fail(`${concept.slug}: add-on must provide its useful no-JavaScript fallback`);
    }
    if (/<script\b/i.test(additionMarkup)) fail(`${concept.slug}: add-on must use only the shared external script`);
    if (count(additionMarkup, "<section") !== 1) fail(`${concept.slug}: add-on must not contain a nested section`);
    if (!additionMarkup.includes("data-js-controls hidden")) fail(`${concept.slug}: add-on must hide JavaScript-only controls until initialization`);
    for (const control of additionMarkup.matchAll(/<div class="concept-addition__controls"([^>]*)>/g)) {
      if (!/\bdata-js-controls\b/.test(control[1]) || !/\bhidden\b/.test(control[1])) {
        fail(`${concept.slug}: JavaScript-only controls must start hidden for progressive enhancement`);
      }
    }
    for (const editable of additionMarkup.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)) {
      if (!/\bautocomplete="off"/.test(editable[0])) {
        fail(`${concept.slug}: sensitive add-on control must disable autocomplete (${editable[0]})`);
      }
    }
    for (const additionString of additionSourceStrings(addition)) {
      if (!html.includes(htmlEscape(additionString))) fail(`${concept.slug}: add-on copy is missing: ${additionString}`);
    }
    if (expectedModuleType === "sentence-starter") {
      if (count(additionMarkup, 'name="sentence-starter"') !== 3) fail(`${concept.slug}: sentence starter must use exactly three native radio choices`);
      if (!/data-sentence-editor[^>]*maxlength="240"/.test(additionMarkup)) fail(`${concept.slug}: sentence starter requires a length-capped editable line`);
      if (!/data-action="copy" disabled/.test(additionMarkup) || !/>Copy line<\/button>/.test(additionMarkup) || !/type="reset">Reset<\/button>/.test(additionMarkup)) {
        fail(`${concept.slug}: sentence starter requires disabled-by-default Copy line and native Reset controls`);
      }
    }
    if (expectedModuleType === "first-ten-minutes") {
      if (!additionMarkup.includes('<ol class="concept-addition__timeline"')) fail(`${concept.slug}: first ten minutes must use an ordered timeline`);
      for (const minute of ["0", "2", "5", "10"]) {
        if (!additionMarkup.includes(`data-minute="${minute}"`)) fail(`${concept.slug}: first ten minutes is missing minute ${minute}`);
      }
      for (const action of ["next", "show-all", "copy", "reset"]) {
        if (!additionMarkup.includes(`data-action="${action}"`)) fail(`${concept.slug}: first ten minutes is missing ${action} control`);
      }
      if (/data-step[^>]*hidden/.test(additionMarkup)) fail(`${concept.slug}: complete timeline source must remain readable without JavaScript`);
    }
    if (expectedModuleType === "corner-standard") {
      if (count(additionMarkup, '<details class="concept-addition__standard">') !== 5) fail(`${concept.slug}: Corner Standard must use five native details disclosures`);
      if (count(additionMarkup, "data-review-check") !== 5) fail(`${concept.slug}: Corner Standard must provide five local reviewed indicators`);
      for (const label of ["Evidence to look for", "How to verify it", "Current verification"]) {
        if (count(additionMarkup, `<dt>${label}</dt>`) !== 5) fail(`${concept.slug}: each Corner Standard disclosure needs ${label}`);
      }
      if (!additionMarkup.includes("not a credential check or certification")) fail(`${concept.slug}: reviewed indicator must not imply verification`);
    }
    if (expectedModuleType === "between-round-plan") {
      for (const prompt of addition.prompts) {
        if (!additionMarkup.includes(`name="${prompt.key}"`) || !additionMarkup.includes(`maxlength="${prompt.maxLength}"`)) {
          fail(`${concept.slug}: between-round prompt ${prompt.key} is missing its field or length cap`);
        }
      }
      for (const action of ["generate", "copy", "print"]) {
        if (!additionMarkup.includes(`data-action="${action}"`)) fail(`${concept.slug}: between-round plan is missing ${action} control`);
      }
      if (!additionMarkup.includes('type="reset">Clear</button>')) fail(`${concept.slug}: between-round plan requires a native Clear control`);
      if (!additionMarkup.includes("partial or complete preview")) fail(`${concept.slug}: between-round plan must allow partial previews`);
      const exactPlanPrivacyCopy = "Until you choose Copy or Print, this plan stays in this page and is not saved or sent. Copying puts it on your device clipboard; printing may create a PDF, an operating-system spool file, or a physical copy.";
      if (!additionMarkup.includes(htmlEscape(exactPlanPrivacyCopy))) fail(`${concept.slug}: between-round plan must use the approved conditional privacy warning`);
      if (additionMarkup.includes("This plan stays in this page only") || additionMarkup.includes("Your plan remains only in this page")) {
        fail(`${concept.slug}: between-round plan contains a contradictory page-only privacy claim`);
      }
      if (!additionMarkup.includes('data-plan-preview role="region"') || !additionMarkup.includes("data-plan-preview role=\"region\" aria-labelledby=\"plan-preview-title\" hidden")) {
        fail(`${concept.slug}: plan preview must start hidden until explicitly generated`);
      }
      for (const printCopy of [
        "Blue Corner · Local plan",
        "Printing may create a PDF, an operating-system print-spool file, or a physical copy.",
      ]) {
        if (!additionMarkup.includes(htmlEscape(printCopy))) fail(`${concept.slug}: print preview is missing privacy copy: ${printCopy}`);
      }
    }
    if (expectedModuleType === "consent-invite") {
      for (const name of ["consent-role", "consent-boundary", "consent-help"]) {
        if (!additionMarkup.includes(`name="${name}"`)) fail(`${concept.slug}: consent invitation is missing the ${name} fieldset`);
      }
      if (count(additionMarkup, '<fieldset class="concept-addition__fieldset">') !== 3) fail(`${concept.slug}: consent invitation must use three native fieldsets`);
      if (!/data-action="generate" disabled/.test(additionMarkup)) fail(`${concept.slug}: invitation generation must wait for all three choices`);
      if (!/data-invite-editor[^>]*maxlength="600"/.test(additionMarkup)) fail(`${concept.slug}: generated invitation requires a length-capped editable preview`);
      if (!additionMarkup.includes("Nothing sends from this page")) fail(`${concept.slug}: consent invitation must clearly state that nothing sends`);
      if (!/data-invite-preview hidden/.test(additionMarkup)) fail(`${concept.slug}: invitation preview must start hidden without JavaScript`);
    }
    if (expectedModuleType === "readiness-check") {
      if (count(additionMarkup, '<fieldset class="concept-addition__fieldset">') !== 3) fail(`${concept.slug}: readiness check must use three native fieldsets`);
      if (!additionMarkup.includes("There is no score, result, or diagnosis") || !additionMarkup.includes("No score or diagnosis is created.")) {
        fail(`${concept.slug}: readiness check must explicitly avoid scoring and diagnosis`);
      }
      if (!/data-readiness-preview hidden/.test(additionMarkup)) fail(`${concept.slug}: readiness reflection must start hidden`);
    }
    if (expectedModuleType === "reset-card") {
      if (count(additionMarkup, "data-reset-step") !== 3) fail(`${concept.slug}: reset card must contain exactly three steps`);
      if (/data-reset-step[^>]*hidden/.test(additionMarkup)) fail(`${concept.slug}: reset steps must remain readable without JavaScript`);
      if (!additionMarkup.includes("not therapy, medical advice, or a substitute for crisis support")) {
        fail(`${concept.slug}: reset card must state its clinical and crisis limits`);
      }
    }
    if (expectedModuleType === "support-request") {
      for (const name of ["support-person", "support-ask"]) {
        if (!additionMarkup.includes(`name="${name}"`)) fail(`${concept.slug}: support builder is missing ${name}`);
      }
      if (!/data-support-editor[^>]*maxlength="600"/.test(additionMarkup) || !additionMarkup.includes("Nothing sends from this page")) {
        fail(`${concept.slug}: support request requires a capped editable local-only preview`);
      }
    }
    if (expectedModuleType === "workday-boundary") {
      for (const name of ["workday-context", "workday-boundary"]) {
        if (!additionMarkup.includes(`name="${name}"`)) fail(`${concept.slug}: workday builder is missing ${name}`);
      }
      if (!/data-workday-editor[^>]*maxlength="600"/.test(additionMarkup) || !additionMarkup.includes("not legal, medical, or workplace-policy advice")) {
        fail(`${concept.slug}: workday boundary requires a capped editable preview and scope warning`);
      }
    }
    if (expectedModuleType === "body-signal") {
      if (count(additionMarkup, "data-body-signal") !== 4 || count(additionMarkup, "data-body-response") !== 4) {
        fail(`${concept.slug}: body check-in must provide four signals and four possible responses`);
      }
      if (!additionMarkup.includes("does not identify a condition") || !/data-body-preview hidden/.test(additionMarkup)) {
        fail(`${concept.slug}: body check-in must avoid diagnosis and hide its generated reflection initially`);
      }
    }
    if (expectedModuleType === "booking-questions") {
      if (count(additionMarkup, "data-booking-question") !== 6) fail(`${concept.slug}: booking checklist must contain six selectable questions`);
      for (const action of ["copy", "select-all"]) {
        if (!additionMarkup.includes(`data-action="${action}"`)) fail(`${concept.slug}: booking checklist is missing ${action} control`);
      }
      if (!additionMarkup.includes("data-copy-fallback hidden")) fail(`${concept.slug}: booking checklist needs a manual copy fallback`);
    }
  }
  if (count(html, "../../assets/scripts/shared.js") !== 1) fail(`${concept.slug}: expected exactly one shared interaction script reference`);

  const meaningSection = html.match(/<section class="meaning"[\s\S]*?<\/section>/)?.[0];
  if (!meaningSection) {
    fail(`${concept.slug}: meaning section markup is missing`);
  } else {
    if (!meaningSection.includes('src="../../assets/brand/corner-off-white.png" width="255" height="248"')) {
      fail(`${concept.slug}: meaning section must use the approved 255x248 corner asset`);
    }
    if (meaningSection.includes("mark-white.png")) {
      fail(`${concept.slug}: meaning section still references the logo mark`);
    }
    if (count(meaningSection, "corner-off-white.png") !== 1) {
      fail(`${concept.slug}: meaning section must reference the approved corner asset exactly once`);
    }
  }

  const conceptFooter = html.match(/<footer class="concept-footer">[\s\S]*?<\/footer>/)?.[0];
  if (!conceptFooter) {
    fail(`${concept.slug}: concept footer markup is missing`);
  } else {
    if (!conceptFooter.includes('src="../../assets/brand/logo-horizontal-blue.png" width="1655" height="170"')) {
      fail(`${concept.slug}: off-white footer must use the approved blue horizontal logo`);
    }
    if (/logo-horizontal-white\.png|mark-(?:white|blue)\.png/.test(conceptFooter)) {
      fail(`${concept.slug}: footer must not use a white or decorative mark asset`);
    }
    if (!conceptFooter.includes('class="concept-footer__wordmark"') || /concept-footer__(?:meta|brand|safety)/.test(conceptFooter)) {
      fail(`${concept.slug}: footer must contain only the oversized wordmark and focus-revealed crisis access`);
    }
    if (!conceptFooter.includes('class="concept-footer__support"') || conceptFooter.includes('class="sr-only"')) {
      fail(`${concept.slug}: footer crisis links must use the sighted-keyboard focus tray`);
    }
    for (const requiredSafetyReference of ['href="tel:988"', 'href="sms:988"', 'href="tel:911"', "mental-health-get-help.html"]) {
      if (!conceptFooter.includes(requiredSafetyReference)) fail(`${concept.slug}: footer safety access is missing ${requiredSafetyReference}`);
    }
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`${concept.slug}: duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);
  const labelledIds = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)) {
    if (!labelledIds.has(match[1])) fail(`${concept.slug}: input ${match[1]} has no matching label`);
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(match[0])) fail(`${concept.slug}: target=_blank link lacks noopener noreferrer`);
  }

  let priorIndex = -1;
  for (const section of coreSectionClasses) {
    const sectionIndex = html.indexOf(`class="${section}`);
    if (sectionIndex < 0) fail(`${concept.slug}: ${section} section is missing`);
    if (sectionIndex >= 0 && sectionIndex < priorIndex) fail(`${concept.slug}: ${section} is out of source order`);
    priorIndex = Math.max(priorIndex, sectionIndex);
  }
  if (expectedAdditionTitle) {
    const roadmapIndex = html.indexOf('class="roadmap ');
    const additionIndex = html.indexOf('class="concept-addition"');
    const conversionIndex = html.indexOf('class="conversion"');
    if (!(roadmapIndex < additionIndex && additionIndex < conversionIndex)) {
      fail(`${concept.slug}: concept add-on must appear between roadmap and conversion`);
    }
  }

  for (const sourceString of visibleSourceStrings) {
    if (!html.includes(htmlEscape(sourceString))) fail(`${concept.slug}: source copy is missing: ${sourceString}`);
  }

  await checkLocalReferences(html, htmlPath);
  generatedPages.push({ concept, html });
}

const masterPage = generatedPages[0]?.html ?? "";
const masterHash = createHash("sha256").update(masterPage).digest("hex");
if (masterHash !== approvedMasterSha256) {
  fail(`04-first-bell master HTML hash changed: expected ${approvedMasterSha256}, received ${masterHash}`);
}
const masterMasthead = extractMasthead(masterPage);
const normalizedMasterPage = normalizeConceptPage(masterPage);
for (const { concept, html } of generatedPages.slice(1)) {
  if (normalizeConceptPage(html) !== normalizedMasterPage) {
    fail(`${concept.slug}: full page differs from the reference master outside its single concept add-on`);
  }
  if (extractMasthead(html) !== masterMasthead) fail(`${concept.slug}: masthead differs from the reference master`);
  for (const className of coreSectionClasses) {
    if (extractSection(html, className) !== extractSection(masterPage, className)) {
      fail(`${concept.slug}: core section ${className} differs from the reference master`);
    }
  }
}

const galleryPath = path.join(rootDirectory, "index.html");
const gallery = await readFile(galleryPath, "utf8");
if (gallery !== renderGallery(concepts)) fail("Gallery index.html is stale; run node tools/generate.mjs");
const galleryHash = createHash("sha256").update(gallery).digest("hex");
if (galleryHash !== approvedGallerySha256) {
  fail(`Gallery HTML hash changed: expected ${approvedGallerySha256}, received ${galleryHash}`);
}
if (!/<meta name="theme-color" content="#197CE3">/i.test(gallery)) fail("Gallery theme-color must use the primary light blue #197CE3");
if (!gallery.includes("style-src 'self' https://use.typekit.net;") || !gallery.includes("font-src 'self' https://use.typekit.net;")) {
  fail("Gallery CSP must allow the licensed Typekit stylesheet and fonts only");
}
if (count(gallery, 'href="https://use.typekit.net/ciy6txz.css"') !== 1) fail("Gallery must include the licensed Typekit stylesheet exactly once");
const galleryFooter = gallery.match(/<footer class="gallery-footer">[\s\S]*?<\/footer>/)?.[0];
if (!galleryFooter) {
  fail("Gallery footer markup is missing");
} else {
  if (!galleryFooter.includes('src="assets/brand/logo-horizontal-blue.png" width="1655" height="170"')) {
    fail("Gallery off-white footer must use the approved blue horizontal logo");
  }
  if (/logo-horizontal-white\.png|mark-(?:white|blue)\.png/.test(galleryFooter)) {
    fail("Gallery footer must not use a white or decorative mark asset");
  }
}
if (count(gallery, 'class="concept-tile ') !== concepts.length) fail(`Gallery has ${count(gallery, 'class="concept-tile ')} tiles; expected ${concepts.length}`);
for (const concept of concepts) {
  if (!gallery.includes(`concepts/${concept.slug}/`)) fail(`Gallery link missing for ${concept.slug}`);
  if (!gallery.includes(`<span class="concept-tile__number">${concept.ordinal}</span>`)) fail(`Gallery ordinal missing for ${concept.title}`);
  if (!gallery.includes(`<strong>${htmlEscape(concept.title)}</strong>`)) fail(`Gallery title missing for ${concept.title}`);
}
if (count(gallery, `assets/art/${referenceHero.image}`) !== concepts.length) {
  fail(`Gallery must use the shared reference hero for all ${concepts.length} concept tiles`);
}
await checkLocalReferences(gallery, galleryPath);

const cssFiles = [
  "assets/styles/brand.css",
  "assets/styles/shared.css",
  "assets/styles/concept-base.css",
  "assets/styles/gallery.css",
  ...concepts.map((concept) => `concepts/${concept.slug}/style.css`),
];
const allowedColors = new Set(["#197ce3", "#042874", "#efc82c", "#eff3f9"]);
const cssContents = new Map();
for (const relativePath of cssFiles) {
  const content = await readFile(path.join(rootDirectory, relativePath), "utf8");
  cssContents.set(relativePath, content);
  if (relativePath.startsWith("concepts/") && stripCssComments(content)) {
    fail(`${relativePath}: per-concept CSS overrides are forbidden`);
  }
  for (const match of content.matchAll(/#[0-9a-f]{6}\b/gi)) {
    if (!allowedColors.has(match[0].toLowerCase())) fail(`${relativePath}: non-brand color ${match[0]}`);
  }
  for (const match of content.matchAll(/font-weight:\s*(\d+)/g)) {
    if (Number(match[1]) > 700) fail(`${relativePath}: font weight ${match[1]} exceeds 700`);
  }
}

const conceptBaseCss = cssContents.get("assets/styles/concept-base.css") ?? "";
const sharedCss = cssContents.get("assets/styles/shared.css") ?? "";
const brandCss = cssContents.get("assets/styles/brand.css") ?? "";
if (!/--font-brand:\s*"proxima-nova-condensed"/.test(brandCss)
  || !/--font-weight-regular:\s*400;/.test(brandCss)
  || !/--font-weight-semibold:\s*700;/.test(brandCss)
  || !/--font-weight-bold:\s*700;/.test(brandCss)) {
  fail("assets/styles/brand.css: Typekit must lead the brand stack and use only 400/700 weights");
}
if (/\.js\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/.test(sharedCss)) {
  fail("assets/styles/shared.css: reveal content must be visible by default for full-page capture");
}
if (!/\.concept-footer__support:focus-within\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;[^}]*transform:\s*translateY\(0\);/.test(sharedCss)) {
  fail("assets/styles/shared.css: footer support tray must become visible and operable on keyboard focus");
}
if (!/grid-template-columns:\s*minmax\(0,\s*43fr\)\s+minmax\(0,\s*51fr\);/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: desktop hero must use the measured 43/51 grid");
}
if (!/\.concept-hero__media\s*\{[\s\S]*?aspect-ratio:\s*3\s*\/\s*2;/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: hero media must use the approved 3:2 crop");
}
if (!/\.section-heading\s*\{[^}]*max-inline-size:\s*none;/.test(conceptBaseCss)
  || !/\.section-heading h2,\s*\.meaning h2\s*\{[^}]*font-size:\s*clamp\(3\.75rem,\s*6\.3889vw,\s*5\.75rem\);/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: shared core h2 scale must cap at 92px with no 72rem width constraint");
}
if (!/@media \(min-width:\s*75rem\)\s*\{[\s\S]*?\.roadmap__heading h2 span\s*\{[^}]*white-space:\s*nowrap;/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: desktop roadmap spans must preserve the approved two-line lock");
}
if (!/\.meaning h2\s*\{[^}]*white-space:\s*nowrap;/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: manifesto heading must remain one line on the shared desktop core");
}
for (const measuredCoreRule of [
  /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/,
  /grid-template-columns:\s*minmax\(0,\s*36fr\)\s+minmax\(0,\s*64fr\);/,
  /grid-template-columns:\s*12\.6%\s+minmax\(0,\s*87\.4%\);/,
  /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/,
  /grid-template-columns:\s*minmax\(0,\s*39fr\)\s+minmax\(0,\s*56fr\);/,
]) {
  if (!measuredCoreRule.test(conceptBaseCss)) fail(`assets/styles/concept-base.css: measured core grid rule is missing (${measuredCoreRule})`);
}
for (const responsiveToken of ["@media (max-width: 64rem)", "@media (max-width: 48rem)", "@media (max-width: 39rem)", "@media (max-width: 24.375rem)"]) {
  if (!conceptBaseCss.includes(responsiveToken)) fail(`assets/styles/concept-base.css: responsive target is missing ${responsiveToken}`);
}
if (!/\.meaning\s*\{[^}]*background:\s*var\(--brand-blue\);/.test(conceptBaseCss)
  || !/\.meaning__mark\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: manifesto must pair a navy rail with bright Blue Corner blue content");
}
if (!/\.conversion\s*\{[^}]*background:\s*var\(--brand-navy\);/.test(conceptBaseCss)) {
  fail("assets/styles/concept-base.css: reference conversion section must use the navy background");
}
const printCss = conceptBaseCss.slice(conceptBaseCss.indexOf("@media print"));
for (const printSelector of [
  'body[data-print-plan="true"] > *',
  'body[data-print-plan="true"] > main',
  'body[data-print-plan="true"] main > *',
  'body[data-print-plan="true"] .concept-addition__inner > *',
  'body[data-print-plan="true"] [data-plan-form] > *',
  'body[data-print-plan="true"] [data-plan-form] > [data-plan-preview]',
]) {
  if (!conceptBaseCss.includes("@media print") || !printCss.includes(printSelector)) {
    fail(`assets/styles/concept-base.css: print isolation is missing ${printSelector}`);
  }
}

const customPropertyDefinitions = [];
for (const [relativePath, content] of cssContents) {
  for (const match of content.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    customPropertyDefinitions.push({ name: match[1], value: match[2], relativePath });
  }
}

const navyAliases = new Set(["--brand-navy", "--color-ink", "--color-action"]);
let foundNavyAlias = true;
while (foundNavyAlias) {
  foundNavyAlias = false;
  for (const definition of customPropertyDefinitions) {
    const referencesNavy = /#042874\b/i.test(definition.value)
      || /(?:navy|ink|action)/i.test(definition.name)
      || [...definition.value.matchAll(/var\(\s*(--[\w-]+)/g)].some((match) => navyAliases.has(match[1]));
    if (referencesNavy && !navyAliases.has(definition.name)) {
      navyAliases.add(definition.name);
      foundNavyAlias = true;
    }
  }
}

for (const [relativePath, content] of cssContents) {
  if (/(?:linear|radial|conic)-gradient\(/i.test(content)) fail(`${relativePath}: gradients are not approved`);
  for (const block of content.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1].trim();
    const declarations = block[2];
    for (const match of declarations.matchAll(/\b(background(?:-(?:color|image))?)\s*:\s*([^;{}]+);/gi)) {
      const value = match[2];
      const usesNavySurface = /#042874\b/i.test(value)
        || [...value.matchAll(/var\(\s*(--[\w-]+)/g)].some((variable) => (
          navyAliases.has(variable[1]) || /(?:navy|ink|action)/i.test(variable[1])
        ));
      const approvedNavyReferenceSection = relativePath === "assets/styles/concept-base.css"
        && (selector === ".meaning__mark" || selector === ".conversion" || selector === ".concept-hero__media");
      if (usesNavySurface && !approvedNavyReferenceSection) {
        fail(`${relativePath}: ${selector} ${match[1]} cannot use navy or a navy-derived alias (${value.trim()})`);
      }
    }
    if (/\bbox-shadow\s*:/i.test(declarations)) {
      const approvedAccessibilityShadow = relativePath === "assets/styles/shared.css"
        && (selector.includes(":focus-visible") || selector.includes('[aria-invalid="true"]'));
      if (!approvedAccessibilityShadow) fail(`${relativePath}: ${selector} uses an unapproved box shadow`);
    }
    if (/\btext-shadow\s*:/i.test(declarations)) fail(`${relativePath}: ${selector} uses an unapproved text shadow`);
  }
}

const sharedScript = await readFile(path.join(rootDirectory, "assets/scripts/shared.js"), "utf8");
const additionTemplateSource = await readFile(path.join(rootDirectory, "tools/template.mjs"), "utf8");
const additionCopySource = await readFile(path.join(rootDirectory, "tools/source-copy.mjs"), "utf8");
const forbiddenPrivacyApis = [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "BroadcastChannel",
  "sendBeacon",
  "document.cookie",
  "location.hash",
  "location.search",
  "URLSearchParams",
  ".searchParams",
  "history.pushState",
  "history.replaceState",
  "CacheStorage",
  "navigator.serviceWorker",
  "caches.",
  "innerHTML",
  "eval(",
  "console.",
];
for (const [sourceName, source] of [
  ["shared.js", sharedScript],
  ["template.mjs", additionTemplateSource],
  ["source-copy.mjs", additionCopySource],
]) {
  for (const forbiddenApi of forbiddenPrivacyApis) {
    if (source.includes(forbiddenApi)) fail(`${sourceName} uses forbidden privacy/network/storage API: ${forbiddenApi}`);
  }
}
if (!/new Set\(\["idle", "active", "ready", "success", "error"\]\)/.test(sharedScript)) {
  fail("shared.js must constrain add-on modules to the idle, active, ready, success, and error states");
}
if (/setModuleState\([^)]*,\s*["']loading["']/.test(sharedScript)) {
  fail("shared.js must not use a fake loading state inside concept add-ons");
}
if (count(sharedScript, "navigator.clipboard.writeText(") !== 1) {
  fail("shared.js must centralize clipboard writes in one user-triggered helper");
}
if (!sharedScript.includes("fallback.focus()") || !sharedScript.includes("fallback.select()")) {
  fail("shared.js must expose, focus, and select text when automatic clipboard access fails");
}
const sentenceStarterScript = sharedScript.match(/const initializeSentenceStarter =[\s\S]*?(?=\n  const initializeTimeline =)/)?.[0] ?? "";
if (!sentenceStarterScript || sentenceStarterScript.includes("editor.focus()")) {
  fail("shared.js must keep focus on the selected sentence-starter radio");
}
if (!sharedScript.includes('window.addEventListener("pageshow"') || !sharedScript.includes("event.persisted") || !sharedScript.includes("moduleResetters")) {
  fail("shared.js must clear add-on drafts and state when a persisted page is restored");
}
if (!sharedScript.includes("controls.hidden = false")) {
  fail("shared.js must reveal progressive-enhancement controls only after module initialization");
}
for (const initializer of [
  "initializeReadinessCheck",
  "initializeResetCard",
  "initializeScriptBuilder",
  "initializeBodySignal",
  "initializeBookingQuestions",
]) {
  if (!sharedScript.includes(`const ${initializer} =`)) fail(`shared.js is missing ${initializer}`);
}
for (const moduleType of ["readiness-check", "reset-card", "support-request", "workday-boundary", "body-signal", "booking-questions"]) {
  if (!sharedScript.includes(`module.dataset.module === "${moduleType}"`)) fail(`shared.js does not initialize ${moduleType}`);
}
if (!sharedScript.includes('document.body.dataset.printPlan = "true"') || !sharedScript.includes('window.addEventListener("afterprint"')) {
  fail("shared.js must isolate plan printing and clear print mode after the dialog closes");
}
if (sharedScript.includes("remains only in this page")) {
  fail("shared.js must not claim that printed plans remain only in the page");
}
for (const printRisk of ["PDF", "print-spool file", "physical copy"]) {
  if (!sharedScript.includes(printRisk)) fail(`shared.js print status must disclose possible ${printRisk} output`);
}

warnings.forEach((message) => console.warn(`WARN: ${message}`));
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  console.error(`Site check failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`Site check passed for ${concepts.length} concepts${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
}
