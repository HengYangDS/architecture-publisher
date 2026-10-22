import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/edition.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import { composeStaticResponsibilityScene } from "../packages/publisher/src/scene/static/responsibility.mjs";
import { projectInteractivePage } from "../packages/publisher/renderers/interactive/model.mjs";
import { composeStaticResponsibilitySvg } from "../packages/publisher/renderers/svg/responsibility.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";
import { sha } from "./fixtures/selected-native-edition.mjs";
import { figureIcons, responsibilityFixture } from "./fixtures/visual-form.mjs";

test("static responsibility Scene rejects missing or conflicting selected meaning", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const original = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const cases = [
    [
      "incomplete meaning",
      (m) => (m.completeness = "partial"),
      "static_responsibility_input_invalid",
    ],
    [
      "second static view",
      (m) => m.media.static.views.push(structuredClone(m.media.static.views[0])),
      "static_responsibility_input_invalid",
    ],
    [
      "wrong view identity",
      (m) => (m.editorial.presentation.static.views[0].id = "other"),
      "static_responsibility_input_invalid",
    ],
    [
      "missing form",
      (m) => delete m.editorial.presentation.static.views[0].form,
      "static_responsibility_input_invalid",
    ],
    [
      "duplicate selection",
      (m) => m.native.selections.push(structuredClone(m.native.selections[0])),
      "static_responsibility_identity_ambiguous",
    ],
    [
      "second required native view",
      (m) => {
        m.native.selections.push({
          ...structuredClone(m.native.selections[0]),
          selectionId: "other-view",
        });
        const assertion = structuredClone(m.assertions.find((item) => item.kind === "source"));
        assertion.id = "other-view";
        assertion.selection = "other-view";
        m.assertions.push(assertion);
        m.media.static.views[0].assertionIds.push(assertion.id);
      },
      "static_responsibility_source_unadmitted",
    ],
    [
      "missing assertion",
      (m) => m.media.static.views[0].assertionIds.push("absent"),
      "static_scene_assertion_unbound",
    ],
    [
      "unsupported assertion",
      (m) => (m.assertions.find((a) => a.kind === "source").kind = "other"),
      "static_responsibility_assertion_unbound",
    ],
    [
      "missing selected source",
      (m) => (m.assertions.find((a) => a.kind === "source").selection = "absent"),
      "static_scene_assertion_unbound",
    ],
    [
      "malformed members",
      (m) => delete m.native.selections[0].members.relations,
      "static_responsibility_assertion_unbound",
    ],
    [
      "contradictory source member",
      (m) => {
        const other = structuredClone(m.native.selections[0]);
        other.selectionId = "contradiction";
        other.target.kind = "entity";
        other.members.elements[0].label = "Contradictory label";
        m.native.selections.push(other);
        const assertion = structuredClone(m.assertions.find((a) => a.kind === "source"));
        assertion.id = "contradiction";
        assertion.selection = "contradiction";
        m.assertions.push(assertion);
        m.media.static.views[0].assertionIds.push(assertion.id);
      },
      "static_responsibility_semantic_conflict",
    ],
    [
      "duplicate group",
      (m) => (m.editorial.presentation.static.views[0].groups[1].id = "first-role"),
      "static_responsibility_group_invalid",
    ],
    [
      "unselected member",
      (m) => (m.editorial.presentation.static.views[0].groups[1].elements[0].id = "absent"),
      "static_responsibility_group_invalid",
    ],
    [
      "unrepresented source member",
      (m) =>
        m.native.selections[0].members.elements.push({
          ...structuredClone(m.native.selections[0].members.elements[0]),
          id: "extra",
        }),
      "static_responsibility_group_invalid",
    ],
    [
      "missing role",
      (m) => m.editorial.presentation.static.views[0].form.roles.pop(),
      "static_responsibility_group_invalid",
    ],
    [
      "missing relation endpoint",
      (m) => (m.native.selections[0].members.relations[0].to.id = "absent"),
      "static_responsibility_relation_endpoint_missing",
    ],
    [
      "missing question",
      (m) => (m.media.static.views[0].questionIds[0] = "absent"),
      "static_responsibility_question_unbound",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const meaning = structuredClone(original);
    mutate(meaning);
    assert.throws(() => composeStaticResponsibilityScene(meaning), { code }, name);
  }
  const unselected = structuredClone(original);
  unselected.native.selections.push({
    ...structuredClone(unselected.native.selections[0]),
    selectionId: "outside-this-work",
  });
  assert.deepEqual(
    composeStaticResponsibilityScene(unselected),
    composeStaticResponsibilityScene(original),
    "an unselected source view cannot expand or conflict with this work",
  );
});

test("each responsibility group needs exactly one role binding", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles.pop();
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, "edition_visual_form_authoring_invalid");
    assert.equal(error.diagnostics[0].subject.questionId, "shape");
    assert.equal(error.diagnostics[0].subject.groupId, "second-role");
    return true;
  });
});

