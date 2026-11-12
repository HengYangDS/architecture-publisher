import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { USAGE, runCli } from "../src/cli/run.mjs";

const root = path.resolve(import.meta.dirname, "..");
const SKILL = path.join(root, "skills/architecture-publisher/SKILL.md");

/** The inline code spans of a Markdown text. */
const spans = (text) => [...text.matchAll(/`([^`\n]+)`/gu)].map(([, span]) => span);

/** An option named as a whole word: `--repo`, not the start of `--repository`. */
const names = (text, option) => new RegExp(`${option}(?![a-z-])`, "u").test(text);

/** The text of every file under a directory. */
async function textsUnder(directory) {
  const entries = await fs.readdir(directory, { recursive: true, withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => fs.readFile(path.join(entry.parentPath, entry.name), "utf8")),
  );
}

test("the package carries its agent Skill, and archpub skill prints it", async () => {
  const skill = await fs.readFile(SKILL, "utf8");
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  assert.ok(manifest.files.includes("skills/"));
  assert.deepEqual(await runCli(["skill"]), { exitCode: 0, output: skill });
  assert.deepEqual(JSON.parse((await runCli(["skill", "--json"])).output), {
    ok: true,
    file: SKILL,
    skill,
  });
  assert.equal((await runCli(["skill", "extra"])).exitCode, 2);
});

test("every command, option and refusal code the Skill names exists", async () => {
  const named = spans(await fs.readFile(SKILL, "utf8"));
  const commands = named.filter(
    (span) => span.startsWith("archpub ") && !span.includes("<command>"),
  );
  assert.ok(commands.length >= 6, "the Skill names the commands it runs");
  for (const span of commands) {
    const words = span.split(" ").slice(1);
    const command = words.slice(0, ["import", "scaffold"].includes(words[0]) ? 2 : 1);
    const help = await runCli([...command, "--help"]);
    assert.equal(help.exitCode, 0, span);
    for (const option of span.match(/--[a-z]+(?:-[a-z]+)*/gu) ?? [])
      assert.ok(names(help.output, option), `${span} names ${option}`);
  }
  for (const span of named.filter((one) => one.startsWith("--")))
    assert.ok(names(USAGE, span.split(" ")[0]), span);
  const codes = named.filter((span) => /^[a-z]+(?:_[a-z]+)+$/u.test(span));
  const sources = (await textsUnder(path.join(root, "src"))).join("\n");
  for (const code of codes)
    assert.match(sources, new RegExp(`\\b${code}\\b`, "u"), `no source defines ${code}`);
  assert.ok(codes.length >= 3, "the Skill names the refusals an author meets");
});
