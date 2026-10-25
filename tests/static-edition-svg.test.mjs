import assert from "node:assert/strict";
import test from "node:test";
import * as svg from "../packages/publisher/renderers/svg/index.mjs";
import { wrapStaticText } from "../packages/publisher/renderers/svg/text.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { figureIcons } from "./fixtures/static-edition-svg.mjs";
import { rasterDimensions } from "../packages/publisher/renderers/resvg/public.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { measureStaticPeerCapacity } from "../packages/publisher/renderers/svg/edition-structure.mjs";

test("native ink capacity preserves long labels, long types and absent types in equal peers", async () => {
  const scene = staticEditionScene();
  scene.nodes[0].label = "Background worker retains the complete selected architecture statement";
  scene.nodes[0].kind = "Externally attributed processing component with a complete type label";
  scene.nodes[1].kind = null;
  const before = structuredClone(scene.nodes);
  const measured = await measureStaticPeerCapacity(
    scene.nodes,
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  assert.deepEqual(scene.nodes, before);
  for (const [index, node] of scene.nodes.entries())
    Object.assign(node, measured.nodeSize, { x: index * (measured.nodeSize.width + 100) });
  scene.edges[0].points = [
    [scene.nodes[0].width, scene.nodes[0].height / 2],
    [scene.nodes[1].x, scene.nodes[1].height / 2],
  ];
  scene.bounds = {
    x: 0,
    y: 0,
    width: scene.nodes[1].x + scene.nodes[1].width,
    height: measured.nodeSize.height,
  };
  const options = { icons: figureIcons, textMeasurer: measured.textMeasurer };
  const rendered = svg.composeStaticEditionSvg(scene, options);
  const markup = rendered.bytes.toString("utf8");
  assert(markup.includes(`>${scene.nodes[0].label}</text>`));
  assert(markup.includes(`>${scene.nodes[0].kind}</text>`));
  assert(markup.includes(`>${scene.nodes[1].label}</text>`));
  assert.deepEqual(
    rendered.carriers.nodes.map(({ source }) => source.id),
    ["a", "b"],
  );
  for (const dimension of ["width", "height"]) {
    const tooSmall = structuredClone(scene);
    if (dimension === "width") {
      tooSmall.nodes[0].width = 96;
      tooSmall.edges[0].points[0][0] = 96;
    } else {
      for (const node of tooSmall.nodes) node.height = 64;
      for (const point of tooSmall.edges[0].points) point[1] = 32;
      tooSmall.bounds.height = 64;
    }
    assert.throws(() => svg.composeStaticEditionSvg(tooSmall, options), {
      code: "static_edition_node_unrepresentable",
    });
  }
});

test("a neutral static SVG shows the selected structure and authored limits", () => {
  assert.equal(typeof svg.composeStaticEditionSvg, "function");
  const rendered = svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const content = rendered.bytes.toString("utf8");

  assert.equal(rendered.rasterWidth, 6000);
  assert(rendered.width >= 420);
  assert(rendered.height > 80);
  assert.match(content, /<svg[^>]+role="img"/u);
  assert.match(content, /Selected architecture/u);
  assert.match(content, /Alpha &amp; one/u);
  assert.match(content, /Beta/u);
  assert.match(content, /calls/u);
  assert.match(content, /What is connected\?/u);
  assert.match(content, /Runtime was not observed\./u);
  assert.doesNotMatch(content, /domain-metadata-opaque/u);
  assert.match(content, /data-graphic-id="n-0"/u);
  assert.match(content, /data-graphic-id="r-0"/u);
  assert.doesNotMatch(content, /backend|archify|privateNote/u);
});

test("a standalone static SVG keeps reader limits but not compiler method codes", () => {
  const content = svg
    .composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons })
    .bytes.toString("utf8");

  assert.match(content, /Runtime was not observed\./u);
  assert.doesNotMatch(content, /METHOD LIMITS|domain-metadata-opaque/u);
});

