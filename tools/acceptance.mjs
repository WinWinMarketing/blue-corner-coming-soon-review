/**
 * Real-browser acceptance run for the canonical homepage.
 *
 * check-site.mjs is static analysis: it proves the SOURCE says the right thing.
 * It cannot prove that scrolling stops when the wheel stops, that nothing
 * overflows at 320px, that the hero actually animates on first paint, or that a
 * page is free of console errors. Those are runtime facts and they live here.
 *
 *   node tools/acceptance.mjs                       # test the working tree
 *   node tools/acceptance.mjs --target <url>        # test a deployed build
 *   node tools/acceptance.mjs --shots <dir>         # also write screenshots
 *
 * Chromium comes from the local Playwright browser cache and playwright-core is
 * resolved from a sibling checkout, mirroring how recolor-hero.mjs borrows
 * sharp. If neither is present the run SKIPS rather than fails, so the script is
 * safe to wire into a hook on a machine without them.
 */
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (flag) => { const i = argv.indexOf(flag); return i === -1 ? null : argv[i + 1]; };
const TARGET_ARG = arg("--target");
const SHOTS = arg("--shots");

const PLAYWRIGHT_CANDIDATES = [
  "c:/Users/sanja/Projects/sharkord-e2e/node_modules/playwright-core/index.mjs",
  "c:/Users/sanja/Projects/auto-site-maker/node_modules/playwright-core/index.mjs",
  path.join(ROOT, "node_modules/playwright-core/index.mjs"),
];
const playwrightEntry = PLAYWRIGHT_CANDIDATES.find((p) => existsSync(p));
const browsersRoot = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const chromeDir = existsSync(browsersRoot)
  ? readdirSync(browsersRoot).filter((d) => /^chromium-\d+$/.test(d)).sort().at(-1)
  : null;
const executablePath = chromeDir ? path.join(browsersRoot, chromeDir, "chrome-win64/chrome.exe") : null;

if (!playwrightEntry || !executablePath || !existsSync(executablePath)) {
  console.log("SKIP: acceptance run needs playwright-core and a local Chromium; neither is required to build the site.");
  process.exit(0);
}
const { chromium } = await import(pathToFileURL(playwrightEntry).href);

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".txt": "text/plain" };
let server = null;
let target = TARGET_ARG;
if (!target) {
  server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://local").pathname);
    if (p === "/") p = "/index.html";
    try {
      const body = await readFile(path.join(ROOT, p));
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch { res.writeHead(404).end("not found"); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  target = `http://127.0.0.1:${server.address().port}/`;
}
if (SHOTS) await mkdir(SHOTS, { recursive: true });

const results = [];
const check = (id, pass, detail) => results.push({ id, pass, detail });

// The CSP deliberately blocks Typekit's analytics beacon (p.typekit.net); the
// fonts themselves load from use.typekit.net. That console entry is the policy
// working, not a defect, so it is the one allowed message.
const ALLOWED_CONSOLE = ["p.typekit.net"];

const browser = await chromium.launch({ headless: true, executablePath });
const openPage = async (width, height, opts = {}) => {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: opts.reducedMotion || "no-preference",
    javaScriptEnabled: opts.javaScript !== false,
  });
  const page = await context.newPage();
  page.problems = [];
  page.on("pageerror", (error) => page.problems.push(String(error)));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (ALLOWED_CONSOLE.some((allowed) => message.text().includes(allowed))) return;
    page.problems.push(`console: ${message.text()}`);
  });
  return page;
};
const settle = async (page) => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200); };

