import assert from "node:assert/strict";
import test from "node:test";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { composeStaticEditionScene } from "../packages/publisher/src/scene/static/edition.mjs";
import { importLikeC4Layout } from "../packages/publisher/src/semantics/native-likec4.mjs";
import {
  composeStaticEditionSvg,
  composeStaticFigureSvg,
} from "../packages/publisher/renderers/svg/index.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { composeFigureTypeLegend } from "../packages/publisher/renderers/svg/figure-types.mjs";
import { selectedNativeEdition } from "./fixtures/selected-native-edition.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";

test("ordinary static composition preserves kinds and resolves the Edition catalog", async (t) => {
  const selected = await selectedNativeEdition(t, { media: ["static"] });
  const input = await materializeBuildRequestInput(selected.file, selected.digest);
  const meaning = structuredClone(await compileEditionMeaning(input));
  const layout = await importLikeC4Layout({
    lock: input.lock,
    readSource: input.readSource,
    view: { namespace: "fixture/views", id: "overview" },
  });
  meaning.refinement = { media: { static: { kind: "neutral" } } };
  const scene = composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.visualPolicy.figureTypes, { component: "lucide:box" });
  assert(
    scene.nodes.every(
      (node) =>
        node.kind === "component" && node.figureKind === "component" && node.icon === "lucide:box",
    ),
  );
  const untyped = structuredClone(meaning);
  untyped.editorial.visualPolicy.figureTypes["source element"] = "lucide:circle";
  for (const selection of untyped.native.selections)
    for (const node of selection.members.elements) if (node.id === "alpha") node.kind = null;
  const untypedScene = composeStaticEditionScene(untyped, layout);
  const alpha = untypedScene.nodes.find((node) => node.id === "alpha");
  assert.equal(alpha.kind, null);
  assert.equal(alpha.figureKind, "source element");
  assert.equal(alpha.icon, "lucide:circle");
});

test("untyped static labels reserve native measured clearance below their glyph", async () => {
  const icons = await loadFigureIconSupply();
  const scene = staticEditionScene();
  scene.visualPolicy.figureTypes["source element"] = "lucide:circle";
  Object.assign(scene.nodes[0], {
    kind: null,
    figureKind: "source element",
    icon: "lucide:circle",
    label: "ABCDEFG ABCDEFG",
    height: 64,
  });
  assert.throws(() => composeStaticEditionSvg(scene, { icons }), {
    code: "static_edition_node_unrepresentable",
  });
  scene.nodes[0].height = 86;
  scene.bounds.height = 86;
  const markup = composeStaticEditionSvg(scene, { icons }).bytes.toString("utf8");
  const nodeMarkup = markup.slice(
    markup.indexOf('data-graphic-id="n-0"'),
    markup.indexOf('data-graphic-id="n-1"'),
  );
  const labels = [
    ...nodeMarkup.matchAll(
      /<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="16"[^>]*>([^<]+)<\/text>/gu,
    ),
  ].map(([, x, baseline, text]) => ({
    x: Number(x),
    baseline: Number(baseline),
    text,
    fontSize: 16,
    weight: "600",
    anchor: "start",
  }));
  assert.equal(labels.length, 2);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), labels);
  const glyph = nodeMarkup.match(
    /data-semantic-sigil="lucide:circle" transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/u,
  );
  assert.ok(glyph);
  const glyphBottom = Number(glyph[2]) + 25 * Number(glyph[3]);
  for (const label of labels) {
    const ink = measurer.box(label);
    assert.ok(ink.y - glyphBottom >= 6, "label ink must clear the stroked glyph envelope");
    assert.ok(ink.y + ink.height <= 86 - 12, "label ink must retain bottom padding");
  }
  assert.equal(scene.nodes[0].kind, null);
});

test("static nodes and multi-view Legends paint the catalog artwork exactly once per kind", async () => {
  const icons = await loadFigureIconSupply();
  const makeScene = (id) => {
    const scene = staticEditionScene();
    scene.editorialViewId = id;
    scene.visualPolicy.figureTypes = { component: "lucide:box" };
    scene.nodes = scene.nodes.map((node) => ({
      ...node,
      figureKind: "component",
      icon: "lucide:box",
    }));
    return scene;
  };
  const scene = makeScene("overview");
  const markup = composeStaticEditionSvg(scene, { icons }).bytes.toString("utf8");
  assert.equal((markup.match(/data-semantic-sigil="lucide:box"/gu) ?? []).length, 3);
  assert.equal((markup.match(/data-legend-kind="component"/gu) ?? []).length, 1);
  assert.match(
    markup,
    /data-legend-kind="component"[^>]*><g[^>]*data-semantic-sigil="lucide:box"[\s\S]*?<text[^>]*>component<\/text>/u,
  );
  const figure = composeStaticFigureSvg({
    title: scene.title,
    summary: scene.summary,
    rasterWidth: 6000,
    views: ["first", "second"].map((id, index) => {
      const part = makeScene(id);
      return {
        id,
        scene: part,
        rendered: composeStaticEditionSvg(part, {
          icons,
          fragment: true,
          idPrefix: `static-view-${index}-`,
        }),
      };
    }),
  });
  const svg = figure.bytes.toString("utf8");
  assert.equal((svg.match(/data-legend-kind="component"/gu) ?? []).length, 2);
  assert.equal((svg.match(/data-semantic-sigil="lucide:box"/gu) ?? []).length, 6);
});

test("the type Legend lays out complete icon-first entries without truncation or count badges", async () => {
  const icons = await loadFigureIconSupply();
  const nodes = [
    { kind: "source element", icon: "lucide:circle" },
    { figureKind: "source element", icon: "lucide:circle" },
    { figureKind: "repository policy", icon: "lucide:shield-check" },
    { figureKind: "component", icon: "lucide:box" },
  ];
  assert.equal(composeFigureTypeLegend([], icons, 96), null);
  assert.equal(composeFigureTypeLegend([{ primitives: [] }], icons, 96), null);
  assert.throws(() => composeFigureTypeLegend(nodes, undefined, 96), {
    code: "figure_icon_supply_required",
  });
  for (const width of [95, NaN]) {
    assert.throws(() => composeFigureTypeLegend(nodes, icons, width), {
      code: "figure_legend_width_invalid",
    });
  }
  const result = composeFigureTypeLegend(nodes, icons, 96);
  assert.equal(result.width, 96);
  assert.ok(result.height > 52);
  const entries = [
    ...result.markup.matchAll(
      /<g data-legend-kind="([^"]+)"[^>]*>([\s\S]*?)(?=<g data-legend-kind=|$)/gu,
    ),
  ];
  assert.deepEqual(
    entries.map(([, kind]) => kind),
    ["source element", "repository policy", "component"],
  );
  for (const [, kind, entry] of entries) {
    assert.ok(entry.indexOf("data-semantic-sigil=") < entry.indexOf("<text"));
    assert.equal(
      [...entry.matchAll(/<text[^>]*>([^<]+)<\/text>/gu)].map(([, text]) => text).join(""),
      kind,
    );
  }
  assert.doesNotMatch(result.markup, /legend-count|>\d+<\/text>/u);
});