test("group membership remains visible without painting a frame through a relation", () => {
  const scene = staticEditionScene();
  scene.groups = [
    { id: "source", label: "Source", x: -40, y: -60, width: 240, height: 160 },
    { id: "target", label: "Target", x: 220, y: -60, width: 240, height: 160 },
  ];
  scene.bounds = { x: -40, y: -60, width: 500, height: 160 };
  const rendered = svg
    .composeStaticEditionSvg(scene, { icons: figureIcons })
    .bytes.toString("utf8");
  const groups = [...rendered.matchAll(/<rect x="(?:-40|220)" y="-60"[^>]*>/gu)].map(
    ([markup]) => markup,
  );

  assert.equal(groups.length, 2);
  assert(groups.every((markup) => markup.includes("fill=")));
  assert(groups.every((markup) => !markup.includes("stroke=")));
  assert.match(rendered, />Source<\/text>/u);
  assert.match(rendered, />Target<\/text>/u);
});

test("static publication bytes expose graphic carriers, not private source identities", () => {
  const result = svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const content = result.bytes.toString("utf8");
  assert.match(content, /data-graphic-id="n-0"/u);
  assert.match(content, /data-graphic-id="r-0"/u);
  assert.doesNotMatch(content, /example\/model|example\/views|relation:4:2|data-node-id/u);
  assert.deepEqual(result.carriers.nodes[0], {
    graphicId: "n-0",
    source: { namespace: "example/model", id: "a", sha256: "a".repeat(64) },
  });
  assert.deepEqual(result.carriers.relations[0], {
    graphicId: "r-0",
    source: { namespace: "example/model", reference: "relation:4:2", sha256: "a".repeat(64) },
  });
});

test("small source structure and reading notes occupy distinct landscape regions", () => {
  const rendered = svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const content = rendered.bytes.toString("utf8");
  const reading = /<text x="([\d.]+)"[^>]*>READER QUESTIONS<\/text>/u.exec(content);
  assert(reading);
  assert(Number(reading[1]) > rendered.width / 2);
  assert(rendered.height / rendered.width < 0.65);
});

test("standalone framing follows complete source bounds instead of an empty graph-width floor", () => {
  const scene = staticEditionScene();
  const first = svg.composeStaticEditionSvg(scene, { icons: figureIcons });
  scene.nodes[1].x -= 40;
  scene.edges[0].points[1][0] -= 40;
  scene.bounds.width -= 40;
  const second = svg.composeStaticEditionSvg(scene, { icons: figureIcons });

  assert.equal(first.width - second.width, 40);
  const graphTranslation = /<g transform="translate\(([\d.]+) ([\d.]+)\)">\s*<path/u.exec(
    second.bytes.toString("utf8"),
  );
  assert(graphTranslation);
  assert(Number(graphTranslation[1]) <= 80);
  assert.deepEqual(first.carriers, second.carriers);
});

test("a short native reading uses less sidecar space without changing source geometry", () => {
  const scene = staticEditionScene();
  scene.nodes[0].label = "Alpha";
  scene.nodes[0].width = 108;
  scene.nodes[0].height = 84;
  Object.assign(scene.nodes[1], { x: 0, y: 148, width: 108, height: 84 });
  scene.edges[0].points = [
    [54, 84],
    [54, 148],
  ];
  scene.edges[0].relations[0].label = null;
  scene.bounds = { x: 0, y: 0, width: 108, height: 232 };
  scene.summary = "One selected structural view.";
  scene.limitsByQuestion.shape = [];
  scene.requestedWidth = 1800;
  const before = structuredClone(scene);
  const short = svg.composeStaticEditionSvg(scene, { icons: figureIcons });
  scene.questions[0].text =
    "Which source-selected components are connected, which direction does the relationship follow, and what source evidence supports that selected interpretation?";
  const long = svg.composeStaticEditionSvg(scene, { icons: figureIcons });

  assert(short.width * short.height < long.width * long.height);
  assert(short.width < 600, "secondary framing cannot double the short reading column");
  assert.equal(short.bytes.toString("utf8").includes("What is connected?"), true);
  assert.equal(short.bytes.toString("utf8").includes("Alpha → Beta"), true);
  assert.deepEqual(short.carriers, long.carriers);
  assert.deepEqual(scene.nodes, before.nodes);
  assert.deepEqual(scene.edges, before.edges);
});

