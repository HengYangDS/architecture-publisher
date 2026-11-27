import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import OUTCOMES from "../src/cli/outcomes.json" with { type: "json" };
import { runCli } from "../src/cli/run.mjs";
import REGISTRY from "../src/refusal.json" with { type: "json" };
import { json } from "./fixtures/command-line.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";
import { code, modules, root } from "./fixtures/source.mjs";

// How a command ends stands once, in the command line's table of outcomes (src/cli/outcomes.json): each outcome's exit
// status and the keys of the JSON object it prints. The command line takes both from the table, and the command line
// and refusals references are written from it (held by `tests/references-writer.test.mjs`). These tests hold a real
// command of every outcome to the table, run the command line on a table whose statuses moved, and refuse a status
// written as a number into the command line's code.

/** The registry's section of a code, through the row it joins. */
const sectionOf = (/** @type {string} */ name) => REGISTRY[REGISTRY[name].with ?? name].section;

/** A command line that ends in each outcome, on a minimal model and a delivery whose manifest cannot be read. */
async function commandsOfEachOutcome(/** @type {import("node:test").TestContext} */ t) {
  const directory = await temporaryDirectory(t, "archpub-outcomes-");
  const at = (/** @type {string} */ name) => path.join(directory, name);
  await fs.writeFile(
    at("model.json"),
    JSON.stringify(minimalModel({ summary: "Alpha calls Beta." })),
  );
  const self = [{ id: "x", from: "a", to: "a", label: "y" }];
  await fs.writeFile(at("invalid.json"), JSON.stringify(minimalModel({ relations: self })));
  // A manifest that is a directory cannot be read, which is no refusal.
  await fs.mkdir(at("broken/manifest.json"), { recursive: true });
  return {
    done: ["check", at("model.json"), "--media", "edition"],
    refused: ["check", at("invalid.json")],
    usage: ["draw"],
    internal: ["accept", at("broken"), "--reviewer", "Reviewer"],
  };
}

test("each outcome has an exit status of its own, in order, success alone 0, and a failure prints a registered code", () => {
  const statuses = Object.values(OUTCOMES).map(({ status }) => status);
  assert.ok(statuses.every((status) => Number.isInteger(status) && status >= 0));
  assert.deepEqual(
    statuses,
    [...new Set(statuses)].sort((one, other) => one - other),
  );
  const sections = new Set(Object.values(REGISTRY).map(({ section }) => section));
  for (const [name, row] of Object.entries(OUTCOMES)) {
    // A shell takes 0 for success and any other status for a failure.
    assert.equal(row.ok, row.status === 0, name);
    if (row.ok) continue;
    // A failure prints a code first: the one it fixes, of the registry's command section, or one of the section named.
    assert.equal(row.keys[0], "code", name);
    assert.ok(row.code ? sectionOf(row.code) === "command" : sections.has(row.section), name);
  }
});

test("a command of each outcome exits with its status and prints the outcome's JSON object", async (t) => {
  const ends = await commandsOfEachOutcome(t);
  assert.deepEqual(Object.keys(ends), Object.keys(OUTCOMES));
  for (const [name, args] of Object.entries(ends)) {
    const { status, ok, code: fixed, section, keys } = OUTCOMES[name];
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, status, name);
    assert.equal(body.ok, ok, name);
    const [first, ...rest] = Object.keys(body);
    assert.equal(first, "ok", name);
    // Every key the outcome names has a value: a key left undefined would drop out of the JSON unseen.
    for (const key of keys ?? []) assert.notEqual(body[key], undefined, `${name}: ${key}`);
    // An outcome that names no keys prints the command's result after `ok`.
    if (keys) assert.deepEqual(rest, keys, name);
    else assert.ok(rest.length > 0, name);
    if (fixed) assert.equal(body.code, fixed, name);
    if (section) assert.equal(sectionOf(body.code), section, name);
    for (const problem of body.problems ?? [])
      assert.ok(typeof problem.code === "string" && typeof problem.message === "string", name);
    assert.equal((await runCli(args)).exitCode, status, name);
  }
});

