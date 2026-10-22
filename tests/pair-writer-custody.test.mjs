import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { planPairFiles } from "../packages/publisher/src/publication/file-plan.mjs";
import {
  installPairFiles,
  recoverPairFiles,
} from "../packages/publisher/src/publication/files.mjs";
import { inventory } from "../packages/publisher/src/publication/file-storage.mjs";
import { fixture, planFiles, approve, interruptWriter } from "./fixtures/pair-files.mjs";

test("an ambiguous empty writer lock is never replaced by an installation", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    lock = path.join(dir, ".architecture-publication-writer");
  await fs.mkdir(lock);
  await assert.rejects(installPairFiles(plan, approve(plan)));
  assert.deepEqual(await fs.readdir(lock), []);
  for (const target of Object.values(options.destinations))
    assert.equal(await fs.readFile(path.join(target, "index.html"), "utf8"), "old entry");
});

test("unknown writer-control state remains owned and cannot be silently reclaimed", async (t) => {
  for (const [name, owner, expected] of [
    ["legacy", null, /Legacy writer lock recovery requires inspection/],
    [
      "invalid token",
      { token: "bad", pid: process.pid, host: os.hostname() },
      /Invalid writer lock identity/,
    ],
    [
      "invalid process",
      { token: "00000000-0000-4000-8000-000000000000", pid: 0, host: os.hostname() },
      /Invalid writer lock process/,
    ],
  ]) {
    const { dir, options } = await fixture(t),
      plan = await planFiles(options),
      lock = path.join(dir, ".architecture-publication-writer");
    if (name === "legacy") await fs.mkdir(lock + "-recovery");
    else {
      await fs.mkdir(lock);
      await fs.writeFile(
        path.join(lock, "owner.json"),
        JSON.stringify({ ...owner, planSha256: plan.sha256 }),
      );
    }
    await assert.rejects(installPairFiles(plan, approve(plan)), expected, name);
    for (const target of Object.values(options.destinations))
      assert.equal(await fs.readFile(path.join(target, "index.html"), "utf8"), "old entry");
  }
});

test("writer preparation and release failures never masquerade as installed success", async (t) => {
  const preparation = await fixture(t);
  const pendingPlan = await planFiles(preparation.options);
  const pendingLock = path.join(preparation.dir, ".architecture-publication-writer");
  const nativeRename = fs.rename;
  fs.rename = async (from, to) => {
    if (to === pendingLock && from.startsWith(pendingLock + "-pending-"))
      throw Error("activation denied");
    return nativeRename(from, to);
  };
  try {
    await assert.rejects(installPairFiles(pendingPlan, approve(pendingPlan)), /activation denied/);
  } finally {
    fs.rename = nativeRename;
  }
  assert.equal(
    (await fs.readdir(preparation.dir)).some((name) => name.includes("writer-pending")),
    false,
  );

  const release = await fixture(t);
  const completed = await planFiles(release.options);
  const lock = path.join(release.dir, ".architecture-publication-writer");
  fs.rename = async (from, to) => {
    if (from === lock && to.startsWith(lock + "-history")) throw Error("release denied");
    return nativeRename(from, to);
  };
  try {
    await assert.rejects(installPairFiles(completed, approve(completed)), /release denied/);
  } finally {
    fs.rename = nativeRename;
  }
  assert.equal((await fs.stat(lock)).isDirectory(), true);
});

