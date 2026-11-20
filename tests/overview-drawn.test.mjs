import assert from "node:assert/strict";
import test from "node:test";
import { checkOverview } from "../src/overview/typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";

// The publisher draws the overview from what the model states, and from nothing an author places. Every text of the
// statement is set, inside the live area and over no other text; a mark carries one meaning; a statement too tall
// for its page is refused, naming the first block that does not fit.

/** The overview drawn alone from a minimal model that states `statement`. */
function drawn(statement, writtenFrom = null) {
  const model = minimalModel({ overview: statement });
  return checkOverview({
    modelBytes: Buffer.from(JSON.stringify(model)),
    writtenFrom,
    revision: "a".repeat(40),
    date: "2026-11-17",
  });
}

test("every text a statement holds is set, with the model's labels for the parts it names", async () => {
  const statement = everyBlock();
  const written = "Built from 2 files, each cited by its SHA-256.";
  const { texts } = await drawn(statement, written);
  const said = [
    statement.claim,
    statement.lead,
    written,
    ...statement.course.steps.flatMap((step) => [step.label, step.note, step.text].filter(Boolean)),
    statement.course.text,
    // A step's tracks are named where they begin, and a fork's branches each by its own label.
    "first",
    "second",
    "Log",
    "for people",
    "Data",
    "for agents",
    "Done",
    // A spur off the course, its name and its note.
    "Import",
    "a request read from a file",
    // A label on the stretch of the course after Ask.
    "admitted",
    "Check",
    "the request is admitted",
    // The two stations that name parts are shown by the model's labels.
    "Alpha",
    "Beta",
    statement.course.lines[0].label,
    statement.blocks[0].title,
    ...statement.blocks[0].stations.map(({ label }) => label),
    statement.blocks[0].pass.label,
    statement.blocks[0].aside.label,
    statement.blocks[0].text,
    ...statement.blocks
      .slice(1)
      .flatMap((fact) => [
        fact.title,
        ...(fact.text ? [fact.text] : []),
        ...(fact.items ?? []).flat(),
        ...(fact.columns ?? []),
        ...(fact.rows ?? []).flat(),
        ...(fact.lists ?? []).flatMap((list) => [list.title, ...list.items.flat()]),
      ]),
  ];
  for (const text of said) assert.ok(texts.includes(text), `not set: ${text}`);
});

test("a course draws a ring at each station, on each of its tracks, the ends of a course larger, and no other mark", async () => {
  const { marks } = await drawn(everyBlock());
  assert.deepEqual([...new Set(marks.map(({ kind }) => kind))], ["ring"]);
  // The course: Ask, three stations on two tracks, two branches of a fork and Done; the further course: three
  // stations; its outcome: one.
  assert.equal(marks.length, 1 + 3 * 2 + 2 + 1 + 1 + 3 + 1);
  // Each course's two ends are larger than its other stations; a branch's ring and the outcome's are the smallest.
  const radii = marks.map(({ r }) => r);
  assert.equal(radii.filter((r) => r === 7).length, 4);
  assert.equal(radii.filter((r) => r === 5).length, 6 + 1);
  assert.equal(radii.filter((r) => r === 4).length, 2 + 1 + 1);
});

test("a statement too tall for its page is refused with the first block that does not fit", async () => {
  const statement = everyBlock();
  statement.blocks = Array.from({ length: 24 }, (_, index) => ({
    title: `List ${index + 1}`,
    items: Array.from({ length: 6 }, (__, row) => [
      `term ${row + 1}`,
      "a text long enough to take a line",
    ]),
  }));
  await assert.rejects(drawn(statement), (error) => {
    assert.equal(/** @type {any} */ (error).code, "overview_too_tall");
    assert.match(/** @type {any} */ (error).problems[0].message, /^List \d+ reaches \d+ pt/u);
    return true;
  });
});

test("a fork that ends the course stands side by side under it, a cell for each branch", async () => {
  const statement = everyBlock();
  // Keep holds the fork alone, so the course ends at it, and no line names Done.
  statement.course.steps[2].stations = [statement.course.steps[2].stations[0]];
  statement.course.lines = [];
  const { marks } = await drawn(statement);
  const course = marks[0];
  const [log, data] = marks
    .filter(({ r }) => r === 4)
    .sort((a, b) => a.y - b.y)
    .slice(0, 2)
    .sort((a, b) => a.x - b.x);
  assert.equal(log.y, data.y);
  assert.ok(log.y > course.y, "the branches hang under the course");
  assert.ok(data.x - log.x > 100, `a cell for each branch: ${data.x - log.x} pt apart`);
});

