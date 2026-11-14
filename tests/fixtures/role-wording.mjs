/** Wording that presumes who holds a role: a person, a human, people, or the user alone. */
const PRESUMES_A_HOLDER =
  /\b(?:an?|the) (?:person|human|people)\b|\bonly the user\b|\bby (?:a )?humans?\b/iu;

/**
 * The lines of a text that presume a role's holder is a person, counted from one.
 * @param {string} text
 * @returns {number[]}
 */
export function holderWordingLines(text) {
  return text
    .split("\n")
    .flatMap((line, index) => (PRESUMES_A_HOLDER.test(line) ? [index + 1] : []));
}
