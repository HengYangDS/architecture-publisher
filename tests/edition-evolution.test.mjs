import test from "node:test";
import assert from "node:assert/strict";
import { editionVisualReviewDuties } from "./fixtures/edition.mjs";
import { api, pair, rebind, compile, obligationKeys } from "./fixtures/edition-evolution.mjs";

test("no-op comparison retains exact identities and six empty obligation classes", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair(),
    result = compile(compileEditionEvolution, before, after);
  assert.equal(result.schema, "architecture.semantic-change/v2");
  assert.deepEqual(Object.keys(result.obligations), obligationKeys);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(result.obligations).map(([key, value]) => [key, value.length]),
    ),
    Object.fromEntries(obligationKeys.map((key) => [key, 0])),
  );
  assert.deepEqual(result.editions, {
    added: [],
    removed: [],
    changed: [],
    affected: [],
  });
  assert.equal(result.before.claimModel, result.after.claimModel);
  assert.deepEqual(result.before.editions, result.after.editions);
  assert.equal(Object.hasOwn(result, "acceptance"), false);
  assert.equal(Object.hasOwn(result.obligations, "verify"), false);
  assert.equal(Object.hasOwn(result.obligations, "review"), false);
});

test("claim qualifier-only changes propagate through Edition scenes and separate obligations", async () => {
  const { compileEditionEvolution } = await api();
  for (const [claim, field, value] of [
    ["intended", "plane", "observed"],
    ["intended", "condition", { authorization: "reconfirmed" }],
    ["intended", "scope", { environment: "remote" }],
    ["intended", "maturity", "implemented"],
    ["intended", "validity", "refuted"],
    ["observed", "value", "unhealthy"],
    [
      "observed",
      "dependsOn",
      [
        { section: "entities", id: "client" },
        { section: "sources", id: "contract" },
      ],
    ],
  ]) {
    const { before, after } = pair();
    after.model.claims[claim][field] = value;
    rebind(after);
    const result = compile(compileEditionEvolution, before, after),
      affected = result.editions.affected[0];
    assert.deepEqual(result.delta.changed.claims, [claim]);
    assert(result.delta.changedFields.claims[claim].includes(field));
    assert(affected.claims.includes(claim));
    assert.equal(affected.static, true);
    assert(affected.interactive.includes("overview"));
    assert(result.obligations.rebuild.length > 0);
    assert.equal(result.obligations.semanticVerification.length, 1);
    assert(result.obligations.mediumVerification.length > 0);
    assert.equal(result.obligations.humanReview.length, 6);
    assert.equal(result.obligations.acceptance.length, 1);
    assert.equal(result.obligations.publication.length, 1);
  }

  const { before, after } = pair();
  after.model.sources.second = {
    sha256: "2".repeat(64),
    locator: "second.md",
    authority: "Second source",
  };
  after.model.claims.observed.provenance.push("second");
  rebind(after);
  const provenance = compile(compileEditionEvolution, before, after);
  assert(provenance.delta.changedFields.claims.observed.includes("provenance"));
});

test("source-only changes rebind the Edition without unnecessary scene rebuild", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.sources.contract.sha256 = "2".repeat(64);
  rebind(after, true);
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.deepEqual(result.delta.changed.sources, ["contract"]);
  assert.equal(affected.static, false);
  assert.deepEqual(affected.interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ["publication-bundle"],
  );
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.deepEqual(
    result.obligations.mediumVerification.map((item) => item.medium),
    ["installed-use"],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication[0].action, "replace");
});

test("vocabulary changes broaden review without pretending graph cardinality changed", async () => {
  const { compileEditionEvolution } = await api();
  const { before, after } = pair();
  after.model.vocabulary.predicates.calls.cardinality = "multiple";
  rebind(after);
  const result = compile(compileEditionEvolution, before, after);
  assert.deepEqual(result.delta.changed.vocabulary, ["predicates"]);
  assert(result.editions.affected[0].reasons.includes("vocabulary-changed:predicates"));
  assert.equal(result.editions.affected[0].scope, "complete");
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
});

test("source-only changes preserve declared review duties without fabricating a changed artwork", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.sources.contract.sha256 = "2".repeat(64);
  rebind(after, true);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.deepEqual(after.edition.qualification.human, editionVisualReviewDuties());
});

