import assert from "node:assert/strict";
import test from "node:test";
import { compileNativeEditionEvolution } from "../packages/publisher/src/edition/native-evolution.mjs";
import { compileNativeSelectionDelta } from "../packages/publisher/src/semantics/native-change.mjs";
import { selectedNativeEdition } from "./fixtures/selected-native-edition.mjs";
import {
  snapshot,
  nativeDelta,
  resealNativeSide,
  replaceSource,
  rewriteRequest,
  rewriteProject,
} from "./fixtures/native-evolution.mjs";

test("native evolution refuses malformed sides and implicit Edition ownership changes", async (t) => {
  const baseline = await snapshot(
    await selectedNativeEdition(t, { media: ["static", "interactive"] }),
  );
  const cases = [
    ["missing side", (input) => delete input.before, "native_evolution_input_invalid"],
    ["extra input authority", (input) => (input.extra = {}), "native_evolution_input_invalid"],
    [
      "foreign lock schema",
      (input) => (input.after.lock.schema = "foreign"),
      "native_evolution_input_invalid",
    ],
    [
      "missing questions",
      (input) => (input.after.meaning.questions = null),
      "native_evolution_input_invalid",
    ],
    [
      "missing assertions",
      (input) => (input.after.meaning.assertions = null),
      "native_evolution_input_invalid",
    ],
    [
      "unselected medium",
      (input) => (input.after.lock.media = ["static"]),
      "native_evolution_input_invalid",
    ],
    [
      "changed Edition digest outside the lock",
      (input) => (input.after.meaning.edition.sha256 = "0".repeat(64)),
      "native_evolution_input_invalid",
    ],
    [
      "missing selected views",
      (input) => (input.after.meaning.media.static.views = null),
      "native_evolution_input_invalid",
    ],
    [
      "renamed Edition",
      (input) => {
        input.after.lock.edition.id = "renamed";
        input.after.meaning.edition.id = "renamed";
      },
      "native_evolution_edition_identity_changed",
    ],
    [
      "changed editor",
      (input) => {
        input.after.lock.edition.editor = "another-editor";
        input.after.meaning.edition.editor = "another-editor";
      },
      "native_evolution_editor_changed",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = { before: structuredClone(baseline), after: structuredClone(baseline) };
    mutate(input);
    assert.throws(() => compileNativeEditionEvolution(input), { code }, name);
  }
});

test("retargeting a context-only editorial basis renews its reader views", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const [fixture, target] of [
    [before, "alpha"],
    [after, "beta"],
  ]) {
    fixture.project.scope.selections[0].namespace = "fixture/model";
    fixture.project.scope.selections[0].reference = `element:${target}`;
    delete fixture.project.scope.selections[0].questions;
    fixture.project.editorialAssertions = [
      {
        id: "editorial-shape",
        statement: "This selection is the editorial focus.",
        proponent: "fixture-editor",
        basis: ["overview"],
        questions: ["shape"],
      },
    ];
    await rewriteProject(fixture);
  }
  const plan = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(plan.editions.affected[0].media, {
    static: ["overview"],
    interactive: ["overview"],
  });
  assert.deepEqual(
    plan.obligations.mediumVerification.map(({ medium }) => medium),
    ["static", "interactive"],
  );
  assert.deepEqual(
    plan.obligations.humanReview.map(({ medium }) => medium),
    ["static", "interactive"],
  );
});

test("native comparison detects a source-bound label change without relying on cardinality", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    "model",
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes.changed, ["fixture/model"]);
  assert.deepEqual(delta.supported, [
    {
      selectionId: "overview",
      subject: { kind: "element", namespace: "fixture/model", id: "alpha" },
      fields: ["label"],
    },
  ]);
  assert(delta.unknown.some(({ reason }) => reason === "dependency-closure-unproved"));
  assert.equal(delta.hasChanges, true);
});

test("native comparison detects a changed selected view membership", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, "views", Buffer.from("views { view overview { include alpha } }\n"));
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes.changed, ["fixture/views"]);
  assert(
    delta.supported.some(
      ({ subject, fields }) => subject.kind === "view-membership" && fields.includes("elements"),
    ),
  );
  assert.equal(delta.hasChanges, true);
});

test("native comparison of identical selected inputs has no invented change", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings, { changed: [] });
  assert.deepEqual(delta.supported, []);
  assert.deepEqual(delta.unknown, []);
  assert.equal(delta.supplyChanged, false);
  assert.equal(delta.hasChanges, false);
});

