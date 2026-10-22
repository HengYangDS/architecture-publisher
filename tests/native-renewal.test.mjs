import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { compileNativeEditionEvolution } from "../packages/publisher/src/edition/native-evolution.mjs";
import { canonical } from "../packages/publisher/src/protocol/json.mjs";
import { selectedNativeEdition, sha } from "./fixtures/selected-native-edition.mjs";
import {
  snapshot,
  replaceSource,
  rewriteProject,
  addOperationQuestion,
} from "./fixtures/native-evolution.mjs";

test("native Edition evolution separates rebuild, verification, review, acceptance, and publication", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    "model",
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.schema, "architecture.semantic-change/v3");
  assert.deepEqual(Object.keys(result.obligations), [
    "rebuild",
    "semanticVerification",
    "mediumVerification",
    "humanReview",
    "acceptance",
    "publication",
  ]);
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
  assert.deepEqual(result.editions.affected[0].questions, ["shape"]);
  assert.deepEqual(result.editions.affected[0].media, {
    static: ["overview"],
    interactive: ["overview"],
  });
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate", "static", "interactive-document", "interactive"],
  );
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.mediumVerification.length, 2);
  assert.equal(result.obligations.humanReview.length, 2);
  assert.deepEqual(
    result.obligations.acceptance.map(({ action }) => action),
    ["reaccept"],
  );
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ["replace"],
  );
});

test("unchanged native Edition inputs produce no new obligations", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test("toolchain and Edition resource revisions renew release obligations independently", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  for (const [name, mutate, reason] of [
    [
      "toolchain",
      (side) => {
        side.lock.toolchain.profile = "revised-runtime";
      },
      "toolchain-changed",
    ],
    [
      "Edition resource",
      (side) => {
        side.lock.edition.resources.push({
          ref: "art-direction.json",
          bytes: 3,
          sha256: sha("{}\n"),
        });
      },
      "edition-resource-changed",
    ],
  ]) {
    const after = structuredClone(before);
    mutate(after);
    after.meaning.native.subjectLockSha256 = sha(canonical(after.lock));
    const result = compileNativeEditionEvolution({ before, after });
    assert(result.editions.affected[0].reasons.includes(reason), name);
    assert.equal(result.obligations.semanticVerification.length, 1, name);
    assert.equal(result.obligations.acceptance.length, 1, name);
    assert.equal(result.obligations.publication.length, 1, name);
  }
});

test("editorial-only changes still require new media and acceptance without minting native changes", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t, { title: "Revised reader atlas" });
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.delta.native.hasChanges, false);
  assert.deepEqual(result.editions.affected[0].media, {
    static: ["overview"],
    interactive: ["overview"],
  });
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
});

test("a changed native uncertainty limit cannot inherit an unchanged Edition verdict", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.native.limits.push("new-unproved-read-scope");
  after.meaning.limits.push("new-unproved-read-scope");
  const result = compileNativeEditionEvolution({ before, after });
  assert(result.delta.native.unknown.some(({ reason }) => reason === "native-limits-changed"));
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test("different native output for one exact lock is uncertainty, never a no-op", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  const range = after.meaning.native.selections[0].target.origin.range;
  range.start.line += 1;
  range.end.line += 1;
  after.meaning.native.semanticDigest = sha(
    Buffer.from(canonical(after.meaning.native.selections)),
  );
  const result = compileNativeEditionEvolution({ before, after });
  assert.notEqual(result.before.nativeDigest, result.after.nativeDigest);
  assert(result.delta.native.unknown.some(({ reason }) => reason === "native-output-drift"));
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test("Edition JSON whitespace changes exact bytes without inventing a media redraw", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await fs.writeFile(
    path.join(after.root, "edition/project.json"),
    JSON.stringify(after.project, null, 2) + "\n",
  );
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.delta.editorialChanged, false);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate"],
  );
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test("removing one selected medium withdraws it without redrawing the retained medium", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t, { media: ["static"] });
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].withdrawn, [{ medium: "interactive", scene: null }]);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate"],
  );
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ["replace", "withdraw"],
  );
});

test("adding one selected medium builds only that medium and requires fresh review", async (t) => {
  const before = await selectedNativeEdition(t, { media: ["static"] });
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate", "interactive-document", "interactive"],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ["interactive"],
  );
  assert.deepEqual(
    result.obligations.humanReview.map(({ medium }) => medium),
    ["interactive"],
  );
});

test("removing an interactive page withdraws it without repainting an unchanged overview", async (t) => {
  const before = await selectedNativeEdition(t);
  before.project.presentation.interactive.views.push({ id: "detail", questions: ["shape"] });
  await rewriteProject(before);
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].withdrawn, [
    { medium: "interactive", scene: "detail" },
  ]);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate", "interactive-document"],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ["interactive"],
  );
  assert.equal(result.obligations.publication.at(-1).action, "withdraw");
  assert.equal(result.obligations.publication.at(-1).scene, "detail");
});

test("changing a retained view question verifies both the removed and added question scope", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.static.views[0].questions.push("operation");
    fixture.project.presentation.interactive.views.push({
      id: "detail",
      questions: ["operation"],
    });
  }
  after.project.presentation.interactive.views[0].questions = ["operation"];
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].media.interactive, ["overview"]);
  assert.deepEqual(result.editions.affected[0].questions, ["operation", "shape"]);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ["operation", "shape"]);
  assert.deepEqual(result.obligations.mediumVerification[0].questions, ["operation", "shape"]);
});

test("simultaneous media changes retain separate question scopes for each medium", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.interactive.views[0].questions = ["operation"];
  }
  after.project.presentation.static.width = 5000;
  after.project.presentation.interactive.intent = "Changed exploration intent.";
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ["operation", "shape"]);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium, questions }) => ({ medium, questions })),
    [
      { medium: "static", questions: ["shape"] },
      { medium: "interactive", questions: ["operation"] },
    ],
  );
  assert.deepEqual(
    result.obligations.humanReview.map(({ medium, questions }) => ({ medium, questions })),
    [
      { medium: "static", questions: ["shape"] },
      { medium: "interactive", questions: ["operation"] },
    ],
  );
});

test("removing a static view retains its old question scope in the rebuilt artifact", async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.interactive.views[0].questions.push("operation");
  }
  before.project.presentation.static.views.push({ id: "detail", questions: ["operation"] });
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].media.static, ["overview"]);
  assert.deepEqual(result.editions.affected[0].withdrawn, []);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ["operation", "shape"]);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium, questions }) => ({ medium, questions })),
    [{ medium: "static", questions: ["operation", "shape"] }],
  );
});

test("changed compiled medium obligations cannot report a no-op for the same selected lock", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.media.static.views[0].assertionsByQuestion.shape = [];
  const result = compileNativeEditionEvolution({ before, after });
  assert.deepEqual(result.delta.media.changed, ["static"]);
  assert.deepEqual(result.editions.changed, ["selected-atlas"]);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ["static"],
  );
});

test("parser supply-only replacement renews media and acceptance without inventing source change", async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.native.parserSupply.sha256 = sha("replacement-parser-package");
  const result = compileNativeEditionEvolution({ before, after });
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.equal(result.delta.native.before, result.delta.native.after);
  assert.equal(result.delta.native.supplyChanged, true);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ["edition-candidate", "static", "interactive-document", "interactive"],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ["static", "interactive"],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
  assert(result.editions.affected[0].reasons.includes("parser-supply-changed"));
});
