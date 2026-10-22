import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import { fileURLToPath } from "node:url";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { compileNativeSelectionDelta } from "../packages/publisher/src/semantics/native-change.mjs";

import { canonical } from "../packages/publisher/src/protocol/json.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import {
  sha,
  modelNamespace,
  rawNamespace,
  fixture,
  evolutionSide,
} from "./fixtures/claim-selection.mjs";

test("invalid native and derived claim applicability retains the selected claimant boundary", async (t) => {
  for (const field of ["condition", "scope"]) {
    for (const delivery of ["native", "derived"]) {
      const model = claimModel();
      model.claims.intended[field] = null;
      const selected = await fixture(t, { delivery, model });
      const input = await materializeBuildRequestInput(
        selected.requestPath,
        selected.requestSha256,
      );
      const source = delivery === "native" ? input.lock.sources[0] : input.lock.derived[0];
      const finding = {
        code: `semantic_claim_${field}_invalid`,
        severity: "error",
        message: `Selected Claim Model assertion has an invalid ${field}.`,
        predicate: `claim-${field}-valid`,
        subject: {
          kind: "claim-model-assertion",
          sourceClass: delivery,
          namespace: source.namespace,
          sourceSha256: source.sha256,
          claimId: "intended",
          ...(delivery === "derived" ? { adapter: source.adapter } : {}),
        },
        responsibility: {
          role: delivery === "native" ? "source-claimant" : "projection-claimant",
          declaredOwner: source.claimant,
        },
        evidence: {},
        supportedFixes: [],
      };
      await assert.rejects(compileEditionMeaning(input), (error) => {
        assert.equal(error.code, finding.code);
        assert.deepEqual(error.diagnostics, [finding]);
        return true;
      });

      const output = path.join(selected.root, "candidate");
      const result = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url)),
          "edition",
          "build",
          selected.requestPath,
          "--sha256",
          selected.requestSha256,
          "--output",
          output,
        ],
        { cwd: selected.root, encoding: "utf8", timeout: 30_000 },
      );
      assert.equal(result.status, 1, result.stderr);
      const response = JSON.parse(result.stdout);
      assert.deepEqual(response.error.diagnostics, [finding]);
      assert.equal(JSON.stringify(response).includes(selected.root), false);
      await assert.rejects(fs.stat(output), { code: "ENOENT" });
    }
  }
});

test("entity and relation selections retain typed identity and exact model origin", async (t) => {
  const entity = await fixture(t, { reference: "entity:client" });
  const relation = await fixture(t, { reference: "relation:request" });
  const selectedEntity = (
    await compileEditionMeaning(
      await materializeBuildRequestInput(entity.requestPath, entity.requestSha256),
    )
  ).native.selections[0];
  const selectedRelation = (
    await compileEditionMeaning(
      await materializeBuildRequestInput(relation.requestPath, relation.requestSha256),
    )
  ).native.selections[0];
  assert.equal(selectedEntity.members.elements[0].kind, "component");
  assert.deepEqual(selectedEntity.members.elements[0].provenance, ["contract"]);
  assert.equal(selectedRelation.members.relations[0].kind, "calls");
  assert.deepEqual(selectedRelation.members.relations[0].from, {
    namespace: modelNamespace,
    id: "client",
  });
  assert.equal(selectedRelation.members.relations[0].origin.sha256, selectedRelation.source.sha256);
});

test("derived Claim Model keeps its exact native ancestry and attributed status", async (t) => {
  const selected = await fixture(t, { delivery: "derived" });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const assertion = meaning.native.selections[0];
  assert.equal(assertion.sourceClass, "derived");
  assert.equal(assertion.source.namespace, modelNamespace);
  assert.deepEqual(assertion.source.derivedFrom, [
    { namespace: rawNamespace, sha256: input.lock.sources[0].sha256 },
  ]);
  assert.equal(assertion.members.claims[0].validity, "affirmed");
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  assert.deepEqual(
    candidate.input.semanticSupplies.map(({ id }) => id),
    ["publisher-semantic-file-set"],
  );
  assert(candidate.limits.includes("claim-model-provenance-unverified"));
  assert(candidate.limits.includes("adapter-code-unverified:claim-selection/model"));
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.match(svg, /Projection claimant: adapter-maintainer/u);
  assert.match(svg, /Declared model owner: example:system/u);
});

test("a derived claim cannot borrow unverified ancestor bytes", async (t) => {
  const selected = await fixture(t, { delivery: "derived" });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  await assert.rejects(
    compileEditionMeaning({ ...input, readSource: () => Buffer.from("wrong ancestor\n") }),
    { code: "native_claim_model_ancestor_digest_mismatch" },
  );
});

