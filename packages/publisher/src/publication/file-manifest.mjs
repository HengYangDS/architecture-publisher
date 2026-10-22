import fs from "node:fs/promises";
import path from "node:path";
import { QUALIFIED_SOURCE } from "./contract.mjs";
import { sha, encode, equal, sameSet, relative, noLinks, inventory } from "./file-storage.mjs";
import { metadata } from "./file-contract.mjs";

export function previousPayload(plan, medium) {
  return plan.replacement?.plan.payload.filter((row) => row.medium === medium) ?? [];
}

function expectedContents(plan, medium) {
  const before = plan.prestates[medium],
    history = "history/" + sha(encode(before)).slice(0, 20),
    previousEntries = {};
  for (const row of before.entries)
    if (metadata.includes(row.path)) previousEntries[row.path] = history + "/" + row.path;
  const files = before.entries
    .filter(
      (e) => e.kind === "file" && !previousPayload(plan, medium).some((p) => p.path === e.path),
    )
    .map((e) => ({ ...e, path: previousEntries[e.path] ?? e.path }));
  for (const row of plan.payload.filter((f) => f.medium === medium))
    files.push({
      path: row.path,
      kind: "file",
      sha256: row.sha256,
      bytes: row.bytes,
    });
  for (const [name, text] of Object.entries(plan.entries[medium]))
    files.push({
      path: name,
      kind: "file",
      sha256: sha(text),
      bytes: Buffer.byteLength(text),
    });
  files.sort((a, b) => a.path.localeCompare(b.path));
  const directories = new Set(
    before.entries.filter((e) => e.kind === "directory").map((e) => e.path),
  );
  for (const f of files)
    for (let p = path.posix.dirname(f.path); p !== "."; p = path.posix.dirname(p))
      directories.add(p);
  return { files, previousEntries, directories: [...directories].sort() };
}

export function expectedManifest(plan, medium, acceptance) {
  const { files, previousEntries } = expectedContents(plan, medium);
  return {
    schema: "architecture.pair-files-receipt/v1",
    status: "INSTALLED",
    scope: "file-installation-only",
    medium,
    source: plan.source,
    planSha256: plan.sha256,
    authorization: acceptance,
    previousEntries,
    files,
    globalAtomicity: false,
    sourceAuthority:
      plan.source?.schema === QUALIFIED_SOURCE
        ? "Selected evidence and external decisions are attributed; local installation does not authenticate claimants or verifiers or grant hosted release"
        : "Explicit input source; file installation grants no semantic or visual acceptance",
  };
}

export async function checkFiles(root, rows) {
  for (const row of rows) {
    await noLinks(relative(root, row.path));
    const b = await fs.readFile(relative(root, row.path));
    equal(sha(b), row.sha256, "Installed file mismatch: " + row.path);
  }
}

export async function verifyInstalled(plan, medium, acceptance) {
  const root = plan.options.destinations[medium],
    manifestBytes = await fs.readFile(path.join(root, "delivery-manifest.json")),
    m = expectedManifest(plan, medium, acceptance);
  equal(
    Buffer.compare(manifestBytes, Buffer.from(encode(m))),
    0,
    "Installed manifest differs from approved content",
  );
  await checkFiles(root, m.files);
  await checkFiles(
    root,
    plan.payload.filter((f) => f.medium === medium),
  );
  const actual = await inventory(root),
    paths = actual.entries
      .filter((e) => e.kind === "file")
      .map((e) => e.path)
      .sort();
  sameSet(
    actual.entries.filter((e) => e.kind === "directory").map((e) => e.path),
    expectedContents(plan, medium).directories,
    "Installed directory set mismatch",
  );
  equal(
    JSON.stringify(paths),
    JSON.stringify([...m.files.map((f) => f.path), "delivery-manifest.json", "SHA256SUMS"].sort()),
    "Installed file set mismatch",
  );
  const expected =
    m.files
      .concat({
        path: "delivery-manifest.json",
        sha256: sha(manifestBytes),
      })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join("\n") + "\n";
  equal(
    await fs.readFile(path.join(root, "SHA256SUMS"), "utf8"),
    expected,
    "Installed checksum mismatch",
  );
  for (const prior of plan.prestates[medium].entries) {
    if (prior.kind === "file" && previousPayload(plan, medium).some((p) => p.path === prior.path))
      continue;
    const p = m.previousEntries[prior.path] ?? prior.path;
    if (prior.kind === "directory") {
      if (!(await fs.stat(relative(root, p))).isDirectory())
        throw Error("Preserved directory missing");
    } else
      equal(sha(await fs.readFile(relative(root, p))), prior.sha256, "Preserved bytes mismatch");
  }
  return m;
}

export function sameInventory(a, b) {
  const normalized = (x) => ({
    exists: x.exists,
    entries: x.entries
      .map((e) =>
        e.kind === "directory"
          ? { path: e.path, kind: e.kind }
          : { path: e.path, kind: e.kind, bytes: e.bytes, sha256: e.sha256 },
      )
      .sort((p, q) => p.path.localeCompare(q.path)),
  });
  return encode(normalized(a)) === encode(normalized(b));
}

export function installedInventory(plan, medium, acceptance) {
  const manifest = expectedManifest(plan, medium, acceptance),
    body = encode(manifest);
  const sums =
    manifest.files
      .concat({ path: "delivery-manifest.json", sha256: sha(body) })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join("\n") + "\n";
  return {
    exists: true,
    entries: [
      ...expectedContents(plan, medium).directories.map((path) => ({
        path,
        kind: "directory",
      })),
      ...manifest.files,
      {
        path: "delivery-manifest.json",
        kind: "file",
        bytes: Buffer.byteLength(body),
        sha256: sha(body),
      },
      {
        path: "SHA256SUMS",
        kind: "file",
        bytes: Buffer.byteLength(sums),
        sha256: sha(sums),
      },
    ],
  };
}
