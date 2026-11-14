import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { stripVTControlCharacters } from "node:util";
import stringWidth from "fast-string-width";
import { reportFailure, reportRefusal, reportResult } from "../src/cli/report.mjs";
import { Refusal } from "../src/refusal.mjs";
import { ATTENDED, TIDY, terminal } from "./fixtures/check-results.mjs";
import { FRAME, MARK, reportLines } from "./fixtures/report-lines.mjs";

test("a report is framed, its labels aligned, and it reads the same with colour off", (t) => {
  // The directory lies in the working directory, so that no line's length depends on where the tests run.
  const result = {
    out: path.resolve("guide"),
    draft: "guide.archify.md",
    files: ["a.json", "b.json"],
  };
  const plain = reportResult("scaffold guide", result, "model.json");
  assert.equal(
    plain,
    [
      `${FRAME.start}  archpub scaffold guide · model.json`,
      FRAME.guide,
      `${FRAME.guide}  Guide`,
      `${MARK.passed}  Draft      guide.archify.md`,
      `${MARK.passed}  Diagrams   2 diagrams`,
      `${MARK.passed}  Directory  guide`,
      `${MARK.noted}  Model      name guide/guide.archify.md as its guide, then rewrite the draft`,
      FRAME.guide,
      `${FRAME.end}  Next: archpub check model.json`,
      "",
      "",
    ].join("\n"),
  );
  // Each state has a mark of its own, so none needs its colour to be told apart.
  assert.equal(new Set(Object.values(MARK)).size, 4);
  // Colour repeats the marks and the headings and changes no character of the text.
  const kept = { FORCE_COLOR: process.env.FORCE_COLOR, NO_COLOR: process.env.NO_COLOR };
  t.after(() => {
    for (const [name, value] of Object.entries(kept))
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
  });
  delete process.env.NO_COLOR;
  process.env.FORCE_COLOR = "1";
  for (const report of [
    () => reportResult("check", ATTENDED, "model.json"),
    () => reportRefusal("check", new Refusal("model_invalid", "The model is invalid.")),
  ]) {
    const coloured = report();
    assert.notEqual(stripVTControlCharacters(coloured), coloured);
    delete process.env.FORCE_COLOR;
    assert.equal(report(), stripVTControlCharacters(coloured));
    process.env.FORCE_COLOR = "1";
  }
});

test("a value longer than the terminal is wrapped under its own column, with the guide on every line", () => {
  const long = Array.from({ length: 40 }, (_, index) => `w${String(index).padStart(3, "0")}`).join(
    " ",
  );
  assert.equal(long.length, 199);
  const refusal = new Refusal("model_invalid", `${long}.`, [
    { code: "model_field", path: "/components/12/label", message: `${long}.` },
    { code: "model_field", path: "/id", message: "is required" },
  ]);
  const starts = [FRAME.start, FRAME.guide, FRAME.end, ...Object.values(MARK)];
  for (const [stream, width] of [
    [terminal(80), 80],
    [terminal(120), 120],
    // A stream that is no terminal is written for 80 columns, whatever it says of its width, and so is a
    // terminal that tells none.
    [{ isTTY: false, columns: 200 }, 80],
    [{ isTTY: true }, 80],
  ]) {
    const lines = reportRefusal("check", refusal, stream).split("\n").slice(0, -2);
    assert.deepEqual(
      lines.filter((line) => stringWidth(line) > width),
      [],
      `at ${width} columns`,
    );
    assert.ok(
      lines.some((line) => stringWidth(line) > width - 8),
      `uses the ${width} columns`,
    );
    for (const line of lines) assert.ok(starts.includes(line.split(" ")[0]), line);
    // The problems' values start after the longest label; every continuation line starts there too.
    const first = lines.findIndex((line) =>
      line.startsWith(`${MARK.refused}  /components/12/label  `),
    );
    const column = `${MARK.refused}  /components/12/label  `.length;
    const next = lines.findIndex((line) => line.startsWith(`${MARK.refused}  /id`));
    assert.ok(next - first > 2, "the value takes several lines");
    for (const line of lines.slice(first + 1, next)) {
      assert.equal(line.slice(0, column), `${FRAME.guide}${" ".repeat(column - 1)}`, line);
      assert.match(line.slice(column), /^w\d{3}/u);
    }
    assert.equal(lines[next], `${MARK.refused}  /id${" ".repeat(column - 6)}is required`);
    // Nothing of the value is lost: joined again, the lines are the value.
    assert.deepEqual(reportLines(lines.join("\n"), width)[4], [
      "refused",
      "/components/12/label",
      `${long}.`,
    ]);
  }
  // A word longer than the value column is broken where the column ends, and joined again it is whole.
  const directory = `/work/${"deep/".repeat(30)}delivery`;
  const built = reportResult(
    "scaffold guide",
    { out: directory, draft: "guide.archify.md", files: [] },
    "model.json",
    terminal(80),
  );
  assert.deepEqual(
    built.split("\n").filter((line) => stringWidth(line) > 80 && !line.startsWith(FRAME.start)),
    [],
  );
  assert.deepEqual(reportLines(built)[4], ["passed", "Directory", directory]);
});

