import assert from "node:assert/strict";
import test from "node:test";
import { loadIcons } from "../packages/publisher/src/icons.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { composePoster } from "../packages/publisher/src/poster/compose.mjs";
import { rasterize } from "../packages/publisher/src/poster/raster.mjs";
import { loadTypefaces, requireGlyphs } from "../packages/publisher/src/poster/text.mjs";
import { POSTER } from "../packages/publisher/src/poster/tokens.mjs";
import { AIGW_MODEL, graphModel, minimalModel } from "./fixtures/models.mjs";

const none = { state: "none", records: [] };
const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

async function posters(model, provenance = none) {
  const views = await planViews(model, async (view) => {
    const poster = composePoster(model, view, { index: 0, count: 1 }, typefaces, icons, provenance);
    return { fits: poster.fits, width: poster.required.width, height: poster.required.height };
  });
  return views.map((view, index) =>
    composePoster(model, view, { index, count: views.length }, typefaces, icons, provenance),
  );
}

const compose = (model, provenance = none) =>
  composePoster(
    model,
    {
      id: "view",
      title: model.title,
      question: model.question,
      summary: model.summary,
      origin: "complete",
      tiers: null,
      components: model.components,
      relations: model.relations,
    },
    { index: 0, count: 1 },
    typefaces,
    icons,
    provenance,
  );

test("every poster style draws at least the 14 px floor", () => {
  for (const [name, style] of Object.entries(POSTER.type))
    assert.ok(style.size >= POSTER.floor, `${name} is ${style.size} px`);
  assert.ok(POSTER.maximumZoom >= 1);
});

test("AIGW composes into fitting, outlined, deterministic posters", async () => {
  const { model } = await loadModel(AIGW_MODEL, { icon: icons.has });
  const first = await posters(model);
  const second = await posters(model);
  assert.deepEqual(
    first.map(({ view }) => view),
    ["overview", "authority", "adapters", "transaction"],
  );
  for (const [index, poster] of first.entries()) {
    assert.equal(poster.svg, second[index].svg);
    assert.equal(poster.fits, true);
    assert.equal(poster.width, 1800);
    assert.equal(poster.height, 1350);
    assert.ok(poster.scale >= 1 && poster.scale <= POSTER.maximumZoom);
    assert.equal(poster.measures.crossings, 0);
    assert.doesNotMatch(poster.svg, /<text|NaN|undefined/u);
    assert.match(
      poster.svg,
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1800" height="1350"/u,
    );
  }
  // Small views zoom up to fill the frame.
  assert.equal(first[1].scale, POSTER.maximumZoom);
});

test("statuses, the boundary and provenance appear in the drawing and its legend", () => {
  const model = validateModel(
    minimalModel({
      repository: { name: "fixture", revision: "0123456789abcdef0123456789abcdef01234567" },
      attribution: "the fixture editor",
      scope: "A test system",
      limits: ["Only for tests", "Only for tests"],
      kinds: {
        user: { label: "user", category: "person" },
        service: { label: "service", category: "backend" },
      },
      components: [
        { id: "a", label: "Visitor", kind: "user" },
        { id: "b", label: "Planned service", kind: "service", status: "planned" },
        { id: "c", label: "Retired service", kind: "service", status: "retired" },
      ],
      relations: [
        { id: "a-b", from: "a", to: "b", label: "will call", status: "planned" },
        { id: "a-c", from: "a", to: "c", label: "called", status: "retired" },
      ],
    }),
  );
  const unverified = compose(model, { state: "unverified", records: [{}, {}] });
  assert.match(unverified.svg, /stroke-dasharray="6 4"/u);
  assert.match(unverified.svg, /stroke-dasharray="1\.5 3\.5"/u);
  assert.match(unverified.svg, /stroke-dasharray="7 5"/u);
  const verified = compose(model, { state: "verified", records: [{}] });
  assert.notEqual(verified.svg, unverified.svg);
  assert.notEqual(compose(model).svg, verified.svg);
});

