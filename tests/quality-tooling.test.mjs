import { format, resolveConfig } from "prettier";
import { parse as parseToml } from "smol-toml";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { execNativeSync, npmInvocation } from "./fixtures/npm-pack-report.mjs";
import { root } from "./fixtures/quality-contract.mjs";

test("one fail-closed quality entry point covers the repository contract", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json")));
  assert.equal(
    manifest.scripts.test,
    "node --import=./tests/fixtures/npm-environment.mjs --test --test-concurrency=2 tests/*.test.mjs",
  );
  assert.equal(
    manifest.scripts.check,
    "npm run check:static && npm run test:coverage && npm run check:package",
  );
  assert.equal(
    manifest.scripts["check:static"],
    "npm run check:generated && npm run check:format && npm run check:lint && npm run check:types && npm run check:imports && npm run check:dead-code && npm run check:docs && npm run check:spec",
  );
  const generatedChecks = manifest.scripts["check:generated"].split(" && ");
  assert.equal(generatedChecks[0], "node tools/release/version.mjs --check");
  assert.equal(generatedChecks[1], "npm run check:ci");
  assert.equal(generatedChecks[2], "node tools/generate-authoring-validators.mjs --check");
  assert.equal(generatedChecks.at(-1), "node tools/supply/implementation.mjs --check");
  assert.equal(new Set(generatedChecks).size, generatedChecks.length);
  const suppliers = [];
  for (const file of await fs.readdir(path.join(root, "tools/supply"))) {
    if (!file.endsWith(".mjs")) continue;
    const source = await fs.readFile(path.join(root, "tools/supply", file), "utf8");
    if (/['"]--check['"]/u.test(source)) suppliers.push(`node tools/supply/${file} --check`);
  }
  assert.deepEqual(generatedChecks.slice(3).sort(), suppliers.sort());
  assert.equal(
    manifest.scripts["check:format"],
    "prettier --config .config/checks/prettier/prettier.toml --ignore-path .gitignore --ignore-path .config/checks/prettier/prettierignore --check . && taplo format --config .config/checks/taplo/taplo.toml --check",
  );
  assert.equal(manifest.prettier, undefined);
  assert.equal(
    manifest.scripts.format,
    manifest.scripts["check:format"].replace(" --check .", " --write .").replace(" --check", ""),
  );
  assert.equal(
    manifest.scripts["check:lint"],
    "eslint --config .config/checks/eslint/eslint.config.mjs . --max-warnings 0",
  );
  assert.equal(
    manifest.scripts["check:types"],
    "tsc --project .config/checks/typescript/tsconfig.json --noEmit",
  );
  assert.equal(
    manifest.scripts["check:imports"],
    "node --test tests/module-boundaries.test.mjs tests/module-execution-boundaries.test.mjs",
  );
  assert.equal(
    manifest.scripts["check:docs"],
    "markdownlint-cli2 --config .config/checks/markdownlint-cli2/.markdownlint-cli2.yaml",
  );
  assert.equal(manifest.scripts["check:spec"], "openspec validate --all --strict --no-interactive");
  assert.equal(
    manifest.scripts["test:coverage"],
    "c8 --config .config/checks/c8/.c8rc.json npm test",
  );
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, ".config/checks/c8/.c8rc.json"), "utf8"),
  );
  assert.equal(coverage.all, true);
  assert.equal(coverage["merge-async"], true, "Native incremental merging bounds reporter memory");
  assert.equal(coverage["check-coverage"], true);
  assert.deepEqual(coverage.include, [
    "packages/publisher/src/**/*.mjs",
    "packages/publisher/renderers/**/*.mjs",
    "editions/self/src/**/*.mjs",
  ]);
  assert.deepEqual(coverage.exclude, [
    "packages/publisher/src/edition/generated/**",
    "packages/publisher/renderers/**/supply/**",
  ]);
  assert.deepEqual(coverage.reporter, ["text", "json-summary"]);
  for (const dimension of ["statements", "lines", "branches", "functions"])
    assert.equal(coverage[dimension], 95);
  assert.equal(manifest.scripts["check:package"], "publint packages/publisher");

  assert.equal(manifest.devDependencies.c8, "12.0.0");
  for (const [name, version] of Object.entries(manifest.devDependencies))
    assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u, name);

  for (const file of [
    ".config/checks/markdownlint-cli2/.markdownlint-cli2.yaml",
    ".config/checks/knip/knip.toml",
    ".config/checks/prettier/prettier.toml",
    ".config/checks/prettier/prettierignore",
    ".config/checks/eslint/eslint.config.mjs",
    ".config/checks/typescript/tsconfig.json",
  ])
    assert((await fs.stat(path.join(root, file))).isFile(), file);
});

