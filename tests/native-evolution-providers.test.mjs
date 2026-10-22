import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { compileNativeEditionEvolution } from "../packages/publisher/src/edition/native-evolution.mjs";
import { compareEvolutionInput } from "../packages/publisher/src/compiler/evolution.mjs";
import {
  executableModelProvider,
  moveModelToProvider,
  selectedNativeEdition,
  sha,
} from "./fixtures/selected-native-edition.mjs";
import { snapshot, replaceSource, comparisonPlan } from "./fixtures/native-evolution.mjs";

test("the existing evolution command compares exact relocated native Build Requests", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    "model",
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.equal(result.schema, "architecture.semantic-change/v3");
  assert.deepEqual(result.delta.native.sourceBytes.changed, ["fixture/model"]);
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
  assert.equal(result.obligations.acceptance.length, 1);
  const cli = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url)),
      "evolution",
      "plan",
      selected.file,
      "--sha256",
      selected.digest,
    ],
    {
      cwd: selected.root,
      env: { HOME: selected.root, PATH: "", LANG: "C.UTF-8" },
      encoding: "utf8",
      timeout: 20_000,
    },
  );
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), result);
});

test("native comparison refuses changed selected bytes before deriving obligations", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const selected = await comparisonPlan(t, before, after);
  await fs.writeFile(path.join(selected.root, "after/sources/model.c4"), "model { changed }\n");
  await assert.rejects(compareEvolutionInput(selected.file, selected.digest), {
    code: "materialized_pin_mismatch",
  });
});

test("native comparison plan refuses a path outside its portable input root", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const selected = await comparisonPlan(t, before, after);
  assert.equal(
    (await compareEvolutionInput(selected.file, selected.digest)).schema,
    "architecture.semantic-change/v3",
  );
  selected.plan.before.request.path = "../before/build-request.json";
  const bytes = Buffer.from(JSON.stringify(selected.plan) + "\n");
  await fs.writeFile(selected.file, bytes);
  await assert.rejects(compareEvolutionInput(selected.file, sha(bytes)), {
    code: "semantic_plan_invalid",
  });
});

test("native comparison reads a pinned declarative Provider without changing selected meaning", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await moveModelToProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test("native comparison detects changed bytes delivered by a pinned declarative Provider", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changed = Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'"));
  await moveModelToProvider(after, changed);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.deepEqual(result.delta.native.sourceBytes.changed, ["fixture/model"]);
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
});

test("native evolution does not execute a Provider from a comparison plan without admission", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await moveModelToProvider(before, before.model, "executable");
  const selected = await comparisonPlan(t, before, after);
  await assert.rejects(compareEvolutionInput(selected.file, selected.digest), {
    code: "semantic_native_provider_comparison_unadmitted",
  });
});

test("native evolution selects executable Providers independently on both sides", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const choice = {
    before: [{ id: "model-provider", manifestSha256: prior.manifestSha256 }],
    after: [{ id: "model-provider", manifestSha256: next.manifestSha256 }],
  };
  const result = await compareEvolutionInput(selected.file, selected.digest, choice);
  assert.equal(result.schema, "architecture.semantic-change/v3");
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.equal((await fs.readFile(prior.executionMarker, "utf8")) !== "", true);
  assert.equal((await fs.readFile(next.executionMarker, "utf8")) !== "", true);
  const cli = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url)),
      "evolution",
      "plan",
      selected.file,
      "--sha256",
      selected.digest,
      "--execute-before-providers",
      `model-provider@${prior.manifestSha256}`,
      "--execute-after-providers",
      `model-provider@${next.manifestSha256}`,
    ],
    {
      cwd: selected.root,
      env: { HOME: selected.root, PATH: "", LANG: "C.UTF-8" },
      encoding: "utf8",
      timeout: 20_000,
    },
  );
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), result);
});

