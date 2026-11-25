import { wordsOf } from "../locale.mjs";
import { readerWordsOf } from "../reader-words.mjs";
import { block as list, figureText, walks } from "./figure-text.mjs";

/**
 * A guide as the reader file's last part: written from the draft as Archify's own parser reads it (`parsedGuide`), as
 * plain Markdown a viewer renders. The guide's answer opens it; each panel is a section, one level below the part's
 * heading; prose stays a paragraph, facts a list of terms, a comparison a table, the steps of a flow a numbered list
 * and those of another diagram a bulleted one, a callout a quote, a diagram, a chart or an image a line that names
 * its title and its file (a Mermaid chart keeps its text in a fence; a diagram's content follows its line as text,
 * `figure-text.mjs`), a code excerpt a line that names its source, a
 * snippet or a diff its fenced text, a metric its value. A citation is a footnote, several at one place in ascending order;
 * the footnotes stand at the end, after one sentence naming the pin their lines are those of. No directive of the
 * draft's syntax, no anchor mark, no link without text and no mark of another language remains.
 *
 * A checklist keeps its boxes (`- [ ]`). Two lists of one kind that follow each other take different markers (`-` and
 * `*`, `1.` and `1)`), since a viewer joins two lists of one marker into one. Left out, as the page's own reading aids
 * and not its content: a metric's `typical` flag, and a data chart's columns, whose file the line names.
 */

/** An id as Archify's draft writes one: letters and digits of any script, `_` and `-`. */
const ID = "[\\p{L}\\p{N}_-]+";

/** Adjacent citations of a draft, each a link to a source by id, empty or with its own words. */
const CITATIONS = new RegExp(`(?:\\[[^\\]]*\\]\\(source:${ID}\\))+`, "gu");

/** One citation of a run, its words and its source's id. */
const CITATION = new RegExp(`\\[([^\\]]*)\\]\\(source:(${ID})\\)`, "gu");

/**
 * A link into the page itself, `[text](block:id)`, `node:`, `route:`, `typical:` or `#id`, which a Markdown viewer of
 * this file cannot follow: its text alone stays.
 */
