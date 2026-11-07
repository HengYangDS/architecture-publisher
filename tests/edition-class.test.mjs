import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { typesetEdition } from "../src/edition/typeset.mjs";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { POSTER, figureStyles } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { countIn, readPdf } from "./fixtures/pdf.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);
const { name } = figureStyles(POSTER.steps[0]);
const SHAPES =
  '<svg xmlns="http://www.w3.org/2000/svg" width="2256" height="1071" viewBox="0 0 2256 1071">' +
  '<rect x="20" y="20" width="300" height="80" rx="8" fill="#fbfaf6" stroke="#d6d1c4"/></svg>';

/** A plate as the engine draws one: a card's shape and its title as one run. */
function plate(page, overrides = {}) {
  const title = `Alpha ${page}`;
  return {
    page,
    views: [`view-${page}`],
    title: `View ${page}`,
    question: `What does view ${page} show?`,
    svg: SHAPES,
    runs: [
      {
        text: title,
        x: 40,
        baseline: 60,
        size: name.size,
        weight: name.weight,
        color: "#29372f",
        width: typefaces.measure(title, name),
        component: "a",
      },
    ],
    legend: [{ label: "component", shape: "boundary" }],
    ...overrides,
  };
}

const model = validateModel(
  minimalModel({
    summary: "A small system.",
    editors: [{ name: "Yang HENG" }],
    license: "MIT",
    repository: {
      name: "minimal",
      url: "https://github.com/o/minimal.git",
      revision: "a".repeat(40),
      browse: "https://github.com/o/minimal/blob/{revision}/{path}",
    },
  }),
);

/** Typeset an edition of the given plates. */
async function edition(plates, extra = {}) {
  const record = editionRecord({
    model,
    plates,
    icons,
    owned: new Map([["a", ["src/a.mjs"]]]),
    files: 1,
    modelSha256: "0".repeat(64),
    publisher: "0.10.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    commit: { date: "2026-11-06", time: 1793918078 },
    release: "v1.0.0",
  });
  return typesetEdition({
    record,
    plates,
    modelBytes: Buffer.from(JSON.stringify(model)),
    composition: null,
    revision: model.repository?.revision ?? null,
    date: "2026-11-06",
    time: 1793918078,
    widths: [2400],
    ...extra,
  });
}

test("eleven plates' contents fit one page, and seventeen continue on a second", async () => {
  const eleven = await edition(Array.from({ length: 11 }, (_, index) => plate(index + 1)));
  // Title page, one contents page, eleven plates.
  assert.equal(eleven.pages, 13);
  const seventeen = await edition(Array.from({ length: 17 }, (_, index) => plate(index + 1)));
  assert.equal(seventeen.pages, 20);
});

test("card titles link to the files they cite, and the edition names its editors and carries its model", async () => {
  const typeset = await edition([plate(1), plate(2)]);
  assert.equal(
    countIn(typeset.pdf, /https:\/\/github\.com\/o\/minimal\/blob\/a{40}\/src\/a\.mjs/gu) >= 2,
    true,
  );
  const { text } = readPdf(typeset.pdf);
  assert.match(text, /Yang HENG/u);
  assert.match(text, /pdfaid:part/u);
  assert.ok(text.includes(JSON.stringify(model)), "the model is attached byte for byte");
  assert.deepEqual(
    typeset.png.map(({ file }) => file),
    ["images/01-view-1.png", "images/02-view-2.png"],
  );
  const again = await edition([plate(1), plate(2)]);
  assert.ok(again.pdf.equals(typeset.pdf), "two editions of one commit differ");
});

test("a run set wider than the engine measured it, and a title wider than its line, are refused", async () => {
  await assert.rejects(
    edition([plate(1, { runs: [{ ...plate(1).runs[0], width: 10 }] })]),
    (error) => error.code === "edition_text_wider",
  );
  await assert.rejects(
    edition([plate(1, { title: "A title far too long ".repeat(8).trim() })]),
    (error) => error.code === "edition_title_too_long",
  );
});
