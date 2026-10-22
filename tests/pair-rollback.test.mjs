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
import { fixture, planFiles, approve } from "./fixtures/pair-files.mjs";

test("incomplete rollback still reports recovery paths when writing the journal also fails", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  const rename = async (a, b) => {
    if (a.includes("stage") && b === options.destinations.atlas)
      throw Error("second install failed");
    if (a.endsWith("prior-atlas")) throw Error("restore failed");
    return fs.rename(a, b);
  };
  const writeJournal = async (file, bytes) => {
    if (JSON.parse(bytes).status === "RECOVERY_REQUIRED") throw Error("journal ENOSPC");
    return fs.writeFile(file, bytes);
  };
  await assert.rejects(installPairFiles(p, approve(p), { rename, writeJournal }), (e) => {
    assert.match(e.message, /RECOVERY_REQUIRED/);
    assert.match(e.message, /second install failed/);
    assert.match(e.message, /restore failed/);
    assert.match(e.message, /journal ENOSPC/);
    assert.ok(e.message.includes(options.recoveryRoot));
    return true;
  });
  assert.equal(
    await fs.readFile(
      path.join(options.recoveryRoot, p.sha256.slice(0, 20), "prior-atlas", "index.html"),
      "utf8",
    ),
    "old entry",
  );
});

test("a missing initial journal can be recovered only while both exact prestates remain", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const op = path.join(options.recoveryRoot, plan.sha256.slice(0, 20)),
    journalFile = path.join(op, "operation.json");
  // Persisted shape emitted by the preceding installer; not publication evidence.
  await fs.mkdir(op, { recursive: true });
  await fs.writeFile(path.join(op, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
  await fs.writeFile(path.join(op, "acceptance.json"), JSON.stringify(acceptance, null, 2) + "\n");
  await assert.rejects(fs.stat(journalFile), { code: "ENOENT" });
  const late = path.join(options.destinations.atlas, "late.txt");
  await fs.writeFile(late, "preserve this arrival");
  await assert.rejects(recoverPairFiles(plan, acceptance), /prestate|destination.*changed/i);
  assert.equal(await fs.readFile(late, "utf8"), "preserve this arrival");
  await assert.rejects(fs.stat(journalFile), { code: "ENOENT" });
  await fs.unlink(late);
  const retained = path.join(op, "prior-native");
  await fs.mkdir(retained);
  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /journal.*missing|missing.*journal|ambiguous/i,
  );
  await fs.rmdir(retained);
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

test("initial journal failure never exposes an incomplete operation", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await assert.rejects(
    installPairFiles(plan, acceptance, {
      writeJournal: async () => {
        throw Error("initial journal unavailable");
      },
    }),
    /initial journal unavailable/,
  );
  await assert.rejects(fs.stat(path.join(options.recoveryRoot, plan.sha256.slice(0, 20))), {
    code: "ENOENT",
  });
  assert.equal((await recoverPairFiles(plan, acceptance)).status, "NOT_STARTED");
  assert.equal((await installPairFiles(plan, acceptance)).status, "INSTALLED");
});

test("a concurrent operation identity appearing during preparation is not overwritten", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan),
    operation = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);
  await assert.rejects(
    installPairFiles(plan, acceptance, {
      writeJournal: async (file, bytes) => {
        await fs.writeFile(file, bytes);
        if (path.basename(file) === "operation.json" && file.includes(`${path.sep}.prepare-`))
          await fs.mkdir(operation);
      },
    }),
    /Operation appeared during preparation/,
  );
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
  assert.deepEqual(await fs.readdir(operation), []);
});

test("a destination arriving at the install boundary is retained, not overwritten", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const foreign = path.join(options.destinations.native, "foreign.txt");
  let arrived = false;
  await assert.rejects(
    installPairFiles(plan, acceptance, {
      writeJournal: async (file, bytes) => {
        await fs.writeFile(file, bytes);
        const journal = JSON.parse(bytes);
        if (
          !arrived &&
          journal.intent?.action === "install-new" &&
          journal.intent.medium === "native"
        ) {
          await fs.mkdir(options.destinations.native);
          await fs.writeFile(foreign, "foreign arrival");
          arrived = true;
        }
      },
    }),
    (error) => {
      assert.match(error.message, /Destination arrived concurrently at install boundary/);
      assert.match(error.message, /RECOVERY_REQUIRED/);
      return true;
    },
  );
  assert.equal(arrived, true);
  assert.equal(await fs.readFile(foreign, "utf8"), "foreign arrival");
  assert.equal(
    await fs.readFile(
      path.join(options.recoveryRoot, plan.sha256.slice(0, 20), "prior-native", "index.html"),
      "utf8",
    ),
    "old entry",
  );
});

test("rollback refuses a destination arriving after retaining new output", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const foreign = path.join(options.destinations.native, "foreign.txt");
  let arrived = false;
  const rename = async (from, to) => {
    if (from.includes("stage") && to === options.destinations.atlas)
      throw Error("injected second installation failure");
    const result = await fs.rename(from, to);
    if (!arrived && from === options.destinations.native && to.endsWith("failed-native")) {
      await fs.mkdir(options.destinations.native);
      await fs.writeFile(foreign, "foreign recovery arrival");
      arrived = true;
    }
    return result;
  };
  await assert.rejects(installPairFiles(plan, acceptance, { rename }), (error) => {
    assert.match(error.message, /RECOVERY_REQUIRED/);
    assert.match(error.message, /Recovery destination arrived concurrently/);
    return true;
  });
  assert.equal(arrived, true);
  assert.equal(await fs.readFile(foreign, "utf8"), "foreign recovery arrival");
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, "index.html"), "utf8"),
    "old entry",
  );
});

