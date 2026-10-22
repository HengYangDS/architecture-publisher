import { parse as parseToml } from "smol-toml";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import npmPackage from "npm/package.json" with { type: "json" };
import { parse } from "yaml";
import { npmInvocation } from "./fixtures/npm-pack-report.mjs";
import { root } from "./fixtures/quality-contract.mjs";

test("captured SVG inputs retain exact bytes under one native proof owner", async () => {
  const captured = {
    "docs/research/evidence/aigw-d2-boundary-grid.svg":
      "d05cff49289c71f3ef28cbce0d4a68b6ad7579d25930b3df72e4b3a9338b34aa",
    "docs/research/evidence/aigw-echarts-matrix-graph.svg":
      "9653853c38b0d269d391e10ed0ff523d9c6083b721245f01687ce0cdc6c2cc34",
    "docs/research/evidence/aigw-static-tb-two-column.svg":
      "85776de833998d1b253cc3bcc71c3e92b17a71b99208da07c4cdfe7179f1336c",
    "examples/job-lifecycle-updated.svg":
      "1a612f6c88b560356151b98311104f7fdf33deb52433e18221255ee0dcb0ff29",
    "examples/job-lifecycle.svg":
      "b4e2e7c4228229daa34c240d0cf54588ce9f6bd0fcb5b054ca8e68fd61e33ed2",
    "examples/service-topology-updated.svg":
      "916eaf4ed3a442ce495b2aa3ed6dd007a51d25bf539e7ffdf2ae01efe74b8468",
    "examples/service-topology.svg":
      "507fdb65dc3f7783b56334a889bf49554be9f04b1eca1cb5e3d61728e9da0f66",
  };
  for (const [relative, digest] of Object.entries(captured))
    assert.equal(
      createHash("sha256")
        .update(await fs.readFile(path.join(root, relative)))
        .digest("hex"),
      digest,
      relative,
    );
  const policy = parseToml(
    await fs.readFile(path.join(root, ".config/checks/format-selection/policy.toml"), "utf8"),
  );
  assert.equal(policy.ownership.length, 1);
  const [owner] = policy.ownership;
  assert.deepEqual([...owner.paths].sort(), Object.keys(captured).sort());
  assert.equal(owner.format_owner, "immutable-carrier");
  assert.equal(owner.mutation_policy, "forbidden");
  assert.equal(owner.validation_owner, "node-behavior");
  assert.equal(owner.validation_command, "npm run test:coverage");
});

test("the generated gate validates Raster before its dependent implementation closure", async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const steps = workspace.scripts["check:generated"].split(" && ");
  const raster = steps.indexOf("node tools/supply/resvg.mjs --check");
  const implementation = steps.indexOf("node tools/supply/implementation.mjs --check");
  assert(
    raster >= 0 && implementation > raster,
    "Raster supply must participate in the early dependency gate",
  );
});

test("native package-manager admission rejects a mismatched toolchain before scripts", async (t) => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const selected = workspace.devEngines;
  assert.equal(selected?.runtime.name, "node");
  assert.equal(
    selected.runtime.version,
    parseToml(await fs.readFile(path.join(root, ".config/mise/config.toml"), "utf8")).tools.node,
  );
  assert.equal(selected.runtime.onFail, "error");
  assert.equal(selected.packageManager.name, "npm");
  assert.equal(workspace.packageManager, `npm@${selected.packageManager.version}`);
  assert.equal(workspace.devDependencies.npm, selected.packageManager.version);
  assert.equal(npmPackage.version, selected.packageManager.version);
  assert.equal(selected.packageManager.onFail, "error");
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-dev-engine-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const marker = path.join(scratch, "ran");
  const probe = "node -e \"require('node:fs').writeFileSync('ran','selected')\"";
  const invoke = npmInvocation(["run", "probe"]);
  const options = {
    cwd: scratch,
    encoding: "utf8",
    timeout: 30_000,
    stdio: "pipe",
    env: { ...process.env, npm_config_cache: path.join(scratch, "npm-cache") },
  };
  for (const kind of ["runtime", "packageManager"]) {
    const rejected = structuredClone(selected);
    rejected[kind].version = "0.0.0";
    await fs.writeFile(
      path.join(scratch, "package.json"),
      JSON.stringify({ private: true, devEngines: rejected, scripts: { probe } }),
    );
    assert.throws(() => execFileSync(invoke.command, invoke.args, options), /EBADDEVENGINES/u);
    await assert.rejects(fs.access(marker), { code: "ENOENT" });
  }
  await fs.writeFile(
    path.join(scratch, "package.json"),
    JSON.stringify({ private: true, devEngines: selected, scripts: { probe } }),
  );
  execFileSync(invoke.command, invoke.args, options);
  assert.equal(await fs.readFile(marker, "utf8"), "selected");
});

