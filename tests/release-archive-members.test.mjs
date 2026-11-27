import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import TABLE from "../tools/release/archive/members.json" with { type: "json" };
import { assemble, COMMAND_DIRECTORY } from "../tools/release/archive/assemble.mjs";
import { declaration } from "../tools/release/archive/declaration.mjs";
import { gunzip, gzip, readTar, writeTar } from "../tools/release/archive/tar.mjs";

// A release archive's members stand once, in the table beside the code that assembles one
// (tools/release/archive/members.json): an archive is built at their places, its launcher finds the runtime and the
// package by them, the release's declaration names the launcher's directory from them, and the operations reference's
// table is written from them (tools/docs/references.mjs). The archive's bytes are held by release-archive.test.mjs.

const root = path.resolve(import.meta.dirname, "..");
const bytes = (/** @type {string} */ text) => new TextEncoder().encode(text);
const entry = (/** @type {string} */ name, /** @type {string} */ text) => ({
  path: `package/${name}`,
  mode: 0o644,
  data: bytes(text),
});

/** The inputs of one platform's archive: a packed package with one bundled library, and Node.js and Typst. */
const INPUTS = {
  platform: "macos-arm64",
  platforms: { "macos-arm64": {} },
  packageArchive: gzip(
    writeTar([
      entry("package.json", JSON.stringify({ version: "9.9.9" })),
      entry("src/cli/main.mjs", "console.log(1);\n"),
      entry("node_modules/commander/package.json", "{}"),
      entry("node_modules/commander/LICENSE", "commander licence"),
    ]),
  ),
  node: { executable: bytes("node"), license: bytes("node licence") },
  typst: { executable: bytes("typst"), license: bytes("typst licence"), notice: bytes("notice") },
};

/** The files of an archive, by their paths. @param {{ bytes: Uint8Array }} archive */
const filesOf = (archive) =>
  readTar(gunzip(archive.bytes))
    .filter((each) => each.data)
    .map((each) => each.path);

/**
 * A copy of the release's modules in `dir`, beside the given table of members, with the repository's libraries.
 * @param {string} dir
 * @param {unknown} members
 */
async function copyWith(dir, members) {
  const code = path.join(dir, "code");
  await fs.mkdir(code);
  for (const file of ["assemble.mjs", "declaration.mjs", "tar.mjs"])
    await fs.copyFile(path.join(root, "tools/release/archive", file), path.join(code, file));
  await fs.symlink(path.join(root, "node_modules"), path.join(dir, "node_modules"));
  await fs.writeFile(path.join(code, "members.json"), JSON.stringify(members));
  return (/** @type {string} */ file) => import(pathToFileURL(path.join(code, file)).href);
}

/** Whether a file stands at a place: the place itself or a file below it. */
const within = (/** @type {string} */ file, /** @type {string} */ place) =>
  file === place || file.startsWith(`${place}/`);

test("an archive holds a file at each of the table's places and none elsewhere, and the declaration puts the launcher's directory on the path", () => {
  const places = Object.values(TABLE.members).map((member) => `${TABLE.top}/${member.path}`);
  const files = filesOf(assemble(INPUTS));
  for (const place of places)
    assert.ok(
      files.some((file) => within(file, place)),
      `nothing at ${place}`,
    );
  assert.deepEqual(
    files.filter((file) => !places.some((place) => within(file, place))),
    [],
  );
  assert.equal(
    COMMAND_DIRECTORY,
    path.posix.dirname(`${TABLE.top}/${TABLE.members.launcher.path}`),
  );
  const declared = declaration({
    version: "9.9.9",
    base: "https://example.org",
    archives: [{ platform: "macos-arm64", name: "a.tar.gz", sha256: "0".repeat(64) }],
  });
  assert.ok(declared.includes(`bin_path = "${COMMAND_DIRECTORY}" }`), declared);
});

test("the assembler reads its table: at other places an archive is built there, and its launcher finds them", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-archive-members-"));
  try {
    // A copy of the release's modules beside a table of other places, the launcher two directories below the top.
    const load = await copyWith(dir, {
      top: "publisher",
      members: {
        launcher: { path: "commands/bin/run", holds: "The command." },
        runtime: { path: "runtime", holds: "Node.js and Typst." },
        package: { path: "package", holds: "The package." },
        licenses: { path: "notices", holds: "The licences." },
      },
    });
    const copy = await load("assemble.mjs");
    const archive = readTar(gunzip(copy.assemble(INPUTS).bytes));
    assert.deepEqual(
      archive.filter((each) => each.data).map((each) => [each.path, each.mode]),
      [
        ["publisher/commands/bin/run", 0o755],
        ["publisher/notices/commander/LICENSE", 0o644],
        ["publisher/notices/node/LICENSE", 0o644],
        ["publisher/notices/typst/LICENSE", 0o644],
        ["publisher/notices/typst/NOTICE", 0o644],
        ["publisher/package/node_modules/commander/LICENSE", 0o644],
        ["publisher/package/node_modules/commander/package.json", 0o644],
        ["publisher/package/package.json", 0o644],
        ["publisher/package/src/cli/main.mjs", 0o644],
        ["publisher/runtime/node", 0o755],
        ["publisher/runtime/typst", 0o755],
      ],
    );
    assert.equal(copy.COMMAND_DIRECTORY, "publisher/commands/bin");
    const { declaration: declare } = await load("declaration.mjs");
    const declared = declare({
      version: "9.9.9",
      base: "https://example.org",
      archives: [{ platform: "macos-arm64", name: "a.tar.gz", sha256: "0".repeat(64) }],
    });
    assert.ok(declared.includes('bin_path = "publisher/commands/bin" }'), declared);
    // Unpacked, the launcher climbs to the top and runs the package on the runtime's node, which here prints what
    // it was given.
    const unpacked = path.join(dir, "unpacked");
    for (const each of archive.filter((file) => file.data)) {
      const target = path.join(unpacked, each.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, each.data, { mode: each.mode });
    }
    await fs.writeFile(path.join(unpacked, "publisher/runtime/node"), '#!/bin/sh\necho "$@"\n', {
      mode: 0o755,
    });
    const run = spawnSync("/bin/sh", [path.join(unpacked, "publisher/commands/bin/run"), "check"], {
      encoding: "utf8",
      env: { PATH: "/usr/bin:/bin" },
    });
    assert.equal(run.status, 0, run.stderr);
    const top = await fs.realpath(path.join(unpacked, "publisher"));
    assert.equal(run.stdout, `${top}/package/src/cli/main.mjs check\n`);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the assembler refuses a table that gives a member no place, naming the field", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-archive-members-"));
  try {
    const { top, members } = TABLE;
    const unplaced = await copyWith(dir, {
      top,
      members: { ...members, runtime: { holds: members.runtime.holds } },
    });
    const copy = await unplaced("assemble.mjs");
    assert.throws(() => copy.assemble(INPUTS), { message: "archive_members_invalid:runtime.path" });
    // The launcher's place is read as the module loads, for the declaration's directory of the command.
    const other = path.join(dir, "other");
    await fs.mkdir(other);
    const launcherless = await copyWith(other, { top, members: { ...members, launcher: {} } });
    await assert.rejects(launcherless("assemble.mjs"), {
      message: "archive_members_invalid:launcher.path",
    });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
