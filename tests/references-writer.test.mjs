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

/** A tree of what the writer reads: the documents it writes, the source, the package, the mise lock, the release
 * archive's table and the formatter's policy, with the bundled renderers the command it runs for a sample reads,
 * linked as they are never changed here. */
async function tree() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-references-"));
  for (const part of [
    "README.md",
    "docs/how-to.md",
    "docs/reference",
    "src",
    ".config/checks/prettier",
    ".config/mise/mise.lock",
    "tools/release/archive/members.json",
    "package.json",
  ])
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
      [
        "docs/reference/command-line.md",
        '`{ "ok": false, "code": "usage", "message" }`',
        '`{ "ok": false, "code": "usage" }`',
      ],
      ["docs/reference/refusals.md", "2 for `usage`", "2 for `usage_error`"],
      ["src/model/schema.json", '"ko"]', '"ja"]'],
      ["docs/reference/model.md", "with a brown accent; the default.", "with a brown accent."],
      ["docs/reference/lines.md", "| not yet tested by a work |", "| no                       |"],
      ["README.md", "Linux on ARM64 and x86-64", "Linux on ARM64"],
      ["docs/how-to.md", "and for macOS on ARM64.", "and for macOS."],
      ["docs/reference/operations.md", "(Linux on x86-64)", "(Linux on x64)"],
      [
        "docs/reference/operations.md",
        "the package with the libraries it bundles in",
        "the package in",
      ],
      ["docs/reference/operations.md", "`commander` 15.1.0", "`commander` 15.0.0"],
      ["docs/reference/operations.md", "`TMP` and `SystemRoot`.", "`TMP`."],
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

test("the writer takes the exit statuses from the table of outcomes, as the command it runs for a sample does", async () => {
  const dir = await tree();
  try {
    const file = path.join(dir, "src/cli/outcomes.json");
    const outcomes = JSON.parse(await fs.readFile(file, "utf8"));
    outcomes.refused.status = 5;
    await fs.writeFile(file, `${JSON.stringify(outcomes, null, 2)}\n`);
    // The sample is still a refusal: it ends with the status the table now gives one.
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    for (const document of ["command-line", "refusals"])
      assert.match(
        refused.stderr,
        new RegExp(`references_drift: docs/reference/${document}\\.md: run`, "u"),
      );
    assert.equal((await writer("--write", dir)).code, 0);
    const read = (/** @type {string} */ document) =>
      fs.readFile(path.join(dir, `docs/reference/${document}.md`), "utf8");
    const commandLine = await read("command-line");
    assert.match(commandLine, /\n\| 5 +\| refused +\|/u);
    assert.match(commandLine, /\n└ {2}Exit status 5: refused\n/u);
    assert.match(await read("refusals"), /status of its outcome: 5 for every refusal, /u);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer writes the release's platforms, an archive's members, the bundled dependencies and a child's variables from their sources", async () => {
  const dir = await tree();
  /** Rewrite a file of the tree. @param {string} file @param {(text: string) => string} change */
  const edit = async (file, change) => {
    const target = path.join(dir, file);
    await fs.writeFile(target, change(await fs.readFile(target, "utf8")));
  };
  /** Rewrite a JSON file of the tree. @param {string} file @param {(value: any) => void} change */
  const editJson = (file, change) =>
    edit(file, (text) => {
      const value = JSON.parse(text);
      change(value);
      return `${JSON.stringify(value, null, 2)}\n`;
    });
  try {
    // The lock pins Typst for linux-x64 no more, so the release has no archive for it: a platform needs both tools.
    await edit(".config/mise/mise.lock", (text) =>
      text.replace('[tools.typst."platforms.linux-x64"]', '[tools.typst."platforms.windows-x64"]'),
    );
    await editJson("tools/release/archive/members.json", (table) => {
      table.members.runtime.path = "runtime";
    });
    await editJson("package.json", (manifest) => {
      manifest.dependencies.yaml = "2.9.1";
    });
    await editJson("src/environment.json", (table) => {
      table.passed.push("LANG");
    });
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    for (const file of ["README.md", "docs/how-to.md", "docs/reference/operations.md"])
      assert.match(refused.stderr, new RegExp(`references_drift: ${file}: run`, "u"));
    assert.equal((await writer("--write", dir)).code, 0);
    const read = (/** @type {string} */ file) => fs.readFile(path.join(dir, file), "utf8");
    for (const file of ["README.md", "docs/how-to.md"])
      assert.match(
        await read(file),
        /\nEach release has an archive for Linux on ARM64 and for macOS on ARM64\.\n/u,
      );
    const operations = await read("docs/reference/operations.md");
    assert.doesNotMatch(operations, /linux-x64`/u);
    assert.match(operations, / the Node\.js and Typst it runs in `archpub\/runtime`, /u);
    assert.match(operations, /\n`@clack\/prompts` 1\.9\.0, .* and `yaml` 2\.9\.1\.\n/u);
    assert.match(operations, /, `SystemRoot` and `LANG`\.\n/u);
    // A platform whose system the writer has no word for stops it, naming the platform.
    await edit(".config/mise/mise.lock", (text) =>
      text.replaceAll('"platforms.linux-arm64"]', '"platforms.freebsd-arm64"]'),
    );
    const unnamed = await writer("--check", dir);
    assert.equal(unnamed.code, 1);
    assert.match(unnamed.stderr, /references_platform_unnamed: freebsd-arm64/u);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer stops on a table that lacks a field it prints, naming the field", async () => {
  for (const [file, change, refusal] of [
    [
      "tools/release/archive/members.json",
      (/** @type {any} */ table) => delete table.members.runtime.holds,
      /references_text_missing: tools\/release\/archive\/members\.json states no holds of the member runtime/u,
    ],
    [
      "tools/release/archive/members.json",
      (/** @type {any} */ table) => delete table.members.package.path,
      /references_text_missing: tools\/release\/archive\/members\.json states no path of the member package/u,
    ],
    [
      "src/environment.json",
      (/** @type {any} */ table) => delete table.passed,
      /references_text_missing: src\/environment\.json states no passed variables/u,
    ],
  ]) {
    const dir = await tree();
    try {
      const target = path.join(dir, file);
      const table = JSON.parse(await fs.readFile(target, "utf8"));
      change(table);
      await fs.writeFile(target, JSON.stringify(table));
      const refused = await writer("--check", dir);
      assert.equal(refused.code, 1, file);
      assert.match(refused.stderr, refusal);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

// The operations reference lists the runtime dependencies from package.json's `dependencies` and says the package
// bundles them, which holds while `bundleDependencies` names the same packages.
test("the package bundles each of its runtime dependencies and no other", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  assert.deepEqual(
    [...manifest.bundleDependencies].sort(),
    Object.keys(manifest.dependencies).sort(),
  );
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