// ---------------------------------------------------------------- motion
{
  const page = await openPage(2048, 870);
  const frames = [];
  await page.goto(target, { waitUntil: "commit" });
  for (const at of [40, 120, 220, 340, 520, 900, 1500]) {
    await page.waitForTimeout(at - (frames.at(-1)?.at ?? 0));
    const buffer = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 800 } });
    frames.push({ at, hash: createHash("sha1").update(buffer).digest("hex").slice(0, 10) });
  }
  const distinct = new Set(frames.map((f) => f.hash)).size;
  check("motion: hero animates on first paint", distinct >= 3,
    `${distinct} distinct frames — ${frames.map((f) => `${f.at}ms:${f.hash.slice(0, 6)}`).join(" ")}`);

  await settle(page);
  const settled = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".concept-hero__copy"));
    return { opacity: style.opacity, transform: style.transform };
  });
  check("motion: hero settles fully visible", settled.opacity === "1", JSON.stringify(settled));

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.6, behavior: "instant" }));
  await page.waitForTimeout(1000);
  const revealed = await page.evaluate(() => getComputedStyle(document.querySelector(".roadmap__heading")).opacity);
  check("motion: later sections reveal on scroll", revealed === "1", `roadmap heading opacity ${revealed}`);

  const animated = await page.evaluate(() => {
    const properties = new Set();
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      const walk = (rule) => {
        if (rule.style?.transitionProperty) rule.style.transitionProperty.split(",").forEach((p) => properties.add(p.trim()));
        if (rule.cssRules) for (const child of rule.cssRules) walk(child);
      };
      for (const rule of rules) walk(rule);
    }
    return [...properties];
  });
  const offBudget = animated.filter((p) => !["transform", "opacity", "none", "all", ""].includes(p));
  check("motion: transform/opacity only", offBudget.length === 0, offBudget.join(", ") || "transform/opacity only");
  check("motion: no console errors", page.problems.length === 0, page.problems.join(" | ") || "clean");
  await page.context().close();
}
{
  const page = await openPage(2048, 870, { reducedMotion: "reduce" });
  await page.goto(target, { waitUntil: "networkidle" });
  await settle(page);
  const state = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".concept-hero__copy"));
    return { opacity: style.opacity, duration: style.transitionDuration };
  });
  check("motion: prefers-reduced-motion honoured", state.opacity === "1" && parseFloat(state.duration) <= 0.02, JSON.stringify(state));
  await page.context().close();
}
{
  const page = await openPage(2048, 870, { javaScript: false });
  await page.goto(target, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const buffer = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 800 } });
  let colouredBytes = 0;
  for (let i = 0; i < buffer.length - 4; i += 997) if (buffer[i] !== buffer[i + 1]) colouredBytes += 1;
  const text = await page.textContent("body");
  check("motion: fails open with JavaScript disabled",
    text.includes("Nobody") && text.includes("Fights") && colouredBytes > 20,
    `${text.length} chars of copy, ${colouredBytes} sampled colour bytes painted`);
  await page.context().close();
}

// ------------------------------------------------------- scroll + scrollbar
{
  const page = await openPage(2048, 870);
  await page.goto(target, { waitUntil: "networkidle" });
  await settle(page);
  const scrolling = await page.evaluate(() => ({
    behavior: getComputedStyle(document.documentElement).scrollBehavior,
    snapRoot: getComputedStyle(document.documentElement).scrollSnapType,
    snapBody: getComputedStyle(document.body).scrollSnapType,
  }));
  check("scroll: native scroll-behavior auto", scrolling.behavior === "auto", JSON.stringify(scrolling));
  check("scroll: no snapping", scrolling.snapRoot === "none" && scrolling.snapBody === "none", JSON.stringify(scrolling));

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(90);
  const settledAt = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(700);
  const laterAt = await page.evaluate(() => window.scrollY);
  check("scroll: stops when the wheel stops", Math.abs(laterAt - settledAt) <= 1, `${settledAt}px then ${laterAt}px (drift ${laterAt - settledAt})`);

  const thumb = await page.evaluate(async () => {
    const root = document.documentElement;
    const read = () => ({ classes: root.className, colour: getComputedStyle(root).scrollbarColor });
    const resting = read();
    window.scrollBy(0, 140);
    await new Promise((r) => setTimeout(r, 120));
    const active = read();
    await new Promise((r) => setTimeout(r, 2200));
    return { resting, active, after: read() };
  });
  const trackOf = (value) => (value.match(/rgba?\([^)]*\)|transparent/g) || [value]).at(-1);
  const isClear = (value) => /rgba\(0, 0, 0, 0\)|transparent/.test(trackOf(value));
  check("scrollbar: thumb reveals while scrolling", /is-scrollbar-(active|edge)/.test(thumb.active.classes), thumb.active.classes);
  check("scrollbar: thumb hides after scrolling stops", !/is-scrollbar-active/.test(thumb.after.classes), thumb.after.classes);
  check("scrollbar: track stays transparent", isClear(thumb.resting.colour) && isClear(thumb.active.colour),
    `resting track ${trackOf(thumb.resting.colour)}, active track ${trackOf(thumb.active.colour)}`);

  const stability = await page.evaluate(async () => {
    const root = document.documentElement;
    const before = { client: root.clientWidth, scroll: root.scrollWidth };
    root.classList.add("is-scrollbar-active");
    await new Promise((r) => setTimeout(r, 60));
    const during = { client: root.clientWidth, scroll: root.scrollWidth };
    root.classList.remove("is-scrollbar-active");
    return { before, during };
  });
  check("scrollbar: reveal causes no layout shift",
    stability.before.client === stability.during.client && stability.before.scroll === stability.during.scroll,
    JSON.stringify(stability));
  check("scroll: no console errors", page.problems.length === 0, page.problems.join(" | ") || "clean");
  await page.context().close();
}

