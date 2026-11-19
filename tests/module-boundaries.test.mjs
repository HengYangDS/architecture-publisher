import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "src");

/** Each unit of the publisher and the units it may import: language, input, plan, layout, media, delivery, command line. */
const ALLOWED = Object.freeze({
  refusal: [],
  environment: [],
  locale: [],
  breaks: [],
  supply: ["refusal"],
  icons: ["supply"],
  kinds: ["icons", "locale"],
  model: ["locale", "model", "refusal"],
  sources: ["environment", "refusal", "sources"],
  facts: ["facts"],
  plan: ["locale", "model", "refusal"],
  layout: ["layout", "refusal"],
  poster: ["breaks", "kinds", "layout", "locale", "poster", "refusal", "supply"],
  map: ["breaks", "environment", "kinds", "layout", "locale", "map", "refusal", "supply"],
  overview: ["breaks", "environment", "overview", "refusal", "supply"],
  edition: ["edition", "environment", "locale", "overview", "refusal", "supply"],
  importers: ["locale", "model", "refusal", "supply"],
  style: ["model", "refusal"],
  pinned: ["locale", "pinned", "refusal"],
  manifest: ["edition", "map"],
  projection: ["facts", "manifest", "map", "model", "pinned", "poster", "refusal", "sources"],
  build: [
    "edition",
    "facts",
    "icons",
    "manifest",
    "map",
    "model",
    "overview",
    "plan",
    "poster",
    "projection",
    "refusal",
    "sources",
    "style",
    "supply",
  ],
  delivery: ["build", "edition", "environment", "refusal"],
  cli: ["build", "cli", "delivery", "importers", "refusal"],
});

async function modules(directory) {
  const out = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true, recursive: true }))
    if (entry.isFile() && entry.name.endsWith(".mjs"))
      out.push(path.join(entry.parentPath, entry.name));
  return out.sort();
}

/** Static import specifiers outside comments; JSDoc type references are not runtime imports. */
const specifiers = (text) =>
  [
    ...text
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .replace(/^\s*\/\/.*$/gmu, "")
      .matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*"([^"]+)"|import\(\s*"([^"]+)"\s*\)/gu),
  ].map((match) => match[1] ?? match[2]);
const unitOf = (file) =>
  path
    .relative(source, file)
    .split(path.sep)[0]
    .replace(/\.mjs$/u, "");

async function graph() {
  const edges = new Map();
  for (const file of await modules(source)) {
    const text = await fs.readFile(file, "utf8");
    edges.set(
      file,
      specifiers(text).map((specifier) =>
        specifier.startsWith(".") ? path.resolve(path.dirname(file), specifier) : specifier,
      ),
    );
  }
  return edges;
}

/** The libraries the command line is built on, which any of its modules may import. */
const BUNDLED = Object.freeze(["@clack/prompts", "commander"]);

/** The libraries that wrap and measure a report's text, which the report module alone may import. */
const REPORT_BUNDLED = Object.freeze(["fast-string-width", "fast-wrap-ansi"]);
const REPORT = path.join(source, "cli", "report.mjs");

/** Whether an import target is one of the publisher's own modules. */
const own = (target) => target.startsWith(source + path.sep);

/**
 * The imports of a graph that no rule admits, each as `<module> imports <target>`: a shipped module imports
 * Node built-ins and the publisher's own modules, a module of the command line also its bundled libraries, and
 * its report module the two that wrap and measure text.
 */
const refusedImports = (edges) =>
  [...edges].flatMap(([file, imports]) =>
    imports
      .filter(
        (target) =>
          !target.startsWith("node:") &&
          !own(target) &&
          !(BUNDLED.includes(target) && unitOf(file) === "cli") &&
          !(REPORT_BUNDLED.includes(target) && file === REPORT),
      )
      .map((target) => `${path.relative(root, file)} imports ${target}`),
  );

test("shipped modules import Node built-ins, the publisher's own modules and, in the command line alone, the bundled libraries", async () => {
  assert.deepEqual(refusedImports(await graph()), []);
});

