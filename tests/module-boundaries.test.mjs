import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "packages/publisher/src");

/** Each unit of the publisher and the units it may import: language, input, plan, layout, media, delivery, command line. */
const ALLOWED = Object.freeze({
  refusal: [],
  environment: [],
  locale: [],
  breaks: [],
  supply: ["refusal"],
  icons: ["supply"],
  kinds: ["icons", "locale"],
  model: ["locale", "refusal"],
  sources: ["environment", "refusal"],
  plan: ["locale", "model", "refusal"],
  layout: ["layout", "refusal"],
  poster: ["breaks", "kinds", "layout", "locale", "poster", "refusal", "supply"],
  map: ["breaks", "environment", "kinds", "layout", "locale", "map", "refusal", "supply"],
  importers: ["locale", "model", "refusal", "supply"],
  build: ["icons", "map", "model", "plan", "poster", "refusal", "sources", "supply"],
  delivery: ["build", "refusal"],
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

test("shipped modules import only Node built-ins and the publisher's own modules", async () => {
  for (const [file, imports] of await graph())
    for (const target of imports)
      assert.ok(
        target.startsWith("node:") || target.startsWith(source + path.sep),
        `${path.relative(root, file)} imports ${target}`,
      );
});

test("every unit imports only the units below it", async () => {
  const edges = await graph();
  assert.deepEqual([...new Set([...edges.keys()].map(unitOf))].sort(), Object.keys(ALLOWED).sort());
  for (const [file, imports] of edges)
    for (const target of imports.filter((item) => !item.startsWith("node:")))
      assert.ok(
        ALLOWED[unitOf(file)].includes(unitOf(target)),
        `${path.relative(source, file)} may not import ${path.relative(source, target)}`,
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
    for (const target of edges.get(file) ?? [])
      if (!target.startsWith("node:")) visit(target, [...trail, file]);
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
      !specifiers(text).some((specifier) => specifier.includes("packages/publisher/src")),
      path.relative(root, file),
    );
  }
});