const PAGE_LINK = /\[([^\]]+)\]\((?:block:|node:|route:|typical:|#)[^)]*\)/gu;

/**
 * Markup of emphasis in a short text set in emphasis already, such as a step's title, and the code spans whose text
 * stays as written: a path such as `__init__.py` keeps its underscores.
 */
const EMPHASIS = /(`+)[\s\S]*?\1|\*\*|__/gu;

/** A short text without its emphasis marks, its code spans as written. */
const unemphasized = (/** @type {string} */ text) =>
  text.replace(EMPHASIS, (found) => (found.startsWith("`") ? found : ""));

/** The kinds whose steps are a sequence, which a reader reads in order. */
const FLOWS = new Set(["workflow", "sequence", "lifecycle", "dataflow"]);

/** A table cell's text: on one line, its pipes escaped. */
const cell = (/** @type {string} */ text) => text.replace(/\s*\n\s*/gu, " ").replaceAll("|", "\\|");

/**
 * The guide's part of the reader file, as Markdown.
 * @param {any} document the draft as Archify's parser reads it
 * @param {{ locale?: string | null, titles?: Map<string, string>, figures?: Map<string, any>,
 *   repository?: { name: string, revision?: string | null } | null }} options the work's language; the title the
 *   draft gives each block by id; each diagram document the guide names, by its file's name; and the repository
 *   whose pin the sources' lines are those of
 * @returns {string}
 */
export function guideText(
  document,
  { locale, titles = new Map(), figures = new Map(), repository = null },
) {
  const words = readerWordsOf(locale);
  const marks = wordsOf(locale);
  /**
   * @type {Map<string, number>} the number of each source, in the order the text first cites it: a source of the
   * guide by its id, a file a figure's item cites by `file:` and its path and lines
   */
  const numbers = new Map();
  /** @type {Map<string, { title?: string, path: string, lines: [number, number] | null }>} */
  const fileSources = new Map();
  const number = (/** @type {string} */ id) => {
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
    return /** @type {number} */ (numbers.get(id));
  };
  // Every inline text of the guide passes here: a run of citations becomes its words, if any, and its footnotes.
  const cited = (/** @type {string} */ text) =>
    String(text ?? "")
      .replace(PAGE_LINK, "$1")
      .replace(CITATIONS, (found, at, whole) => {
        const runs = [...found.matchAll(CITATION)];
        const said = runs
          .map(([, words]) => words)
          .filter(Boolean)
          .join(" ");
        // A citation's words stand where its link stood; its footnotes follow them, after the language's space
        // unless a space already stands before.
        const before = said || at === 0 || /\s$/u.test(whole.slice(0, at)) ? "" : marks.between;
        return (
          said +
          (said ? marks.between : before) +
          [...new Set(runs.map(([, , id]) => number(id)))]
            .sort((a, b) => a - b)
            .map((n) => `[^${n}]`)
            .join("")
        );
      });
  /**
   * The footnote marks of what a figure's item cites, after the language's space: the guide's sources its block
   * names for the item, and the files the item itself names.
   */
  const citesOf = (/** @type {any} */ shown) => (/** @type {any} */ item) => {
    const keys = [];
    const id = item?.id !== undefined ? shown.nodeSources?.[item.id] : undefined;
    if (typeof id === "string") keys.push(id);
    for (const source of Array.isArray(item?.sources) ? item.sources : []) {
      if (typeof source?.path !== "string") continue;
      const from = Number.isInteger(source.line) ? source.line : null;
      const to = Number.isInteger(source.end_line) ? source.end_line : from;
      const key = `file:${source.path}:${from ?? ""}:${to ?? ""}`;
      if (!fileSources.has(key))
        fileSources.set(key, {
          title: typeof source.label === "string" ? source.label : undefined,
          path: source.path,
          lines: from === null || to === null ? null : [from, to],
        });
      keys.push(key);
    }
    if (!keys.length) return "";
    return `${marks.between}${[...new Set(keys.map(number))]
      .sort((a, b) => a - b)
      .map((n) => `[^${n}]`)
      .join("")}`;
  };
  /** A short text set in one emphasis: its own emphasis marks go, its links as in running text. */
  const plain = (/** @type {string} */ text) => unemphasized(cited(text)).trim();
  const strong = (/** @type {string} */ text) => `**${plain(text)}**`;
  /** A figure's or an excerpt's line: its kind's word and its title, in italics. */
  const caption = (/** @type {string} */ word, /** @type {string | null | undefined} */ title) =>
    `*${word}${title ? `${marks.colon}${plain(title)}` : ""}*`;
  /** Each diagram's kind, by its block's id. */
  const kindOf = new Map();
  for (const panel of document.panels ?? [])
    for (const block of panel.blocks ?? [])
      if (block.type === "diagram") kindOf.set(block.id, block.diagramType);
  /** A diagram's document: the file it names, or the one the parse holds inline. */
  const figureOf = (/** @type {any} */ shown) =>
    shown.source ? figures.get(shown.source) : shown.spec;
  const { walkOf, merged } = walksOf(document, figureOf);
  /** The figures written above as text, by block id. */
  const written = new Set();
  /** The marks a figure's text needs: the language's, its comma between the items of a list. */
  const figureMarks = { ...marks, list: marks.comma };
  /** @type {string[][]} */
  const blocks = [];
  // The guide's own question, and the line that qualifies its answer (its version and pin, what it read).
  if (document.meta?.title) blocks.push([strong(document.meta.title)]);
  if (document.answer?.scope) blocks.push([`*${cited(document.answer.scope)}*`]);
  if (document.answer?.summary) blocks.push([cited(document.answer.summary)]);
  const reasons = (document.answer?.reasons ?? []).map((/** @type {any} */ reason) =>
    cited(typeof reason === "string" ? reason : (reason.text ?? "")),
  );
  if (reasons.length)
    blocks.push(
      list(
        "bullet",
        reasons.map((text) => `- ${text}`),
      ),
    );
  for (const panel of document.panels ?? []) {
    blocks.push([`### ${cited(panel.title).trim()}`]);
    for (const block of panel.blocks ?? []) {
      if (block.type === "prose") blocks.push([cited(block.text)]);
      else if (block.type === "facts")
        blocks.push(
          list(
            "bullet",
            block.entries.map(
              (/** @type {any} */ { key, value }) =>
                `- ${strong(key)}${marks.colon}${cited(String(value))}`,
            ),
          ),
        );
      else if (block.type === "comparison")
        blocks.push([
          `| ${[block.labelColumn ?? "", ...block.columns].map((text) => cell(cited(text))).join(" | ")} |`,
          `| ${["---", ...block.columns.map(() => "---")].join(" | ")} |`,
          ...block.rows.map(
            (/** @type {any} */ row) =>
              `| ${[
                cited(row.label),
                ...row.cells.map((/** @type {any} */ one) => {
                  // A cell's tone in words of the language, beside its verdict where the verdict says more than
                  // the cell's text; a cell that is its verdict alone says it once.
                  const text = cited(one.text ?? "");
                  const tone = one.assessment
                    ? words[/** @type {"good" | "caution" | "bad"} */ (one.assessment)]
                    : null;
                  // The cell's text keeps its citations, which the verdict never holds.
                  const said = String(one.text ?? "")
                    .replace(CITATIONS, "")
                    .trim();
                  const verdict = one.verdict && one.verdict !== said ? one.verdict : null;
                  const note = [verdict, tone].filter(Boolean).join(marks.comma);
                  return note ? words.aside(text, note) : text;
                }),
              ]
                .map(cell)
                .join(" | ")} |`,
          ),
        ]);
      else if (block.type === "steps" && merged.has(block)) continue;
      else if (block.type === "steps") {
        const diagram = block.items?.find((/** @type {any} */ { target }) => target?.diagram)
          ?.target.diagram;
        // A flow's steps are numbered in their order, unless its figure is written above as a numbered list of its
        // own: then the steps are notes on its items, and numbers would point at the figure's.
        const flow = !diagram || (FLOWS.has(kindOf.get(diagram)) && !written.has(diagram));
        blocks.push(
          list(
            flow ? "ordered" : "bullet",
            block.items.map(
              (/** @type {any} */ item, /** @type {number} */ index) =>
                `${flow ? `${index + 1}.` : "-"} ${strong(item.text)}${
                  item.detail ? `${marks.colon}${cited(item.detail)}` : ""
                }`,
            ),
          ),
        );
      } else if (block.type === "list")
        blocks.push(
          list(
            block.ordered ? "ordered" : "bullet",
            (block.items ?? []).map(
              (/** @type {any} */ item, /** @type {number} */ index) =>
                `${block.ordered ? `${index + 1}.` : "-"}${block.checklist ? " [ ]" : ""} ${cited(
                  typeof item === "string" ? item : item.text,
                )}`,
            ),
          ),
        );
      else if (block.type === "callout") {
        // The callout's level in a word and its title, in one emphasis: two would read as two headings.
        const head = [
          { warning: words.warning, "open-question": words.openQuestion }[String(block.level)],
          block.title,
        ]
          .filter(Boolean)
          .map((part) => unemphasized(cited(part)).trim())
          .join(marks.colon);
        blocks.push(
          [head ? `**${head}**` : "", ...cited(block.text ?? "").split("\n")]
            .filter((line, index) => index || line)
            .flatMap((line, index) => (index ? [">", `> ${line}`.trimEnd()] : [`> ${line}`])),
        );
      } else if (block.type === "diagram") {
        // The title the draft gives the block, else the one the figure's own document states.
        const figure = figureOf(block);
        const title = titles.get(block.id) ?? figure?.meta?.title;
        blocks.push([
          `${caption(words.figure, title)}${block.source ? ` (\`${block.source}\`)` : ""}`,
        ]);
        // What the figure says, with the words of the steps that walk it.
        const said = figureText(
          block.diagramType,
          figure,
          { words, marks: figureMarks, plain, text: cited, cell, cite: citesOf(block) },
          walkOf.get(block.id),
        );
        if (said.length) written.add(block.id);
        blocks.push(...said);
      } else if (block.type === "code") {
        const source = (document.sources ?? []).find(
          (/** @type {any} */ { id }) => id === block.source,
        );
        const where = source?.path
          ? ` (\`${source.path}\`${source.lines ? `${marks.between}${words.lines(source.lines[0], source.lines[1])}` : ""})`
          : "";
        blocks.push([
          `*${words.excerpt}*${where}${source ? `${marks.between}[^${number(source.id)}]` : ""}`,
        ]);
      } else if (block.type === "snippet" || block.type === "diff") {
        // A fence longer than any run of backticks in the text, so the text cannot close it.
        const fence = "`".repeat(
          Math.max(3, ...[...String(block.text).matchAll(/`+/gu)].map(([run]) => run.length + 1)),
        );
        const title = block.title ?? block.caption;
        if (title) blocks.push([`*${plain(title)}*`]);
        blocks.push([
          `${fence}${block.type === "diff" ? "diff" : (block.language ?? "")}`,
          block.text,
          fence,
        ]);
      } else if (block.type === "chart") {
        const line = caption(words.figure, block.title);
        blocks.push(
          block.data?.path ? [`${line} (\`${block.data.path}\`)`] : [line],
          ...(typeof block.text === "string" ? [["```mermaid", block.text, "```"]] : []),
        );
      } else if (block.type === "image")
        blocks.push([`${caption(words.figure, block.caption || block.alt)} (\`${block.path}\`)`]);
      else if (block.type === "metric")
        blocks.push(
          list("bullet", [
            `- ${strong(block.label)}${block.value === undefined ? "" : `${marks.colon}${[block.value, block.unit].filter((part) => part !== undefined).join(" ")}`}${
              block.limit !== undefined
                ? `${marks.semicolon}${words.limit} ${block.limit}${block.unit ? ` ${block.unit}` : ""}`
                : ""
            }${block.note ? `${marks.between}${words.aside("", cited(block.note)).trim()}` : ""}`,
          ]),
        );
    }
  }
  // Two lists of one kind that follow each other: the second takes the other marker, which a viewer reads as a
  // new list.
  /** @type {{ kind: string | null, other: boolean }} */
  let previous = { kind: null, other: false };
  const marked = blocks.map((/** @type {any} */ lines) => {
    /** @type {string | null} */
    const kind = lines.list ?? null;
    const other = kind !== null && previous.kind === kind && !previous.other;
    previous = { kind, other };
    if (!other) return lines;
    return lines.map((/** @type {string} */ line) =>
      kind === "bullet" ? line.replace(/^- /u, "* ") : line.replace(/^(\d+)\. /u, "$1) "),
    );
  });
  if (!numbers.size) return `${marked.map((lines) => lines.join("\n")).join("\n\n")}\n`;
  const sources = new Map(
    (document.sources ?? []).map((/** @type {any} */ source) => [source.id, source]),
  );
  const notes = [...numbers].map(([id, n]) => {
    const source = sources.get(id) ?? fileSources.get(id);
    const where = source?.path
      ? `\`${source.path}\`${source.lines ? `${marks.between}${words.lines(source.lines[0], source.lines[1])}` : ""}`
      : (source?.url ?? id);
    return `[^${n}]: ${source?.title ? `${source.title}${marks.colon}` : ""}${where}`;
  });
  const pin =
    repository?.name && repository.revision
      ? [[words.pinned(repository.name, repository.revision)]]
      : [];
  return `${[...marked, ...pin, notes].map((lines) => lines.join("\n")).join("\n\n")}\n`;
}

/**
 * The steps that walk a figure of their panel, each naming one of its items: by the figure's block id, and the
 * steps blocks whose words stand with the figure's items instead of on their own.
 * @param {any} document the guide as Archify's parser reads it
 * @param {(shown: any) => any} figureOf a diagram block's document
 */
function walksOf(document, figureOf) {
  /** @type {Map<string, any[]>} */
  const walkOf = new Map();
  const merged = new Set();
  for (const panel of document.panels ?? [])
    for (const steps of panel.blocks ?? []) {
      if (steps.type !== "steps") continue;
      const ids = new Set(
        (steps.items ?? []).map((/** @type {any} */ item) => item?.target?.diagram),
      );
      const shown = (panel.blocks ?? []).find(
        (/** @type {any} */ one) =>
          one.type === "diagram" && ids.size === 1 && ids.has(one.id) && !walkOf.has(one.id),
      );
      if (shown && walks(shown.diagramType, figureOf(shown), steps.items)) {
        walkOf.set(shown.id, steps.items);
        merged.add(steps);
      }
    }
  return { walkOf, merged };
}
