import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";
import { editionFacts } from "../src/facts/edition.mjs";

const DAY = 86400;

/** The pin's commit facts, as the build reads them once. */
const PIN = Object.freeze({ date: "2026-11-10", time: 2000 * DAY, release: "v1.2.0" });

const EDITION = { kind: "edition" };
const part = (id) => ({ kind: "part", id });
const group = (id) => ({ kind: "group", id });
const file = (id, owner) => ({ kind: "file", id, part: owner });

/** A fact measured at the pin. */
const pinned = (property, of, value, unit) => ({
  property,
  of,
  value,
  unit,
  origin: "measured",
  from: "pin",
});

/** A fact the author stated. */
const stated = (property, of, value, unit) => ({
  property,
  of,
  value,
  unit,
  origin: "stated",
  from: null,
});

/** A model of the parts a binding names, with its groups; a part claims the files it owns unless `claims` says otherwise. */
const modelOf = (binding, groups = [], claims = {}) => ({
  components: [...binding.owned.keys()].map((id) => ({
    id,
    files: claims[id] ?? binding.owned.get(id),
  })),
  groups,
  relations: [],
});

/**
 * A binding read at the pin: each part's files in claim order, each as its path, its bytes and the days from its
 * last change to the pin, and the files relations cite that no part owns.
 */
function bound(parts, cited = []) {
  const files = [...Object.values(parts).flat(), ...cited];
  return {
    state: "verified",
    records: files
      .map(([path, bytes]) => ({ path, bytes }))
      .sort((a, b) => (a.path < b.path ? -1 : 1)),
    owned: new Map(Object.entries(parts).map(([id, own]) => [id, own.map(([path]) => path)])),
    times: new Map(files.map(([path, , days]) => [path, PIN.time - days * DAY])),
  };
}

/** A binding without a checkout: each part's declared paths, unread. */
const declared = (parts) => ({
  state: "unverified",
  records: Object.values(parts)
    .flat()
    .sort()
    .map((path) => ({ path, bytes: null })),
  owned: new Map(Object.entries(parts)),
  times: new Map(),
});

const layer = (binding, groups, commit = PIN) =>
  editionFacts(modelOf(binding, groups), binding, commit);

test("a part that owns two files holds them, their bytes and their shares in path order", () => {
  const facts = layer(
    bound({
      a: [
        ["src/b.js", 1000, 1],
        ["src/a.js", 3000, 1],
      ],
    }),
  );
  // Ownership is held in claim order, as the binding resolved it: the first file is the one a title links to.
  assert.deepEqual(
    facts.fact("owned-files", part("a")),
    pinned("owned-files", part("a"), ["src/b.js", "src/a.js"], "paths"),
  );
  assert.deepEqual(facts.owned("a"), ["src/b.js", "src/a.js"]);
  assert.deepEqual(
    facts.fact("owned-bytes", part("a")),
    pinned("owned-bytes", part("a"), 4000, "bytes"),
  );
  assert.deepEqual(
    facts.fact("file-share", file("src/a.js", "a")),
    pinned("file-share", file("src/a.js", "a"), 0.75, "ratio"),
  );
  assert.deepEqual(
    facts.fact("file-share", file("src/b.js", "a")),
    pinned("file-share", file("src/b.js", "a"), 0.25, "ratio"),
  );
  // The part as a strip draws it: its files in path order, each with its bytes, band and share.
  assert.deepEqual(facts.part({ id: "a" }), {
    bytes: 4000,
    files: [
      { path: "src/a.js", bytes: 3000, band: 0, share: 0.75 },
      { path: "src/b.js", bytes: 1000, band: 0, share: 0.25 },
    ],
  });
});