test("Edition set ordering cannot change the serialized compiled result", async () => {
  const { compileEditionEvolution } = await api(),
    first = pair(),
    second = pair();
  for (const value of [first.before, first.after, second.before, second.after]) {
    const copy = structuredClone(value.edition);
    copy.id = "zeta-system";
    value.editions = [value.edition, copy];
  }
  second.before.editions.reverse();
  second.after.editions.reverse();
  const input = (value) => ({
    before: {
      claimModel: value.before.model,
      editions: value.before.editions,
    },
    after: {
      claimModel: value.after.model,
      editions: value.after.editions,
    },
    correspondences: [],
  });
  assert.equal(
    JSON.stringify(compileEditionEvolution(input(first))),
    JSON.stringify(compileEditionEvolution(input(second))),
  );
});

test("Edition ordering does not depend on host locale comparison", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    const copy = structuredClone(value.edition);
    copy.id = "zeta-system";
    value.editions = [copy, value.edition];
  }
  const localeCompare = String.prototype.localeCompare;
  String.prototype.localeCompare = () => {
    throw new Error("host locale comparison invoked");
  };
  try {
    const result = compileEditionEvolution({
      before: { claimModel: before.model, editions: before.editions },
      after: { claimModel: after.model, editions: after.editions },
      correspondences: [],
    });
    assert.deepEqual(Object.keys(result.before.editions), ["example-system", "zeta-system"]);
  } finally {
    String.prototype.localeCompare = localeCompare;
  }
});

test("Edition-only changes preserve medium locality and invalidate acceptance explicitly", async () => {
  const { compileEditionEvolution } = await api();

  const staticOnly = pair();
  staticOnly.after.edition.scenes.static.label = "Recomposed static overview";
  let result = compile(compileEditionEvolution, staticOnly.before, staticOnly.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ["publication-bundle", "static"],
  );

  const interactiveOnly = pair();
  interactiveOnly.after.edition.scenes.interactive.runtime.label = "Recomposed runtime view";
  result = compile(compileEditionEvolution, interactiveOnly.before, interactiveOnly.after);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, ["runtime"]);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => [item.target, item.scene]),
    [
      ["publication-bundle", null],
      ["interactive", "runtime"],
    ],
  );

  const qualificationOnly = pair();
  qualificationOnly.after.edition.qualification.static.push("new-static-check");
  result = compile(compileEditionEvolution, qualificationOnly.before, qualificationOnly.after);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ["publication-bundle"],
  );
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === "static")
      .map((item) => item.predicates),
    [["keyboard-and-reduced-motion", "new-static-check", "painted-geometry"]],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
});

test("changed reader question refreshes only the scenes that answer it", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.questions.runtime.prompt = "How does the selected runtime now execute?";
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.equal(affected.static, false);
  assert.deepEqual(affected.interactive, ["runtime"]);
  assert.deepEqual(
    result.obligations.rebuild
      .filter(({ target }) => target === "interactive")
      .map(({ scene }) => scene),
    ["runtime"],
  );
  assert.equal(result.obligations.acceptance.length, 1);
});

test("a newly selected interactive question and scene create fresh media obligations", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.questions.recovery = {
    ...structuredClone(after.edition.questions.runtime),
    prompt: "How does recovery use the selected runtime?",
  };
  after.edition.scenes.interactive.recovery = {
    ...structuredClone(after.edition.scenes.interactive.runtime),
    label: "Recovery",
    questions: ["recovery"],
  };
  after.edition.narrative.push("recovery");
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.equal(affected.static, false);
  assert.equal(affected.interactiveAtlas, true);
  assert.deepEqual(affected.interactive, ["recovery"]);
  assert.deepEqual(
    result.obligations.rebuild
      .filter(({ target }) => target === "interactive")
      .map(({ scene }) => scene),
    ["recovery"],
  );
  assert.equal(result.obligations.acceptance.length, 1);
});

