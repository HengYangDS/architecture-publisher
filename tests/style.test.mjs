import assert from "node:assert/strict";
import test from "node:test";
import { editionStyle } from "../src/style.mjs";

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
    records: files.map(({ path, bytes }) => ({ path, bytes })),
    times: new Map(files.map(({ path, days }) => [path, pinTime - days * DAY])),
    owned: new Map([
      ["a", files.map(({ path }) => path)],
      ["b", []],
    ]),
  };
}

test("a build without file facts sets cards and warns, unless the model asks for bolts", () => {
  const none = { state: "none", records: [], owned: new Map([["a", []]]) };
  const { style, warnings, record } = editionStyle(modelOf(null), none);
  assert.equal(style.name, "cards");
  assert.deepEqual(
    warnings.map(({ code }) => code),
    ["style_fallback"],
  );
  assert.equal(record.palette, "indigo");
  assert.equal(record.style, "cards");
  assert.throws(
    () => editionStyle(modelOf({ style: "bolts", palette: null }), none),
    (error) => error.code === "style_needs_files",
  );
  const chosen = editionStyle(modelOf({ style: "cards", palette: "forest" }), none);
  assert.deepEqual(chosen.warnings, []);
  assert.equal(chosen.record.palette, "forest");
});

test("bolts weaves each part from its files in path order, with one scale and one set of bands", () => {
  const binding = bound([
    { path: "src/z.mjs", bytes: 3000, days: 400 },
    { path: "src/a.mjs", bytes: 1000, days: 0.5 },
    { path: "src/m.mjs", bytes: 2000, days: 10 },
  ]);
  const { style, warnings, record } = editionStyle(modelOf(null), binding);
  assert.equal(style.name, "bolts");
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
  assert.deepEqual(record.bands, { spans: style.bands.spans });
  assert.equal(record.style, "bolts");
  assert.ok(style.tokens.dye.old.startsWith("#"));
});
