import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { BANDS } from "../src/facts/ages.mjs";
import { CATALOGUE, factOf, factSet, propertyOf } from "../src/facts/catalogue.mjs";

const unit = path.resolve(import.meta.dirname, "../src/facts");

/** The design's table: property, kinds of subject, unit, what it is measured from, what stands without a checkout, measure. */
const TABLE = [
  ["owned-files", ["part", "group"], "paths", "pin", "stated", "ownedFiles"],
  ["owned-bytes", ["part", "group"], "bytes", "pin", "absent", "ownedBytes"],
  ["file-share", ["file"], "ratio", "pin", "absent", "fileShare"],
  ["file-age-band", ["file"], "band", "pin", "absent", "bandOf"],
  ["largest-part", ["edition"], "bytes", "pin", "absent", "largestPart"],
  ["pin-date", ["edition"], "date", "pin", "absent", "pinDate"],
  ["pin-release", ["edition"], "release", "pin", "absent", "pinRelease"],
  ["files-read", ["edition"], "files", "pin", "stated", "filesRead"],
  ["cited-files", ["relation"], "files", "model", "measured", "citedFiles"],
  ["hub", ["view"], "part", "model", "measured", "hubOf"],
  ["bands-shown", ["view"], "bands", "pin", "absent", "bandsShown"],
];

test("the catalogue lists the eleven properties of measured facts and no other", () => {
  assert.deepEqual(
    CATALOGUE.map((row) => [row.property, row.of, row.unit, row.from, row.unpinned, row.measure]),
    TABLE,
  );
  // Every property is measured; what a build without a checkout holds in its place is said beside it.
  assert.deepEqual([...new Set(CATALOGUE.map(({ origin }) => origin))], ["measured"]);
  assert.equal(new Set(CATALOGUE.map(({ property }) => property)).size, 11);
  assert.equal(new Set(CATALOGUE.map(({ measure }) => measure)).size, 11);
  assert.ok(Object.isFrozen(CATALOGUE) && CATALOGUE.every((row) => Object.isFrozen(row)));
});

test("the age bands' two spans stand with the property they define, in seconds", () => {
  assert.deepEqual(propertyOf("file-age-band").spans, [7 * 86400, 90 * 86400]);
  assert.equal(propertyOf("file-age-band").spans, BANDS.spans);
  assert.deepEqual(
    CATALOGUE.filter((row) => "spans" in row).map(({ property }) => property),
    ["file-age-band"],
  );
});

test("each measure the catalogue names is a function the unit defines, once", async () => {
  const texts = await Promise.all(
    (await fs.readdir(unit)).sort().map((name) => fs.readFile(path.join(unit, name), "utf8")),
  );
  for (const { measure } of CATALOGUE)
    assert.equal(
      texts.join("\n").split(new RegExp(`\\bfunction ${measure}\\(`, "u")).length - 1,
      1,
      measure,
    );
});

test("a fact carries its property, its subject, its value, and the catalogue's unit and origin", () => {
  assert.deepEqual(factOf("owned-bytes", { kind: "part", id: "a" }, 4000), {
    property: "owned-bytes",
    of: { kind: "part", id: "a" },
    value: 4000,
    unit: "bytes",
    origin: "measured",
    from: "pin",
  });
  assert.deepEqual(factOf("hub", { kind: "view", id: "v" }, null), {
    property: "hub",
    of: { kind: "view", id: "v" },
    value: null,
    unit: "part",
    origin: "measured",
    from: "model",
  });
  // What the author stated was measured from nothing.
  assert.deepEqual(factOf("owned-files", { kind: "part", id: "a" }, ["a.js"], true), {
    property: "owned-files",
    of: { kind: "part", id: "a" },
    value: ["a.js"],
    unit: "paths",
    origin: "stated",
    from: null,
  });
});

test("a property the catalogue lacks is refused by name", () => {
  const named = (error) => error instanceof RangeError && error.message.includes("coverage");
  assert.throws(() => propertyOf("coverage"), named);
  assert.throws(() => factOf("coverage", { kind: "edition" }, 1), named);
  assert.throws(() => factSet([]).fact("coverage", { kind: "edition" }), named);
});

test("a set of facts is read by property and subject, and a fact it lacks is absent", () => {
  const bytes = factOf("owned-bytes", { kind: "part", id: "a" }, 4000);
  const share = factOf("file-share", { kind: "file", id: "a.js", part: "a" }, 0.75);
  const date = factOf("pin-date", { kind: "edition" }, "2026-11-10");
  const set = factSet([bytes, share, date]);
  assert.equal(set.fact("owned-bytes", { kind: "part", id: "a" }), bytes);
  assert.equal(set.fact("file-share", { kind: "file", id: "a.js", part: "a" }), share);
  assert.equal(set.fact("pin-date", { kind: "edition" }), date);
  // Another part, the same file under another part, another kind of subject, and a property not held.
  assert.equal(set.fact("owned-bytes", { kind: "part", id: "b" }), undefined);
  assert.equal(set.fact("file-share", { kind: "file", id: "a.js", part: "g" }), undefined);
  assert.equal(set.fact("owned-bytes", { kind: "group", id: "a" }), undefined);
  assert.equal(set.fact("pin-release", { kind: "edition" }), undefined);
  assert.deepEqual(set.all(), [bytes, share, date]);
});
