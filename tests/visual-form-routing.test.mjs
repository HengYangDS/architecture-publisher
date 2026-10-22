import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { paintedContactCounts } from "./fixtures/painted-contact.mjs";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/edition.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { validateVisibleSelection } from "../packages/publisher/src/compiler/coverage.mjs";
import { composeStaticResponsibilityScene } from "../packages/publisher/src/scene/static/responsibility.mjs";
import { responsibilityMapHtml } from "../packages/publisher/renderers/interactive/responsibility-map.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import { composeStaticResponsibilitySvg } from "../packages/publisher/renderers/svg/responsibility.mjs";
import { figureIcons, browserExecutable, responsibilityFixture } from "./fixtures/visual-form.mjs";

test(
  "branching interactive responsibility labels clear painted source routes",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 35_000 },
  async (t) => {
    const editorial = (statement) => ({ kind: "editorial", statement, proponent: "editor" });
    const page = {
      navigationLabel: "Boundary",
      questions: [{ text: "Which roles govern the selected flow?", limits: [] }],
      form: {
        roles: [
          { groupId: "g-0", basis: editorial("The requester starts the flow.") },
          { groupId: "g-1", basis: editorial("The core governs configuration.") },
          { groupId: "g-2", basis: editorial("The client owns runtime traffic.") },
          { groupId: "g-3", basis: editorial("The endpoint receives traffic.") },
        ],
        handoffs: [
          { fromGroup: "g-1", toGroup: "g-2", basis: editorial("Control passes to the client.") },
        ],
      },
      groups: [
        { id: "g-0", label: "Requester", nodeIds: ["n-0"] },
        { id: "g-1", label: "Core", nodeIds: ["n-1", "n-2", "n-3", "n-4"] },
        { id: "g-2", label: "Client", nodeIds: ["n-5"] },
        { id: "g-3", label: "Endpoint", nodeIds: ["n-6"] },
      ],
      nodes: [
        "Requester",
        "Core",
        "Configuration",
        "Adapter",
        "Projection",
        "Client",
        "Endpoint",
      ].map((label, index) => ({
        id: `n-${index}`,
        label,
        figureKind: "component",
        icon: "lucide:box",
      })),
      relations: [
        ["n-0", "n-1", "invokes"],
        ["n-1", "n-2", "maintains"],
        ["n-1", "n-3", "dispatches"],
        ["n-3", "n-4", "applies"],
        ["n-4", "n-5", "configures"],
        ["n-5", "n-6", "sends-requests-to"],
      ].map(([source, target, label], index) => ({
        id: `r-${index}`,
        source,
        target,
        label,
        direction: "forward",
      })),
      claims: [],
    };
    const markup = responsibilityMapHtml(page, 0, await loadFigureIconSupply());
    const svg = markup.match(/<svg class="form-map-graph"[\s\S]*?<\/svg>/u)?.[0];
    assert.ok(svg);
    const fonts = await loadBundledFonts();
    const faces = fonts.fonts
      .filter(({ weight }) => [400, 600].includes(weight))
      .map(
        ({ weight, bytes }) =>
          `@font-face{font-family:'JetBrains Mono';font-weight:${weight};src:url(data:font/ttf;base64,${bytes.toString("base64")}) format('truetype')}`,
      )
      .join("");
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const pageView = await browser.newPage({ viewport: { width: 1480, height: 330 } });
    await pageView.setContent(
      `<html><head><style>${faces}body{margin:0;background:transparent;font-family:'JetBrains Mono'}</style></head><body>${svg}</body></html>`,
    );
    await pageView.evaluate(() => globalThis.document.fonts.ready);
    const figure = pageView.locator("svg");
    await pageView.addStyleTag({
      content: "svg rect,svg path,svg line{visibility:hidden!important}",
    });
    const text = await figure.screenshot({ omitBackground: true });
    await pageView.addStyleTag({
      content:
        "svg text,svg rect{visibility:hidden!important}svg path,svg line{visibility:visible!important}",
    });
    const marks = await figure.screenshot({ omitBackground: true });
    const analysis = await browser.newPage();
    assert.deepEqual(await paintedContactCounts(analysis, text, marks), {
      contact: 0,
      withinTwoPixels: 0,
    });
  },
);

test("static responsibility coverage rejects a substituted role basis or group carrier", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const rendered = composeStaticResponsibilitySvg(composeStaticResponsibilityScene(meaning), {
    icons: figureIcons,
  });
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, "static", rendered.scene, rendered.carriers),
  );
  const substituted = structuredClone(rendered.scene);
  substituted.visualForm.roles[0].basis = "second-basis";
  assert.throws(() => validateVisibleSelection(meaning, "static", substituted, rendered.carriers), {
    code: "edition_visible_coverage_mismatch",
  });
  const forgedMap = structuredClone(rendered.carriers);
  forgedMap.groups[0].editorialId = "second-role";
  assert.throws(() => validateVisibleSelection(meaning, "static", rendered.scene, forgedMap), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("form role order, not group record order, owns the static reading order", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t, "static");
  view.groups.reverse();
  await writeProject();
  const output = path.join(selected.root, "role-order-candidate");
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert(svg.indexOf("First responsibility") < svg.indexOf("Second"));
});

test("a static form refuses a header that would enter the role graph", async (t) => {
  const { selected, writeProject } = await responsibilityFixture(t, "static");
  selected.project.title = "Responsibility boundaries across two selected components";
  await writeProject();
  const output = path.join(selected.root, "crowded-header-candidate");
  await assert.rejects(compileEditionCandidateInput(selected.file, selected.digest, output), {
    code: "static_responsibility_header_unrepresentable",
  });
  await assert.rejects(fs.access(output), { code: "ENOENT" });
});

