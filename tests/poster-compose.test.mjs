import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { loadIcons } from "../packages/publisher/src/icons.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { notesOf } from "../packages/publisher/src/poster/blocks.mjs";
import {
  admitsView,
  composePosters,
  gateFailures,
} from "../packages/publisher/src/poster/compose.mjs";
import { rasterize } from "../packages/publisher/src/poster/raster.mjs";
import { loadTypefaces, requireGlyphs } from "../packages/publisher/src/poster/text.mjs";
import { PAGE, POSTER } from "../packages/publisher/src/poster/tokens.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  SELF_MODEL,
  graphModel,
  minimalModel,
} from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

/** Plan a model's views and compose its edition, as the build does. */
async function edition(model) {
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  return composePosters(model, views, typefaces, icons);
}

/** A drawn page passes every gate its manifest entry records measures for. */
function assertBalanced(poster) {
  const { emptyShare, blankBand, holes, centroid } = poster.measures;
  assert.deepEqual(
    gateFailures({ emptyShare, band: { height: blankBand }, holes, centroid }),
    [],
    poster.view,
  );
}

test("every page style is on the type scale and at least the 14 px floor", () => {
  for (const [name, style] of Object.entries(PAGE)) {
    assert.ok(style.size >= POSTER.floor, `${name} is ${style.size} px`);
    assert.ok(POSTER.scale.includes(style.size), `${name} is off the scale`);
  }
  for (const step of POSTER.steps)
    for (const size of Object.values(step)) assert.ok(POSTER.scale.includes(size));
  // A sparse figure is set larger, but no size passes 1.8 times its densest
  // step, and no card label reaches the heading that names its view.
  const [first] = POSTER.steps;
  for (const step of POSTER.steps) {
    for (const [role, size] of Object.entries(step))
      assert.ok(size <= 1.8 * first[role], `${role} ${size} px against ${first[role]} px`);
    assert.ok(
      step.name < PAGE.plate.size,
      `${step.name} px labels under a ${PAGE.plate.size} px heading`,
    );
  }
});

test("AIGW composes into balanced, outlined, deterministic 16:9 pages", async () => {
  const { model } = await loadModel(AIGW_MODEL, { icon: icons.has });
  const first = await edition(model);
  const second = await edition(model);
  // Its views share components, so each fills a page of its own.
  assert.deepEqual(
    first.map(({ views }) => views),
    [["overview"], ["authority"], ["adapters"]],
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

test("statuses and the boundary appear in the drawing, and the source note names the revision", async () => {
  // A model large enough to fill a page, with one planned and one retired element.
  const base = JSON.parse(await fs.readFile(BIG_BANK_MODEL, "utf8"));
  base.components[1].status = "planned";
  base.components[2].status = "retired";
  base.relations[0].status = "planned";
  base.relations[1].status = "retired";
  base.repository = { name: "fixture", revision: "0123456789abcdef0123456789abcdef01234567" };
  const model = validateModel(base);
  const [page] = await edition(model);
  assert.match(page.svg, /stroke-dasharray="6 4"/u);
  assert.match(page.svg, /stroke-dasharray="1\.5 3\.5"/u);
  // Whether each source was verified, and by which digest, is the manifest's
  // evidence: the page names the repository and revision a reader can open.
  const source = notesOf(model).find(({ label }) => label === "Source");
  assert.match(source?.text ?? "", /^Source fixture at 0123456789ab; Model by /u);
  assert.ok(notesOf(model).every(({ text }) => !/verif|SHA-256|digest/iu.test(text)));
});

test("a model too sparse to balance a page is refused with what its closest page misses", async () => {
  // One relation between two cards: no page of this format can hold it without
  // a blank band, so the build names the view and the gates its closest page
  // misses, with their measured values and limits, instead of printing it.
  const model = validateModel(graphModel(2, [[1, 2]]));
  await assert.rejects(edition(model), (error) => {
    assert.equal(error.code, "poster_unbalanced");
    assert.equal(error.problems.length, 1);
    assert.equal(error.problems[0].code, "poster_unbalanced");
    assert.match(error.problems[0].message, /\(limit \d/u);
    return true;
  });
});

test("a page lays its rows out uncentred when centring crosses a relation that skips a row", async () => {
  // Centred, the self edition's media row sits over the middle of its parts
  // row, so the relation from the builder down to the raster turns across the
  // wires that leave the map. Placement weighs only the wires between
  // neighbouring rows, so the page measures the uncentred rows as well and
  // draws those.
  const { model } = await loadModel(SELF_MODEL, { icon: icons.has });
  const page = (await edition(model)).find(({ views }) => views.includes("media"));
  assert.ok(page);
  assert.equal(page.composition.centring, null);
  assert.equal(page.measures.crossings, 0);
  assertBalanced(page);
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