for (const phase of ["plan.json", "acceptance.json", "operation.json", "activation"])
  for (const side of ["before", "after"])
    test(`initialization termination ${side} ${phase} preserves exact recovery inputs`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      const input = path.join(dir, "initialization.json"),
        child = path.join(dir, "initialization.mjs");
      await fs.writeFile(input, JSON.stringify({ plan, acceptance, phase, side }));
      await fs.writeFile(
        child,
        `${selfInterruptionSource}
import fs from 'node:fs/promises';import path from 'node:path';import {installPairFiles} from ${JSON.stringify(new URL("../packages/publisher/src/publication/files.mjs", import.meta.url).href)};
const {plan,acceptance,phase,side}=JSON.parse(await fs.readFile(process.argv[2])),op=path.join(plan.options.recoveryRoot,plan.sha256.slice(0,20)),native={mkdir:fs.mkdir,rename:fs.rename};
async function invoke(method,args,event){if(event===phase&&side==='before')interruptSelf();const value=await native[method](...args);if(event===phase&&side==='after')interruptSelf();return value;}
fs.mkdir=(file,...args)=>invoke('mkdir',[file,...args],file===op?'activation':'');
fs.rename=(from,to)=>invoke('rename',[from,to],to===op?'activation':to.startsWith(plan.options.recoveryRoot+path.sep)?path.basename(to):'');
await installPairFiles(plan,acceptance);`,
      );
      const run = spawnSync(process.execPath, [child, input], {
        cwd: dir,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assertSelfInterrupted(run);
      const activated = phase === "activation" && side === "after";
      assert.equal(
        (await recoverPairFiles(plan, acceptance)).status,
        activated ? "ROLLED_BACK" : "NOT_STARTED",
      );
      for (const target of Object.values(options.destinations))
        assert.deepEqual((await fs.readdir(target)).sort(), [
          ".DS_Store",
          "empty",
          "index.html",
          "owner-note.txt",
        ]);
      if (!activated) assert.equal((await installPairFiles(plan, acceptance)).status, "INSTALLED");
    });

for (const status of ["PREPARING", "INSTALLING", "INSTALLED"])
  for (const side of ["before", "after"])
    test(`process termination ${side} ${status} journal replacement preserves recoverability`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      const planFile = path.join(dir, "plan.json"),
        acceptanceFile = path.join(dir, "acceptance.json"),
        child = path.join(dir, "journal-interrupt.mjs");
      await fs.writeFile(planFile, JSON.stringify(plan));
      await fs.writeFile(acceptanceFile, JSON.stringify(acceptance));
      await fs.writeFile(
        child,
        `${selfInterruptionSource}
import fs from 'node:fs/promises';import path from 'node:path';import {installPairFiles} from ${JSON.stringify(new URL("../packages/publisher/src/publication/files.mjs", import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3]));
const rename=fs.rename;fs.rename=async(a,b)=>{const hit=path.basename(b)==='operation.json'&&JSON.parse(await fs.readFile(a)).status===process.argv[4];if(hit&&process.argv[5]==='before')interruptSelf();await rename(a,b);if(hit&&process.argv[5]==='after')interruptSelf();};
await installPairFiles(plan,acceptance);`,
      );
      const run = spawnSync(process.execPath, [child, planFile, acceptanceFile, status, side], {
        cwd: dir,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assertSelfInterrupted(run);
      const result = await recoverPairFiles(plan, acceptance),
        installed = status === "INSTALLED" && side === "after",
        unstarted = status === "PREPARING";
      assert.equal(
        result.status,
        unstarted ? "NOT_STARTED" : installed ? "ALREADY_INSTALLED" : "ROLLED_BACK",
      );
      assert.equal(
        (await recoverPairFiles(plan, acceptance)).status,
        unstarted ? "NOT_STARTED" : installed ? "ALREADY_INSTALLED" : "ALREADY_ROLLED_BACK",
      );
      for (const target of Object.values(options.destinations))
        assert.equal(
          await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
          "keep this exact byte",
        );
      if (!installed)
        for (const target of Object.values(options.destinations))
          assert.deepEqual((await fs.readdir(target)).sort(), [
            ".DS_Store",
            "empty",
            "index.html",
            "owner-note.txt",
          ]);
    });

test("initially absent destinations install without inventing prior recovery copies", async (t) => {
  const { options } = await fixture(t);
  for (const target of Object.values(options.destinations))
    await fs.rm(target, { recursive: true });
  const p = await planFiles(options);
  assert.ok(Object.values(p.prestates).every((p) => !p.exists));
  const r = await installPairFiles(p, approve(p));
  assert.equal(r.status, "INSTALLED");
  for (const target of Object.values(options.destinations))
    assert.ok((await fs.stat(path.join(target, "index.html"))).isFile());
  for (const prior of Object.values(r.recovery))
    await assert.rejects(fs.stat(prior), { code: "ENOENT" });
});

test("an exception after a successful rename restores actual disk state rather than trusting journal arrays", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options);
  let interrupted = false;
  const rename = async (a, b) => {
    await fs.rename(a, b);
    if (!interrupted && a === options.destinations.native) {
      interrupted = true;
      throw Error("after rename before record");
    }
  };
  await assert.rejects(
    installPairFiles(plan, approve(plan), { rename }),
    /after rename before record/,
  );
  assert.equal(interrupted, true);
  for (const target of Object.values(options.destinations))
    assert.equal(await fs.readFile(path.join(target, "index.html"), "utf8"), "old entry");
  const journal = JSON.parse(
    await fs.readFile(path.join(options.recoveryRoot, plan.sha256.slice(0, 20), "operation.json")),
  );
  assert.equal(journal.status, "ROLLED_BACK");
});
