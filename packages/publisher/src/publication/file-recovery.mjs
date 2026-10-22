import fs from "node:fs/promises";
import path from "node:path";
import { parseStrictJson } from "../protocol/json.mjs";
import {
  encode,
  exists,
  equal,
  noLinks,
  inventory,
  syncDirectory,
  atomicJournal,
} from "./file-storage.mjs";
import { selectedMedia, canonicalOptions, verifyPlanAcceptance } from "./file-contract.mjs";
import { verifyInstalled, sameInventory, installedInventory } from "./file-manifest.mjs";

export async function rollbackPair(plan, acceptance, journal, op, { rename, writeJournal }) {
  const states = [];
  // Inspect every target before the first recovery effect. Never move an unknown
  // or modified directory merely because an old journal says we installed it.
  for (const medium of [...selectedMedia(plan.options)].reverse()) {
    const target = plan.options.destinations[medium],
      prior = path.join(op, "prior-" + medium),
      failed = path.join(op, "failed-" + medium);
    const current = await inventory(target),
      saved = await inventory(prior),
      abandoned = await inventory(failed),
      before = plan.prestates[medium],
      expected = installedInventory(plan, medium, acceptance);
    if (saved.exists && (!before.exists || !sameInventory(saved, before)))
      throw Error("Recovery prior content changed: " + medium);
    if (abandoned.exists && !sameInventory(abandoned, expected))
      throw Error("Recovery retained output changed: " + medium);
    if (sameInventory(current, before)) {
      if (saved.exists) throw Error("Recovery has ambiguous duplicate prior: " + medium);
      states.push({
        medium,
        target,
        prior,
        failed,
        current,
        before,
        expected,
        action: "none",
      });
      continue;
    }
    if (current.exists && !sameInventory(current, expected))
      throw Error("Recovery destination contains unknown changes: " + medium);
    if (before.exists && !saved.exists) throw Error("Recovery prior content missing: " + medium);
    if (current.exists && abandoned.exists)
      throw Error("Recovery retained output already occupied: " + medium);
    states.push({
      medium,
      target,
      prior,
      failed,
      current,
      before,
      expected,
      action: "restore",
    });
  }
  const record = () => writeJournal(path.join(op, "operation.json"), encode(journal));
  for (const s of states) {
    if (s.action === "none") continue;
    if (s.current.exists) {
      equal(
        sameInventory(await inventory(s.target), s.expected),
        true,
        "Recovery target changed at effect boundary",
      );
      if (await exists(s.failed)) throw Error("Recovery retained output arrived concurrently");
      journal.intent = {
        action: "retain-new",
        medium: s.medium,
        source: s.target,
        target: s.failed,
      };
      await record();
      await rename(s.target, s.failed);
      await syncDirectory(path.dirname(s.target));
      await syncDirectory(op);
    }
    if (s.before.exists) {
      equal(
        sameInventory(await inventory(s.prior), s.before),
        true,
        "Recovery prior changed at effect boundary",
      );
      if (await exists(s.target)) throw Error("Recovery destination arrived concurrently");
      journal.intent = {
        action: "restore-prior",
        medium: s.medium,
        source: s.prior,
        target: s.target,
      };
      await record();
      await rename(s.prior, s.target);
      await syncDirectory(path.dirname(s.target));
      await syncDirectory(op);
    }
    equal(sameInventory(await inventory(s.target), s.before), true, "Rollback prestate mismatch");
  }
  for (const m of selectedMedia(plan.options))
    equal(
      sameInventory(await inventory(plan.options.destinations[m]), plan.prestates[m]),
      true,
      "Rollback final prestate mismatch",
    );
  journal.status = "ROLLED_BACK";
  journal.intent = null;
  await record();
  return {
    status: "ROLLED_BACK",
    planSha256: plan.sha256,
    recovery: op,
    globalAtomicity: false,
  };
}

export async function recoverLockedPair(
  plan,
  acceptance,
  { rename = fs.rename, writeJournal = atomicJournal } = {},
) {
  const digest = verifyPlanAcceptance(plan, acceptance),
    o = plan.options;
  equal(encode(await canonicalOptions(o)), encode(o), "Canonical recovery path changed");
  const op = path.join(o.recoveryRoot, digest.slice(0, 20));
  await noLinks(op);
  if (!(await exists(op))) {
    for (const medium of selectedMedia(o))
      equal(
        sameInventory(await inventory(o.destinations[medium]), plan.prestates[medium]),
        true,
        "Unstarted destination prestate changed",
      );
    return {
      status: "NOT_STARTED",
      scope: "file-installation-only",
      planSha256: digest,
    };
  }
  equal(
    await fs.readFile(path.join(op, "plan.json"), "utf8"),
    encode(plan),
    "Recorded recovery plan differs",
  );
  equal(
    await fs.readFile(path.join(op, "acceptance.json"), "utf8"),
    encode(acceptance),
    "Recorded recovery acceptance differs",
  );
  const journalFile = path.join(op, "operation.json");
  await noLinks(journalFile);
  const recorded = await fs.readFile(journalFile).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (recorded === null) {
    // Before the first durable journal, no destination switch is permitted.
    // Certify only the unchanged prestate; retain incomplete staging for inspection.
    for (const medium of selectedMedia(o)) {
      equal(
        sameInventory(await inventory(o.destinations[medium]), plan.prestates[medium]),
        true,
        "Unjournaled destination prestate changed",
      );
      for (const prefix of ["prior-", "failed-"])
        if (await exists(path.join(op, prefix + medium)))
          throw Error("Missing journal has ambiguous retained content");
    }
    await writeJournal(
      journalFile,
      encode({
        planSha256: digest,
        status: "ROLLED_BACK",
        destinations: o.destinations,
        intent: null,
        reason: "unchanged-prestates-before-initial-journal",
      }),
    );
    return {
      status: "ROLLED_BACK",
      planSha256: digest,
      recovery: op,
      globalAtomicity: false,
    };
  }
  const journal = parseStrictJson(
    recorded,
    "publication_journal_json_invalid",
    "publication_journal_json_duplicate_key",
  );
  equal(journal.planSha256, digest, "Recovery journal plan mismatch");
  equal(
    encode(journal.destinations),
    encode(o.destinations),
    "Recovery journal destination mismatch",
  );
  if (journal.status === "INSTALLED") {
    for (const m of selectedMedia(o)) await verifyInstalled(plan, m, acceptance);
    return { status: "ALREADY_INSTALLED", planSha256: digest };
  }
  if (journal.status === "ROLLED_BACK") {
    for (const m of selectedMedia(o))
      equal(
        sameInventory(await inventory(o.destinations[m]), plan.prestates[m]),
        true,
        "Recovered destination changed",
      );
    return { status: "ALREADY_ROLLED_BACK", planSha256: digest };
  }
  if (!["PREPARING", "INSTALLING", "RECOVERY_REQUIRED"].includes(journal.status))
    throw Error("Unknown recovery state");
  return rollbackPair(plan, acceptance, journal, op, { rename, writeJournal });
}
