import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";

const root = path.resolve(import.meta.dirname, "..");
const publisher = path.join(root, "packages/publisher");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("installed file publication preserves explicit non-ETHOS pairs without project modules", async (t) => {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "file publication ")),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const run = (command, args, cwd, env = process.env) =>
    spawnNativeSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 16 * 1024 * 1024,
    });
  const packed = run(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
    publisher,
  );
  assert.equal(packed.status, 0, packed.stderr);
  const info = parseNpmPackRecord(packed.stdout);
  const consumer = path.join(temporary, "consumer"),
    home = path.join(temporary, "home");
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  const installed = run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(temporary, info.filename),
    ],
    consumer,
  );
  assert.equal(installed.status, 0, installed.stderr);
  const pkg = path.join(consumer, "node_modules/architecture-publisher");
  const invoke = (args, expected = 0) => {
    const result = run(process.execPath, [path.join(pkg, "src/cli/main.mjs"), ...args], home, {
      HOME: home,
      PATH: home,
      LANG: "C.UTF-8",
    });
    assert.equal(result.status, expected, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const source = path.join(temporary, "input"),
    parent = path.join(temporary, "delivery");
  await fs.mkdir(source);
  await fs.mkdir(parent);
  for (const medium of ["native", "atlas"]) {
    await fs.mkdir(path.join(parent, medium));
    await fs.writeFile(path.join(parent, medium, "keep.txt"), "Foreign content\n");
  }
  const bytes = Buffer.from("An independent project artifact.\n");
  await fs.writeFile(path.join(source, "artifact.txt"), bytes);
  const input = {
    options: {
      sourceRoots: ["."],
      destinations: {
        native: "../delivery/native",
        atlas: "../delivery/atlas",
      },
      recoveryRoot: "../recovery",
    },
    source: { id: "example:independent-project", revision: "r1" },
    payload: ["native", "atlas"].map((medium) => ({
      medium,
      path: "content/artifact.txt",
      source: "artifact.txt",
      bytes: bytes.length,
      sha256: sha(bytes),
    })),
    entries: Object.fromEntries(
      ["native", "atlas"].map((m) => [
        m,
        {
          "index.html": "<p>Independent files</p>",
          "README.md": "File installation, not semantic acceptance.\n",
        },
      ]),
    ),
    dependencies: [],
  };
  const inputFile = path.join(source, "input.json");
  await fs.writeFile(inputFile, JSON.stringify(input));
  const result = invoke(["publish", "plan", inputFile]);
  assert.equal(result.scope, "file-integrity");
  assert.equal(result.semanticAcceptance, "not-performed");
  assert.equal(result.plan.options.destinations.native, path.join(parent, "native"));
  assert.equal(result.plan.payload[0].source, path.join(source, "artifact.txt"));
  await assert.rejects(fs.stat(path.join(parent, "native/content")), {
    code: "ENOENT",
  });
  const plan = path.join(temporary, "plan.json"),
    authorization = path.join(temporary, "authorization.json");
  await fs.writeFile(plan, JSON.stringify(result.plan));
  await fs.writeFile(
    authorization,
    JSON.stringify({ decision: "AUTHORIZED", planSha256: "0".repeat(64) }),
  );
  invoke(["publish", "apply", plan, authorization], 1);
  await fs.writeFile(
    authorization,
    JSON.stringify({ decision: "AUTHORIZED", planSha256: result.plan.sha256 }),
  );
  await fs.writeFile(path.join(source, "artifact.txt"), "Changed");
  invoke(["publish", "apply", plan, authorization], 1);
  for (const medium of ["native", "atlas"])
    assert.deepEqual(await fs.readdir(path.join(parent, medium)), ["keep.txt"]);
  await fs.writeFile(path.join(source, "artifact.txt"), bytes);
  const applied = invoke(["publish", "apply", plan, authorization]);
  assert.equal(applied.status, "INSTALLED");
  assert.equal(applied.semanticAcceptance, "not-performed");
  const recovered = invoke(["publish", "recover", plan, authorization]);
  assert.equal(recovered.status, "ALREADY_INSTALLED");
  for (const medium of ["native", "atlas"]) {
    assert.deepEqual(await fs.readFile(path.join(parent, medium, "content/artifact.txt")), bytes);
    assert.equal(
      await fs.readFile(path.join(parent, medium, "keep.txt"), "utf8"),
      "Foreign content\n",
    );
  }
  const nextBytes = Buffer.from("A second independent edition.\n");
  await fs.writeFile(path.join(source, "second.txt"), nextBytes);
  const updated = structuredClone(input);
  updated.source.revision = "r2";
  updated.payload = updated.payload.map((p) => ({
    ...p,
    source: "second.txt",
    bytes: nextBytes.length,
    sha256: sha(nextBytes),
  }));
  updated.replacement = {
    plan: result.plan,
    authorization: { decision: "AUTHORIZED", planSha256: result.plan.sha256 },
  };
  await fs.writeFile(inputFile, JSON.stringify(updated));
  const next = invoke(["publish", "plan", inputFile]);
  await fs.writeFile(plan, JSON.stringify(next.plan));
  await fs.writeFile(
    authorization,
    JSON.stringify({ decision: "AUTHORIZED", planSha256: next.plan.sha256 }),
  );
  assert.equal(invoke(["publish", "apply", plan, authorization]).status, "INSTALLED");
  assert.equal(invoke(["publish", "recover", plan, authorization]).status, "ALREADY_INSTALLED");
  for (const medium of ["native", "atlas"]) {
    assert.deepEqual(
      await fs.readFile(path.join(parent, medium, "content/artifact.txt")),
      nextBytes,
    );
    assert.equal(
      await fs.readFile(path.join(parent, medium, "keep.txt"), "utf8"),
      "Foreign content\n",
    );
  }
  await fs.writeFile(inputFile, JSON.stringify({ ...input, grantApproval: true }));
  invoke(["publish", "plan", inputFile], 1);
  const link = path.join(temporary, "linked-input.json");
  await fs.symlink(inputFile, link);
  invoke(["publish", "plan", link], 1);
  await fs.writeFile(inputFile, " ".repeat(4 * 1024 * 1024 + 1));
  invoke(["publish", "plan", inputFile], 1);
  invoke(["publish", "delete", plan], 2);
  assert(info.files.every((f) => !/(^|\/)(?:ethos|aigw)(\/|$)/i.test(f.path)));
});
