import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import { verifyInstalledSelfReader } from "./fixtures/self-reader.mjs";
import { root, packageRoot, sha256, encode, selectedSources } from "./fixtures/self-edition.mjs";

test("the installed self Edition compiles both media after its author package is removed", async (t) => {
  const parent = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "publisher-self-installed-"),
  );
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const packedCore = spawnNativeSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", parent],
      { cwd: path.join(root, "packages/publisher"), encoding: "utf8" },
    ),
    packedSelf = spawnNativeSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", parent],
      { cwd: packageRoot, encoding: "utf8" },
    );
  assert.equal(packedCore.status, 0, packedCore.stderr);
  assert.equal(packedSelf.status, 0, packedSelf.stderr);
  const core = parseNpmPackRecord(packedCore.stdout),
    self = parseNpmPackRecord(packedSelf.stdout),
    consumer = path.join(parent, "consumer");
  await fs.mkdir(consumer);
  const installed = spawnNativeSync(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(parent, core.filename),
      path.join(parent, self.filename),
    ],
    { cwd: consumer, encoding: "utf8" },
  );
  assert.equal(installed.status, 0, installed.stderr);

  const copied = path.join(parent, "inputs");
  await fs.mkdir(copied);
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const bytes = await fs.readFile(path.join(root, relative));
    const file = path.join(copied, id + ".source");
    await fs.writeFile(file, bytes);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  const preparedRoot = path.join(parent, "prepared"),
    requestFile = path.join(parent, "request.json"),
    requestValue = {
      schema: "architecture.publisher-self-input/v1",
      source: { id: "architecture-publisher", revision: "installed-revision" },
      sources,
      output: preparedRoot,
    };
  await fs.writeFile(requestFile, encode(requestValue));
  const driver = path.join(consumer, "prepare.mjs");
  await fs.writeFile(
    driver,
    [
      "import { prepareArchitecturePublisherEditionInput } from '@architecture-publisher/self-edition';",
      "const result = await prepareArchitecturePublisherEditionInput(process.argv[2]);",
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      "",
    ].join("\n"),
  );
  const preparedRun = spawnSync(process.execPath, [driver, requestFile], {
    cwd: consumer,
    encoding: "utf8",
    env: { HOME: parent, PATH: parent, LANG: "C.UTF-8" },
    timeout: 120000,
  });
  assert.equal(preparedRun.status, 0, preparedRun.stdout + preparedRun.stderr);
  const prepared = JSON.parse(preparedRun.stdout);
  assert.equal(prepared.buildRequest, path.join(preparedRoot, "build-input/build-request.json"));
  assert.match(prepared.buildRequestSha256, /^[a-f0-9]{64}$/u);
  assert.equal(sha256(await fs.readFile(prepared.buildRequest)), prepared.buildRequestSha256);
  const relocated = path.join(parent, "relocated-inputs");
  await fs.rename(path.join(preparedRoot, "build-input"), relocated);
  await fs.rename(
    path.join(consumer, "node_modules/@architecture-publisher/self-edition"),
    path.join(parent, "removed-self-edition"),
  );
  const compileDriver = path.join(consumer, "compile-successor.mjs");
  await fs.writeFile(
    compileDriver,
    [
      "import { compileEditionCandidateInput } from 'architecture-publisher/compiler';",
      "const result = await compileEditionCandidateInput(process.argv[2], process.argv[3], process.argv[4]);",
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      "",
    ].join("\n"),
  );
  const candidateRoot = path.join(parent, "candidate");
  const built = spawnSync(
    process.execPath,
    [
      compileDriver,
      path.join(relocated, "build-request.json"),
      prepared.buildRequestSha256,
      candidateRoot,
    ],
    {
      cwd: consumer,
      encoding: "utf8",
      env: { HOME: parent, PATH: parent, LANG: "C.UTF-8" },
      timeout: 120000,
    },
  );
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.deepEqual(JSON.parse(built.stdout).media.sort(), ["interactive", "static"]);
  const png = await fs.readFile(path.join(candidateRoot, "static/architecture.png"));
  assert.equal(png.readUInt32BE(16), 6000);
  const html = await fs.readFile(path.join(candidateRoot, "interactive/architecture.html"));
  assert.match(html.toString("utf8"), /architecture\.interactive-html\/v1/u);
  const sourceModel = await fs.readFile(path.join(relocated, "source/model.json"));
  assert.equal(html.includes(sourceModel), false);
  const localCandidate = path.join(parent, "local-candidate");
  const { compileEditionCandidateInput } =
    await import("../packages/publisher/src/compiler/index.mjs");
  await compileEditionCandidateInput(
    path.join(relocated, "build-request.json"),
    prepared.buildRequestSha256,
    localCandidate,
  );
  for (const relative of [
    "candidate.json",
    "static/architecture.svg",
    "static/architecture.png",
    "interactive/architecture.html",
  ])
    assert.equal(
      sha256(await fs.readFile(path.join(candidateRoot, relative))),
      sha256(await fs.readFile(path.join(localCandidate, relative))),
      relative,
    );
  await t.test(
    "the installed interactive artifact reads all eight pages without external requests",
    {
      skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
      timeout: 45_000,
    },
    (browserTest) => verifyInstalledSelfReader(browserTest, html),
  );
});