test("title, narrative and visual grammar changes affect only their real media", async () => {
  const { compileEditionEvolution } = await api();

  const title = pair();
  title.after.edition.title = "Changed title";
  let result = compile(compileEditionEvolution, title.before, title.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, ["overview", "runtime"]);

  const grammar = pair();
  grammar.after.edition.visualGrammar.relationTypes.calls.label = "invokes";
  result = compile(compileEditionEvolution, grammar.before, grammar.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, ["overview"]);

  const narrative = pair();
  for (const value of [narrative.before, narrative.after]) {
    value.edition.questions.delivery = {
      audience: "maintainer",
      prompt: "How is delivery represented?",
      claims: ["implemented"],
      detail: "mechanism",
      risk: "Omission would hide delivery.",
    };
    value.edition.scenes.interactive.delivery = {
      label: "Delivery",
      purpose: "mechanism",
      questions: ["delivery"],
      claims: ["implemented"],
      composition: {
        groups: [{ id: "delivery", label: "Delivery", entities: ["client", "server"] }],
        relations: [
          {
            id: "request",
            fromSide: "right",
            toSide: "left",
            route: "orthogonal-h",
          },
        ],
      },
    };
    value.edition.narrative = ["overview", "runtime", "delivery"];
  }
  narrative.after.edition.narrative = ["overview", "delivery", "runtime"];
  result = compile(compileEditionEvolution, narrative.before, narrative.after);
  assert.equal(result.editions.affected[0].interactiveAtlas, true);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === "interactive")
      .map(({ medium, scene }) => [medium, scene]),
    [["interactive", null]],
  );
});

test("unknown omissions remain conservative without fabricating scene work", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    value.edition.requiredClaims = value.edition.requiredClaims.filter((id) => id !== "published");
    value.edition.questions.system.claims = value.edition.questions.system.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.static.claims = value.edition.scenes.static.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter((id) => id !== "published");
    value.edition.omissions.published = {
      disposition: "out-of-scope",
      reason: "Opaque release prose is outside this bounded view.",
      view: null,
    };
  }
  after.model.claims.published.value.text = "Changed opaque release prose.";
  rebind(after);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].scope, "complete");
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ["publication-bundle"],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map((item) => item.medium),
    ["installed-use"],
  );
});

test("unchanged unknown dependencies broaden only scenes that carry them", async () => {
  const { compileEditionEvolution } = await api(),
    represented = pair();
  for (const value of [represented.before, represented.after]) {
    value.model.claims.published.dependsOn = [];
    value.edition.questions.runtime.claims.push("published");
    value.edition.scenes.interactive.runtime.claims.push("published");
    rebind(value);
  }
  represented.after.model.entities.server.label = "Changed server";
  rebind(represented.after);
  let result = compile(compileEditionEvolution, represented.before, represented.after);
  assert(result.delta.unknownClaims.includes("published"));
  assert.equal(result.editions.affected[0].scope, "complete");
  assert.deepEqual(result.editions.affected[0].interactive, ["overview", "runtime"]);

  const excluded = pair();
  for (const value of [excluded.before, excluded.after]) {
    value.model.claims.published.dependsOn = [];
    value.edition.requiredClaims = value.edition.requiredClaims.filter((id) => id !== "published");
    value.edition.questions.system.claims = value.edition.questions.system.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.static.claims = value.edition.scenes.static.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter((id) => id !== "published");
    value.edition.omissions.published = {
      disposition: "out-of-scope",
      reason: "Opaque release prose is outside this bounded view.",
      view: null,
    };
    rebind(value);
  }
  excluded.after.model.entities.server.label = "Changed server";
  rebind(excluded.after);
  result = compile(compileEditionEvolution, excluded.before, excluded.after);
  assert(result.delta.unknownClaims.includes("published"));
  assert.deepEqual(result.editions.affected[0].interactive, ["overview"]);
});

test("represented-by omissions bind the named interactive scene", async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    value.edition.requiredClaims = value.edition.requiredClaims.filter((id) => id !== "published");
    value.edition.questions.system.claims = value.edition.questions.system.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.static.claims = value.edition.scenes.static.claims.filter(
      (id) => id !== "published",
    );
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter((id) => id !== "published");
    value.edition.scenes.interactive.runtime.claims.push("published");
    value.edition.questions.runtime.claims.push("published");
    value.edition.omissions.published = {
      disposition: "represented-by",
      reason: "Release prose is explained in the runtime mechanism.",
      view: "runtime",
    };
  }
  after.model.claims.published.value.text = "Changed opaque release prose.";
  rebind(after);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, ["runtime"]);
});
