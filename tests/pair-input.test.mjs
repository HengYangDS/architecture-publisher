import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import { planPairFiles } from "../packages/publisher/src/publication/file-plan.mjs";
import { installPairFiles } from "../packages/publisher/src/publication/files.mjs";
import { sha, publisher, fixture, planFiles, approve } from "./fixtures/pair-files.mjs";

test("file plans reject aliases of reserved metadata and prefix collisions", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options);
  for (const name of ["readme.md", "ReadMe.Md", "SHA256SUMS/child", "artifact/../escape"]) {
    const input = {
      options,
      source: plan.source,
      payload: [{ ...plan.payload[0], path: name }],
      entries: plan.entries,
      dependencies: [],
    };
    await assert.rejects(planPairFiles(input), /path|collision/i, name);
  }
});

test("file plan admission rejects malformed roots, identities and dependency claims", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    baseline = {
      options,
      source: plan.source,
      payload: [plan.payload[0]],
      entries: plan.entries,
      dependencies: [],
    };
  const outside = path.join(dir, "outside");
  await fs.writeFile(outside, "outside");
  const cases = [
    ["empty payload", (v) => (v.payload = []), /Explicit file installation inputs/],
    ["missing dependencies", (v) => (v.dependencies = null), /Explicit file installation inputs/],
    ["no source roots", (v) => (v.options.sourceRoots = []), /Explicit absolute source roots/],
    [
      "duplicate source root",
      (v) => v.options.sourceRoots.push(v.options.sourceRoots[0]),
      /Duplicate source roots/,
    ],
    ["legacy media root", (v) => (v.options.nativeRoot = dir), /legacy media roots/],
    ["relative recovery", (v) => (v.options.recoveryRoot = "recovery"), /absolute recoveryRoot/],
    ["missing recovery", (v) => delete v.options.recoveryRoot, /absolute recoveryRoot/],
    [
      "relative destination",
      (v) => (v.options.destinations.native = "native"),
      /absolute destination/,
    ],
    ["missing destination", (v) => delete v.options.destinations.atlas, /absolute destination/],
    [
      "overlapping destinations",
      (v) => (v.options.destinations.atlas = v.options.destinations.native),
      /non-overlapping/,
    ],
    [
      "overlapping source",
      (v) => (v.options.sourceRoots = [v.options.destinations.native]),
      /Source\/destination overlap/,
    ],
    [
      "different parent",
      (v) => (v.options.destinations.atlas = path.join(dir, "other", "atlas")),
      /share an explicit parent/,
    ],
    [
      "reserved control namespace",
      (v) => (v.options.destinations.native = path.join(dir, ".architecture-publication-test")),
      /reserved pair control namespace/,
    ],
    ["missing entry", (v) => delete v.entries.native["README.md"], /Explicit local entry files/],
    [
      "incomplete replacement",
      (v) => (v.replacement = { plan }),
      /Explicit prior plan and authorization/,
    ],
    ["unknown medium", (v) => (v.payload[0].medium = "other"), /Invalid payload identity/],
    ["relative source", (v) => (v.payload[0].source = "figure.svg"), /Invalid payload identity/],
    ["negative byte count", (v) => (v.payload[0].bytes = -1), /Invalid payload identity/],
    ["invalid digest", (v) => (v.payload[0].sha256 = "bad"), /Invalid payload identity/],
    ["outside selected roots", (v) => (v.payload[0].source = outside), /outside declared roots/],
    ["directory source", (v) => (v.payload[0].source = options.sourceRoots[0]), /not a file/],
    ["changed size", (v) => (v.payload[0].bytes += 1), /Payload size changed/],
    ["changed bytes", (v) => (v.payload[0].sha256 = sha("wrong")), /Payload bytes changed/],
    [
      "invalid dependency",
      (v) => v.dependencies.push({ file: "relative", sha256: sha("x") }),
      /Invalid dependency identity/,
    ],
    [
      "changed dependency",
      (v) => v.dependencies.push({ file: plan.payload[0].source, sha256: sha("wrong") }),
      /Dependency changed/,
    ],
    [
      "noncanonical dependency",
      (v) =>
        v.dependencies.push({
          file: options.sourceRoots[0] + "/../sources/figure.svg",
          sha256: plan.payload[0].sha256,
        }),
      /Dependency source path is not canonical/,
    ],
  ];
  for (const [name, mutate, error] of cases) {
    const input = structuredClone(baseline);
    mutate(input);
    await assert.rejects(planPairFiles(input), error, name);
  }
  const fileTarget = path.join(dir, "file-target");
  await fs.writeFile(fileTarget, "foreign content");
  const occupied = structuredClone(baseline);
  occupied.options.destinations.native = fileTarget;
  await assert.rejects(planPairFiles(occupied), /Destination is not a directory/);

  const unsupported = structuredClone(plan);
  unsupported.schema = "architecture.pair-files/v1";
  delete unsupported.sha256;
  unsupported.sha256 = sha(JSON.stringify(unsupported, null, 2) + "\n");
  await assert.rejects(
    installPairFiles(unsupported, { decision: "AUTHORIZED", planSha256: unsupported.sha256 }),
    /Unsupported file installation plan/,
  );
});