test("native workflow selects one review pipeline without skipping protected refs or tags", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  assert.deepEqual(pipeline.workflow?.rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_TAG || $CI_COMMIT_REF_PROTECTED == "true"' },
    {
      if: '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS',
      when: "never",
    },
    { if: "$CI_COMMIT_BRANCH" },
  ]);
});

test("native CI binds browser and frozen Raster journeys before the whole quality gate", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const native = pipeline[".verify-native"];
  assert.equal(native?.stage, "verify");
  assert.equal(native.timeout, "60m");
  assert.equal(pipeline.variables?.GIT_STRATEGY, "fetch");
  assert.equal(pipeline.variables?.GIT_CLEAN_FLAGS, "-ffdx -e build/runtime/tool-cache/");
  assert.equal(pipeline.variables?.MISE_ENV, "ci");
  assert.equal(pipeline.variables?.MISE_LOCKED, "1");
  assert.equal(pipeline.variables?.MISE_DATA_DIR, "$CI_PROJECT_DIR/build/runtime/tool-cache/mise");
  assert.equal(
    pipeline.variables?.MISE_CACHE_DIR,
    `${pipeline.variables.MISE_DATA_DIR}/cache`,
    "native npm hardlinks remain inside the job-owned Mise cache and permission boundary",
  );
  assert.equal(pipeline.variables?.MISE_TRUSTED_CONFIG_PATHS, "$CI_PROJECT_DIR");
  const toolchain = await fs.readFile(path.join(root, ".config/mise/config.toml"), "utf8");
  assert.match(
    toolchain,
    /components = \[\s*"cargo",\s*"rust-std",\s*"rustc",?\s*\]/u,
    "native Rust installation reconciles the required host build tools and standard library",
  );
  const toolchainLock = await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8");
  assert.equal(
    toolchainLock.match(/\[\[tools\.rust\]\]/gu)?.length,
    1,
    "one native lock entry owns the selected Rust toolchain",
  );
  assert.match(
    toolchainLock,
    /\[tools\.rust\.options\][\s\S]*components = "cargo,rust-std,rustc"/u,
    "the native lock binds the required Rust component selection",
  );
  assert.equal(native.script.at(-1), "mise exec -- npm run check");
  assert(native.script.includes("mise install"));
  assert.equal(
    native.script[native.script.indexOf("mise install") + 1],
    "mise exec -- rustup component add rust-std",
    "native rustup reconciles the selected host library before Cargo build scripts",
  );
  assert(native.script.includes("mise exec -- npm ci --ignore-scripts --no-audit --no-fund"));
  const installation = native.script.indexOf(
    "mise exec -- npm ci --ignore-scripts --no-audit --no-fund",
  );
  assert.deepEqual(
    native.script.slice(installation + 1, installation + 4),
    ["mise run raster-supply", "mise exec -- npm run generate", "mise exec -- npm run check:ci"],
    "locked runtime generation, projection and prerequisites precede expensive acceptance",
  );
  assert(
    native.script.includes(
      "mise exec -- node node_modules/playwright-core/cli.js install chromium",
    ),
  );
  const browserInstallation = native.script.indexOf(
    "mise exec -- node node_modules/playwright-core/cli.js install chromium",
  );
  assert.equal(
    native.script[browserInstallation + 1],
    "mise exec -- node --import=./tests/fixtures/npm-environment.mjs --test --test-concurrency=1 --test-timeout=90000 --test-name-pattern='native CI honors the invoker-owned pinned browser root|self preparation selects one direct Project instead of a legacy Edition authority' tests/quality-contract.test.mjs tests/self-edition.test.mjs",
    "browser-dependent prerequisite checks run only after the selected browser is installed",
  );
  assert.equal(
    native.script[browserInstallation + 2],
    "mise exec -- node --import=./tests/fixtures/npm-environment.mjs --test --test-name-pattern='standalone reader policy blocks dynamic page connections' tests/interactive-html.test.mjs",
    "the existing sandboxed browser journey runs before expensive Raster and coverage gates",
  );
  assert(
    native.script.includes(
      "mise exec -- node tools/raster/resvg/verify.mjs --registry-url > build/runtime/tool-cache/raster/source-url.txt",
    ),
  );
  const retrieval = native.script.find((command) => command.includes("--expand-url"));
  assert.match(retrieval, /--variable %CI_JOB_TOKEN/);
  assert.match(retrieval, /--expand-header/);
  assert.match(retrieval, /--max-time 180/);
  assert.doesNotMatch(retrieval, /\$\{?CI_JOB_TOKEN|\$env:CI_JOB_TOKEN/);
  assert(
    native.script.includes(
      "mise exec -- node tools/raster/resvg/verify.mjs --archive build/runtime/tool-cache/raster/source.tar.xz",
    ),
  );
  assert(
    native.script.includes(
      "mise exec -- node --test tests/conformance/journeys/raster/rebuild.test.mjs",
    ),
  );
  assert.doesNotMatch(
    native.script.join("\n"),
    /npm install --global|--no-sandbox|continue-on-error|\|\| true/,
  );
  assert.equal(native.artifacts?.when, "always");
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, ".config/checks/c8/.c8rc.json"), "utf8"),
  );
  const outputs = new Map([
    ["json-summary", "coverage/coverage-summary.json"],
    ["json", "coverage/coverage-final.json"],
  ]);
  assert.deepEqual(
    native.artifacts.paths,
    coverage.reporter
      .filter((reporter) => outputs.has(reporter))
      .map((reporter) => outputs.get(reporter)),
    "hosted artifact declarations match the selected coverage reporters",
  );
});

