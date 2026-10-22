import assert from "node:assert/strict";
import test from "node:test";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/edition.mjs";
import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/edition.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { interactivePage } from "./fixtures/interactive-member.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";

const figureIcons = await loadFigureIconSupply();

function selectedMeaning(scene, medium) {
  const pages =
    medium === "static"
      ? scene.schema === "architecture.edition-static-figure/v1"
        ? scene.views
        : [scene]
      : scene.pages;
  const assertions = new Map();
  const views = pages.map((page) => {
    const selected = [
      ...page.sourceAssertionCarriers.map(({ assertionId }) => ({
        id: assertionId,
        kind: "source",
        questions: page.questionIds,
      })),
      ...page.editorialAssertions.map(({ id, questions }) => ({
        id,
        kind: "editorial",
        questions,
      })),
    ];
    for (const assertion of selected) assertions.set(assertion.id, assertion);
    const assertionIds = selected.map(({ id }) => id);
    return {
      id: medium === "static" ? page.editorialViewId : page.id,
      questionIds: page.questionIds,
      assertionIds,
      assertionsByQuestion: Object.fromEntries(
        page.questionIds.map((id) => [
          id,
          selected
            .filter(({ questions }) => questions.includes(id))
            .map(({ id: assertionId }) => assertionId),
        ]),
      ),
      limitsByQuestion: page.limitsByQuestion,
    };
  });
  return { assertions: [...assertions.values()], media: { [medium]: { views } } };
}

test("a multi-view figure cannot lose, reorder, or reuse another view graphic", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const first = staticEditionScene();
  const second = staticEditionScene();
  second.editorialViewId = "followup";
  second.questionIds = ["followup"];
  second.questions[0].id = "followup";
  second.limitsByQuestion = { followup: second.limitsByQuestion.shape };
  second.sourceAssertionCarriers[0].assertionId = "source-followup";
  const figure = {
    schema: "architecture.edition-static-figure/v1",
    views: [first, second],
    placements: [{ id: "overview" }, { id: "followup" }],
  };
  const meaning = selectedMeaning(figure, "static");
  const maps = [
    composeStaticEditionSvg(first, {
      icons: figureIcons,
      idPrefix: "static-view-0-",
      fragment: true,
    }).carriers,
    composeStaticEditionSvg(second, {
      icons: figureIcons,
      idPrefix: "static-view-1-",
      fragment: true,
    }).carriers,
  ];
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", figure, maps));
  for (const mutate of [
    (value) => delete value.figure.placements,
    (value) => value.figure.placements.pop(),
    (value) => (value.figure.placements[1].id = "overview"),
    (value) => (value.maps[1].nodes[0].graphicId = value.maps[0].nodes[0].graphicId),
    (value) => value.figure.views.pop(),
    (value) => value.maps.pop(),
    (value) => (value.maps[1] = null),
    (value) => delete value.maps[1].nodes,
    (value) => delete value.maps[1].relations,
    (value) => (value.maps[1].claims = []),
    (value) => (value.maps[1].assertions = []),
  ]) {
    const value = structuredClone({ meaning, figure, maps });
    mutate(value);
    assert.throws(
      () => validateVisibleSelection(value.meaning, "static", value.figure, value.maps),
      { code: "edition_visible_coverage_mismatch" },
    );
  }
});

test("interactive rendering refuses a question present only in hidden scene metadata", async () => {
  const scene = interactiveEditionScene();
  scene.pages[0].questions.push({
    id: "hidden",
    audience: "maintainer",
    text: "What is not displayed?",
  });
  await assert.rejects(renderInteractiveEditionHtml(scene), {
    code: "render_interactive_question_invalid",
  });
});

test("interactive rendering refuses a limit for an undisplayed question", async () => {
  const scene = interactiveEditionScene();
  scene.pages[0].limitsByQuestion.hidden = [
    { kind: "scope", reason: "A hidden limit cannot count as disclosure." },
  ];
  await assert.rejects(renderInteractiveEditionHtml(scene), {
    code: "render_interactive_question_invalid",
  });
});

test("static rendering refuses an authored question with no visible question record", () => {
  const scene = staticEditionScene();
  scene.questionIds.push("hidden");
  assert.throws(() => composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_question_invalid",
  });
});

