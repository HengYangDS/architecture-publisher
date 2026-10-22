import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { planPairFiles } from "../packages/publisher/src/publication/file-plan.mjs";
import {
  installPairFiles,
  recoverPairFiles,
} from "../packages/publisher/src/publication/files.mjs";
import { inventory } from "../packages/publisher/src/publication/file-storage.mjs";
import { sha, fixture, planFiles, approve } from "./fixtures/pair-files.mjs";

test("replay rejects coordinated entry, manifest and checksum drift", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  await installPairFiles(p, approve(p));
  const target = options.destinations.native,
    mp = path.join(target, "delivery-manifest.json"),
    m = JSON.parse(await fs.readFile(mp));
  await fs.writeFile(path.join(target, "index.html"), "foreign redirect");
  const entry = m.files.find((f) => f.path === "index.html");
  entry.sha256 = sha("foreign redirect");
  entry.bytes = 16;
  const bytes = JSON.stringify(m, null, 2) + "\n";
  await fs.writeFile(mp, bytes);
  await fs.writeFile(
    path.join(target, "SHA256SUMS"),
    m.files
      .concat({ path: "delivery-manifest.json", sha256: sha(bytes) })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join("\n") + "\n",
  );
  await assert.rejects(
    installPairFiles(p, approve(p)),
    /installed.*(?:entry|manifest)|approved.*content/i,
  );
});

test("replay rejects a duplicate-key manifest even if its checksum is updated", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    authorization = approve(plan);
  await installPairFiles(plan, authorization);
  const target = options.destinations.native;
  const manifestFile = path.join(target, "delivery-manifest.json");
  const manifest = await fs.readFile(manifestFile, "utf8");
  const altered = manifest.replace(
    '"planSha256":',
    `"planSha256": "${"0".repeat(64)}",\n  "planSha256":`,
  );
  assert.notEqual(altered, manifest);
  await fs.writeFile(manifestFile, altered);
  const checksumFile = path.join(target, "SHA256SUMS");
  const checksums = await fs.readFile(checksumFile, "utf8");
  await fs.writeFile(
    checksumFile,
    checksums.replace(
      /^[a-f0-9]{64} {2}delivery-manifest\.json$/m,
      `${sha(altered)}  delivery-manifest.json`,
    ),
  );
  const nativeBefore = await inventory(target);
  const atlasBefore = await inventory(options.destinations.atlas);
  await assert.rejects(
    installPairFiles(plan, authorization),
    /Installed manifest differs from approved content/,
  );
  assert.deepEqual(await inventory(target), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
});

test("replay compares emitted manifest bytes, not lossy UTF-8 decoding", async (t) => {
  const { options } = await fixture(t);
  const baseline = await planFiles(options);
  const plan = await planPairFiles({
    options,
    source: { id: "replacement-\ufffd" },
    payload: baseline.payload,
    entries: baseline.entries,
    dependencies: baseline.dependencies,
  });
  const authorization = approve(plan);
  await installPairFiles(plan, authorization);
  const target = options.destinations.native;
  const manifestFile = path.join(target, "delivery-manifest.json");
  const original = await fs.readFile(manifestFile);
  const marker = Buffer.from("\ufffd");
  const index = original.indexOf(marker);
  assert(index >= 0);
  const altered = Buffer.concat([
    original.subarray(0, index),
    Buffer.from([0xff]),
    original.subarray(index + marker.length),
  ]);
  assert.equal(altered.toString("utf8"), original.toString("utf8"));
  await fs.writeFile(manifestFile, altered);
  const checksumFile = path.join(target, "SHA256SUMS");
  const checksums = await fs.readFile(checksumFile, "utf8");
  await fs.writeFile(
    checksumFile,
    checksums.replace(
      /^[a-f0-9]{64} {2}delivery-manifest\.json$/m,
      `${sha(altered)}  delivery-manifest.json`,
    ),
  );
  await assert.rejects(
    installPairFiles(plan, authorization),
    /Installed manifest differs from approved content/,
  );
});

test("a replay must refer to the actually recorded operation, not a newly invented plan hash", async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  await installPairFiles(p, approve(p));
  const original = p.sha256;
  p.policy.arbitrary = "changed";
  const body = { ...p };
  delete body.sha256;
  p.sha256 = sha(JSON.stringify(body, null, 2) + "\n");
  for (const target of Object.values(options.destinations)) {
    const file = path.join(target, "delivery-manifest.json");
    const m = JSON.parse(await fs.readFile(file));
    m.planSha256 = p.sha256;
    m.authorization = approve(p);
    const bytes = JSON.stringify(m, null, 2) + "\n";
    await fs.writeFile(file, bytes);
    await fs.writeFile(
      path.join(target, "SHA256SUMS"),
      m.files
        .concat({ path: "delivery-manifest.json", sha256: sha(bytes) })
        .map((f) => `${f.sha256}  ${f.path}`)
        .join("\n") + "\n",
    );
  }
  await assert.rejects(installPairFiles(p, approve(p)), /recorded|operation|canonical|ENOENT/i);
  assert.ok(original !== p.sha256);
});

test("an installed receipt cannot be replayed with a contradictory operation journal", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await installPairFiles(plan, acceptance);
  const operationFile = path.join(options.recoveryRoot, plan.sha256.slice(0, 20), "operation.json"),
    operation = JSON.parse(await fs.readFile(operationFile, "utf8")),
    before = await inventory(options.destinations.native);
  operation.status = "ROLLED_BACK";
  await fs.writeFile(operationFile, JSON.stringify(operation));

  await assert.rejects(
    installPairFiles(plan, acceptance),
    /Recorded operation does not confirm delivery/,
  );
  assert.deepEqual(await inventory(options.destinations.native), before);
});

test("replay and recovery reject duplicated journal authority before effects", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    authorization = approve(plan);
  await installPairFiles(plan, authorization);
  const journalFile = path.join(options.recoveryRoot, plan.sha256.slice(0, 20), "operation.json");
  const original = await fs.readFile(journalFile, "utf8");
  const altered = original.replace('"status":', '"status":"ROLLED_BACK","status":');
  assert.notEqual(altered, original);
  await fs.writeFile(journalFile, altered);
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);
  await assert.rejects(installPairFiles(plan, authorization), {
    code: "publication_journal_json_duplicate_key",
  });
  await assert.rejects(recoverPairFiles(plan, authorization), {
    code: "publication_journal_json_duplicate_key",
  });
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
});

test("replay and recovery reject invalid UTF-8 in a recorded journal", async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    authorization = approve(plan);
  await installPairFiles(plan, authorization);
  const journalFile = path.join(options.recoveryRoot, plan.sha256.slice(0, 20), "operation.json");
  const original = await fs.readFile(journalFile);
  assert.equal(original.subarray(-2).toString(), "}\n");
  await fs.writeFile(
    journalFile,
    Buffer.concat([
      original.subarray(0, -2),
      Buffer.from(',"note":"'),
      Buffer.from([0xff]),
      Buffer.from('"}\n'),
    ]),
  );
  const nativeBefore = await inventory(options.destinations.native);
  const atlasBefore = await inventory(options.destinations.atlas);
  await assert.rejects(installPairFiles(plan, authorization), {
    code: "publication_journal_json_invalid",
  });
  await assert.rejects(recoverPairFiles(plan, authorization), {
    code: "publication_journal_json_invalid",
  });
  assert.deepEqual(await inventory(options.destinations.native), nativeBefore);
  assert.deepEqual(await inventory(options.destinations.atlas), atlasBefore);
});
