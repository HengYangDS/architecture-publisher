import assert from "node:assert/strict";
import test from "node:test";
import { code, modules } from "./fixtures/source.mjs";

/**
 * The last clause of the queue item `compositions`: one mark drawn in two weights becomes a gate. Each weight the
 * source strokes a mark with is a token of the house, `src/house.json`, stated once: a stroke of the figure in its
 * pixels (`strokes`), a line of a plate in the table of lines (`lines`), a weight of the pages in points
 * (`weights`), a stroke of the seal as a share of its size (`seal.weights`). So a width holds no number of its own:
 * it is a token, a parameter or a product of them. The test reads a width where the source gives it: an SVG's
 * `stroke-width`, in the JavaScript's strings and the Typst's; a Typst stroke or its thickness, its dash aside; and
 * the weight a stroke primitive of the class takes by name (`w` of a line or a ring, `between` of a list). A Typst
 * line with no stroke, or a shape with neither stroke nor fill, is refused too: Typst strokes it at a width of its
 * own. The searches read the source as `tests/one-source.test.mjs` does, without its comments.
 */

/** A number as either language writes it, with its unit if it has one: not the end of a name or of another number. */
const NUMBER = /(?<![\w.$#])(?:\d+(?:\.\d*)?|\.\d+)(?:pt|mm|cm|in|em|%)?(?![\w.])/gu;

/** An SVG's stroke width and the quote that opens its value. */
const SVG = /\bstroke-width\s*=\s*(["'])/gu;

/** The keys of a Typst value that is a stroke or its thickness. */
const STROKES = /(?<![\w.-])(?:stroke|thickness)\s*:/gu;

/** The stroke primitives of the class that take their weight by name, called or defined. */
const PRIMITIVES = /(?<![\w.-])(?:_?seg|_?ring|_list|hrule)\(/gu;

/** The names those primitives take their weight by. */
const WEIGHTS = /(?<![\w.-])(?:w|between)\s*:/gu;

/** A Typst line, which is stroked at a width of Typst's own when it names none. */
const LINES = /(?<![\w.-])line\(/gu;

/** A Typst shape, which is stroked at a width of Typst's own when it names neither a stroke nor a fill. */
const SHAPES = /(?<![\w.-])(rect|square|circle|ellipse|polygon|curve)\(/gu;

/** A stroke's dash, whose lengths are its dashes and gaps, not its width. */
const DASH = /(?<![\w.-])dash\s*:/gu;

/**
 * Where a value that starts at `from` ends: at a comma or a line's end outside the brackets and the strings it
 * opens, or at the bracket that closes around it; with `whole`, only at that bracket.
 * @param {string} text
 * @param {number} from
 * @param {boolean} [whole]
 */
function valueEnd(text, from, whole = false) {
  let depth = 0;
  for (let at = from; at < text.length; at += 1) {
    const char = text[at];
    if (char === '"') {
      for (at += 1; at < text.length && text[at] !== '"'; at += 1) if (text[at] === "\\") at += 1;
    } else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) {
      if (depth === 0) return at;
      depth -= 1;
    } else if (!whole && depth === 0 && (char === "," || char === "\n")) return at;
  }
  return text.length;
}

/**
 * The values a text gives the keys found by a search, each with where it starts.
 * @param {string} text
 * @param {RegExp} keys
 */
const valuesOf = (text, keys) =>
  [...text.matchAll(keys)].map(({ index, 0: key }) => {
    const from = index + key.length;
    return { from, value: text.slice(from, valueEnd(text, from)) };
  });

/**
 * The arguments of each call a search finds, each with where they start.
 * @param {string} text
 * @param {RegExp} calls
 */
const argumentsOf = (text, calls) =>
  [...text.matchAll(calls)].map(({ index, 0: call, 1: name }) => {
    const from = index + call.length;
    return { from, name, value: text.slice(from, valueEnd(text, from, true)) };
  });

/** A text with the parts a search finds blanked, so that what is left stands where it stood. */
const blanked = (
  /** @type {string} */ text,
  /** @type {{ from: number, value: string }[]} */ parts,
) =>
  parts.reduce(
    (kept, { from, value }) =>
      kept.slice(0, from) + " ".repeat(value.length) + kept.slice(from + value.length),
    text,
  );

/**
 * A Typst value with its dashes, its strings and the conditions of its choices blanked (`if i == 0 { … }`): a number
 * left in it is a width.
 * @param {string} value
 */
const widthOf = (value) =>
  blanked(value, valuesOf(value, DASH))
    .replace(/"(?:[^"\\]|\\.)*"/gu, (string) => " ".repeat(string.length))
    .replace(/(?<![\w.-])if\b[^{}]*?(?=\{)/gu, (condition) => " ".repeat(condition.length));

/**
 * The arguments of a call as the call itself gives them: what stands inside a bracket or a string in them blanked,
 * so that a name found is one of the call's own and not one of a call or a body inside it.
 * @param {string} text
 */
function shallow(text) {
  let [depth, kept] = [0, ""];
  for (let at = 0; at < text.length; at += 1) {
    const char = text[at];
    if (char === '"') {
      const from = at;
      for (at += 1; at < text.length && text[at] !== '"'; at += 1) if (text[at] === "\\") at += 1;
      kept += " ".repeat(at - from + 1);
      continue;
    }
    if (")]}".includes(char)) depth -= 1;
    kept += depth > 0 ? " " : char;
    if ("([{".includes(char)) depth += 1;
  }
  return kept;
}

/**
 * The values a call's own arguments give the keys found by a search, each with where it starts in the call.
 * @param {string} call
 * @param {RegExp} keys
 */
const ownValuesOf = (call, keys) =>
  [...shallow(call).matchAll(keys)].map(({ index, 0: key }) => {
    const from = index + key.length;
    return { from, value: call.slice(from, valueEnd(call, from)) };
  });

/** The line of a text an offset stands on, counted from one. */
const lineAt = (/** @type {string} */ text, /** @type {number} */ offset) =>
  text.slice(0, offset).split("\n").length;

/**
 * Each stroke width a file gives a number of its own, and each mark it leaves to Typst's own width, as
 * `<file>:<line> writes <number>` or `<file>:<line> draws a <shape> with no stroke`, in the order the file writes them.
 * @param {{ file: string, code: string }[]} found
 */
const writtenWidths = (found) =>
  found.flatMap(({ file, code: text }) => {
    /** @type {Map<number, string>} */
    const written = new Map();
    const numbers = (/** @type {number} */ from, /** @type {string} */ value) => {
      for (const { index, 0: number } of value.matchAll(NUMBER))
        written.set(from + index, `writes ${number}`);
    };
    for (const { index, 0: key, 1: quote } of text.matchAll(SVG)) {
      const from = index + key.length;
      const end = text.indexOf(quote, from);
      numbers(from, text.slice(from, end < 0 ? text.length : end));
    }
    if (file.endsWith(".typ")) {
      for (const { from, value } of valuesOf(text, STROKES)) numbers(from, widthOf(value));
      for (const call of argumentsOf(text, PRIMITIVES))
        for (const { from, value } of ownValuesOf(call.value, WEIGHTS))
          numbers(call.from + from, widthOf(value));
      for (const { from, value } of argumentsOf(text, LINES))
        if (!/(?<![\w.-])stroke\s*:/u.test(shallow(value)))
          written.set(from, "draws a line with no stroke");
      for (const { from, name, value } of argumentsOf(text, SHAPES))
        if (!/(?<![\w.-])(?:stroke|fill)\s*:/u.test(shallow(value)))
          written.set(from, `draws a ${name} with no stroke and no fill`);
    }
    return [...written]
      .sort(([one], [other]) => one - other)
      .map(([offset, what]) => `${file}:${lineAt(text, offset)} ${what}`);
  });

/** The source of a file of `src/`, without its comments. */
const sourceOf = async (/** @type {string} */ file) =>
  (await modules([".mjs", ".typ"])).find((one) => one.file === file)?.code ?? "";

test("no file of the source writes a stroke's width as a number: each mark's weight is a token of the house", async () => {
  assert.deepEqual(writtenWidths(await modules([".mjs", ".typ"])), []);
});

test("the key draws an outside part's sample at a card's width and a planned or retired one at a relation's", async () => {
  const house = await sourceOf("src/overview/house.typ");
  const outside = house.match(/entry\.shape == "outside"[\s\S]*?\} else/u)?.[0] ?? "";
  assert.match(outside, /\bstroke: _house\.strokes\.card \* _k\b/u);
  assert.match(await sourceOf("src/poster/part.mjs"), /stroke-width="\$\{HOUSE\.strokes\.card\}"/u);
  const status = house.match(/entry\.shape == "hub"[\s\S]*?\} else \{([\s\S]*?)\n\}/u)?.[1] ?? "";
  assert.match(status, /\bthickness: _house\.lines\.rows\.relation\.stroke \* _k\b/u);
  assert.match(status, /\bkeyDash\b/u);
});

test("a width that holds a number, or a mark left to Typst's own width, is refused by its file and line; a token, a parameter, a text's width, a dash or a comment is not", () => {
  const found = (/** @type {string[]} */ lines, /** @type {string} */ file) =>
    writtenWidths([{ file, code: code(lines.join("\n")) }]);
  assert.deepEqual(
    found(
      [
        "// a comment may say stroke: 2pt",
        "line(length: 72pt, stroke: 2.4pt + green)",
        "line(stroke: (paint: mid, thickness: 1.07 * _k, dash: (4pt, 3pt)))",
        "grid(inset: (x: 36pt), stroke: (x, y) => (bottom: 0.6pt + rule))",
        "rect(width: 16pt, stroke: 0.8 * _k + rgb(c))",
        "line(length: width, stroke: size * 0.0075 + cinnabar)",
        "_ring(x, y, r: 4pt, w: if wide { 1.4pt } else { _line.ring })",
        "seg(a, b, w: _line.course * 2)",
        "_list(t, l, p, d, between: .4pt)",
        `image(bytes("<svg stroke-width='2' fill='none'>"))`,
        `image(bytes("<svg stroke-width='" + str(2) + "'>"))`,
        "line(length: 16pt)",
        "rect(width: 4pt, height: 4pt)",
        "_seg(a, b, w: _line.aside, c: ochre, dash: (4pt, 3pt))",
        "_set(x, b, note, w: cell - 16pt)",
        "tx(x, b, body, w: 200pt)",
        "rect(width: 4pt, fill: ink, stroke: _house.strokes.card * _k + rgb(c), radius: 3pt)",
        "circle(radius: r - w / 2, stroke: w + cinnabar)",
        `image(bytes("<svg stroke-width='" + str(_house.strokes.icon) + "'>"))`,
        "curve(fill: ink, curve.line(p))",
        "seg(a, b, w: if i == 0 { _line.rule } else { between }, c: rule)",
        "_list(t, l, p, (item, x, y) => { tx(x, y, item, w: term - 14pt) }, between: _line.hair)",
        "rect(width: 4pt, box(fill: ink))",
        "let path(f) = { path(f) }",
      ],
      "src/scratch.typ",
    ),
    [
      "src/scratch.typ:2 writes 2.4pt",
      "src/scratch.typ:3 writes 1.07",
      "src/scratch.typ:4 writes 0.6pt",
      "src/scratch.typ:5 writes 0.8",
      "src/scratch.typ:6 writes 0.0075",
      "src/scratch.typ:7 writes 1.4pt",
      "src/scratch.typ:8 writes 2",
      "src/scratch.typ:9 writes .4pt",
      "src/scratch.typ:10 writes 2",
      "src/scratch.typ:11 writes 2",
      "src/scratch.typ:12 draws a line with no stroke",
      "src/scratch.typ:13 draws a rect with no stroke and no fill",
      "src/scratch.typ:23 draws a rect with no stroke and no fill",
    ],
  );
  assert.deepEqual(
    found(
      [
        "/**",
        ' * Its outline, stroke-width="1.2" before.',
        " */",
        'const card = `<rect stroke-width="1.2"/>`;',
        'const tier = `<path stroke-width="${HOUSE.strokes.tier * 1.5}"/>`;',
        'const icon = `<g stroke-width="${HOUSE.strokes.icon}">`;',
        'const line = `<path stroke-width="${weight}" stroke-linejoin="round"/>`;',
        "const relation = { stroke: (emphasis) => row.stroke * (emphasis ? factor : 1) };",
      ],
      "src/poster/scratch.mjs",
    ),
    ["src/poster/scratch.mjs:4 writes 1.2", "src/poster/scratch.mjs:5 writes 1.5"],
  );
});
