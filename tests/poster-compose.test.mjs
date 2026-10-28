import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { loadIcons } from "../packages/publisher/src/icons.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { GATES, admitsView, composePosters } from "../packages/publisher/src/poster/compose.mjs";
import { rasterize } from "../packages/publisher/src/poster/raster.mjs";
import { loadTypefaces, requireGlyphs } from "../packages/publisher/src/poster/text.mjs";
import { PAGE, POSTER } from "../packages/publisher/src/poster/tokens.mjs";
import { AIGW_MODEL, BIG_BANK_MODEL, graphModel, minimalModel } from "./fixtures/models.mjs";

const none = { state: "none", records: [] };
const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

/** Plan a model's views and compose its edition, as the build does. */
async function edition(model, provenance = none) {
  const views = await planViews(model, async (view) =>
    admitsView(model, view, typefaces, icons, provenance),
  );
  return composePosters(model, views, typefaces, icons, provenance);
}

/** Every page of an edition passes every balance gate. */
function assertBalanced(poster) {
  const { emptyShare, fill, centroid } = poster.measures;
  assert.ok(emptyShare <= GATES.emptyShare, `${poster.view}: empty share ${emptyShare}`);
  assert.ok(fill[0] >= GATES.fill && fill[1] >= GATES.fill, `${poster.view}: fill ${fill}`);
  assert.ok(
    Math.abs(centroid[0]) <= GATES.centroid && Math.abs(centroid[1]) <= GATES.centroid,
    `${poster.view}: centroid ${centroid}`,
  );
}

test("every page style is on the type scale and at least the 14 px floor", () => {
  for (const [name, style] of Object.entries(PAGE)) {
    assert.ok(style.size >= POSTER.floor, `${name} is ${style.size} px`);
    assert.ok(POSTER.scale.includes(style.size), `${name} is off the scale`);
  }
  for (const step of POSTER.steps)
    for (const size of Object.values(step)) assert.ok(POSTER.scale.includes(size));
  // A sparse figure is set larger, but no size passes 1.4 times its densest step.
  const [first] = POSTER.steps;
  for (const step of POSTER.steps)
    for (const [role, size] of Object.entries(step))
      assert.ok(size <= 1.4 * first[role], `${role} ${size} px against ${first[role]} px`);
});

test("AIGW composes into balanced, outlined, deterministic 16:9 pages", async () => {
  const { model } = await loadModel(AIGW_MODEL, { icon: icons.has });
  const first = await edition(model);
  const second = await edition(model);
  // A sparse view shares a page with its neighbour instead of printing as a band.
  assert.ok(first.length < 4, `${first.length} pages for four views`);
  assert.deepEqual(
    first.flatMap(({ views }) => views),
    ["overview", "authority", "adapters", "transaction"],
  );
  for (const [index, poster] of first.entries()) {
    assert.equal(poster.svg, second[index].svg);
    assert.equal(poster.width, 2400);
    assert.equal(poster.height, 1350);
    assert.equal(poster.measures.crossings, 0);
    assert.doesNotMatch(poster.svg, /<text|NaN|undefined/u);
    assert.match(
      poster.svg,
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="2400" height="1350"/u,
    );
    assertBalanced(poster);
  }
});

test("statuses, the boundary and provenance appear in the drawing and its legend", async () => {
  // A model large enough to fill a page, with one planned and one retired element.
  const base = JSON.parse(await fs.readFile(BIG_BANK_MODEL, "utf8"));
  base.components[1].status = "planned";
  base.components[2].status = "retired";
  base.relations[0].status = "planned";
  base.relations[1].status = "retired";
  base.repository = { name: "fixture", revision: "0123456789abcdef0123456789abcdef01234567" };
  const model = validateModel(base);
  const [unverified] = await edition(model, { state: "unverified", records: [{}, {}] });
  assert.match(unverified.svg, /stroke-dasharray="6 4"/u);
  assert.match(unverified.svg, /stroke-dasharray="1\.5 3\.5"/u);
  const [verified] = await edition(model, { state: "verified", records: [{}] });
  assert.notEqual(verified.svg, unverified.svg);
  const [plain] = await edition(model);
  assert.notEqual(plain.svg, verified.svg);
});

test("a view whose page cannot be balanced is refused with its measures", async () => {
  // One relation between two cards: no page of this format can hold it without
  // a blank band, so the build refuses rather than printing one.
  const model = validateModel(graphModel(2, [[1, 2]]));
  await assert.rejects(edition(model), (error) => {
    assert.equal(error.code, "poster_unfittable");
    assert.match(error.message, /emptyShare|fill|centroid/u);
    return true;
  });
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
  const view = {
    id: "view",
    title: model.title,
    question: model.question,
    summary: model.summary,
    origin: "complete",
    tiers: null,
    components: model.components,
    relations: model.relations,
  };
  assert.equal(admitsView(model, view, typefaces, icons).fits, true);
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
  const style = PAGE.summary;
  assert.deepEqual(typefaces.wrap("", 100, style), []);
  const pieces = typefaces.wrap("a".repeat(80), 120, style);
  assert.ok(pieces.length > 1);
  assert.equal(pieces.join(""), "a".repeat(80));
  assert.deepEqual(typefaces.detailLines("owns", ["x", "y"], 400, style), ["owns: x, y"]);
  const narrow = typefaces.detailLines("owns", ["first item", "second item"], 110, style);
  assert.ok(narrow.length >= 2);
  assert.match(typefaces.outline("Ag", 0, 10, style), /^M/u);
});

test("an over-long summary is refused with its line count", async () => {
  const summary = Array.from({ length: 80 }, () => "summary").join(" ");
  const model = validateModel(minimalModel({ summary }));
  await assert.rejects(edition(model), (error) => {
    assert.match(error.message, /The summary of Minimal needs \d+ lines/u);
    return true;
  });
});

test("pages rasterize at 2400 and 6000 px and other widths are refused", async () => {
  const { model } = await loadModel(AIGW_MODEL, { icon: icons.has });
  const [poster] = await edition(model);
  for (const width of [2400, 6000]) {
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
