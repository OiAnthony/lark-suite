import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = join(root, "skills", "lark-suite");
const entry = join(skillRoot, "SKILL.md");
const references = join(skillRoot, "references");
const syncState = JSON.parse(await readFile(join(root, "sync-state.json"), "utf8"));

await assertFile(entry);
await assertDirectory(references);
const entryText = await readFile(entry, "utf8");
if (!/^name:\s*lark-suite\s*$/m.test(entryText)) {
  throw new Error("SKILL.md must declare name: lark-suite");
}
if (/<!-- LARK_SUITE_(?:KEYS|ROUTES) -->/.test(entryText)) {
  throw new Error("SKILL.md contains an unexpanded suite placeholder");
}

const domains = (await readdir(references, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (domains.length === 0) {
  throw new Error("No domain guides found");
}
if (syncState.skillsLayout !== "suite" || syncState.officialDomainCount !== domains.length) {
  throw new Error("sync-state.json does not match the generated suite layout");
}

let guideCount = 0;
for (const domain of domains) {
  const guide = join(references, domain, "GUIDE.md");
  await assertFile(guide);
  guideCount += 1;
  await checkMarkdownLinks(guide);
  const files = await readdir(join(references, domain), { withFileTypes: true });
  if (files.some((entry) => entry.isFile() && entry.name === "SKILL.md")) {
    throw new Error(`${domain} contains a nested SKILL.md`);
  }
}

console.log(`Validated lark-suite with ${guideCount} domain guides and local Markdown links.`);

async function assertFile(path) {
  const info = await lstat(path);
  if (!info.isFile()) throw new Error(`${relative(root, path)} is not a regular file`);
}

async function assertDirectory(path) {
  const info = await lstat(path);
  if (!info.isDirectory()) throw new Error(`${relative(root, path)} is not a directory`);
}

async function checkMarkdownLinks(path) {
  const text = await readFile(path, "utf8");
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1].trim().split(/[?#]/, 1)[0];
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target) || target.startsWith("#")) continue;
    const resolved = resolve(dirname(path), target);
    if (!resolved.startsWith(skillRoot + "/") && resolved !== skillRoot) {
      throw new Error(`${relative(root, path)} links outside skill root: ${target}`);
    }
    await assertPath(resolved);
  }
}

async function assertPath(path) {
  try {
    await lstat(path);
  } catch {
    throw new Error(`${relative(root, path)} does not exist`);
  }
}
