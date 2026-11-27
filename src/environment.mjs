import fs from "node:fs";

/**
 * The variables a child process of the publisher receives from its caller, as the table beside this module
 * (src/environment.json) states them, with why no other variable is passed.
 * @type {readonly string[]}
 */
const PASSED = JSON.parse(
  fs.readFileSync(new URL("./environment.json", import.meta.url), "utf8"),
).passed;
if (!Array.isArray(PASSED) || PASSED.some((name) => typeof name !== "string" || !name))
  throw new Error("src/environment.json states no list passed of variable names");

/**
 * A child's environment: the caller's passed variables and the child's own.
 * @param {Record<string, string>} own
 */
export function childEnvironment(own) {
  return {
    ...Object.fromEntries(
      PASSED.flatMap((name) =>
        process.env[name] === undefined ? [] : [[name, process.env[name]]],
      ),
    ),
    ...own,
  };
}
