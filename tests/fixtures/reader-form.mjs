/**
 * What is wrong with a reader file as a Markdown viewer renders it, one line each: it has one first-level heading,
 * skips no heading level, holds no line of the guide's syntax and no mark of it in its text, no link without text,
 * no list that a viewer would join to the list before it (one marker, only a blank line between), and outside its
 * code no word of the shared keys a reader file wrote before it spoke the model's language.
 * @param {string} text the reader file
 * @param {{ foreign?: readonly string[] }} [options] words of the shared keys that are not words of its language
 * @returns {string[]}
 */
export function readerFormProblems(text, { foreign = [] } = {}) {
  const problems = [];
  const lines = text.split("\n");
  let level = 0;
  let first = 0;
  let fenced = "";
  /** The marker of the list item the last line that is not blank holds, or none. */
  let item = null;
  lines.forEach((line, index) => {
    const marker = /^\s*(`{3,}|~{3,})/u.exec(line)?.[1];
    if (marker) {
      if (!fenced) fenced = marker;
      else if (marker[0] === fenced[0] && marker.length >= fenced.length) fenced = "";
      return;
    }
    if (fenced) return;
    if (line.trim()) {
      const marker = /^(?:([-*+])|\d+([.)]))\s/u.exec(line);
      const now = marker ? (marker[1] ?? marker[2]) : null;
      if (now && now === item && !lines[index - 1]?.trim())
        problems.push(`line ${index + 1} joins the list before it`);
      item = now;
    }
    const heading = /^(#{1,6}) /u.exec(line);
    if (heading) {
      const depth = heading[1].length;
      if (depth === 1) first += 1;
      if (depth > level + 1 && level) problems.push(`line ${index + 1} skips a heading level`);
      level = depth;
    }
    const bare = line.replace(/`[^`]*`/gu, "");
    if (/^@[a-z]/u.test(bare)) problems.push(`line ${index + 1} is a line of the guide's syntax`);
    if (/\{(?:#|tone:|level=|caution:|good:)/u.test(bare))
      problems.push(`line ${index + 1} holds a mark of the guide's syntax`);
    if (/\[\]\(/u.test(bare)) problems.push(`line ${index + 1} holds a link without text`);
    for (const word of foreign)
      if (
        new RegExp(`(?<![\\w-])${word}(?![\\w-])`, "u").test(
          bare.replace(/\[[^\]]*\]\([^)]*\)/gu, ""),
        )
      )
        problems.push(`line ${index + 1} holds the word "${word}"`);
  });
  if (first !== 1) problems.push(`the file has ${first} first-level headings`);
  return problems;
}
