/** A refused input: the caller can correct every listed problem and retry. */
export class Refusal extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Array<{ code: string, path?: string, message: string }>} [problems]
   */
  constructor(code, message, problems = []) {
    super(message);
    this.name = "Refusal";
    this.code = code;
    this.problems = problems;
  }
}

/**
 * @param {string} code
 * @param {string} message
 * @param {Array<{ code: string, path?: string, message: string }>} [problems]
 * @returns {never}
 */
export function refuse(code, message, problems) {
  throw new Refusal(code, message, problems);
}