test("a title longer than the terminal continues beside the guide, and the command to run next stays one line", () => {
  const directory = `/work/${"deliveries-of-one-work/".repeat(5)}architecture-publisher`;
  const accepted = {
    directory,
    reviewer: "Reviewer",
    acceptedAt: "2026-11-14T08:00:00Z",
    colophon: "colophon.pdf",
    signer: null,
    signature: null,
  };
  for (const width of [80, 120]) {
    const lines = reportResult("accept", accepted, "delivery", terminal(width))
      .split("\n")
      .slice(0, -2);
    // The command to run next is one line however long, so that it is copied whole; every other line fits.
    const command = `${FRAME.end}  Next: archpub verify ${directory}`;
    assert.ok(stringWidth(command) > width);
    assert.equal(lines.at(-1), command);
    assert.deepEqual(
      lines.slice(0, -1).filter((line) => stringWidth(line) > width),
      [],
      `at ${width} columns`,
    );
    // The title continues beside the guide.
    const heading = lines.indexOf(`${FRAME.guide}  Acceptance`);
    assert.ok(heading > 2, "the title takes several lines");
    for (const line of lines.slice(1, heading - 1))
      assert.match(line.slice(FRAME.guide.length), /^ {2}\S/u, line);
    // Nothing of the title is lost: its lines joined again, white space aside, are the title.
    const joined = (from, to) =>
      lines
        .slice(from, to)
        .map((line) => line.replace(/^\S? +/u, ""))
        .join("")
        .replace(/\s/gu, "");
    assert.equal(joined(0, heading - 1), `archpubaccept·${directory}`);
    // The fixture that reads a report back joins the title again as it was written.
    const read = reportLines(lines.join("\n"), width);
    assert.deepEqual(read[0], ["title", `archpub accept · ${directory}`]);
    assert.deepEqual(read.at(-1), ["closing", `Next: archpub verify ${directory}`]);
  }
});

test("a path inside the working directory is printed as a reader there would type it", () => {
  const typed = path.join("build", "delivery");
  const accepted = {
    directory: path.resolve(typed),
    reviewer: "Reviewer",
    acceptedAt: "2026-11-14T08:00:00Z",
    colophon: path.resolve(typed, "colophon.pdf"),
    signer: null,
    signature: null,
  };
  assert.deepEqual(reportLines(reportResult("accept", accepted, typed)), [
    ["title", `archpub accept · ${typed}`],
    ["heading", "Acceptance"],
    ["passed", "Reviewer", "Reviewer"],
    ["noted", "Signature", "unsigned"],
    ["passed", "Colophon", path.join(typed, "colophon.pdf")],
    ["closing", `Next: archpub verify ${typed}`],
  ]);
  // The working directory itself and a path outside it are printed as they are.
  for (const directory of [process.cwd(), path.resolve("..", "elsewhere")]) {
    const lines = reportLines(
      reportResult("accept", { ...accepted, directory }, directory, { isTTY: true, columns: 400 }),
      400,
    );
    assert.deepEqual(lines[0], ["title", `archpub accept · ${directory}`]);
  }
});

test("a refusal or a failure that names a path inside the working directory prints it as typed", () => {
  const output = path.resolve("build", "delivery");
  const refusal = new Refusal(
    "delivery_exists",
    `The output ${output} already exists; choose a new directory.`,
    [{ code: "delivery_file", message: `${path.join(output, "manifest.json")} is in the way.` }],
  );
  assert.deepEqual(reportLines(reportRefusal("build", refusal)).slice(2, 5), [
    [
      "refused",
      "delivery_exists",
      `The output ${path.join("build", "delivery")} already exists; choose a new directory.`,
    ],
    ["heading", "Problems"],
    [
      "refused",
      "delivery_file",
      `${path.join("build", "delivery", "manifest.json")} is in the way.`,
    ],
  ]);
  assert.deepEqual(reportLines(reportFailure("accept", `EISDIR: read '${output}'`))[2], [
    "refused",
    "Error",
    `EISDIR: read '${path.join("build", "delivery")}'`,
  ]);
  // The working directory's own name inside another path is left alone.
  const sibling = `${process.cwd()}-other${path.sep}delivery`;
  assert.deepEqual(
    reportLines(
      reportFailure("accept", `EISDIR: read '${sibling}'`, { isTTY: true, columns: 400 }),
      400,
    )[2],
    ["refused", "Error", `EISDIR: read '${sibling}'`],
  );
});

