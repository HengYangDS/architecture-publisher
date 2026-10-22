import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const preload = new URL("./fixtures/npm-environment.mjs", import.meta.url).href;

test(
  "POSIX package reproduction has canonical modes despite the Runner's inherited mask",
  {
    skip: process.platform === "win32",
  },
  async (t) => {
    const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-mask-"));
    t.after(() => fs.rm(scratch, { recursive: true, force: true }));
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
    import fs from 'node:fs';
    import path from 'node:path';
    process.umask(0o077);
    await import(${JSON.stringify(preload)});
    const root = ${JSON.stringify(scratch)};
    fs.mkdirSync(path.join(root, 'package'));
    fs.writeFileSync(path.join(root, 'package/member.mjs'), 'export const selected = true;\\n');
    process.stdout.write(JSON.stringify({
      mask: process.umask(),
      directory: fs.statSync(path.join(root, 'package')).mode & 0o777,
      member: fs.statSync(path.join(root, 'package/member.mjs')).mode & 0o777
    }));
  `,
      ],
      {
        cwd: root,
        env: { ...process.env, CI: "false" },
        encoding: "utf8",
        timeout: 10_000,
      },
    );
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), { mask: 0o022, directory: 0o755, member: 0o644 });
  },
);

test("CI browser binding preserves an explicit caller executable", () => {
  const child = spawnSync(
    process.execPath,
    [
      `--import=${preload}`,
      "--input-type=module",
      "--eval",
      'process.stdout.write(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "")',
    ],
    {
      cwd: root,
      env: { ...process.env, CI: "true", ARCHPUB_BROWSER_EXECUTABLE: process.execPath },
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, process.execPath);
});

test("CI refuses missing locked browser supply instead of skipping its tests", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-browser-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const environment = { ...process.env, CI: "true", PLAYWRIGHT_BROWSERS_PATH: scratch };
  delete environment.ARCHPUB_BROWSER_EXECUTABLE;
  const child = spawnSync(
    process.execPath,
    [`--import=${preload}`, "--input-type=module", "--eval", 'process.stdout.write("ran")'],
    { cwd: root, env: environment, encoding: "utf8", timeout: 10_000 },
  );
  assert.notEqual(child.status, 0);
  assert.equal(child.stdout, "");
  assert.match(child.stderr, /CI requires an accessible absolute browser executable/u);
});

test("CI binds its locked browser only when the caller has not selected one", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-browser-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const environment = { ...process.env, CI: "true", PLAYWRIGHT_BROWSERS_PATH: scratch };
  delete environment.ARCHPUB_BROWSER_EXECUTABLE;
  const resolved = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'import { chromium } from "playwright-core"; process.stdout.write(chromium.executablePath());',
    ],
    { cwd: root, env: environment, encoding: "utf8", timeout: 10_000 },
  );
  assert.equal(resolved.status, 0, resolved.stderr);
  await fs.mkdir(path.dirname(resolved.stdout), { recursive: true });
  await fs.writeFile(resolved.stdout, "browser-binding-fixture", { mode: 0o700 });
  const child = spawnSync(
    process.execPath,
    [
      `--import=${preload}`,
      "--input-type=module",
      "--eval",
      'process.stdout.write(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "")',
    ],
    { cwd: root, env: environment, encoding: "utf8", timeout: 10_000 },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, resolved.stdout);
});

test("installed-test npm calls cannot inherit host allowlists or registry config", () => {
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith("npm_config_")),
  );
  environment.npm_config_allow_scripts = "host-only-package";
  environment.npm_config_registry = "https://blocked.invalid/";
  const script = `
    import { execNativeSync } from ${JSON.stringify(new URL("./fixtures/npm-pack-report.mjs", import.meta.url).href)};
    const config = (name) => execNativeSync('npm', ['config', 'get', name], {
      env: process.env, encoding: 'utf8', timeout: 3000, input: ''
    }).trim();
    process.stdout.write(JSON.stringify({
      allowScripts: config('allow-scripts'),
      registry: config('registry'),
      user: config('userconfig'),
      global: config('globalconfig')
    }));
  `;
  const child = spawnSync(
    process.execPath,
    [`--import=${preload}`, "--input-type=module", "--eval", script],
    { cwd: root, env: environment, encoding: "utf8", timeout: 10_000, maxBuffer: 1024 * 1024 },
  );
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.allowScripts, "");
  assert.notEqual(result.registry, "https://blocked.invalid/");
  assert.equal(result.user, path.join(root, "tests/fixtures/npm-user.npmrc"));
  assert.equal(result.global, path.join(root, "tests/fixtures/npm-global.npmrc"));
});

test("ephemeral offline installation preserves consumer metadata without lock writes", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-npm-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const supply = path.join(scratch, "supply"),
    consumer = path.join(scratch, "consumer");
  await fs.mkdir(supply);
  await fs.mkdir(consumer);
  await fs.writeFile(
    path.join(supply, "package.json"),
    '{"name":"ephemeral-supply","version":"1.0.0","files":["index.mjs"]}\n',
  );
  await fs.writeFile(path.join(supply, "index.mjs"), "export const selected = true;\n");
  const metadata = '{"private":true,"name":"independent-consumer","version":"1.0.0"}\n';
  await fs.writeFile(path.join(consumer, "package.json"), metadata);
  const script = `
    import { spawnNativeSync, parseNpmPackRecord } from ${JSON.stringify(new URL("./fixtures/npm-pack-report.mjs", import.meta.url).href)};
    import assert from 'node:assert/strict';
    import path from 'node:path';
    const options = { cwd: ${JSON.stringify(supply)}, env: process.env, encoding: 'utf8', timeout: 20_000 };
    const packed = spawnNativeSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', ${JSON.stringify(scratch)}], options);
    assert.equal(packed.status, 0, packed.stderr);
    const archive = path.join(${JSON.stringify(scratch)}, parseNpmPackRecord(packed.stdout).filename);
    const installed = spawnNativeSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', archive], { ...options, cwd: ${JSON.stringify(consumer)} });
    assert.equal(installed.status, 0, installed.stderr);
  `;
  const child = spawnSync(
    process.execPath,
    [`--import=${preload}`, "--input-type=module", "--eval", script],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 45_000,
      env: {
        ...process.env,
        npm_config_cache: path.join(scratch, "cache"),
        npm_config_save: "true",
        npm_config_package_lock: "true",
      },
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(await fs.readFile(path.join(consumer, "package.json"), "utf8"), metadata);
  await assert.rejects(fs.access(path.join(consumer, "package-lock.json")), { code: "ENOENT" });
  assert.equal(
    await fs.readFile(path.join(consumer, "node_modules/ephemeral-supply/index.mjs"), "utf8"),
    "export const selected = true;\n",
  );
});
