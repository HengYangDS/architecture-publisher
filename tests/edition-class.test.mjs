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
import { inkLines, readPng } from "./fixtures/png.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);
const { name, detail } = figureStyles(POSTER.steps[0]);
const SHAPES =
  '<svg xmlns="http://www.w3.org/2000/svg" width="2256" height="1071" viewBox="0 0 2256 1071">' +
  '<rect x="20" y="20" width="300" height="80" rx="8" fill="#fbfaf6" stroke="#d6d1c4"/></svg>';

/** A plate as the engine draws one: a card's shape and its title as one run. */
function plate(page, overrides = {}) {
  const title = `Alpha ${page}`;
  return {
    page,
    views: [`view-${page}`],
    width: 2256,
    share: 1,
    reading: "none",
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

/**
 * The test model, with Alpha's own fields.
 * @param {Record<string, unknown>} alpha
 */
const modelWith = (alpha) =>
  validateModel(
    minimalModel({
      summary: "A small system.",
      components: [
        { id: "a", label: "Alpha", ...alpha },
        { id: "b", label: "Beta" },
      ],
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
const model = modelWith({ files: ["src/a.mjs"] });

/** Typeset an edition of the given plates, of the test model unless another is given. */
async function edition(plates, extra = {}, subject = model) {
  const record = editionRecord({
    model: subject,
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
    modelBytes: Buffer.from(JSON.stringify(subject)),
    composition: null,
    revision: subject.repository?.revision ?? null,
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

test("without a checkout the foot names the title and revision and no date, and without a repository the title alone", () => {
  const record = (input) =>
    editionRecord({
      plates: [],
      icons,
      owned: new Map(),
      files: 0,
      modelSha256: "0".repeat(64),
      publisher: "0.10.0",
      typst: "0.15.1",
      overview: false,
      page: "minimal.html",
      commit: null,
      release: null,
      ...input,
    });
  const pinned = record({ model });
  assert.equal(pinned.words.foot, "Minimal at aaaaaaa");
  assert.equal(pinned.words.built, "As built at aaaaaaa");
  const unpinned = record({ model: validateModel(minimalModel()) });
  assert.equal(unpinned.words.foot, "Minimal");
  assert.equal(unpinned.words.built, null);
  assert.equal(unpinned.byline[0].note, null);
});

test("a narrowed plate sets its view's summary and where each component lives, and a summary taller than the body is refused", async () => {
  const summary = "Alpha calls Beta, and Beta answers it.";
  const narrowed = (text) => plate(1, { share: 0.65, width: 1466, reading: "set", summary: text });
  const record = editionRecord({
    model,
    plates: [narrowed(summary)],
    icons,
    owned: new Map([["a", ["src/a.mjs"]]]),
    files: 1,
    modelSha256: "0".repeat(64),
    publisher: "0.10.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    commit: null,
    release: null,
  });
  const [set] = record.plates;
  assert.deepEqual(
    [set.figureWidth, set.summary, set.places],
    [1466, summary, [{ label: "Alpha", files: ["src/a.mjs"] }]],
  );
  assert.equal(record.words.places, "Where it lives");
  assert.equal((await edition([narrowed(summary)])).pages, 3);
  await assert.rejects(
    edition([narrowed("A sentence of the summary, at its length. ".repeat(48).trim())]),
    (error) =>
      error.code === "edition_reading_too_long" &&
      error.problems.some(({ message }) => /View 1/u.test(message)),
  );
});

test("a reading whose paths do not fit beside its summary sets the summary alone, and paths beside no summary are refused", async () => {
  const narrowed = plate(1, {
    share: 0.65,
    width: 1466,
    reading: "set",
    summary: "Alpha calls Beta, and Beta answers it.",
  });
  const many = modelWith({
    files: Array.from({ length: 400 }, (_, index) => `src/part-${index}/alpha.mjs`),
  });
  const [alone] = (await edition([narrowed], {}, many)).png;
  const [bare] = (await edition([narrowed], {}, modelWith({}))).png;
  assert.ok(
    alone.bytes.equals(bare.bytes),
    "the plate set paths that do not fit beside its summary",
  );
  await assert.rejects(
    edition([{ ...narrowed, summary: undefined }], {}, many),
    (error) => error.code === "edition_reading_too_long",
  );
});

test("a summary above its figure is set in its lines at the claim column, and the figure below it", async () => {
  const lines = ["Alpha calls Beta, and Beta answers it with", "the result it has stored."];
  const above = plate(1, {
    reading: "above",
    summary: lines.join(" "),
    standfirst: { lines },
    height: 1071 - (2 * 24 + 16) * 1.5,
  });
  const record = editionRecord({
    model,
    plates: [above],
    icons,
    owned: new Map([["a", ["src/a.mjs"]]]),
    files: 1,
    modelSha256: "0".repeat(64),
    publisher: "0.11.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    commit: null,
    release: null,
  });
  const [set] = record.plates;
  assert.deepEqual(
    [set.standfirst, set.summary, set.places, set.figureHeight],
    [lines, lines.join(" "), [], 1071 - 96],
  );
  const typeset = await edition([above]);
  assert.equal(typeset.pages, 3);
  // The same plate without its summary differs: the summary is set, and the figure moves down.
  const [bare] = (await edition([plate(1)])).png;
  assert.ok(!typeset.png[0].bytes.equals(bare.bytes));
  // A line Typst sets wider than the engine measured is refused, as for figure text.
  await assert.rejects(
    edition([{ ...above, standfirst: { lines: ["W".repeat(80)] } }]),
    (error) => error.code === "edition_text_wider",
  );
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

/** A 2400 px page image's pixels per point, and the edition's body in points. */
const PX = 2400 / 1600;
const BODY = { top: 112, bottom: 826, right: 1600 - 48 };

/** How far apart the right ends of every line but the last lie, and how short the last falls. */
function edges(lines) {
  const rights = lines.slice(0, -1).map(({ right }) => right);
  return {
    spread: Math.max(...rights) - Math.min(...rights),
    short: Math.max(...rights) - lines.at(-1).right,
  };
}

test("a summary beside its figure is justified at any column width, its last line short", async () => {
  const summary =
    "Alpha calls Beta, and Beta answers it with the result it has stored. The reviewer reads the answer beside the figure and accepts the delivery by name.";
  // At 80 percent of the body the reading column holds about 15 em, where the summary used to be set flush left.
  const narrowed = plate(1, { share: 0.8, width: 1805, reading: "set", summary });
  const [page] = (await edition([narrowed], {}, modelWith({}))).png;
  const lines = inkLines(readPng(page.bytes), {
    left: Math.round((48 + 1805 / PX + 40) * PX),
    right: 2400,
    top: BODY.top * PX,
    bottom: BODY.bottom * PX,
  });
  assert.ok(lines.length >= 4, `the summary set ${lines.length} lines`);
  const { spread, short } = edges(lines);
  assert.ok(spread <= 6, `the lines end ${spread} px apart`);
  assert.ok(short > 30, "the last line is set short, not stretched");
});

test("a summary above its figure is justified within the house measure in no more lines than were reserved", async () => {
  const lines = [
    "Alpha calls Beta, and Beta answers it with the result it has stored,",
    "which the reviewer reads above the full-width figure before accepting",
    "the delivery by name and publishing it under its version to the root",
    "that the reviewer names.",
  ];
  const above = plate(1, {
    reading: "above",
    summary: lines.join(" "),
    standfirst: { lines },
    height: 1071 - (lines.length * 24 + 16) * PX,
  });
  const [page] = (await edition([above])).png;
  const set = inkLines(readPng(page.bytes), {
    left: 0,
    right: 2400,
    top: BODY.top * PX,
    bottom: (BODY.top + 24 + lines.length * 24 - 12) * PX,
  });
  assert.ok(
    set.length >= 3 && set.length <= lines.length,
    `the summary set ${set.length} lines: ${JSON.stringify(set)}`,
  );
  const { spread, short } = edges(set);
  assert.ok(spread <= 6, `the lines end ${spread} px apart`);
  assert.ok(short > 30, "the last line is set short, not stretched");
  // A summary that would need more lines than were reserved keeps the publisher's own lines, flush left.
  const kept = ["Alpha calls Beta."];
  const [fallback] = (
    await edition([{ ...above, standfirst: { lines: kept }, height: 1071 - (24 + 16) * PX }])
  ).png;
  const [plain] = (
    await edition([
      { ...above, summary: kept[0], standfirst: { lines: kept }, height: 1071 - (24 + 16) * PX },
    ])
  ).png;
  assert.ok(fallback.bytes.equals(plain.bytes));
});

test("a run that holds pairs Typst kerns apart is set within the width the engine measured", async () => {
  // An opening bracket before a j, and a period before one, are kerned apart; a run of them was refused as wider.
  const text = "format: (json), package.json";
  const run = {
    ...plate(1).runs[0],
    text,
    size: detail.size,
    weight: detail.weight,
    width: typefaces.measure(text, detail),
  };
  const typeset = await edition([plate(1, { runs: [run] })]);
  assert.ok(typeset.png.length >= 1);
});

test("a run that names a measure is spread to it, one already as wide is set as it is, and one wider is refused", async () => {
  const chinese = validateModel(minimalModel({ locale: "zh-CN", editors: [{ name: "衡阳" }] }));
  const line = "编排：每个视图排成图册正文区的一幅图版";
  const natural = typefaces.measure(line, detail);
  const run = (baseline, extra) => ({
    text: line,
    x: 40,
    baseline,
    size: detail.size,
    weight: detail.weight,
    color: "#29372f",
    width: natural,
    ...extra,
  });
  // Three lines of one text: flush left, spread to a measure a twelfth wider, and with a measure it already fills,
  // to within the half point the class allows any run.
  const measure = Math.round(natural * 1.08);
  const runs = [run(200), run(240, { measure }), run(280, { measure: natural - 0.5 })];
  const blank =
    '<svg xmlns="http://www.w3.org/2000/svg" width="2256" height="1071" viewBox="0 0 2256 1071"></svg>';
  const [page] = (await edition([plate(1, { svg: blank, runs })], {}, chinese)).png;
  // A plate pixel is a page pixel at 2400 px; the figure stands at the body's left and top.
  const left = 48 * PX + 40;
  const lines = inkLines(readPng(page.bytes), {
    left: left - 4,
    right: left + measure + 60,
    top: BODY.top * PX + 200 - 2 * detail.size,
    bottom: BODY.top * PX + 280 + detail.size,
  });
  assert.equal(lines.length, 3, `the three runs set ${lines.length} lines`);
  const [flush, spread, full] = lines.map(({ right }) => right - left);
  assert.ok(Math.abs(flush - natural) <= 3, `flush left ends at ${flush} of ${natural}`);
  assert.ok(Math.abs(spread - measure) <= 3, `spread ends at ${spread} of ${measure}`);
  assert.ok(Math.abs(full - natural) <= 3, `a full line ends at ${full} of ${natural}`);
  // A line Typst sets wider than its measure by more than that is refused, as a run wider than its width is.
  await assert.rejects(
    edition([plate(1, { svg: blank, runs: [run(200, { measure: natural - 8 })] })], {}, chinese),
    (error) => error.code === "edition_text_wider",
  );
});