test("static rendering refuses a limit for an undisplayed question", () => {
  const scene = staticEditionScene();
  scene.limitsByQuestion.hidden = [
    { kind: "scope", reason: "A hidden limit cannot count as disclosure." },
  ];
  assert.throws(() => composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_question_invalid",
  });
});

test("static rendering refuses graphic carriers with no bound source assertion", () => {
  const scene = staticEditionScene();
  scene.sourceAssertionCarriers = [];
  assert.throws(() => composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_carrier_unclaimed",
  });
});

test("static private carrier evidence binds assertions to the visible graphics", () => {
  const rendered = composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  assert.deepEqual(rendered.carriers.assertions, [
    {
      assertionId: "source-shape",
      nodeGraphicIds: ["n-0", "n-1"],
      relationGraphicIds: ["r-0"],
    },
  ]);
});

test("changing only assertion binding changes private evidence even when visible bytes agree", () => {
  const before = composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const scene = staticEditionScene();
  scene.sourceAssertionCarriers[0].assertionId = "another-assertion";
  const after = composeStaticEditionSvg(scene, { icons: figureIcons });
  assert.deepEqual(after.bytes, before.bytes);
  assert.notDeepEqual(after.carriers.assertions, before.carriers.assertions);
});

test("static relation notes preserve bidirectional meaning", () => {
  const scene = staticEditionScene();
  scene.edges[0].relations[0].direction = "bidirectional";
  scene.edges[0].relations[0].label = null;
  scene.edges[0].relations[0].kind = "peer";
  const svg = composeStaticEditionSvg(scene, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(svg, /Alpha &amp; one ↔ Beta · peer/u);
  assert.doesNotMatch(svg, /Alpha &amp; one → Beta · peer/u);
});

test("compiler coverage join accepts the selected static and interactive view obligations", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const staticScene = staticEditionScene();
  const staticCarriers = composeStaticEditionSvg(staticScene, { icons: figureIcons }).carriers;
  assert.doesNotThrow(() =>
    validateVisibleSelection(
      selectedMeaning(staticScene, "static"),
      "static",
      staticScene,
      staticCarriers,
    ),
  );
  const interactiveScene = interactiveEditionScene();
  const interactiveCarriers = (await renderInteractiveEditionHtml(interactiveScene)).carriers;
  assert.doesNotThrow(() =>
    validateVisibleSelection(
      selectedMeaning(interactiveScene, "interactive"),
      "interactive",
      interactiveScene,
      interactiveCarriers,
    ),
  );
});

test("compiler coverage join refuses an invented Scene assertion despite valid rendered graphics", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, "static");
  scene.sourceAssertionCarriers[0].assertionId = "invented";
  const carriers = composeStaticEditionSvg(scene, { icons: figureIcons }).carriers;
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage join refuses an invented private carrier assertion", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, "static");
  const carriers = composeStaticEditionSvg(scene, { icons: figureIcons }).carriers;
  carriers.assertions[0].assertionId = "invented";
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage join refuses a partial assertion-to-graphic binding", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, "static");
  const carriers = composeStaticEditionSvg(scene, { icons: figureIcons }).carriers;
  carriers.assertions[0].nodeGraphicIds = ["n-1"];
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage rejects ambiguous question and graphic identities at the join", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const original = staticEditionScene();
  const originalMeaning = selectedMeaning(original, "static");
  const originalCarriers = composeStaticEditionSvg(original, { icons: figureIcons }).carriers;
  for (const [name, mutate] of [
    ["unknown medium", (value) => (value.medium = "foreign")],
    [
      "duplicate assertion",
      (value) => value.meaning.assertions.push(structuredClone(value.meaning.assertions[0])),
    ],
    ["missing scene source carriers", (value) => delete value.scene.sourceAssertionCarriers],
    ["missing private assertion carriers", (value) => delete value.carriers.assertions],
    [
      "question obligation omitted",
      (value) => (value.meaning.media.static.views[0].assertionsByQuestion = {}),
    ],
    [
      "invented question assertion",
      (value) => (value.meaning.media.static.views[0].assertionsByQuestion.shape = ["invented"]),
    ],
    [
      "duplicate graphic identity",
      (value) => (value.carriers.nodes[1].graphicId = value.carriers.nodes[0].graphicId),
    ],
    ["empty graphic identity", (value) => (value.carriers.nodes[0].graphicId = "")],
    [
      "source assertion with no graphic",
      (value) => {
        value.carriers.assertions[0].nodeGraphicIds = [];
        value.carriers.assertions[0].relationGraphicIds = [];
      },
    ],
    [
      "source assertion with unknown graphic",
      (value) => (value.carriers.assertions[0].nodeGraphicIds = ["n-0", "missing"]),
    ],
    [
      "two graphics claim one source node",
      (value) => (value.carriers.nodes[1].source = structuredClone(value.carriers.nodes[0].source)),
    ],
  ]) {
    const value = {
      medium: "static",
      meaning: structuredClone(originalMeaning),
      scene: structuredClone(original),
      carriers: structuredClone(originalCarriers),
    };
    mutate(value);
    assert.throws(
      () => validateVisibleSelection(value.meaning, value.medium, value.scene, value.carriers),
      { code: "edition_visible_coverage_mismatch" },
      name,
    );
  }
});