test("a static responsibility map refuses unsupported roles, routes, and labels", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const original = composeStaticResponsibilityScene(meaning);
  const cases = [
    [
      "wrong form",
      (scene) => (scene.visualForm.schema = "other/v1"),
      "static_responsibility_scene_invalid",
    ],
    [
      "missing basis",
      (scene) => (scene.visualForm.roles[0].basis = "absent"),
      "static_responsibility_basis_invalid",
    ],
    [
      "duplicate role",
      (scene) => (scene.visualForm.roles[1].group = "first-role"),
      "static_responsibility_group_invalid",
    ],
    [
      "duplicate member",
      (scene) => (scene.groups[1].elements = scene.groups[0].elements),
      "static_responsibility_group_invalid",
    ],
    [
      "self handoff",
      (scene) => (scene.visualForm.handoffs[0].to = "first-role"),
      "static_responsibility_handoff_invalid",
    ],
    [
      "reversed relation",
      (scene) =>
        ([scene.relations[0].from, scene.relations[0].to] = [
          scene.relations[0].to,
          scene.relations[0].from,
        ]),
      "static_responsibility_graph_unrepresentable",
    ],
    [
      "missing endpoint",
      (scene) => (scene.relations[0].to.id = "absent"),
      "static_responsibility_relation_endpoint_missing",
    ],
    [
      "long relation label",
      (scene) => (scene.relations[0].kind = "unrepresentably-long-source-relation-predicate"),
      "static_responsibility_relation_label_unrepresentable",
    ],
    [
      "long node label",
      (scene) => (scene.nodes[0].label = "unrepresentablylongsourceentitylabelwithoutspaces"),
      "static_responsibility_text_unrepresentable",
    ],
    [
      "invalid raster width",
      (scene) => (scene.requestedWidth = 200),
      "static_responsibility_width_invalid",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const scene = structuredClone(original);
    mutate(scene);
    assert.throws(
      () => composeStaticResponsibilitySvg(scene, { icons: figureIcons }),
      { code },
      name,
    );
  }
});

test("an internal source relation places its caption beside, not across, its route", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  const first = scene.nodes[0];
  const sibling = { ...structuredClone(first), id: "sibling", label: "Sibling" };
  scene.nodes.push(sibling);
  scene.groups[0].elements.push({ namespace: sibling.namespace, id: sibling.id });
  scene.relations.push({
    ...structuredClone(scene.relations[0]),
    id: "internal",
    kind: "maintains",
    from: { namespace: first.namespace, id: first.id },
    to: { namespace: sibling.namespace, id: sibling.id },
  });
  const svg = composeStaticResponsibilitySvg(scene, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(
    svg,
    /data-source-relation="r-1"[\s\S]*?<text[^>]*text-anchor="(?:start|end)"[^>]*>maintains<\/text>/u,
  );
});

test("a bidirectional static relation reverses its start arrowhead", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  scene.relations[0].direction = "bidirectional";
  const svg = composeStaticResponsibilitySvg(scene, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(svg, /marker-start="url\(#source-arrow\)"/u);
  assert.match(svg, /orient="auto-start-reverse"/u);
});

test("four responsibility domains compose a branching map and reject an internal cycle", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  const template = scene.nodes[0];
  const makeNode = (id, label) => ({ ...structuredClone(template), id, label });
  scene.nodes = [
    makeNode("operator", "Operator"),
    makeNode("controller", "Controller"),
    makeNode("config", "Configuration"),
    makeNode("adapter", "Adapter"),
    makeNode("projection", "Projection"),
    makeNode("client", "Client"),
    makeNode("external", "Endpoint"),
  ];
  const address = (id) => ({ namespace: template.namespace, id });
  scene.groups = [
    { id: "operator", label: "Operator", elements: [address("operator")] },
    {
      id: "control",
      label: "Control",
      elements: ["controller", "config", "adapter", "projection"].map(address),
    },
    { id: "client", label: "Client", elements: [address("client")] },
    { id: "external", label: "External", elements: [address("external")] },
  ];
  scene.visualForm.roles = scene.groups.map(({ id }, index) => ({
    group: id,
    basis: index % 2 ? "second-basis" : "first-basis",
  }));
  scene.visualForm.handoffs = [{ from: "control", to: "client", basis: "handoff-basis" }];
  const makeRelation = (id, from, to) => ({
    ...structuredClone(scene.relations[0]),
    id,
    kind: id,
    from: address(from),
    to: address(to),
  });
  scene.relations = [
    makeRelation("invokes", "operator", "controller"),
    makeRelation("maintains", "controller", "config"),
    makeRelation("dispatches", "controller", "adapter"),
    makeRelation("applies", "adapter", "projection"),
    makeRelation("configures", "projection", "client"),
    makeRelation("requests", "client", "external"),
  ];
  const rendered = composeStaticResponsibilitySvg(scene, { icons: figureIcons });
  assert.equal(rendered.carriers.nodes.length, 7);
  assert.equal(rendered.carriers.relations.length, 6);
  assert.match(rendered.bytes.toString("utf8"), /data-source-relation="r-5"/u);
  assert(rendered.scene.layout.height < 1500);
  const cycle = structuredClone(scene);
  cycle.relations.push(makeRelation("cycle", "projection", "controller"));
  assert.throws(() => composeStaticResponsibilitySvg(cycle, { icons: figureIcons }), {
    code: "static_responsibility_graph_unrepresentable",
  });
});
