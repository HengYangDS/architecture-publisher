import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import * as scenes from "../packages/publisher/src/scene/index.mjs";
import { selectedNativeEdition } from "./fixtures/selected-native-edition.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";
import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";
import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";
import { canonical } from "../packages/publisher/src/semantics/document.mjs";
import {
  importClaimModel,
  resolveClaimModelSelection,
} from "../packages/publisher/src/semantics/native-claim-model.mjs";
import { figureIcons, sha, editionProject, selectedInputs } from "./fixtures/neutral-authoring.mjs";

test("paired media compile without mandatory presentation notes", async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  delete selected.project.presentation.static.intent;
  delete selected.project.presentation.interactive.intent;
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "optional-intent-candidate");
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.deepEqual(built.media, ["interactive", "static"]);
  await fs.access(path.join(output, "static/architecture.svg"));
  await fs.access(path.join(output, "interactive/architecture.html"));
});

test("an omitted static summary remains absent in canonical scene data", async () => {
  const project = editionProject();
  delete project.narrative;
  const { meaning, layout } = await selectedInputs(project);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  const encoded = canonical(scene);
  const restored = JSON.parse(encoded);
  assert.equal(Object.hasOwn(scene, "summary"), false);
  assert.equal(sha(Buffer.from(canonical(restored))), sha(Buffer.from(encoded)));
  assert.deepEqual(scene.sourceAssertionCarriers, restored.sourceAssertionCarriers);
});

test("a neutral static scene carries declared source assertions without authored geometry", async () => {
  assert.equal(typeof scenes.composeStaticEditionScene, "function");
  const { meaning, layout } = await selectedInputs();
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.schema, "architecture.edition-static-scene/v1");
  assert.equal(scene.completeness, "unqualified-scene");
  assert.equal(scene.edition.id, "native-portrait");
  assert.equal(scene.title, "Selected architecture");
  assert.equal(scene.summary, "The selected source view.");
  assert.equal(scene.visualPolicy.profile, "neutral");
  assert.equal(scene.requestedWidth, 6000);
  assert.deepEqual(scene.questionIds, ["shape"]);
  assert.deepEqual(
    scene.nodes.map(({ id, label }) => [id, label]),
    [
      ["a", "A"],
      ["b", "B"],
    ],
  );
  assert.equal(scene.edges.length, 1);
  assert.equal(scene.edges[0].relations.length, 1);
  assert.match(scene.edges[0].relations[0].reference, /^relation:[1-9]\d*:[1-9]\d*$/u);
  assert.deepEqual(scene.sourceAssertionCarriers, [
    {
      assertionId: "overview",
      kind: "view",
      selectionId: "overview",
      nodeRefs: [
        { namespace: "example/model", id: "a" },
        { namespace: "example/model", id: "b" },
      ],
      relationRefs: [
        {
          namespace: scene.edges[0].relations[0].namespace,
          reference: scene.edges[0].relations[0].reference,
          sha256: scene.edges[0].relations[0].sha256,
        },
      ],
    },
  ]);
  assert.equal(Object.hasOwn(scene, "svg"), false);
  assert.equal(Object.isFrozen(scene.nodes), true);
});