test("wrapped source relations have readable line and item separation", () => {
  const scene = staticEditionScene();
  const first = scene.edges[0].relations[0];
  first.label = "Selected recipient state under a client binding that remains source-reported";
  const second = {
    ...first,
    reference: "relation:5:2",
    label: "Another independently attributed relation with its own selected qualifier",
  };
  scene.edges[0].relations.push(second);
  scene.sourceAssertionCarriers[0].relationRefs.push({
    namespace: second.namespace,
    reference: second.reference,
    sha256: second.sha256,
  });
  const markup = svg.composeStaticEditionSvg(scene, { icons: figureIcons }).bytes.toString("utf8");
  const baselines = (id) =>
    [
      ...markup.matchAll(
        new RegExp(`<text data-graphic-id="${id}" x="[\\d.]+" y="([\\d.]+)"`, "gu"),
      ),
    ].map(([, y]) => Number(y));
  const firstLines = baselines("r-0");
  const secondLines = baselines("r-1");

  assert(firstLines.length > 1);
  assert(secondLines.length > 1);
  for (const lines of [firstLines, secondLines])
    for (let index = 1; index < lines.length; index += 1)
      assert(lines[index] - lines[index - 1] >= 26);
  assert(secondLines[0] - firstLines.at(-1) >= 35);
});

test("long standalone reading reflows complete limit items into aligned columns", () => {
  const scene = staticEditionScene();
  scene.limitsByQuestion.shape = Array.from({ length: 15 }, (_, index) => ({
    kind: "scope",
    reason: `reader-${index}`,
  }));
  const before = structuredClone(scene);
  const rendered = svg.composeStaticEditionSvg(scene, { icons: figureIcons });
  const markup = rendered.bytes.toString("utf8");
  const items = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>reader-(\d+)<\/text>/gu)];

  assert.equal(items.length, 15);
  assert.deepEqual(
    items.map(([, , , index]) => Number(index)),
    Array.from({ length: 15 }, (_, i) => i),
  );
  assert(new Set(items.map(([, x]) => x)).size > 1);
  assert.equal(items[0][2], items[1][2], "adjacent items share an aligned row");
  assert.doesNotThrow(() =>
    rasterDimensions(rendered.width, rendered.height, rendered.rasterWidth),
  );
  assert.deepEqual(scene, before);
});

test("fractional native geometry is not rejected by serialization rounding", () => {
  const input = staticEditionScene();
  input.nodes[1].x = 260.125;
  input.edges[0].points[1][0] = 260.125;
  input.bounds.width = 420.125;
  const output = svg.composeStaticEditionSvg(input, { icons: figureIcons });
  assert.match(output.bytes.toString("utf8"), /260\.13/u);
});

test("a bidirectional source relation retains both directions and its kind", () => {
  const input = staticEditionScene();
  input.edges[0].relations[0].direction = "bidirectional";
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = "peer";
  const output = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(output, /marker-start="url\(#source-arrow\)"/u);
  assert.match(output, /Alpha &amp; one ↔ Beta · peer/u);
});

test("malformed editorial and relation collections fail with a named diagnostic", () => {
  const cases = [
    ["missing limit map", (input) => (input.limitsByQuestion = null)],
    ["missing relation members", (input) => (input.edges[0].relations = null)],
  ];
  for (const [name, mutate] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(
      () => svg.composeStaticEditionSvg(input, { icons: figureIcons }),
      { code: "static_edition_scene_invalid" },
      name,
    );
  }
});

test("static source scope rejects incomplete question membership and unpaintable text", () => {
  const input = staticEditionScene();
  input.questionIds.push("missing-question");
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_question_invalid",
  });
  input.questionIds.pop();
  input.limitsByQuestion.unselected = [];
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_question_invalid",
  });
  delete input.limitsByQuestion.unselected;
  input.claimCards = [null];
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_claim_invalid",
  });
  delete input.claimCards;
  input.edges[0].caption = [];
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_relation_caption_invalid",
  });
  assert.throws(() => wrapStaticText("W", 0, 11), {
    code: "static_edition_text_unrepresentable",
  });
});

test("a nontext source relation label fails rather than becoming a caption", () => {
  const input = staticEditionScene();
  input.edges[0].relations[0].label = 42;
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_relation_label_invalid",
  });
});

