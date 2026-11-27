import fs from "node:fs";

/**
 * How a command ends: the table beside this module (src/cli/outcomes.json) states each outcome once, in the order of
 * its exit status, with whether it succeeded, the registry's code it prints or the registry's section its code comes
 * from, the keys of the JSON object `--json` prints after `ok`, and what it means. The command line takes its exit
 * statuses, its help's last line, its reports' closing lines and its JSON results from it; the command line and
 * refusals references are written from it (`tools/docs/references.mjs`).
 * @typedef {keyof typeof import("./outcomes.json")} Outcome
 */

/**
 * The table, read once and read-only.
 * @type {Readonly<Record<Outcome, Readonly<{ status: number, ok: boolean, code?: import("../refusal.mjs").Code,
 *   section?: string, keys?: readonly string[], meaning: string }>>>}
 */
export const OUTCOMES = JSON.parse(
  fs.readFileSync(new URL("./outcomes.json", import.meta.url), "utf8"),
  (_key, value) => (value && typeof value === "object" ? Object.freeze(value) : value),
);

/**
 * The JSON object a command prints for its outcome with `--json`: `ok`, then each key the outcome names, in its
 * order, from what the command ended with, the code being the outcome's own where it states one. An outcome that names
 * no keys prints the whole of what the command returned, which is its result.
 * @param {Outcome} outcome
 * @param {any} ended what the command ended with: its result, its refusal or the message of its failure
 */
export function resultOf(outcome, ended) {
  const { ok, code, keys } = OUTCOMES[outcome];
  if (!keys) return { ok, ...ended };
  const value = (/** @type {string} */ key) => (key === "code" ? (code ?? ended.code) : ended[key]);
  return { ok, ...Object.fromEntries(keys.map((key) => [key, value(key)])) };
}