test("native CI honors the invoker-owned pinned browser root", () => {
  const environment = { ...process.env, MISE_ENV: "ci", MISE_LOCKED: "1" };
  const selected = path.join(root, "build/runtime/tool-cache/selected-browser");
  const readRoot = (env) =>
    execFileSync(
      "mise",
      [
        "exec",
        "--",
        process.execPath,
        "--eval",
        "console.log(process.env.PLAYWRIGHT_BROWSERS_PATH)",
      ],
      { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 },
    ).trim();
  delete environment.PLAYWRIGHT_BROWSERS_PATH;
  assert.equal(
    path.normalize(readRoot(environment)),
    path.join(root, "build/runtime/tool-cache/playwright"),
  );
  assert.equal(readRoot({ ...environment, PLAYWRIGHT_BROWSERS_PATH: selected }), selected);
});

test("Linux verification keeps the common gate and separates trust roles", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const native = pipeline[".verify-linux"];
  assert.equal(native.variables?.PLAYWRIGHT_BROWSERS_PATH, "/ms-playwright");
  assert.equal(pipeline[".verify-native"].stage, "verify");
  assert.equal(native.resource_group, undefined);
  assert.equal(native.extends, ".verify-native");
  assert.equal(native.variables.FF_USE_INIT_WITH_DOCKER_EXECUTOR, "true");
  assert.equal(native.variables.FF_DISABLE_UMASK_FOR_DOCKER_EXECUTOR, "true");
  assert.equal(pipeline.variables.MISE_HTTP_TIMEOUT, "180s");
  assert.equal(native.before_script.length, 3);
  assert.equal(native.before_script[1], "sha256sum --strict --check .config/ci/linux/mise.sha256");
  assert.match(native.before_script[2], /^install --mode=0755 /u);
  assert.equal(native.variables.MISE_VERSION, undefined);
  assert.equal(native.variables.MISE_INSTALL_PATH, undefined);
  assert.equal(
    native.variables.PATH,
    "$CI_PROJECT_DIR/build/runtime/tool-cache/mise/bootstrap:$PATH",
  );
  for (const role of ["review", "protected"]) {
    const job = pipeline[`verify:linux:${role}`];
    assert.equal(job.extends, ".verify-linux");
    assert.equal(job.script, undefined);
    assert.deepEqual(job.tags, [
      `ci-linux-arm64-container${role === "protected" ? "-protected" : ""}`,
    ]);
  }
  assert.deepEqual(pipeline["verify:linux:review"].rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(pipeline["verify:linux:protected"].rules, [
    { if: '$CI_COMMIT_REF_PROTECTED == "true"' },
  ]);
});

test("Linux image changes only its non-root default without project contents", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  assert.equal(
    pipeline.image.docker,
    undefined,
    "Runner ownership inspection must see the image default, not a late user override",
  );
  const recipe = await fs.readFile(path.join(root, ".config/ci/linux/Dockerfile"), "utf8");
  const [base, user, ...extra] = recipe.trim().split("\n");
  assert.match(base, /^FROM mcr\.microsoft\.com\/playwright:v[0-9.]+-noble@sha256:[a-f0-9]{64}$/u);
  assert.equal(user, "USER pwuser");
  assert.deepEqual(
    extra,
    [],
    "no filesystem layer, installer, project files or credentials enter the image",
  );
  assert.match(pipeline.image.name, /^\S+@sha256:[a-f0-9]{64}$/u);
  assert.notEqual(pipeline.image.name, base.slice("FROM ".length));
});

