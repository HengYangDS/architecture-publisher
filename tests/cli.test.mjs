import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "packages/publisher/src/cli/main.mjs");

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 10000,
  });
}

test("top-level help presents the domain-neutral task surface", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Architecture Publisher\n/m);
  for (const command of ["source", "edition", "evolution", "render", "qualify", "publish"])
    assert.match(result.stdout, new RegExp(`^  ${command}\\b`, "m"));
  assert.doesNotMatch(result.stdout, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
});

test("scoped help is concise and derived from the routed commands", () => {
  const source = run(["source", "--help"]);
  assert.equal(source.status, 0, source.stderr);
  assert.match(source.stdout, /^Usage: archpub source <command>/m);
  assert.match(source.stdout, /^ {2}pack\b/m);
  assert.match(source.stdout, /^ {2}verify\b/m);
  assert.doesNotMatch(source.stdout, /^ {2}publish\b/m);

  const edition = run(["edition", "--help"]);
  assert.equal(edition.status, 0, edition.stderr);
  assert.match(edition.stdout, /^ {2}build\b/m);
  assert.match(edition.stdout, /direct inputs and optional Edition Providers/u);
  assert.doesNotMatch(edition.stdout, /^ {2}provider\b/m);
  const editionCommand = run(["edition", "build", "--help"]);
  assert.equal(editionCommand.status, 0, editionCommand.stderr);
  assert.match(editionCommand.stdout, /\[--output <candidate-directory>\]/u);

  const qualify = run(["qualify", "--help"]);
  assert.equal(qualify.status, 0, qualify.stderr);
  assert.match(qualify.stdout, /Check exact inputs and bind submitted qualification records/u);
  assert.doesNotMatch(qualify.stdout, /Verify exact externally produced qualification evidence/u);
  assert.match(qualify.stdout, /Bind submitted qualification records/u);
  assert.doesNotMatch(qualify.stdout, /Admit one exact Qualification Set/u);
  const qualifyCommand = run(["qualify", "verify", "--help"]);
  assert.equal(qualifyCommand.status, 0, qualifyCommand.stderr);
  assert.match(qualifyCommand.stdout, /--policy <file> --policy-sha256 <digest>/u);
});

test("usage errors identify the failing invocation and next help action", () => {
  const result = run(["source", "verify"]);
  assert.equal(result.status, 2);
  const error = JSON.parse(result.stdout);
  assert.equal(error.status, "error");
  assert.equal(error.error.code, "usage");
  assert.match(error.error.message, /source verify/);
  assert.equal(error.error.hint, "Run `archpub source --help`.");
  for (const args of [
    ["build"],
    ["build", "--help"],
    ["edition", "unknown"],
    ["edition", "unknown", "--help"],
  ]) {
    const invalid = run(args);
    assert.equal(invalid.status, 2, args.join(" "));
    const error = JSON.parse(invalid.stdout).error;
    const next = error.hint.match(/^Run `archpub(.*?)`\.$/u);
    assert(next, "A usage error gives an executable native help action");
    const help = run(next[1].trim().split(/\s+/u));
    assert.equal(help.status, 0, `${args.join(" ")}: ${error.hint}`);
    assert.match(help.stdout, /Usage: archpub/u);
  }
});

test("command parsing refuses unknown verbs, incomplete selectors and trailing arguments", () => {
  assert.equal(run(["-h"]).status, 0);
  const exactHelp = run(["source", "verify", "--help"]);
  assert.equal(exactHelp.status, 0);
  assert.match(exactHelp.stdout, /archpub source verify/);
  for (const args of [
    ["unknown"],
    ["source", "verify", "--sha256", "a".repeat(64)],
    ["source", "verify", "request.json", "--sha256"],
    ["source", "verify", "request.json", "--wrong", "a".repeat(64)],
    ["source", "verify", "request.json", "--sha256", "a".repeat(64), "extra"],
    ["qualify", "verify", "request.json", "--sha256", "a".repeat(64), "--policy", "policy.json"],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(" "));
    assert.equal(JSON.parse(result.stdout).error.code, "usage");
  }
});

test("one command catalog owns both dispatch and help", async () => {
  const { commandCatalog, helpFor } = await import("../packages/publisher/src/cli/commands.mjs");
  const paths = commandCatalog.map(({ path: parts }) => parts.join(" "));
  assert.equal(new Set(paths).size, paths.length);
  for (const entry of commandCatalog) {
    const scope = helpFor(entry.path.slice(0, 1));
    assert.match(scope, new RegExp(`\\b${entry.path.at(-1)}\\b`));
    assert.match(scope, new RegExp(entry.summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("main owns only process IO and top-level error projection", async () => {
  const main = await fs.readFile(cli, "utf8");
  assert.doesNotMatch(main, /node:(?:fs|path|crypto|child_process)/);
  assert.doesNotMatch(main, /JSON\.parse|readFile|lstat|resolve\(/);
  assert.doesNotMatch(main, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
  assert.match(main, /runCli/);
  assert.match(main, /process\.stdout/);
  assert.match(main, /process\.exitCode/);
});
