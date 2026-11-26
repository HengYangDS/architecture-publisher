/**
 * A code the publisher raises or reports: a key of the registry `refusal.json`, which holds each code once with
 * its meaning, and from which `tools/docs/references.mjs` writes the refusals reference. The registry is read for
 * this type alone: a code that no key names is refused when the source is type-checked.
 * @typedef {keyof typeof import("./refusal.json")} Code
 */
/** @typedef {{ code: Code, path?: string, message: string }} Problem */

/** A refused input: the caller can correct every listed problem and retry. */
export class Refusal extends Error {
  /**
   * @param {Code} code
   * @param {string} message
   * @param {Array<Problem>} [problems]
   */
  constructor(code, message, problems = []) {
    super(message);
    this.name = "Refusal";
    this.code = code;
    this.problems = problems;
  }
}

/**
 * @param {Code} code
 * @param {string} message
 * @param {Array<Problem>} [problems]
 * @returns {never}
 */
export function refuse(code, message, problems) {
  throw new Refusal(code, message, problems);
}