test("a static fragment is bounded by emitted content, not its unpainted page notes", () => {
  const input = staticEditionScene();
  input.limitsByQuestion.shape = Array.from({ length: 2400 }, () => ({
    kind: "scope",
    reason: "Runtime was not observed.",
  }));
  const fragment = svg.composeStaticEditionSvg(input, { icons: figureIcons, fragment: true });
  assert.match(fragment.parts.graph, /Alpha &amp; one/u);
  assert.deepEqual(
    fragment.carriers.nodes.map(({ source }) => source.id),
    ["a", "b"],
  );
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_geometry_invalid",
  });
});

test("a reading-group key names exact members without placing a false enclosure on the graph", () => {
  const input = staticEditionScene();
  input.groupPresentation = "key";
  input.groups = [
    {
      id: "entry",
      label: "Entry boundary",
      elements: [{ namespace: "example/model", id: "a" }],
      x: 0,
      y: 0,
      width: 160,
      height: 80,
    },
    {
      id: "service",
      label: "Service boundary",
      elements: [{ namespace: "example/model", id: "b" }],
      x: 260,
      y: 0,
      width: 160,
      height: 80,
    },
  ];
  const fragment = svg.composeStaticEditionSvg(input, { icons: figureIcons, fragment: true });

  assert(!fragment.parts.graph.includes("Entry boundary"));
  assert.deepEqual(fragment.parts.groups, [
    { id: "entry", label: "Entry boundary", members: ["Alpha & one"] },
    { id: "service", label: "Service boundary", members: ["Beta"] },
  ]);
  assert(
    svg
      .composeStaticEditionSvg(input, { icons: figureIcons })
      .bytes.toString("utf8")
      .includes("READING GROUPS"),
  );
  input.groups[1].elements = [{ namespace: "example/model", id: "a" }];
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_group_key_invalid",
  });
  input.groups[1].elements = [{ namespace: "example/model", id: "b" }];
  input.groups[1].label = "Entry boundary";
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_group_key_invalid",
  });
});

test("the renderer refuses unsupported scene authority and dimensions", () => {
  const cases = [
    ["absent scene", () => null, "static_edition_scene_invalid"],
    ["wrong schema", (input) => ({ ...input, schema: "other" }), "static_edition_scene_invalid"],
    [
      "wrong completeness",
      (input) => ({ ...input, completeness: "qualified" }),
      "static_edition_scene_invalid",
    ],
    [
      "unselected profile",
      (input) => ({ ...input, visualPolicy: { profile: "flagship" } }),
      "static_edition_scene_invalid",
    ],
    [
      "unselected override",
      (input) => ({ ...input, visualPolicy: { profile: "neutral", override: "art.css" } }),
      "static_edition_scene_invalid",
    ],
    ["missing nodes", (input) => ({ ...input, nodes: null }), "static_edition_scene_invalid"],
    ["missing edges", (input) => ({ ...input, edges: null }), "static_edition_scene_invalid"],
    [
      "missing questions",
      (input) => ({ ...input, questions: null }),
      "static_edition_scene_invalid",
    ],
    [
      "missing editorials",
      (input) => ({ ...input, editorialAssertions: null }),
      "static_edition_scene_invalid",
    ],
    ["missing limits", (input) => ({ ...input, limits: null }), "static_edition_scene_invalid"],
    [
      "array limit map",
      (input) => ({ ...input, limitsByQuestion: [] }),
      "static_edition_scene_invalid",
    ],
    [
      "nonintegral width",
      (input) => ({ ...input, requestedWidth: 6000.5 }),
      "static_edition_width_invalid",
    ],
    ["too narrow", (input) => ({ ...input, requestedWidth: 319 }), "static_edition_width_invalid"],
    ["too wide", (input) => ({ ...input, requestedWidth: 12001 }), "static_edition_width_invalid"],
    [
      "forged bounds",
      (input) => ({ ...input, bounds: { ...input.bounds, width: 421 } }),
      "static_edition_bounds_mismatch",
    ],
  ];
  for (const [name, alter, code] of cases)
    assert.throws(
      () => svg.composeStaticEditionSvg(alter(staticEditionScene()), { icons: figureIcons }),
      { code },
      name,
    );
});