test("the edition holds its largest part, its pin's date and release and the files read", () => {
  const facts = layer(bound({ a: [["a.js", 4000, 1]], b: [["b.js", 700, 1]] }));
  assert.deepEqual(
    facts.fact("largest-part", EDITION),
    pinned("largest-part", EDITION, 4000, "bytes"),
  );
  assert.deepEqual(
    facts.fact("pin-date", EDITION),
    pinned("pin-date", EDITION, "2026-11-10", "date"),
  );
  assert.deepEqual(
    facts.fact("pin-release", EDITION),
    pinned("pin-release", EDITION, "v1.2.0", "release"),
  );
  assert.deepEqual(facts.fact("files-read", EDITION), pinned("files-read", EDITION, 2, "files"));
  assert.deepEqual(
    [facts.scale, facts.date, facts.release, facts.read],
    [4000, "2026-11-10", "v1.2.0", 2],
  );
  assert.deepEqual(facts.spans, [7 * DAY, 90 * DAY]);
});

test("a part that owns no files holds 0 files and no bytes, share or band", () => {
  const facts = layer(bound({ a: [["a.js", 10, 1]], b: [] }));
  assert.deepEqual(
    facts.fact("owned-files", part("b")),
    pinned("owned-files", part("b"), [], "paths"),
  );
  assert.equal(facts.fact("owned-bytes", part("b")), undefined);
  assert.deepEqual(
    facts.all().filter(({ of }) => of.part === "b"),
    [],
  );
  assert.deepEqual(facts.owned("b"), []);
  // A strip draws it as the empty outline, as it draws a part the binding does not name.
  assert.deepEqual(facts.part({ id: "b" }), { bytes: 0, files: [] });
  assert.deepEqual(facts.part({ id: "unnamed" }), { bytes: 0, files: [] });
  assert.deepEqual(facts.owned("unnamed"), []);
});

test("two parts of equal size hold the same bytes, and the largest part is as large", () => {
  const facts = layer(bound({ a: [["a.js", 5000, 1]], b: [["b.js", 5000, 400]] }));
  for (const id of ["a", "b"])
    assert.deepEqual(
      facts.fact("owned-bytes", part(id)),
      pinned("owned-bytes", part(id), 5000, "bytes"),
    );
  assert.deepEqual(
    facts.fact("largest-part", EDITION),
    pinned("largest-part", EDITION, 5000, "bytes"),
  );
});

test("a part of empty files shares its strip evenly, on a scale of one byte at least", () => {
  const facts = layer(
    bound({
      a: [
        ["x.js", 0, 1],
        ["y.js", 0, 1],
      ],
    }),
  );
  assert.deepEqual(
    facts.fact("owned-bytes", part("a")),
    pinned("owned-bytes", part("a"), 0, "bytes"),
  );
  assert.deepEqual(
    facts.part({ id: "a" }).files.map(({ share }) => share),
    [0.5, 0.5],
  );
  assert.equal(facts.fact("largest-part", EDITION).value, 1);
  assert.equal(facts.scale, 1);
});

test("files changed one, thirty and four hundred days before the pin fall in three bands, one after it in the newest", () => {
  const facts = layer(
    bound({
      a: [
        ["day.js", 10, 1],
        ["month.js", 10, 30],
        ["year.js", 10, 400],
        ["ahead.js", 10, -1],
      ],
    }),
  );
  const band = (name) => facts.fact("file-age-band", file(name, "a"));
  assert.deepEqual(band("day.js"), pinned("file-age-band", file("day.js", "a"), 0, "band"));
  assert.deepEqual(
    ["day.js", "month.js", "year.js", "ahead.js"].map((name) => band(name).value),
    [0, 1, 2, 0],
  );
  assert.deepEqual(
    facts.part({ id: "a" }).files.map(({ path, band: dye }) => [path, dye]),
    [
      ["ahead.js", 0],
      ["day.js", 0],
      ["month.js", 1],
      ["year.js", 2],
    ],
  );
});

test("a file a relation cites and no part owns falls in no band, and no strip shows it", () => {
  const facts = layer(bound({ a: [["a.js", 100, 1]] }, [["cited.js", 900, 400]]));
  assert.deepEqual(
    facts.all().filter(({ of }) => of.id === "cited.js"),
    [],
  );
  assert.deepEqual(
    facts.part({ id: "a" }).files.map(({ path }) => path),
    ["a.js"],
  );
  // It was read, and it is no part's size.
  assert.deepEqual(facts.fact("files-read", EDITION), pinned("files-read", EDITION, 2, "files"));
  assert.deepEqual(
    facts.fact("largest-part", EDITION),
    pinned("largest-part", EDITION, 100, "bytes"),
  );
});

