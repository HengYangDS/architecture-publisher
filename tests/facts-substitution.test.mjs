import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { editionWordsOf } from "../src/edition/words.mjs";
import { diagramCandidates } from "../src/map/archify.mjs";
import { explainerDraft } from "../src/map/explainer.mjs";
import { validateModel } from "../src/model/load.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  icons,
  INDIGO,
  part,
  stripStyle,
  files,
  platesIn,
  wiresOf,
  arrowsOf,
  countsOf,
  stripOf,
  lengthOf,
} from "./fixtures/strips.mjs";

// Substitution: a plate, the edition's record and the page's draft show what the layer holds, whatever the model and
// the binding would give. Each is built here from a layer with deliberately false values.

const REVISION = "a".repeat(40);

/** Two relations end at Beta and one at each other part, so the model has no hub; `ac` names no file. */
const model = validateModel(
  minimalModel({
    repository: {
      name: "minimal",
      url: "https://example.invalid/minimal.git",
      revision: REVISION,
      browse: "https://example.invalid/minimal/blob/{revision}/{path}",
    },
    components: [
      { id: "a", label: "Alpha", files: ["src/a.mjs"] },
      { id: "b", label: "Beta", files: ["src/b.mjs"] },
      { id: "c", label: "Gamma", files: ["src/c.mjs"] },
      { id: "d", label: "Delta" },
    ],
    relations: [
      { id: "ab", from: "a", to: "b", label: "calls", files: files(2) },
      { id: "cb", from: "c", to: "b", label: "reads", files: files(1) },
      { id: "ac", from: "a", to: "c", label: "starts" },
      { id: "cd", from: "c", to: "d", label: "writes", files: files(1) },
    ],
  }),
);

/** Alpha's one file holds 100000 bytes, the edition's largest part. */
const parts = new Map([
  ["a", part([["src/a.mjs", 100000, 0]])],
  ["b", part([["src/b.mjs", 50000, 1]])],
  ["c", part([["src/c.mjs", 20000, 2]])],
]);

const measured = stripStyle(INDIGO, parts);
const held = measured.facts;

/**
 * The layer with four false values: Beta as the hub of every view, nine files cited by `ac`, 1000 bytes for
 * Alpha, and another first file for Alpha, with another count of files read, date and release for the edition.
 */
const falsified = {
  ...held,
  part: (component) =>
    component.id === "a" ? { ...held.part(component), bytes: 1000 } : held.part(component),
  owned: (id) => (id === "a" ? ["docs/other.md", "src/a.mjs"] : held.owned(id)),
  read: 7,
  date: "2001-02-03",
  release: "v9.9.9",
  view: (view) => {
    const seen = held.view(view);
    return {
      ...seen,
      hub: "b",
      cited: (relation) => (relation.id === "ac" ? 9 : seen.cited(relation)),
    };
  },
};

const {
  views,
  plates: [plate],
} = await platesIn(model, { ...measured, facts: falsified });

test("a plate drawn from a false hub draws the lines into it heavy, and its key names it", () => {
  assert.equal(held.view(views[0]).hub, null, "the model's relations give the view no hub");
  const heavy = wiresOf(plate.svg).filter(({ stroke }) => stroke === INDIGO.dye.old);
  assert.ok(heavy.length >= 1, "no line is drawn into the layer's hub");
  assert.ok(heavy.every(({ width }) => width === 3.2));
  assert.ok(arrowsOf(plate.svg).some(({ fill }) => fill === INDIGO.dye.old));
  assert.deepEqual(
    plate.legend.filter(({ shape }) => shape === "hub").map(({ label }) => label),
    ["heavy lines lead to Beta"],
  );
});

test("a plate drawn from a false count sets it by the relation's line", () => {
  assert.equal(
    held.view(views[0]).cited({ id: "ac" }),
    0,
    "the model names no file for the relation",
  );
  assert.ok(
    countsOf(plate)
      .map(({ text }) => text)
      .includes("9"),
    "the line carries the model's count, not the layer's",
  );
});

test("a plate drawn from a false size shows it in the part's strip and caption", () => {
  assert.equal(held.part({ id: "a" }).bytes, 100000, "the part's files hold 100000 bytes");
  const texts = plate.runs.map(({ text }) => text);
  assert.ok(texts.includes("1 file, 1 KB"), "the caption gives the files' bytes, not the layer's");
  // 1000 bytes on a scale of 100000, at the longest strip's 320 px.
  assert.ok(Math.abs(lengthOf(stripOf(plate, "a")) - 3.2) <= 0.15);
});

test("the edition's record takes a part's first file, the files read, the date and the release from the layer", () => {
  const record = editionRecord({
    model,
    plates: [plate],
    icons,
    facts: falsified,
    modelSha256: "0".repeat(64),
    publisher: "0.14.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    time: 1_794_000_000,
  });
  assert.equal(
    record.plates[0].links.a,
    `https://example.invalid/minimal/blob/${REVISION}/docs/other.md`,
  );
  const words = editionWordsOf(model.locale);
  assert.ok(record.facts.some(({ value }) => value === words.readValue(7)));
  assert.equal(record.subject.date, "2001-02-03");
  assert.equal(record.words.foot, words.foot(model.title, "v9.9.9", "aaaaaaa", "2001-02-03"));
});

test("the page's draft cites the first file the layer holds for a part", () => {
  const diagrams = views.map((view) => diagramCandidates(model, view)[0]);
  const { cited } = explainerDraft(model, views, diagrams, new Set(), falsified.owned);
  assert.equal(cited[0], "docs/other.md");
  assert.ok(!cited.includes("src/a.mjs"));
});
