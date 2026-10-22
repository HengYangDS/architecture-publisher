import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { installCoreAndSelf } from "./fixtures/installed-packages.mjs";
import {
  execNativeSync,
  parseNpmPackRecord,
  spawnNativeSync,
} from "./fixtures/npm-pack-report.mjs";

const record = {
  name: "@architecture-publisher/self-edition",
  filename: "architecture-publisher-self-edition-0.3.0-alpha.3.tgz",
  files: [{ path: "package.json" }],
};

test("one npm pack record accepts array and package-name envelopes", () => {
  assert.deepEqual(parseNpmPackRecord(JSON.stringify([record])), record);
  assert.deepEqual(parseNpmPackRecord(JSON.stringify({ [record.name]: record })), record);
});

test("npm pack report rejects ambiguous or malformed package records", () => {
  for (const value of [[], {}, [record, record], { wrong: record }, [null], [1]])
    assert.throws(() => parseNpmPackRecord(JSON.stringify(value)), /npm_pack_record_/u);
});

test("native npm invocation preserves exact arguments and caller process options", async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-native-npm-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(scratch, "package.json"),
    '{"name":"native-invocation-probe","version":"1.0.0"}\n',
  );
  const options = {
    cwd: scratch,
    encoding: "utf8",
    timeout: 30_000,
    stdio: "pipe",
    env: {
      ...process.env,
      npm_config_cache: path.join(scratch, "cache"),
      npm_config_offline: "true",
      npm_config_ignore_scripts: "true",
    },
  };
  const packed = spawnNativeSync("npm", ["pack", "--dry-run", "--json"], options);
  assert.equal(packed.error, undefined);
  assert.equal(packed.status, 0, packed.stderr);
  assert.equal(parseNpmPackRecord(packed.stdout).name, "native-invocation-probe");
  assert.match(execNativeSync("npm", ["--version"], options).trim(), /^\d+\.\d+\.\d+$/u);
  const argument = "literal ; argument & not a shell command";
  const forwarded = spawnNativeSync(
    process.execPath,
    ["-e", "process.stdout.write(process.argv[1])", argument],
    options,
  );
  assert.equal(forwarded.status, 0, forwarded.stderr);
  assert.equal(forwarded.stdout, argument);
  const nonzero = spawnNativeSync(process.execPath, ["-e", "process.exit(17)"], options);
  assert.equal(nonzero.status, 17);
});

test("native setup deadlines expose the process error and selected diagnostics", () => {
  assert.throws(
    () =>
      spawnNativeSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          "import { writeSync } from 'node:fs'; writeSync(1, 'selected stdout'); writeSync(2, 'selected stderr'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30_000);",
        ],
        { encoding: "utf8", timeout: 5000 },
      ),
    (error) => {
      assert.equal(error.code, "ETIMEDOUT");
      assert.equal(error.status, null);
      assert.equal(error.stdout, "selected stdout");
      assert.equal(error.stderr, "selected stderr");
      return true;
    },
  );
});

test("scripts-disabled npm setup excludes tooling coverage and preserves product instrumentation", async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-npm-coverage-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const entry = path.join(scratch, "selected-npm.mjs");
  await fs.writeFile(
    entry,
    "console.log(JSON.stringify({ coverage: process.env.NODE_V8_COVERAGE ?? null, marker: process.env.SELECTED_MARKER, args: process.argv.slice(2) }));\n",
  );
  const previous = process.env.npm_execpath;
  process.env.npm_execpath = entry;
  t.after(() => {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  });
  const coverage = path.join(scratch, "coverage");
  await fs.mkdir(coverage);
  const options = {
    cwd: scratch,
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, NODE_V8_COVERAGE: coverage, SELECTED_MARKER: "preserved" },
  };
  for (const command of ["pack", "install", "ci"]) {
    const args = [command, "--ignore-scripts", "--offline"];
    const result = JSON.parse(spawnNativeSync("npm", args, options).stdout);
    assert.equal(result.coverage, "");
    assert.equal(result.marker, "preserved");
    assert.deepEqual(result.args, args);
  }
  assert.equal(
    JSON.parse(execNativeSync("npm", ["pack", "--ignore-scripts"], options)).coverage,
    "",
  );
  assert.deepEqual(await fs.readdir(coverage), []);
  for (const command of ["pack", "run"])
    assert.equal(JSON.parse(execNativeSync("npm", [command], options)).coverage, coverage);
  assert.equal(
    JSON.parse(spawnNativeSync(process.execPath, [entry], options).stdout).coverage,
    coverage,
  );
  assert.equal(options.env.NODE_V8_COVERAGE, coverage);
  assert.ok((await fs.readdir(coverage)).length > 0);
});

test("shared offline installation installs all exact archives once without mutable consumer manifests", async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-shared-install-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const project = path.join(scratch, "project");
  const directory = path.join(scratch, "installation");
  await fs.mkdir(path.join(project, "packages/publisher"), { recursive: true });
  await fs.mkdir(path.join(project, "editions/self"), { recursive: true });
  await fs.mkdir(directory);
  const entry = path.join(scratch, "selected-npm.mjs");
  const log = path.join(scratch, "invocations.jsonl");
  await fs.writeFile(
    entry,
    `import { appendFileSync } from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, cwd: process.cwd(), cache: process.env.npm_config_cache, coverage: process.env.NODE_V8_COVERAGE }) + '\\n');
if (args[0] === 'pack') {
  const name = path.basename(process.cwd()) === 'publisher' ? 'architecture-publisher' : '@architecture-publisher/self-edition';
  console.log(JSON.stringify([{ name, filename: name === 'architecture-publisher' ? 'core.tgz' : 'self.tgz', files: [{ path: 'package.json' }] }]));
}
`,
  );
  const previous = process.env.npm_execpath;
  process.env.npm_execpath = entry;
  try {
    const extra = path.join(directory, "provider.tgz");
    const installed = await installCoreAndSelf(project, directory, [extra]);
    const invocations = (await fs.readFile(log, "utf8")).trim().split("\n").map(JSON.parse);
    const installs = invocations.filter(({ args }) => args[0] === "install");
    assert.equal(installs.length, 1);
    assert.deepEqual(installs[0].args, [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-save",
      "--package-lock=false",
      "--prefix",
      installed.consumer,
      path.join(directory, "core.tgz"),
      path.join(directory, "self.tgz"),
      extra,
    ]);
    for (const invocation of invocations) {
      assert.equal(invocation.cache, path.join(directory, "npm-cache"));
      assert.equal(invocation.coverage, "");
    }
    assert.equal(installs[0].cwd, installed.consumer);
    assert.equal(
      installed.coreRoot,
      path.join(installed.consumer, "node_modules/architecture-publisher"),
    );
    assert.equal(
      installed.selfRoot,
      path.join(installed.consumer, "node_modules/@architecture-publisher/self-edition"),
    );
  } finally {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  }
});
