import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

// The queue item `derived-references`: a table of a reference document that restates the source is written from it
// by a command, and the check of generated inputs refuses a table that differs. This runs the writer on a copy of
// what it reads, with one table of each kind changed by hand.

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const WRITER = path.join(root, "tools/docs/references.mjs");

/** A tree of what the writer reads: the documents it writes, the source, the package and the formatter's policy,
 * with the bundled renderers the command it runs for a sample reads, linked as they are never changed here. */
async function tree() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-references-"));
  for (const part of ["docs/reference", "src", ".config/checks/prettier", "package.json"])
    await fs.cp(path.join(root, part), path.join(dir, part), { recursive: true });
  for (const linked of ["node_modules", "renderers"])
    await fs.symlink(path.join(root, linked), path.join(dir, linked));
  return dir;
}

const writer = (/** @type {string} */ mode, /** @type {string} */ dir) =>
  run(process.execPath, [WRITER, mode, "--root", dir], { encoding: "utf8" }).then(
    () => ({ code: 0, stderr: "" }),
    (error) => ({ code: error.code, stderr: String(error.stderr) }),
  );

test("the writer refuses a table changed by hand, naming its document, and writes it back", async () => {
  const dir = await tree();
  try {
    assert.equal((await writer("--check", dir)).code, 0);
    for (const [file, from, to] of [
      ["docs/reference/refusals.md", "| `usage`", "| `usage`, `usage_typo`"],
      ["docs/reference/operations.md", "archpub skill [--json]", "archpub skill"],
      ["docs/reference/operations.md", "| `acceptance.sig`", "| `acceptance.asc`"],
      ["docs/reference/operations.md", "| Typst   | 0.15.1 ", "| Typst   | 0.15.2 "],
      [
        "docs/reference/model.md",
        "1 to 2000 characters, not blank",
        "1 to 3000 characters, not blank",
      ],
      ["docs/reference/model.md", "between components. May be empty.", "between components."],
      ["docs/reference/model.md", "`planned`, `retired`", "`planned`"],
      ["docs/reference/model.md", "type; the default.", "type."],
      ["docs/reference/command-line.md", "field; did you mean label?", "field."],
      ["src/model/schema.json", '"ko"]', '"ja"]'],
      ["docs/reference/model.md", "with a brown accent; the default.", "with a brown accent."],
      ["docs/reference/lines.md", "| not yet tested by a work |", "| no                       |"],
    ]) {
      const target = path.join(dir, file);
      const before = await fs.readFile(target, "utf8");
      assert.ok(before.includes(from), file);
      await fs.writeFile(target, before.replace(from, to));
      const refused = await writer("--check", dir);
      assert.equal(refused.code, 1, file);
      assert.match(refused.stderr, new RegExp(`references_drift: ${file}: run`, "u"));
      assert.equal((await writer("--write", dir)).code, 0, file);
      assert.equal(await fs.readFile(target, "utf8"), before, file);
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer refuses a document whose source changed, and writes it from the source", async () => {
  const dir = await tree();
  try {
    const house = path.join(dir, "src/house.json");
    const tokens = JSON.parse(await fs.readFile(house, "utf8"));
    tokens.palettes.soot.colours = "The greys of soot.";
    tokens.lines.rows.boundary.answers = "Is the part inside?";
    await fs.writeFile(house, `${JSON.stringify(tokens, null, 2)}\n`);
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /references_drift: docs\/reference\/model\.md: run/u);
    assert.match(refused.stderr, /references_drift: docs\/reference\/lines\.md: run/u);
    assert.equal((await writer("--write", dir)).code, 0);
    assert.match(
      await fs.readFile(path.join(dir, "docs/reference/model.md"), "utf8"),
      /The greys of soot\./u,
    );
    assert.match(
      await fs.readFile(path.join(dir, "docs/reference/lines.md"), "utf8"),
      /Is the part inside\?/u,
    );
    // A text the writer prints but the house lacks stops it by name.
    delete tokens.lines.rows.boundary.page;
    await fs.writeFile(house, `${JSON.stringify(tokens, null, 2)}\n`);
    const missing = await writer("--check", dir);
    assert.equal(missing.code, 1);
    assert.match(
      missing.stderr,
      /references_text_missing: src\/house\.json states no page of the line row boundary/u,
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer takes a mode and an optional root, and nothing else", async () => {
  const refused = await run(process.execPath, [WRITER, "--draft"], { encoding: "utf8" }).catch(
    (error) => error,
  );
  assert.equal(refused.code, 1);
  assert.match(String(refused.stderr), /references_mode_required/u);
});

test("the writer stops on a top-level field the schema neither describes nor fixes, naming it", async () => {
  const dir = await tree();
  try {
    const target = path.join(dir, "src/model/schema.json");
    const schema = JSON.parse(await fs.readFile(target, "utf8"));
    delete schema.properties.groups.description;
    await fs.writeFile(target, JSON.stringify(schema, null, 2));
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /references_description_missing: the schema's field groups/u);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer refuses a schema whose enumeration differs from the table that owns it, and writes it from the table", async () => {
  const dir = await tree();
  try {
    const looks = path.join(dir, "src/categories.json");
    const table = JSON.parse(await fs.readFile(looks, "utf8"));
    table.kindless = "frontend";
    await fs.writeFile(looks, `${JSON.stringify(table, null, 2)}\n`);
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /references_drift: src\/model\/schema\.json: run/u);
    assert.equal((await writer("--write", dir)).code, 0);
    const schema = JSON.parse(await fs.readFile(path.join(dir, "src/model/schema.json"), "utf8"));
    assert.equal(
      schema.properties.kinds.additionalProperties.properties.category.default,
      "frontend",
    );
    // The default language too: the table of languages names another, and the schema follows it.
    const languages = path.join(dir, "src/locales.json");
    const listed = JSON.parse(await fs.readFile(languages, "utf8"));
    listed.default = listed.languages.at(-1);
    await fs.writeFile(languages, `${JSON.stringify(listed, null, 2)}\n`);
    assert.equal((await writer("--check", dir)).code, 1);
    assert.equal((await writer("--write", dir)).code, 0);
    const written = JSON.parse(await fs.readFile(path.join(dir, "src/model/schema.json"), "utf8"));
    assert.equal(written.properties.locale.default, listed.default);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
