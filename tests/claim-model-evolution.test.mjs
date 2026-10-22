import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import { fileURLToPath } from "node:url";

import { compileNativeEditionEvolution } from "../packages/publisher/src/edition/native-evolution.mjs";

import { compileNativeSelectionDelta } from "../packages/publisher/src/semantics/native-change.mjs";

import { canonical } from "../packages/publisher/src/protocol/json.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { installCoreAndSelf } from "./fixtures/installed-packages.mjs";

import {
  sha,
  modelNamespace,
  fixture,
  groupedMixedFixture,
  evolutionSide,
} from "./fixtures/claim-selection.mjs";

test("typed claim changes produce exact selected fields and scoped review obligations", async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.claims.intended.plane = "observed";
  changedModel.claims.intended.condition.authorization = "denied";
  changedModel.claims.intended.dependsOn = [
    { section: "relations", id: "request" },
    { section: "entities", id: "client" },
  ];
  const after = await fixture(t, { model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert.deepEqual(delta.sourceBytes.changed, [modelNamespace]);
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === "claim" &&
        ["condition", "dependsOn", "plane"].every((field) => fields.includes(field)),
    ),
  );
  const impact = compileNativeEditionEvolution({ before: prior, after: next });
  assert.deepEqual(impact.editions.changed, ["claim-atlas"]);
  assert.deepEqual(impact.editions.affected[0].media, {
    static: ["overview"],
    interactive: ["overview"],
  });
  for (const key of [
    "rebuild",
    "semanticVerification",
    "mediumVerification",
    "humanReview",
    "acceptance",
    "publication",
  ])
    assert(impact.obligations[key].length > 0, `missing ${key}`);
});

test("entity and relation qualifier changes retain typed subjects", async (t) => {
  for (const [reference, mutate, kind] of [
    [
      "entity:client",
      (model) => {
        model.entities.client.qualifiers.owner = "platform";
      },
      "entity",
    ],
    [
      "relation:request",
      (model) => {
        model.relations.request.qualifiers.policy = "review";
      },
      "relation",
    ],
  ]) {
    const before = await fixture(t, { reference });
    const changedModel = claimModel();
    mutate(changedModel);
    const after = await fixture(t, { reference, model: changedModel });
    const prior = await evolutionSide(before);
    const next = await evolutionSide(after);
    const delta = compileNativeSelectionDelta(
      { lock: prior.lock, native: prior.meaning.native },
      { lock: next.lock, native: next.meaning.native },
    );
    assert(
      delta.supported.some(
        ({ subject, fields }) => subject.kind === kind && fields.includes("qualifiers"),
      ),
    );
    assert.equal(delta.hasChanges, true);
  }
});

test("a selected relation change reaches only claims with a declared dependency", async (t) => {
  const before = await groupedMixedFixture(t);
  const changedModel = claimModel();
  changedModel.relations.request.qualifiers.policy = "review";
  const after = await groupedMixedFixture(t, { model: changedModel });
  for (const selected of [before, after]) {
    selected.project.scope.selections.push({
      id: "unrelated-claim",
      namespace: modelNamespace,
      kind: "reference",
      reference: "claim:observed",
      questions: ["condition"],
    });
    await fs.writeFile(
      path.join(selected.root, "edition/project.json"),
      JSON.stringify(selected.project) + "\n",
    );
  }
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(
    delta.supported.some(
      ({ selectionId, subject, fields }) =>
        selectionId === "selected-claim" &&
        subject.kind === "claim-dependency" &&
        subject.id === "intended" &&
        subject.reference?.section === "relations" &&
        subject.reference.id === "request" &&
        fields.includes("target-value"),
    ),
  );
  assert(
    !delta.supported.some(
      ({ selectionId, subject }) =>
        selectionId === "unrelated-claim" && subject.kind === "claim-dependency",
    ),
  );
});

test("native and derived unselected relation changes reach dependent claims", async (t) => {
  for (const delivery of ["native", "derived"]) {
    const before = await fixture(t, { delivery });
    const changedModel = claimModel();
    changedModel.relations.request.qualifiers.policy = "review";
    const after = await fixture(t, { delivery, model: changedModel });
    const prior = await evolutionSide(before);
    const next = await evolutionSide(after);
    const delta = compileNativeSelectionDelta(
      { lock: prior.lock, native: prior.meaning.native },
      { lock: next.lock, native: next.meaning.native },
    );
    assert(
      delta.supported.some(
        ({ selectionId, subject, fields }) =>
          selectionId === "selected-claim" &&
          subject.kind === "claim-dependency" &&
          subject.reference?.section === "relations" &&
          subject.reference.id === "request" &&
          fields.includes("target-value"),
      ),
      delivery,
    );
    assert.equal(
      delta.unknown.some(({ reason }) => reason === "derived-projection-bytes-changed"),
      delivery === "derived",
      delivery,
    );
    const impact = compileNativeEditionEvolution({ before: prior, after: next });
    assert(
      impact.editions.affected[0].reasons.includes("native-selection-changed:selected-claim"),
      delivery,
    );
    assert.deepEqual(impact.editions.affected[0].media, {
      static: ["overview"],
      interactive: ["overview"],
    });
  }
});

