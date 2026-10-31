import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";
import { npmInvocation } from "./fixtures/npm-pack-report.mjs";

const root = path.resolve(import.meta.dirname, "..");
const owned = [
  ".config/ci/pipeline.cue",
  ".config/mise/config.toml",
  ".config/checks/prettier/prettier.toml",
  ".gitlab-ci.yml",
  "tools/ci/projection.mjs",
  "packages/publisher/renderers/resvg/supply/resvg/source.json",
];

const projections = [".gitlab-ci.yml", ".github/workflows/verify.yml"];
const cueInputs = [owned[0], owned.at(-1)];

test("every native CI job installs Chromium before importing the required browser fixture", async () => {
  const [gitlab, github] = await Promise.all(
    projections.map(async (relative) =>
      parse(await fs.readFile(path.join(root, relative), "utf8")),
    ),
  );
  const jobs = Object.entries(github.jobs).map(([name, job]) => [
    `github/${name}`,
    job.steps.filter((step) => step.run).flatMap((step) => step.run.split("\n")),
  ]);
  for (const platform of ["linux", "macos", "windows"])
    for (const role of ["review", "protected"]) {
      const name = `verify:${platform}:${role}`;
      const job = Object.assign(
        {},
        gitlab[".verify-native"],
        gitlab[`.verify-${platform}`],
        gitlab[name],
      );
      jobs.push([`gitlab/${name}`, [...job.before_script, ...job.script]]);
    }
  for (const [name, commands] of jobs) {
    const installation = commands.indexOf(
      "mise exec -- node node_modules/playwright-core/cli.js install chromium",
    );
    assert(installation >= 0, `${name}: Chromium installation is required`);
    const readers = commands
      .map((command, index) =>
        command.includes("--import=./tests/fixtures/npm-environment.mjs") ? index : -1,
      )
      .filter((index) => index >= 0);
    assert(readers.length > 0, `${name}: browser admission must remain required`);
    for (const index of readers)
      assert(
        index > installation,
        `${name}: Chromium installation must precede browser fixture import: ${commands[index]}`,
      );
  }
});

test("Linux bootstrap uses native download, checksum and installation before Mise execution", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const version = exportCue("shared.miseVersion");
  const bootstrap = pipeline[".verify-linux"].before_script;
  const staged = "build/runtime/tool-cache/mise/bootstrap/mise.download";
  const executable = "build/runtime/tool-cache/mise/bootstrap/mise";
  assert.deepEqual(bootstrap, [
    `curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --connect-timeout 15 --max-time 180 --create-dirs --output ${staged} https://github.com/jdx/mise/releases/download/v${version}/mise-v${version}-linux-arm64`,
    "sha256sum --strict --check .config/ci/linux/mise.sha256",
    `install --mode=0755 ${staged} ${executable}`,
    'export PATH="$CI_PROJECT_DIR/build/runtime/tool-cache/mise/bootstrap:$PATH"',
  ]);
  // A job variable cannot extend the image's PATH: GitLab does not expand $PATH
  // there, and the job's shell then finds no `rm` or `hostname` to prepare with.
  assert.equal(pipeline[".verify-linux"].variables.PATH, undefined);
  const checksum = await fs.readFile(path.join(root, ".config/ci/linux/mise.sha256"), "utf8");
  assert.match(checksum, new RegExp(`^[a-f0-9]{64}  ${staged.replaceAll(".", "\\.")}\\n$`, "u"));
  assert.equal(pipeline[".verify-linux"].script[0], "mise --version");
  await assert.rejects(fs.access(path.join(root, "tools/ci/mise.sh")), { code: "ENOENT" });
  await assert.rejects(fs.access(path.join(root, ".config/mise/generated.toml")), {
    code: "ENOENT",
  });
});

test("the Windows job writes Mise shims as command files", async () => {
  // The Windows runner refuses the copies of mise-shim.exe that Mise's default
  // shim mode makes for every executable a tool provides, such as npm's
  // arborist; the jobs run tools through `mise exec`, which needs no shim.
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  assert.equal(pipeline[".verify-windows"].variables.MISE_WINDOWS_SHIM_MODE, "file");
});

