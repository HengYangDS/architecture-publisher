import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { serviceTopology } from "./fixtures/diagrams.mjs";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const publisher = path.join(root, "packages/publisher");
const sha = (b) => createHash("sha256").update(b).digest("hex");
test("installed render CLI works offline and rejects corrupted renderer supply", async (t) => {
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const out = await fs.mkdtemp(path.join(base, "packed render "));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root) => {
    const r = spawnNativeSync(cmd, args, { cwd, encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const pack = parseNpmPackRecord(
    run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", out], publisher),
  );
  const consumer = path.join(out, "consumer");
  await fs.mkdir(consumer);
  run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(out, pack.filename),
    ],
    consumer,
  );
  const home = path.join(out, "home");
  await fs.mkdir(home);
  const pkg = path.join(consumer, "node_modules/architecture-publisher"),
    cli = path.join(pkg, "src/cli/main.mjs");
  const input = path.join(out, "service.json"),
    output = path.join(out, "service.html");
  const content = Buffer.from(JSON.stringify(serviceTopology()));
  await fs.writeFile(input, content);
  const args = [
    "render",
    "interactive",
    "architecture",
    input,
    "--sha256",
    sha(content),
    "--output",
    output,
  ];
  const invoke = (a) =>
    spawnSync(process.execPath, [cli, ...a], {
      cwd: consumer,
      encoding: "utf8",
      env: { HOME: home, PATH: home },
    });
  const intrinsicScene = {
    schema: "architecture.interactive-scene/v1",
    id: "intrinsic",
    title: "Intrinsic",
    subtitle: "Complete exact meaning",
    nodes: [
      {
        id: "source",
        label: "Source",
        visualRole: "backend",
        figureKind: "service",
        icon: "lucide:server",
      },
      {
        id: "target",
        label: "Target",
        visualRole: "backend",
        figureKind: "service",
        icon: "lucide:server",
      },
    ],
    edges: [{ id: "route", from: "source", to: "target", label: "Selects", visualRole: "default" }],
    groups: [],
  };
  const invokeIntrinsic = (target) =>
    spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const { renderArchitectureScene } = await import(process.argv[1]);
        try {
          await renderArchitectureScene({scene: JSON.parse(process.argv[2]), output: process.argv[3]});
          console.log(JSON.stringify({status: 'rendered'}));
        } catch (error) {
          console.log(JSON.stringify({error: {code: error.code}}));
          process.exitCode = 1;
        }`,
        pathToFileURL(path.join(pkg, "renderers/archify/index.mjs")).href,
        JSON.stringify(intrinsicScene),
        target,
      ],
      { cwd: consumer, encoding: "utf8", env: { HOME: home, PATH: home }, timeout: 30000 },
    );
  const intrinsic = invokeIntrinsic(path.join(out, "intrinsic.html"));
  assert.equal(intrinsic.status, 0, intrinsic.stdout + intrinsic.stderr);
  assert.equal(JSON.parse(intrinsic.stdout).status, "rendered");
  const rendered = invoke(args);
  assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
  assert.equal(JSON.parse(rendered.stdout).status, "rendered");
  assert.equal(JSON.parse(rendered.stdout).artifact.sha256, sha(await fs.readFile(output)));
  for (const [name, type] of [
    ["service-topology", "architecture"],
    ["job-lifecycle", "lifecycle"],
  ]) {
    const source = path.join(root, "examples", name + ".json"),
      data = await fs.readFile(source),
      target = path.join(out, name + ".html");
    const example = invoke([
      "render",
      "interactive",
      type,
      source,
      "--sha256",
      sha(data),
      "--output",
      target,
    ]);
    assert.equal(example.status, 0, example.stdout + example.stderr);
    assert.equal(JSON.parse(example.stdout).nativeValidation.checksPassed, 9);
  }
  const bad = serviceTopology();
  bad.components[0].type = "unsupported";
  const badBytes = Buffer.from(JSON.stringify(bad));
  await fs.writeFile(input, badBytes);
  const rejected = invoke([
    "render",
    "interactive",
    "architecture",
    input,
    "--sha256",
    sha(badBytes),
    "--output",
    path.join(out, "bad.html"),
  ]);
  assert.equal(rejected.status, 1);
  assert(JSON.parse(rejected.stdout).error.diagnostics.length > 0);
  await fs.writeFile(input, content);
  const supplyMember = path.join(pkg, "renderers/archify/supply/renderers/shared/utils.mjs");
  const originalSupply = await fs.readFile(supplyMember);
  await fs.appendFile(supplyMember, "\n// modified\n");
  const tampered = invoke([...args.slice(0, -1), path.join(out, "tampered.html")]);
  assert.equal(tampered.status, 1);
  assert.equal(JSON.parse(tampered.stdout).error.code, "render_supply_invalid");
  const tamperedIntrinsic = invokeIntrinsic(path.join(out, "tampered-intrinsic.html"));
  assert.equal(tamperedIntrinsic.status, 1, tamperedIntrinsic.stdout + tamperedIntrinsic.stderr);
  assert.equal(JSON.parse(tamperedIntrinsic.stdout).error.code, "render_supply_invalid");
  await fs.writeFile(supplyMember, originalSupply);
  const removed = path.join(out, "removed-utils.mjs");
  await fs.rename(supplyMember, removed);
  try {
    const target = path.join(out, "missing-supply.html");
    const missing = invoke([...args.slice(0, -1), target]);
    assert.equal(missing.status, 1);
    assert.equal(JSON.parse(missing.stdout).error.code, "render_supply_invalid");
    await assert.rejects(fs.stat(target), { code: "ENOENT" });
    const intrinsicTarget = path.join(out, "missing-intrinsic.html");
    const intrinsic = invokeIntrinsic(intrinsicTarget);
    assert.equal(intrinsic.status, 1, intrinsic.stdout + intrinsic.stderr);
    assert.equal(JSON.parse(intrinsic.stdout).error.code, "render_supply_invalid");
    await assert.rejects(fs.stat(intrinsicTarget), { code: "ENOENT" });
  } finally {
    await fs.rename(removed, supplyMember);
  }
  for (const member of ["geometry.mjs", "desktop-readability.mjs"]) {
    const selected = path.join(pkg, "renderers/archify/supply/renderers/shared", member);
    const removed = path.join(out, "removed-" + member);
    await fs.rename(selected, removed);
    try {
      const target = path.join(out, "missing-" + member + ".html");
      const missing = invoke([...args.slice(0, -1), target]);
      assert.equal(missing.status, 1);
      assert.equal(JSON.parse(missing.stdout).error.code, "render_supply_invalid");
      await assert.rejects(fs.stat(target), { code: "ENOENT" });
    } finally {
      await fs.rename(removed, selected);
    }
  }
  const extra = path.join(pkg, "renderers/archify/supply/unselected.txt");
  await fs.writeFile(extra, "not selected");
  try {
    const target = path.join(out, "extra-supply.html");
    const unexpected = invoke([...args.slice(0, -1), target]);
    assert.equal(unexpected.status, 1);
    assert.equal(JSON.parse(unexpected.stdout).error.code, "render_supply_invalid");
    await assert.rejects(fs.stat(target), { code: "ENOENT" });
  } finally {
    await fs.unlink(extra);
  }
  const movedInput = path.join(out, "moved-service.json");
  await fs.rename(input, movedInput);
  try {
    const target = path.join(out, "missing-input.html");
    const missing = invoke([...args.slice(0, -1), target]);
    assert.equal(missing.status, 1);
    assert.equal(JSON.parse(missing.stdout).error.code, "render_input_type_invalid");
    await assert.rejects(fs.stat(target), { code: "ENOENT" });
  } finally {
    await fs.rename(movedInput, input);
  }
  assert.equal(invoke(["render"]).status, 2);
});
