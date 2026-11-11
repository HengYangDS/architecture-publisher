import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assemble, launchers, lockedPlatforms } from "../tools/release/archive/assemble.mjs";
import { declaration } from "../tools/release/archive/declaration.mjs";
import { officialSource } from "../tools/release/archive/sources.mjs";
import { gunzip, gzip, readTar, writeTar } from "../tools/release/archive/tar.mjs";
import { parse as parseToml } from "smol-toml";

const root = path.resolve(import.meta.dirname, "..");
const bytes = (text) => new TextEncoder().encode(text);

/** A packed package as npm writes it: every file below `package/`. */
function packedPackage(version = "9.9.9") {
  return gzip(
    writeTar([
      { path: "package/package.json", mode: 0o644, data: bytes(JSON.stringify({ version })) },
      { path: "package/src/cli/main.mjs", mode: 0o644, data: bytes("console.log(1);\n") },
    ]),
  );
}

function inputs(platform) {
  return {
    platform,
    platforms: lockedPlatforms(LOCK),
    packageArchive: packedPackage(),
    node: { executable: bytes("node binary"), license: bytes("node license") },
    typst: {
      executable: bytes("typst binary"),
      license: bytes("typst license"),
      notice: bytes("typst notice"),
    },
  };
}

const LOCK = `
[[tools.node]]
version = "26.13.0"
[tools.node."platforms.linux-arm64"]
checksum = "sha256:${"1".repeat(64)}"
url = "https://nodejs.org/dist/v26.13.0/node-v26.13.0-linux-arm64.tar.gz"
[tools.node."platforms.macos-arm64"]
checksum = "sha256:${"2".repeat(64)}"
url = "https://nodejs.org/dist/v26.13.0/node-v26.13.0-darwin-arm64.tar.gz"
[tools.node."platforms.windows-arm64"]
checksum = "sha256:${"3".repeat(64)}"
url = "https://nodejs.org/dist/v26.13.0/node-v26.13.0-win-arm64.zip"
[[tools.typst]]
version = "0.15.1"
[tools.typst."platforms.linux-arm64"]
checksum = "sha256:${"4".repeat(64)}"
url = "https://github.com/typst/typst/releases/download/v0.15.1/typst-aarch64-unknown-linux-musl.tar.xz"
[tools.typst."platforms.macos-arm64"]
checksum = "sha256:${"5".repeat(64)}"
url = "https://github.com/typst/typst/releases/download/v0.15.1/typst-aarch64-apple-darwin.tar.xz"
`;

test("an archive of the same entries is the same bytes, with each entry's mode", () => {
  const entries = [
    { path: "a/", mode: 0o755 },
    { path: "a/run", mode: 0o755, data: bytes("#!/bin/sh\n") },
    { path: "a/notes.txt", mode: 0o644, data: bytes("notes\n") },
  ];
  const first = writeTar(entries, 1_700_000_000);
  assert.deepEqual(writeTar([...entries].reverse(), 1_700_000_000), first);
  const read = readTar(first);
  assert.deepEqual(
    read.map(({ path: name, mode }) => [name, mode]),
    [
      ["a/", 0o755],
      ["a/notes.txt", 0o644],
      ["a/run", 0o755],
    ],
  );
  assert.equal(new TextDecoder().decode(read[2].data), "#!/bin/sh\n");
  assert.equal(first.length % 512, 0);
});

test("a path longer than ustar can hold is refused", () => {
  const long = `${"d".repeat(160)}/${"f".repeat(101)}`;
  assert.throws(() => writeTar([{ path: long, mode: 0o644, data: bytes("") }]), {
    message: `archive_path_too_long:${long}`,
  });
  const split = `${"d".repeat(150)}/${"f".repeat(90)}`;
  assert.equal(readTar(writeTar([{ path: split, mode: 0o644, data: bytes("x") }]))[0].path, split);
});

test("gzip writes no time and no system into its header", () => {
  const packed = gzip(bytes("archive"));
  assert.deepEqual([...packed.subarray(4, 8)], [0, 0, 0, 0]);
  assert.equal(packed[9], 255);
  assert.equal(new TextDecoder().decode(gunzip(packed)), "archive");
});