test("views taller than the frame are measured and reported as not fitting", () => {
  const details = Object.fromEntries(
    Array.from({ length: 6 }, (_, index) => [`detail${index}`, `value number ${index}`]),
  );
  const model = validateModel(
    graphModel(
      6,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
      {
        components: Array.from({ length: 6 }, (_, index) => ({
          id: `c${index + 1}`,
          label: `Component ${index + 1}`,
          details,
        })),
      },
    ),
  );
  const poster = compose(model);
  assert.equal(poster.fits, false);
  assert.equal(poster.scale, 1);
  assert.ok(poster.required.height > POSTER.height);
});

test("CJK labels compose and characters the fonts lack are refused", () => {
  const model = validateModel(
    minimalModel({
      title: "网关架构",
      question: "请求如何到达上游？",
      components: [
        { id: "a", label: "客户端" },
        { id: "b", label: "统一网关", details: { 职责: ["鉴权", "路由"] } },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: "发送请求" }],
    }),
  );
  assert.equal(compose(model).fits, true);
  requireGlyphs(typefaces, [{ path: "/title", text: model.title }]);
  assert.throws(
    () =>
      requireGlyphs(typefaces, [
        { path: "/title", text: "ok" },
        { path: "/components/0/label", text: "smile 😀" },
      ]),
    (error) =>
      error.code === "glyphs_missing" &&
      error.problems.length === 1 &&
      error.problems[0].path === "/components/0/label",
  );
});

test("text wraps at spaces, splits only oversized words and keeps detail items whole", () => {
  const style = POSTER.type.detail;
  assert.deepEqual(typefaces.wrap("", 100, style), []);
  const pieces = typefaces.wrap("a".repeat(80), 120, style);
  assert.ok(pieces.length > 1);
  assert.equal(pieces.join(""), "a".repeat(80));
  assert.deepEqual(typefaces.detailLines("owns", ["x", "y"], 400, style), ["owns: x, y"]);
  const narrow = typefaces.detailLines("owns", ["first item", "second item"], 110, style);
  assert.ok(narrow.length >= 2);
  assert.match(typefaces.outline("Ag", 0, 10, style), /^M/u);
});

test("over-long summaries and legends are refused", () => {
  const summary = Array.from({ length: 80 }, () => "summary").join(" ");
  assert.throws(() => compose(validateModel(minimalModel({ summary }))), {
    code: "poster_summary_too_long",
  });
  const kinds = Object.fromEntries(
    Array.from({ length: 16 }, (_, index) => [
      `kind${index}`,
      { label: `an unusually descriptive kind ${index}` },
    ]),
  );
  const components = Object.keys(kinds).map((kind, index) => ({
    id: `c${index}`,
    label: `C${index}`,
    kind,
  }));
  const crowded = validateModel(
    minimalModel({
      kinds,
      components,
      relations: [{ id: "r", from: "c0", to: "c1", label: "uses" }],
      views: [
        {
          id: "a",
          tiers: [
            { id: "t1", label: "One", members: components.slice(0, 4).map(({ id }) => id) },
            { id: "t2", label: "Two", members: components.slice(4, 8).map(({ id }) => id) },
            { id: "t3", label: "Three", members: components.slice(8, 12).map(({ id }) => id) },
            { id: "t4", label: "Four", members: components.slice(12).map(({ id }) => id) },
          ],
        },
      ],
    }),
  );
  const [view] = crowded.views;
  assert.throws(
    () =>
      composePoster(
        crowded,
        {
          ...view,
          title: crowded.title,
          question: crowded.question,
          summary: null,
          origin: "declared",
          components: crowded.components,
          relations: crowded.relations,
        },
        { index: 0, count: 1 },
        typefaces,
        icons,
        none,
      ),
    { code: "poster_legend_too_wide" },
  );
});

test("posters rasterize at 1800 and 6000 px and other widths are refused", async () => {
  const poster = compose(validateModel(minimalModel()));
  for (const width of [1800, 6000]) {
    const png = await rasterize(poster.svg, width, poster.height, poster.width);
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), Math.round((poster.height * width) / poster.width));
  }
  await assert.rejects(rasterize(poster.svg, 6001, poster.height, poster.width), {
    code: "raster_size_invalid",
  });
  await assert.rejects(rasterize(poster.svg, 0, poster.height, poster.width), {
    code: "raster_size_invalid",
  });
});