test("the command line takes every status from the table: moved there, it moves in the exit, the help and the reports", async (t) => {
  // A tree of the command line whose table gives each failure another status; the libraries and supplies it reads
  // are linked, as they are never changed here.
  const tree = await temporaryDirectory(t, "archpub-outcomes-tree-");
  for (const part of ["src", "package.json"])
    await fs.cp(path.join(root, part), path.join(tree, part), { recursive: true });
  for (const linked of ["node_modules", "renderers", "supplies"])
    await fs.symlink(path.join(root, linked), path.join(tree, linked));
  const moved = structuredClone(OUTCOMES);
  for (const row of Object.values(moved)) if (!row.ok) row.status += 10;
  await fs.writeFile(path.join(tree, "src/cli/outcomes.json"), JSON.stringify(moved));
  const run = (/** @type {string[]} */ args) =>
    spawnSync(process.execPath, [path.join(tree, "src/cli/main.mjs"), ...args], {
      encoding: "utf8",
      timeout: 60_000,
      env: { PATH: process.env.PATH ?? "" },
    });
  const closings = [];
  for (const [name, args] of Object.entries(await commandsOfEachOutcome(t))) {
    const ended = run(args);
    assert.equal(ended.status, moved[name].status, `${name}: ${ended.stdout}${ended.stderr}`);
    const closing = /Exit status (\d+): [^\n]+\s*$/u.exec(ended.stdout);
    if (closing) closings.push([name, Number(closing[1])]);
  }
  // A report of a failure closes on its status; a usage error is commander's text, and success names what is next.
  assert.deepEqual(closings, [
    ["refused", moved.refused.status],
    ["internal", moved.internal.status],
  ]);
  const help = run(["--help"]);
  assert.equal(help.status, moved.done.status);
  const named = Object.entries(moved).map(([name, { status }]) => `${status} ${name}`);
  assert.ok(help.stdout.endsWith(`\n\nExit status: ${named.join(", ")}.\n`), help.stdout);
});

/**
 * Where an exit status stands written as a number in the command line's code: a result's `exitCode` or an assigned
 * one, an `exit` call, or a number after the word "status" in a text. Commander's own exit code, which the command
 * line reads and never sets, is not one.
 */
const WRITTEN = [/\bexitCode\s*(?::|=(?!=))\s*\d/u, /\bexit\(\s*\d/u, /\bstatus:?\s+\d/iu];

/** Each line of the command line's modules that writes a status as a number, as `<file>:<line>`. */
const writtenStatuses = (/** @type {Array<{ file: string, code: string }>} */ found) =>
  found
    .filter(({ file }) => file.startsWith("src/cli/"))
    .flatMap(({ file, code: text }) =>
      text
        .split("\n")
        .flatMap((line, index) =>
          WRITTEN.some((pattern) => pattern.test(line)) ? [`${file}:${index + 1}`] : [],
        ),
    );

test("no exit status stands written as a number in the command line's code", async () => {
  assert.deepEqual(writtenStatuses(await modules()), []);
});

test("a status written as a number is found however it is written, and one read from the table, commander's or a comment is not", () => {
  const one = (/** @type {string} */ text) =>
    writtenStatuses([{ file: "src/cli/scratch.mjs", code: code(text) }]);
  for (const text of [
    "return { exitCode: 2, output };",
    "process.exitCode = 1;",
    "process.exit(3);",
    '.addHelpText("afterAll", "\\nExit status: 0 done, 1 refused.");',
    'closing: "Exit status 1: refused",',
  ])
    assert.deepEqual(one(text), ["src/cli/scratch.mjs:1"], text);
  for (const text of [
    "return { exitCode: OUTCOMES[outcome].status, output };",
    "closing: `Exit status ${OUTCOMES.refused.status}: refused`,",
    "if (error instanceof CommanderError && error.exitCode === 0) return;",
    "// Exit status 1: refused",
    "/** Exit status 0 means success. */",
  ])
    assert.deepEqual(one(text), [], text);
  // The search reads the command line alone.
  assert.deepEqual(writtenStatuses([{ file: "src/build.mjs", code: "process.exit(1);" }]), []);
});
