import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { assemble, lockedPlatforms } from "./archive/assemble.mjs";
import { declaration } from "./archive/declaration.mjs";
import { installedSource, officialSource } from "./archive/sources.mjs";

/**
 * Assemble self-contained `archpub` archives, or write the mise declaration of a
 * release's archives.
 *
 *   node tools/release/archive.mjs assemble --package <tgz> --out <dir>
 *       [--platform <platform>|all] [--node <executable> --typst <executable> | --official]
 *   node tools/release/archive.mjs declare --dir <dir> --version <version> --base-url <url>
 *
 * `--official` reads each platform's locked Node.js and Typst archives, downloading
 * them into the tool cache; without it the archive takes the given executables.
 * `SOURCE_DATE_EPOCH` sets every entry's modification time.
 */

const root = path.resolve(import.meta.dirname, "../..");
const usage =
  "usage: node tools/release/archive.mjs assemble --package <tgz> --out <dir> [--platform <platform>|all] [--node <executable> --typst <executable> | --official]\n" +
  "       node tools/release/archive.mjs declare --dir <dir> --version <version> --base-url <url>";
const current = `${{ darwin: "macos", linux: "linux", win32: "windows" }[process.platform]}-${process.arch}`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    package: { type: "string" },
    out: { type: "string" },
    platform: { type: "string", default: current },
    node: { type: "string", default: process.execPath },
    typst: { type: "string" },
    official: { type: "boolean", default: false },
    dir: { type: "string" },
    version: { type: "string" },
    "base-url": { type: "string" },
  },
});

if (positionals[0] === "assemble" && values.package && values.out) {
  const platforms = lockedPlatforms(
    await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8"),
  );
  const selected = values.platform === "all" ? Object.keys(platforms) : [values.platform];
  if (!values.official && (selected.length !== 1 || !values.typst)) throw Error(usage);
  const packageArchive = await fs.readFile(values.package);
  const mtime = Number.parseInt(process.env.SOURCE_DATE_EPOCH ?? "0", 10);
  await fs.mkdir(values.out, { recursive: true });
  for (const platform of selected) {
    if (!platforms[platform]) throw Error(`archive_platform_unverified:${platform}`);
    const source = values.official
      ? await officialSource(platforms[platform], {
          cache: path.join(root, "build/runtime/tool-cache/archive"),
        })
      : await installedSource({ node: values.node, typst: values.typst });
    const archive = assemble({ platform, platforms, packageArchive, mtime, ...source });
    const file = path.join(values.out, archive.name);
    await fs.writeFile(file, archive.bytes);
    console.log(
      JSON.stringify({
        platform,
        file,
        bytes: archive.bytes.length,
        sha256: sha256(archive.bytes),
      }),
    );
  }
} else if (positionals[0] === "declare" && values.dir && values.version && values["base-url"]) {
  const pattern = new RegExp(
    `^archpub-${values.version.replaceAll(".", "\\.")}-([a-z]+-[a-z0-9]+)\\.tar\\.gz$`,
    "u",
  );
  const archives = [];
  for (const name of (await fs.readdir(values.dir)).sort()) {
    const match = pattern.exec(name);
    if (match)
      archives.push({
        platform: match[1],
        name,
        sha256: sha256(await fs.readFile(path.join(values.dir, name))),
      });
  }
  if (archives.length === 0) throw Error(`archive_none:${values.dir}`);
  const file = path.join(values.dir, `architecture-publisher-${values.version}.mise.toml`);
  await fs.writeFile(
    file,
    declaration({ version: values.version, base: values["base-url"], archives }),
  );
  console.log(JSON.stringify({ file, platforms: archives.map((archive) => archive.platform) }));
} else {
  throw Error(usage);
}