test("a duplicate responsibility role cannot borrow a passing group set", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles.push({ ...view.form.roles[0] });
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, "edition_visual_form_authoring_invalid");
    assert.deepEqual(error.diagnostics?.[0]?.subject, {
      kind: "edition-visual-form-role",
      editionId: selected.project.id,
      medium: "interactive",
      viewId: view.id,
      questionId: "shape",
      groupId: "first-role",
      basisAssertionId: "first-basis",
    });
    return true;
  });
});

test("a role basis for another question reports the exact editorial input gap", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.questions.push({
    id: "other",
    audience: "maintainer",
    text: "What is outside this responsibility?",
  });
  selected.project.presentation.static.views[0].questions.push("other");
  selected.project.editorialAssertions[0].questions = ["other"];
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, "edition_visual_form_authoring_invalid");
    assert.deepEqual(error.diagnostics?.[0]?.subject, {
      kind: "edition-visual-form-role",
      editionId: selected.project.id,
      medium: "interactive",
      viewId: view.id,
      questionId: "shape",
      groupId: "first-role",
      basisAssertionId: "first-basis",
    });
    return true;
  });
});

test("handoff references are distinct, bound, and non-duplicated", async (t) => {
  for (const [name, change] of [
    ["same group", (handoff) => (handoff.to = handoff.from)],
    ["unknown group", (handoff) => (handoff.to = "unknown-role")],
    ["duplicate", (handoff, form) => form.handoffs.push({ ...handoff })],
  ]) {
    await t.test(name, async (child) => {
      const { selected, view, writeProject } = await responsibilityFixture(child);
      change(view.form.handoffs[0], view.form);
      await writeProject();
      await assert.rejects(
        materializeBuildRequestInput(selected.file, selected.digest),
        (error) => {
          assert.equal(error.code, "edition_visual_form_authoring_invalid");
          assert.equal(error.diagnostics[0].subject.kind, "edition-visual-form-handoff");
          assert.equal(error.diagnostics[0].subject.questionId, "shape");
          assert.equal(error.diagnostics[0].subject.fromGroup, "first-role");
          return true;
        },
      );
    });
  }
});

test("an editorial role basis must cover its selected group members", async (t) => {
  const { selected, view, members, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    id: "first-member",
    namespace: members[0].namespace,
    kind: "reference",
    reference: `element:${members[0].id}`,
    questions: ["shape"],
  });
  selected.project.editorialAssertions[1].basis = ["first-member"];
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, "edition_visual_form_membership_unsupported");
      assert.equal(error.diagnostics[0].subject.groupId, view.form.roles[1].group);
      return true;
    },
  );
});

test("an unselected group member reports its form question and group before layout", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.groups[0].elements[0].id = "unselected-member";
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, "edition_visual_form_group_unbound");
      assert.equal(error.diagnostics[0].subject.questionId, "shape");
      assert.equal(error.diagnostics[0].subject.groupId, "first-role");
      assert.equal(error.diagnostics[0].subject.member.id, "unselected-member");
      return true;
    },
  );
});

test("a handoff basis must cross its selected responsibility groups", async (t) => {
  const { selected, view, members, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    id: "first-member",
    namespace: members[0].namespace,
    kind: "reference",
    reference: `element:${members[0].id}`,
    questions: ["shape"],
  });
  selected.project.editorialAssertions[2].basis = ["first-member"];
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, "edition_visual_form_handoff_unsupported");
      assert.equal(error.diagnostics[0].subject.kind, "edition-visual-form-handoff");
      assert.equal(error.diagnostics[0].subject.fromGroup, view.form.handoffs[0].from);
      assert.equal(error.diagnostics[0].subject.toGroup, view.form.handoffs[0].to);
      return true;
    },
  );
});

test("an editorial handoff cannot reverse the selected source direction", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.handoffs[0].from = "second-role";
  view.form.handoffs[0].to = "first-role";
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, "edition_visual_form_handoff_unsupported");
      assert.equal(error.diagnostics[0].subject.fromGroup, "second-role");
      assert.equal(error.diagnostics[0].subject.toGroup, "first-role");
      return true;
    },
  );
});

test("a role cannot borrow an omitted source assertion from another selection", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    ...structuredClone(selected.project.scope.selections[0]),
    id: "second-overview",
  });
  selected.project.omissions.push({
    selection: "overview",
    question: "shape",
    medium: "interactive",
    disposition: "explicit-limit",
    view: view.id,
    reason: "This selected reference is not used for the visual role.",
  });
  view.form.roles[0].basis = "overview";
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    { code: "edition_visual_form_basis_unsupported" },
  );
});

test("an editorial role cannot borrow its omitted source basis", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    ...structuredClone(selected.project.scope.selections[0]),
    id: "second-overview",
  });
  selected.project.omissions.push({
    selection: "overview",
    question: "shape",
    medium: "interactive",
    disposition: "explicit-limit",
    view: view.id,
    reason: "This selected reference is not used for the visual role.",
  });
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    { code: "edition_visual_form_basis_unsupported" },
  );
});

