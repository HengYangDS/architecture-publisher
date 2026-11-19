import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/poster/tokens.mjs";
import { SET, evalEdition, plateOf, recordOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";

const { bodyTop, bodyBottom, key, indexRows } = HOUSE.edition;
const MARGIN = HOUSE.page.margin;
/** The index sets one column in each half of the page, a line a twentieth of the body high; its facts stand at four. */
const HALF = (HOUSE.page.width - 2 * MARGIN - 56) / 2;
const PITCH = (bodyBottom - bodyTop) / indexRows;
const NARROW = (HALF - 56) / 2;
const TWO = [MARGIN, MARGIN + HALF + 56];
const FOUR = [0, 1, 2, 3].map((column) => MARGIN + column * (NARROW + 56));
const near = (a, b) => Math.abs(a - b) < 0.6;
const two = (number) => String(number).padStart(2, "0");
/** A plate as the index cites it: its number and the label of its page. */
const drawnOn = (number) => ({ number, key: `plate-${number}` });
/** The parts a page's index sets in its left column and in its right. */
const columns = (index) => TWO.map((x) => index.filter((part) => near(part.x, x)).length);
/** The distance from each part to the one above it in its column. */
const pitches = (index) =>
  index.flatMap((part, at) =>
    at > 0 && near(index[at - 1].x, part.x) ? [part.b - index[at - 1].b] : [],
  );
/**
 * The rules that close the index's parts, one under the last line of each column: its page, its column and how
 * many lines below the body's top. The contents, on the second page, close their own halves.
 */
const ends = (set) =>
  set.ends
    .filter(({ page }) => page > 2)
    .map(({ page, left, top }) => ({
      page,
      half: near(left, TWO[0]) ? "left" : near(left, TWO[1]) ? "right" : left,
      lines: Math.round(((top - bodyTop) / PITCH) * 100) / 100,
    }));

/** A model of the parts given, each an id and a name. */
const modelOf = (parts, extra = {}) =>
  validateModel(
    minimalModel({
      components: parts.map(([id, label]) => ({ id, label })),
      relations: [{ id: "first", from: parts[0][0], to: parts[1][0], label: "calls" }],
      repository: {
        name: "minimal",
        url: "https://github.com/o/minimal.git",
        revision: "a".repeat(40),
      },
      ...extra,
    }),
  );

/**
 * The index as one of its pages sets it: each part's name with the column it stands in, its baseline and the lines
 * of plate numbers after it, each number with its right edge.
 */
function indexOn(set, page, labels) {
  const boxes = set.boxes.filter(
    (box) => box.page === page && box.b > bodyTop && box.b < bodyBottom,
  );
  const names = boxes.filter((box) => labels.has(box.text));
  const numbers = boxes.filter((box) => /^\d\d$/u.test(box.text) && !labels.has(box.text));
  return names
    .map((name) => {
      const below = names.filter((other) => near(other.x, name.x) && other.b > name.b);
      const next = Math.min(bodyBottom, ...below.map(({ b }) => b));
      const own = numbers.filter(
        (number) =>
          number.x > name.x &&
          number.x < name.x + HALF &&
          number.b >= name.b - 0.6 &&
          number.b < next - 0.6,
      );
      const lines = [...new Set(own.map(({ b }) => Math.round(b * 10) / 10))].sort((a, b) => a - b);
      return {
        label: name.text,
        x: name.x,
        b: name.b,
        size: name.size,
        lines: lines.map((b) =>
          own.filter((number) => near(number.b, b)).sort((one, other) => one.x - other.x),
        ),
      };
    })
    .sort((one, other) => one.x - other.x || one.b - other.b);
}

test("the last page indexes every part once, by name, with the plates that draw it, each a link", async (t) => {
  const parts = [
    ["z", "Zeta"],
    ["g", "Git"],
    ["a", "Alpha"],
    ["o", "OpenSpec CLI"],
    ["e", "Git engine"],
    ["b", "Beta"],
  ];
  const model = modelOf(parts);
  const plates = [plateOf(1, ["a", "b"]), plateOf(2, ["g", "a"]), plateOf(3, ["e", "z", "a"])];
  const facts = recordFacts({ read: 3, date: "2026-11-06" });
  const record = recordOf({ model, plates, facts });
  assert.deepEqual(record.index, [
    { label: "Alpha", plates: ["01", "02", "03"].map(drawnOn) },
    { label: "Beta", plates: ["01"].map(drawnOn) },
    { label: "Git", plates: ["02"].map(drawnOn) },
    { label: "Git engine", plates: ["03"].map(drawnOn) },
    { label: "OpenSpec CLI", plates: [] },
    { label: "Zeta", plates: ["03"].map(drawnOn) },
  ]);
  const set = await evalEdition(t, { model, plates, facts }, SET);
  // Title page, contents, three plates, the index.
  assert.equal(set.pages, 6);
  const texts = set.boxes.filter(({ page }) => page === 6).map(({ text }) => text);
  assert.ok(texts.includes("Index") && texts.includes("Parts and the plates that draw them"));
  assert.equal(texts.filter((text) => text === record.words.foot).length, 1);
  const index = indexOn(set, 6, new Set(parts.map(([, label]) => label)));
  // Six parts stand in the left column, in order, a twentieth of the body apart: nothing is shared out between
  // the columns or opened up to fill them, and one rule closes the parts under the last.
  assert.deepEqual(
    index.map(({ label, x, lines }) => [
      label,
      x,
      lines.map((line) => line.map(({ text }) => text)),
    ]),
    [
      ["Alpha", TWO[0], [["01", "02", "03"]]],
      ["Beta", TWO[0], [["01"]]],
      ["Git", TWO[0], [["02"]]],
      ["Git engine", TWO[0], [["03"]]],
      ["OpenSpec CLI", TWO[0], []],
      ["Zeta", TWO[0], [["03"]]],
    ],
  );
  assert.ok(
    pitches(index).every((pitch) => near(pitch, PITCH)),
    pitches(index).join(" "),
  );
  assert.deepEqual(ends(set), [{ page: 6, half: "left", lines: 6 }]);
  // A number stands in the size a plate's number has in the contents, and the last of a line ends at the
  // column's right edge.
  const inContents = set.boxes.find(({ page, text }) => page === 2 && text === "01");
  for (const part of index)
    for (const line of part.lines) {
      for (const number of line) assert.equal(number.size, inContents.size, part.label);
      assert.ok(near(line.at(-1).x + line.at(-1).w, part.x + HALF), `${part.label} ends short`);
    }
  // Each number is a link to its plate.
  const led = set.links.filter(({ page, to }) => page === 6 && /^plate-/u.test(String(to)));
  assert.deepEqual(led.map(({ to }) => to).sort(), [
    "plate-01",
    "plate-01",
    "plate-02",
    "plate-02",
    "plate-03",
    "plate-03",
    "plate-03",
  ]);
  // Under the columns, on the line where a plate has its key: the repository, the files read, the page, the data.
  const closing = set.boxes
    .filter((box) => box.page === 6 && near(box.b, key))
    .sort((a, b) => a.x - b.x);
  assert.deepEqual(
    closing.map(({ text }) => text),
    [
      "Repository",
      "github.com/o/minimal",
      "Built from",
      "3 files",
      "Page",
      "minimal.html",
      "Data",
      "minimal.json",
    ],
  );
  for (const [fact, x] of FOUR.entries()) assert.ok(near(closing[fact * 2].x, x), `fact ${fact}`);
  assert.deepEqual(
    set.links
      .filter(({ page, to }) => page === 6 && /minimal/u.test(String(to)))
      .map(({ to }) => to),
    ["https://github.com/o/minimal", "minimal.html", "minimal.json"],
  );
  // No acceptance and no digest stand on this page.
  assert.ok(!texts.some((text) => /SHA-256|accept/iu.test(text)), texts.join(" | "));
  // A model that states no address names its repository alone; one that names none states none.
  const named = modelOf(parts, { repository: { name: "minimal", revision: "a".repeat(40) } });
  assert.deepEqual(recordOf({ model: named, plates, facts }).closing[0], {
    label: "Repository",
    value: "minimal",
    url: null,
  });
  assert.deepEqual(
    recordOf({ model: modelOf(parts, { repository: undefined }), plates }).closing.map(
      ({ label }) => label,
    ),
    ["Page", "Data"],
  );
});

test("a fact wider than its column moves the facts after it, and none runs into the next", async (t) => {
  // An address cannot be shortened by its author: the facts after it give way, each a gap after the one before.
  const address =
    "github.com/an-organisation-with-a-long-name/a-repository-whose-name-is-as-long-as-such-names-get";
  const model = modelOf(
    [
      ["a", "Alpha"],
      ["b", "Beta"],
    ],
    { repository: { name: "minimal", url: `https://${address}.git`, revision: "a".repeat(40) } },
  );
  const plates = [plateOf(1, ["a", "b"])];
  const facts = recordFacts({ read: 3, date: "2026-11-06" });
  const set = await evalEdition(t, { model, plates, facts }, SET);
  const key = HOUSE.edition.key;
  const closing = set.boxes
    .filter((box) => box.page === set.pages && Math.abs(box.b - key) < 0.5)
    .sort((a, b) => a.x - b.x);
  assert.deepEqual(
    closing.map(({ text }) => text),
    [
      "Repository",
      address,
      "Built from",
      "3 files",
      "Page",
      "minimal.html",
      "Data",
      "minimal.json",
    ],
  );
  for (const [index, box] of closing.entries())
    if (index > 0)
      assert.ok(
        box.x >= closing[index - 1].x + closing[index - 1].w + 9,
        `${box.text} begins at ${box.x}, and ${closing[index - 1].text} ends at ${closing[index - 1].x + closing[index - 1].w}`,
      );
  // The address is wider than a column, so the second fact has left its column's start.
  assert.ok(closing[1].x + closing[1].w > HOUSE.page.margin + 334 + 56);
  assert.ok(
    closing[closing.length - 1].x + closing[closing.length - 1].w <=
      HOUSE.page.width - HOUSE.page.margin,
  );
});

test("a part on more plates than fit beside its name sets them in lines of equal length, 24 points apart", async (t) => {
  const parts = Array.from({ length: 30 }, (_, index) => [`p${index}`, `Part ${two(index + 1)}`]);
  const model = modelOf(parts);
  // The first part stands on every plate, the second on three.
  const plates = Array.from({ length: 28 }, (_, index) =>
    plateOf(index + 1, index < 3 ? ["p0", "p1"] : ["p0"]),
  );
  const set = await evalEdition(t, { model, plates }, SET);
  const index = indexOn(set, set.pages, new Set(parts.map(([, label]) => label)));
  assert.equal(index.length, 30);
  const [first, second] = index;
  assert.deepEqual(
    second.lines.map((line) => line.map(({ text }) => text)),
    [["01", "02", "03"]],
  );
  assert.deepEqual(
    first.lines.flat().map(({ text }) => text),
    plates.map(({ page }) => two(page)),
  );
  assert.ok(first.lines.length > 1, "28 numbers stand on one line");
  const width = first.lines[0].length;
  for (const [at, line] of first.lines.entries()) {
    assert.ok(near(line[0].b - first.b, at * 24), `line ${at} stands at ${line[0].b - first.b}`);
    if (at < first.lines.length - 1) assert.equal(line.length, width);
    else assert.ok(line.length <= width && line.length > 1, `the last line holds ${line.length}`);
  }
  // The part that takes more lines keeps the rows after it clear: no number of it stands below the next name.
  assert.ok(first.lines.at(-1)[0].b < second.b - 20, "the lines run into the next part");
});

test("an index sets twenty lines a half at one pitch, in order, and a long one takes a further page", async (t) => {
  assert.equal(indexRows, 20);
  const named = (count) =>
    Array.from({ length: count }, (_, index) => [`p${index}`, `Part ${two(index + 1)}`]);
  const labels = (count) => new Set(named(count).map(([, label]) => label));
  const inOrder = (count) => named(count).map(([, label]) => label);
  // 26 parts: twenty in the left column and six in the right, which keeps the pitch and is not filled.
  const short = await evalEdition(t, { model: modelOf(named(26)) }, SET);
  assert.equal(short.pages, 3);
  const one = indexOn(short, 3, labels(26));
  assert.deepEqual(columns(one), [20, 6]);
  assert.deepEqual(
    one.map(({ label }) => label),
    inOrder(26),
  );
  assert.ok(
    pitches(one).every((pitch) => near(pitch, PITCH)),
    pitches(one).join(" "),
  );
  assert.ok(near(one[0].b, one[20].b), "the right column begins at another height than the left");
  assert.deepEqual(ends(short), [
    { page: 3, half: "left", lines: 20 },
    { page: 3, half: "right", lines: 6 },
  ]);

  // 42 parts: forty on the first page and two at the top of a second, which is not filled.
  const wide = await evalEdition(t, { model: modelOf(named(42)) }, SET);
  assert.equal(wide.pages, 4);
  const two42 = [3, 4].map((page) => indexOn(wide, page, labels(42)));
  assert.deepEqual(two42.map(columns), [
    [20, 20],
    [2, 0],
  ]);
  assert.deepEqual(
    two42.flat().map(({ label }) => label),
    inOrder(42),
  );
  assert.ok(near(two42[1][0].b, two42[0][0].b), "the second page's first part stands lower");
  assert.ok(near(two42[1][1].b - two42[1][0].b, PITCH));
  assert.deepEqual(ends(wide), [
    { page: 3, half: "left", lines: 20 },
    { page: 3, half: "right", lines: 20 },
    { page: 4, half: "left", lines: 2 },
  ]);

  // 120 parts take three pages of forty, each with its title and foot; the facts close the last page alone.
  const long = await evalEdition(t, { model: modelOf(named(120)) }, SET);
  assert.equal(long.pages, 5);
  const pages = [3, 4, 5].map((page) => indexOn(long, page, labels(120)));
  assert.deepEqual(
    pages.flat().map(({ label }) => label),
    inOrder(120),
  );
  for (const [at, page] of pages.entries()) {
    assert.deepEqual(columns(page), [20, 20]);
    assert.ok(
      pitches(page).every((pitch) => near(pitch, PITCH)),
      `page ${at + 3}: ${pitches(page).join(" ")}`,
    );
    const texts = long.boxes.filter(({ page: on }) => on === at + 3).map(({ text }) => text);
    assert.ok(texts.includes("Index"), `page ${at + 3} has no title`);
    assert.equal(texts.filter((text) => text === "Minimal at aaaaaaa, 2026-11-06").length, 1);
    assert.equal(texts.includes("Repository"), at === 2);
  }
  assert.deepEqual(
    ends(long),
    [3, 4, 5].flatMap((page) => [
      { page, half: "left", lines: 20 },
      { page, half: "right", lines: 20 },
    ]),
  );
});

test("a part whose plates take more lines than a page holds is refused", async (t) => {
  // A name as wide as its column leaves room for two numbers a line: sixty plates take thirty lines.
  const parts = [
    ["a", "A part whose name is as long as the column it stands in is wide ".repeat(2).trim()],
    ["b", "Beta"],
  ];
  const plates = Array.from({ length: 60 }, (_, index) => plateOf(index + 1, ["a"]));
  await assert.rejects(evalEdition(t, { model: modelOf(parts), plates }, SET), (error) =>
    /edition_index_too_long/u.test(error.stderr),
  );
});

test("facts that the line under the index cannot hold are refused", async (t) => {
  const address = `github.com/${"a-very-long-owner-".repeat(8)}/${"a-very-long-name-".repeat(8)}`;
  const model = modelOf(
    [
      ["a", "Alpha"],
      ["b", "Beta"],
    ],
    { repository: { name: "minimal", url: `https://${address}.git`, revision: "a".repeat(40) } },
  );
  await assert.rejects(evalEdition(t, { model, plates: [plateOf(1, ["a", "b"])] }, SET), (error) =>
    /edition_closing_too_long/u.test(error.stderr),
  );
});
