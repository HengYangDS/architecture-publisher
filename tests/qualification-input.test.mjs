import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { verifyQualificationInput } from "../packages/publisher/src/qualification/index.mjs";
import {
  digest,
  exactDigest,
  root,
  cli,
  qualificationInputFixture,
} from "./fixtures/qualification-set.mjs";

test("qualification input verifies exact authority and exposes no publication claim", async (t) => {
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, "qualification-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const fixture = await qualificationInputFixture(directory),
    result = await verifyQualificationInput(fixture.requestPath, fixture.requestSha256);
  assert.deepEqual(
    {
      status: result.status,
      verdict: result.verdict,
      complete: result.complete,
      admitted: result.admitted,
      authorization: result.authorization,
      publication: result.publication,
      records: result.records,
    },
    {
      status: "verified",
      verdict: "PASS",
      complete: true,
      admitted: true,
      authorization: "not-performed",
      publication: "not-performed",
      records: fixture.recordCount,
    },
  );
  await assert.rejects(verifyQualificationInput(fixture.requestPath, exactDigest("changed")), {
    code: "qualification_digest_mismatch",
  });
});

test("qualification input rejects malformed selection before judging external evidence", async (t) => {
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, "qualification-input-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const selected = await qualificationInputFixture(directory);
  await assert.rejects(verifyQualificationInput(selected.requestPath, "bad"), {
    code: "qualification_digest_required",
  });
  const original = JSON.parse(await fs.readFile(selected.requestPath, "utf8"));
  const selectedModelBytes = await fs.readFile(path.join(directory, "claim-model.json"));
  const save = async (plan) => {
    const bytes = Buffer.from(JSON.stringify(plan) + "\n");
    await fs.writeFile(selected.requestPath, bytes);
    return digest(bytes);
  };

  const historicalDuplicate = Buffer.from(
    `{"schema":"architecture.qualification-input/v1",${JSON.stringify(original).slice(1)}\n`,
  );
  await fs.writeFile(selected.requestPath, historicalDuplicate);
  assert.equal(
    (await verifyQualificationInput(selected.requestPath, digest(historicalDuplicate))).verdict,
    "PASS",
  );

  const malformedPlan = Buffer.from("{");
  await fs.writeFile(selected.requestPath, malformedPlan);
  await assert.rejects(verifyQualificationInput(selected.requestPath, digest(malformedPlan)), {
    code: "qualification_json_invalid",
  });
  await assert.rejects(
    verifyQualificationInput(selected.requestPath, await save({ ...original, claimModel: null })),
    { code: "qualification_input_invalid" },
  );

  await assert.rejects(
    verifyQualificationInput(selected.requestPath, await save({ ...original, schema: "unknown" })),
    { code: "qualification_input_invalid" },
  );
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({ ...original, claimModel: { ...original.claimModel, path: "../outside" } }),
    ),
    { code: "qualification_input_invalid" },
  );
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        claimModel: { ...original.claimModel, sha256: exactDigest("other") },
      }),
    ),
    { code: "qualification_claim_model_digest_mismatch" },
  );

  const malformed = Buffer.from("{");
  await fs.writeFile(path.join(directory, "claim-model.json"), malformed);
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        claimModel: { ...original.claimModel, sha256: digest(malformed) },
      }),
    ),
    { code: "qualification_claim_model_json_invalid" },
  );
  await fs.writeFile(path.join(directory, "claim-model.json"), selectedModelBytes);
  const candidateFile = path.join(directory, "candidate.json");
  const candidate = JSON.parse(await fs.readFile(candidateFile, "utf8"));
  candidate.claimModel.sha256 = exactDigest("other-claim-model-bytes");
  const candidateBytes = Buffer.from(JSON.stringify(candidate) + "\n");
  await fs.writeFile(candidateFile, candidateBytes);
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        candidate: { ...original.candidate, sha256: digest(candidateBytes) },
      }),
    ),
    { code: "qualification_authority_identity_mismatch" },
  );
});

test("generic CLI admits qualification only against exact Candidate and Edition authority", async (t) => {
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, "qualification-cli-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const fixture = await qualificationInputFixture(directory);

  const result = spawnSync(
    process.execPath,
    [cli, "qualify", "verify", fixture.requestPath, "--sha256", fixture.requestSha256],
    { cwd: directory, encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "verified");
  assert.equal(output.complete, true);
  assert.equal(output.admitted, true);

  const bare = spawnSync(
    process.execPath,
    [cli, "qualify", "verify", fixture.qualificationPath, "--sha256", fixture.qualificationSha256],
    { cwd: directory, encoding: "utf8", timeout: 10000 },
  );
  assert.notEqual(bare.status, 0, bare.stdout + bare.stderr);
});
