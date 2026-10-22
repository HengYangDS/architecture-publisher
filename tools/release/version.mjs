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

const workspace = await read("package.json");
const lock = await read("package-lock.json");
const packages = await Promise.all(
  workspace.value.workspaces.map(async (name) => ({
    name,
    ...(await read(`${name}/package.json`)),
  })),
);
const names = new Set(packages.map(({ value }) => value.name));

function projectDependencies(value) {
  for (const group of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ])
    for (const name of Object.keys(value[group] ?? {}))
      if (names.has(name)) value[group][name] = version;
}

delete workspace.value.version;
delete lock.value.version;
delete lock.value.packages[""].version;
for (const entry of packages) {
  entry.value.version = version;
  projectDependencies(entry.value);
  const locked = lock.value.packages[entry.name];
  if (!locked || locked.name !== entry.value.name) throw Error("version_workspace_lock_invalid");
  locked.version = version;
  projectDependencies(locked);
}

const changed = [workspace, ...packages, lock]
  .map((entry) => ({ ...entry, projected: `${JSON.stringify(entry.value, null, 2)}\n` }))
  .filter(({ text, projected }) => text !== projected);
if (mode === "--check" && changed.length) throw Error("version_projection_drift");
if (mode === "--write")
  await Promise.all(changed.map(({ file, projected }) => fs.writeFile(file, projected)));
process.stdout.write(
  `VERSION ${version} projections ${mode === "--check" ? "verified" : "updated"}\n`,
);