test("a bundled library is admitted in the command line and refused in every other unit", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const declared = [...BUNDLED, ...REPORT_BUNDLED];
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), declared);
  assert.deepEqual([...manifest.bundleDependencies].sort(), declared);
  const scratch = (unit) => path.join(source, unit, "scratch.mjs");
  assert.deepEqual(refusedImports(new Map([[scratch("cli"), [...BUNDLED, "node:fs"]]])), []);
  for (const unit of Object.keys(ALLOWED).filter((name) => name !== "cli"))
    assert.deepEqual(
      refusedImports(new Map([[scratch(unit), [...BUNDLED]]])),
      BUNDLED.map((name) => `${path.join("src", unit, "scratch.mjs")} imports ${name}`),
    );
  // A library the package does not bundle is refused in the command line too.
  assert.deepEqual(refusedImports(new Map([[scratch("cli"), ["yargs"]]])), [
    `${path.join("src", "cli", "scratch.mjs")} imports yargs`,
  ]);
  // The command line is built on both: one module holds the commands, and one alone draws the reports.
  const edges = await graph();
  const importers = (name) =>
    [...edges]
      .filter(([, imports]) => imports.includes(name))
      .map(([file]) => path.relative(source, file).split(path.sep).join("/"));
  assert.deepEqual(importers("commander"), ["cli/run.mjs"]);
  assert.deepEqual(importers("@clack/prompts"), ["cli/report.mjs"]);
  // The two that wrap and measure text are admitted in the report module, and refused beside it and elsewhere.
  for (const name of REPORT_BUNDLED) assert.deepEqual(importers(name), ["cli/report.mjs"]);
  assert.deepEqual(refusedImports(new Map([[REPORT, [...REPORT_BUNDLED]]])), []);
  for (const unit of Object.keys(ALLOWED))
    assert.deepEqual(
      refusedImports(new Map([[scratch(unit), [...REPORT_BUNDLED]]])),
      REPORT_BUNDLED.map((name) => `${path.join("src", unit, "scratch.mjs")} imports ${name}`),
    );
});

test("every unit imports only the units below it", async () => {
  const edges = await graph();
  assert.deepEqual([...new Set([...edges.keys()].map(unitOf))].sort(), Object.keys(ALLOWED).sort());
  for (const [file, imports] of edges)
    for (const target of imports.filter(own))
      assert.ok(
        ALLOWED[unitOf(file)].includes(unitOf(target)),
        `${path.relative(source, file)} may not import ${path.relative(source, target)}`,
      );
});

/**
 * The measures the drawing code held before the layer of facts: none may return under its old name, whatever the
 * catalogue calls its successor.
 */
const FORMER_MEASURES = Object.freeze(["citedFiles", "hubOf", "partOf", "scaleOf", "bandOf"]);

/** Every name a measure goes by: the catalogue's and the former ones, each once. */
const MEASURES = Object.freeze([
  ...new Set([...CATALOGUE.map(({ measure }) => measure), ...FORMER_MEASURES]),
]);

/** The source of a module without its comments, where a measure may be named freely. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");

/**
 * The measures a module's source defines or calls, by name: a function or a binding of that name, or a call of
 * it, as a function or as a method.
 * @param {string} text
 * @param {readonly string[]} names
 */
const measuresIn = (text, names) =>
  names.filter((name) =>
    new RegExp(`\\b(?:function|const|let|var)\\s+${name}\\b|\\b${name}\\s*\\(`, "u").test(
      code(text),
    ),
  );

test("no module outside the layer of facts defines or calls a measure", async () => {
  const found = [];
  for (const file of await modules(source)) {
    if (unitOf(file) === "facts") continue;
    const measures = measuresIn(await fs.readFile(file, "utf8"), MEASURES);
    if (measures.length)
      found.push(
        `${path.relative(root, file).split(path.sep).join("/")} measures ${measures.join(", ")}`,
      );
  }
  assert.deepEqual(found, []);
});

test("a measure put back is found however it is written, and a word in a comment or a field is not", () => {
  assert.deepEqual(measuresIn("export function hubOf(view) {}", MEASURES), ["hubOf"]);
  assert.deepEqual(measuresIn("const scaleOf = (model) => 1;", MEASURES), ["scaleOf"]);
  assert.deepEqual(measuresIn("return lines.citedFiles (model, relation);", MEASURES), [
    "citedFiles",
  ]);
  assert.deepEqual(
    measuresIn("/** As hubOf(view) did. */\nconst { pinDate } = binding;", MEASURES),
    [],
  );
});

test("the import graph has no cycles", async () => {
  const edges = await graph();
  const state = new Map();
  const visit = (file, trail) => {
    if (state.get(file) === "done") return;
    assert.notEqual(
      state.get(file),
      "open",
      `cycle: ${[...trail, file].map((item) => path.relative(source, item)).join(" -> ")}`,
    );
    state.set(file, "open");
    for (const target of edges.get(file) ?? []) if (own(target)) visit(target, [...trail, file]);
    state.set(file, "done");
  };
  for (const file of edges.keys()) visit(file, []);
});

test("the LikeC4 worker runs on Node built-ins alone", async () => {
  const text = await fs.readFile(path.join(source, "importers/likec4-worker.mjs"), "utf8");
  assert.ok(specifiers(text).every((specifier) => specifier.startsWith("node:")));
});

test("repository tools stay independent of the product source", async () => {
  for (const file of await modules(path.join(root, "tools"))) {
    const text = await fs.readFile(file, "utf8");
    assert.ok(
      !specifiers(text).some((specifier) => specifier.includes("src")),
      path.relative(root, file),
    );
  }
});
