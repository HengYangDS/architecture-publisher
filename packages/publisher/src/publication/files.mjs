import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { parseStrictJson } from "../protocol/json.mjs";
import {
  sha,
  encode,
  exists,
  equal,
  sameSet,
  relative,
  noLinks,
  inventory,
  syncDirectory,
  atomicJournal,
} from "./file-storage.mjs";
import {
  metadata,
  selectedMedia,
  canonicalOptions,
  verifyPlanAcceptance,
} from "./file-contract.mjs";
import { planInput, planPairFiles } from "./file-plan.mjs";
import {
  previousPayload,
  expectedManifest,
  checkFiles,
  verifyInstalled,
} from "./file-manifest.mjs";
import { rollbackPair, recoverLockedPair } from "./file-recovery.mjs";

async function withPairWriter(plan, acceptance, recover, action) {
  const digest = verifyPlanAcceptance(plan, acceptance),
    o = plan.options;
  const parent = path.dirname(o.destinations[selectedMedia(o)[0]]);
  let parentStat;
  try {
    parentStat = await fs.lstat(parent);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
  }
  if (!parentStat?.isDirectory() || parentStat.isSymbolicLink())
    throw Error("Destination parent must exist");
  equal(encode(await canonicalOptions(o)), encode(o), "Canonical writer path changed");
  const lock = path.join(parent, ".architecture-publication-writer"),
    history = lock + "-history";
  const token = randomUUID(),
    owner = {
      token,
      pid: process.pid,
      host: os.hostname(),
      planSha256: digest,
    };
  const ownerFile = path.join(lock, "owner.json");
  let owned = false,
    prepared,
    result,
    failure;
  function alive(pid) {
    if (!Number.isSafeInteger(pid) || pid < 1) throw Error("Invalid writer lock process");
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      if (e.code === "ESRCH") return false;
      return true;
    }
  }
  try {
    if (await exists(lock + "-recovery"))
      throw Error("Legacy writer lock recovery requires inspection");
    if (await exists(lock)) {
      await noLinks(ownerFile);
      const bytes = await fs.readFile(ownerFile),
        previous = parseStrictJson(
          bytes,
          "publication_writer_lock_json_invalid",
          "publication_writer_lock_json_duplicate_key",
        );
      if (typeof previous.token !== "string" || !/^[a-f0-9-]{36}$/.test(previous.token))
        throw Error("Invalid writer lock identity");
      sameSet(await fs.readdir(lock), ["owner.json"], "Ambiguous writer lock content");
      if (previous.host !== os.hostname() || alive(previous.pid))
        throw Error("An active installer holds the writer lock");
      if (!recover || previous.planSha256 !== digest)
        throw Error("Writer lock requires recovery of its exact prior plan");
      await noLinks(history);
      await fs.mkdir(history, { recursive: true });
      const retained = path.join(history, previous.token);
      if (await exists(retained)) throw Error("Retained writer lock already exists");
      equal(
        Buffer.compare(await fs.readFile(ownerFile), bytes),
        0,
        "Writer lock changed before recovery",
      );
      if (alive(previous.pid)) throw Error("An active installer holds the writer lock");
      // Keep the nonempty token tombstone: a delayed reclaimer cannot rename a
      // newer owner over it, even if it observed the old owner before this move.
      await fs.rename(lock, retained);
      await syncDirectory(parent);
      await syncDirectory(history);
    }
    prepared = await fs.mkdtemp(lock + "-pending-");
    const pendingOwner = path.join(prepared, "owner.json");
    await fs.writeFile(pendingOwner, encode(owner), {
      flag: "wx",
      mode: 0o600,
      flush: true,
    });
    await syncDirectory(prepared);
    if (await exists(lock)) throw Error("Another installer acquired the writer lock");
    // Cooperating writers only expose complete nonempty directories. A competing
    // rename cannot replace one; unknown legacy locks are refused above.
    await fs.rename(prepared, lock);
    owned = true;
    prepared = null;
    await syncDirectory(parent);
    equal(await fs.readFile(ownerFile, "utf8"), encode(owner), "Writer lock ownership changed");
    result = await action();
  } catch (error) {
    failure = error;
  }
  let releaseFailure;
  try {
    if (owned) {
      equal(
        await fs.readFile(ownerFile, "utf8"),
        encode(owner),
        "Writer lock ownership changed at release",
      );
      await noLinks(history);
      await fs.mkdir(history, { recursive: true });
      const retained = path.join(history, token);
      if (await exists(retained)) throw Error("Writer release identity already retained");
      await fs.rename(lock, retained);
      await syncDirectory(parent);
      await syncDirectory(history);
    } else if (prepared) {
      // This process alone owns its unpublished directory. Never clean up another
      // process's abandoned preparation or an unknown active lock.
      if (await exists(path.join(prepared, "owner.json")))
        await fs.unlink(path.join(prepared, "owner.json"));
      await fs.rmdir(prepared);
    }
  } catch (error) {
    releaseFailure = error;
  }
  if (failure && releaseFailure)
    throw new AggregateError(
      [failure, releaseFailure],
      `${failure.message}; writer release failed`,
      { cause: failure },
    );
  if (failure) throw failure;
  if (releaseFailure) throw releaseFailure;
  return {
    ...result,
    durability: {
      fileFlush: "required-for-created-files",
      directoryFlush: process.platform === "win32" ? "unsupported" : "required",
      powerLossRecovery: "not-qualified",
    },
  };
}

