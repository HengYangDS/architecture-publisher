import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";
import { editionFacts } from "../src/facts/edition.mjs";
import { citedFiles, hubOf } from "../src/facts/view.mjs";

const DAY = 86400;
const PIN = Object.freeze({ date: "2026-11-10", time: 2000 * DAY, release: null });

/** Three relations that cite files, two of them one file in common, and one that cites none. */
const model = {
  components: ["a", "b", "c", "m1", "m2", "bare"].map((id) => ({ id })),
  groups: [{ id: "g", members: ["m1", "m2"] }],
  relations: [
    { id: "r1", from: "a", to: "b", files: ["x.js", "y.js"] },
    { id: "r2", from: "a", to: "c", files: ["y.js", "z.js"] },
    { id: "r3", from: "b", to: "c", files: [] },
  ],
};

/** A binding read at the pin: `a` holds a new file, `b` an old one, the group's members a middling and an old one. */
const owned = {
  a: [["a.js", 100, 1]],
  b: [["b.js", 100, 400]],
  c: [["c.js", 100, 2]],
  m1: [["m1.js", 100, 30]],
  m2: [["m2.js", 100, 400]],
  bare: [],
};
const files = Object.values(owned).flat();
const verified = {
  state: "verified",
  records: files.map(([path, bytes]) => ({ path, bytes })),
  owned: new Map(Object.entries(owned).map(([id, own]) => [id, own.map(([path]) => path)])),
  times: new Map(files.map(([path, , days]) => [path, PIN.time - days * DAY])),
};
const unverified = {
  state: "unverified",
  records: files.map(([path]) => ({ path, bytes: null })),
  owned: verified.owned,
  times: new Map(),
};

const facts = editionFacts(model, verified, PIN);
const viewOf = (id, components, relations) => ({
  id,
  components: components.map((component) =>
    typeof component === "string" ? { id: component } : component,
  ),
  relations,
});
/** Relations that end at the given parts, each from a part of its own, citing nothing. */
const ending = (...tos) =>
  tos.map((to, index) => ({ id: `e${index}`, from: `s${index}`, to, files: [] }));

/** A fact measured from the model. */
const modelled = (property, of, value, unit) => ({
  property,
  of,
  value,
  unit,
  origin: "measured",
  from: "model",
});
const relation = (id) => ({ kind: "relation", id });
const view = (id) => ({ kind: "view", id });

test("a view without relations holds no hub and no cited files", () => {
  const held = facts.view(viewOf("v", ["a"], []));
  assert.deepEqual(held.fact("hub", view("v")), modelled("hub", view("v"), null, "part"));
  assert.equal(held.hub, null);
  assert.deepEqual(
    held.all().map(({ property }) => property),
    ["hub", "bands-shown"],
  );
});

test("a relation holds the number of files it cites, and 0 when it cites none", () => {
  const held = facts.view(viewOf("v", ["a", "b", "c"], model.relations));
  assert.deepEqual(
    held.fact("cited-files", relation("r3")),
    modelled("cited-files", relation("r3"), 0, "files"),
  );
  assert.deepEqual(
    held.fact("cited-files", relation("r1")),
    modelled("cited-files", relation("r1"), 2, "files"),
  );
  assert.deepEqual(
    model.relations.map((one) => held.cited(one)),
    [2, 2, 0],
  );
  // A relation is known by its id, and one the view does not hold has no count.
  assert.equal(held.cited({ id: "r1" }), 2);
  assert.equal(held.cited({ id: "elsewhere" }), undefined);
});

test("an overview's relation holds every file the relations it stands for cite, each once", () => {
  const both = { id: "overview-1", from: "a", to: "g", files: [], relations: ["r1", "r2"] };
  const lost = { id: "overview-2", from: "g", to: "a", files: [], relations: ["r1", "missing"] };
  const held = facts.view(viewOf("overview", ["a", { id: "g", group: true }], [both, lost]));
  assert.deepEqual(
    held.fact("cited-files", relation("overview-1")),
    modelled("cited-files", relation("overview-1"), 3, "files"),
  );
  assert.equal(held.cited(both), 3);
  assert.equal(held.cited(lost), 2);
  assert.equal(citedFiles(model, both), 3);
  assert.equal(citedFiles(model, { files: ["x"] }), 1);
});