test("a group the overview draws holds its members' files in path order and their bytes together", () => {
  const groups = [
    { id: "g", members: ["m1", "m2"] },
    { id: "h", members: ["m1", "nobody"] },
    { id: "e", members: ["empty"] },
  ];
  const facts = layer(
    bound({
      m1: [["lib/z.js", 2000, 1]],
      m2: [["lib/a.js", 3000, 400]],
      solo: [["s.js", 100, 1]],
      empty: [],
    }),
    groups,
  );
  assert.deepEqual(
    facts.fact("owned-files", group("g")),
    pinned("owned-files", group("g"), ["lib/a.js", "lib/z.js"], "paths"),
  );
  assert.deepEqual(
    facts.fact("owned-bytes", group("g")),
    pinned("owned-bytes", group("g"), 5000, "bytes"),
  );
  assert.deepEqual(facts.part({ id: "g", group: true }), {
    bytes: 5000,
    files: [
      { path: "lib/a.js", bytes: 3000, band: 2, share: 0.6 },
      { path: "lib/z.js", bytes: 2000, band: 0, share: 0.4 },
    ],
  });
  // A file's share is of the part it is drawn in: of its group in the overview, of its own part elsewhere.
  assert.equal(facts.fact("file-share", file("lib/a.js", "g")).value, 0.6);
  assert.equal(facts.fact("file-share", file("lib/a.js", "m2")).value, 1);
  assert.equal(facts.fact("file-age-band", file("lib/a.js", "g")).value, 2);
  // The group is larger than any part, so every strip is measured on it.
  assert.equal(facts.fact("largest-part", EDITION).value, 5000);
  assert.equal(facts.scale, 5000);
  // A group has no file of its own for a title to link to, and is a group only where a view draws it as one.
  assert.deepEqual(facts.owned("g"), []);
  assert.deepEqual(facts.part({ id: "g" }), { bytes: 0, files: [] });
  // A member the binding does not name adds nothing; a group whose members own nothing holds no bytes.
  assert.deepEqual(facts.fact("owned-files", group("h")).value, ["lib/z.js"]);
  assert.equal(facts.fact("owned-bytes", group("h")).value, 2000);
  assert.deepEqual(facts.fact("owned-files", group("e")).value, []);
  assert.equal(facts.fact("owned-bytes", group("e")), undefined);
  assert.deepEqual(facts.part({ id: "e", group: true }), { bytes: 0, files: [] });
});

test("a build without a checkout holds the declared paths as stated and nothing measured at the pin", () => {
  const binding = declared({ a: ["src/b.js", "src/a.js"], b: [] });
  const facts = layer(binding, [{ id: "g", members: ["a", "b"] }], null);
  assert.deepEqual(
    facts.fact("owned-files", part("a")),
    stated("owned-files", part("a"), ["src/b.js", "src/a.js"], "paths"),
  );
  assert.deepEqual(
    facts.fact("owned-files", group("g")),
    stated("owned-files", group("g"), ["src/a.js", "src/b.js"], "paths"),
  );
  assert.deepEqual(facts.fact("files-read", EDITION), stated("files-read", EDITION, 2, "files"));
  // What the catalogue says of each property without a checkout is what the layer holds.
  for (const { property, unpinned } of CATALOGUE.filter(({ from }) => from === "pin")) {
    const held = facts.all().filter((fact) => fact.property === property);
    if (unpinned === "absent") assert.deepEqual(held, [], property);
    else assert.ok(held.length > 0 && held.every(({ origin }) => origin === "stated"), property);
  }
  // No zero and no default stands where nothing was measured.
  assert.deepEqual(
    [facts.part({ id: "a" }), facts.scale, facts.date, facts.release],
    [null, null, null, null],
  );
  assert.equal(facts.part({ id: "g", group: true }), null);
  assert.deepEqual(facts.owned("a"), ["src/b.js", "src/a.js"]);
  assert.equal(facts.read, 2);
});

