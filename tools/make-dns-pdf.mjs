/* Renders docs/DNS-SETUP.md to a branded, print-ready PDF for the domain owner.
 *
 *   node tools/make-dns-pdf.mjs
 *
 * Re-run whenever the guide changes — in particular when the forwarding
 * destination is filled in, or if the domain is ever re-added to Resend and the
 * DKIM key is regenerated.
 *
 * Playwright is borrowed from a sibling checkout exactly as tools/acceptance.mjs
 * does, so this repo keeps its no-dependencies, no-package.json property. If it
 * is unavailable the script SKIPS rather than fails, so it can never block a
 * build on a machine that only needs the markdown.
 *
 * The markdown subset here is only what this one document uses. It is not a
 * general renderer and is not trying to be.
 */
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "docs/DNS-SETUP.md");
const OUTPUT = path.join(ROOT, "docs/DNS-SETUP.pdf");

const PLAYWRIGHT_CANDIDATES = [
  "c:/Users/sanja/Projects/sharkord-e2e/node_modules/playwright-core/index.mjs",
  "c:/Users/sanja/Projects/auto-site-maker/node_modules/playwright-core/index.mjs",
  path.join(ROOT, "node_modules/playwright-core/index.mjs"),
];

const NAVY = "#042874";
const BLUE = "#197CE3";
const YELLOW = "#EFC82C";
const OFF_WHITE = "#EFF3F9";
const MUTED = "#5b6f9c";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

/* Inline formatting. Code spans are extracted FIRST and put back last, so that
   backticked content containing asterisks or underscores is never treated as
   emphasis — the SPF strings in this document are full of both. */
const inline = (text) => {
  const codes = [];
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = escapeHtml(out);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[Number(i)])}</code>`);
};

const renderTable = (rows) => {
  const cells = (line) => line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  return `<table>
<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`;
};

const markdownToHtml = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let i = 0;

  const flushList = (ordered, items) =>
    `<${ordered ? "ol" : "ul"}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i += 1; continue; }

    if (/^```/.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i += 1; }
      i += 1;
      out.push(`<pre><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i += 1; continue; }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    /* Blockquotes become callouts. They can contain their own heading and list,
       so the inner content is rendered recursively. */
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i += 1; }
      out.push(`<blockquote>${markdownToHtml(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^\|/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\|/.test(lines[i])) { buf.push(lines[i]); i += 1; }
      out.push(renderTable(buf));
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/);
        if (m) { items.push(m[1]); i += 1; continue; }
        /* A wrapped continuation line belongs to the item above it. */
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += " " + lines[i].trim(); i += 1; continue; }
        break;
      }
      out.push(flushList(ordered, items));
      continue;
    }

    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^[|>#-]|^```/.test(lines[i])) { buf.push(lines[i].trim()); i += 1; }
    if (buf.length) out.push(`<p>${inline(buf.join(" "))}</p>`);
    else i += 1;
  }
  return out.join("\n");
};