test("file source paths cannot disguise a source-root escape", async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    outside = path.join(dir, "outside");
  await fs.writeFile(outside, "outside");
  const input = {
    options,
    source: plan.source,
    payload: [
      {
        ...plan.payload[0],
        source: options.sourceRoots[0] + "/../outside",
        bytes: 7,
        sha256: sha("outside"),
      },
    ],
    entries: plan.entries,
    dependencies: [],
  };
  await assert.rejects(planPairFiles(input), /source.*path|outside|canonical/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: "ENOENT" });
});

test("file payload can come from explicit independent media and evidence roots", async (t) => {
  const { dir, options } = await fixture(t),
    prior = await planFiles(options),
    evidence = path.join(dir, "review-evidence");
  await fs.mkdir(evidence);
  const file = path.join(evidence, "report.json");
  await fs.writeFile(file, '{"scope":"file fixture"}');
  const bytes = await fs.readFile(file);
  const { sourceRoots, ...deployment } = options;
  const plan = await planPairFiles({
    options: { ...deployment, sourceRoots: [...sourceRoots, evidence] },
    source: prior.source,
    payload: [
      ...prior.payload,
      {
        medium: "atlas",
        path: "atlas/report.json",
        source: file,
        bytes: bytes.length,
        sha256: sha(bytes),
      },
    ],
    entries: prior.entries,
    dependencies: [],
  });
  assert.equal(plan.options.sourceRoots.length, 2);
  assert.equal((await installPairFiles(plan, approve(plan))).status, "INSTALLED");
  assert.deepEqual(
    await fs.readFile(path.join(options.destinations.atlas, "atlas/report.json")),
    bytes,
  );
});

test("installed file engine handles explicit roots with no developer executables", async (t) => {
  const { dir, options } = await fixture(t),
    pack = spawnNativeSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", dir],
      {
        cwd: publisher,
        encoding: "utf8",
      },
    );
  assert.equal(pack.status, 0, pack.stderr);
  const info = parseNpmPackRecord(pack.stdout),
    consumer = path.join(dir, "installed");
  await fs.mkdir(consumer);
  const installation = spawnNativeSync(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(dir, info.filename),
    ],
    { cwd: consumer, encoding: "utf8" },
  );
  assert.equal(installation.status, 0, installation.stderr);
  const plan = await planFiles(options),
    input = path.join(dir, "installed-input.json"),
    entry = path.join(dir, "installed.mjs"),
    home = path.join(dir, "empty-home");
  await fs.mkdir(home);
  await fs.writeFile(input, JSON.stringify({ plan, acceptance: approve(plan) }));
  const module = path.join(
    consumer,
    "node_modules/architecture-publisher/src/publication/files.mjs",
  );
  await fs.writeFile(
    entry,
    `import fs from 'node:fs/promises';import {installPairFiles,recoverPairFiles} from ${JSON.stringify(new URL("file://" + module).href)};const {plan,acceptance}=JSON.parse(await fs.readFile(process.argv[2]));const result=await installPairFiles(plan,acceptance);const repeated=await installPairFiles(plan,acceptance);const recovered=await recoverPairFiles(plan,acceptance);console.log(JSON.stringify({result,repeated,recovered}));`,
  );
  const executed = spawnSync(process.execPath, [entry, input], {
    cwd: consumer,
    env: { HOME: home, PATH: home, LANG: "C.UTF-8" },
    encoding: "utf8",
  });
  assert.equal(executed.status, 0, executed.stderr);
  const report = JSON.parse(executed.stdout);
  assert.equal(report.result.status, "INSTALLED");
  assert.equal(report.result.scope, "file-installation-only");
  assert.equal(report.repeated.status, "ALREADY_INSTALLED");
  assert.equal(report.recovered.status, "ALREADY_INSTALLED");
  for (const target of Object.values(options.destinations))
    assert.equal(
      await fs.readFile(path.join(target, "owner-note.txt"), "utf8"),
      "keep this exact byte",
    );
});
