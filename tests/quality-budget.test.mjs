import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { ESLint } from "eslint";
import { npmInvocation } from "./fixtures/npm-pack-report.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("native code lint admits 512 effective lines and refuses 513 without counting comment-only lines", async () => {
  const linter = new ESLint({
    cwd: root,
    overrideConfigFile: path.join(root, ".config/checks/eslint/eslint.config.mjs"),
    allowInlineConfig: false,
  });
  const source = "// Preserve comment-only lines.\n\n" + "void 0;\n".repeat(512);
  const [accepted] = await linter.lintText(source, { filePath: "tests/budget-probe.mjs" });
  assert.equal(accepted.errorCount, 0, JSON.stringify(accepted.messages));
  const [rejected] = await linter.lintText(source + "void 0;\n", {
    filePath: "tests/budget-probe.mjs",
  });
  assert(rejected.messages.some(({ ruleId }) => ruleId === "max-lines"));
  assert.equal(rejected.output, undefined);
});

test("the real documentation command admits 512 nonempty physical lines and refuses 513 without mutation", async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-doc-budget-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  await fs.mkdir(path.join(scratch, ".config/checks"), { recursive: true });
  for (const relative of [
    ".config/checks/markdownlint-cli2/.markdownlint-cli2.yaml",
    "tools/checks/markdown-budget.mjs",
    ".config/checks/file-budget/policy.toml",
    ".gitignore",
  ]) {
    await fs.mkdir(path.dirname(path.join(scratch, relative)), { recursive: true });
    await fs.copyFile(path.join(root, relative), path.join(scratch, relative));
  }
  await fs.symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "junction");
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  await fs.writeFile(
    path.join(scratch, "package.json"),
    JSON.stringify({
      name: "documentation-budget-fixture",
      scripts: { "check:docs": workspace.scripts["check:docs"] },
    }),
  );
  const invoke = npmInvocation(["run", "check:docs"]);
  const options = { cwd: scratch, encoding: "utf8", timeout: 30_000, stdio: "pipe" };
  const file = path.join(scratch, "README.md");
  const source =
    "# Scope\n\n" + Array.from({ length: 511 }, (_, index) => `- Item ${index + 1}\n`).join("");
  await fs.writeFile(file, source);
  let result = spawnSync(invoke.command, invoke.args, options);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const oversized = source + "- Item 512\n";
  await fs.writeFile(file, oversized);
  result = spawnSync(invoke.command, invoke.args, options);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /markdown-file-budget/u);
  assert.equal(await fs.readFile(file, "utf8"), oversized);
  const frontmatter = "---\nowner: Documentation\n---\n\n# Scope\n\n";
  const items = Array.from({ length: 508 }, (_, index) => `- Item ${index + 1}\n`).join("");
  await fs.writeFile(file, frontmatter + items);
  result = spawnSync(invoke.command, invoke.args, options);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  await fs.appendFile(file, "- Item 509\n");
  result = spawnSync(invoke.command, invoke.args, options);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /markdown-file-budget/u);
});
