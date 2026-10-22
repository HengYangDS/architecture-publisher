import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { editionDigest } from "../../packages/publisher/src/edition/contract.mjs";
import {
  editionProviderPackageDigest,
  materializeExecutableProvider,
} from "../../packages/publisher/src/provider/index.mjs";
import { claimModelDigest } from "../../packages/publisher/src/semantics/document.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const fixtureRoot = new URL("./providers/executable/", import.meta.url);

const evidence = new URL("../../build/test-work/", import.meta.url);

export async function copyFixture(t) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL("provider-executable-", evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(fixtureRoot, root, { recursive: true });
  return root;
}

export async function writeManifest(root, options = {}) {
  const packageRoot = path.join(root, "package");
  const packageFile = path.join(packageRoot, "package.json");
  const inputFile = path.join(root, "inputs/source.json");
  const packageJson = JSON.parse(await fs.readFile(packageFile, "utf8"));
  const input = JSON.parse(await fs.readFile(inputFile, "utf8"));
  if (options.scenario || options.markerPath || options.replyDelayMs) {
    if (options.scenario) input.scenario = options.scenario;
    if (options.markerPath) input.markerPath = options.markerPath;
    if (options.replyDelayMs) input.replyDelayMs = options.replyDelayMs;
    await fs.writeFile(inputFile, JSON.stringify(input, null, 2) + "\n");
  }
  const inputBytes = await fs.readFile(inputFile);
  const semantic = JSON.parse(
    Buffer.from(
      input.reply.source.members.find(({ path: member }) => member === input.reply.semanticMember)
        .contentBase64,
      "base64",
    ).toString("utf8"),
  );
  const editionBytes = Buffer.from(input.reply.edition.contentBase64, "base64");
  const edition = JSON.parse(editionBytes.toString("utf8"));
  const sourceManifestBytes = Buffer.from(
    JSON.stringify(
      {
        schema: "architecture.source-bundle/v1",
        source: { id: input.reply.source.id, revision: input.reply.source.revision },
        files: input.reply.source.members.map(({ path: member, contentBase64 }) => {
          const bytes = Buffer.from(contentBase64, "base64");
          return { path: member, bytes: bytes.length, sha256: sha(bytes) };
        }),
      },
      null,
      2,
    ) + "\n",
  );
  const manifest = {
    schema: "architecture.edition-provider/v1",
    provider: { id: "fixture-executable-provider", revision: "1.0.0" },
    subject: { id: input.reply.source.id, revision: input.reply.source.revision },
    contracts: {
      sourceBundle: "architecture.source-bundle/v1",
      claimModel: "architecture.claim-model/v2",
      edition: "architecture.edition/v2",
      evolution: null,
    },
    delivery: {
      kind: "executable",
      package: {
        name: packageJson.name,
        version: packageJson.version,
        packageJsonSha256: sha(await fs.readFile(packageFile)),
        contentSha256: await editionProviderPackageDigest(packageRoot),
        entrypoint: "./provider",
      },
      inputs: [
        {
          id: "source",
          path: "inputs/source.json",
          mediaType: "application/json",
          bytes: inputBytes.length,
          sha256: sha(inputBytes),
        },
      ],
    },
    expected: {
      sourceManifestSha256: sha(sourceManifestBytes),
      claimModelDigest: claimModelDigest(semantic),
      editionDigest: editionDigest(semantic, edition),
      evolutionSha256: null,
    },
    limits: {
      inputs: 16,
      inputBytes: 1024 * 1024,
      replyBytes: options.replyBytes ?? 2 * 1024 * 1024,
      timeoutMs: options.timeoutMs ?? 2_000,
    },
  };
  const providerManifest = path.join(root, "provider.json");
  await fs.writeFile(providerManifest, JSON.stringify(manifest, null, 2) + "\n");
  return {
    providerManifest,
    providerManifestSha256: sha(await fs.readFile(providerManifest)),
    providerPackageRoot: packageRoot,
  };
}

export async function scratchNames() {
  const root = await fs.realpath(os.tmpdir());
  return new Set(
    (await fs.readdir(root)).filter((name) =>
      name.startsWith(`architecture-provider-${process.pid}-`),
    ),
  );
}

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function waitForExit(pid) {
  const deadline = Date.now() + 1_500;
  while (Date.now() < deadline) {
    if (!processAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !processAlive(pid);
}

async function readOptionalPid(markerPath) {
  try {
    return Number(await fs.readFile(markerPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function runDescendantCase(
  t,
  scenario,
  expectedError = null,
  { replyBytes, expectReclaimed = true } = {},
) {
  const root = await copyFixture(t);
  const markerPath = path.join(root, "descendant.pid");
  const sentinel = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
    windowsHide: true,
  });
  let descendantPid;
  try {
    const selection = await writeManifest(root, {
      scenario,
      markerPath,
      timeoutMs: 1_000,
      replyBytes,
    });
    if (expectedError) {
      await assert.rejects(materializeExecutableProvider(selection), {
        code: expectedError,
      });
    } else {
      await materializeExecutableProvider(selection);
    }
    descendantPid = Number(await fs.readFile(markerPath, "utf8"));
    assert.equal(Number.isSafeInteger(descendantPid), true);
    assert.equal(processAlive(sentinel.pid), true, "unrelated sentinel was killed");
    if (expectReclaimed)
      assert.equal(await waitForExit(descendantPid), true, "owned descendant remains alive");
  } finally {
    try {
      if (!descendantPid) descendantPid = await readOptionalPid(markerPath);
    } finally {
      if (descendantPid && processAlive(descendantPid)) process.kill(descendantPid, "SIGKILL");
      if (processAlive(sentinel.pid)) sentinel.kill("SIGKILL");
    }
  }
}