test("the repository formatter preserves the common native JS and YAML postimages", async () => {
  const config = path.join(root, ".config/checks/prettier/prettier.toml");
  for (const [file, before, expected] of [
    ["example.mjs", "export const value = '1';\n", 'export const value = "1";\n'],
    ["example.yml", "value: '1'\n", 'value: "1"\n'],
  ]) {
    const filepath = path.join(root, file);
    const policy = await resolveConfig(filepath, { config, editorconfig: false });
    const after = await format(before, { ...policy, filepath });
    assert.equal(after, expected, file);
    assert.equal(await format(after, { ...policy, filepath }), after, file);
  }
});

test("supply identity reproduction agrees with the native repository formatter", async () => {
  const config = path.join(root, ".config/checks/prettier/prettier.toml");
  for (const [generator, identity] of [
    ["likec4", "src/semantics/supply-identity.mjs"],
    ["icons", "renderers/icons/identity.mjs"],
    ["resvg", "renderers/resvg/identity.mjs"],
    ["implementation", "src/compiler/implementation-identity.mjs"],
  ]) {
    const filepath = path.join(root, "packages/publisher", identity);
    const before = await fs.readFile(filepath, "utf8");
    execFileSync(
      process.execPath,
      [path.join(root, "tools/supply", `${generator}.mjs`), "--check"],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 60_000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const after = await fs.readFile(filepath, "utf8");
    assert.equal(after, before, `${generator} check must not rewrite its identity`);
    const policy = await resolveConfig(filepath, { config, editorconfig: false });
    assert.equal(await format(after, { ...policy, filepath }), after, identity);
  }
});

test("native formatters resolve through the complete locked platform toolchain", async () => {
  const toolchain = parseToml(
    await fs.readFile(path.join(root, ".config/mise/config.toml"), "utf8"),
  );
  const locked = parseToml(await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8"));
  const selected = JSON.parse(
    execFileSync("mise", ["ls", "--current", "--json"], {
      cwd: root,
      encoding: "utf8",
      timeout: 15_000,
    }),
  );
  assert.equal(
    selected["github:tamasfe/taplo"]?.[0]?.requested_version,
    toolchain.tools["github:tamasfe/taplo"].version,
  );
  assert.equal(typeof toolchain.tools["github:tamasfe/taplo"].version, "string");
  const formatter = toolchain.tools["github:tamasfe/taplo"];
  const entries = locked.tools["github:tamasfe/taplo"] ?? [];
  for (const platform of ["linux-arm64", "macos-arm64", "windows-arm64"]) {
    const options = formatter.platforms[platform];
    const entry = entries.find(
      ({ version, options: request }) =>
        version === formatter.version && request.asset_pattern === options.asset_pattern,
    );
    assert(entry, `The selected native TOML formatter requires a ${platform} lock entry`);
    const supply = entry[`platforms.${platform}`];
    assert.match(
      supply?.url ?? "",
      /^https:\/\/github\.com\/tamasfe\/taplo\/releases\/download\//u,
    );
    assert(supply.url.endsWith(`/${options.asset_pattern}`));
    assert.match(supply.checksum ?? options.checksum ?? "", /^sha256:[0-9a-f]{64}$/u);
  }
});

test("native dependency analysis discovers check configuration and isolates shipped workspaces", () => {
  assert.doesNotThrow(() =>
    execNativeSync("npm", ["run", "check:dead-code"], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
});

test("native package-manager invocation resolves its declared binary without installation assumptions", async () => {
  const manifestUrl = import.meta.resolve("npm/package.json");
  const manifest = JSON.parse(await fs.readFile(fileURLToPath(manifestUrl), "utf8"));
  const previous = process.env.npm_execpath;
  delete process.env.npm_execpath;
  try {
    const invoke = npmInvocation(["--version"]);
    assert.equal(invoke.command, process.execPath);
    assert.equal(invoke.args[0], fileURLToPath(new URL(manifest.bin.npm, manifestUrl)));
    assert.equal(
      execFileSync(invoke.command, invoke.args, {
        cwd: root,
        encoding: "utf8",
        timeout: 15_000,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
      manifest.version,
    );
  } finally {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  }
});

test("the selected LikeC4 parser supply uses the patched lodash-es release", async () => {
  const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
  const supply = JSON.parse(
    await fs.readFile(path.join(root, "packages/publisher/supplies/likec4/supply.json"), "utf8"),
  );
  const selected = lock.packages["node_modules/lodash-es"];
  assert.equal(selected?.version, "4.18.1");
  assert.equal(supply.packages.find(({ name }) => name === "lodash-es")?.version, selected.version);
});

test("coverage roots include all tracked first-party package runtime modules", () => {
  const tracked = execFileSync("git", ["ls-files", "--", "packages/publisher", "editions/self"], {
    cwd: root,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter((file) => file.endsWith(".mjs"));
  for (const file of tracked) {
    if (/^packages\/publisher\/renderers\/[^/]+\/supply\//u.test(file)) continue;
    if (file === "packages/publisher/supplies/likec4/parser.mjs") continue;
    assert.match(
      file,
      /^(?:packages\/publisher\/(?:src|renderers)\/|editions\/self\/src\/)/u,
      `${file} escapes the owned runtime coverage scope`,
    );
  }
});

test("native Git carrier roles preserve authored coverage and frozen supply obligations", async () => {
  const listed = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const tracked = [];
  for (const file of new Set(listed)) {
    try {
      if ((await fs.stat(path.join(root, file))).isFile()) tracked.push(file);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const attributes = execFileSync("git", ["check-attr", "-z", "--stdin", "ethos-role"], {
    cwd: root,
    encoding: "utf8",
    input: `${tracked.join("\0")}\0`,
  }).split("\0");
  const roles = new Map();
  for (let index = 0; index + 2 < attributes.length; index += 3) {
    assert.equal(attributes[index + 1], "ethos-role");
    roles.set(attributes[index], attributes[index + 2]);
  }
  assert.equal(roles.size, tracked.length);
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, ".config/checks/c8/.c8rc.json"), "utf8"),
  );
  const covered = new Set();
  for await (const file of fs.glob(coverage.include, { cwd: root, exclude: coverage.exclude }))
    covered.add(file.split(path.sep).join("/"));
  const runtime = new Set();
  for (const file of tracked) {
    const role = roles.get(file);
    if (file.endsWith(".sh")) {
      assert.equal(role, "tooling", `${file} has no native script responsibility`);
      assert.match(file, /^tools\//u);
      continue;
    }
    if (!/\.(?:mjs|cjs|js)$/u.test(file)) {
      assert(!["code", "test", "tooling"].includes(role), `${file} is not a JavaScript carrier`);
      continue;
    }
    assert.notEqual(role, "unspecified", `${file} has no native responsibility`);
    if (role === "code") runtime.add(file);
    else if (role === "test") assert.match(file, /^tests\//u);
    else if (role === "tooling") assert.match(file, /^tools\//u);
    else if (role === "config") assert.match(file, /^\.config\//u);
    else if (role === "generated") {
      assert.match(file, /^packages\/publisher\/src\/edition\/generated\//u);
      assert.match(await fs.readFile(path.join(root, file), "utf8"), /^\/\/ Generated from /u);
    } else if (role === "snapshot") {
      assert.match(file, /^packages\/publisher\/(?:renderers\/[^/]+\/supply\/|supplies\/)/u);
      const owner = file.match(
        /^(packages\/publisher\/(?:renderers\/[^/]+\/supply|supplies\/[^/]+))\//u,
      )?.[1];
      assert(owner);
      await fs.access(path.join(root, owner, "supply.json"));
    } else assert.fail(`${file} has an unsupported carrier role: ${role}`);
  }
  assert.deepEqual([...runtime].sort(), [...covered].sort());
  assert(coverage.all);
  for (const dimension of ["statements", "lines", "branches", "functions"])
    assert(coverage[dimension] >= 95);
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  assert.match(workspace.scripts["check:static"], /npm run check:generated/u);
  assert.match(workspace.scripts["check:generated"], /generate-authoring-validators\.mjs --check/u);
});

test("the existing type-check project includes every Provider runtime module", async () => {
  const selected = new Set(
    execFileSync(
      process.execPath,
      [
        path.join(root, "node_modules/typescript/bin/tsc"),
        "--project",
        ".config/checks/typescript/tsconfig.json",
        "--listFilesOnly",
      ],
      { cwd: root, encoding: "utf8", timeout: 30_000 },
    )
      .trim()
      .split("\n")
      .map((file) => path.resolve(file.trim())),
  );
  const providers = execFileSync("git", ["ls-files", "--", "packages/publisher/src/provider"], {
    cwd: root,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter((file) => file.endsWith(".mjs"));
  assert(providers.length > 0);
  for (const file of providers) assert(selected.has(path.join(root, file)), file);

  // TypeScript resolves this declaration; Knip resolves its config name to the runtime package.
  assert(selected.has(path.join(root, "node_modules/@types/punycode/index.d.ts")));
  const knip = parseToml(
    await fs.readFile(path.join(root, ".config/checks/knip/knip.toml"), "utf8"),
  );
  assert.deepEqual(knip.ignoreDependencies, ["@types/punycode", "sax", "opentype.js"]);
});

test("first-party code filenames describe responsibilities, not protocol generations", () => {
  const versionSuffix = /(?:^|[-_.])v\d+(?=[-_.]|$)/iu;
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter((file) => /\.(?:cjs|js|jsx|mjs|ts|tsx)$/u.test(file));
  for (const file of tracked) {
    if (/^packages\/publisher\/renderers\/[^/]+\/supply\//u.test(file)) continue;
    assert.doesNotMatch(path.posix.basename(file), versionSuffix, file);
  }
});

test("public package indexes enumerate exports instead of widening by wildcard", async () => {
  const manifests = ["packages/publisher", "editions/self"];
  const files = new Set();
  for (const directory of manifests) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, "package.json")));
    for (const target of Object.values(manifest.exports))
      if (target.endsWith(".mjs")) files.add(path.posix.join(directory, target));
  }
  for (const file of files) {
    const source = await fs.readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /export\s+\*/u, file);
  }
});

test("ETHOS projects non-overlapping repository quality gates from package scripts", async () => {
  const profile = await fs.readFile(path.join(root, ".ethos/profile.toml"), "utf8");

  assert.match(
    profile,
    /code_correctness_gates = \["node-behavior", "node-static", "node-package"\]/u,
  );
  assert.match(profile, /behavior = "node-behavior"/u);
  assert.match(profile, /static-analysis = "node-static"/u);
  const gates = parseToml(profile).proof.gates;
  assert.equal(gates.length, 5);
  assert.deepEqual(gates.find(({ id }) => id === "runtime-generation").depends_on, [
    "source-integrity",
  ]);
  assert.deepEqual(gates.find(({ id }) => id === "runtime-generation").command, [
    "npm",
    "run",
    "generate",
  ]);
  for (const id of ["node-behavior", "node-static", "node-package"])
    assert.deepEqual(gates.find((gate) => gate.id === id).depends_on, ["runtime-generation"]);
  assert.match(profile, /providers = \["ethos.adapters.gates.code_quality:behavior_report"\]/u);
  assert.match(
    profile,
    /verification_providers = \["ethos.adapters.gates.code_quality:static_report"\]/u,
  );
  assert.match(profile, /execution_mode = "provider"/u);
  assert.doesNotMatch(profile, /command = \["npm", "run", "test:coverage"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:static"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:package"\]/u);
  assert.doesNotMatch(profile, /node-syntax/u);
});
