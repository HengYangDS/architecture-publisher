import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { assembleEditionSelection } from "../packages/publisher/src/edition/selection.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function project() {
  return {
    schema: "architecture.edition-project/v1",
    id: "reader-atlas",
    editor: "architecture-editor",
    title: "Selected system",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [
      { id: "shape", audience: "maintainer", text: "What is selected?" },
      { id: "risk", audience: "maintainer", text: "What remains uncertain?" },
    ],
    scope: {
      sourceNamespaces: ["example/system"],
      selections: [
        {
          id: "system",
          namespace: "example/system",
          kind: "reference",
          reference: "system",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    editorialAssertions: [
      {
        id: "risk-editorial",
        statement: "The selected evidence does not establish runtime safety.",
        proponent: "architecture-editor",
        basis: ["system"],
        questions: ["risk"],
      },
    ],
    omissions: [],
    narrative: { summary: "A scoped system view." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }], intent: "One overview." },
      interactive: {
        views: [{ id: "overview", questions: ["shape", "risk"] }],
        intent: "An explorable view.",
      },
    },
    visualPolicy: { profile: "neutral" },
  };
}

function assemble(editionProject, media = ["static", "interactive"]) {
  const content = Buffer.from(JSON.stringify(editionProject) + "\n");
  const source = Buffer.from('{"system":true}\n');
  return assembleEditionSelection({
    request: {
      sources: [{ id: "system-handle", namespace: "example/system" }],
      providers: [],
      media,
      toolchain: { profile: "portable" },
    },
    edition: { content, resources: [] },
    sources: [
      {
        namespace: "example/system",
        format: { id: "example/native-json", version: "1" },
        claimant: "system-maintainer",
        revisionEvidence: {
          kind: "content",
          scope: "selected-root",
          canonicalization: "raw-bytes/v1",
          algorithm: "sha256",
          value: sha(source),
          verification: "recomputed",
        },
        content: source,
      },
    ],
  });
}

test("selected media derive distinct question and assertion obligations before layout", () => {
  const selected = assemble(project());
  assert.deepEqual(selected.questionObligations, {
    static: {
      questionIds: ["shape"],
      assertionsByQuestion: { shape: ["system"] },
      assertionIds: ["system"],
      limitQuestionIds: [],
      views: [
        {
          id: "overview",
          questionIds: ["shape"],
          assertionsByQuestion: { shape: ["system"] },
          limitsByQuestion: { shape: [] },
          assertionIds: ["system"],
          limitQuestionIds: [],
        },
      ],
    },
    interactive: {
      questionIds: ["shape", "risk"],
      assertionsByQuestion: { shape: ["system"], risk: ["risk-editorial"] },
      assertionIds: ["system", "risk-editorial"],
      limitQuestionIds: [],
      views: [
        {
          id: "overview",
          questionIds: ["shape", "risk"],
          assertionsByQuestion: { shape: ["system"], risk: ["risk-editorial"] },
          limitsByQuestion: { shape: [], risk: [] },
          assertionIds: ["system", "risk-editorial"],
          limitQuestionIds: [],
        },
      ],
    },
  });
  assert.equal(Object.isFrozen(selected.questionObligations.static.questionIds), true);
  assert.equal(Object.isFrozen(selected.questionObligations.static.views[0]), true);
});

test("multiple views derive one medium question set without a second authored list", () => {
  const editionProject = project();
  editionProject.presentation.interactive.views = [
    { id: "overview", questions: ["shape"] },
    { id: "risk-detail", questions: ["risk"] },
  ];
  const selected = assemble(editionProject);
  assert.deepEqual(selected.questionObligations.interactive.questionIds, ["shape", "risk"]);
  assert.deepEqual(selected.questionObligations.interactive.assertionIds, [
    "system",
    "risk-editorial",
  ]);
});

test("a view-specific explicit limit replaces only that view source obligation", () => {
  const editionProject = project();
  editionProject.omissions.push({
    medium: "static",
    view: "overview",
    selection: "system",
    question: "shape",
    disposition: "explicit-limit",
    reason: "The static overview does not show the selected system shape.",
  });
  const selected = assemble(editionProject);
  assert.deepEqual(selected.questionObligations.static.assertionsByQuestion.shape, []);
  assert.deepEqual(selected.questionObligations.static.limitQuestionIds, ["shape"]);
  assert.deepEqual(selected.questionObligations.static.views[0].assertionsByQuestion.shape, []);
  assert.deepEqual(selected.questionObligations.interactive.assertionsByQuestion.shape, ["system"]);
});