test("a typed source Claim can remain an attributed responsibility basis", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-form-claim-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "edition"));
  await fs.mkdir(path.join(root, "source"));
  const source = Buffer.from(JSON.stringify(claimModel()) + "\n");
  await fs.writeFile(path.join(root, "source/model.json"), source);
  const address = (id) => ({ namespace: "fixture/claims", id });
  const project = {
    schema: "architecture.edition-project/v1",
    id: "source-claim-form",
    editor: "fixture-editor",
    title: "Responsibility claim",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "Who calls whom?" }],
    scope: {
      sourceNamespaces: ["fixture/claims"],
      selections: [
        {
          id: "selected-claim",
          namespace: "fixture/claims",
          kind: "reference",
          reference: "claim:intended",
          questions: ["shape"],
        },
        {
          id: "selected-client",
          namespace: "fixture/claims",
          kind: "reference",
          reference: "entity:client",
          questions: ["shape"],
        },
        {
          id: "selected-server",
          namespace: "fixture/claims",
          kind: "reference",
          reference: "entity:server",
          questions: ["shape"],
        },
        {
          id: "selected-relation",
          namespace: "fixture/claims",
          kind: "reference",
          reference: "relation:request",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "A selected source claim remains attributed." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }] },
      interactive: {
        views: [
          {
            id: "overview",
            questions: ["shape"],
            groups: [
              { id: "client", label: "Client", elements: [address("client")] },
              { id: "server", label: "Server", elements: [address("server")] },
            ],
            form: {
              schema: "architecture.visual-form/v1",
              kind: "responsibility",
              roles: [
                { group: "client", basis: "selected-claim" },
                { group: "server", basis: "selected-claim" },
              ],
              handoffs: [{ from: "client", to: "server", basis: "selected-claim" }],
            },
          },
        ],
      },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
  project.scope.selections.push({
    id: "selected-observed",
    namespace: "fixture/claims",
    kind: "reference",
    reference: "claim:observed",
    questions: ["shape"],
  });
  project.presentation.static.views = [structuredClone(project.presentation.interactive.views[0])];
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "model",
        namespace: "fixture/claims",
        format: { id: "architecture.claim-model", version: "2" },
        claimant: "fixture-maintainer",
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "pin", path: "source/model.json", sha256: sha(source) },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  const bytes = Buffer.from(JSON.stringify(request) + "\n");
  const file = path.join(root, "build-request.json");
  await fs.writeFile(file, bytes);
  const meaning = await compileEditionMeaning(await materializeBuildRequestInput(file, sha(bytes)));
  assert.equal(meaning.native.selections[0].members.claims[0].condition.authorization, "granted");
  assert.equal(meaning.assertions[0].semanticStatus, "attributed-source-unproved");
  const page = composeInteractiveEditionScene(meaning).pages[0];
  const projected = projectInteractivePage(page, 0).publicPage;
  assert.equal(projected.form.roles[0].basis.kind, "source-claim");
  assert.equal(projected.form.handoffs[0].basis.kind, "source-claim");
  assert.equal(projected.form.roles[0].basis.claimGraphicId, projected.claims[0].graphicId);
  const selectedScene = composeStaticResponsibilityScene(meaning);
  const composed = composeStaticResponsibilitySvg(selectedScene, { icons: figureIcons });
  const headings = [
    ...composed.bytes
      .toString("utf8")
      .matchAll(/<g data-graphic-id="c-\d+">\n<text x="([^"]+)" y="([^"]+)"[^>]*>CLAIM ON /gu),
  ];
  assert.equal(headings.length, 2);
  assert.equal(headings[0][2], headings[1][2], "complete source claims share one reading row");
  assert.ok(Number(headings[1][1]) - Number(headings[0][1]) >= 640);
  const output = path.join(root, "claim-responsibility-candidate");
  const result = await compileEditionCandidateInput(file, sha(bytes), output);
  assert.equal(result.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.match(svg, /data-form="responsibility"/u);
  assert.match(svg, /authorization: granted/u);
  assert.match(svg, /Selected source Claim; editorial interpretation/u);
  assert.match(svg, /CLAIM ON client → server/u);
  assert.match(svg, />CLAIM ON client<\/text>/u);
  const png = await fs.readFile(path.join(output, "static/architecture.png"));
  assert.equal(png.readUInt32BE(16), 6000);
  assert.ok(png.readUInt32BE(16) * png.readUInt32BE(20) <= 32 * 1024 * 1024);
  const missingClaim = structuredClone(selectedScene);
  missingClaim.claimCards = [];
  assert.throws(() => composeStaticResponsibilitySvg(missingClaim, { icons: figureIcons }), {
    code: "static_responsibility_basis_invalid",
  });
  const missingFacts = structuredClone(selectedScene);
  missingFacts.claimCards[0].facts = [];
  assert.throws(() => composeStaticResponsibilitySvg(missingFacts, { icons: figureIcons }), {
    code: "static_responsibility_claim_invalid",
  });
  const unlinkedRelation = structuredClone(selectedScene);
  unlinkedRelation.claimRelationLinks = [];
  const unlinkedSvg = composeStaticResponsibilitySvg(unlinkedRelation, {
    icons: figureIcons,
  }).bytes.toString("utf8");
  assert.match(unlinkedSvg, /Unlinked relations show source topology only/u);
});