test("native change admission rejects ambiguous source and selection identity", async (t) => {
  const selected = await snapshot(await selectedNativeEdition(t));
  const before = resealNativeSide({
    lock: structuredClone(selected.lock),
    native: structuredClone(selected.meaning.native),
  });
  for (const [name, mutate] of [
    ["missing selected source array", (side) => (side.lock.sources = null)],
    [
      "duplicate source namespace",
      (side) => side.lock.sources.push(structuredClone(side.lock.sources[0])),
    ],
    [
      "derived namespace collides with source",
      (side) =>
        side.lock.derived.push({
          namespace: side.lock.sources[0].namespace,
          sha256: "a".repeat(64),
        }),
    ],
    [
      "duplicate derived namespace",
      (side) =>
        side.lock.derived.push(
          ...[0, 1].map(() => ({ namespace: "fixture/derived", sha256: "a".repeat(64) })),
        ),
    ],
    [
      "selected source digest differs from its lock",
      (side) => (side.native.selections[0].source.sha256 = "0".repeat(64)),
    ],
    [
      "duplicate selection identity",
      (side) => side.native.selections.push(structuredClone(side.native.selections[0])),
    ],
    [
      "duplicate selected element identity",
      (side) =>
        side.native.selections[0].members.elements.push(
          structuredClone(side.native.selections[0].members.elements[0]),
        ),
    ],
  ]) {
    const after = structuredClone(before);
    mutate(after);
    resealNativeSide(after);
    assert.throws(
      () => compileNativeSelectionDelta(before, after),
      {
        code: "native_evolution_input_invalid",
      },
      name,
    );
  }
});