test("a selected grouped view builds visible static groups through the shared geometry owner", async (t) => {
  const selected = await selectedNativeEdition(t, { media: ["static"], width: 1800 });
  selected.project.presentation.static.views[0].groups = [
    {
      id: "entry",
      label: "Entry boundary",
      elements: [{ namespace: "fixture/model", id: "alpha" }],
    },
    {
      id: "service",
      label: "Service boundary",
      elements: [{ namespace: "fixture/model", id: "beta" }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "grouped-candidate");
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert(svg.includes("READING GROUPS"));
  assert(svg.includes("Entry boundary"));
  assert(svg.includes("Service boundary"));
  assert(!svg.includes("fixture/model"));
});

test("a static group heading must reserve space above its member nodes", async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: "entry", label: "Entry boundary", elements: [{ namespace: "example/model", id: "a" }] },
    {
      id: "service",
      label: "Service boundary",
      elements: [{ namespace: "example/model", id: "b" }],
    },
  ];
  const { meaning } = await selectedInputs(project);
  const normal = scenes.composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  const scene = structuredClone(normal);
  const group = scene.groups[0];
  const member = scene.nodes.find(({ id }) => id === "a");
  const oldBottom = group.y + group.height;
  group.y = member.y - 30;
  group.height = oldBottom - group.y;
  const points = [
    ...scene.nodes.flatMap(({ x, y, width, height }) => [
      [x, y],
      [x + width, y + height],
    ]),
    ...scene.groups.flatMap(({ x, y, width, height }) => [
      [x, y],
      [x + width, y + height],
    ]),
    ...scene.edges.flatMap(({ points }) => points),
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  scene.bounds = {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
  assert.throws(() => composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_group_heading_collision",
  });

  const crossing = structuredClone(normal);
  const heading = crossing.groups[0];
  crossing.edges[0].points = [
    [heading.x + 4, heading.y + 31],
    [heading.x + heading.width - 4, heading.y + 31],
  ];
  assert.throws(() => composeStaticEditionSvg(crossing, { icons: figureIcons }), {
    code: "static_edition_group_heading_collision",
  });

  const relocatable = structuredClone(normal);
  const movableHeading = relocatable.groups[0];
  relocatable.edges[0].points = [
    [movableHeading.x + 40, movableHeading.y + 4],
    [movableHeading.x + 40, movableHeading.y + 50],
  ];
  const relocated = composeStaticEditionSvg(relocatable, { icons: figureIcons }).bytes.toString(
    "utf8",
  );
  const headingX = /<text x="([\d.]+)"[^>]*>Entry boundary<\/text>/u.exec(relocated)?.[1];
  assert(headingX);
  assert(Number(headingX) > movableHeading.x + 26);

  const captioned = structuredClone(normal);
  const captionedGroup = captioned.groups[0];
  const captionBox = { x: captionedGroup.x + 26, y: captionedGroup.y + 13, w: 100, h: 24 };
  captioned.edges[0].relations[0].kind = "calls";
  captioned.edges[0].relations[0].label = null;
  captioned.edges[0].caption = {
    text: "calls",
    point: [captionBox.x + 50, captionBox.y + 16],
    box: captionBox,
  };
  const withCaption = composeStaticEditionSvg(captioned, { icons: figureIcons }).bytes.toString(
    "utf8",
  );
  const movedHeadingX = /<text x="([\d.]+)"[^>]*>Entry boundary<\/text>/u.exec(withCaption)?.[1];
  assert(movedHeadingX);
  assert(Number(movedHeadingX) > captionBox.x + captionBox.w + 6);
});

