/**
 * The repository paths a model names: the files its components claim and its relations cite,
 * and the scope its coverage declares.
 */

import { GUIDE, PATH, fieldsOf, leastOf } from "./vocabulary.mjs";

/** The fields of the coverage and of an exclusion, and the fewest included paths, as the schema states them. */
const COVERAGE = "/properties/coverage";
const FIELDS = Object.freeze({
  coverage: fieldsOf(COVERAGE),
  exclusion: fieldsOf(`${COVERAGE}/properties/exclude/items`),
});
const LEAST_INCLUDED = leastOf(`${COVERAGE}/properties/include`);

/**
 * A relative path inside a repository, as the schema's path states it (no leading slash, backslash or control
 * break, and no empty, `.` or `..` segment), naming a file: a directory's final slash is taken off by the caller.
 * @param {unknown} value
 */
export const isRelativePath = (value) =>
  typeof value === "string" &&
  value.length <= PATH.most &&
  PATH.form.test(value) &&
  !value.endsWith("/");

/** A guide composition: a relative path to an Archify explainer draft within the model's directory. */
export const isGuidePath = (value) => isRelativePath(value) && GUIDE.test(value);

/**
 * A scope path: a relative file path, or a directory path ending in a slash; either may be a
 * glob.
 */
const isScopePath = (value) =>
  typeof value === "string" && isRelativePath(value.endsWith("/") ? value.slice(0, -1) : value);

/**
 * Check the coverage scope: included paths and excluded paths with their reasons, none
 * repeated. Problems are added to the model's one collection.
 * @param {Pick<import("./overview.mjs").Problems, "add" | "fields" | "text">} problems
 * @param {any} value
 */
export function checkCoverage(problems, value) {
  if (value === undefined) return;
  if (!problems.fields(value, "/coverage", FIELDS.coverage)) return;
  const seen = new Set();
  const scopePath = (entry, where) => {
    if (!isScopePath(entry))
      problems.add(
        "model_coverage_path_invalid",
        where,
        "must be a relative file path or a directory path ending in a slash, either of which may be a glob",
      );
    else if (seen.has(entry))
      problems.add("model_coverage_path_duplicate", where, `repeats ${entry}`);
    seen.add(entry);
  };
  if (value.include !== undefined) {
    if (!Array.isArray(value.include) || value.include.length < LEAST_INCLUDED)
      problems.add(
        "model_coverage_invalid",
        "/coverage/include",
        "must be a non-empty list of paths",
      );
    else value.include.forEach((entry, index) => scopePath(entry, `/coverage/include/${index}`));
  }
  if (value.exclude === undefined) return;
  if (!Array.isArray(value.exclude))
    return problems.add("model_coverage_invalid", "/coverage/exclude", "must be a list");
  value.exclude.forEach((entry, index) => {
    const where = `/coverage/exclude/${index}`;
    if (!problems.fields(entry, where, FIELDS.exclusion)) return;
    scopePath(entry.path, `${where}/path`);
    // A missing reason is already reported as a required field.
    problems.text(entry.reason, `${where}/reason`, true);
  });
}

/**
 * The checked coverage scope in normalized form, or `null` when the model declares none.
 * @param {any} value
 */
export function normalizeCoverage(value) {
  if (!value) return null;
  return {
    include: value.include ? [...value.include] : null,
    exclude: (value.exclude ?? []).map(({ path, reason }) => ({ path, reason })),
  };
}
