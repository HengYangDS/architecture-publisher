import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import { nativePermissionSupported } from "../packages/publisher/src/semantics/native-execution.mjs";
import { buildLikeC4Supply } from "../tools/supply/likec4.mjs";
import { includedPackages } from "../tools/supply/notices.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const supplyRoot = fileURLToPath(
  new URL("../packages/publisher/supplies/likec4/", import.meta.url),
);

test("parser notices reject undeclared embedded inputs before inheriting an enclosing license", async () => {
  await assert.rejects(
    includedPackages({
      inputs: {
        "node_modules/@likec4/language-services/node_modules/unselected/entry.mjs": {},
      },
    }),
    {
      message:
        "likec4_supply_lock_mismatch:node_modules/@likec4/language-services/node_modules/unselected",
    },
  );
});

test("explicit bootstrap regenerates absent runtime outputs and packs exact bytes", async (t) => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-generated-bootstrap-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  for (const relative of [
    "packages/publisher/src",
    "packages/publisher/supplies/likec4",
    "packages/publisher/renderers/resvg/supply",
    "tools/supply",
  ])
    await fs.cp(path.join(root, relative), path.join(scratch, relative), { recursive: true });
  for (const relative of [
    "package.json",
    "package-lock.json",
    ".gitignore",
    "packages/publisher/package.json",
    "editions/self/package.json",
    "tools/generate-authoring-validators.mjs",
    "tools/raster/resvg/verify.mjs",
  ]) {
    await fs.mkdir(path.dirname(path.join(scratch, relative)), { recursive: true });
    await fs.copyFile(path.join(root, relative), path.join(scratch, relative));
  }
  const parserSupply = JSON.parse(await fs.readFile(path.join(supplyRoot, "supply.json")));
  const packages = new Set([
    ...parserSupply.packages.map(({ lockPath }) => lockPath),
    "node_modules/@exodus/schemasafe",
    "node_modules/esbuild",
  ]);
  const builder = JSON.parse(
    await fs.readFile(path.join(root, "node_modules/esbuild/package.json")),
  );
  for (const name of Object.keys(builder.optionalDependencies)) {
    const relative = `node_modules/${name}`;
    if ((await fs.stat(path.join(root, relative)).catch(() => null))?.isDirectory())
      packages.add(relative);
  }
  for (const relative of packages)
    await fs.cp(path.join(root, relative), path.join(scratch, relative), { recursive: true });
  const outputs = [
    "src/edition/generated/validators.mjs",
    "supplies/likec4/parser.mjs",
    "renderers/resvg/supply/resvg/index.mjs",
    "renderers/resvg/supply/resvg/index_bg.wasm",
  ];
  const originals = new Map();
  const prebuilt = path.join(scratch, "received-raster");
  await fs.mkdir(prebuilt);
  for (const relative of outputs) {
    const file = path.join(scratch, "packages/publisher", relative);
    const bytes = await fs.readFile(file);
    originals.set(relative, bytes);
    if (relative.startsWith("renderers/resvg/"))
      await fs.writeFile(path.join(prebuilt, path.basename(relative)), bytes);
    await fs.rm(file);
  }
  const environment = {
    ...process.env,
    ARCHPUB_RESVG_PREBUILT: prebuilt,
    npm_config_offline: "true",
    npm_config_update_notifier: "false",
  };
  for (let pass = 0; pass < 2; pass++) {
    const generated = spawnNativeSync("npm", ["run", "generate"], {
      cwd: scratch,
      env: environment,
      encoding: "utf8",
      timeout: 60_000,
    });
    assert.equal(generated.status, 0, generated.stdout + generated.stderr);
    for (const relative of outputs)
      assert.deepEqual(
        await fs.readFile(path.join(scratch, "packages/publisher", relative)),
        originals.get(relative),
        `${relative}: generation pass ${pass}`,
      );
  }
  for (const generator of ["tools/generate-authoring-validators.mjs", "tools/supply/likec4.mjs"]) {
    const checked = spawnSync(process.execPath, [generator, "--check"], {
      cwd: scratch,
      env: environment,
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  }
  const packed = spawnNativeSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch, "./packages/publisher"],
    { cwd: scratch, env: environment, encoding: "utf8", timeout: 30_000 },
  );
  assert.equal(packed.status, 0, packed.stdout + packed.stderr);
  const report = parseNpmPackRecord(packed.stdout);
  for (const relative of outputs) {
    assert(
      report.files.some(({ path: file }) => file === relative),
      relative,
    );
    const bytes = execFileSync(
      "tar",
      ["-xOf", path.join(scratch, report.filename), `package/${relative}`],
      { timeout: 20_000, maxBuffer: 8 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );
    assert.deepEqual(bytes, originals.get(relative), relative);
  }
});