test("a fork that ends the course hangs each branch on a stem of its own from the course's line run on", async () => {
  // Rings set on a bar read as stations in turn along a second course (a reader of twelve pages, 2026-11-18, of two
  // forks). The line runs on thinner from the fork, level with the course, and each branch's ring hangs under it.
  const statement = everyBlock();
  statement.course.steps[2].stations = [statement.course.steps[2].stations[0]];
  statement.course.lines = [];
  const { marks, lines } = await drawn(statement);
  const course = marks[0];
  const rings = marks
    .filter(({ r }) => r === 4)
    .sort((a, b) => a.y - b.y)
    .slice(0, 2);
  const upright = (ring) =>
    lines.some(
      ({ points: [[x0, y0], [x1, y1]] }) =>
        x0 === x1 &&
        Math.abs(x0 - ring.x) < 0.01 &&
        Math.abs(y0 - course.y) < 0.01 &&
        Math.abs(y1 - (ring.y - ring.r)) < 0.01,
    );
  for (const ring of rings) {
    assert.ok(ring.y - course.y >= 12, `the ring hangs ${ring.y - course.y} pt under the line`);
    assert.ok(
      upright(ring),
      `no stem from the line at ${course.y} to the ring at ${ring.x}, ${ring.y}`,
    );
  }
  const reach = Math.max(...rings.map(({ x }) => x));
  assert.ok(
    lines.some(
      ({ points: [[x0, y0], [x1, y1]] }) =>
        y0 === y1 && Math.abs(y0 - course.y) < 0.01 && Math.abs(x1 - reach) < 0.01 && x0 < reach,
    ),
    "no line runs on level with the course to the last branch",
  );
});

test("a note in the cell before a fork ends a module or more short of the fork's first mark", async () => {
  // A note that fills its cell ran to the bar that splits the course, and ended three points from the ring of a
  // fork's first branch, on that branch's row (two readers of twelve pages, 2026-11-18): the line touched a letter,
  // and the note read on into the branch's name.
  const note = "它在每一次请求之后都如实作答，而且只答这一次，不多也不少";
  const ends = ({ boxes }) => {
    const box = boxes.find(({ text }) => text === note);
    return box.x + box.w;
  };
  const first = ({ marks }) =>
    marks
      .filter(({ r }) => r === 4)
      .sort((a, b) => a.y - b.y)
      .slice(0, 2)
      .sort((a, b) => a.x - b.x)[0];

  // A fork the course goes on from: the bar that splits the course stands before the first branch's ring.
  const split = everyBlock();
  split.course.steps[1].stations[2].note = note;
  const paths = await drawn(split);
  const ring = first(paths);
  const bar = paths.lines.find(
    ({ points: [[x0, y0], [x1, y1]] }) =>
      x0 === x1 && x0 < ring.x && ring.x - x0 < 20 && Math.min(y0, y1) <= ring.y,
  );
  assert.ok(bar, "no bar splits the course before the fork");
  const [[barX]] = bar.points;
  assert.ok(
    barX - bar.w / 2 - ends(paths) >= 8,
    `the note ends ${(barX - bar.w / 2 - ends(paths)).toFixed(1)} pt before the bar that splits the course`,
  );

  // A fork that ends the course: the first branch's ring hangs on the notes' row.
  const comb = everyBlock();
  comb.course.steps[1].stations[2].note = note;
  comb.course.steps[2].stations = [comb.course.steps[2].stations[0]];
  comb.course.lines = [];
  const hung = await drawn(comb);
  const branch = first(hung);
  assert.ok(
    branch.x - branch.r - ends(hung) >= 8,
    `the note ends ${(branch.x - branch.r - ends(hung)).toFixed(1)} pt before the first branch's ring`,
  );
});

