import test from "node:test";
import assert from "node:assert/strict";
import { editionVisualReviewDuties } from "./fixtures/edition.mjs";
import { api, pair, rebind, compile } from "./fixtures/edition-evolution.mjs";

test("added and removed Editions produce publish and withdraw obligations", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  let result = compileEditionEvolution({
    before: { claimModel: before.model, editions: [] },
    after: { claimModel: after.model, editions: [after.edition] },
    correspondences: [],
  });
  assert.deepEqual(result.editions.added, ["example-system"]);
  assert.deepEqual(
    result.obligations.publication.map((item) => item.action),
    ["publish"],
  );
  assert(result.obligations.rebuild.length >= 4);

  result = compileEditionEvolution({
    before: { claimModel: before.model, editions: [before.edition] },
    after: { claimModel: after.model, editions: [] },
    correspondences: [],
  });
  assert.deepEqual(result.editions.removed, ["example-system"]);
  assert.deepEqual(result.obligations.rebuild, []);
  assert.deepEqual(
    result.obligations.publication.map((item) => item.action),
    ["withdraw"],
  );
});

test("removed interactive scenes require explicit withdrawal beside Edition replacement", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.narrative = ["overview"];
  delete after.edition.scenes.interactive.runtime;
  delete after.edition.questions.runtime;
  const result = compile(compileEditionEvolution, before, after);
  assert.deepEqual(
    result.obligations.publication.map(({ action, scene }) => [action, scene]),
    [
      ["replace", null],
      ["withdraw", "runtime"],
    ],
  );
  assert.equal(result.editions.affected[0].interactiveAtlas, true);
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === "interactive")
      .map(({ medium, scene }) => [medium, scene]),
    [["interactive", null]],
  );
});

test("every changed artwork requires exact human review independently of visual style", async () => {
  const { compileEditionEvolution } = await api();
  for (const field of ["title", "scope"]) {
    const { before, after } = pair();
    after.edition[field] = "Changed editorial text";
    const result = compile(compileEditionEvolution, before, after);
    assert.equal(result.obligations.humanReview.length, 6);
    assert.deepEqual(
      new Set(result.obligations.humanReview.map(({ predicate, scope }) => ({ predicate, scope }))),
      new Set(editionVisualReviewDuties()),
    );
  }
});

test("audience, design principles and verification policy affect only declared Editions", async () => {
  const { compileEditionEvolution } = await api();
  const audience = pair();
  audience.after.edition.audiences.maintainer.label = "Repository stewards";
  let result = compile(compileEditionEvolution, audience.before, audience.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, ["overview", "runtime"]);

  const principles = pair();
  principles.after.edition.visualGrammar.principles.push("Show authority boundaries");
  result = compile(compileEditionEvolution, principles.before, principles.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, ["overview", "runtime"]);

  const verification = pair();
  verification.after.edition.qualification.interactive.push("new-browser-predicate");
  verification.after.edition.qualification.recovery.push("retained-state-replay");
  result = compile(compileEditionEvolution, verification.before, verification.after);
  assert(result.obligations.mediumVerification.some(({ medium }) => medium === "recovery"));
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter(({ medium, scene }) => medium === "interactive" && scene !== null)
      .map(({ scene }) => scene),
    ["overview", "runtime"],
  );
});

test("evolution rejects duplicate and unbounded Edition selections before obligations", async () => {
  const { compileEditionEvolution } = await api();
  const { before, after } = pair();
  const input = {
    before: { claimModel: before.model, editions: [before.edition] },
    after: { claimModel: after.model, editions: [after.edition] },
    correspondences: [],
  };
  assert.throws(
    () =>
      compileEditionEvolution({
        ...input,
        before: { ...input.before, editions: [before.edition, before.edition] },
      }),
    {
      code: "edition_evolution_duplicate",
    },
  );
  assert.throws(
    () =>
      compileEditionEvolution({
        ...input,
        after: { ...input.after, editions: Array(257).fill(after.edition) },
      }),
    {
      code: "edition_evolution_input_invalid",
    },
  );
  assert.throws(
    () => compileEditionEvolution({ ...input, correspondences: [], unreviewed: true }),
    {
      code: "edition_evolution_input_invalid",
    },
  );
});

