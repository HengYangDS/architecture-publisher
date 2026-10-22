import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, version as esbuildVersion } from "esbuild";
import { includedPackages } from "./notices.mjs";
import { noSymlinkAncestors } from "../../packages/publisher/src/file-input/read.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const requireBanner = [
  "import { createRequire as __archpubCreateRequire, builtinModules as __archpubBuiltinModules } from 'node:module';",
  "const __archpubNodeRequire = __archpubCreateRequire(import.meta.url);",
  "const __archpubAllowed = new Set(__archpubBuiltinModules.map((name) => name.replace(/^node:/, '')));",
  "const require = (name) => { if (!__archpubAllowed.has(name.replace(/^node:/, ''))) throw new Error('external_dependency_denied:' + name); return __archpubNodeRequire(name); };",
].join("\n");

function blockedExternals(metafile) {
  const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/u, "")));
  const external = Object.values(metafile.outputs).flatMap(({ imports }) =>
    imports.filter(({ external: selected }) => selected),
  );
  const blocked = [
    ...new Set(
      external
        .filter(({ path: name }) => !builtins.has(name.replace(/^node:/u, "")))
        .map(({ path: name }) => name),
    ),
  ].sort(compare);
  if (
    blocked.length !== 1 ||
    blocked[0] !== "pnpapi" ||
    external.some(({ path: name, kind }) => name === "pnpapi" && kind !== "require-call")
  )
    throw Error("likec4_supply_external_import_changed");
  return blocked;
}

/** Build reproducible candidate bytes; this does not admit or publish the supply. */
export async function buildLikeC4Supply() {
  const parserPackage = JSON.parse(
    await fs.readFile(
      path.join(root, "node_modules/@likec4/language-services/package.json"),
      "utf8",
    ),
  );
  const result = await build({
    absWorkingDir: root,
    entryPoints: ["@likec4/language-services/node"],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    metafile: true,
    logLevel: "silent",
    banner: { js: requireBanner },
  });
  if (result.outputFiles.length !== 1) throw Error("likec4_supply_output_invalid");
  const bundle = Buffer.from(result.outputFiles[0].contents);
  const blockedExternalPackages = blockedExternals(result.metafile);
  const { packages, notices } = await includedPackages(result.metafile);
  const manifest = {
    schema: "architecture.native-parser-supply/v1",
    parser: { name: parserPackage.name, version: parserPackage.version },
    builder: { name: "esbuild", version: esbuildVersion },
    blockedExternalPackages,
    packages,
    files: [
      { path: "parser.mjs", bytes: bundle.length, sha256: sha(bundle) },
      { path: "THIRD-PARTY-NOTICES.txt", bytes: notices.length, sha256: sha(notices) },
    ],
  };
  return { bundle, notices, manifest };
}

async function supplyFiles() {
  const { bundle, notices, manifest } = await buildLikeC4Supply();
  return new Map([
    ["parser.mjs", bundle],
    ["THIRD-PARTY-NOTICES.txt", notices],
    ["supply.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n")],
  ]);
}

async function verifyDirectory(directory, expected) {
  await noSymlinkAncestors(directory);
  if (!(await fs.lstat(directory)).isDirectory()) throw Error("likec4_supply_directory_invalid");
  const entries = await fs.readdir(directory, { withFileTypes: true });
  if (
    entries.length !== expected.size ||
    entries.some((entry) => !entry.isFile() || entry.isSymbolicLink() || !expected.has(entry.name))
  )
    throw Error("likec4_supply_inventory_drift");
  for (const [name, bytes] of expected)
    if (!(await fs.readFile(path.join(directory, name))).equals(bytes))
      throw Error(`likec4_supply_file_drift:${name}`);
}

async function main() {
  const mode = process.argv[2];
  if (!["--write", "--check"].includes(mode) || process.argv.length !== 3)
    throw Error("usage: likec4.mjs --write|--check");
  const files = await supplyFiles();
  const destination = path.join(root, "packages/publisher/supplies/likec4");
  const identityPath = path.join(root, "packages/publisher/src/semantics/supply-identity.mjs");
  const identity = Buffer.from(
    "/** Generated from the admitted LikeC4 parser supply. Do not edit. */\n" +
      `export const LIKEC4_SUPPLY_SHA256 =\n  ${JSON.stringify(sha(files.get("supply.json")))};\n`,
  );
  if (mode === "--write") {
    await fs.mkdir(destination, { recursive: true });
    await noSymlinkAncestors(destination);
    const present = await fs.readdir(destination, { withFileTypes: true });
    if (
      present.some((entry) => !entry.isFile() || entry.isSymbolicLink() || !files.has(entry.name))
    )
      throw Error("likec4_supply_unknown_content");
    for (const [name, bytes] of files) await fs.writeFile(path.join(destination, name), bytes);
    await noSymlinkAncestors(path.dirname(identityPath));
    try {
      const entry = await fs.lstat(identityPath);
      if (!entry.isFile() || entry.isSymbolicLink()) throw Error("likec4_supply_identity_invalid");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fs.writeFile(identityPath, identity);
  }
  await verifyDirectory(destination, files);
  await noSymlinkAncestors(identityPath);
  if (!(await fs.readFile(identityPath)).equals(identity))
    throw Error("likec4_supply_identity_drift");
  process.stdout.write(`LikeC4 supply ${mode === "--write" ? "written" : "verified"}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