test("a fork the course goes on from splits it into a path for each branch, which join again", async () => {
  const { marks } = await drawn(everyBlock());
  const course = marks[0];
  // Log and Data, the fork before Done: one ring a path, one under the other, the first on the course's line.
  const [log, data] = marks
    .filter(({ r }) => r === 4)
    .sort((a, b) => a.y - b.y)
    .slice(0, 2);
  assert.equal(log.x, data.x);
  assert.equal(log.y, course.y);
  assert.ok(data.y > log.y + 20, "the second path runs under the first");
  const done = marks.filter(({ r, y }) => r === 7 && y === course.y).sort((a, b) => b.x - a.x)[0];
  assert.ok(done.x > log.x, "the paths join before Done");
});

test("headed texts stated one after another stand one under another, in one cell", async () => {
  const statement = everyBlock();
  const at = statement.blocks.findIndex(({ title }) => title === "Not covered");
  statement.blocks.splice(at + 1, 0, {
    title: "Not drawn",
    text: "Nothing outside the two parts is drawn.",
  });
  const { boxes } = await drawn(statement);
  const [covered, notDrawn] = ["Not covered", "Not drawn"].map((text) =>
    boxes.find((box) => box.text === text),
  );
  assert.equal(notDrawn.x, covered.x);
  assert.ok(notDrawn.y > covered.y, "the second stands under the first");
});

test("a run of lists is set in the rows of halves and thirds that take the least height", async () => {
  const statement = everyBlock();
  const short = (title) => ({
    title,
    items: [
      ["one", "a short text"],
      ["two", "another"],
    ],
  });
  const long = {
    title: "Many refusals",
    items: Array.from({ length: 10 }, (_, k) => [
      `refusal ${k + 1}`,
      "a text long enough to need three lines in a third and one or two in a half of the page",
    ]),
  };
  // In thirds the long list sets three lines an item; in halves, beside the first, it sets far fewer, and the two
  // short lists after it fill a second row of halves.
  statement.blocks = [short("First"), long, short("Third"), short("Fourth")];
  const { boxes } = await drawn(statement);
  const at = (text) => boxes.find((box) => box.text === text);
  // A heading's box is its glyphs' ink, so two headings of one row differ by a fraction of a point.
  const level = (a, b) => Math.abs(at(a).y - at(b).y) < 2;
  assert.ok(level("Many refusals", "First"), "the long list stands in the first row");
  assert.ok(
    at("Many refusals").x > 700,
    `the long list stands in a half, at ${at("Many refusals").x} pt`,
  );
  assert.ok(level("Fourth", "Third"), "the short lists after it share a row");
  assert.ok(at("Third").y > at("First").y + 100, "below the first row");
});

test("a list of six items or more, each a line in half its width, is set in two columns", async () => {
  const statement = everyBlock();
  const codes = {
    title: "Refusals",
    items: Array.from({ length: 10 }, (_, k) => [`step ${k + 1}`, `code_${k + 1}_refused`]),
  };
  statement.blocks = [codes, statement.blocks.find(({ title }) => title === "Who decides")];
  const { boxes } = await drawn(statement);
  const at = (text) => boxes.find((box) => box.text === text);
  // Down the first column and then the second: the sixth item stands beside the first.
  assert.ok(
    Math.abs(at("step 6").y - at("step 1").y) < 2,
    "the sixth item heads the second column",
  );
  assert.ok(at("step 6").x > at("step 1").x + 200, `the second column at ${at("step 6").x} pt`);
  assert.ok(at("step 5").y > at("step 4").y, "the first column holds the first five, in order");
});

test("a stretch on parallel tracks may run across steps, its tracks named once where it begins", async () => {
  const statement = everyBlock();
  statement.course.steps[2].stations[0] = { id: "kept", label: "Kept" };
  statement.course.parallel = [{ from: "call", to: "done", tracks: ["first", "second"] }];
  const { texts, marks } = await drawn(statement);
  assert.equal(texts.filter((text) => text === "first").length, 1);
  assert.equal(texts.filter((text) => text === "second").length, 1);
  // Ask and Check on the course; Alpha, Beta, Kept and Done on each of two tracks; Done's rings the larger.
  const course = marks.filter(({ y }) => y < marks[0].y + 40);
  assert.equal(course.length, 1 + 1 + 4 * 2);
  assert.equal(course.filter(({ r }) => r === 7).length, 1 + 2);
});