test("Raster bootstrap rejects an incomplete or changed pair before writing", async (t) => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-raster-bootstrap-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const script = "tools/raster/resvg/verify.mjs";
  const supply = "packages/publisher/renderers/resvg/supply/resvg";
  await fs.mkdir(path.join(scratch, path.dirname(script)), { recursive: true });
  await fs.copyFile(path.join(root, script), path.join(scratch, script));
  await fs.mkdir(path.join(scratch, supply), { recursive: true });
  await fs.copyFile(
    path.join(root, supply, "source.json"),
    path.join(scratch, supply, "source.json"),
  );
  const prebuilt = path.join(scratch, "received-raster");
  await fs.mkdir(prebuilt);
  const names = ["index.mjs", "index_bg.wasm"];
  for (const name of names)
    await fs.copyFile(path.join(root, supply, name), path.join(prebuilt, name));
  const binding = await fs.readFile(path.join(prebuilt, names[0]));
  const wasm = await fs.readFile(path.join(prebuilt, names[1]));
  await fs.writeFile(path.join(prebuilt, names[0]), Buffer.concat([binding, Buffer.from("drift")]));
  for (const state of ["changed", "missing", "valid"]) {
    if (state === "missing") {
      await fs.writeFile(path.join(prebuilt, names[0]), binding);
      await fs.rm(path.join(prebuilt, names[1]));
    }
    if (state === "valid") await fs.writeFile(path.join(prebuilt, names[1]), wasm);
    const staged = spawnSync(process.execPath, [script, "--stage", prebuilt], {
      cwd: scratch,
      encoding: "utf8",
      timeout: 20_000,
    });
    assert.equal(staged.status, state === "valid" ? 0 : 65, staged.stdout + staged.stderr);
    for (const [index, name] of names.entries()) {
      const output = path.join(scratch, supply, name);
      if (state === "valid") assert.deepEqual(await fs.readFile(output), [binding, wasm][index]);
      else await assert.rejects(fs.access(output), { code: "ENOENT" });
    }
  }
});