test("partial receipts and occupied recovery identities refuse a fresh installation", async (t) => {
  const malformed = await fixture(t);
  const malformedPlan = await planFiles(malformed.options);
  await fs.mkdir(path.join(malformed.options.destinations.native, "delivery-manifest.json"));
  await assert.rejects(installPairFiles(malformedPlan, approve(malformedPlan)), {
    code: "EISDIR",
  });

  const partial = await fixture(t);
  const partialPlan = await planFiles(partial.options);
  await fs.writeFile(
    path.join(partial.options.destinations.native, "delivery-manifest.json"),
    JSON.stringify({
      schema: "architecture.pair-files-receipt/v1",
      planSha256: partialPlan.sha256,
    }),
  );
  await assert.rejects(
    installPairFiles(partialPlan, approve(partialPlan)),
    /Partial prior install/,
  );
  assert.equal(
    await fs.readFile(path.join(partial.options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );

  const occupied = await fixture(t);
  const occupiedPlan = await planFiles(occupied.options);
  await fs.mkdir(path.join(occupied.options.recoveryRoot, occupiedPlan.sha256.slice(0, 20)), {
    recursive: true,
  });
  await assert.rejects(
    installPairFiles(occupiedPlan, approve(occupiedPlan)),
    /Recorded operation already exists/,
  );
});

test("a delayed stale reclaimer cannot move a newer active writer", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const lock = path.join(dir, ".architecture-publication-writer"),
    rename = fs.rename;
  let raced = false;
  fs.rename = async (a, b) => {
    if (!raced && a === lock) {
      raced = true;
      assert.equal((await recoverPairFiles(plan, acceptance)).status, "ROLLED_BACK");
      const next = await planPairFiles({
        options,
        source: { id: "next-file-test" },
        payload: plan.payload,
        entries: plan.entries,
        dependencies: plan.dependencies,
      });
      let checked = false;
      await installPairFiles(next, approve(next), {
        rename: async (from, to) => {
          if (!checked) {
            checked = true;
            const owner = await fs.readFile(path.join(lock, "owner.json"), "utf8");
            const retainedOwner = await fs.readFile(path.join(b, "owner.json"));
            const sourceIdentity = await fs.stat(a);
            const retainedIdentity = await fs.stat(b);
            await assert.rejects(
              rename(a, b),
              (e) =>
                e.syscall === "rename" &&
                e.path === a &&
                e.dest === b &&
                (["EEXIST", "ENOTEMPTY"].includes(e.code) ||
                  (process.platform === "win32" && e.code === "EPERM")),
            );
            assert.equal(await fs.readFile(path.join(lock, "owner.json"), "utf8"), owner);
            assert.deepEqual(await fs.readFile(path.join(b, "owner.json")), retainedOwner);
            const unchangedSource = await fs.stat(a);
            const unchangedRetained = await fs.stat(b);
            assert.deepEqual(
              [unchangedSource.dev, unchangedSource.ino],
              [sourceIdentity.dev, sourceIdentity.ino],
            );
            assert.deepEqual(
              [unchangedRetained.dev, unchangedRetained.ino],
              [retainedIdentity.dev, retainedIdentity.ino],
            );
          }
          return rename(from, to);
        },
      });
      assert.equal(checked, true);
      throw Error("Delayed reclaimer lost exact identity");
    }
    return rename(a, b);
  };
  try {
    await assert.rejects(recoverPairFiles(plan, acceptance), /lost exact identity/);
  } finally {
    fs.rename = rename;
  }
  assert.equal(raced, true);
  for (const target of Object.values(options.destinations))
    assert.equal(
      await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
      "keep this exact byte",
    );
});

test("writer control locations cannot be selected as user destinations", async (t) => {
  const { dir, options } = await fixture(t);
  for (const name of [
    ".architecture-publication-writer",
    ".architecture-publication-writer-history",
    ".architecture-publication-stage-conflict",
  ])
    await assert.rejects(
      planFiles({
        ...options,
        destinations: { ...options.destinations, native: path.join(dir, name) },
      }),
      /reserved.*namespace/i,
    );
  for (const name of [
    ".architecture-publication-writer-history/nested",
    ".ARCHITECTURE-PUBLICATION-WRITER-HISTORY",
  ])
    await assert.rejects(
      planFiles({ ...options, recoveryRoot: path.join(dir, name) }),
      /reserved.*namespace/i,
    );
});

test("foreign-host and different-plan writer records are preserved and refused", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const file = path.join(dir, ".architecture-publication-writer/owner.json"),
    original = JSON.parse(await fs.readFile(file));
  for (const changed of [
    { ...original, host: "another-host.invalid" },
    { ...original, planSha256: "0".repeat(64) },
  ]) {
    const bytes = JSON.stringify(changed);
    await fs.writeFile(file, bytes);
    await assert.rejects(recoverPairFiles(plan, acceptance), /active installer|exact prior plan/);
    assert.equal(await fs.readFile(file, "utf8"), bytes);
  }
  await fs.writeFile(file, JSON.stringify(original));
  assert.equal((await recoverPairFiles(plan, acceptance)).status, "ROLLED_BACK");
});

test("recovery rejects duplicated writer identity without moving retained state", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    authorization = approve(plan);
  await interruptWriter(dir, plan, authorization, "save-native", "after");
  const ownerFile = path.join(dir, ".architecture-publication-writer/owner.json");
  const original = await fs.readFile(ownerFile, "utf8");
  const altered = original.replace('"host":', '"host":"forged.invalid","host":');
  assert.notEqual(altered, original);
  await fs.writeFile(ownerFile, altered);
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);
  await assert.rejects(recoverPairFiles(plan, authorization), {
    code: "publication_writer_lock_json_duplicate_key",
  });
  assert.equal(await fs.readFile(ownerFile, "utf8"), altered);
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
});

test("a second writer is refused while the first installer owns the same destination parent", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  let secondObserved = false;
  const rename = async (a, b) => {
    if (!secondObserved && a === options.destinations.native) {
      secondObserved = true;
      await assert.rejects(installPairFiles(plan, acceptance), /active installer|writer lock/);
    }
    await fs.rename(a, b);
  };
  assert.equal((await installPairFiles(plan, acceptance, { rename })).status, "INSTALLED");
  assert.equal(secondObserved, true);
  assert.equal((await recoverPairFiles(plan, acceptance)).status, "ALREADY_INSTALLED");
});

test("writer release failure preserves the publication failure that triggered cleanup", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan),
    lock = path.join(dir, ".architecture-publication-writer"),
    nativeRename = fs.rename;
  fs.rename = async (source, target) => {
    if (source === lock) throw Error("release failed");
    return nativeRename(source, target);
  };
  try {
    await assert.rejects(
      installPairFiles(plan, acceptance, {
        rename: async () => {
          throw Error("publication failed");
        },
      }),
      (error) => {
        assert(error instanceof AggregateError);
        assert.match(error.cause.message, /^publication failed;/);
        assert.equal(error.cause.cause.message, "publication failed");
        assert.deepEqual(
          error.errors.map(({ message }) => message.endsWith("release failed")),
          [false, true],
        );
        return true;
      },
    );
  } finally {
    fs.rename = nativeRename;
  }
});
