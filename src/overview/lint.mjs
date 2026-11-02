import { refuse } from "../refusal.mjs";

/**
 * What a composition may not do itself: fetch a package or load a plugin, or set type, colour
 * or the page, which the house class owns. Comments are ignored; each rule names the first line
 * that breaks it.
 */
const RULES = Object.freeze([
  {
    code: "overview_import_refused",
    pattern: /\bimport\s+"@|\bplugin\s*\(/u,
    reason: "imports a package or loads a plugin; the overview uses only the house class",
  },
  {
    code: "overview_style_refused",
    pattern:
      /(^|[^\w-])(text|rgb|luma|cmyk|oklab|oklch|color\.\w+)\s*\(|\bset\s+(page|par)\b|\bfont:\s*[("]|\bsize:\s*[\d.]+\s*(pt|em|mm|cm|in|%)/u,
    reason: "sets type, colour or the page itself; use the house class's sizes, faces and palette",
  },
]);

/** A Typst source with its comments blanked, keeping every line in place. */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//gu, (comment) => comment.replace(/[^\n]/gu, " "))
    .replace(/\/\/[^\n]*/gu, "");
}

/**
 * Refuse a composition whose Typst files break a rule.
 * @param {Array<{ file: string, text: string }>} sources
 */
export function lintComposition(sources) {
  /** @type {Array<{ code: string, path?: string, message: string }>} */
  const problems = [];
  for (const { file, text } of sources) {
    const lines = withoutComments(text).split("\n");
    for (const rule of RULES) {
      const index = lines.findIndex((line) => rule.pattern.test(line));
      if (index >= 0)
        problems.push({ code: rule.code, path: `${file}:${index + 1}`, message: rule.reason });
    }
  }
  if (problems.length)
    refuse(problems[0].code, "The composition does what the house class owns.", problems);
}