test("native Raster supply restores the exact pair without index or network effects", async (t) => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-raster-custody-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const clone = path.join(scratch, "checkout");
  execFileSync("git", ["clone", "--shared", "--no-checkout", "--quiet", root, clone], {
    timeout: 30_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const relative of [
    ".config/mise/config.toml",
    ".config/mise/mise.lock",
    "tools/raster/resvg/verify.mjs",
    "packages/publisher/renderers/resvg/supply/resvg/source.json",
  ]) {
    await fs.mkdir(path.dirname(path.join(clone, relative)), { recursive: true });
    await fs.copyFile(path.join(root, relative), path.join(clone, relative));
  }
  const index = () => execFileSync("git", ["ls-files", "--stage", "-z"], { cwd: clone });
  const before = index();
  const result = spawnSync("mise", ["run", "--skip-tools", "--timeout", "30s", "raster-supply"], {
    cwd: clone,
    encoding: "utf8",
    timeout: 35_000,
    env: { ...process.env, MISE_TRUSTED_CONFIG_PATHS: clone },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(index(), before);
  const supply = "packages/publisher/renderers/resvg/supply/resvg";
  for (const name of ["index.mjs", "index_bg.wasm"])
    assert.deepEqual(
      await fs.readFile(path.join(clone, supply, name)),
      await fs.readFile(path.join(root, supply, name)),
      name,
    );
});

function isolatedNode(scratch, script, flags = []) {
  /** @type {Record<string, string>} */
  const environment = { HOME: scratch, PATH: "", NODE_PATH: "", NODE_OPTIONS: "" };
  if (process.platform === "win32" && process.env.SystemRoot)
    environment.SystemRoot = process.env.SystemRoot;
  return spawnSync(process.execPath, [...flags, "--input-type=module", "--eval", script], {
    cwd: scratch,
    env: environment,
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 1024 * 1024,
  });
}

test("LikeC4 parser supply is reproducible and binds exact package notices", async () => {
  const first = await buildLikeC4Supply();
  const second = await buildLikeC4Supply();
  assert.deepEqual(first.bundle, second.bundle);
  assert.deepEqual(first.notices, second.notices);
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.manifest.schema, "architecture.native-parser-supply/v1");
  assert.deepEqual(first.manifest.parser, {
    name: "@likec4/language-services",
    version: "1.60.0",
  });
  assert.deepEqual(first.manifest.builder, { name: "esbuild", version: "0.28.2" });
  assert.deepEqual(first.manifest.blockedExternalPackages, ["pnpapi"]);
  assert.equal(first.manifest.packages.length, 61);
  assert(first.bundle.length < 8 * 1024 * 1024);
  assert.deepEqual(first.manifest.files, [
    { path: "parser.mjs", bytes: first.bundle.length, sha256: sha(first.bundle) },
    { path: "THIRD-PARTY-NOTICES.txt", bytes: first.notices.length, sha256: sha(first.notices) },
  ]);
  assert.match(first.notices.toString("utf8"), /Copyright \(c\) 2018 remeda/u);
  assert.match(first.notices.toString("utf8"), /Copyright \(c\) 2019-present Fabio Spampinato/u);
  for (const entry of first.manifest.packages) {
    assert.match(entry.integrity, /^sha(?:256|384|512)-/u);
    assert.match(entry.noticeSha256, /^[a-f0-9]{64}$/u);
  }
});

test("candidate parser bundle runs from a relocated directory without node_modules", async (t) => {
  const { bundle } = await buildLikeC4Supply();
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-likec4-supply-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const parserFile = path.join(scratch, "parser.mjs");
  await fs.writeFile(parserFile, bundle);
  const script = `
    import { fromSources } from ${JSON.stringify(pathToFileURL(parserFile).href)};
    const parser = await fromSources({
      'model.c4': "specification { element component }\\nmodel { left = component 'Left'\\n right = component 'Right'\\n left -> right }\\n",
      'views.c4': 'views { view overview { include * } }\\n',
    }, { printErrors: false, configureLogger: false, useFileSystem: false,
         manualLayouts: false, watch: false, graphviz: 'wasm' });
    const model = parser.syncComputedModel();
    console.log(JSON.stringify({
      errors: parser.languageServices.getErrors().length,
      documents: parser.documentPaths().length,
      elements: [...model.elements()].length,
      relations: [...model.relationships()].length,
    }));
    await parser.dispose();
  `;
  const child = isolatedNode(scratch, script);
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout.trim()), {
    errors: 0,
    documents: 2,
    elements: 2,
    relations: 1,
  });
});