// ------------------------------------------------------ layout per viewport
const VIEWPORTS = [
  { width: 2048, height: 870 },
  { width: 2048, height: 1020 },
  { width: 2048, height: 989 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
];
for (const viewport of VIEWPORTS) {
  const label = `${viewport.width}x${viewport.height}`;
  const page = await openPage(viewport.width, viewport.height);
  await page.goto(target, { waitUntil: "networkidle" });
  await settle(page);

  const measured = await page.evaluate(() => {
    const root = document.documentElement;
    const pick = (selector) => document.querySelector(selector);
    const heightOf = (selector) => { const node = pick(selector); return node ? Math.round(node.getBoundingClientRect().height) : null; };

    const bands = [...document.querySelectorAll(".marker-band")].map((node) => {
      const host = node.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(node);
      const glyphs = range.getClientRects()[0];
      const layer = getComputedStyle(node, "::before");
      const px = (value) => parseFloat(value) || 0;
      return {
        text: node.textContent,
        left: +(glyphs.left - (host.left + px(layer.left))).toFixed(1),
        right: +((host.right - px(layer.right)) - glyphs.right).toFixed(1),
      };
    });

    const overflowing = [...document.querySelectorAll("header *, main *, footer *")].filter((node) => {
      const style = getComputedStyle(node);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) return false;
      if (["absolute", "fixed"].includes(style.position)) return false;
      return node.scrollWidth > node.clientWidth + 1;
    }).map((node) => `${node.tagName}.${String(node.className).split(" ")[0]}`);

    const copy = pick(".conversion__heading > p:last-child");
    let copyLines = null;
    if (copy) {
      const range = document.createRange(); range.selectNodeContents(copy);
      const tops = [...range.getClientRects()].map((r) => r.top).sort((a, b) => a - b);
      copyLines = tops.reduce((acc, top) => (acc.length && top - acc.at(-1) < 6 ? acc : (acc.push(top), acc)), []).length;
    }
    const heading = pick("#roadmap-title");
    const card = pick(".conversion-path--member");
    return {
      viewportHeight: window.innerHeight,
      horizontalOverflow: root.scrollWidth > root.clientWidth,
      overflowing: [...new Set(overflowing)].slice(0, 6),
      roadmapTable: heightOf(".roadmap__list"),
      roadmap: heightOf(".roadmap"),
      headerHero: (heightOf(".site-header") || 0) + (heightOf(".concept-hero") || 0),
      headingRight: heading ? Math.round(heading.getBoundingClientRect().right) : null,
      frameRight: heading ? Math.round(heading.closest(".roadmap").getBoundingClientRect().right) : null,
      cardWidth: card ? Math.round(card.getBoundingClientRect().width) : null,
      copyLines,
      bands,
    };
  });

  check(`layout ${label}: no horizontal overflow`,
    !measured.horizontalOverflow && measured.overflowing.length === 0,
    measured.overflowing.join(", ") || "clean");

  // WCAG AA contrast, resolved through a canvas so oklch() and color-mix()
  // report their true sRGB. Parsing the computed string instead silently
  // reports 1:1 for every colour-mixed value and hides real failures.
  const contrast = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const toRgb = (css) => {
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const channel = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
    const backdrop = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (!/rgba\(0, 0, 0, 0\)/.test(bg)) return bg;
        node = node.parentElement;
      }
      return "rgb(255,255,255)";
    };
    const failures = [];
    for (const el of document.querySelectorAll("h1,h2,h3,p,a,span,strong,label,button,legend")) {
      const text = (el.textContent || "").trim();
      if (!text || el.children.length > 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
      const need = large ? 3 : 4.5;
      const value = ratio(toRgb(style.color), toRgb(backdrop(el)));
      if (value < need) failures.push(`${value}:1 (needs ${need}) ${Math.round(size)}px "${text.slice(0, 30)}"`);
    }
    return failures;
  });
  check(`contrast ${label}: WCAG AA`, contrast.length === 0, contrast.join(" | ") || "all text passes AA");
  const tightest = Math.min(...measured.bands.map((b) => Math.min(b.left, b.right)));
  check(`highlights ${label}: optical bleed on both sides`,
    measured.bands.length === 5 && tightest >= 3,
    measured.bands.map((b) => `${b.text} ${b.left}/${b.right}`).join("  "));

  if (viewport.width === 2048 && viewport.height === 870) {
    check("roadmap: table is ~418px tall", measured.roadmapTable >= 400 && measured.roadmapTable <= 436, `${measured.roadmapTable}px`);
    check("roadmap: heading fits inside its frame", measured.headingRight <= measured.frameRight, `${measured.headingRight} <= ${measured.frameRight}`);
    check("roadmap: fills one desktop viewport", measured.roadmap === measured.viewportHeight, `${measured.roadmap} vs ${measured.viewportHeight}`);
    check("hero: header plus hero is one viewport", measured.headerHero === measured.viewportHeight, `${measured.headerHero} vs ${measured.viewportHeight}`);
  }
  if (viewport.width === 2048 && viewport.height === 989) {
    check("conversion: card is 720px wide", measured.cardWidth >= 640 && measured.cardWidth <= 720, `${measured.cardWidth}px`);
    check("conversion: supporting copy is exactly two lines", measured.copyLines === 2, `${measured.copyLines} lines`);
  }
  check(`console ${label}: clean`, page.problems.length === 0, page.problems.join(" | ") || "clean");

  if (SHOTS) {
    for (const [name, selector] of [["hero", ".concept-hero"], ["stats", ".stats"], ["corner", ".corner-block"], ["roadmap", ".roadmap"], ["conversion", ".conversion"], ["footer", ".concept-footer"]]) {
      const node = await page.$(selector);
      if (!node) continue;
      await node.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await node.screenshot({ path: path.join(SHOTS, `${label}-${name}.png`) }).catch(() => {});
    }
  }
  await page.context().close();
}

