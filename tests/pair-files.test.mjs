import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  installPairFiles,
  recoverPairFiles,
} from "../packages/publisher/src/publication/files.mjs";
import { sha, fixture, planFiles, approve } from "./fixtures/pair-files.mjs";

test("pair publisher belongs to existing delivery entry and dry-run preserves both targets", async (t) => {
  assert.equal(typeof planFiles, "function");
  const { options } = await fixture(t),
    p = await planFiles(options);
  assert.equal(p.mode, "dry-run");
  assert.equal(p.source.id, "file-test:two-media");
  assert.equal(
    p.payload.filter((f) => f.medium === "atlas" && f.path.endsWith("index.html")).length,
    13,
  );
  assert.ok(p.payload.some((f) => f.medium === "native" && f.path === "terminal/figure.svg"));
  assert.equal(p.scope, "file-installation-only");
  assert.ok(p.payload.every((f) => /^[a-f\d]{64}$/.test(f.sha256)));
  for (const target of Object.values(options.destinations))
    assert.deepEqual((await fs.readdir(target)).sort(), [
      ".DS_Store",
      "empty",
      "index.html",
      "owner-note.txt",
    ]);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("exact pair install preserves foreign bytes, previous entries and every atlas page", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  const result = await installPairFiles(p, approve(p));
  assert.equal(result.status, "INSTALLED");
  assert.equal(result.globalAtomicity, false);
  for (const medium of ["native", "atlas"]) {
    const target = options.destinations[medium];
    assert.equal(
      await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
      "keep this exact byte",
    );
    assert.equal(await fs.readFile(path.join(target, ".DS_Store"), "utf8"), "metadata");
    assert.ok((await fs.stat(path.join(target, "empty"))).isDirectory());
    const m = JSON.parse(await fs.readFile(path.join(target, "delivery-manifest.json")));
    assert.equal(m.source.digest, p.source.digest);
    assert.equal(m.planSha256, p.sha256);
    assert.equal(
      await fs.readFile(path.join(target, m.previousEntries["index.html"]), "utf8"),
      "old entry",
    );
    for (const row of p.payload.filter((f) => f.medium === medium))
      assert.equal(sha(await fs.readFile(path.join(target, row.path))), row.sha256);
    assert.equal(
      await fs.readFile(path.join(result.recovery[medium], "index.html"), "utf8"),
      "old entry",
    );
  }
  const again = await installPairFiles(p, approve(p));
  assert.equal(again.status, "ALREADY_INSTALLED");
});

test("installed verification refuses a lost preserved directory", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  assert.equal((await installPairFiles(plan, acceptance)).status, "INSTALLED");
  const preserved = path.join(options.destinations.native, "empty");
  await fs.rmdir(preserved);
  await assert.rejects(recoverPairFiles(plan, acceptance), /Installed directory set mismatch/);
  await fs.mkdir(preserved);

  const sums = path.join(options.destinations.native, "SHA256SUMS");
  const originalReadFile = fs.readFile;
  let replaced = false;
  fs.readFile = async (file, ...args) => {
    const result = await originalReadFile(file, ...args);
    if (file === sums && !replaced) {
      await fs.rmdir(preserved);
      await fs.writeFile(preserved, "concurrent replacement");
      replaced = true;
    }
    return result;
  };
  try {
    await assert.rejects(recoverPairFiles(plan, acceptance), /Preserved directory missing/);
  } finally {
    fs.readFile = originalReadFile;
  }
  assert.equal(replaced, true);
  assert.equal(await fs.readFile(preserved, "utf8"), "concurrent replacement");
  assert.equal(
    await fs.readFile(path.join(options.destinations.native, "owner-note.txt"), "utf8"),
    "keep this exact byte",
  );
});