test("the lock pins the five platforms the CI verifies, and a platform needs both tools", async () => {
  const lock = await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8");
  const verified = ["linux-arm64", "linux-x64", "macos-arm64", "windows-arm64", "windows-x64"];
  assert.deepEqual(Object.keys(lockedPlatforms(lock)), verified);
  assert.match(lockedPlatforms(lock)["linux-x64"].node.url, /node-v[\d.]+-linux-x64\.tar\.gz$/u);
  assert.match(
    lockedPlatforms(lock)["windows-x64"].typst.url,
    /typst-x86_64-pc-windows-msvc\.zip$/u,
  );
  // A CI job installs every locked tool, so each tool with platform archives pins all five.
  const pinned = (name) =>
    parseToml(lock)
      .tools[name].flatMap((entry) => Object.keys(entry))
      .filter((key) => key.startsWith("platforms."))
      .map((key) => key.slice("platforms.".length))
      .sort();
  for (const name of ["node", "typst", "cue", "github:tamasfe/taplo"])
    assert.deepEqual(pinned(name), verified, name);
  assert.deepEqual(Object.keys(lockedPlatforms(LOCK)), ["linux-arm64", "macos-arm64"]);
  assert.match(lockedPlatforms(LOCK)["macos-arm64"].typst.url, /typst-aarch64-apple-darwin/u);
});

test("an archive holds the command, its runtime, Typst, the package and their licenses", () => {
  const { name, bytes: archive } = assemble(inputs("macos-arm64"));
  assert.equal(name, "archpub-9.9.9-macos-arm64.tar.gz");
  const entries = readTar(gunzip(archive));
  assert.deepEqual(
    entries
      .filter((entry) => !entry.path.endsWith("/"))
      .map(({ path: name, mode }) => [name, mode]),
    [
      ["archpub/bin/archpub", 0o755],
      ["archpub/lib/architecture-publisher/package.json", 0o644],
      ["archpub/lib/architecture-publisher/src/cli/main.mjs", 0o644],
      ["archpub/libexec/node", 0o755],
      ["archpub/libexec/typst", 0o755],
      ["archpub/licenses/node/LICENSE", 0o644],
      ["archpub/licenses/typst/LICENSE", 0o644],
      ["archpub/licenses/typst/NOTICE", 0o644],
    ],
  );
  const launcher = new TextDecoder().decode(
    entries.find((entry) => entry.path === "archpub/bin/archpub").data,
  );
  assert.equal(launcher, launchers().posix);
  assert.deepEqual(assemble(inputs("macos-arm64")).bytes, archive);
});

test("a Windows archive starts the command from a batch launcher with CRLF lines", () => {
  const windows = `${LOCK}
[tools.typst."platforms.windows-arm64"]
checksum = "sha256:${"6".repeat(64)}"
url = "https://github.com/typst/typst/releases/download/v0.15.1/typst-aarch64-pc-windows-msvc.zip"
`;
  const archive = assemble({ ...inputs("windows-arm64"), platforms: lockedPlatforms(windows) });
  assert.equal(archive.name, "archpub-9.9.9-windows-arm64.tar.gz");
  const entries = readTar(gunzip(archive.bytes));
  const names = entries.map((entry) => entry.path);
  assert.ok(names.includes("archpub/bin/archpub.cmd"));
  assert.ok(names.includes("archpub/libexec/node.exe"));
  assert.ok(names.includes("archpub/libexec/typst.exe"));
  const launcher = new TextDecoder().decode(
    entries.find((entry) => entry.path === "archpub/bin/archpub.cmd").data,
  );
  assert.equal(launcher, launchers().windows);
  assert.ok(
    launcher
      .split("\n")
      .slice(0, -1)
      .every((line) => line.endsWith("\r")),
  );
});

test("a platform the lock does not pin for both tools is refused", () => {
  assert.throws(() => assemble(inputs("windows-arm64")), {
    message: "archive_platform_unverified:windows-arm64",
  });
  assert.throws(() => assemble(inputs("linux-x64")), {
    message: "archive_platform_unverified:linux-x64",
  });
});

test("the declaration names each archive's URL, SHA-256 and command directory", () => {
  const text = declaration({
    version: "9.9.9",
    base: "https://github.com/HengYangDS/architecture-publisher/releases/download/v9.9.9",
    archives: [
      { platform: "macos-arm64", name: "archpub-9.9.9-macos-arm64.tar.gz", sha256: "a".repeat(64) },
      { platform: "linux-arm64", name: "archpub-9.9.9-linux-arm64.tar.gz", sha256: "b".repeat(64) },
    ],
  });
  assert.equal(
    text,
    [
      '[tools."http:archpub"]',
      'version = "9.9.9"',
      "",
      '[tools."http:archpub".platforms]',
      `linux-arm64 = { url = "https://github.com/HengYangDS/architecture-publisher/releases/download/v9.9.9/archpub-9.9.9-linux-arm64.tar.gz", checksum = "sha256:${"b".repeat(64)}", bin_path = "archpub/bin" }`,
      `macos-arm64 = { url = "https://github.com/HengYangDS/architecture-publisher/releases/download/v9.9.9/archpub-9.9.9-macos-arm64.tar.gz", checksum = "sha256:${"a".repeat(64)}", bin_path = "archpub/bin" }`,
      "",
    ].join("\n"),
  );
});