// ------------------------------------------------ one screen at ANY height
// Testing a single height hides cliff bugs: spacing that steps at a max-height
// breakpoint fits at the tested height and overflows 20px above it. Sweeping
// the realistic desktop window range is what catches that.
{
  const failures = [];
  for (const height of [830, 860, 890, 920, 960, 1020, 1080, 1200]) {
    const page = await openPage(2048, height);
    await page.goto(target, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const blocks = await page.evaluate(() => {
      const h = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().height) : 0; };
      return {
        viewport: window.innerHeight,
        "header+hero": h(".site-header") + h(".concept-hero"),
        stats: h(".stats"),
        "corner block": h(".corner-block"),
        roadmap: h(".roadmap"),
      };
    });
    for (const [name, value] of Object.entries(blocks)) {
      if (name === "viewport") continue;
      if (value > blocks.viewport + 1) failures.push(`${height}px: ${name} +${value - blocks.viewport}`);
    }
    await page.context().close();
  }
  check("layout: every block is one screen at 830-1200px tall", failures.length === 0,
    failures.join(", ") || "830, 860, 890, 920, 960, 1020, 1080, 1200 all fit");
}

// ------------------------------------- keyboard, validation, and cache keys
{
  const page = await openPage(2048, 989);
  const seen = [];
  page.on("response", (response) => seen.push(response.url()));
  await page.goto(target, { waitUntil: "networkidle" });
  await settle(page);

  await page.keyboard.press("Tab");
  const focusRing = await page.evaluate(() => {
    const node = document.activeElement;
    const style = getComputedStyle(node);
    return { tag: node.tagName, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle };
  });
  check("a11y: first tab stop shows a focus ring",
    focusRing.outlineStyle !== "none" && parseFloat(focusRing.outlineWidth) >= 2,
    JSON.stringify(focusRing));

  await page.evaluate(() => document.querySelector("#member-form").scrollIntoView());
  await page.waitForTimeout(600);
  await page.click("[data-submit]");
  await page.waitForTimeout(300);
  const validation = await page.evaluate(() => {
    const messages = [...document.querySelectorAll("[data-field-error], [data-role-error]")].map((n) => n.textContent.trim()).filter(Boolean);
    const invalid = document.querySelectorAll('[aria-invalid="true"]').length;
    return { messages: messages.length, invalid };
  });
  check("form: validation still blocks an empty submit", validation.messages > 0 && validation.invalid > 0, JSON.stringify(validation));

  const versioned = seen.filter((u) => u.includes("?v="));
  const stale = [];
  for (const url of versioned) {
    const [, file] = url.match(/\/([^/?]+)\?v=([0-9a-f]{8})/) ? [null, url.split("/").pop().split("?")[0]] : [null, null];
    const key = url.match(/\?v=([0-9a-f]{8})/)?.[1];
    if (!file || !key) continue;
    const onDisk = path.join(ROOT, url.includes("/styles/") ? "assets/styles" : "assets/scripts", file);
    const local = existsSync(onDisk) ? createHash("sha256").update(await readFile(onDisk)).digest("hex").slice(0, 8) : null;
    if (local && local !== key) stale.push(`${file} served ?v=${key} but disk hashes ${local}`);
  }
  check("cache: every versioned asset key matches its content hash", stale.length === 0,
    stale.join("; ") || `${versioned.length} versioned assets consistent`);
  check("console: clean on the interaction pass", page.problems.length === 0, page.problems.join(" | ") || "clean");
  await page.context().close();
}

await browser.close();
if (server) server.close();

const failed = results.filter((r) => !r.pass);
console.log(`\nACCEPTANCE — ${target}`);
for (const r of results) console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.id.padEnd(52)} ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ` — ${failed.length} FAILING` : " — all pass"}`);
process.exitCode = failed.length ? 1 : 0;
