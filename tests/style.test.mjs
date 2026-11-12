import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { editionStyle } from "../src/style.mjs";

const HOUSE = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));

const DAY = 86400;

/** A model with two parts, `a` owning files and `b` none, and its optional edition choice. */
const modelOf = (edition) => ({
  components: [{ id: "a" }, { id: "b" }],
  ...(edition ? { edition } : {}),
});

/** A verified binding of `a`'s files, each changed `days` before the pin, with its size. */
function bound(files) {
  const pinTime = 1_000 * DAY;
  return {
    state: "verified",
    pinTime,
    // The pin's date as its committer recorded it, which the edition's foot prints: a day after the UTC date here.
    pinDate: "1972-09-28",
    records: files.map(({ path, bytes }) => ({ path, bytes })),
    times: new Map(files.map(({ path, days }) => [path, pinTime - days * DAY])),
    owned: new Map([
      ["a", files.map(({ path }) => path)],
      ["b", []],
    ]),
  };
}

test("a build without file facts draws cards and warns, unless the model asks for strips", () => {
  const none = { state: "none", records: [], owned: new Map([["a", []]]) };
  const { style, warnings, record } = editionStyle(modelOf(null), none);
  assert.equal(style.name, "card");
  assert.deepEqual(
    warnings.map(({ code }) => code),
    ["marks_fallback"],
  );
  // Cards have no age bands to record; the palette is the default, with its names and roles.
  const { name, ...indigo } = HOUSE.palettes.indigo;
  assert.deepEqual(record, {
    marks: "card",
    palette: "indigo",
    names: name,
    roles: indigo,
    bands: null,
  });
  assert.throws(
    () => editionStyle(modelOf({ marks: "strip", palette: null }), none),
    (error) => error.code === "marks_need_files",
  );
  const chosen = editionStyle(modelOf({ marks: "card", palette: "persimmon" }), none);
  assert.deepEqual(chosen.warnings, []);
  assert.deepEqual([chosen.record.marks, chosen.record.palette], ["card", "persimmon"]);
  // A checkout read at the pin is not enough: a model that claims no files has nothing to draw a strip from.
  const unclaimed = bound([]);
  assert.equal(editionStyle(modelOf(null), unclaimed).style.name, "card");
  assert.throws(
    () => editionStyle(modelOf({ marks: "strip", palette: null }), unclaimed),
    (error) => error.code === "marks_need_files",
  );
});

test("a custom palette is recorded as custom, with its resolved roles and no names", () => {
  const palette = { ground: "#ffffff", ink: "#000000", dye: ["#d0d0d0", "#a0a0a0", "#606060"] };
  const { record, style } = editionStyle(modelOf({ marks: "card", palette }), bound([]));
  assert.deepEqual(record, {
    marks: "card",
    palette: "custom",
    names: null,
    roles: { ...palette, accent: "#606060" },
    bands: null,
  });
  assert.equal(style.tokens.palette.paper, "#ffffff");
});

test("strips draw each part from its files in path order, with one scale and one set of bands", () => {
  const binding = bound([
    { path: "src/z.mjs", bytes: 3000, days: 400 },
    { path: "src/a.mjs", bytes: 1000, days: 0.5 },
    { path: "src/m.mjs", bytes: 2000, days: 30 },
  ]);
  const { style, warnings, record } = editionStyle(modelOf(null), binding);
  assert.equal(style.name, "strip");
  assert.deepEqual(warnings, []);
  const a = /** @type {any} */ (style.parts.get("a"));
  assert.deepEqual(
    a.files.map(({ path }) => path),
    ["src/a.mjs", "src/m.mjs", "src/z.mjs"],
  );
  assert.equal(a.bytes, 6000);
  assert.deepEqual(style.parts.get("b"), { bytes: 0, files: [] });
  assert.equal(style.most, 6000);
  assert.deepEqual(
    a.files.map(({ band }) => band),
    [0, 1, 2],
    "a file changed hours, days and a year before the pin falls in three bands",
  );
  // Every edition dates its files from its pin by the same spans, and names the pin's day.
  assert.deepEqual(record.bands, { spans: [7 * DAY, 90 * DAY], reference: "1972-09-28" });
  assert.equal(style.reference, "1972-09-28");
  assert.equal(record.marks, "strip");
  assert.ok(style.tokens.dye.old.startsWith("#"));
});
