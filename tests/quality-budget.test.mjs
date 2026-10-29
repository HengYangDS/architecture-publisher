import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";

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