export async function recoverPairFiles(plan, acceptance, adapters = {}) {
  return withPairWriter(plan, acceptance, true, () =>
    recoverLockedPair(plan, acceptance, adapters),
  );
}

export async function installPairFiles(plan, acceptance, adapters = {}) {
  return withPairWriter(plan, acceptance, false, () =>
    publishLockedPair(plan, acceptance, adapters),
  );
}

async function publishLockedPair(
  plan,
  acceptance,
  { rename = fs.rename, writeJournal = atomicJournal } = {},
) {
  const digest = verifyPlanAcceptance(plan, acceptance);
  equal(
    JSON.stringify(await canonicalOptions(plan.options)),
    JSON.stringify(plan.options),
    "Canonical path changed",
  );
  const o = plan.options;
  for (const d of plan.dependencies) {
    await noLinks(d.file);
    equal(sha(await fs.readFile(d.file)), d.sha256, "Source/evidence changed: " + d.file);
  }
  const already = await Promise.all(
    selectedMedia(o).map(async (m) => {
      const p = path.join(o.destinations[m], "delivery-manifest.json");
      await noLinks(p);
      if (!(await exists(p))) return false;
      try {
        const value = JSON.parse(await fs.readFile(p));
        return (
          value?.schema === "architecture.pair-files-receipt/v1" && value.planSha256 === digest
        );
      } catch (error) {
        if (error instanceof SyntaxError) return false;
        throw error;
      }
    }),
  );
  if (already.some(Boolean)) {
    if (!already.every(Boolean)) throw Error("Partial prior install requires recovery, not replay");
    equal(
      (await planPairFiles(planInput(plan), plan.prestates)).sha256,
      digest,
      "Canonical replay plan changed",
    );
    const operationFile = path.join(o.recoveryRoot, digest.slice(0, 20), "operation.json");
    await noLinks(operationFile);
    const operation = parseStrictJson(
      await fs.readFile(operationFile),
      "publication_journal_json_invalid",
      "publication_journal_json_duplicate_key",
    );
    if (
      operation.planSha256 !== digest ||
      operation.status !== "INSTALLED" ||
      JSON.stringify(operation.destinations) !== JSON.stringify(o.destinations)
    )
      throw Error("Recorded operation does not confirm delivery");
    for (const m of selectedMedia(o)) await verifyInstalled(plan, m, acceptance);
    return { status: "ALREADY_INSTALLED", planSha256: digest };
  }
  for (const m of selectedMedia(o))
    equal(
      JSON.stringify(await inventory(o.destinations[m])),
      JSON.stringify(plan.prestates[m]),
      "Destination prestate changed",
    );
  // A caller-supplied hash cannot authorize a different payload. Re-derive the
  // controlled plan from the same exact source/evidence and current prestates.
  const currentPlan = await planPairFiles(planInput(plan));
  equal(currentPlan.sha256, digest, "Canonical plan changed; re-plan and review");
  const parent = path.dirname(o.destinations[selectedMedia(o)[0]]);
  await noLinks(parent);
  await noLinks(o.recoveryRoot);
  if (!(await exists(parent))) throw Error("Destination parent must exist");
  const op = path.join(o.recoveryRoot, digest.slice(0, 20));
  await fs.mkdir(o.recoveryRoot, { recursive: true });
  equal(
    (await fs.stat(parent)).dev,
    (await fs.stat(o.recoveryRoot)).dev,
    "Recovery and destination must share a filesystem",
  );
  if (await exists(op))
    throw Error("Recorded operation already exists; inspect or recover its exact state");
  const preparation = await fs.mkdtemp(
    path.join(o.recoveryRoot, ".prepare-" + digest.slice(0, 20) + "-"),
  );
  const stage = await fs.mkdtemp(path.join(parent, ".architecture-publication-stage-")),
    recovery = Object.fromEntries(selectedMedia(o).map((m) => [m, path.join(op, "prior-" + m)])),
    installed = [],
    saved = [];
  const journal = {
    planSha256: digest,
    status: "PREPARING",
    stage,
    destinations: o.destinations,
    recovery,
    installed,
    saved,
    intent: null,
  };
  const record = () => writeJournal(path.join(op, "operation.json"), encode(journal));
  try {
    await atomicJournal(path.join(preparation, "plan.json"), encode(plan));
    await atomicJournal(path.join(preparation, "acceptance.json"), encode(acceptance));
    await writeJournal(path.join(preparation, "operation.json"), encode(journal));
    equal(
      await fs.readFile(path.join(preparation, "operation.json"), "utf8"),
      encode(journal),
      "Initial journal was not persisted",
    );
    await syncDirectory(preparation);
    if (await exists(op)) throw Error("Operation appeared during preparation");
    // The visible operation always contains its complete recovery inputs. Partial
    // preparations have no destination effects and stay separate for inspection.
    await fs.rename(preparation, op);
    await syncDirectory(o.recoveryRoot);
  } catch (error) {
    throw Error(
      error.message +
        "; operation initialization incomplete; preparation: " +
        preparation +
        "; stage: " +
        stage,
      { cause: error },
    );
  }
  try {
    for (const medium of selectedMedia(o)) {
      const target = o.destinations[medium],
        out = path.join(stage, medium),
        before = plan.prestates[medium];
      if (before.exists)
        await fs.cp(target, out, {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      else await fs.mkdir(out);
      await fs.chmod(out, 0o755);
      equal(
        JSON.stringify(await inventory(out)),
        JSON.stringify({ ...before, exists: true }),
        "Staged prestate changed",
      );
      const previousEntries = {},
        history = "history/" + sha(encode(before)).slice(0, 20);
      if (before.entries.some((e) => e.path === history || e.path.startsWith(history + "/")))
        throw Error("History path collision");
      for (const name of metadata)
        if (await exists(path.join(out, name))) {
          const preserved = path.join(history, name);
          await fs.mkdir(path.dirname(path.join(out, preserved)), {
            recursive: true,
          });
          await fs.rename(path.join(out, name), path.join(out, preserved));
          previousEntries[name] = preserved;
        }
      // Retire only exact prior managed payload in the private staged copy.
      // The original complete directory remains the existing recovery preimage.
      for (const prior of previousPayload(plan, medium)) {
        const file = relative(out, prior.path);
        equal(
          sha(await fs.readFile(file)),
          prior.sha256,
          "Prior managed payload changed while staging",
        );
        await fs.unlink(file);
      }
      for (const f of plan.payload.filter((f) => f.medium === medium)) {
        const bytes = await fs.readFile(f.source);
        equal(sha(bytes), f.sha256, "Payload changed");
        await fs.mkdir(path.dirname(path.join(out, f.path)), {
          recursive: true,
        });
        await fs.writeFile(path.join(out, f.path), bytes, { flag: "wx", flush: true });
      }
      for (const [name, bytes] of Object.entries(plan.entries[medium]))
        await fs.writeFile(path.join(out, name), bytes, { flag: "wx", flush: true });
      const manifest = expectedManifest(plan, medium, acceptance),
        files = manifest.files;
      const snapshot = await inventory(out);
      sameSet(
        snapshot.entries.filter((e) => e.kind === "file").map((e) => e.path),
        files.map((f) => f.path),
        "Staged file set mismatch",
      );
      await fs.writeFile(path.join(out, "delivery-manifest.json"), encode(manifest), {
        flag: "wx",
        flush: true,
      });
      const sums =
        files
          .concat({
            path: "delivery-manifest.json",
            sha256: sha(encode(manifest)),
          })
          .map((f) => `${f.sha256}  ${f.path}`)
          .join("\n") + "\n";
      await fs.writeFile(path.join(out, "SHA256SUMS"), sums, { flag: "wx", flush: true });
      await checkFiles(out, files);
      recovery[medium] = path.join(op, "prior-" + medium);
    }
    for (const d of plan.dependencies)
      equal(sha(await fs.readFile(d.file)), d.sha256, "Source changed before install");
    for (const m of selectedMedia(o))
      equal(
        JSON.stringify(await inventory(o.destinations[m])),
        JSON.stringify(plan.prestates[m]),
        "Destination changed before install",
      );
    journal.status = "INSTALLING";
    await record();
    for (const medium of selectedMedia(o)) {
      equal(
        JSON.stringify(await inventory(o.destinations[medium])),
        JSON.stringify(plan.prestates[medium]),
        "Destination changed at local install boundary",
      );
      if (plan.prestates[medium].exists) {
        journal.intent = {
          action: "save-prior",
          medium,
          source: o.destinations[medium],
          target: recovery[medium],
        };
        await record();
        await rename(o.destinations[medium], recovery[medium]);
        await syncDirectory(parent);
        await syncDirectory(op);
        saved.push(medium);
        await record();
      }
      journal.intent = {
        action: "install-new",
        medium,
        source: path.join(stage, medium),
        target: o.destinations[medium],
      };
      await record();
      if (await exists(o.destinations[medium]))
        throw Error("Destination arrived concurrently at install boundary");
      await rename(path.join(stage, medium), o.destinations[medium]);
      await syncDirectory(parent);
      await syncDirectory(stage);
      installed.push(medium);
      await verifyInstalled(plan, medium, acceptance);
      journal.intent = null;
      await record();
    }
    journal.status = "INSTALLED";
    await record();
    await fs.rmdir(stage);
    return {
      status: "INSTALLED",
      scope: "file-installation-only",
      planSha256: digest,
      destinations: o.destinations,
      recovery,
      globalAtomicity: false,
    };
  } catch (error) {
    const failures = [];
    try {
      await rollbackPair(plan, acceptance, journal, op, {
        rename,
        writeJournal,
      });
    } catch (e) {
      failures.push({ error: e.message });
    }
    journal.status = failures.length ? "RECOVERY_REQUIRED" : "ROLLED_BACK";
    journal.error = error.message;
    journal.rollbackFailures = failures;
    let journalError;
    try {
      await record();
    } catch (e) {
      journalError = e.message;
    }
    // Preserve partial staged/new bytes for diagnosis. Never delete prior content.
    throw Error(
      error.message +
        "; " +
        journal.status +
        "; recovery: " +
        op +
        "; stage: " +
        stage +
        (failures.length
          ? "; rollback failures: " + JSON.stringify(failures)
          : "; both prestates restored") +
        (journalError ? "; journal: " + journalError : ""),
      { cause: error },
    );
  }
}
