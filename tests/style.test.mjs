import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { editionFacts } from "../src/facts/edition.mjs";
import { editionStyle } from "../src/style.mjs";

const HOUSE = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));

const DAY = 86400;

/** A model with two parts, `a` owning files and `b` none, and its optional edition choice. */
const modelOf = (edition) => ({
  components: [{ id: "a" }, { id: "b" }],
  groups: [],
  ...(edition ? { edition } : {}),
});

const pinTime = 1_000 * DAY;
/** The pin's commit facts. Its date is the one its committer recorded, which the edition's foot prints: a day after the UTC date here. */
const PIN = Object.freeze({ date: "1972-09-28", time: pinTime, release: null });

/** The style of a model whose binding the layer measures: at the pin for a checkout, and without one. */
const styleOf = (model, binding) =>
  editionStyle(model, editionFacts(model, binding, binding.state === "verified" ? PIN : null));

/** A verified binding of `a`'s files, each changed `days` before the pin, with its size. */
function bound(files) {
  return {
    state: "verified",
    records: files.map(({ path, bytes }) => ({ path, bytes })),
    times: new Map(files.map(({ path, days }) => [path, pinTime - days * DAY])),
    owned: new Map([
      ["a", files.map(({ path }) => path)],
      ["b", []],
    ]),
  };
}

test("a build without file facts has no strip to draw, which is no fallback and raises no warning", () => {
  const none = { state: "none", records: [], owned: new Map([["a", []]]) };
  const styled = styleOf(modelOf(null), none);
  // Nothing is chosen between two ways, so the style gives no warning of a fallback.
  assert.deepEqual(Object.keys(styled), ["style", "record"]);
  const { style, record } = styled;
  assert.deepEqual(Object.keys(style), ["tokens", "facts"]);
  assert.equal(style.facts.scale, null);
  // Without strips there are no age bands to record; the palette is the default, with its names and roles.
  const { name, colours, ...indigo } = HOUSE.palettes.indigo;
  assert.ok(colours);
  assert.deepEqual(record, {
    palette: "indigo",
    names: name,
    roles: indigo,
    bands: null,
  });
  assert.equal(styleOf(modelOf({ palette: "persimmon" }), none).record.palette, "persimmon");
  // A checkout read at the pin is not enough: a model that claims no files has nothing to draw a strip from.
  const unclaimed = styleOf(modelOf(null), bound([]));
  assert.deepEqual([unclaimed.style.facts.scale, unclaimed.record.bands], [null, null]);
});

test("a custom palette is recorded as custom, with its resolved roles and no names", () => {
  const palette = { ground: "#ffffff", ink: "#000000", dye: ["#d0d0d0", "#a0a0a0", "#606060"] };
  const { record, style } = styleOf(modelOf({ palette }), bound([]));
  assert.deepEqual(record, {
    palette: "custom",
    names: null,
    roles: { ...palette, accent: "#606060" },
    bands: null,
  });
  assert.equal(style.tokens.palette.paper, "#ffffff");
});

test("a part's strip is drawn from its files in path order, with one scale and one set of bands", () => {
  const binding = bound([
    { path: "src/z.mjs", bytes: 3000, days: 400 },
    { path: "src/a.mjs", bytes: 1000, days: 0.5 },
    { path: "src/m.mjs", bytes: 2000, days: 30 },
  ]);
  const { style, record } = styleOf(modelOf(null), binding);
  const a = /** @type {any} */ (style.facts.part({ id: "a" }));
  assert.deepEqual(
    a.files.map(({ path }) => path),
    ["src/a.mjs", "src/m.mjs", "src/z.mjs"],
  );
  assert.equal(a.bytes, 6000);
  assert.deepEqual(style.facts.part({ id: "b" }), { bytes: 0, files: [] });
  assert.equal(style.facts.scale, 6000);
  assert.deepEqual(
    a.files.map(({ band }) => band),
    [0, 1, 2],
    "a file changed hours, days and a year before the pin falls in three bands",
  );
  // Every edition dates its files from its pin by the same spans, and names the pin's day.
  assert.deepEqual(record.bands, { spans: [7 * DAY, 90 * DAY], reference: "1972-09-28" });
  assert.equal(style.facts.date, "1972-09-28");
  assert.ok(style.tokens.dye.old.startsWith("#"));
});
