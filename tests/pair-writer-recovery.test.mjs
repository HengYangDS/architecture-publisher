import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { assertSelfInterrupted, selfInterruptionSource } from "./fixtures/process-termination.mjs";
import { spawnSync } from "node:child_process";
import {
  installPairFiles,
  recoverPairFiles,
} from "../packages/publisher/src/publication/files.mjs";
import { inventory } from "../packages/publisher/src/publication/file-storage.mjs";
import { fixture, planFiles, approve, interruptWriter } from "./fixtures/pair-files.mjs";

for (const phase of ["owner-publication", "activation", "release"])
  for (const side of ["before", "after"])
    test(`writer termination ${side} ${phase} leaves a recoverable or unstarted operation`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      await interruptWriter(dir, plan, acceptance, phase, side);
      const result = await recoverPairFiles(plan, acceptance);
      assert.equal(result.status, phase === "release" ? "ALREADY_INSTALLED" : "NOT_STARTED");
      if (phase !== "release") {
        for (const target of Object.values(options.destinations))
          assert.deepEqual((await fs.readdir(target)).sort(), [
            ".DS_Store",
            "empty",
            "index.html",
            "owner-note.txt",
          ]);
        assert.equal((await installPairFiles(plan, acceptance)).status, "INSTALLED");
      }
      for (const target of Object.values(options.destinations))
        assert.equal(
          await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
          "keep this exact byte",
        );
    });

for (const side of ["before", "after"])
  test(`writer termination ${side} stale reclamation can be resumed`, async (t) => {
    const { dir, options } = await fixture(t),
      plan = await planFiles(options),
      acceptance = approve(plan);
    await interruptWriter(dir, plan, acceptance, "save-native", "after");
    await interruptWriter(dir, plan, acceptance, "reclaim", side, "recover");
    assert.equal((await recoverPairFiles(plan, acceptance)).status, "ROLLED_BACK");
    assert.equal((await recoverPairFiles(plan, acceptance)).status, "ALREADY_ROLLED_BACK");
    for (const target of Object.values(options.destinations))
      assert.deepEqual((await fs.readdir(target)).sort(), [
        ".DS_Store",
        "empty",
        "index.html",
        "owner-note.txt",
      ]);
  });

test("recovery refuses a changed retained preimage before restoring any destination", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20)),
    retained = path.join(operation, "prior-native", "index.html");
  await fs.writeFile(retained, "changed after interruption");

  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /Recovery prior content changed: native/,
  );
  assert.equal(await fs.readFile(retained, "utf8"), "changed after interruption");
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );
});

test("recovery refuses a missing retained preimage instead of inventing prior bytes", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
  await fs.rm(path.join(operation, "prior-native"), { recursive: true });

  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /Recovery prior content missing: native/,
  );
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );
});

test("recovery refuses a changed retained output before moving either destination", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
  const failed = path.join(operation, "failed-native");
  await fs.mkdir(failed);
  await fs.writeFile(path.join(failed, "foreign.txt"), "not the selected output");
  const atlasBefore = await inventory(options.destinations.atlas);

  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /Recovery retained output changed: native/,
  );
  assert.equal(
    await fs.readFile(path.join(failed, "foreign.txt"), "utf8"),
    "not the selected output",
  );
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
});

test("recovery refuses duplicate prior state even when both copies have exact bytes", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
  const prior = path.join(operation, "prior-native");
  await fs.cp(prior, options.destinations.native, { recursive: true });
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);

  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /Recovery has ambiguous duplicate prior: native/,
  );
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
  assert.deepEqual(await inventory(prior), nativeBefore);
});

test("recovery does not overwrite an existing retained output identity", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  assert.equal((await installPairFiles(plan, acceptance)).status, "INSTALLED");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
  const failed = path.join(operation, "failed-native");
  await fs.cp(options.destinations.native, failed, { recursive: true });
  const journalFile = path.join(operation, "operation.json");
  const journal = JSON.parse(await fs.readFile(journalFile, "utf8"));
  journal.status = "INSTALLING";
  await fs.writeFile(journalFile, JSON.stringify(journal, null, 2) + "\n");
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);

  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /Recovery retained output already occupied: native/,
  );
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
  assert.deepEqual(await inventory(failed), nativeBefore);
});

