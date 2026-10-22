import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PUBLICATION_MEDIA } from "../packages/publisher/src/publication/file-contract.mjs";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const publisher = path.join(root, "packages/publisher");
const selfEdition = path.join(root, "editions/self");

async function json(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

test("workspace separates the generic product from concrete Editions", async () => {
  const workspace = await json(path.join(root, "package.json"));
  const product = await json(path.join(publisher, "package.json"));

  assert.equal(workspace.private, true);
  assert.deepEqual(workspace.workspaces, ["packages/publisher", "editions/self"]);
  assert.equal(product.name, "architecture-publisher");
  assert.deepEqual(product.bin, { archpub: "src/cli/main.mjs" });
  assert.equal(product.exports["."], "./src/index.mjs");
  assert.equal(product.exports["./file-input"], "./src/file-input/index.mjs");
  assert.equal(product.exports["./provider"], "./src/provider/index.mjs");
  const fileInputApi = await import(
    pathToFileURL(path.join(publisher, "src/file-input/index.mjs"))
  );
  assert.deepEqual(Object.keys(fileInputApi).sort(), ["parseStrictJson", "readBoundedFile"]);
  const sourceApi = await import(pathToFileURL(path.join(publisher, "src/source/index.mjs")));
  assert.deepEqual(Object.keys(sourceApi).sort(), [
    "packSourceFiles",
    "readSourceBundle",
    "validateManifest",
    "verifySourceInput",
    "writeSourceBundle",
  ]);
  const providerApi = await import(pathToFileURL(path.join(publisher, "src/provider/index.mjs")));
  for (const name of [
    "materializeDeclarativeProvider",
    "materializeExecutableProvider",
    "withMaterializedEditionProvider",
  ])
    assert.equal(typeof providerApi[name], "function");
  assert.equal(Object.hasOwn(providerApi, "materializeBuildRequestInput"), false);
  await fs.access(path.join(publisher, "src/compiler/build-input.mjs"));
  await assert.rejects(fs.stat(path.join(publisher, "src/provider/build-request.mjs")), {
    code: "ENOENT",
  });
  const compilerApi = await import(pathToFileURL(path.join(publisher, "src/compiler/index.mjs")));
  assert.equal(typeof compilerApi.compileEditionCandidateInput, "function");
  assert.equal(Object.hasOwn(compilerApi, "compileEditionCandidate"), false);
  const sceneApi = await import(pathToFileURL(path.join(publisher, "src/scene/index.mjs")));
  assert.equal(typeof sceneApi.createRecordedMetricReader, "function");
  const svgApi = await import(pathToFileURL(path.join(publisher, "renderers/svg/index.mjs")));
  assert.equal(Object.hasOwn(svgApi, "createMetricReader"), false);
  assert.equal(typeof svgApi.measureCoreTextBytes, "function");
  assert.equal(Object.hasOwn(svgApi, "measureCoreText"), false);
  const resvgApi = await import(pathToFileURL(path.join(publisher, "renderers/resvg/public.mjs")));
  assert.equal(typeof resvgApi.rasterizeBytes, "function");
  assert.equal(Object.hasOwn(resvgApi, "rasterize"), false);
  const renderingApi = await import(pathToFileURL(path.join(publisher, "src/rendering/index.mjs")));
  assert.equal(typeof renderingApi.rasterizeBundle, "function");
  assert.equal(typeof renderingApi.measureTypographyBundle, "function");
  const publicApi = await import(pathToFileURL(path.join(publisher, "src/index.mjs")));
  assert.deepEqual(Object.keys(publicApi).sort(), [
    "compiler",
    "edition",
    "fileInput",
    "provider",
    "publication",
    "qualification",
    "rendering",
    "scene",
    "semantics",
    "source",
  ]);
});

test("terminal paths make product ownership explicit", async () => {
  await fs.access(path.join(root, "editions/self/package.json"));
  await fs.access(path.join(root, "tests/conformance/fixtures/ethos-source-owned-handoff.json"));
  await fs.access(path.join(root, "tests/conformance/fixtures/aigw-source-owned-handoff.json"));
  await fs.access(path.join(root, "tests/conformance/journeys/self-host/README.md"));
  await assert.rejects(fs.stat(path.join(root, "migration/aigw")), { code: "ENOENT" });
  await assert.rejects(fs.stat(path.join(root, "packages/extensions")), {
    code: "ENOENT",
  });
  await assert.rejects(fs.stat(path.join(root, "examples/aigw")), {
    code: "ENOENT",
  });
  await assert.rejects(fs.stat(path.join(root, "examples/self-host")), {
    code: "ENOENT",
  });
  await assert.rejects(fs.stat(path.join(root, "packages/publisher/assets")), { code: "ENOENT" });
  await fs.access(path.join(publisher, "src/scene/emitted-path.mjs"));
  await assert.rejects(fs.stat(path.join(publisher, "src/qualification/static/emitted-path.mjs")), {
    code: "ENOENT",
  });
  for (const owner of ["archify", "fonts", "resvg"])
    await fs.access(path.join(publisher, "renderers", owner, "supply"));
});

test("the first-party self Edition is an independent package below the generic core", async () => {
  const product = await json(path.join(publisher, "package.json"));
  const edition = await json(path.join(selfEdition, "package.json"));
  assert.equal(edition.name, "@architecture-publisher/self-edition");
  assert.deepEqual(edition.dependencies, {
    "architecture-publisher": product.version,
  });
});

test("the packed generic product contains no concrete domain package", () => {
  const packed = spawnNativeSync("npm", ["pack", "--json", "--dry-run", "--ignore-scripts"], {
    cwd: publisher,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(
    packed.status,
    0,
    String(packed.stdout ?? "") + String(packed.stderr ?? "") + String(packed.error ?? ""),
  );
  const files = parseNpmPackRecord(packed.stdout).files.map(({ path: file }) => file);
  assert(files.includes("src/cli/main.mjs"));
  assert(files.includes("src/edition/contract.mjs"));
  assert(files.includes("src/edition/generated/validators.mjs"));
  assert(files.includes("src/edition/generated/LICENSE.schemasafe"));
  assert(files.includes("src/provider/contract.mjs"));
  assert(files.includes("src/compiler/build-input.mjs"));
  assert(!files.includes("src/provider/build-request.mjs"));
  assert(files.every((file) => !/(^|\/)(adapters|editions)(\/|$)/.test(file)));
  assert(files.every((file) => !/(^|\/)(ethos|aigw)(\/|$)/i.test(file)));
});

test("the generic command surface has no domain or renderer identity", async () => {
  const cli = await fs.readFile(path.join(publisher, "src/cli/main.mjs"), "utf8");
  assert.doesNotMatch(cli, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
  assert.doesNotMatch(cli, /packages\/editions|\.\.\/\.\.\/editions/);
});

test("shared font supply belongs to its own renderer capability", async () => {
  const product = await json(path.join(publisher, "package.json")),
    archify = await fs.readFile(path.join(publisher, "renderers/archify/public.mjs"), "utf8"),
    resvgSupply = await json(path.join(publisher, "renderers/resvg/supply/resvg/package.json")),
    rasterBuild = await fs.readFile(path.join(root, "tools/raster/resvg/verify.mjs"), "utf8"),
    rasterCargo = await fs.readFile(path.join(root, "tools/raster/resvg/Cargo.toml"), "utf8"),
    rasterWasm = await fs.readFile(
      path.join(publisher, "renderers/resvg/supply/resvg/index_bg.wasm"),
    );
  assert.equal(product.exports["./renderers/fonts"], "./renderers/fonts/index.mjs");
  assert.doesNotMatch(archify, /fonts\.mjs|loadBundledFonts/);
  assert.equal(resvgSupply.name, "@architecture-publisher/resvg-wasm-supply");
  assert.doesNotMatch(JSON.stringify(resvgSupply), /ethos/i);
  assert.doesNotMatch(rasterBuild, /ethos/i);
  assert.doesNotMatch(rasterCargo, /ethos/i);
  assert.equal(rasterWasm.includes(Buffer.from("ethos")), false);
});

test("the published pair-files v2 protocol retains native and atlas media keys", async () => {
  const source = (
    await Promise.all(
      ["files.mjs", "input.mjs"].map((file) =>
        fs.readFile(path.join(publisher, "src/publication", file), "utf8"),
      ),
    )
  ).join("\n");
  assert.deepEqual(PUBLICATION_MEDIA, ["native", "atlas"]);
  assert.doesNotMatch(source, /\.ethos-pair-/i);
  assert.match(source, /\.architecture-publication-writer/);
});
