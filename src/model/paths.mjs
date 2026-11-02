/**
 * The repository paths a model names: the files its sources cite and the scope its
 * coverage declares.
 */

/**
 * A relative path inside a repository: no leading slash, backslash or control break, and
 * no empty, `.` or `..` segment.
 * @param {unknown} value
 */
export function isRelativePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1024 &&
    !value.startsWith("/") &&
    !/[\\\0\n\r]/u.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
  );
}

/** A scope path: a relative file path, or a directory path ending in a slash. */
const isScopePath = (value) =>
  typeof value === "string" && isRelativePath(value.endsWith("/") ? value.slice(0, -1) : value);

/**
 * Check the coverage scope: included paths and excluded paths with their reasons, none
 * repeated. Problems are added to the model's one collection.
 * @param {{ add: Function, fields: Function, text: Function }} problems
 * @param {any} value
 */
export function checkCoverage(problems, value) {
  if (value === undefined) return;
  if (!problems.fields(value, "/coverage", [], ["include", "exclude"])) return;
  const seen = new Set();
  const scopePath = (entry, where) => {
    if (!isScopePath(entry))
      problems.add(
        "model_coverage_path_invalid",
        where,
        "must be a relative file path or a directory path ending in a slash",
      );
    else if (seen.has(entry))
      problems.add("model_coverage_path_duplicate", where, `repeats ${entry}`);
    seen.add(entry);
  };
  if (value.include !== undefined) {
    if (!Array.isArray(value.include) || !value.include.length)
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
    if (!problems.fields(entry, where, ["path", "reason"], [])) return;
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
