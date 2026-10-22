import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { format, getFileInfo, resolveConfig } from "prettier";
import { parse as parseToml } from "smol-toml";
import { npmInvocation } from "./fixtures/npm-pack-report.mjs";
import { root } from "./fixtures/quality-contract.mjs";

test("explicit native formatter selection retains one owner and preserved input boundaries", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const config = path.join(root, ".config/checks/prettier/prettier.toml");
  assert.equal(manifest.prettier, undefined);
  assert.deepEqual(
    await resolveConfig(path.join(root, "README.md"), { config, editorconfig: false }),
    { ...parseToml(await fs.readFile(config, "utf8")) },
  );
  const ignorePath = [
    path.join(root, ".gitignore"),
    path.join(root, ".config/checks/prettier/prettierignore"),
  ];
  for (const [file, ignored] of [
    [".config/checks/prettier/prettier.toml", false],
    ["tests/quality-contract.test.mjs", false],
    ["packages/publisher/renderers/archify/supply/archify.html", true],
    ["editions/self/src/edition/static/authoring/metrics.json", true],
    [".config/mise/locks/mise.ci/npm-npm/12.2.0/aube-lock.yaml", true],
    [".config/mise/locks/mise.ci/npm-npm/12.2.0/package.json", true],
    [".config/ci/linux/pixi.lock", true],
    [".config/ci/linux/pixi.toml", false],
  ])
    assert.equal((await getFileInfo(path.join(root, file), { ignorePath })).ignored, ignored, file);
});

test("real formatter fix and check preserve parsed Markdown containers and retained bytes", async (t) => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-format-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  for (const file of [
    ".config/checks/prettier/prettier.toml",
    ".config/checks/prettier/prettierignore",
    ".config/checks/taplo/taplo.toml",
    ".gitignore",
  ]) {
    await fs.mkdir(path.dirname(path.join(scratch, file)), { recursive: true });
    await fs.copyFile(path.join(root, file), path.join(scratch, file));
  }
  await fs.symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "junction");
  await fs.writeFile(
    path.join(scratch, "package.json"),
    JSON.stringify({
      name: "formatter-contract-fixture",
      scripts: {
        format: workspace.scripts.format,
        "check:format": workspace.scripts["check:format"],
      },
    }) + "\n",
  );
  const policy = parseToml(
    await fs.readFile(path.join(root, ".config/checks/prettier/prettier.toml"), "utf8"),
  );
  const examples = new Map([
    ["README.md", "---\nowner: Documentation\n---\n\n\n# Scope\n\n\nRead the selected contract.\n"],
    [
      "packages/publisher/README.md",
      "# Scope\n\n- First item\n  with a wrapped paragraph.\n\n- Second item\n",
    ],
    [
      "docs/reference/guide.md",
      "# Scope\n\n> First paragraph.\n>\n> Second paragraph.\n\n> Separate quotation.\n",
    ],
    [
      "openspec/changes/current/tasks.md",
      "# Tasks\n\n- [ ] 1. First action\n  - [ ] 1.1 Its dependency\n- [x] 2. Completed action\n",
    ],
    [
      "openspec/changes/current/specs/owner/spec.md",
      "# Contract\n\n- First paragraph.\n\n  A separate paragraph.\n\n- Second item\n",
    ],
    [
      "editions/self/README.md",
      "# Scope\n\n```python\nclass First:\n    pass\n\n\nclass Second:\n    pass\n```\n",
    ],
  ]);
  const retained = new Map([
    ["openspec/changes/archive/retained/spec.md", "# Retained\n\n\nCaptured bytes.\n"],
    ["packages/publisher/renderers/archify/supply/README.md", "# Supplier\n\n\nCaptured bytes.\n"],
    ["tests/conformance/fixtures/source.md", "# Original\n\n\nCaptured bytes.\n"],
  ]);
  for (const [file, source] of [...examples, ...retained]) {
    await fs.mkdir(path.dirname(path.join(scratch, file)), { recursive: true });
    await fs.writeFile(path.join(scratch, file), source);
  }
  const options = {
    cwd: scratch,
    encoding: "utf8",
    timeout: 30_000,
    stdio: "pipe",
    env: {
      ...process.env,
      PATH: [path.join(root, "node_modules/.bin"), process.env.PATH].join(path.delimiter),
    },
  };
  const invoke = (mode) => {
    const selected = npmInvocation(["run", mode]);
    return spawnSync(selected.command, selected.args, options);
  };
  const before = new Map(
    await Promise.all(
      [...examples, ...retained].map(async ([file]) => [
        file,
        await fs.readFile(path.join(scratch, file), "utf8"),
      ]),
    ),
  );
  const rejected = invoke("check:format");
  assert.notEqual(rejected.status, 0);
  for (const [file, source] of before)
    assert.equal(await fs.readFile(path.join(scratch, file), "utf8"), source);
  const fixed = invoke("format");
  assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
  const canonical = new Map();
  for (const [file, source] of examples) {
    const actual = await fs.readFile(path.join(scratch, file), "utf8");
    assert.equal(actual, await format(source, { ...policy, filepath: file }), file);
    canonical.set(file, actual);
  }
  for (const [file, source] of retained)
    assert.equal(await fs.readFile(path.join(scratch, file), "utf8"), source);
  const checked = invoke("check:format");
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  const repeated = invoke("format");
  assert.equal(repeated.status, 0, repeated.stdout + repeated.stderr);
  for (const [file, source] of [...canonical, ...retained])
    assert.equal(await fs.readFile(path.join(scratch, file), "utf8"), source);
});