test("native delta distinguishes changed bytes, bindings, supplied output and uncertainty", async (t) => {
  const selected = await snapshot(await selectedNativeEdition(t));
  const before = resealNativeSide({
    lock: structuredClone(selected.lock),
    native: structuredClone(selected.meaning.native),
  });
  const changed = (mutate) => {
    const after = structuredClone(before);
    mutate(after);
    return resealNativeSide(after);
  };
  const reason = (delta, expected) =>
    assert(
      delta.unknown.some(({ reason: value }) => value === expected),
      expected,
    );

  const addedSource = compileNativeSelectionDelta(
    before,
    changed((side) =>
      side.lock.sources.push({ ...side.lock.sources[0], namespace: "fixture/extra" }),
    ),
  );
  assert.deepEqual(addedSource.sourceBytes.added, ["fixture/extra"]);
  const removedSource = structuredClone(before);
  removedSource.lock.sources.push({ ...removedSource.lock.sources[0], namespace: "fixture/extra" });
  assert.deepEqual(
    compileNativeSelectionDelta(resealNativeSide(removedSource), before).sourceBytes.removed,
    ["fixture/extra"],
  );

  const addedDerived = compileNativeSelectionDelta(
    before,
    changed((side) =>
      side.lock.derived.push({ namespace: "fixture/derived", sha256: "a".repeat(64) }),
    ),
  );
  reason(addedDerived, "derived-projection-added");
  const priorDerived = changed((side) =>
    side.lock.derived.push({
      namespace: "fixture/derived",
      sha256: "a".repeat(64),
      claimant: "before",
    }),
  );
  reason(compileNativeSelectionDelta(priorDerived, before), "derived-projection-removed");
  reason(
    compileNativeSelectionDelta(
      priorDerived,
      changed((side) =>
        side.lock.derived.push({
          namespace: "fixture/derived",
          sha256: "a".repeat(64),
          claimant: "after",
        }),
      ),
    ),
    "derived-projection-binding-changed",
  );
  reason(
    compileNativeSelectionDelta(
      priorDerived,
      changed((side) =>
        side.lock.derived.push({ namespace: "fixture/derived", sha256: "b".repeat(64) }),
      ),
    ),
    "derived-projection-bytes-changed",
  );

  const outputDrift = compileNativeSelectionDelta(
    before,
    changed(
      (side) =>
        (side.native.selections[0].members.elements[0].label = "Changed without input change"),
    ),
  );
  reason(outputDrift, "native-output-drift");
  assert(
    outputDrift.supported.some(
      ({ subject, fields }) => subject.kind === "element" && fields.includes("label"),
    ),
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => side.native.limits.push("new-limit")),
    ),
    "native-limits-changed",
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.nativeClosure = "partial")),
    ),
    "native-closure-changed",
  );
  assert.equal(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.parserSupply = { changed: true })),
    ).supplyChanged,
    true,
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => side.native.selections[0].limits.push("new-limit")),
    ),
    "selection-limits-changed",
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.selections[0].format = "foreign/dsl")),
    ),
    "native-selection-format-changed",
  );
  const removedSelection = compileNativeSelectionDelta(
    before,
    changed((side) => side.native.selections.pop()),
  );
  assert(
    removedSelection.supported.some(
      ({ subject, fields }) => subject.kind === "selection" && fields.includes("removed"),
    ),
  );
  const addedSelection = compileNativeSelectionDelta(
    before,
    changed((side) => {
      const additional = structuredClone(side.native.selections[0]);
      additional.selectionId = "additional-view";
      side.native.selections.push(additional);
    }),
  );
  assert(
    addedSelection.supported.some(
      ({ subject, fields }) => subject.kind === "selection" && fields.includes("added"),
    ),
  );
  assert(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.selections[0].target.id = "new-view")),
    ).supported.some(
      ({ subject, fields }) => subject.kind === "selection" && fields.includes("id"),
    ),
  );
  assert.deepEqual(
    compileNativeSelectionDelta(
      before,
      changed(
        (side) =>
          (side.lock.sources.find(({ namespace }) => namespace === "fixture/model").claimant =
            "new-owner"),
      ),
    ).sourceBindings.changed,
    ["fixture/model"],
  );
  const changedBytes = compileNativeSelectionDelta(
    before,
    changed((side) => {
      const selectedSource = side.native.selections[0].source;
      side.lock.sources.find(({ namespace }) => namespace === selectedSource.namespace).sha256 =
        "b".repeat(64);
      selectedSource.sha256 = "b".repeat(64);
      side.native.nativeClosure = "partial";
    }),
  );
  assert.deepEqual(changedBytes.sourceBytes.changed, [
    before.native.selections[0].source.namespace,
  ]);
  reason(changedBytes, "dependency-closure-unproved");
  const complete = changed((side) => (side.native.nativeClosure = "complete"));
  const changedComplete = structuredClone(complete);
  const selectedSource = changedComplete.native.selections[0].source;
  changedComplete.lock.sources.find(
    ({ namespace }) => namespace === selectedSource.namespace,
  ).sha256 = "b".repeat(64);
  selectedSource.sha256 = "b".repeat(64);
  const provedClosure = compileNativeSelectionDelta(complete, resealNativeSide(changedComplete));
  assert.deepEqual(provedClosure.sourceBytes.changed, [selectedSource.namespace]);
  assert.equal(
    provedClosure.unknown.some(({ reason: value }) => value === "dependency-closure-unproved"),
    false,
  );
});

test("native comparison does not hide changed source attribution behind equal content bytes", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  after.request.sources[0].claimant = "another-maintainer";
  await rewriteRequest(after);
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings.changed, ["fixture/model"]);
  assert.equal(delta.hasChanges, true);
});

test("relocated relation locators retain uncertainty but expose changed qualifier values", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changed =
    "\n" +
    after.model
      .toString()
      .replace("alpha -> beta", "alpha -> beta { metadata { policy 'review' } }");
  await replaceSource(after, "model", Buffer.from(changed));
  const delta = await nativeDelta(before, after);
  assert(delta.unknown.some(({ reason }) => reason === "relation-lineage-unproved"));
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === "relation-set" && fields.includes("relation-values"),
    ),
  );
});

test("relation locator drift remains unproved and renews review and acceptance", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, "model", Buffer.from("\n" + after.model.toString()));
  const prior = await snapshot(before);
  const next = await snapshot(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert.deepEqual(delta.supported, []);
  assert(delta.unknown.some(({ reason }) => reason === "relation-lineage-unproved"));
  const impact = compileNativeEditionEvolution({ before: prior, after: next });
  assert.equal(impact.editions.affected[0].scope, "complete");
  assert.deepEqual(impact.obligations.semanticVerification[0].questions, ["shape"]);
  assert.deepEqual(
    impact.obligations.humanReview.map(({ medium }) => medium),
    ["static", "interactive"],
  );
  assert.deepEqual(
    impact.obligations.acceptance.map(({ action }) => action),
    ["reaccept"],
  );
  assert.deepEqual(
    impact.obligations.publication.map(({ action }) => action),
    ["replace"],
  );
});
