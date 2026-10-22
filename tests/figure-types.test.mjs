import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/edition.mjs";
import { validateEditionProject } from "../packages/publisher/src/edition/authoring.mjs";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import {
  deriveFigureTypeCatalog,
  neutralFigurePolicy,
  resolveFigureTypes,
} from "../packages/publisher/src/scene/figure-types.mjs";
import { composeFigureTypeLegend } from "../packages/publisher/renderers/svg/figure-types.mjs";
import { architecturePublisherInteractiveScenes } from "../editions/self/src/edition/interactive-scenes.mjs";
import { composeArchitecturePublisherInteractiveScene } from "../editions/self/src/edition/interactive-scene.mjs";
import { SELF_FIGURE_TYPES } from "../editions/self/src/edition/figure-types.mjs";
import { entityDefinitions } from "../editions/self/src/edition/entities.mjs";
import { prepareSourceReader } from "../packages/publisher/renderers/interactive/source-reader.mjs";
import { sourceReadingFixture } from "./fixtures/source-reading.mjs";
import { meaningFor, sceneFor } from "./fixtures/authored-routes.mjs";
import { selectedNativeEdition, sha } from "./fixtures/selected-native-edition.mjs";
import {
  loadFigureIconSupply,
  renderFigureIcon,
  validateFigureIconCatalog,
  validateResolvedFigureIcons,
} from "../packages/publisher/renderers/icons/index.mjs";
import { selfDocument, ordinaryMeaning } from "./fixtures/figure-types.mjs";

test("self-use source kinds share one checked catalog with presentation roles", async () => {
  const nodes = Object.entries(entityDefinitions).map(([id, entity]) => ({
    id,
    kind: entity.type,
  }));
  const pages = [{ nodes }];
  const before = structuredClone(pages);
  const resolved = resolveFigureTypes(pages, SELF_FIGURE_TYPES);
  const supply = await loadFigureIconSupply();
  assert.doesNotThrow(() => validateFigureIconCatalog(SELF_FIGURE_TYPES, supply));
  assert.doesNotThrow(() => validateResolvedFigureIcons(resolved, supply));
  assert.deepEqual(pages, before);
  for (const [index, node] of resolved[0].nodes.entries())
    assert.equal(node.figureKind, nodes[index].kind);
});

test("source reading uses the same readable type labels as the selected Edition", async (t) => {
  const { meaning } = await sourceReadingFixture(t);
  const pages = composeAuthoredInteractiveArchitecture(meaning).pages;
  const catalog = { component: { icon: "lucide:box", label: "Source component" } };
  const reading = await prepareSourceReader(meaning.native.sourceReading, pages, catalog);
  assert.equal(reading.pages.length, 2);
  for (const page of reading.pages) {
    const html = page.content.toString("utf8");
    assert.match(html, /Source component/u);
    assert.match(html, /data-legend-kind="component"/u);
    assert.doesNotMatch(html, /\[object Object\]/u);
  }
  assert(reading.projection.elements.every(({ kind }) => kind === "component"));
});

test("source-only kinds cannot bypass complete publication type preflight", async (t) => {
  const { root } = await sourceReadingFixture(t);
  const projectFile = path.join(root, "edition/project.json");
  const project = JSON.parse(await fs.readFile(projectFile, "utf8"));
  project.visualPolicy.figureTypes = { "presentation role": "lucide:square" };
  await fs.writeFile(projectFile, JSON.stringify(project) + "\n");
  const refinementFile = path.join(root, "edition/refinement.json");
  const refinement = JSON.parse(await fs.readFile(refinementFile, "utf8"));
  for (const page of refinement.media.interactive.pages)
    for (const node of page.scene.nodes) node.figureKind = "presentation role";
  await fs.writeFile(refinementFile, JSON.stringify(refinement) + "\n");
  const requestFile = path.join(root, "build-request.json");
  const digest = sha(await fs.readFile(requestFile));
  const output = path.join(root, "candidate");
  await assert.rejects(compileEditionCandidateInput(requestFile, digest, output), {
    code: "figure_type_missing",
  });
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
  assert(!(await fs.readdir(root)).some((name) => name.startsWith(".edition-candidate-")));
});