const page = (bodyHtml) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>DNS setup for thebluecorner.ca</title>
<style>
  @page { size: Letter; margin: 12mm 14mm 13mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; color: ${NAVY}; background: #fff;
    font: 10pt/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* Masthead. Only on page one — it is a document header, not a running one. */
  .masthead { background: ${BLUE}; color: #fff; padding: 16px 20px; border-top: 5px solid ${YELLOW}; margin-bottom: 15px; }
  .masthead .wordmark { font-size: 15pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; margin: 0; }
  .masthead .tagline { font-size: 9pt; letter-spacing: .08em; margin: 4px 0 0; color: ${OFF_WHITE}; }

  h1 { font-size: 17pt; line-height: 1.15; margin: 0 0 8px; }
  h2 { font-size: 12.5pt; margin: 13px 0 6px; padding-bottom: 5px; border-bottom: 2px solid ${YELLOW}; break-after: avoid; }
  h3 { font-size: 11pt; margin: 12px 0 5px; break-after: avoid; }
  h4 { font-size: 10.5pt; margin: 14px 0 5px; color: ${MUTED}; text-transform: uppercase; letter-spacing: .05em; break-after: avoid; }
  p { margin: 0 0 7px; }
  strong { font-weight: 700; }
  a { color: ${BLUE}; }
  hr { border: 0; border-top: 1px solid #d6e0f0; margin: 18px 0; }
  ul, ol { margin: 0 0 10px; padding-left: 20px; }
  li { margin-bottom: 5px; }

  code {
    font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9pt;
    background: ${OFF_WHITE}; border-radius: 2px;
    /* Tight horizontal padding on purpose. At 4px the trailing padding opened a
       visible gap before a following comma or period — "@ , which is" — which
       reads as a typo in a document whose whole job is precise transcription. */
    padding: 1px 2px;
    /* The DKIM key and SPF strings are long and MUST stay readable on paper. */
    word-break: break-all;
  }
  pre {
    background: ${NAVY}; color: #fff; padding: 11px 13px; margin: 0 0 10px;
    /* Keeps the block with the heading and sentence that introduce it. */
    break-before: avoid;
    border-radius: 3px; break-inside: avoid;
  }
  pre code {
    background: none; color: #fff; padding: 0; font-size: 8.5pt; line-height: 1.5;
    white-space: pre-wrap; word-break: break-all;
  }

  table { width: 100%; border-collapse: collapse; margin: 0 0 9px; break-inside: avoid; font-size: 9pt; }
  th {
    background: ${NAVY}; color: #fff; text-align: left; padding: 6px 9px;
    font-size: 8.5pt; text-transform: uppercase; letter-spacing: .05em;
  }
  td { padding: 5.5px 9px; border-bottom: 1px solid #d6e0f0; vertical-align: top; }
  tbody tr:nth-child(even) td { background: ${OFF_WHITE}; }
  td code { background: #fff; border: 1px solid #d6e0f0; }
  tbody tr:nth-child(even) td code { background: #fff; }

  /* Callouts carry the warnings. They must never be split across a page break —
     a warning whose first half is on page 2 has failed at its job. */
  blockquote {
    margin: 0 0 12px; padding: 10px 14px;
    background: #FFF8E1; border-left: 5px solid ${YELLOW};
    break-inside: avoid;
  }
  blockquote h3 { margin: 0 0 6px; font-size: 11pt; }
  blockquote p:last-child, blockquote ul:last-child { margin-bottom: 0; }
</style></head>
<body>
  <div class="masthead">
    <p class="wordmark">The Blue Corner</p>
    <p class="tagline">Nobody Fights Alone.</p>
  </div>
  ${bodyHtml}
</body></html>`;

const main = async () => {
  const entry = PLAYWRIGHT_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!entry) {
    console.log("SKIP: playwright-core not found; the markdown is unchanged.");
    return;
  }
  /* The borrowed playwright-core defaults to a headless_shell build that is not
     installed here, so point it at the full Chromium that is — the same
     resolution tools/acceptance.mjs uses. */
  const chromiumRoot = path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  const build = existsSync(chromiumRoot)
    ? readdirSync(chromiumRoot).filter((d) => d.startsWith("chromium-")).sort().pop()
    : null;
  const executablePath = build ? path.join(chromiumRoot, build, "chrome-win64", "chrome.exe") : null;
  if (!executablePath || !existsSync(executablePath)) {
    console.log("SKIP: no local Chromium found; the markdown is unchanged.");
    return;
  }
  const { chromium } = await import(pathToFileURL(entry).href);

  const markdown = await readFile(SOURCE, "utf8");
  const html = page(markdownToHtml(markdown));

  /* Letter at 96dpi is 816x1056px. Subtracting the @page margins leaves the
     printable box; measuring at exactly that width means scrollHeight is the
     real printed height rather than a guess. */
  const PRINT_W = Math.round((215.9 - 14 * 2) / 25.4 * 96);
  const PRINT_H = Math.round((279.4 - 12 - 13) / 25.4 * 96);

  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: PRINT_W, height: PRINT_H } });
  const tab = await context.newPage();
  await tab.setContent(html, { waitUntil: "load" });

  /* Fit-to-page, so the document does not spill two lines onto a second sheet.
     Tuning the prose until it happens to land inside the page boundary works
     once and breaks on the next edit; this holds for whatever the markdown
     says. Only a modest overflow is absorbed — past 15% the type would get too
     small to read comfortably, and a genuinely long document should paginate. */
  const overflow = await tab.evaluate((limit) => document.body.scrollHeight / limit, PRINT_H);
  if (overflow > 1 && overflow <= 1.15) {
    const scale = (1 / overflow) * 0.995;
    await tab.addStyleTag({ content: `body { zoom: ${scale.toFixed(4)}; }` });
    console.log(`Content ran ${Math.round((overflow - 1) * 100)}% over one page; scaled to ${(scale * 100).toFixed(1)}% to fit.`);
  }
  await tab.pdf({
    path: OUTPUT,
    format: "Letter",
    printBackground: true,
    margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;padding:0 15mm;font:8pt Helvetica,Arial,sans-serif;color:${MUTED};display:flex;justify-content:space-between">
        <span>DNS setup for thebluecorner.ca</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
  });
  await browser.close();
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)} from ${markdown.length} chars of markdown.`);
};

await main();
