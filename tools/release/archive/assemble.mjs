import fs from "node:fs";
import path from "node:path";
import { parse } from "smol-toml";
import { gunzip, gzip, readTar, writeTar } from "./tar.mjs";

/**
 * One self-contained archive of the `archpub` command for one platform. Its members stand in the table beside this
 * module (members.json), each once with its place below the archive's top directory: the launcher, the Node.js and
 * Typst it runs, the package with the libraries it bundles, and their licences.
 */
const { top, members } = JSON.parse(
  fs.readFileSync(new URL("./members.json", import.meta.url), "utf8"),
);
/** A field of the table, refused by its name when the table does not state it. */
const stated = (/** @type {unknown} */ value, /** @type {string} */ field) => {
  if (typeof value !== "string" || !value) throw Error(`archive_members_invalid:${field}`);
  return value;
};
/** A member's place below the top. @param {"launcher" | "runtime" | "package" | "licenses"} role */
const placeOf = (role) => stated(members?.[role]?.path, `${role}.path`);
/** A member's place in the archive. @param {"launcher" | "runtime" | "package" | "licenses"} role */
const at = (role) => `${stated(top, "top")}/${placeOf(role)}`;

/** The directory that holds the command, which the release's mise declaration puts on the path. */
export const COMMAND_DIRECTORY = path.posix.dirname(at("launcher"));

/**
 * The platforms the mise lock pins both Node.js and Typst for, each with their
 * official archives' URLs and checksums.
 * @param {string} lockText the text of `.config/mise/mise.lock`
 * @returns {Record<string, { node: { url: string, checksum: string }, typst: { url: string, checksum: string } }>}
 */
export function lockedPlatforms(lockText) {
  const tools = parse(lockText).tools ?? {};
  const platformsOf = (name) => {
    const [tool] = tools[name] ?? [];
    return Object.fromEntries(
      Object.entries(tool ?? {})
        .filter(([key]) => key.startsWith("platforms."))
        .map(([key, value]) => [
          key.slice("platforms.".length),
          { url: value.url, checksum: value.checksum },
        ]),
    );
  };
  const node = platformsOf("node");
  const typst = platformsOf("typst");
  return Object.fromEntries(
    Object.keys(node)
      .filter((platform) => typst[platform])
      .sort()
      .map((platform) => [platform, { node: node[platform], typst: typst[platform] }]),
  );
}

/**
 * The launcher: a POSIX shell script that climbs from its own directory to the archive's top and runs the package on
 * the runtime's Node.js, with the runtime first on the path.
 */
export function launcher() {
  const climb = path.posix.relative(`/${path.posix.dirname(placeOf("launcher"))}`, "/");
  return [
    "#!/bin/sh",
    "# archpub: Architecture Publisher, run with the Node.js and Typst this archive holds.",
    "set -eu",
    "self=$0",
    'while [ -L "$self" ]; do',
    '  link=$(readlink "$self")',
    "  case $link in",
    "    /*) self=$link ;;",
    '    *) self=$(dirname "$self")/$link ;;',
    "  esac",
    "done",
    `root=$(cd "$(dirname "$self")/${climb}" && pwd -P)`,
    `PATH="$root/${placeOf("runtime")}:$PATH"`,
    "export PATH",
    `exec "$root/${placeOf("runtime")}/node" "$root/${placeOf("package")}/src/cli/main.mjs" "$@"`,
    "",
  ].join("\n");
}

/** A library the package bundles, by its manifest in the packed package: `package/node_modules/<name>/package.json`. */
const BUNDLED_MANIFEST = /^package\/node_modules\/((?:@[^/]+\/)?[^/]+)\/package\.json$/u;

/** A licence, copying or notice file at the top of a bundled library. */
const BUNDLED_NOTICE =
  /^package\/node_modules\/((?:@[^/]+\/)?[^/]+)\/((?:licen[cs]e|copying|notice)(?:[._-][^/]*)?)$/iu;

/**
 * The licence files of the libraries a packed package bundles, each as an entry of the archive's `licenses/`;
 * a bundled library that ships none is refused by name.
 * @param {{ path: string, data: Uint8Array }[]} packaged the files of the packed package
 */
function bundledLicenses(packaged) {
  const notices = packaged.flatMap((entry) => {
    const [, name, file] = BUNDLED_NOTICE.exec(entry.path) ?? [];
    return name
      ? [{ name, path: `${at("licenses")}/${name}/${file}`, mode: 0o644, data: entry.data }]
      : [];
  });
  for (const entry of packaged) {
    const [, name] = BUNDLED_MANIFEST.exec(entry.path) ?? [];
    if (name && !notices.some((notice) => notice.name === name))
      throw Error(`archive_license_missing:${name}`);
  }
  return notices.map(({ path, mode, data }) => ({ path, mode, data }));
}

const directoriesOf = (paths) => {
  const directories = new Set();
  for (const file of paths) {
    const parts = file.split("/");
    for (let end = 1; end < parts.length; end += 1)
      directories.add(`${parts.slice(0, end).join("/")}/`);
  }
  return [...directories].map((path) => ({ path, mode: 0o755 }));
};

/**
 * Assemble one platform's archive.
 * @param {{
 *   platform: string,
 *   platforms: ReturnType<typeof lockedPlatforms>,
 *   packageArchive: Uint8Array,
 *   node: { executable: Uint8Array, license: Uint8Array },
 *   typst: { executable: Uint8Array, license: Uint8Array, notice: Uint8Array },
 *   mtime?: number,
 * }} input
 * @returns {{ name: string, version: string, bytes: Buffer }}
 */
export function assemble({ platform, platforms, packageArchive, node, typst, mtime = 0 }) {
  if (!platforms[platform]) throw Error(`archive_platform_unverified:${platform}`);
  const packaged = readTar(gunzip(packageArchive)).filter((entry) => entry.data);
  const manifest = packaged.find((entry) => entry.path === "package/package.json");
  if (!manifest || packaged.some((entry) => !entry.path.startsWith("package/")))
    throw Error("archive_package_invalid");
  const { version } = JSON.parse(new TextDecoder().decode(manifest.data));
  const files = [
    { path: at("launcher"), mode: 0o755, data: new TextEncoder().encode(launcher()) },
    { path: `${at("runtime")}/node`, mode: 0o755, data: node.executable },
    { path: `${at("runtime")}/typst`, mode: 0o755, data: typst.executable },
    { path: `${at("licenses")}/node/LICENSE`, mode: 0o644, data: node.license },
    { path: `${at("licenses")}/typst/LICENSE`, mode: 0o644, data: typst.license },
    { path: `${at("licenses")}/typst/NOTICE`, mode: 0o644, data: typst.notice },
    ...bundledLicenses(packaged),
    ...packaged.map((entry) => ({
      path: `${at("package")}/${entry.path.slice("package/".length)}`,
      mode: 0o644,
      data: entry.data,
    })),
  ];
  const entries = [...directoriesOf(files.map((file) => file.path)), ...files];
  return {
    name: `archpub-${version}-${platform}.tar.gz`,
    version,
    bytes: gzip(writeTar(entries, mtime)),
  };
}
