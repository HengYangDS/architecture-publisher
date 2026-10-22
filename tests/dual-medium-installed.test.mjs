import assert from "node:assert/strict";
import { interactivePage } from "./fixtures/interactive-member.mjs";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import {
  selectedFixtureRequirements,
  selectedNativeEdition,
  sha,
} from "./fixtures/selected-native-edition.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";

const publisher = fileURLToPath(new URL("../packages/publisher/", import.meta.url));
const privateCanary = "PRIVATE_UNSELECTED_SOURCE_ONLY_7f4bdc";

function child(command, args, cwd, env, timeoutMs = 60_000) {
  const result = spawnNativeSync(command, args, {
    cwd,
    env,
    input: "",
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

async function mixedClaimInput(root) {
  await fs.mkdir(path.join(root, "edition"), { recursive: true });
  await fs.mkdir(path.join(root, "sources"));
  const namespace = "fixture/claims";
  const model = claimModel();
  model.entities.other.label = privateCanary;
  model.claims.published.value = { text: privateCanary };
  const modelBytes = Buffer.from(JSON.stringify(model) + "\n");
  await fs.writeFile(path.join(root, "sources/model.json"), modelBytes);
  const project = {
    schema: "architecture.edition-project/v1",
    id: "mixed-claims",
    editor: "fixture-editor",
    title: "Selected relation and claim",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "condition", audience: "maintainer", text: "When may the client call?" }],
    scope: {
      sourceNamespaces: [namespace],
      selections: [
        {
          id: "relation",
          namespace,
          kind: "reference",
          reference: "relation:request",
          questions: ["condition"],
        },
        {
          id: "claim",
          namespace,
          kind: "reference",
          reference: "claim:intended",
          questions: ["condition"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "Show topology and attributed claim status separately." },
    presentation: {
      static: {
        views: [
          {
            id: "overview",
            questions: ["condition"],
            groups: [
              { id: "client", label: "Client", elements: [{ namespace, id: "client" }] },
              { id: "server", label: "Server", elements: [{ namespace, id: "server" }] },
            ],
          },
        ],
        intent: "Place source structure and claim evidence without overlap.",
      },
      interactive: {
        views: [{ id: "overview", questions: ["condition"] }],
        intent: "Explore both meanings.",
      },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "model",
        namespace,
        format: { id: "architecture.claim-model", version: "2" },
        claimant: "fixture-maintainer",
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "pin", path: "sources/model.json", sha256: sha(modelBytes) },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  await fs.writeFile(path.join(root, "build-request.json"), requestBytes);
  return sha(requestBytes);
}

test("a packed offline consumer builds both media after relocation without source repositories", async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-pair-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, "home");
  const consumer = path.join(work, "consumer");
  const userConfig = path.join(work, "user.npmrc");
  const globalConfig = path.join(work, "global.npmrc");
  await fs.mkdir(home);
  await fs.mkdir(consumer);
  await fs.writeFile(userConfig, "");
  await fs.writeFile(globalConfig, "");
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: path.join(work, "cache"),
    npm_config_offline: "true",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
  };
  const archiveName = parseNpmPackRecord(
    child(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", work],
      publisher,
      npmEnvironment,
    ),
  ).filename;
  child(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(work, archiveName),
    ],
    consumer,
    npmEnvironment,
  );
  await fs.cp(fixture.root, path.join(consumer, "inputs"), { recursive: true });
  await fs.rm(fixture.root, { recursive: true, force: true });
  const nodeEnvironment = {
    HOME: home,
    PATH: "",
    NODE_PATH: "",
    NODE_OPTIONS: "",
    LANG: "C.UTF-8",
    ...(process.platform === "win32" && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const run = (
    root,
    inputDirectory = "inputs",
    outputDirectory = "candidate",
    digest = fixture.digest,
  ) => {
    const input = path.join(root, inputDirectory, "build-request.json");
    const output = path.join(root, outputDirectory);
    const cli = path.join(root, "node_modules/architecture-publisher/src/cli/main.mjs");
    return JSON.parse(
      child(
        process.execPath,
        [cli, "edition", "build", input, "--sha256", digest, "--output", output],
        root,
        nodeEnvironment,
      ),
    );
  };
  const first = run(consumer);
  assert.equal(first.status, "built");
  const candidateBytes = await fs.readFile(path.join(consumer, "candidate/candidate.json"));
  assert.equal(JSON.parse(candidateBytes).schema, "architecture.edition-candidate/v2");
  const mixedDigest = await mixedClaimInput(path.join(consumer, "mixed-inputs"));
  const mixedFirst = run(consumer, "mixed-inputs", "mixed-candidate", mixedDigest);
  assert.deepEqual(mixedFirst.media, ["interactive", "static"]);
  const mixedBytes = await fs.readFile(path.join(consumer, "mixed-candidate/candidate.json"));
  const mixedSvg = await fs.readFile(
    path.join(consumer, "mixed-candidate/static/architecture.svg"),
    "utf8",
  );
  const mixedHtml = await fs.readFile(
    path.join(consumer, "mixed-candidate/interactive/architecture.html"),
    "utf8",
  );
  assert(mixedSvg.includes("SOURCE CLAIMS"));
  assert(mixedSvg.includes("When may the client call?"));
  assert.deepEqual(
    [...mixedSvg.matchAll(/data-graphic-id="([^"]+)"/gu)].map((match) => match[1]).sort(),
    ["static-view-0-c-0", "static-view-0-n-0", "static-view-0-n-1", "static-view-0-r-0"],
  );
  const mixedPage = interactivePage(mixedHtml);
  assert.match(mixedPage, /<svg\b[^>]*data-diagram-type="architecture"/u);
  assert.match(mixedPage, /data-note-card-id="claim-card-0"/u);
  assert.match(mixedPage, /data-note-id="c-0"/u);
  for (const published of [mixedBytes.toString("utf8"), mixedSvg, mixedHtml])
    assert(!published.includes(privateCanary));
  const relocated = path.join(work, "relocated");
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  await fs.rm(path.join(relocated, "candidate"), { recursive: true, force: true });
  await fs.rm(path.join(relocated, "mixed-candidate"), { recursive: true, force: true });
  const second = run(relocated);
  assert.equal(second.candidateSha256, first.candidateSha256);
  assert.deepEqual(
    await fs.readFile(path.join(relocated, "candidate/candidate.json")),
    candidateBytes,
  );
  const mixedSecond = run(relocated, "mixed-inputs", "mixed-candidate", mixedDigest);
  assert.equal(mixedSecond.candidateSha256, mixedFirst.candidateSha256);
  assert.deepEqual(
    await fs.readFile(path.join(relocated, "mixed-candidate/candidate.json")),
    mixedBytes,
  );
  const verifier = path.join(relocated, "verify.mjs");
  await fs.writeFile(
    verifier,
    `import { verifySelectedCandidateReplay } from 'architecture-publisher/qualification';
const result = await verifySelectedCandidateReplay({
  requestPath: process.argv[2], requestSha256: process.argv[3],
  candidateManifestPath: process.argv[4], candidateManifestSha256: process.argv[5],
});
console.log(JSON.stringify(result));
`,
  );
  const replay = (inputDirectory, digest, built) =>
    JSON.parse(
      child(
        process.execPath,
        [
          verifier,
          path.join(relocated, inputDirectory, "build-request.json"),
          digest,
          built.manifestPath,
          built.manifestSha256,
        ],
        relocated,
        nodeEnvironment,
      ),
    );
  const originalReplay = replay("inputs", fixture.digest, second);
  assert.equal(originalReplay.verdict, "match");
  assert.equal(originalReplay.candidateSha256, second.candidateSha256);
  assert.equal(originalReplay.qualification, "not-performed");
  const mixedReplay = replay("mixed-inputs", mixedDigest, mixedSecond);
  assert.equal(mixedReplay.verdict, "match");
  assert.equal(mixedReplay.candidateSha256, mixedSecond.candidateSha256);
  assert.equal(mixedReplay.qualification, "not-performed");

  const candidate = JSON.parse(candidateBytes);
  const policy = {
    schema: "architecture.qualification-policy/v1",
    id: "installed-reader-policy",
    accepter: "fixture-editor",
    candidateSha256: second.candidateSha256,
    acceptedCandidateLimits: candidate.limits,
    requirements: selectedFixtureRequirements(candidate, "installed-checker"),
  };
  const policyFile = path.join(relocated, "qualification-policy.json");
  const policyBytes = Buffer.from(JSON.stringify(policy) + "\n");
  await fs.writeFile(policyFile, policyBytes);
  const setBytes = Buffer.from(
    JSON.stringify({
      schema: "architecture.qualification-set/v2",
      candidateSha256: second.candidateSha256,
      inputLockSha256: candidate.input.lockSha256,
      records: [],
    }) + "\n",
  );
  await fs.writeFile(path.join(relocated, "qualification-set.json"), setBytes);
  const inputBytes = Buffer.from(
    JSON.stringify({
      schema: "architecture.qualification-input/v2",
      request: { path: "inputs/build-request.json", sha256: fixture.digest },
      candidate: { path: "candidate/manifest.json", sha256: second.manifestSha256 },
      qualification: { path: "qualification-set.json", sha256: sha(setBytes) },
    }) + "\n",
  );
  const inputFile = path.join(relocated, "qualification-input.json");
  await fs.writeFile(inputFile, inputBytes);
  const installedCli = path.join(relocated, "node_modules/architecture-publisher/src/cli/main.mjs");
  const assessed = JSON.parse(
    child(
      process.execPath,
      [
        installedCli,
        "qualify",
        "verify",
        inputFile,
        "--sha256",
        sha(inputBytes),
        "--policy",
        policyFile,
        "--policy-sha256",
        sha(policyBytes),
      ],
      relocated,
      nodeEnvironment,
    ),
  );
  assert.equal(assessed.policySha256, sha(policyBytes));
  assert.equal(assessed.completeness, "submitted-policy-incomplete");
  assert.equal(assessed.admitted, false);
});
