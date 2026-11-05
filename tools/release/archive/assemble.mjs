import { parse } from "smol-toml";
import { gunzip, gzip, readTar, writeTar } from "./tar.mjs";

/**
 * One self-contained archive of the `archpub` command for one platform: its
 * launcher, the Node.js and Typst it runs, the package and their licenses.
 */

const TOP = "archpub";
const PACKAGE = `${TOP}/lib/architecture-publisher`;

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

/** The launchers: a POSIX shell script, and a batch file for Windows with CRLF lines. */
export function launchers() {
  const posix = [
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
    'root=$(cd "$(dirname "$self")/.." && pwd -P)',
    'PATH="$root/libexec:$PATH"',
    "export PATH",
    'exec "$root/libexec/node" "$root/lib/architecture-publisher/src/cli/main.mjs" "$@"',
    "",
  ].join("\n");
  const windows = [
    "@echo off",
    "rem archpub: Architecture Publisher, run with the Node.js and Typst this archive holds.",
    "setlocal",
    'set "ARCHPUB_ROOT=%~dp0.."',
    'set "PATH=%ARCHPUB_ROOT%\\libexec;%PATH%"',
    '"%ARCHPUB_ROOT%\\libexec\\node.exe" "%ARCHPUB_ROOT%\\lib\\architecture-publisher\\src\\cli\\main.mjs" %*',
    "exit /b %ERRORLEVEL%",
    "",
  ].join("\r\n");
  return { posix, windows };
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
  const windows = platform.startsWith("windows-");
  const exe = windows ? ".exe" : "";
  const packaged = readTar(gunzip(packageArchive)).filter((entry) => entry.data);
  const manifest = packaged.find((entry) => entry.path === "package/package.json");
  if (!manifest || packaged.some((entry) => !entry.path.startsWith("package/")))
    throw Error("archive_package_invalid");
  const { version } = JSON.parse(new TextDecoder().decode(manifest.data));
  const { posix, windows: batch } = launchers();
  const files = [
    windows
      ? { path: `${TOP}/bin/archpub.cmd`, mode: 0o755, data: new TextEncoder().encode(batch) }
      : { path: `${TOP}/bin/archpub`, mode: 0o755, data: new TextEncoder().encode(posix) },
    { path: `${TOP}/libexec/node${exe}`, mode: 0o755, data: node.executable },
    { path: `${TOP}/libexec/typst${exe}`, mode: 0o755, data: typst.executable },
    { path: `${TOP}/licenses/node/LICENSE`, mode: 0o644, data: node.license },
    { path: `${TOP}/licenses/typst/LICENSE`, mode: 0o644, data: typst.license },
    { path: `${TOP}/licenses/typst/NOTICE`, mode: 0o644, data: typst.notice },
    ...packaged.map((entry) => ({
      path: `${PACKAGE}/${entry.path.slice("package/".length)}`,
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
