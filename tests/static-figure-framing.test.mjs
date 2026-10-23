import assert from "node:assert/strict";
import test from "node:test";
import { composeStaticFigureSvg } from "../packages/publisher/renderers/svg/index.mjs";
import { RASTER_LIMITS } from "../packages/publisher/renderers/resvg/public.mjs";
import { selectMeasuredComposition } from "../packages/publisher/renderers/svg/composition.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import { staticFigureView } from "./fixtures/static-edition-scene.mjs";

const view = staticFigureView.bind(null, await loadFigureIconSupply());

test("complete framing keeps viable relation columns instead of failing an optional narrower column", () => {
  const selected = {
    id: "overview",
    scene: {
      editorialViewId: "overview",
      edition: { editor: "editor" },
      questions: [{ text: "Question" }],
      nodes: [],
      edges: [],
      limitsByQuestion: {},
      editorialAssertions: [],
    },
    rendered: {
      rasterWidth: 6000,
      parts: {
        graph: '<rect x="0" y="0" width="620" height="100"/>',
        bounds: { x: 0, y: 0, width: 620, height: 100 },
        groups: [],
        relations: [
          { graphicId: "first", text: "a".repeat(240) },
          { graphicId: "second", text: "b".repeat(240) },
        ],
        claim: null,
      },
    },
  };
  const input = { title: "Title", rasterWidth: 6000, views: [selected] };
  const result = composeStaticFigureSvg(input);
  const svg = result.bytes.toString("utf8");
  for (const item of selected.rendered.parts.relations)
    assert.equal(
      [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
        .map(([, value]) => value)
        .join("")
        .includes(item.text),
      true,
    );
  assert.deepEqual(composeStaticFigureSvg(input), result);
});

test("framing does not widen empty canvas when complete fixed content cannot reflow", () => {
  const selected = {
    id: "overview",
    scene: {
      editorialViewId: "overview",
      edition: { editor: "editor" },
      questions: [{ text: "Question" }],
      nodes: [],
      edges: [],
      limitsByQuestion: {},
      editorialAssertions: [],
    },
    rendered: {
      rasterWidth: 1800,
      parts: {
        graph: '<rect x="0" y="0" width="620" height="600"/>',
        bounds: { x: 0, y: 0, width: 620, height: 600 },
        groups: [],
        relations: [],
        claim: null,
      },
    },
  };
  const result = composeStaticFigureSvg({ title: "Title", rasterWidth: 1800, views: [selected] });
  assert.equal(result.width, 728);
  assert.ok(result.bytes.toString("utf8").includes(selected.rendered.parts.graph));
});

test("a fixed claim plate and tall source graph are arranged without changing either unit", () => {
  const selected = {
    id: "overview",
    scene: {
      editorialViewId: "overview",
      edition: { editor: "editor" },
      questions: [{ text: "Question" }],
      nodes: [],
      edges: [],
      limitsByQuestion: {},
      editorialAssertions: [],
    },
    rendered: {
      rasterWidth: 6000,
      parts: {
        graph: '<rect data-graphic-id="source" x="0" y="0" width="298" height="548"/>',
        bounds: { x: 0, y: 0, width: 298, height: 548 },
        groups: [],
        relations: [],
        claim: {
          markup: '<rect data-graphic-id="claim" x="60" y="905" width="1094" height="248"/>',
          x: 60,
          y: 905,
          width: 1094,
          height: 248,
        },
      },
    },
  };
  const input = { title: "Title", rasterWidth: 6000, views: [selected] };
  const result = composeStaticFigureSvg(input);
  const svg = result.bytes.toString("utf8");
  assert.equal(result.height, 915);
  assert.equal(result.width, 1542);
  assert.ok(svg.includes(selected.rendered.parts.graph));
  assert.ok(svg.includes(selected.rendered.parts.claim.markup));
  assert.match(svg, /data-claim-placement="beside-source"/u);
  assert.deepEqual(composeStaticFigureSvg(input), result);
});

test("intrinsic whole-figure framing fits a complete desktop reading at 6000 pixels", () => {
  const selected = view("overview", 0, {
    question: "When may the client call?",
    relationOnly: true,
    scopeLimits: [{ kind: "scope", reason: "The request is selected, not an execution claim." }],
  });
  const input = {
    title: "Typed source structure",
    summary: "Keep the authorization condition visible.",
    rasterWidth: 6000,
    views: [selected],
  };
  const result = composeStaticFigureSvg(input);
  const height = Math.round((result.rasterWidth * result.height) / result.width);
  assert.ok(height <= RASTER_LIMITS.height);
  assert.ok(result.rasterWidth * height <= RASTER_LIMITS.pixels);
  assert.ok(result.bytes.toString("utf8").includes(selected.scene.questions[0].text));
  assert.ok(result.bytes.toString("utf8").includes("SOURCE RELATIONS"));
  assert.deepEqual(composeStaticFigureSvg(input), result);
});

test("a complete source graph can use the requested raster canvas without an internal width ceiling", () => {
  const selected = view("complete", 0, { relationOnly: true });
  selected.rendered.parts.bounds.width = 2_900;
  const input = {
    title: "Complete source structure",
    rasterWidth: 6000,
    views: [selected],
  };
  const result = composeStaticFigureSvg(input);
  const height = Math.round((result.rasterWidth * result.height) / result.width);
  assert.ok(result.width > selected.rendered.parts.bounds.width);
  assert.ok(result.width <= result.rasterWidth);
  assert.ok(height <= RASTER_LIMITS.height);
  assert.ok(result.rasterWidth * height <= RASTER_LIMITS.pixels);
  assert.ok(result.bytes.toString("utf8").includes(selected.scene.questions[0].text));
  assert.deepEqual(composeStaticFigureSvg(input), result);
  assert.throws(() => composeStaticFigureSvg({ ...input, rasterWidth: 1800 }), {
    code: "static_figure_width_unrepresentable",
  });
});

test("complete tall views reflow into a raster-feasible figure without dropping content", () => {
  const views = Array.from({ length: 4 }, (_, index) => {
    const selected = view(`reading-${index}`, index);
    selected.rendered.parts.bounds.width = 650;
    selected.rendered.parts.bounds.height = 850;
    return selected;
  });
  const input = { title: "Four complete readings", rasterWidth: 6000, views };
  const result = composeStaticFigureSvg(input);
  const rasterHeight = Math.round((result.rasterWidth * result.height) / result.width);
  assert.ok(rasterHeight <= RASTER_LIMITS.height);
  assert.ok(result.rasterWidth * rasterHeight <= RASTER_LIMITS.pixels);
  assert.equal(result.placements.length, views.length);
  assert.equal(new Set(result.placements.map(({ y }) => y)).size, 1);
  const svg = result.bytes.toString("utf8");
  for (const { id, scene } of views) {
    assert.ok(svg.includes(`data-static-view="${id}"`));
    assert.ok(svg.includes(scene.questions[0].text));
  }
  assert.deepEqual(composeStaticFigureSvg(input), result);
});

test("a complete figure refuses when no layout can meet the unchanged raster budget", () => {
  const selected = view("too-tall", 0, { relationOnly: true });
  selected.rendered.parts.bounds.height = 9000;
  assert.throws(
    () =>
      composeStaticFigureSvg({
        title: "Unrepresentable complete reading",
        rasterWidth: 6000,
        views: [selected],
      }),
    { code: "raster_dimensions_invalid" },
  );
});

test("empty canvas expansion cannot turn an infeasible reading into an accepted composition", () => {
  assert.throws(
    () =>
      selectMeasuredComposition(
        [1450, 3500],
        (width) => ({ width, height: 2630, rasterWidth: 6000 }),
        [],
      ),
    { code: "raster_dimensions_invalid" },
  );
});

test("padding-only feasibility is refused regardless of candidate order", () => {
  const narrow = { width: 1450, height: 2630, rasterWidth: 6000 };
  const padded = { width: 3500, height: 2630, rasterWidth: 6000 };
  for (const candidates of [
    [narrow, padded],
    [padded, narrow],
  ])
    assert.throws(() => selectMeasuredComposition(candidates, (candidate) => candidate, []), {
      code: "raster_dimensions_invalid",
    });
});

test("a complete height reflow remains eligible after a padding-only candidate", () => {
  const narrow = { width: 1450, height: 2630, rasterWidth: 6000 };
  const padded = { width: 3500, height: 2630, rasterWidth: 6000 };
  const reflowed = { width: 2400, height: 1800, rasterWidth: 6000 };
  for (const candidates of [
    [narrow, padded, reflowed],
    [reflowed, padded, narrow],
  ])
    assert.equal(
      selectMeasuredComposition(candidates, (candidate) => candidate, []),
      reflowed,
    );
});
