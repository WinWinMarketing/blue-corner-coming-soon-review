import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { concepts } from "./concepts.mjs";
import { renderConceptPage, renderGallery } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");

const writeGeneratedFile = async (relativePath, content) => {
  const destination = path.join(rootDirectory, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
  return relativePath;
};

const ensureConceptStyle = async (concept) => {
  const relativePath = path.join("concepts", concept.slug, "style.css");
  const destination = path.join(rootDirectory, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await access(destination, constants.F_OK);
  } catch {
    const note = `/* Concept ${concept.number} — ${concept.title}\n   Scaffold only: concept-specific art direction belongs here. */\n`;
    await writeFile(destination, note, { encoding: "utf8", flag: "wx" });
  }
};

await writeGeneratedFile("index.html", renderGallery(concepts));

for (const concept of concepts) {
  await ensureConceptStyle(concept);
  await writeGeneratedFile(path.join("concepts", concept.slug, "index.html"), renderConceptPage(concept));
}

console.log(`Generated the gallery and ${concepts.length} concept pages.`);