test("Edition owns a precise figure-kind catalog without a fixed domain taxonomy", async (t) => {
  const { project } = await selectedNativeEdition(t);
  project.visualPolicy.figureTypes = { "source-owned domain": "lucide:network" };
  assert.doesNotThrow(() => validateEditionProject(project));
  for (const mapping of [
    { " source": "lucide:network" },
    { source: "none" },
    { source: "https://example.com/icon.svg" },
  ]) {
    project.visualPolicy.figureTypes = mapping;
    assert.throws(() => validateEditionProject(project), { code: "edition_project_invalid" });
  }
});

test("reader-facing type labels retain source identities and one global catalog", async (t) => {
  const { project } = await selectedNativeEdition(t);
  const catalog = {
    aggregate: { icon: "lucide:layers", label: "Grouped source objects" },
    repository_state: { icon: "lucide:git-branch", label: "Repository state" },
  };
  project.visualPolicy.figureTypes = catalog;
  assert.doesNotThrow(() => validateEditionProject(project));
  const pages = [
    {
      nodes: [
        { id: "combined", kind: "aggregate", semanticIds: ["first", "second"] },
        { id: "state", kind: "repository_state" },
      ],
    },
  ];
  const before = structuredClone(pages);
  const resolved = resolveFigureTypes(pages, catalog);
  assert.deepEqual(pages, before);
  assert.equal(resolved[0].nodes[0].kind, "aggregate");
  assert.equal(resolved[0].nodes[0].figureKind, "aggregate");
  assert.equal(resolved[0].nodes[0].figureLabel, "Grouped source objects");
  assert.equal(resolved[0].nodes[0].icon, "lucide:layers");
  assert.deepEqual(resolved[0].nodes[0].semanticIds, ["first", "second"]);
  assert.equal(resolved[0].nodes[1].figureLabel, "Repository state");
  assert.throws(
    () =>
      resolveFigureTypes(pages, {
        ...catalog,
        repository_state: { icon: "lucide:git-branch", label: "Grouped source objects" },
      }),
    { code: "figure_type_label_conflict" },
  );
  const icons = await loadFigureIconSupply();
  assert.doesNotThrow(() => validateFigureIconCatalog(catalog, icons));
  assert.doesNotThrow(() => validateResolvedFigureIcons(resolved, icons));
  const key = composeFigureTypeLegend(resolved[0].nodes, icons, 500);
  assert.match(key.markup, /Grouped source objects/);
  assert.match(key.markup, /Repository state/);
  assert.match(key.markup, /data-legend-kind="aggregate"/);
  for (const invalid of [
    { icon: "lucide:layers" },
    { icon: "lucide:layers", label: " " },
    { icon: "lucide:layers", label: "Grouped source objects", type: "subsystem" },
  ]) {
    project.visualPolicy.figureTypes = { aggregate: invalid };
    assert.throws(() => validateEditionProject(project), { code: "edition_project_invalid" });
    assert.throws(() => resolveFigureTypes(pages, { aggregate: invalid }), {
      code: "figure_type_invalid",
    });
  }
});

test("all selected authored pages require covered distinct resolved glyphs", () => {
  const meaning = ordinaryMeaning();
  const page = structuredClone(meaning.refinement.media.interactive.pages[0]);
  page.id = page.scene.id = "mechanism";
  page.purpose = "mechanism";
  page.scene.nodes[0].figureKind = "later-page role";
  meaning.refinement.media.interactive.pages.push(page);
  meaning.media.interactive.views.push({
    ...structuredClone(meaning.media.interactive.views[0]),
    id: page.id,
  });
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: "figure_type_missing",
  });
  meaning.editorial.visualPolicy.figureTypes["later-page role"] = "lucide:box";
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: "figure_type_glyph_conflict",
  });
  meaning.editorial.visualPolicy.figureTypes["later-page role"] = "lucide:network";
  const composed = composeAuthoredInteractiveArchitecture(meaning);
  assert.equal(composed.pages[0].scene.nodes[0].icon, "lucide:box");
  assert.equal(composed.pages[1].scene.nodes[0].icon, "lucide:network");
  assert.equal(composed.pages[1].scene.nodes[2].icon, "lucide:box");
  assert.equal(sceneFor(meaning, "interactive").nodes[0].icon, undefined);
});

test("suppression, missing catalogs and occurrence overrides cannot bypass type ownership", () => {
  const meaning = ordinaryMeaning();
  delete meaning.editorial.visualPolicy.figureTypes;
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: "figure_types_required",
  });
  meaning.editorial.visualPolicy.figureTypes = { component: "lucide:box" };
  sceneFor(meaning, "interactive").nodes[0].icon = "lucide:network";
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: "figure_type_occurrence_override",
  });
});