test("missing or mismatched acceptance, stale plan and destination drift refuse all writes", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  for (const approval of [
    undefined,
    { ...approve(p), decision: "PENDING" },
    { ...approve(p), planSha256: "0".repeat(64) },
  ])
    await assert.rejects(installPairFiles(p, approval), /authorization|approved/i);
  const tampered = structuredClone(p);
  tampered.payload.pop();
  await assert.rejects(installPairFiles(tampered, approve(p)), /plan.*digest|plan.*hash/i);
  await fs.writeFile(path.join(options.destinations.native, "late.txt"), "concurrent edit");
  await assert.rejects(installPairFiles(p, approve(p)), /destination.*changed|prestate/i);
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("a destination parent removed after planning cannot be recreated implicitly", async (t) => {
  const { dir, options } = await fixture(t);
  const parent = path.join(dir, "future-delivery");
  await fs.mkdir(parent);
  options.destinations = {
    native: path.join(parent, "native"),
    atlas: path.join(parent, "atlas"),
  };
  const plan = await planFiles(options);
  await fs.rmdir(parent);

  await assert.rejects(installPairFiles(plan, approve(plan)), /Destination parent must exist/);
  await assert.rejects(fs.stat(parent), { code: "ENOENT" });
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });

  if (process.platform !== "win32") {
    const outside = path.join(dir, "unrelated");
    await fs.mkdir(outside);
    await fs.symlink(outside, parent);
    await assert.rejects(installPairFiles(plan, approve(plan)), /Destination parent must exist/);
    assert.deepEqual(await fs.readdir(outside), []);
    await fs.unlink(parent);
  }

  await fs.writeFile(parent, "foreign file");
  await assert.rejects(installPairFiles(plan, approve(plan)), /Destination parent must exist/);
  assert.equal(await fs.readFile(parent, "utf8"), "foreign file");
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("second installation failure restores both original directory states", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  let failed = false;
  const rename = async (a, b) => {
    if (!failed && b === options.destinations.atlas && a.includes("stage")) {
      failed = true;
      throw Error("Injected second installation failure");
    }
    return fs.rename(a, b);
  };
  await assert.rejects(installPairFiles(p, approve(p), { rename }), /second installation failure/);
  assert.equal(failed, true);
  for (const target of Object.values(options.destinations)) {
    assert.equal(await fs.readFile(path.join(target, "index.html"), "utf8"), "old entry");
    assert.deepEqual((await fs.readdir(target)).sort(), [
      ".DS_Store",
      "empty",
      "index.html",
      "owner-note.txt",
    ]);
  }
});

test("source or target symlinks, overlaps and payload collisions fail before writes", async (t) => {
  const { dir, options } = await fixture(t);
  await fs.mkdir(path.join(options.destinations.native, "terminal"));
  await fs.writeFile(path.join(options.destinations.native, "terminal/figure.svg"), "foreign");
  await assert.rejects(planFiles(options), /collision/i);
  await fs.unlink(path.join(options.destinations.native, "terminal/figure.svg"));
  await fs.rmdir(path.join(options.destinations.native, "terminal"));
  await fs.symlink("/not-owned", path.join(options.destinations.atlas, "foreign-link"));
  await assert.rejects(planFiles(options), /symlink|symbolic/i);
  await fs.unlink(path.join(options.destinations.atlas, "foreign-link"));
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        ...options.destinations,
        atlas: options.destinations.native,
      },
    }),
    /overlap|distinct/i,
  );
  await assert.rejects(
    planFiles({
      ...options,
      recoveryRoot: path.join(options.destinations.native, "backup"),
    }),
    /overlap/i,
  );
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        ...options.destinations,
        native: path.join(options.sourceRoots[0], "not-admitted"),
      },
    }),
    /overlap/i,
  );
  await assert.rejects(fs.stat(path.join(dir, "recovery")), { code: "ENOENT" });
});