test("a spur hangs under the course from its point, below the notes there", async () => {
  const { marks, boxes } = await drawn(everyBlock());
  const ask = marks[0];
  // The spur's ring is the smallest ring straight under Ask's, below Ask's step's text.
  const spur = marks.find(({ x, r, y }) => r === 4 && Math.abs(x - ask.x) < 0.5 && y > ask.y);
  assert.ok(spur, "a ring under Ask");
  const text = boxes.find((box) => box.text === "A request names what it wants and who asks.");
  assert.ok(spur.y > text.y + text.h, "below the text under Ask");
  const name = boxes.find((box) => box.text === "Import");
  assert.ok(
    name.x > spur.x && Math.abs(name.y + name.h / 2 - spur.y) < 12,
    "its name beside its ring",
  );
});

test("a line from a spur runs under the course, below the spurs and above the steps' texts", async () => {
  const statement = everyBlock();
  statement.course.lines.push({
    from: "import",
    to: ["check"],
    label: "an imported request is checked",
  });
  const { boxes, marks } = await drawn(statement);
  const at = (text) => boxes.find((box) => box.text === text);
  const spur = marks.find(
    ({ x, r, y }) => r === 4 && Math.abs(x - marks[0].x) < 0.5 && y > marks[0].y,
  );
  const label = at("an imported request is checked");
  assert.ok(label.y > spur.y, "its sentence stands below the spur's ring");
  assert.ok(
    label.y + label.h < at("Two requests may be worked at once, each on its own track.").y,
    "above the texts",
  );
});

test("a label on the course stands over its stretch, on the stations' names' row where it fits", async () => {
  const { boxes, marks } = await drawn(everyBlock());
  const at = (text) => boxes.find((box) => box.text === text);
  const ask = marks[0];
  const label = at("admitted");
  const check = at("Check");
  assert.ok(label.x > ask.x && label.x + label.w < check.x, "between Ask and Check's name");
  assert.ok(label.y + label.h < ask.y, "over the line");
  // On the names' row: its baseline is Check's, the label being a size smaller.
  assert.ok(Math.abs(label.y + label.h - (check.y + check.h)) < 3, "level with the names");
});

test("the drawing hands back every line it draws, and none lies over its text", async () => {
  const { lines } = await drawn(everyBlock());
  // The course, its tracks, the fork's paths, the spur, the lines over and under the course, the further course and
  // the rules between rows: each a run of points with its width.
  assert.ok(lines.length >= 20, `${lines.length} lines`);
  assert.ok(lines.every(({ points, w }) => points.length >= 2 && w > 0));
});

test("the height a page leaves is shared between its rows, so the last row ends at the foot", async () => {
  // Every page is full (the owner, 2026-11-18): a statement that needs less than the page does not leave a band of
  // paper above the foot. The rows keep their content and stand further apart.
  const { boxes } = await drawn(everyBlock());
  // The lowest text above the imprint: the last row's, whose last baseline stands at the limit above the foot's rule.
  const lowest = Math.max(...boxes.filter(({ y }) => y < 860).map(({ y, h }) => y + h));
  assert.ok(
    lowest >= 850 - 14 && lowest <= 850 + 6,
    `the last row ends at ${lowest.toFixed(1)} pt`,
  );
});

/** The texts a statement sets as names, notes, terms, cells and texts: everything but the masthead and line labels. */
function columnTexts(statement) {
  const of = (point) => [
    point.label,
    point.note,
    point.text,
    ...(point.branches ?? []).flatMap(of),
  ];
  return new Set(
    [
      ...statement.course.steps.flatMap((step) => [
        ...of(step),
        ...(step.stations ?? []).flatMap(of),
      ]),
      ...(statement.course.spurs ?? []).flatMap(of),
      ...statement.blocks.flatMap((block) => [
        block.title,
        block.text,
        ...(block.stations ?? []).flatMap(of),
        ...(block.items ?? []).flat(),
        ...(block.columns ?? []),
        ...(block.rows ?? []).flat(),
        ...(block.lists ?? []).flatMap((list) => [list.title, ...list.items.flat()]),
      ]),
    ].filter(Boolean),
  );
}