test("primitive-only source artwork remains unchanged without an automatic catalog", () => {
  const meaning = meaningFor("interactive");
  const before = structuredClone(sceneFor(meaning, "interactive").nodes);
  const composed = composeAuthoredInteractiveArchitecture(meaning);
  assert.deepEqual(
    composed.pages[0].scene.nodes.map(({ primitives }) => primitives),
    before.map(({ primitives }) => primitives),
  );
  assert(composed.pages[0].scene.nodes.every((node) => node.icon === undefined));
});

test("self-use retains one glyph per kind and distinct artwork across every page", () => {
  const document = selfDocument();
  const views = architecturePublisherInteractiveScenes();
  const byKind = new Map();
  const byGlyph = new Map();
  for (const [id, view] of Object.entries(views)) {
    const input = composeArchitecturePublisherInteractiveScene(
      document,
      { title: "Architecture Publisher" },
      { id, label: view.label, ...view.composition },
    );
    const [scene] = resolveFigureTypes([input], SELF_FIGURE_TYPES);
    for (const node of scene.nodes) {
      assert.equal(SELF_FIGURE_TYPES[node.figureKind], node.icon);
      assert(
        !byKind.has(node.figureKind) || byKind.get(node.figureKind) === node.icon,
        `${id}:${node.id}: one kind changed glyph`,
      );
      assert(
        !byGlyph.has(node.icon) || byGlyph.get(node.icon) === node.figureKind,
        `${id}:${node.id}: different kinds share glyph`,
      );
      byKind.set(node.figureKind, node.icon);
      byGlyph.set(node.icon, node.figureKind);
    }
  }
  assert.equal(byKind.size, 26);
});

test("neutral composition preserves the same catalog rather than dropping visual policy", () => {
  const meaning = ordinaryMeaning();
  meaning.completeness = "finite-unqualified-obligations";
  meaning.questions = [];
  meaning.editorial.narrative = { summary: "Selected components." };
  meaning.media.interactive.views[0].questionIds = [];
  meaning.refinement.media.interactive = { kind: "neutral" };
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(scene.visualPolicy.figureTypes, { component: "lucide:box" });
  assert(scene.pages[0].nodes.every(({ icon }) => icon === "lucide:box"));
});

test("resolved artwork catches aliases, unsupported names and cross-page drift", async () => {
  const supply = await loadFigureIconSupply();
  assert.doesNotThrow(() => validateFigureIconCatalog(SELF_FIGURE_TYPES, supply));
  assert.throws(
    () =>
      validateFigureIconCatalog(
        { one: "lucide:alarm-check", two: "lucide:alarm-clock-check" },
        supply,
      ),
    { code: "figure_type_glyph_conflict" },
  );
  assert.throws(() => validateFigureIconCatalog({ unused: "lucide:missing" }, supply), {
    code: "figure_type_glyph_unsupported",
  });
  assert.throws(
    () =>
      validateResolvedFigureIcons(
        [
          { nodes: [{ kind: "component", icon: "lucide:box" }] },
          { nodes: [{ kind: "component", icon: "lucide:network" }] },
        ],
        supply,
      ),
    { code: "figure_type_glyph_conflict" },
  );
});

test("intrinsic type encoding preserves arbitrary kinds and assigns distinct checked glyphs", async () => {
  const pages = [
    {
      nodes: [
        { id: "a", kind: "z domain" },
        { id: "b", kind: "a domain" },
      ],
    },
    {
      nodes: [
        { id: "a-repeat", kind: "z domain" },
        { id: "primitive", primitives: [] },
      ],
    },
  ];
  const before = structuredClone(pages);
  const supply = await loadFigureIconSupply();
  const catalog = deriveFigureTypeCatalog(pages, undefined, supply);
  assert.deepEqual(catalog, { "a domain": "lucide:circle", "z domain": "lucide:square" });
  assert.deepEqual(deriveFigureTypeCatalog([...pages].reverse(), undefined, supply), catalog);
  const selected = resolveFigureTypes(pages, catalog);
  assert.equal(selected[0].nodes[0].icon, selected[1].nodes[0].icon);
  assert.notEqual(selected[0].nodes[0].icon, selected[0].nodes[1].icon);
  validateFigureIconCatalog(catalog, supply);
  assert.deepEqual(pages, before);
});

