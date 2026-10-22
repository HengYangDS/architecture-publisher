import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  verifyOccurrenceEdition,
  verifyStatementEdition,
} from "./fixtures/installed-occurrences.mjs";
import { installNativeEdition, verifyClaimEdition } from "./fixtures/installed-edition.mjs";

test("offline installed Edition meaning, Scenes, and Candidate survive relocation and refuse changed pins", async (t) => {
  const { work, consumer, project, nodeEnvironment, run, first } = await installNativeEdition({
    t,
  });

  const { modelBytes, claimProject, claimRequest, claimRun, claimFirst } = await verifyClaimEdition(
    { consumer, project, nodeEnvironment },
  );

  const { semantic, occurrenceRun, occurrenceFirst } = await verifyOccurrenceEdition({
    consumer,
    nodeEnvironment,
    modelBytes,
    claimProject,
    claimRequest,
  });

  await verifyStatementEdition({ consumer, nodeEnvironment, claimProject, claimRequest, semantic });

  const relocated = path.join(work, "relocated");
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  assert.deepEqual(run(relocated), first);
  assert.deepEqual(claimRun(relocated), claimFirst);
  assert.deepEqual(occurrenceRun(relocated), occurrenceFirst);
  await fs.appendFile(path.join(relocated, "claim-inputs/sources/model.json"), "\n");
  assert.deepEqual(claimRun(relocated, 1), {
    status: "error",
    code: "materialized_pin_mismatch",
  });
  await fs.appendFile(path.join(relocated, "inputs/sources/model.c4"), "\n");
  assert.deepEqual(run(relocated, 1), { status: "error", code: "materialized_pin_mismatch" });
});
