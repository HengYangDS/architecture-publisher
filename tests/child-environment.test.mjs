import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import TABLE from "../src/environment.json" with { type: "json" };
import { childEnvironment } from "../src/environment.mjs";

// A child process of the publisher receives from its caller the variables of one table (src/environment.json), with
// its own over them, and no other. The module that passes them reads the table, and the operations reference's list is
// written from it (tools/docs/references.mjs).

const root = path.resolve(import.meta.dirname, "..");

/**
 * What `body` returns while the caller's environment holds `variables` alone; the environment is restored after.
 * @template T
 * @param {Record<string, string>} variables
 * @param {() => T} body
 */
function asCaller(variables, body) {
  const saved = { ...process.env };
  const set = (/** @type {Record<string, string | undefined>} */ each) => {
    for (const name of Object.keys(process.env)) delete process.env[name];
    Object.assign(process.env, each);
  };
  set(variables);
  try {
    return body();
  } finally {
    set(saved);
  }
}

/** Each name with a value of its own. @param {string[]} names */
const valued = (names) => Object.fromEntries(names.map((name) => [name, `caller's ${name}`]));

test("a child receives the table's variables its caller sets, with its own over them, and no other", () => {
  const [first, ...rest] = TABLE.passed;
  const caller = valued([...TABLE.passed, "GIT_DIR", "ARCHIFY_EXPLAINER_PREPARED"]);
  assert.deepEqual(
    asCaller(caller, () => childEnvironment({ [first]: "own", OWN: "own" })),
    { ...valued(TABLE.passed), [first]: "own", OWN: "own" },
  );
  // A variable of the table that the caller does not set is not set for the child.
  assert.deepEqual(
    asCaller(valued(rest), () => childEnvironment({})),
    valued(rest),
  );
});

/** The module copied beside the given table, loaded. @param {string} dir @param {unknown} table */
async function copyWith(dir, table) {
  await fs.copyFile(path.join(root, "src/environment.mjs"), path.join(dir, "environment.mjs"));
  await fs.writeFile(path.join(dir, "environment.json"), JSON.stringify(table));
  return import(pathToFileURL(path.join(dir, "environment.mjs")).href);
}

test("the module reads its table: with another table a child receives other variables", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-environment-"));
  try {
    const copy = await copyWith(dir, { passed: ["ARCHPUB_PASSED"] });
    assert.deepEqual(
      asCaller({ ...valued(TABLE.passed), ARCHPUB_PASSED: "yes" }, () => copy.childEnvironment({})),
      { ARCHPUB_PASSED: "yes" },
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the module refuses a table that states no list of variables, naming it", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-environment-"));
  try {
    await assert.rejects(copyWith(dir, {}), {
      message: "src/environment.json states no list passed of variable names",
    });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