test("Edition ownership cannot move implicitly and ordering is not meaning", async () => {
  const { compileEditionEvolution } = await api();
  const { before, after } = pair();
  after.edition.owner = "another-owner";
  assert.throws(() => compile(compileEditionEvolution, before, after), {
    code: "edition_owner_changed",
  });

  const left = pair();
  const first = structuredClone(left.before.edition);
  const second = structuredClone(left.before.edition);
  first.id = "alpha-edition";
  second.id = "zeta-edition";
  const forward = compileEditionEvolution({
    before: { claimModel: left.before.model, editions: [first, second] },
    after: { claimModel: left.after.model, editions: [second, first] },
    correspondences: [],
  });
  const reverse = compileEditionEvolution({
    before: { claimModel: left.before.model, editions: [second, first] },
    after: { claimModel: left.after.model, editions: [first, second] },
    correspondences: [],
  });
  assert.deepEqual(forward.editions.changed, []);
  assert.deepEqual(forward.before.editions, reverse.before.editions);
});

test("unrepresented structural meaning broadens every scene explicitly", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.entities.detached = {
    type: "component",
    label: "Detached meaning",
    qualifiers: {},
    provenance: ["contract"],
  };
  rebind(after);
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.deepEqual(affected.unrepresented, ["entities:detached"]);
  assert.equal(affected.scope, "complete");
  assert.equal(affected.static, true);
  assert.deepEqual(affected.interactive, ["overview", "runtime"]);
  assert(affected.reasons.includes("unrepresented-change:entities:detached"));
});

test("evolution trusts only a complete accepted baseline Edition", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  before.edition.scenes.static.composition.groups[0].entities.pop();
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /edition_overview_incomplete/,
  );
});

test("a newly introduced Edition must already provide complete overviews", async () => {
  const { compileEditionEvolution } = await api(),
    { after } = pair();
  after.edition.scenes.static.composition.groups[0].entities.pop();
  assert.throws(
    () =>
      compileEditionEvolution({
        before: { claimModel: after.model, editions: [] },
        after: { claimModel: after.model, editions: [after.edition] },
        correspondences: [],
      }),
    /edition_overview_incomplete/,
  );
});

test("an existing Edition cannot hide unchanged structure during evolution", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.scenes.static.composition.groups[0].entities.pop();
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /edition_overview_incomplete/,
  );
});

test("evolution analysis never relaxes required claim coverage", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.scenes.static.claims.pop();
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /edition_overview_incomplete/,
  );
});

test("after Edition must classify every newly introduced claim", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.claims["new-claim"] = {
    ...structuredClone(after.model.claims.tagged),
    value: "newly introduced meaning",
  };
  rebind(after);
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /edition_claim_classification_incomplete/,
  );
});

test("rename split and merge propagate both old and new Edition references without approval reuse", async () => {
  const { compileEditionEvolution } = await api();
  for (const kind of ["rename", "split", "merge"]) {
    const { before, after } = pair();
    const original = structuredClone(before.model.claims.tagged);
    delete after.model.claims.tagged;
    const from = kind === "merge" ? ["tagged", "published"] : ["tagged"];
    const to = kind === "split" ? ["tagged-stable", "tagged-supported"] : ["renamed-tag"];
    if (kind === "merge") delete after.model.claims.published;
    for (const [index, id] of to.entries())
      after.model.claims[id] = {
        ...structuredClone(original),
        value: index ? "supported" : "stable",
      };
    for (const edition of [after.edition]) {
      edition.requiredClaims = edition.requiredClaims.filter((id) => !from.includes(id));
      edition.requiredClaims.push(...to);
      for (const scene of [edition.scenes.static, ...Object.values(edition.scenes.interactive)]) {
        const had = scene.claims.some((id) => from.includes(id));
        scene.claims = scene.claims.filter((id) => !from.includes(id));
        if (had) scene.claims.push(...to);
      }
      for (const question of Object.values(edition.questions)) {
        const had = question.claims.some((id) => from.includes(id));
        question.claims = question.claims.filter((id) => !from.includes(id));
        if (had) question.claims.push(...to);
      }
    }
    rebind(after);
    const mapping = {
      kind,
      section: "claims",
      from,
      to,
      evidence: [
        {
          version: "after",
          source: "contract",
          sha256: after.model.sources.contract.sha256,
          locator: "#claim-lineage",
        },
      ],
    };
    const result = compile(compileEditionEvolution, before, after, [mapping]);
    assert.deepEqual(result.delta.correspondences[0].from, [...from].sort());
    assert.deepEqual(result.delta.correspondences[0].to, [...to].sort());
    assert.equal(result.delta.correspondences[0].kind, kind);
    assert.equal(result.obligations.acceptance.length, 1);
    assert.equal(result.obligations.publication[0].action, "replace");
    assert(result.editions.affected[0].claims.some((id) => to.includes(id)));
  }
});

test("invalid contradictory inputs fail before actionable obligations exist", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.claims.contradiction = {
    ...structuredClone(after.model.claims.intended),
    validity: "refuted",
  };
  assert.throws(() => compile(compileEditionEvolution, before, after), /semantic_contradiction/);
});