test("the part three relations end at, and fewer at every other, is the view's hub", () => {
  const held = facts.view(viewOf("v", ["h", "b"], ending("h", "h", "h", "b")));
  assert.deepEqual(held.fact("hub", view("v")), modelled("hub", view("v"), "h", "part"));
  assert.equal(held.hub, "h");
  assert.equal(hubOf({ relations: ending("b", "h", "h", "b", "h") }), "h");
});

test("a tie, and two relations ending at one part, make no hub", () => {
  const tie = facts.view(viewOf("tie", ["h", "g"], ending("h", "h", "h", "g", "g", "g")));
  assert.equal(tie.hub, null);
  assert.equal(tie.fact("hub", view("tie")).value, null);
  const pairs = facts.view(viewOf("pairs", ["h", "g"], ending("h", "h", "g", "g")));
  assert.equal(pairs.hub, null);
  assert.equal(facts.view(viewOf("two", ["h"], ending("h", "h"))).hub, null);
});

test("a view holds the age bands its parts' files fall in", () => {
  const held = facts.view(viewOf("v", ["a", "b", "bare"], []));
  assert.deepEqual(held.fact("bands-shown", view("v")), {
    property: "bands-shown",
    of: view("v"),
    value: [0, 2],
    unit: "bands",
    origin: "measured",
    from: "pin",
  });
  assert.deepEqual([...held.bands].sort(), [0, 2]);
  // A group the overview draws shows its members' bands; a part without files shows none.
  const overview = facts.view(viewOf("overview", [{ id: "g", group: true }, "c"], []));
  assert.deepEqual(overview.fact("bands-shown", view("overview")).value, [0, 1, 2]);
  const empty = facts.view(viewOf("empty", ["bare"], []));
  assert.deepEqual(empty.fact("bands-shown", view("empty")).value, []);
  assert.equal(empty.bands.size, 0);
});

test("without a checkout a view holds its hub and its relations' cited files, and no band", () => {
  const unread = editionFacts(model, unverified, null);
  const held = unread.view(viewOf("v", ["a", "b", "c"], [...model.relations, ...ending("c", "c")]));
  assert.deepEqual(held.fact("hub", view("v")), modelled("hub", view("v"), "c", "part"));
  assert.deepEqual(
    held.fact("cited-files", relation("r2")),
    modelled("cited-files", relation("r2"), 2, "files"),
  );
  assert.equal(held.fact("bands-shown", view("v")), undefined);
  assert.equal(held.bands.size, 0);
  assert.ok(held.all().every(({ origin, from }) => origin === "measured" && from === "model"));
});

test("a view asked twice is measured once, and a view's facts are of the catalogue alone", () => {
  const one = viewOf("v", ["a"], model.relations);
  assert.equal(facts.view(one), facts.view(one));
  const other = viewOf("v", ["a"], model.relations);
  assert.notEqual(facts.view(other), facts.view(one));
  assert.deepEqual(facts.view(other).all(), facts.view(one).all());
  assert.throws(
    () => facts.view(one).fact("coverage", view("v")),
    (error) => error instanceof RangeError && error.message.includes("coverage"),
  );
});

test("an overview's relation that stands for several holds their files as cited, and no fact of their number", () => {
  // Three relations of the model that cite four files, one of them twice.
  const wider = {
    ...model,
    relations: [...model.relations, { id: "r4", from: "b", to: "a", files: ["w.js"] }],
  };
  const standing = {
    id: "overview-1",
    from: "a",
    to: "g",
    files: [],
    relations: ["r1", "r2", "r4"],
  };
  const held = editionFacts(wider, verified, PIN).view(
    viewOf("several", ["a", { id: "g", group: true }], [standing]),
  );
  assert.deepEqual(
    held.fact("cited-files", relation("overview-1")),
    modelled("cited-files", relation("overview-1"), 4, "files"),
  );
  assert.equal(held.cited(standing), 4);
  // The number of relations it stands for is the plan's, written into the planned relation's details: the layer
  // holds one fact of the relation, its cited files, and the catalogue lists no other property of a relation.
  assert.deepEqual(
    held.all().filter(({ of }) => of.kind === "relation"),
    [modelled("cited-files", relation("overview-1"), 4, "files")],
  );
  assert.deepEqual(
    CATALOGUE.filter(({ of }) => of.includes("relation")).map(({ property }) => property),
    ["cited-files"],
  );
});