test("official OpenSpec apply instructions bind each task to its exact source checkbox", async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-task-source-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const change = path.join(work, "openspec/changes/task-source");
  await fs.mkdir(change, { recursive: true });
  await fs.writeFile(
    path.join(change, ".openspec.yaml"),
    "schema: spec-driven\ncreated: 2026-10-01\n",
  );
  const taskFile = path.join(change, "tasks.md");
  await fs.writeFile(
    taskFile,
    "# Tasks\n\n- [x] 1. Preserve accepted inputs.\n  - [ ] 1.1 Verify the selected receiver.\n- [ ] 2. Close source-owned adoption.\n",
  );
  const cli = path.join(root, "node_modules/@fission-ai/openspec/bin/openspec.js");
  const instruction = JSON.parse(
    execFileSync(
      process.execPath,
      [
        cli,
        "instructions",
        "apply",
        "--change",
        "task-source",
        "--schema",
        "spec-driven",
        "--json",
      ],
      {
        cwd: work,
        encoding: "utf8",
        timeout: 30_000,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          HOME: work,
          XDG_CONFIG_HOME: path.join(work, "config"),
          CI: "true",
          OPENSPEC_TELEMETRY: "0",
        },
      },
    ),
  );
  const lines = (await fs.readFile(taskFile, "utf8")).split("\n");
  const checkboxes = lines.flatMap((line, index) => {
    const match = /^\s*- \[([ xX])\] (.+)$/u.exec(line);
    return match ? [{ line: index + 1, done: match[1] !== " ", description: match[2] }] : [];
  });
  assert.equal(instruction.tasks.length, checkboxes.length);
  assert.equal(instruction.progress.total, checkboxes.length);
  for (const [index, task] of instruction.tasks.entries()) {
    assert.equal(typeof task.sourcePath, "string", "The official task source must be explicit");
    const source = path.isAbsolute(task.sourcePath)
      ? task.sourcePath
      : path.resolve(work, task.sourcePath);
    assert.equal(source, taskFile);
    assert.equal(task.line, checkboxes[index].line);
    assert.equal(task.done, checkboxes[index].done);
    assert.equal(task.description, checkboxes[index].description);
  }
});