test("offline installed evolution preserves claim dependency impact after relocation", async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.relations.request.qualifiers.policy = "review";
  const after = await fixture(t, { model: changedModel });
  const work = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-claim-install-"),
  );
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const { consumer, core } = await installCoreAndSelf(
    fileURLToPath(new URL("../", import.meta.url)),
    work,
  );
  assert.equal(core.name, "architecture-publisher");
  await fs.mkdir(path.join(consumer, "inputs"));
  await fs.cp(before.root, path.join(consumer, "inputs/before"), { recursive: true });
  await fs.cp(after.root, path.join(consumer, "inputs/after"), { recursive: true });
  const comparison = {
    schema: "architecture.semantic-compare-input/v3",
    before: { request: { path: "before/build-request.json", sha256: before.requestSha256 } },
    after: { request: { path: "after/build-request.json", sha256: after.requestSha256 } },
  };
  const comparisonBytes = Buffer.from(JSON.stringify(comparison) + "\n");
  await fs.writeFile(path.join(consumer, "inputs/comparison.json"), comparisonBytes);
  const home = path.join(work, "empty-home");
  await fs.mkdir(home);
  const environment = {
    HOME: home,
    PATH: "",
    NODE_PATH: "",
    NODE_OPTIONS: "",
    LANG: "C.UTF-8",
    ...(process.platform === "win32" && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const compare = async (directory) => {
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(directory, "node_modules/architecture-publisher/package.json"),
        "utf8",
      ),
    );
    const result = spawnSync(
      process.execPath,
      [
        path.join(directory, "node_modules/architecture-publisher", manifest.bin.archpub),
        "evolution",
        "plan",
        path.join(directory, "inputs/comparison.json"),
        "--sha256",
        sha(comparisonBytes),
      ],
      {
        cwd: directory,
        env: environment,
        input: "",
        encoding: "utf8",
        timeout: 60_000,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      },
    );
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const first = await compare(consumer);
  assert(
    first.delta.native.supported.some(
      ({ selectionId, subject, fields }) =>
        selectionId === "selected-claim" &&
        subject.kind === "claim-dependency" &&
        subject.reference?.section === "relations" &&
        subject.reference.id === "request" &&
        fields.includes("target-value"),
    ),
  );
  assert.deepEqual(first.editions.affected[0].questions, ["condition"]);
  for (const localPath of [work, before.root, after.root])
    assert.equal(JSON.stringify(first).includes(localPath), false);
  const relocated = path.join(work, "relocated");
  await fs.rename(consumer, relocated);
  assert.deepEqual(await compare(relocated), first);
});

test("native comparison refuses malformed claim dependency bindings", async (t) => {
  const selected = await fixture(t);
  const side = await evolutionSide(selected);
  const before = { lock: side.lock, native: side.meaning.native };
  const cases = [
    ["missing", (selection) => delete selection.dependencyBindings],
    ["empty", (selection) => (selection.dependencyBindings = [])],
    [
      "duplicate",
      (selection) => selection.dependencyBindings.push(selection.dependencyBindings[0]),
    ],
    ["invalid digest", (selection) => (selection.dependencyBindings[0].sha256 = "not-a-digest")],
    ["invalid claim collection", (selection) => (selection.members.claims = {})],
    ["null claim member", (selection) => (selection.members.claims = [null])],
    ["null extra claim member", (selection) => selection.members.claims.push(null)],
    ["invalid dependency", (selection) => (selection.members.claims[0].dependsOn = [null])],
    [
      "unadmitted dependency section",
      (selection) => {
        selection.members.claims[0].dependsOn[0].section = "foreign";
        selection.dependencyBindings[0].section = "foreign";
      },
    ],
    [
      "duplicate declared dependency",
      (selection) => {
        selection.members.claims[0].dependsOn.push(selection.members.claims[0].dependsOn[0]);
        selection.dependencyBindings.push(selection.dependencyBindings[0]);
      },
    ],
  ];
  for (const [name, mutate] of cases) {
    const after = structuredClone(before);
    mutate(after.native.selections[0]);
    after.native.semanticDigest = sha(Buffer.from(canonical(after.native.selections)));
    assert.throws(
      () => compileNativeSelectionDelta(before, after),
      {
        code: "native_evolution_input_invalid",
      },
      name,
    );
  }
});

test("a predicate change is attributed to its predicate ID, not the claim ID", async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.vocabulary.predicates.calls.cardinality = "multiple";
  const after = await fixture(t, { model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === "predicate" && subject.id === "calls" && fields.includes("cardinality"),
    ),
  );
});