test("type defaults retain explicit catalogs and refuse ambiguous labels", () => {
  const pages = [{ nodes: [{ kind: "component" }] }];
  const authored = { component: { icon: "lucide:box", label: "Component" } };
  assert.deepEqual(deriveFigureTypeCatalog(pages, authored), authored);
  assert.deepEqual(deriveFigureTypeCatalog([{ nodes: [{ primitives: [] }] }]), undefined);
  assert.throws(
    () => deriveFigureTypeCatalog([{ nodes: [{ kind: "Component" }, { kind: "component" }] }]),
    {
      code: "figure_type_label_conflict",
    },
  );
});

test("automatic type encoding refuses invalid labels and insufficient distinct artwork", async () => {
  const pages = [{ nodes: [{ kind: "component" }] }];
  const before = structuredClone(pages);
  assert.throws(() => deriveFigureTypeCatalog(pages), { code: "figure_icon_supply_required" });
  assert.throws(() => deriveFigureTypeCatalog([{ nodes: [{ kind: " component" }] }]), {
    code: "figure_type_invalid",
  });
  assert.throws(() => deriveFigureTypeCatalog(pages, undefined, { icons: {} }), {
    code: "figure_type_encoding_capacity_exceeded",
  });
  const original = await loadFigureIconSupply();
  const circle = original.icons["lucide:circle"];
  const supply = {
    ...original,
    icons: { "lucide:circle": circle, "lucide:square": circle },
  };
  assert.throws(
    () =>
      deriveFigureTypeCatalog(
        [{ nodes: [{ kind: "first" }, { kind: "second" }] }],
        undefined,
        supply,
      ),
    { code: "figure_type_encoding_capacity_exceeded" },
  );
  const catalog = deriveFigureTypeCatalog(pages, undefined, supply);
  assert.deepEqual(catalog, { component: "lucide:circle" });
  assert.doesNotThrow(() => validateFigureIconCatalog(catalog, supply));
  assert.deepEqual(pages, before);
});

test("implicit type roles cannot collapse a missing source kind into a declared kind", async () => {
  const supply = await loadFigureIconSupply();
  const untyped = { id: "untyped", kind: null };
  const declared = { id: "declared", kind: "source element" };
  const pages = [{ nodes: [untyped] }, { nodes: [declared] }];
  const before = structuredClone(pages);
  for (const nodes of [[untyped], [declared]]) {
    const catalog = deriveFigureTypeCatalog([{ nodes }], undefined, supply);
    assert.deepEqual(catalog, { "source element": "lucide:circle" });
    assert.equal(resolveFigureTypes([{ nodes }], catalog)[0].nodes[0].kind, nodes[0].kind);
  }
  for (const ordered of [pages, [...pages].reverse()])
    assert.throws(() => deriveFigureTypeCatalog(ordered, undefined, supply), {
      code: "figure_type_label_conflict",
    });
  const shared = pages.map((page) => ({
    nodes: page.nodes.map((node) => ({ ...node, figureKind: "Reader role" })),
  }));
  const catalog = deriveFigureTypeCatalog(shared, undefined, supply);
  assert.deepEqual(catalog, { "Reader role": "lucide:circle" });
  const resolved = resolveFigureTypes(shared, catalog);
  assert.deepEqual(
    resolved.map(({ nodes }) => nodes[0].kind),
    [null, "source element"],
  );
  assert.equal(resolved[0].nodes[0].icon, resolved[1].nodes[0].icon);
  assert.deepEqual(pages, before);
});

test("intrinsic type encoding uses distinct checked artwork across the declared catalog capacity", async () => {
  const supply = await loadFigureIconSupply();
  const pages = [{ nodes: Array.from({ length: 512 }, (_, id) => ({ kind: `type-${id}` })) }];
  const before = structuredClone(pages);
  const catalog = deriveFigureTypeCatalog(pages, undefined, supply);
  assert.equal(Object.keys(catalog).length, 512);
  validateFigureIconCatalog(catalog, supply);
  assert.deepEqual(
    deriveFigureTypeCatalog([{ nodes: [...pages[0].nodes].reverse() }], undefined, supply),
    catalog,
  );
  assert.deepEqual(pages, before);
  assert.throws(
    () =>
      deriveFigureTypeCatalog(
        [{ nodes: [...pages[0].nodes, { kind: "one-more" }] }],
        undefined,
        supply,
      ),
    { code: "figure_type_encoding_capacity_exceeded" },
  );
});