test(
  "bundled LikeC4 parser supplies stable WASM layout without an ambient binary",
  { skip: !nativePermissionSupported() },
  async (t) => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "archpub-likec4-layout-"),
    );
    t.after(() => fs.rm(scratch, { recursive: true, force: true }));
    const parserFile = path.join(scratch, "parser.mjs");
    await fs.copyFile(path.join(supplyRoot, "parser.mjs"), parserFile);
    const script = `
      import { fromSources } from ${JSON.stringify(pathToFileURL(parserFile).href)};
      const parser = await fromSources({
        'model.c4': "specification { element component }\\nmodel { a = component 'A'\\n b = component 'B'\\n a -> b }\\n",
        'views.c4': 'views { view overview { include * } }\\n',
      }, { printErrors: false, configureLogger: false, useFileSystem: false,
           manualLayouts: false, watch: false, graphviz: 'wasm' });
      try {
        const view = (await parser.layoutedModel()).view('overview').$layouted;
        console.log(JSON.stringify({
          errors: parser.languageServices.getErrors().length,
          bounds: view.bounds,
          nodes: view.nodes.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
          edges: view.edges.map(({ source, target, points }) => ({ source, target, points })),
        }));
      } finally { await parser.dispose(); }
    `;
    const flags = ["--permission", `--allow-fs-read=${parserFile}`];
    const first = isolatedNode(scratch, script, flags);
    const second = isolatedNode(scratch, script, flags);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    const layout = JSON.parse(first.stdout.trim());
    assert.deepEqual(JSON.parse(second.stdout.trim()), layout);
    assert.equal(layout.errors, 0);
    assert.deepEqual(
      layout.nodes.map(({ id }) => id),
      ["a", "b"],
    );
    assert.equal(layout.edges.length, 1);
    assert(layout.bounds.width > 0 && layout.bounds.height > 0);
    assert(layout.edges[0].points.length >= 2);
  },
);

test("candidate parser bundle denies ambient package resolution", async (t) => {
  const { bundle } = await buildLikeC4Supply();
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-likec4-supply-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const parserFile = path.join(scratch, "parser-probe.mjs");
  await fs.writeFile(
    parserFile,
    Buffer.concat([
      bundle,
      Buffer.from("\nexport const probeRequire = (name) => require(name);\n"),
    ]),
  );
  const script = `
    import { probeRequire } from ${JSON.stringify(pathToFileURL(parserFile).href)};
    let denied = false;
    try { probeRequire('pnpapi'); }
    catch (error) { denied = error.message === 'external_dependency_denied:pnpapi'; }
    console.log(JSON.stringify({ denied, builtin: typeof probeRequire('fs').readFileSync === 'function' }));
  `;
  const child = isolatedNode(scratch, script);
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout.trim()), { denied: true, builtin: true });
});

test("packaged LikeC4 supply matches generated bytes and has complete notices", async () => {
  const built = await buildLikeC4Supply();
  assert.deepEqual(await fs.readFile(path.join(supplyRoot, "parser.mjs")), built.bundle);
  assert.deepEqual(
    await fs.readFile(path.join(supplyRoot, "THIRD-PARTY-NOTICES.txt")),
    built.notices,
  );
  assert.deepEqual(
    await fs.readFile(path.join(supplyRoot, "supply.json"), "utf8"),
    JSON.stringify(built.manifest, null, 2) + "\n",
  );
  const { LIKEC4_SUPPLY_SHA256 } =
    await import("../packages/publisher/src/semantics/supply-identity.mjs");
  assert.equal(
    LIKEC4_SUPPLY_SHA256,
    sha(Buffer.from(JSON.stringify(built.manifest, null, 2) + "\n")),
  );
  const packed = spawnNativeSync("npm", ["pack", "--dry-run", "--json", "./packages/publisher"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, npm_config_offline: "true" },
  });
  assert.equal(packed.status, 0, packed.stderr);
  const files = parseNpmPackRecord(packed.stdout).files.map(({ path: name }) => name);
  assert(files.includes("src/semantics/supply-identity.mjs"));
  assert(files.includes("renderers/interactive/source-reader.mjs"));
  assert(!files.some((name) => name.startsWith("renderers/likec4/")));
  for (const name of ["parser.mjs", "THIRD-PARTY-NOTICES.txt", "supply.json"])
    assert(files.includes(`supplies/likec4/${name}`), name);
});