test("stale writer recovery preserves an already occupied tombstone", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const lock = path.join(dir, ".architecture-publication-writer");
  const owner = JSON.parse(await fs.readFile(path.join(lock, "owner.json"), "utf8"));
  const retained = path.join(lock + "-history", owner.token);
  await fs.mkdir(retained, { recursive: true });
  const atlasBefore = await inventory(options.destinations.atlas);

  await assert.rejects(recoverPairFiles(plan, acceptance), /Retained writer lock already exists/);
  assert.equal((await fs.stat(lock)).isDirectory(), true);
  assert.equal((await fs.stat(retained)).isDirectory(), true);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
});

test("stale writer recovery rechecks a PID that becomes active before reclamation", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const lock = path.join(dir, ".architecture-publication-writer");
  const owner = JSON.parse(await fs.readFile(path.join(lock, "owner.json"), "utf8"));
  const originalKill = process.kill;
  let checks = 0;
  process.kill = (pid, signal) => {
    if (pid !== owner.pid || signal !== 0) return originalKill(pid, signal);
    checks++;
    if (checks === 1) throw Object.assign(new Error("not running yet"), { code: "ESRCH" });
    return true;
  };
  try {
    await assert.rejects(
      recoverPairFiles(plan, acceptance),
      /An active installer holds the writer lock/,
    );
  } finally {
    process.kill = originalKill;
  }
  assert.equal(checks, 2);
  assert.equal((await fs.stat(lock)).isDirectory(), true);
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
});

test("a competing writer lock appearing during preparation is never replaced", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const lock = path.join(dir, ".architecture-publication-writer");
  const originalWriteFile = fs.writeFile;
  let raced = false;
  fs.writeFile = async (file, ...args) => {
    const result = await originalWriteFile(file, ...args);
    if (
      !raced &&
      typeof file === "string" &&
      file.startsWith(lock + "-pending-") &&
      path.basename(file) === "owner.json"
    ) {
      raced = true;
      await fs.mkdir(lock);
      await originalWriteFile(path.join(lock, "owner.json"), "competing writer bytes");
    }
    return result;
  };
  try {
    await assert.rejects(
      installPairFiles(plan, acceptance),
      /Another installer acquired the writer lock/,
    );
  } finally {
    fs.writeFile = originalWriteFile;
  }
  assert.equal(raced, true);
  assert.equal(await fs.readFile(path.join(lock, "owner.json"), "utf8"), "competing writer bytes");
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("writer release cannot overwrite an occupied retained identity", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const lock = path.join(dir, ".architecture-publication-writer");
  let retained;
  await assert.rejects(
    installPairFiles(plan, acceptance, {
      writeJournal: async (file, bytes) => {
        await fs.writeFile(file, bytes);
        if (JSON.parse(bytes).status === "INSTALLED" && !retained) {
          const owner = JSON.parse(await fs.readFile(path.join(lock, "owner.json"), "utf8"));
          retained = path.join(lock + "-history", owner.token);
          await fs.mkdir(retained, { recursive: true });
        }
      },
    }),
    /Writer release identity already retained/,
  );
  assert(retained);
  assert.equal((await fs.stat(lock)).isDirectory(), true);
  assert.equal((await fs.stat(retained)).isDirectory(), true);
  assert.equal(
    await fs.readFile(path.join(options.destinations.native, "owner-note.txt"), "utf8"),
    "keep this exact byte",
  );
});

test("recovery refuses an unknown persisted journal state without moving destinations", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, "save-native", "after");
  const operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20)),
    journalFile = path.join(operation, "operation.json"),
    journal = JSON.parse(await fs.readFile(journalFile, "utf8"));
  journal.status = "UNRECOGNIZED";
  await fs.writeFile(journalFile, JSON.stringify(journal));

  await assert.rejects(recoverPairFiles(plan, acceptance), /Unknown recovery state/);
  await assert.rejects(fs.stat(options.destinations.native), { code: "ENOENT" });
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );
});

