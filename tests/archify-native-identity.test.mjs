import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { renderInteractiveInput } from "../packages/publisher/src/rendering/input.mjs";
import {
  assembleArchitectureScene,
  renderArchitectureScene,
} from "../packages/publisher/renderers/archify/index.mjs";
import { serviceTopology } from "./fixtures/diagrams.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const supplyRoot = fileURLToPath(
  new URL("../packages/publisher/renderers/archify/supply/", import.meta.url),
);

test("automatic architecture has identical direct and file output with unchanged native scripts", async (t) => {
  const base = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(new URL("native-auto-identity-", base));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Selected components",
    subtitle: "Automatic composition preserves the selected relationship",
    nodes: [
      { id: "alpha", label: "Alpha", figureKind: "component", visualRole: "backend" },
      { id: "beta", label: "Beta", figureKind: "component", visualRole: "backend" },
    ],
    groups: [],
    edges: [{ id: "handoff", from: "alpha", to: "beta", label: "Send", visualRole: "default" }],
  };
  const before = structuredClone(scene);
  const direct = await assembleArchitectureScene(scene);
  const output = path.join(root, "architecture.html");
  const file = await renderArchitectureScene({ scene, output });
  assert.deepEqual(await fs.readFile(output), direct.bytes);
  assert.deepEqual(scene, before);
  assert.deepEqual(file.nativeValidation, {
    checkCount: 9,
    checksPassed: 9,
    compositionProfile: "showcase",
    errors: 0,
    warnings: 0,
  });
  assert.equal(file.artifact.sha256, sha(direct.bytes));
  assert.equal(
    file.supplies.find(({ id }) => id === "runtime").sha256,
    direct.supplies.find(({ id }) => id === "runtime").sha256,
  );
  const scripts = (html) =>
    [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attributes]) => !/type=["']application\/json["']/u.test(attributes))
      .map(([, , content]) => content);
  const template = await fs.readFile(path.join(supplyRoot, "assets/template.html"), "utf8");
  assert.deepEqual(scripts(direct.bytes.toString()), scripts(template));
  assert.deepEqual(await fs.readdir(root), ["architecture.html"]);
});

test("the public native renderer preserves original runtime bytes and executable scripts", async (t) => {
  const base = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(new URL("native-identity-", base));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const selected = Buffer.from(JSON.stringify(serviceTopology()) + "\n");
  const input = path.join(root, "input.json");
  const output = path.join(root, "architecture.html");
  await fs.writeFile(input, selected);

  const manifest = JSON.parse(await fs.readFile(path.join(supplyRoot, "supply.json"), "utf8"));
  const members = manifest.files
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))
    .sort(({ path: left }, { path: right }) => left.localeCompare(right));
  const result = await renderInteractiveInput("architecture", input, sha(selected), output);
  assert.equal(
    result.supplies.find(({ id }) => id === "runtime").sha256,
    sha(Buffer.from(JSON.stringify(members))),
    "native execution must not modify the supplied template, CLI or Viewer scripts",
  );

  const scripts = (html) =>
    [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attributes]) => !/type=["']application\/json["']/u.test(attributes))
      .map(([, , content]) => content);
  const html = await fs.readFile(output, "utf8");
  const template = await fs.readFile(path.join(supplyRoot, "assets/template.html"), "utf8");
  assert.deepEqual(scripts(html), scripts(template));
  assert.deepEqual(await fs.readFile(input), selected);
  assert.equal(result.nativeValidation.checksPassed, 9);
  assert.equal(result.nativeValidation.errors, 0);
  assert.equal(result.nativeValidation.warnings, 0);
  assert.equal(result.browserAcceptance, "not-performed");
  assert.equal(result.semanticAcceptance, "not-performed");
  assert.match(html, /Copyright \(c\) 2026 tt-a1i/u);
  assert.deepEqual((await fs.readdir(root)).sort(), ["architecture.html", "input.json"]);
});