test("a recomputed plan cannot replace the canonical payload with arbitrary content", async (t) => {
  const { dir, options } = await fixture(t),
    p = await planFiles(options),
    file = path.join(dir, "arbitrary.txt");
  await fs.writeFile(file, "arbitrary");
  p.payload[0] = {
    ...p.payload[0],
    source: file,
    sha256: sha("arbitrary"),
    bytes: 9,
  };
  const body = { ...p };
  delete body.sha256;
  p.sha256 = sha(JSON.stringify(body, null, 2) + "\n");
  await assert.rejects(installPairFiles(p, approve(p)), /canonical|plan.*changed|source outside/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("migration rehearsal reads real previous deliveries but writes only temporary copies", async (t) => {
  const prior = {
    native: process.env.PAIR_PRIOR_NATIVE,
    atlas: process.env.PAIR_PRIOR_ATLAS,
  };
  if (!prior.native && !prior.atlas) {
    t.skip("Real delivery rehearsal requires explicit PAIR_PRIOR_NATIVE and PAIR_PRIOR_ATLAS");
    return;
  }
  for (const [medium, file] of Object.entries(prior))
    assert.ok(
      typeof file === "string" && path.isAbsolute(file),
      "Explicit absolute prior " + medium + " destination required",
    );
  const { options } = await fixture(t);
  for (const [medium, old] of Object.entries(prior)) {
    await fs.rm(options.destinations[medium], { recursive: true });
    await fs.cp(old, options.destinations[medium], { recursive: true });
  }
  const p = await planFiles(options);
  assert.ok(p.prestates.native.entries.length > 30);
  assert.ok(p.prestates.atlas.entries.length > 70);
  const result = await installPairFiles(p, approve(p));
  assert.equal(result.status, "INSTALLED");
  for (const medium of ["native", "atlas"]) {
    const target = options.destinations[medium],
      m = JSON.parse(await fs.readFile(path.join(target, "delivery-manifest.json")));
    for (const before of p.prestates[medium].entries.filter((e) => e.kind === "file"))
      assert.equal(
        sha(await fs.readFile(path.join(target, m.previousEntries[before.path] ?? before.path))),
        before.sha256,
      );
  }
});

test("unknown manifest text is preserved as data, not parsed as accepted authority", async (t) => {
  const { options } = await fixture(t);
  await fs.writeFile(
    path.join(options.destinations.native, "delivery-manifest.json"),
    "owner text, not JSON",
  );
  const p = await planFiles(options),
    r = await installPairFiles(p, approve(p));
  assert.equal(r.status, "INSTALLED");
  const m = JSON.parse(
    await fs.readFile(path.join(options.destinations.native, "delivery-manifest.json")),
  );
  assert.equal(
    await fs.readFile(
      path.join(options.destinations.native, m.previousEntries["delivery-manifest.json"]),
      "utf8",
    ),
    "owner text, not JSON",
  );
});

test("JSON null old metadata is preserved without being treated as a delivery receipt", async (t) => {
  const { options } = await fixture(t);
  await fs.writeFile(path.join(options.destinations.native, "delivery-manifest.json"), "null");
  const p = await planFiles(options),
    r = await installPairFiles(p, approve(p));
  assert.equal(r.status, "INSTALLED");
});

test("reserved root metadata occupied by a directory is rejected before staging", async (t) => {
  const { options } = await fixture(t);
  await fs.mkdir(path.join(options.destinations.native, "README.md"));
  await fs.writeFile(path.join(options.destinations.native, "README.md", "child.txt"), "preserve");
  await assert.rejects(planFiles(options), /reserved.*directory|metadata.*file/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
  assert.equal(
    await fs.readFile(path.join(options.destinations.native, "README.md", "child.txt"), "utf8"),
    "preserve",
  );
});

test("case-insensitive macOS aliases cannot bypass source/destination overlap checks", async (t) => {
  const { options } = await fixture(t),
    original = options.sourceRoots[0],
    alias = original.replace("/sources", "/SOURCES");
  if ((await fs.realpath(alias).catch(() => null)) !== (await fs.realpath(original))) {
    t.skip("Case-sensitive filesystem");
    return;
  }
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        native: path.join(alias, "unwritten-native"),
        atlas: path.join(alias, "unwritten-atlas"),
      },
    }),
    /overlap|canonical/i,
  );
  await assert.rejects(fs.stat(path.join(alias, "unwritten-native")), {
    code: "ENOENT",
  });
});