for (const boundary of [
  "before-save-native",
  "after-save-native",
  "before-install-native",
  "after-install-native",
  "before-save-atlas",
  "after-save-atlas",
  "before-install-atlas",
  "after-install-atlas",
])
  test(`process termination at ${boundary} is recoverable without changing prior content`, async (t) => {
    assert.equal(typeof recoverPairFiles, "function");
    const { dir, options } = await fixture(t),
      plan = await planFiles(options),
      acceptance = approve(plan);
    const planFile = path.join(dir, "plan.json"),
      acceptanceFile = path.join(dir, "acceptance.json");
    await fs.writeFile(planFile, JSON.stringify(plan));
    await fs.writeFile(acceptanceFile, JSON.stringify(acceptance));
    const child = path.join(dir, "interrupt.mjs");
    await fs.writeFile(
      child,
      `${selfInterruptionSource}
import fs from 'node:fs/promises';import {installPairFiles} from ${JSON.stringify(new URL("../packages/publisher/src/publication/files.mjs", import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3])),boundary=process.argv[4];
await installPairFiles(plan,acceptance,{rename:async(a,b)=>{let event='';for(const m of ['native','atlas']){if(a===plan.options.destinations[m])event='save-'+m;else if(b===plan.options.destinations[m])event='install-'+m;}if(boundary==='before-'+event)interruptSelf();await fs.rename(a,b);if(boundary==='after-'+event)interruptSelf();}});`,
    );
    const run = spawnSync(process.execPath, [child, planFile, acceptanceFile, boundary], {
      cwd: dir,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 8e6,
    });
    assertSelfInterrupted(run);
    if (boundary === "after-install-native") {
      await fs.writeFile(
        path.join(options.destinations.native, "user-arrived.txt"),
        "new user content",
      );
      await assert.rejects(recoverPairFiles(plan, acceptance), /unknown changes/);
      assert.equal(
        await fs.readFile(path.join(options.destinations.native, "user-arrived.txt"), "utf8"),
        "new user content",
      );
      assert.equal(
        await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
        "old entry",
      );
      await fs.unlink(path.join(options.destinations.native, "user-arrived.txt"));
      const op = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
      let interrupted = false;
      const rename = async (a, b) => {
        await fs.rename(a, b);
        if (!interrupted && b === path.join(op, "failed-native")) {
          interrupted = true;
          throw Error("interrupted recovery");
        }
      };
      await assert.rejects(recoverPairFiles(plan, acceptance, { rename }), /interrupted recovery/);
      assert.equal(interrupted, true);
    }
    if (boundary === "after-install-atlas") {
      const recoveryChild = path.join(dir, "interrupt-recovery.mjs");
      await fs.writeFile(
        recoveryChild,
        `${selfInterruptionSource}
import fs from 'node:fs/promises';import {recoverPairFiles} from ${JSON.stringify(new URL("../packages/publisher/src/publication/files.mjs", import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3]));
await recoverPairFiles(plan,acceptance,{rename:async(a,b)=>{await fs.rename(a,b);if(a===plan.options.destinations.atlas)interruptSelf();}});`,
      );
      const killed = spawnSync(process.execPath, [recoveryChild, planFile, acceptanceFile], {
        cwd: dir,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assertSelfInterrupted(killed);
    }
    const recovered = await recoverPairFiles(plan, acceptance);
    assert.equal(recovered.status, "ROLLED_BACK");
    for (const target of Object.values(options.destinations)) {
      assert.equal(await fs.readFile(path.join(target, "index.html"), "utf8"), "old entry");
      assert.equal(
        await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
        "keep this exact byte",
      );
      assert.deepEqual((await fs.readdir(target)).sort(), [
        ".DS_Store",
        "empty",
        "index.html",
        "owner-note.txt",
      ]);
    }
    assert.equal((await recoverPairFiles(plan, acceptance)).status, "ALREADY_ROLLED_BACK");
  });