test("Linux native prerequisites use one locked rootless Pixi environment", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const native = pipeline[".verify-linux"];
  const toolchain = parseToml(
    await fs.readFile(path.join(root, ".config/mise/config.toml"), "utf8"),
  );
  const selected = parseToml(await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8"));
  assert.equal(toolchain.tools.pixi.version, selected.tools.pixi[0].version);
  assert.deepEqual(toolchain.tools.pixi.os, ["linux/arm64"]);
  assert.equal(native.variables.PIXI_CACHE_DIR, "$CI_PROJECT_DIR/build/runtime/tool-cache/pixi");
  assert(
    Array.isArray(native.script),
    "Linux must execute acceptance inside its selected environment",
  );
  const executor =
    "mise exec -- pixi run --locked --config-file .config/ci/linux/pixi-config.toml " +
    "--manifest-path .config/ci/linux/pixi.toml --executable ";
  for (const command of pipeline[".verify-native"].script.slice(-3))
    assert(native.script.includes(executor + command.slice("mise exec -- ".length)), command);
  for (const executable of ["xz", "aarch64-conda-linux-gnu-cc"])
    assert(native.script.includes(executor + executable + " --version"));
  const lock = parse(await fs.readFile(path.join(root, ".config/ci/linux/pixi.lock"), "utf8"));
  assert.deepEqual(
    lock.platforms.map((platform) => platform.name),
    ["linux-aarch64"],
  );
  for (const entry of lock.packages) {
    assert.match(entry.conda, /^https:\/\/conda\.anaconda\.org\/conda-forge\//);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
  }
});

test("native Windows verification runs the whole quality graph with separate trust roles", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const native = pipeline[".verify-windows"];
  assert.equal(pipeline[".verify-native"].stage, "verify");
  assert.equal(native.image, null);
  assert.equal(native.resource_group, "native-windows-verification");
  assert.equal(native.timeout, "60m");
  assert.equal(native.variables?.GIT_STRATEGY, undefined);
  assert.equal(native.variables?.GIT_CLEAN_FLAGS, undefined);
  assert.deepEqual(native.variables, {
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "core.longPaths",
    GIT_CONFIG_VALUE_0: "true",
  });
  assert.equal(
    execFileSync("git", ["config", "--get", "core.longPaths"], {
      cwd: root,
      env: { ...process.env, ...native.variables },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20_000,
    }).trim(),
    "true",
    "native source retrieval and cleanup inherit job-scoped Windows long-path support",
  );
  assert.equal(native.extends, ".verify-native");
  assert.deepEqual(native.before_script, [
    "git checkout-index --all --force",
    '$env:PATH = (Join-Path $env:ProgramFiles "mise/bin") + [IO.Path]::PathSeparator + $env:PATH',
  ]);
  const execution = pipeline[".verify-native"].script;
  assert(execution.includes("mise install"));
  const rebuild = execution.indexOf(
    "mise exec -- node --test tests/conformance/journeys/raster/rebuild.test.mjs",
  );
  const quality = execution.indexOf("mise exec -- npm run check");
  assert(rebuild >= 0 && quality > rebuild, "native compilation must precede full quality");
  for (const role of ["review", "protected"]) {
    const job = pipeline[`verify:windows:${role}`];
    assert.equal(job.extends, ".verify-windows");
    assert.equal(job.script, undefined);
    assert.equal(job.resource_group, undefined);
    assert.equal(job.variables?.GIT_STRATEGY, undefined);
    assert.deepEqual(job.tags, [`ci-windows-arm64-${role === "review" ? "review" : "shell"}`]);
  }
  assert.deepEqual(pipeline["verify:windows:review"].rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(pipeline["verify:windows:protected"].rules, [
    { if: '$CI_COMMIT_REF_PROTECTED == "true"' },
  ]);
});

test("native macOS verification shares one project resource without merging trust roles", async () => {
  const pipeline = parse(await fs.readFile(path.join(root, ".gitlab-ci.yml"), "utf8"));
  const native = pipeline[".verify-macos"];
  assert.equal(native.extends, ".verify-native");
  assert.equal(typeof native.resource_group, "string");
  assert(native.resource_group.trim());
  assert.equal(pipeline[".verify-linux"].resource_group, undefined);
  const review = pipeline["verify:macos:review"];
  const protectedJob = pipeline["verify:macos:protected"];
  for (const job of [review, protectedJob]) {
    assert.equal(job.extends, ".verify-macos");
    assert.equal(job.resource_group, undefined);
    assert.equal(job.script, undefined);
  }
  assert.deepEqual(review.tags, ["ci-macos-arm64-review"]);
  assert.deepEqual(protectedJob.tags, ["ci-macos-arm64-shell"]);
  assert.deepEqual(review.rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(protectedJob.rules, [{ if: '$CI_COMMIT_REF_PROTECTED == "true"' }]);
});