test("a static-only public build derives its type encoding without changing source input", async (t) => {
  const selected = await selectedNativeEdition(t, { media: ["static"] });
  delete selected.project.visualPolicy.figureTypes;
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project),
  );
  const output = path.join(selected.root, "candidate");
  const sourceBytes = await fs.readFile(path.join(selected.root, "sources/model.c4"));
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, "built");
  assert.deepEqual(await fs.readFile(path.join(selected.root, "sources/model.c4")), sourceBytes);
  assert.match(
    await fs.readFile(path.join(output, "static/architecture.svg"), "utf8"),
    /lucide:circle/u,
  );
  assert.equal(
    (await fs.readFile(path.join(output, "static/architecture.png"))).readUInt32BE(16),
    6000,
  );
  assert(!(await fs.readdir(selected.root)).some((name) => name.startsWith(".edition-candidate-")));
});

test("static-exclusive and later static-view kinds cannot hide behind interactive coverage", async (t) => {
  for (const laterView of [false, true])
    await t.test(laterView ? "later view" : "static-exclusive view", async (t) => {
      const selected = await selectedNativeEdition(t);
      const model = Buffer.from(
        "specification { element component\n element worker }\nmodel { alpha = component 'Alpha'\n beta = component 'Beta'\n gamma = worker 'Gamma'\n alpha -> beta }\n",
      );
      const views = Buffer.from(
        "views { view overview { include alpha, beta }\n view later { include gamma } }\n",
      );
      for (const [id, content] of [
        ["model", model],
        ["views", views],
      ]) {
        const source = selected.request.sources.find((item) => item.id === id);
        source.input.sha256 = sha(content);
        await fs.writeFile(path.join(selected.root, source.input.path), content);
      }
      selected.project.questions.push({
        id: "worker-shape",
        audience: "maintainer",
        text: "Where is the worker?",
      });
      selected.project.scope.selections.push({
        id: "later",
        namespace: "fixture/views",
        kind: "reference",
        reference: "view:later",
        questions: ["worker-shape"],
      });
      selected.project.presentation.static.views = [
        ...(laterView ? [{ id: "overview", questions: ["shape"] }] : []),
        { id: "later", questions: ["worker-shape"] },
      ];
      await fs.writeFile(
        path.join(selected.root, "edition/project.json"),
        JSON.stringify(selected.project),
      );
      const bytes = Buffer.from(JSON.stringify(selected.request));
      await fs.writeFile(selected.file, bytes);
      const output = path.join(selected.root, "candidate");
      await assert.rejects(compileEditionCandidateInput(selected.file, sha(bytes), output), {
        code: "figure_type_missing",
      });
      await assert.rejects(fs.stat(output), { code: "ENOENT" });
    });
});

test("effective type resolution preserves null source kinds and validates the finite catalog", () => {
  const pages = [{ nodes: [{ id: "untyped", kind: null }] }];
  const catalog = { "source element": "lucide:circle" };
  const selected = resolveFigureTypes(pages, catalog);
  assert.equal(selected[0].nodes[0].kind, null);
  assert.equal(selected[0].nodes[0].figureKind, "source element");
  assert.equal(selected[0].nodes[0].icon, "lucide:circle");
  assert.deepEqual(pages, [{ nodes: [{ id: "untyped", kind: null }] }]);
  assert.deepEqual(neutralFigurePolicy(), { profile: "neutral" });
  assert.deepEqual(neutralFigurePolicy({ figureTypes: catalog }), {
    profile: "neutral",
    figureTypes: catalog,
  });
  assert.throws(() => resolveFigureTypes(pages, { " source element": "lucide:circle" }), {
    code: "figure_type_invalid",
  });
  assert.throws(() => resolveFigureTypes(pages, { "source element": 1 }), {
    code: "figure_type_invalid",
  });
});

test("resolved kinds cannot be missing or share artwork across later pages", async () => {
  const icons = await loadFigureIconSupply();
  for (const kind of [null, ""]) {
    assert.throws(
      () => validateResolvedFigureIcons([{ nodes: [{ kind, icon: "lucide:box" }] }], icons),
      { code: "figure_type_missing" },
    );
  }
  assert.throws(
    () =>
      validateResolvedFigureIcons(
        [
          { nodes: [{ figureKind: "component", icon: "lucide:box" }] },
          { nodes: [{ figureKind: "store", icon: "lucide:box" }] },
        ],
        icons,
      ),
    { code: "figure_type_glyph_conflict" },
  );
  assert.throws(() => renderFigureIcon("lucide:missing", icons), {
    code: "figure_type_glyph_unsupported",
  });
});