test("a Provider package-only change renews semantic verification without redrawing media", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const priorPackage = JSON.parse(
    await fs.readFile(path.join(before.root, "provider/provider.json"), "utf8"),
  ).delivery.package.contentSha256;
  const nextPackage = JSON.parse(
    await fs.readFile(path.join(after.root, "provider/provider.json"), "utf8"),
  ).delivery.package.contentSha256;
  assert.notEqual(priorPackage, nextPackage);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest, {
    before: [{ id: "model-provider", manifestSha256: prior.manifestSha256 }],
    after: [{ id: "model-provider", manifestSha256: next.manifestSha256 }],
  });
  assert.equal(result.delta.native.hasChanges, false);
  assert.deepEqual(result.delta.execution.providerPackages, {
    added: [],
    removed: [],
    changed: [{ id: "model-provider", beforeSha256: priorPackage, afterSha256: nextPackage }],
  });
  const priorCandidate = await compileEditionCandidateInput(
    before.file,
    before.digest,
    path.join(before.root, "candidate"),
    [{ id: "model-provider", manifestSha256: prior.manifestSha256 }],
  );
  const nextCandidate = await compileEditionCandidateInput(
    after.file,
    after.digest,
    path.join(after.root, "candidate"),
    [{ id: "model-provider", manifestSha256: next.manifestSha256 }],
  );
  assert.equal(priorCandidate.lockSha256, nextCandidate.lockSha256);
  assert.equal(priorCandidate.candidateSha256, nextCandidate.candidateSha256);
  assert.equal(priorCandidate.manifestSha256, nextCandidate.manifestSha256);
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
  assert.deepEqual(result.obligations.rebuild, []);
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ["shape"]);
  assert.deepEqual(
    result.obligations.acceptance.map(({ action }) => action),
    ["reaccept"],
  );
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ["replace"],
  );
});

test("a relocated unchanged executable Provider package creates no evolution obligation", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const provider = await executableModelProvider(fixture);
  const selected = await comparisonPlan(t, fixture, fixture);
  const choice = [{ id: "model-provider", manifestSha256: provider.manifestSha256 }];
  const result = await compareEvolutionInput(selected.file, selected.digest, {
    before: choice,
    after: choice,
  });
  assert.deepEqual(result.delta.execution.providerPackages, {
    added: [],
    removed: [],
    changed: [],
  });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test("package-only evolution refuses malformed or ambiguous execution evidence", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const side = await snapshot(fixture);
  for (const before of [
    [{ id: "model-provider", sha256: "not-a-digest" }],
    [
      { id: "model-provider", sha256: sha("first") },
      { id: "model-provider", sha256: sha("second") },
    ],
  ]) {
    assert.throws(
      () => compileNativeEditionEvolution({ before: side, after: side }, { before, after: [] }),
      { code: "native_evolution_execution_invalid" },
    );
  }
});

test("native evolution validates both executable selections before either Provider runs", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const beforeChoice = [{ id: "model-provider", manifestSha256: prior.manifestSha256 }];
  await assert.rejects(
    compareEvolutionInput(selected.file, selected.digest, { before: beforeChoice, after: [] }),
    { code: "semantic_native_provider_comparison_unadmitted" },
  );
  await assert.rejects(fs.access(prior.executionMarker), { code: "ENOENT" });
  await assert.rejects(fs.access(next.executionMarker), { code: "ENOENT" });

  await fs.writeFile(path.join(selected.root, "after/provider/model.c4"), "changed after pin\n");
  await assert.rejects(
    compareEvolutionInput(selected.file, selected.digest, {
      before: beforeChoice,
      after: [{ id: "model-provider", manifestSha256: next.manifestSha256 }],
    }),
    { code: "edition_provider_v2_input_size_mismatch" },
  );
  await assert.rejects(fs.access(prior.executionMarker), { code: "ENOENT" });
  await assert.rejects(fs.access(next.executionMarker), { code: "ENOENT" });
});
