import { S_BAR, S_BAR_END, S_BAR_START, S_ERROR, S_INFO, S_SUCCESS, S_WARN } from "@clack/prompts";
import stringWidth from "fast-string-width";

/** The mark a report draws for each state of a fact, as the terminal's character set gives it. */
export const MARK = Object.freeze({
  passed: S_SUCCESS,
  attention: S_WARN,
  refused: S_ERROR,
  noted: S_INFO,
});

/** The frame a report draws: where it starts, the guide beside it and where it ends. */
export const FRAME = Object.freeze({ start: S_BAR_START, guide: S_BAR, end: S_BAR_END });

/**
 * A report as its lines: `["title", text]`, `["heading", text]`, `["closing", text]`, and each fact as
 * `[state, label, value]`. Columns are told apart by two spaces or more, the guide's blank lines are left out,
 * and a value that continues below its first line is joined again: without a space where a word longer than the
 * value's column was broken at the column's end, and with one everywhere else. A title continues beside the guide
 * until the guide's first blank line. A closing line is one line.
 * @param {string} output a report without colour
 * @param {number} [width] the columns the report was written for
 * @returns {string[][]}
 */
export function reportLines(output, width = 80) {
  /** @type {string[][]} */
  const lines = [];
  let filled = false;
  let titled = false;
  for (const line of output.split("\n")) {
    if (line === FRAME.guide) titled = false;
    if (line === "" || line === FRAME.guide) continue;
    const continued =
      line.startsWith(`${FRAME.guide}   `) || (titled && line.startsWith(`${FRAME.guide}  `));
    if (continued) {
      const text = line.replace(FRAME.guide, "").trimStart();
      const fact = lines[lines.length - 1];
      const room = width - (stringWidth(line) - stringWidth(text));
      const word = `${fact[fact.length - 1].split(" ").at(-1)}${text.split(" ")[0]}`;
      fact[fact.length - 1] += `${filled && stringWidth(word) > room ? "" : " "}${text}`;
    } else {
      const [mark, ...columns] = line.split(/ {2,}/u);
      titled = mark === FRAME.start;
      const state = Object.keys(MARK).find((name) => MARK[name] === mark);
      lines.push(
        state
          ? [state, ...columns]
          : [{ [FRAME.start]: "title", [FRAME.end]: "closing" }[mark] ?? "heading", ...columns],
      );
    }
    filled = stringWidth(line) === width;
  }
  return lines;
}