test("grouped static composition retains only asserted members of a selected upstream view", async (t) => {
  const selected = await selectedNativeEdition(t, { media: ["static"], width: 1800 });
  selected.project.scope.selections.push({
    id: "alpha",
    namespace: "fixture/model",
    kind: "reference",
    reference: "element:alpha",
    questions: ["shape"],
  });
  delete selected.project.scope.selections[0].questions;
  selected.project.presentation.static.views[0].groups = [
    {
      id: "entry",
      label: "Selected entry",
      elements: [{ namespace: "fixture/model", id: "alpha" }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "narrow-grouped-candidate");
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert(svg.includes("Selected entry"));
  assert(svg.includes("Alpha"));
  assert(!svg.includes("Beta"));
});

test("one static overview coexists with an independently selected interactive chapter", async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  const views = Buffer.from("views { view overview { include * }\n view detail { include * } }\n");
  await fs.writeFile(path.join(selected.root, "sources/views.c4"), views);
  selected.request.sources.find(({ id }) => id === "views").input.sha256 = sha(views);
  selected.project.questions.push({
    id: "detail",
    audience: "maintainer",
    text: "What does the detailed chapter contain?",
  });
  selected.project.scope.selections.push({
    id: "detail",
    namespace: "fixture/views",
    kind: "reference",
    reference: "view:detail",
    questions: ["detail"],
  });
  selected.project.presentation.interactive.views.push({ id: "detail", questions: ["detail"] });
  selected.project.presentation.static.views[0].groups = [
    {
      id: "system",
      label: "Selected system",
      elements: ["alpha", "beta"].map((id) => ({ namespace: "fixture/model", id })),
    },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const requestBytes = Buffer.from(JSON.stringify(selected.request) + "\n");
  await fs.writeFile(selected.file, requestBytes);
  selected.digest = sha(requestBytes);

  const output = path.join(selected.root, "multi-view-candidate");
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert(svg.includes("Alpha"));
  assert(svg.includes("Beta"));
  await fs.access(path.join(output, "interactive/architecture.html"));

  selected.project.scope.selections[1].questions.push("shape");
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const sharedScopeOutput = path.join(selected.root, "shared-static-scope-candidate");
  const sharedScope = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    sharedScopeOutput,
  );
  assert.equal(sharedScope.status, "built");
  const sharedSvg = await fs.readFile(
    path.join(sharedScopeOutput, "static/architecture.svg"),
    "utf8",
  );
  assert(sharedSvg.includes("Alpha") && sharedSvg.includes("Beta"));

  selected.project.scope.selections[1].questions = ["detail"];
  delete selected.project.presentation.static.views[0].groups;
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const upstreamOutput = path.join(selected.root, "upstream-static-candidate");
  const upstream = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    upstreamOutput,
  );
  assert.equal(upstream.status, "built");
  const upstreamSvg = await fs.readFile(
    path.join(upstreamOutput, "static/architecture.svg"),
    "utf8",
  );
  assert(upstreamSvg.includes("Alpha"));
  assert(upstreamSvg.includes("Beta"));
});

