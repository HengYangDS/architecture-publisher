import fs from "node:fs/promises";
import path from "node:path";
import { valid } from "semver";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw Error("usage: node tools/release/version.mjs --check|--write");

const root = path.resolve(import.meta.dirname, "../..");
const source = await fs.readFile(path.join(root, "VERSION"), "utf8");
const version = source.trim();
if (!/^\d/u.test(version) || valid(version) === null || source !== `${version}\n`)
  throw Error("version_source_invalid");

async function read(name) {
  const file = path.join(root, name);
  const text = await fs.readFile(file, "utf8");
  return { file, text, value: JSON.parse(text) };
}

const manifest = await read("package.json");
const lock = await read("package-lock.json");
const locked = lock.value.packages[""];
if (!locked || locked.name !== manifest.value.name || lock.value.name !== manifest.value.name)
  throw Error("version_lock_invalid");

manifest.value.version = version;
lock.value.version = version;
locked.version = version;

const changed = [manifest, lock]
  .map((entry) => ({ ...entry, projected: `${JSON.stringify(entry.value, null, 2)}\n` }))
  .filter(({ text, projected }) => text !== projected);
if (mode === "--check" && changed.length) throw Error("version_projection_drift");
if (mode === "--write")
  await Promise.all(changed.map(({ file, projected }) => fs.writeFile(file, projected)));
process.stdout.write(
  `VERSION ${version} projections ${mode === "--check" ? "verified" : "updated"}\n`,
);