test("installed LikeC4 supply verifies exact bytes and rejects post-install drift", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-supply-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const environment = {
    ...process.env,
    npm_config_update_notifier: "false",
    npm_config_audit: "false",
    npm_config_cache: path.join(scratch, "cache"),
  };
  const publisher = fileURLToPath(new URL("../packages/publisher/", import.meta.url));
  const packed = spawnNativeSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch],
    {
      cwd: publisher,
      env: environment,
      encoding: "utf8",
      timeout: 20_000,
    },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const packageFile = path.join(scratch, parseNpmPackRecord(packed.stdout).filename);
  const consumer = path.join(scratch, "consumer");
  await fs.mkdir(consumer);
  const installed = spawnNativeSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--offline",
      "--no-save",
      "--package-lock=false",
      "--prefix",
      consumer,
      packageFile,
    ],
    { cwd: consumer, env: environment, encoding: "utf8", timeout: 20_000 },
  );
  assert.equal(installed.status, 0, installed.stderr);
  const packageRoot = path.join(consumer, "node_modules/architecture-publisher");
  const { readLikeC4ParserSupply } = await import(
    pathToFileURL(path.join(packageRoot, "src/semantics/supply.mjs")).href
  );
  const supplied = path.join(packageRoot, "supplies/likec4");
  const parser = path.join(supplied, "parser.mjs");
  const notices = path.join(supplied, "THIRD-PARTY-NOTICES.txt");
  const manifest = path.join(supplied, "supply.json");
  const verified = await readLikeC4ParserSupply();
  assert.equal(verified.sha256, sha(await fs.readFile(manifest)));
  assert.equal(verified.parserSha256, sha(await fs.readFile(parser)));
  assert.deepEqual(verified.parserBytes, await fs.readFile(parser));
  assert.equal(Object.hasOwn(verified, "fromSources"), false);
  const { importLikeC4Native } = await import(
    pathToFileURL(path.join(packageRoot, "src/semantics/index.mjs")).href
  );
  const selectedBytes = new Map([
    [
      "example/model",
      Buffer.from(
        "specification { element component }\nmodel { left = component 'Left'\n right = component 'Right'\n left -> right }\n",
      ),
    ],
    ["example/views", Buffer.from("views { view overview { include * } }\n")],
  ]);
  const selection = {
    lock: {
      schema: "architecture.materialized-input-lock/v1",
      sources: [...selectedBytes].map(([namespace, bytes]) => ({
        namespace,
        claimant: "example-maintainer",
        format: { id: "likec4/dsl", version: "unversioned" },
        revision: { kind: "content", algorithm: "sha256", value: sha(bytes) },
        sha256: sha(bytes),
      })),
    },
    readSource(namespace) {
      return Buffer.from(selectedBytes.get(namespace));
    },
  };
  const index = await importLikeC4Native(selection);
  assert.equal(index.elements.length, 2);
  assert.equal(index.relations.length, 1);
  assert.deepEqual(index.parserSupply, { id: "likec4-parser", sha256: verified.sha256 });

  const { executeLikeC4Native } = await import(
    pathToFileURL(path.join(packageRoot, "src/semantics/native-execution.mjs")).href
  );
  const originalParser = await fs.readFile(parser);
  try {
    await fs.writeFile(parser, Buffer.concat([originalParser, Buffer.from("drift")]));
    const privateIndex = await executeLikeC4Native(
      [...selectedBytes].map(([namespace, content]) => ({
        source: selection.lock.sources.find((source) => source.namespace === namespace),
        content,
      })),
      verified,
    );
    assert.equal(privateIndex.elements.length, 2);
  } finally {
    await fs.writeFile(parser, originalParser);
  }

  for (const file of [parser, notices, manifest]) {
    const original = await fs.readFile(file);
    await fs.writeFile(file, Buffer.concat([original, Buffer.from("drift")]));
    await assert.rejects(readLikeC4ParserSupply(), { code: "native_likec4_supply_invalid" });
    await fs.writeFile(file, original);
  }
  const unexpected = path.join(supplied, "unexpected.txt");
  await fs.writeFile(unexpected, "unselected");
  await assert.rejects(readLikeC4ParserSupply(), { code: "native_likec4_supply_invalid" });
  await fs.rm(unexpected);
  assert.equal((await readLikeC4ParserSupply()).sha256, verified.sha256);
});