test("the GitLab Windows jobs keep the Rust toolchain under the runner's builds directory", async (t) => {
  // The MSVC linker opens no path of 260 characters or more, and under the
  // protected runner's build directory a Rust standard library file in the
  // workspace's tool cache takes 260; the runner's builds directory is short.
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const { variables } = pipeline[".verify-windows"];
  assert.equal(variables.MISE_RUSTUP_HOME, "$CI_BUILDS_DIR/tool-cache/rustup");
  assert.equal(variables.MISE_CARGO_HOME, "$CI_BUILDS_DIR/tool-cache/cargo");
  // Mise keeps a home the job sets, and falls back to the workspace's tool cache.
  const base = path.join(root, "build/runtime/work");
  await fs.mkdir(base, { recursive: true });
  const scratch = await fs.mkdtemp(path.join(base, "mise-homes-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const configuration = path.join(scratch, ".config/mise");
  await fs.mkdir(configuration, { recursive: true });
  for (const name of ["config.toml", "mise.lock"])
    await fs.copyFile(path.join(root, ".config/mise", name), path.join(configuration, name));
  const homes = (overrides) => {
    const env = {
      ...process.env,
      MISE_DATA_DIR: path.join(scratch, "data"),
      MISE_CACHE_DIR: path.join(scratch, "cache"),
      MISE_TRUSTED_CONFIG_PATHS: scratch,
    };
    delete env.MISE_RUSTUP_HOME;
    delete env.MISE_CARGO_HOME;
    const result = spawnSync("mise", ["env", "--json"], {
      cwd: scratch,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...env, ...overrides },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    const environment = JSON.parse(result.stdout);
    return [environment.MISE_RUSTUP_HOME, environment.MISE_CARGO_HOME];
  };
  const selected = path.join(scratch, "selected");
  assert.deepEqual(
    homes({ MISE_RUSTUP_HOME: `${selected}/rustup`, MISE_CARGO_HOME: `${selected}/cargo` }),
    [`${selected}/rustup`, `${selected}/cargo`],
  );
  const [rustup, cargo] = homes({});
  assert(rustup.endsWith("/build/runtime/tool-cache/rustup"), rustup);
  assert(cargo.endsWith("/build/runtime/tool-cache/cargo"), cargo);
});

test("native Mise paths resolve before the locked tools are installed", async (t) => {
  const base = path.join(root, "build/runtime/work");
  await fs.mkdir(base, { recursive: true });
  const scratch = await fs.mkdtemp(path.join(base, "mise-bootstrap-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const configuration = path.join(scratch, ".config/mise");
  await fs.mkdir(configuration, { recursive: true });
  for (const name of ["config.toml", "mise.lock"])
    await fs.copyFile(path.join(root, ".config/mise", name), path.join(configuration, name));
  const result = spawnSync("mise", ["env", "--paths"], {
    cwd: scratch,
    encoding: "utf8",
    timeout: 30_000,
    env: {
      ...process.env,
      MISE_DATA_DIR: path.join(scratch, "data"),
      MISE_CACHE_DIR: path.join(scratch, "cache"),
      MISE_TRUSTED_CONFIG_PATHS: scratch,
    },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await fs.readdir(path.join(scratch, "data/installs")).catch(() => []), []);
});

test("native Mise execution selects the declared Node and npm rather than bundled npm", async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  for (const [tool, expected] of [
    ["node", `v${workspace.devEngines.runtime.version}`],
    ["npm", workspace.devEngines.packageManager.version],
  ]) {
    const result = spawnSync("mise", ["exec", "--", tool, "--version"], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, MISE_EXEC_AUTO_INSTALL: "0" },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
  }
});

function exportCue(expression) {
  return JSON.parse(
    execFileSync("cue", ["export", ...cueInputs, "-e", expression], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CUE_REGISTRY: "none" },
    }),
  );
}

test("native CUE projection check refuses direct drift without mutation", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-ci-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  for (const relative of new Set([...owned, ...projections])) {
    const target = path.join(scratch, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(root, relative), target);
  }
  await fs.symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "junction");
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  await fs.writeFile(
    path.join(scratch, "package.json"),
    JSON.stringify({
      name: "ci-projection-fixture",
      scripts: { "check:ci": manifest.scripts["check:ci"] },
    }),
  );
  const options = { cwd: scratch, encoding: "utf8", timeout: 30_000, stdio: "pipe" };
  const invoke = npmInvocation(["run", "check:ci"]);
  execFileSync(invoke.command, invoke.args, options);
  const source = path.join(scratch, ".config/ci/pipeline.cue");
  const digest = async (file) =>
    createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex");
  const files = [source, ...projections.map((relative) => path.join(scratch, relative))];
  const hashes = () => Promise.all(files.map(digest));
  for (const relative of projections) {
    const projection = path.join(scratch, relative);
    await fs.appendFile(projection, "\n# direct drift\n");
    const before = await hashes();
    const rejected = spawnSync(invoke.command, invoke.args, options);
    assert.notEqual(rejected.status, 0);
    assert.match(`${rejected.stdout}${rejected.stderr}`, /ci_projection_drift/u);
    assert.deepEqual(await hashes(), before);
    execFileSync(process.execPath, ["tools/ci/projection.mjs", "--write"], options);
    const canonical = await hashes();
    execFileSync(invoke.command, invoke.args, options);
    execFileSync(process.execPath, ["tools/ci/projection.mjs", "--write"], options);
    assert.deepEqual(await hashes(), canonical);
  }
});

test("the selected peer invokes the shared quality and projection owners on all native platforms", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.scripts["check:ci"], "node tools/ci/projection.mjs --check");
  assert(manifest.scripts["check:generated"].includes("npm run check:ci"));
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const common = pipeline[".verify-native"];
  assert(common.script.includes("mise exec -- npm run check:ci"));
  assert.equal(common.script.at(-1), "mise exec -- npm run check");
  for (const platform of ["linux", "macos", "windows"]) {
    assert.equal(pipeline[`.verify-${platform}`].extends, ".verify-native");
    for (const trust of ["review", "protected"])
      assert.equal(pipeline[`verify:${platform}:${trust}`].extends, `.verify-${platform}`);
  }
  const compiled = exportCue("compiled");
  assert.deepEqual(Object.keys(compiled), ["gitlab", "github"]);
  const shared = exportCue(
    "shared & {platformSetup: {workspace: peers.gitlab.workspace}, environment: {workspace: peers.gitlab.workspace}}",
  );
  const peer = exportCue("peers.gitlab");
  assert.deepEqual(shared.platforms, ["linux", "macos", "windows"]);
  assert(shared.preparation.includes("mise exec -- npm run check:ci"));
  assert.equal(shared.acceptance.at(-1), "mise exec -- npm run check");
  assert(peer.transport.every((command) => !command.includes("npm run check")));
  for (const platform of shared.platforms)
    assert(!Object.hasOwn(peer.platforms[platform], "before_script"));
  const github = parse(await fs.readFile(path.join(root, projections[1]), "utf8"));
  assert.deepEqual(github, compiled.github.document);
  assert.deepEqual(github.permissions, { contents: "read" });
  assert.deepEqual(Object.keys(github.on), ["pull_request", "push", "workflow_dispatch"]);
  for (const platform of shared.platforms) {
    const native = shared.platformSetup[platform];
    const acceptance = shared.acceptance.map(
      (command) => native.executor + command.slice("mise exec -- ".length),
    );
    if (platform === "linux")
      for (const command of acceptance) assert(pipeline[".verify-linux"].script.includes(command));
    for (const trust of shared.trustRoles) {
      const job = github.jobs[`verify-${platform}-${trust}`];
      assert.equal(job["timeout-minutes"], shared.timeLimitMinutes);
      const runs = job.steps.filter((step) => step.run).flatMap((step) => step.run.split("\n"));
      const generation = runs.indexOf("mise exec -- npm run generate");
      const firstTest = runs.findIndex((command) => command.includes(" --test"));
      assert(
        generation > runs.indexOf("mise exec -- npm ci --ignore-scripts --no-audit --no-fund"),
      );
      assert(generation < firstTest, `${platform}/${trust}: generated inputs precede test imports`);
      for (const command of [...shared.preparation, ...acceptance])
        assert(runs.includes(command), `${platform}/${trust}: ${command}`);
      assert.equal(job.steps[0].with["fetch-depth"], 0);
      assert.equal(job.steps[0].with["persist-credentials"], false);
      assert.match(job.steps[0].with.ref, /pull_request\.head\.sha \|\| github\.sha/u);
      assert(
        job.steps.filter((step) => step.uses).every((step) => /@[a-f0-9]{40}$/u.test(step.uses)),
      );
      for (const command of [...shared.preparation, ...acceptance])
        assert(
          job.steps.some((step) => step.run === command),
          `native failure boundary: ${command}`,
        );
    }
  }
  const githubPeer = exportCue("peers.github");
  assert(!JSON.stringify(githubPeer).includes("CI_JOB_TOKEN"));
  assert(!JSON.stringify(github).includes("192.168.64.101"));
  assert(githubPeer.transport.run.startsWith("gh release download "));
  assert(githubPeer.transport.run.includes(exportCue("source.registry.version")));
});