test("every name, note, term and text begins a whole number of modules from the left margin", async () => {
  // Two left edges that nearly meet read as a mistake (the owner, 2026-11-15: tidiness is a matter of mechanism).
  // Drawn from measured widths, a list's text began 2.8 pt from a station's name on one page and a third of the
  // page 2 pt from a step on another. Every width the page derives is a whole number of 8 pt modules, so two edges
  // are one edge or a module apart.
  const statement = everyBlock();
  const list = (title) => ({
    title,
    items: [
      ["a term", "what it means here"],
      ["another, longer term", "and its meaning"],
    ],
  });
  statement.blocks.push(list("First of three"), list("Second of three"), list("Third of three"));
  const { boxes } = await drawn(statement);
  const wanted = columnTexts(statement);
  const off = boxes
    .filter(({ text }) => wanted.has(text))
    .filter(({ x }) => Math.abs(((x - 48 + 4) % 8) - 4) > 0.01)
    .map(({ text, x }) => `${text} at ${x}`);
  assert.deepEqual(off, []);
  assert.ok(
    boxes.filter(({ text }) => wanted.has(text)).length >= 40,
    "the statement sets too few texts to tell",
  );
});

test("texts of one size in a row of blocks stand on one baseline or half a line apart", async () => {
  // Two headed texts one under another stood 2 pt off the rows of the list beside them: each gap was a number of
  // its own. Every step down a block is a whole number of half lines, so two baselines in a row meet or miss by
  // half a line at least.
  const statement = everyBlock();
  statement.blocks = [
    { title: "A first text", text: "One line of text." },
    { title: "A second text", text: "Another line of text." },
    {
      title: "A list beside them",
      items: [
        ["one", "the first"],
        ["two", "the second"],
        ["three", "the third"],
        ["four", "the fourth"],
      ],
    },
  ];
  const { boxes } = await drawn(statement);
  const baseline = (said) => boxes.find(({ text }) => text === said).b;
  const texts = [
    "One line of text.",
    "Another line of text.",
    "the first",
    "the second",
    "the third",
    "the fourth",
  ];
  const size = boxes.find(({ text }) => text === texts[0]).size;
  const half = size === 12.5 ? 8 : 7;
  for (const said of texts) {
    const away = Math.abs(baseline(said) - baseline(texts[0])) % half;
    assert.ok(
      Math.min(away, half - away) < 0.01,
      `${said} stands ${away.toFixed(2)} pt off the half lines`,
    );
  }
  assert.equal(baseline("Another line of text."), baseline("the fourth"));
});

test("a name on two lines keeps the pitch of the notes beside it, at either spacing", async () => {
  // At the closer spacing a name wrapped at 16 pt beside notes at 14 pt, so its second line stood 2 pt off its
  // neighbour's note.
  const statement = everyBlock();
  statement.course.steps[2].stations = [
    {
      branches: [
        {
          id: "log",
          label: "A log whose name is long enough to take two lines in its cell",
          note: "for people",
        },
        {
          id: "data",
          label: "Data",
          note: "for agents, in a note that takes two lines of its own under it",
        },
      ],
    },
  ];
  statement.course.lines = [];
  const list = (n) => ({
    title: `List ${n}`,
    items: Array.from({ length: 6 }, (_, i) => [`term ${i}`, `text ${i} of list ${n}`]),
  });
  const tall = { ...statement, blocks: [...statement.blocks, ...[1, 2, 3].map(list)] };
  for (const stated of [statement, tall]) {
    const { boxes } = await drawn(stated);
    const box = (said) => boxes.find(({ text }) => text === said);
    const [name, short, note] = [
      box("A log whose name is long enough to take two lines in its cell"),
      box("Data"),
      box("for agents, in a note that takes two lines of its own under it"),
    ];
    assert.equal(name.b, short.b);
    assert.ok(name.h > 1.6 * name.size, "the name does not wrap");
    // The note under the short name begins where the long name's second line stands.
    const pitch = note.size === 12.5 ? 16 : 14;
    assert.ok(
      Math.abs(note.b - short.b - pitch) < 0.01,
      `the note begins ${note.b - short.b} pt under its name`,
    );
    const lines = Math.round((name.h - name.size) / pitch) + 1;
    assert.equal(lines, 2, `the name's lines stand ${(name.h - name.size).toFixed(1)} pt apart`);
  }
  const closer = (await drawn(tall)).boxes.find(({ text }) => text === "for people").size;
  assert.equal(closer, 11, "the taller statement is not set at the closer spacing");
});
