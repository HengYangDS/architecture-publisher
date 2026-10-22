import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compareEditionInput } from "../packages/publisher/src/edition/input.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputFile(t, bytes) {
  const base = new URL("../build/runtime/work/", import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(fileURLToPath(base), "edition-input-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "plan.json");
  await fs.writeFile(file, bytes);
  return file;
}

test("Edition comparison requires an exact lowercase SHA-256 before reading", async (t) => {
  const bytes = Buffer.from("{}\n");
  const file = await inputFile(t, bytes);
  for (const digest of [null, "invalid", "A".repeat(64)])
    await assert.rejects(compareEditionInput(file, digest), {
      code: "semantic_plan_digest_required",
    });
  assert.deepEqual(await fs.readFile(file), bytes);
});

test("Edition comparison refuses changed selected bytes without mutation", async (t) => {
  const bytes = Buffer.from("{}\n");
  const file = await inputFile(t, bytes);
  await assert.rejects(compareEditionInput(file, "0".repeat(64)), {
    code: "semantic_plan_digest_mismatch",
  });
  assert.deepEqual(await fs.readFile(file), bytes);
});

test("Edition comparison rejects invalid JSON and UTF-8 even with correct digests", async (t) => {
  for (const bytes of [Buffer.from("{broken\n"), Buffer.from([0xff])]) {
    const file = await inputFile(t, bytes);
    await assert.rejects(compareEditionInput(file, sha(bytes)), {
      code: "semantic_plan_json_invalid",
    });
    assert.deepEqual(await fs.readFile(file), bytes);
  }
});

test("Edition comparison refuses incomplete selected sides before source reads", async (t) => {
  const side = {
    claimModel: { path: "claims.json", sha256: "0".repeat(64) },
    editions: [],
  };
  for (const before of [null, { ...side, editions: [null] }, { ...side, claimModel: {} }]) {
    const bytes = Buffer.from(
      JSON.stringify({
        schema: "architecture.semantic-compare-input/v2",
        before,
        after: side,
        correspondences: [],
      }),
    );
    const file = await inputFile(t, bytes);
    await assert.rejects(compareEditionInput(file, sha(bytes)), {
      code: "semantic_plan_invalid",
    });
    assert.deepEqual(await fs.readFile(file), bytes);
  }
});