test("grouped geometry does not place relation labels that the successor never renders", () => {
  const source = { namespace: "fixture/model", sha256: "a".repeat(64) };
  const elements = ["alpha", "beta"].map((id) => ({
    namespace: source.namespace,
    id,
    sha256: source.sha256,
    label: id,
  }));
  const selected = {
    selectionId: "overview",
    format: "likec4/dsl",
    target: { kind: "view", id: "overview" },
    source,
    members: {
      elements,
      relations: Array.from({ length: 3 }, (_, index) => ({
        id: `relation-${index}`,
        origin: source,
        from: { namespace: source.namespace, id: "alpha" },
        to: { namespace: source.namespace, id: "beta" },
        label: "a-relation-label-that-will-not-fit",
      })),
    },
  };
  const meaning = {
    native: {
      selections: [selected],
      sourceReading: {
        likec4: {
          elements,
          relations: selected.members.relations,
          views: [
            {
              namespace: source.namespace,
              id: "overview",
              nodes: elements.map(({ namespace, id, label }) => ({
                id,
                label,
                element: { namespace, id },
              })),
              edges: selected.members.relations.map(({ id, from, to, label }) => ({
                id,
                from: from.id,
                to: to.id,
                label,
                relations: [id],
              })),
            },
          ],
        },
      },
    },
    assertions: [{ id: "shape", kind: "source", selection: selected.selectionId }],
    media: { static: { views: [{ id: "overview", assertionIds: ["shape"] }] } },
    editorial: {
      presentation: {
        static: {
          views: [
            {
              id: "overview",
              groups: [
                {
                  id: "pair",
                  label: "Pair",
                  elements: ["alpha", "beta"].map((id) => ({ namespace: source.namespace, id })),
                },
              ],
            },
          ],
        },
      },
    },
  };
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.edges.length, 3);
  const alpha = layout.nodes.find(({ id }) => id === "alpha");
  const beta = layout.nodes.find(({ id }) => id === "beta");
  for (const edge of layout.edges) {
    assert.equal(edge.points[0][0], alpha.x + alpha.width);
    assert.equal(edge.points.at(-1)[0], beta.x);
  }

  const reverse = structuredClone(meaning);
  reverse.native.selections[0].members.relations = [
    {
      ...reverse.native.selections[0].members.relations[0],
      id: "relation-reverse",
      from: { namespace: source.namespace, id: "beta" },
      to: { namespace: source.namespace, id: "alpha" },
    },
  ];
  const lateral = composeStaticSelectionLayout(reverse);
  const reverseBeta = lateral.nodes.find(({ id }) => id === "beta");
  const reverseAlpha = lateral.nodes.find(({ id }) => id === "alpha");
  assert.equal(lateral.edges[0].points[0][0], reverseBeta.x);
  assert.equal(lateral.edges[0].points.at(-1)[0], reverseAlpha.x + reverseAlpha.width);

  reverse.editorial.presentation.static.views[0].groups = ["alpha", "beta"].map((id) => ({
    id,
    label: id,
    elements: [{ namespace: source.namespace, id }],
  }));
  const vertical = composeStaticSelectionLayout(reverse);
  const lower = vertical.nodes.find(({ id }) => id === "beta");
  const upper = vertical.nodes.find(({ id }) => id === "alpha");
  assert.equal(vertical.edges[0].points[0][1], lower.y);
  assert.equal(vertical.edges[0].points.at(-1)[1], upper.y + upper.height);

  const self = structuredClone(meaning);
  self.native.selections[0].members.relations = [
    {
      ...self.native.selections[0].members.relations[0],
      id: "relation-self",
      to: { namespace: source.namespace, id: "alpha" },
    },
  ];
  assert.throws(() => composeStaticSelectionLayout(self), {
    code: "grouped_selection_self_relation_unrepresentable",
  });
});

test("grouped geometry consumes selected Claim Model relations without treating claims as edges", () => {
  const bytes = Buffer.from(JSON.stringify(claimModel()) + "\n");
  const source = {
    namespace: "fixture/claims",
    sha256: sha(bytes),
    format: { id: "architecture.claim-model", version: "2" },
  };
  const imported = importClaimModel(source, bytes, "native");
  const selections = [
    { id: "request", reference: "relation:request" },
    { id: "intended", reference: "claim:intended" },
  ].map(({ id, reference }) =>
    resolveClaimModelSelection(imported, {
      id,
      namespace: source.namespace,
      kind: "reference",
      reference,
    }),
  );
  const meaning = {
    native: { selections },
    assertions: selections.map(({ selectionId }) => ({
      id: selectionId,
      kind: "source",
      selection: selectionId,
    })),
    media: { static: { views: [{ id: "overview", assertionIds: ["request", "intended"] }] } },
    editorial: {
      presentation: {
        static: {
          views: [
            {
              id: "overview",
              groups: [
                {
                  id: "entry",
                  label: "Entry",
                  elements: [{ namespace: source.namespace, id: "client" }],
                },
                {
                  id: "service",
                  label: "Service",
                  elements: [{ namespace: source.namespace, id: "server" }],
                },
              ],
            },
          ],
        },
      },
    },
  };
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.closure, "grouped-layout-unqualified");
  assert.equal(layout.nodes.length, 2);
  assert.equal(layout.edges.length, 1);
  assert.equal(layout.groups.length, 2);
  assert.equal(layout.edges[0].relations[0].reference, "request");
  assert.equal(layout.view, null);

  const claimOnly = structuredClone(meaning);
  claimOnly.media.static.views[0].assertionIds = ["intended"];
  assert.throws(() => composeStaticSelectionLayout(claimOnly), {
    code: "grouped_geometry_input_invalid",
  });
});