test("citations stand in a group of their own, where a long path fits a line whole", () => {
  const file = "docs/reference/architecture/how-a-delivery-is-built.md";
  assert.equal(file.length, 54);
  const model = structuredClone(TIDY);
  Object.assign(model.coverage.currency.worklist, {
    // A component's label makes the worklist's label column wide, as real labels do.
    components: [
      {
        id: "explainer",
        label: "Interactive explainer and its guide",
        modified: ["a"],
        moved: [],
        deleted: [],
        taken: [],
      },
    ],
    citations: [
      { fate: "same", where: "@source keep", path: "docs/keep.md", lines: [1, 2] },
      { fate: "shifted", where: "@source build", path: file, lines: [10, 12], at: [12, 14] },
      { fate: "touched", where: "@source touch", path: file, lines: [40, 44] },
    ],
  });
  const report = reportResult("check", model, "tidy.json", terminal(80));
  const lines = report.split("\n").slice(0, -2);
  assert.deepEqual(
    lines.filter((line) => stringWidth(line) > 80 && !line.startsWith(FRAME.end)),
    [],
  );
  // The citations follow the worklist under their own heading, with labels no wider than a fate.
  const heading = lines.indexOf(`${FRAME.guide}  Citations`);
  assert.ok(heading > lines.indexOf(`${FRAME.guide}  Re-pin worklist`));
  assert.equal(
    lines[heading + 1],
    `${MARK.attention}  Guide    3 citations: 1 same, 1 shifted and 1 touched`,
  );
  // Each citation's path stands whole on one line.
  const cited = lines.slice(heading + 2).filter((line) => line.includes(file));
  assert.equal(cited.length, 2);
  assert.deepEqual(reportLines(report).slice(-7, -1), [
    ["heading", "Re-pin worklist"],
    ["attention", "Interactive explainer and its guide (explainer)", "1 file modified"],
    ["heading", "Citations"],
    ["attention", "Guide", "3 citations: 1 same, 1 shifted and 1 touched"],
    ["attention", "shifted", `@source build ${file} 10:12 to 12:14`],
    ["attention", "touched", `@source touch ${file} 40:44`],
  ]);
});

test("a label in Han keeps the value column of the Latin label beside it", () => {
  const worklist = {
    components: [
      { id: "web", label: "Web checkout", modified: ["a"], moved: [], deleted: [], taken: [] },
      { id: "store", label: "订单存储", modified: ["b", "c"], moved: [], deleted: [], taken: [] },
    ],
    relations: [],
    refused: [],
    uncovered: [],
    citations: [],
  };
  const model = structuredClone(TIDY);
  model.coverage.currency.worklist = worklist;
  const lines = reportResult("check", model, "tidy.json", terminal(80)).split("\n");
  const latin = lines.find((line) => line.includes("Web checkout (web)"));
  const han = lines.find((line) => line.includes("订单存储 (store)"));
  const column = (line, value) => stringWidth(line.slice(0, line.indexOf(value)));
  assert.equal(column(latin, "1 file modified"), column(han, "2 files modified"));
  assert.equal(
    column(han, "2 files modified"),
    stringWidth(`${MARK.attention}  Web checkout (web)  `),
  );
});

test("the command to run next quotes a path that holds a space and leaves any other bare", () => {
  const closing = (command, result, subject) =>
    reportLines(reportResult(command, result, subject)).at(-1)[1];
  const built = {
    model: { id: "shop" },
    media: [],
    views: [],
    plates: 0,
    artifacts: 1,
    warnings: [],
  };
  assert.equal(
    closing("check", TIDY, "my models/shop.json"),
    'Next: archpub build "my models/shop.json" --out <directory>',
  );
  assert.equal(
    closing("check", TIDY, "models/shop.json"),
    "Next: archpub build models/shop.json --out <directory>",
  );
  assert.equal(
    closing("build", { ...built, out: "/work/first delivery" }, "model.json"),
    'Next: archpub accept "/work/first delivery" --reviewer <name>',
  );
  const accepted = {
    directory: "/work/first delivery",
    reviewer: "R",
    signer: null,
    colophon: "c.pdf",
  };
  assert.equal(closing("accept", accepted, "d"), 'Next: archpub verify "/work/first delivery"');
  assert.equal(
    closing("verify", { ...accepted, acceptedAt: "t", signature: "unsigned" }, "d"),
    'Next: archpub publish "/work/first delivery" --to <root>',
  );
  const written = { out: "/work/my shop.json", components: 1, relations: 0, warnings: [] };
  assert.equal(closing("import likec4", written, "w"), 'Next: archpub check "/work/my shop.json"');
  assert.equal(
    closing("migrate", { out: "/work/my shop.json", claims: 0, cited: 0, moved: [] }, "m"),
    'Next: archpub check "/work/my shop.json"',
  );
});