test("one source identity answers two questions without transferring scoped omissions", () => {
  const editionProject = project();
  editionProject.scope.selections[0].questions = ["shape", "risk"];
  editionProject.omissions.push({
    medium: "static",
    view: "overview",
    selection: "system",
    question: "shape",
    disposition: "explicit-limit",
    reason: "The static view does not express the source shape.",
  });
  const selected = assemble(editionProject).questionObligations;
  assert.deepEqual(selected.static.assertionsByQuestion.shape, []);
  assert.deepEqual(selected.interactive.assertionsByQuestion.shape, ["system"]);
  assert.deepEqual(selected.interactive.assertionsByQuestion.risk, ["system", "risk-editorial"]);
});

test("covered-elsewhere removes a source obligation only from its declared view", () => {
  const editionProject = project();
  editionProject.editorialAssertions.push({
    id: "shape-summary",
    statement: "The overview highlights the selected system boundary.",
    proponent: "architecture-editor",
    basis: ["system"],
    questions: ["shape"],
  });
  editionProject.presentation.interactive.views.push({ id: "detail", questions: ["shape"] });
  editionProject.omissions.push({
    medium: "interactive",
    view: "overview",
    coveredIn: "detail",
    selection: "system",
    question: "shape",
    disposition: "covered-elsewhere",
    reason: "The detail view carries the source assertion.",
  });
  const selected = assemble(editionProject);
  assert.deepEqual(selected.questionObligations.interactive.views[0].assertionsByQuestion.shape, [
    "shape-summary",
  ]);
  assert.deepEqual(selected.questionObligations.interactive.views[1].assertionsByQuestion.shape, [
    "system",
    "shape-summary",
  ]);
  assert.deepEqual(selected.questionObligations.interactive.assertionsByQuestion.shape, [
    "system",
    "shape-summary",
  ]);

  editionProject.editorialAssertions.pop();
  assert.throws(
    () => assemble(editionProject),
    (error) => {
      assert.equal(error.code, "materialized_view_question_unanswered");
      assert.deepEqual(error.diagnostics, [
        {
          code: error.code,
          severity: "error",
          message: "Edition view question has no visible assertion or explicit limit.",
          predicate: "view-question-answered",
          subject: {
            kind: "edition-view-question",
            editionId: editionProject.id,
            editionSha256: sha(Buffer.from(JSON.stringify(editionProject) + "\n")),
            medium: "interactive",
            viewId: "overview",
            questionId: "shape",
            omissions: [
              { selection: "system", disposition: "covered-elsewhere", coveredIn: "detail" },
            ],
          },
          responsibility: { role: "edition-editor", declaredOwner: editionProject.editor },
          evidence: {},
          supportedFixes: [],
        },
      ]);
      return true;
    },
  );
});

test("a question offered only in an unrequested medium cannot satisfy selection", () => {
  assert.throws(() => assemble(project(), ["static"]), {
    code: "materialized_selected_media_incomplete",
  });
});

test("a selected question without an assertion or explicit limit is unanswered", () => {
  const editionProject = project();
  editionProject.editorialAssertions.pop();
  assert.throws(() => assemble(editionProject), {
    code: "materialized_question_unanswered",
  });
  editionProject.scope.limits.push({
    question: "risk",
    reason: "Runtime evidence has not been selected.",
  });
  const selected = assemble(editionProject);
  assert.deepEqual(selected.questionObligations.interactive.assertionsByQuestion.risk, []);
  assert.deepEqual(selected.questionObligations.interactive.limitQuestionIds, ["risk"]);
});

test("each view retains the exact authored reason for its scoped limits", () => {
  const editionProject = project();
  editionProject.scope.limits.push({ question: "risk", reason: "No runtime trace was selected." });
  editionProject.omissions.push({
    medium: "static",
    view: "overview",
    selection: "system",
    question: "shape",
    disposition: "explicit-limit",
    reason: "The static overview omits the system boundary.",
  });
  const selected = assemble(editionProject).questionObligations;
  assert.deepEqual(selected.static.views[0].limitsByQuestion?.shape, [
    {
      kind: "omission",
      selection: "system",
      reason: "The static overview omits the system boundary.",
    },
  ]);
  assert.deepEqual(selected.interactive.views[0].limitsByQuestion?.risk, [
    { kind: "scope", reason: "No runtime trace was selected." },
  ]);
  assert.deepEqual(selected.interactive.views[0].limitsByQuestion?.shape, []);
});