test("an official archive whose bytes differ from the lock is refused before it is opened", async (t) => {
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-archive-"));
  t.after(() => fs.rm(cache, { recursive: true, force: true }));
  const locked = lockedPlatforms(LOCK)["macos-arm64"];
  await fs.writeFile(
    path.join(cache, path.basename(new URL(locked.node.url).pathname)),
    "corrupted",
  );
  await assert.rejects(officialSource(locked, { cache, download: false }), {
    message: `archive_checksum_mismatch:${path.basename(new URL(locked.node.url).pathname)}`,
  });
});

/**
 * A local server for the official archives: each path answers with the statuses it is given, in turn, and then with
 * its bytes. Returns the base URL and the requests each path received.
 * @param {Record<string, { statuses: number[], body: Uint8Array }>} routes
 */
async function archiveServer(t, routes) {
  const requests = Object.fromEntries(Object.keys(routes).map((route) => [route, 0]));
  const server = http.createServer((request, response) => {
    const route = routes[request.url ?? ""];
    if (!route) return void response.writeHead(404).end();
    const status = route.statuses[requests[request.url ?? ""]++] ?? 200;
    if (status === 200) response.writeHead(200).end(route.body);
    else response.writeHead(status).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  t.after(() => new Promise((resolve) => server.close(() => resolve(undefined))));
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
  return { base: `http://127.0.0.1:${port}`, requests };
}

/** A platform's locked Node.js and Typst archives, served by `server` with the given statuses. */
async function servedPlatform(t, statuses) {
  const archive = (name, entries) => {
    const body = gzip(
      writeTar(
        entries.map(([file, text]) => ({
          path: `${name}/${file}`,
          mode: 0o755,
          data: bytes(text),
        })),
      ),
    );
    return { body, checksum: `sha256:${createHash("sha256").update(body).digest("hex")}` };
  };
  const node = archive("node-v26.13.0-darwin-arm64", [
    ["bin/node", "node"],
    ["LICENSE", "node license"],
  ]);
  const typst = archive("typst-aarch64-apple-darwin", [
    ["typst", "typst"],
    ["LICENSE", "typst license"],
    ["NOTICE", "typst notice"],
  ]);
  const { base, requests } = await archiveServer(t, {
    "/node.tar.gz": { statuses: statuses.node ?? [], body: node.body },
    "/typst.tar.gz": { statuses: statuses.typst ?? [], body: typst.body },
  });
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-archive-"));
  t.after(() => fs.rm(cache, { recursive: true, force: true }));
  return {
    locked: {
      node: { url: `${base}/node.tar.gz`, checksum: node.checksum },
      typst: { url: `${base}/typst.tar.gz`, checksum: typst.checksum },
    },
    cache,
    requests,
  };
}

/** A schedule of milliseconds, so an outage passes in the test as it would in minutes. */
const QUICK = { first: 5, ceiling: 20, deadline: 400 };

test("an official archive that answers 504 three times and then its bytes is downloaded, verified and extracted", async (t) => {
  const { locked, cache, requests } = await servedPlatform(t, { typst: [504, 504, 504] });
  const source = await officialSource(locked, { cache, schedule: QUICK });
  assert.equal(new TextDecoder().decode(source.typst.executable), "typst");
  assert.equal(new TextDecoder().decode(source.node.license), "node license");
  assert.deepEqual(requests, { "/node.tar.gz": 1, "/typst.tar.gz": 4 });
});

test("an official archive that keeps answering 504 is refused once the schedule's deadline passes", async (t) => {
  const { locked, cache, requests } = await servedPlatform(t, { node: Array(1000).fill(504) });
  const started = Date.now();
  await assert.rejects(officialSource(locked, { cache, schedule: QUICK }), {
    message: /^archive_source_unavailable:node\.tar\.gz:504 after \d+ attempts$/u,
  });
  assert.ok(Date.now() - started >= QUICK.deadline, "refused before the deadline");
  assert.ok(requests["/node.tar.gz"] > 3, "the download gave up after three attempts");
});

test("an official archive that answers 404 is refused after one request", async (t) => {
  const { locked, cache, requests } = await servedPlatform(t, { node: [404] });
  await assert.rejects(officialSource(locked, { cache, schedule: QUICK }), {
    message: "archive_source_unavailable:node.tar.gz:404 after 1 attempt",
  });
  assert.equal(requests["/node.tar.gz"], 1);
});
