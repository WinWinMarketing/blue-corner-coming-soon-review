import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderHomePage } from "./template.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const staleConceptsDirectory = path.join(rootDirectory, "concepts");

await rm(staleConceptsDirectory, { recursive: true, force: true });
await mkdir(rootDirectory, { recursive: true });
await writeFile(path.join(rootDirectory, "index.html"), renderHomePage(), "utf8");

console.log("Generated the canonical Blue Corner homepage and removed stale concept routes.");