test("malformed derived ancestry fails as an input error before semantic import", async (t) => {
  const selected = await fixture(t, { delivery: "derived" });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const lock = structuredClone(input.lock);
  lock.derived[0].derivedFrom = null;
  await assert.rejects(
    compileEditionMeaning({
      ...input,
      lock,
      lockSha256: sha(Buffer.from(canonical(lock))),
    }),
    { code: "edition_native_input_invalid" },
  );
});

test("a changed source owner cannot borrow exact claim-dependency correspondence", async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.relations.request.qualifiers.policy = "review";
  const after = await fixture(t, { model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const changedNative = structuredClone(next.meaning.native);
  changedNative.selections[0].sourceOwner = "other-model-owner";
  changedNative.semanticDigest = sha(Buffer.from(canonical(changedNative.selections)));
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: changedNative },
  );
  assert(delta.unknown.some(({ reason }) => reason === "claim-model-sourceOwner-changed"));
  assert(!delta.supported.some(({ subject }) => subject.kind === "claim-dependency"));
});

test("a derived Claim Model change retains attribution without pretending to be native", async (t) => {
  const before = await fixture(t, { delivery: "derived" });
  const changedModel = claimModel();
  changedModel.claims.intended.scope.environment = "remote";
  const after = await fixture(t, { delivery: "derived", model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(
    delta.supported.some(
      ({ subject, fields }) => subject.kind === "claim" && fields.includes("scope"),
    ),
  );
  assert.equal(delta.hasChanges, true);
  assert(delta.unknown.some(({ reason }) => reason === "derived-projection-bytes-changed"));
});

test("adapter metadata changes are not mislabeled as changed projection bytes", async (t) => {
  const before = await fixture(t, { delivery: "derived" });
  const after = await fixture(t, { delivery: "derived" });
  const manifestPath = path.join(after.root, "provider/provider.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath));
  manifest.selected.derived[0].adapter.version = "2";
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + "\n");
  await fs.writeFile(manifestPath, manifestBytes);
  const request = JSON.parse(await fs.readFile(after.requestPath));
  request.providers[0].sha256 = sha(manifestBytes);
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  await fs.writeFile(after.requestPath, requestBytes);
  after.requestSha256 = sha(requestBytes);
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(delta.unknown.some(({ reason }) => reason === "derived-projection-binding-changed"));
  assert(!delta.unknown.some(({ reason }) => reason === "derived-projection-bytes-changed"));
});

test("native comparison preserves uncertain Claim Model authorship and membership drift", async (t) => {
  const selected = await fixture(t);
  const prior = await evolutionSide(selected);
  const before = { lock: prior.lock, native: prior.meaning.native };
  const compare = (mutate) => {
    const after = structuredClone(before);
    mutate(after.native.selections[0], after.lock);
    after.native.semanticDigest = sha(Buffer.from(canonical(after.native.selections)));
    after.native.subjectLockSha256 = sha(Buffer.from(canonical(after.lock)));
    return compileNativeSelectionDelta(before, after);
  };
  const owner = compare((selection) => (selection.sourceOwner = "another-claimant"));
  assert(owner.unknown.some(({ reason }) => reason === "claim-model-sourceOwner-changed"));
  const provenance = compare((selection) => (selection.provenanceSources = ["different-source"]));
  assert(provenance.unknown.some(({ reason }) => reason === "claim-model-provenance-changed"));
  const namespace = compare((selection, lock) => {
    lock.sources.find(({ namespace: id }) => id === modelNamespace).namespace = "fixture/renamed";
    selection.source.namespace = "fixture/renamed";
  });
  assert(namespace.unknown.some(({ reason }) => reason === "claim-model-namespace-changed"));
  const membership = compare((selection) => {
    selection.members.claims.push({ ...selection.members.claims[0], id: "new-claim" });
  });
  assert(
    membership.supported.some(
      ({ subject, fields }) => subject.kind === "selection-membership" && fields.includes("claims"),
    ),
  );
  const unrecognized = compare((selection) => {
    selection.members.claims[0].projectionNote = "not source meaning";
  });
  assert(
    unrecognized.unknown.some(({ reason }) => reason === "claim-model-member-field-unrecognized"),
  );
  for (const mutate of [
    (selection) => (selection.members.claims = null),
    (selection) => selection.members.claims.push(structuredClone(selection.members.claims[0])),
  ])
    assert.throws(() => compare(mutate), { code: "native_evolution_input_invalid" });
});

test("native evolution rejects a forged Claim Model source class", async (t) => {
  const selected = await fixture(t);
  const side = await evolutionSide(selected);
  const forged = structuredClone(side.meaning.native);
  forged.selections[0].sourceClass = "unverified";
  forged.semanticDigest = sha(Buffer.from(canonical(forged.selections)));
  assert.throws(
    () =>
      compileNativeSelectionDelta(
        { lock: side.lock, native: side.meaning.native },
        { lock: side.lock, native: forged },
      ),
    { code: "native_evolution_input_invalid" },
  );
});