test("compiler coverage join refuses an omitted editorial assertion behind a limit", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, "interactive");
  meaning.media.interactive.views[1].assertionsByQuestion.risk = [];
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.throws(() => validateVisibleSelection(meaning, "interactive", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage join binds each interactive carrier map to its page", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, "interactive");
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  carriers[1].id = "overview";
  assert.throws(() => validateVisibleSelection(meaning, "interactive", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage join binds authored interactive groups and their visible members", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].groups = [
    {
      id: "input",
      label: "Input",
      elements: [{ namespace: "private/model", id: "secret-alpha" }],
    },
    {
      id: "effect",
      label: "Effect",
      elements: [{ namespace: "private/model", id: "secret-beta" }],
    },
  ];
  const meaning = selectedMeaning(scene, "interactive");
  meaning.editorial = {
    presentation: {
      interactive: {
        views: [
          { id: "overview", groups: structuredClone(scene.pages[0].groups) },
          { id: "limit" },
        ],
      },
    },
  };
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "interactive", scene, carriers));
  const lost = structuredClone(scene);
  delete lost.pages[0].groups;
  assert.throws(() => validateVisibleSelection(meaning, "interactive", lost, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
  const forged = structuredClone(carriers);
  forged[0].groups[0].nodeIds = ["n-1"];
  assert.throws(() => validateVisibleSelection(meaning, "interactive", scene, forged), {
    code: "edition_visible_coverage_mismatch",
  });
  const relabeled = structuredClone(scene);
  relabeled.pages[0].groups[0].label = "Not input";
  assert.throws(() => validateVisibleSelection(meaning, "interactive", relabeled, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
  const missingCarrier = structuredClone(carriers);
  delete missingCarrier[0].groups;
  assert.throws(() => validateVisibleSelection(meaning, "interactive", scene, missingCarrier), {
    code: "edition_visible_coverage_mismatch",
  });
  const swappedScene = structuredClone(scene);
  const swappedMeaning = structuredClone(meaning);
  for (const value of [
    swappedScene.pages[0],
    swappedMeaning.editorial.presentation.interactive.views[0],
  ])
    [value.groups[0].elements, value.groups[1].elements] = [
      value.groups[1].elements,
      value.groups[0].elements,
    ];
  assert.throws(
    () => validateVisibleSelection(swappedMeaning, "interactive", swappedScene, carriers),
    {
      code: "edition_visible_coverage_mismatch",
    },
  );
  const foreignScene = structuredClone(scene);
  const foreignMeaning = structuredClone(meaning);
  foreignScene.pages[0].groups[0].elements[0].namespace = "other/model";
  foreignMeaning.editorial.presentation.interactive.views[0].groups[0].elements[0].namespace =
    "other/model";
  assert.throws(
    () => validateVisibleSelection(foreignMeaning, "interactive", foreignScene, carriers),
    {
      code: "edition_visible_coverage_mismatch",
    },
  );
  const duplicateScene = structuredClone(scene);
  const duplicateMeaning = structuredClone(meaning);
  const duplicateCarriers = structuredClone(carriers);
  const repeated = { namespace: "private/model", id: "secret-alpha" };
  duplicateScene.pages[0].groups[0].elements.push(repeated);
  duplicateMeaning.editorial.presentation.interactive.views[0].groups[0].elements.push(repeated);
  duplicateCarriers[0].groups[0].nodeIds.push("n-0");
  assert.throws(
    () =>
      validateVisibleSelection(duplicateMeaning, "interactive", duplicateScene, duplicateCarriers),
    { code: "edition_visible_coverage_mismatch" },
  );
});

test("compiler coverage join refuses interactive assertion substitution and false question coverage", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, "interactive");
  scene.pages[0].sourceAssertionCarriers[0].assertionId = "invented";
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.throws(() => validateVisibleSelection(meaning, "interactive", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
  const original = interactiveEditionScene();
  const originalCarriers = (await renderInteractiveEditionHtml(original)).carriers;
  const falseMeaning = selectedMeaning(original, "interactive");
  falseMeaning.media.interactive.views[0].assertionsByQuestion.shape = ["invented"];
  assert.throws(
    () => validateVisibleSelection(falseMeaning, "interactive", original, originalCarriers),
    { code: "edition_visible_coverage_mismatch" },
  );
});

test("compiler coverage join refuses swapping declared assertions between questions", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = staticEditionScene();
  scene.questionIds.push("risk");
  scene.questions.push({
    id: "risk",
    audience: "maintainer",
    text: "What remains uncertain?",
  });
  scene.limitsByQuestion.risk = [];
  scene.editorialAssertions.push({
    id: "editorial-risk",
    kind: "editorial",
    statement: "Runtime safety is not established.",
    proponent: "fixture-editor",
    basis: ["overview"],
    questions: ["risk"],
    semanticStatus: "editor-attributed-unverified",
  });
  const meaning = selectedMeaning(scene, "static");
  meaning.assertions.find(({ id }) => id === "source-shape").questions = ["shape"];
  meaning.media.static.views[0].assertionsByQuestion = {
    shape: ["source-shape"],
    risk: ["editorial-risk"],
  };
  const carriers = composeStaticEditionSvg(scene, { icons: figureIcons }).carriers;
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", scene, carriers));

  meaning.media.static.views[0].assertionsByQuestion = {
    shape: ["editorial-risk"],
    risk: ["source-shape"],
  };
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("compiler coverage join permits a limited view when another view carries the assertion", async () => {
  const { validateVisibleSelection } =
    await import("../packages/publisher/src/compiler/coverage.mjs");
  const scene = interactiveEditionScene();
  const secondPage = scene.pages[1];
  secondPage.questionIds.push("shape");
  secondPage.questions.push({
    id: "shape",
    audience: "maintainer",
    text: "What is connected?",
  });
  secondPage.limitsByQuestion.shape = [
    { kind: "omission", selection: "overview", reason: "Shown in the overview." },
  ];
  const meaning = selectedMeaning(scene, "interactive");
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.deepEqual(meaning.media.interactive.views[1].assertionsByQuestion.shape, []);
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "interactive", scene, carriers));
});

test("editorial-only pages keep each visible limit with its reader question", async () => {
  const scene = interactiveEditionScene();
  const page = scene.pages[1];
  page.questionIds.push("shape");
  page.questions.push({
    id: "shape",
    audience: "maintainer",
    text: "What is connected?",
  });
  page.limitsByQuestion.shape = [
    { kind: "omission", selection: "overview", reason: "Shown in the overview." },
  ];
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = interactivePage(rendered.bytes, "limit");
  const boundary = html.match(
    /<div\b[^>]*data-note-card-id="reading-boundary"[^>]*>[\s\S]*?<\/ul>\s*<\/div>/u,
  )?.[0];
  assert(boundary, "The selected page has a visible reading boundary");
  const items = [...boundary.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gu)].map(([markup]) => markup);
  for (const [question, limit] of [
    ["What remains uncertain?", "No runtime observation was selected."],
    ["What is connected?", "Shown in the overview."],
  ]) {
    const matched = items.filter((item) => item.includes(limit));
    assert.equal(matched.length, 1, "Each exact limit belongs to one visible reading item");
    assert(matched[0].includes(question), "A limit names its own reader question in the same item");
    assert.equal(html.split(limit).length - 1, 1, "The selected page does not duplicate its limit");
  }
  assert.equal(
    items.filter(
      (item) =>
        item.includes("No runtime observation was selected.") &&
        item.includes("Shown in the overview."),
    ).length,
    0,
    "Distinct questions keep distinct boundary items",
  );
});