test("a build without a checkout holds a claimed directory as its author stated it", () => {
  // The binding names only the files a part claims by name; the directory is the author's claim all the same.
  const binding = declared({ a: ["src/style.mjs"], b: [] });
  const model = modelOf(binding, [{ id: "g", members: ["a", "b"] }], {
    a: ["src/poster/", "src/style.mjs"],
    b: ["docs/"],
  });
  const facts = editionFacts(model, binding, null);
  assert.deepEqual(
    facts.fact("owned-files", part("a")),
    stated("owned-files", part("a"), ["src/poster/", "src/style.mjs"], "paths"),
  );
  assert.deepEqual(
    facts.fact("owned-files", part("b")),
    stated("owned-files", part("b"), ["docs/"], "paths"),
  );
  assert.deepEqual(
    facts.fact("owned-files", group("g")),
    stated("owned-files", group("g"), ["docs/", "src/poster/", "src/style.mjs"], "paths"),
  );
  // What a projection can link to stays the files claimed by name.
  assert.deepEqual([facts.owned("a"), facts.owned("b")], [["src/style.mjs"], []]);
});

test("a checkout whose model claims no file holds the pin and no part's bytes", () => {
  const binding = {
    state: "none",
    records: [],
    owned: new Map([["a", []]]),
    times: new Map(),
  };
  const facts = layer(binding, [], PIN);
  assert.deepEqual(
    facts.fact("pin-date", EDITION),
    pinned("pin-date", EDITION, "2026-11-10", "date"),
  );
  assert.deepEqual(
    facts.fact("pin-release", EDITION),
    pinned("pin-release", EDITION, "v1.2.0", "release"),
  );
  assert.deepEqual(
    facts.fact("owned-files", part("a")),
    stated("owned-files", part("a"), [], "paths"),
  );
  assert.deepEqual(facts.fact("files-read", EDITION), stated("files-read", EDITION, 0, "files"));
  assert.equal(facts.fact("owned-bytes", part("a")), undefined);
  assert.equal(facts.fact("largest-part", EDITION), undefined);
  assert.deepEqual(
    [facts.date, facts.release, facts.scale, facts.part({ id: "a" }), facts.read],
    ["2026-11-10", "v1.2.0", null, null, 0],
  );
});

test("a pin that no release names is held as measured, with no release", () => {
  const facts = layer(bound({ a: [["a.js", 10, 1]] }), [], { ...PIN, release: null });
  assert.deepEqual(
    facts.fact("pin-release", EDITION),
    pinned("pin-release", EDITION, null, "release"),
  );
  assert.equal(facts.release, null);
});

test("a checkout whose parts own no file holds no largest part", () => {
  const facts = layer(bound({ a: [] }, [["cited.js", 900, 400]]));
  assert.equal(facts.fact("largest-part", EDITION), undefined);
  assert.equal(facts.scale, null);
  assert.deepEqual(facts.part({ id: "a" }), { bytes: 0, files: [] });
});

test("every fact the layer holds is of a property the catalogue lists, in its unit, and another is refused", () => {
  const facts = layer(bound({ a: [["a.js", 10, 1]], b: [] }), [{ id: "g", members: ["a"] }]);
  const rows = new Map(CATALOGUE.map((row) => [row.property, row]));
  assert.ok(facts.all().length > 0);
  for (const fact of facts.all()) {
    const row = rows.get(fact.property);
    assert.ok(row, fact.property);
    assert.ok(row.of.includes(fact.of.kind), `${fact.property} of ${fact.of.kind}`);
    assert.deepEqual([fact.unit, fact.origin, fact.from], [row.unit, "measured", row.from]);
  }
  assert.throws(
    () => facts.fact("coverage", EDITION),
    (error) => error instanceof RangeError && error.message.includes("coverage"),
  );
});
