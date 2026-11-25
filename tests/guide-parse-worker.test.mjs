import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { verifySupply } from "../src/supply.mjs";

// The queue item `reader-file`: the guide's draft is read by Archify's own parser in a worker. `parsedGuide` runs the
// worker under the Permission Model, which keeps a child from writing coverage, so this runs it as a plain child in
// the verified Archify supply, as the LikeC4 worker's test does.

const WORKER = fileURLToPath(new URL("../src/map/guide-parse-worker.mjs", import.meta.url));

/** The worker's reply to one message, run where `parsedGuide` runs it. */
async function ask(/** @type {string} */ input) {
  const { root } = await verifySupply("archify");
  const child = spawnSync(process.execPath, [WORKER], {
    cwd: root,
    input,
    encoding: "utf8",
    timeout: 60_000,
  });
  return { exit: child.status, reply: JSON.parse(child.stdout.trim().split("\n").at(-1) ?? "") };
}

test("the guide's parse worker answers with Archify's document, its findings, or its failure", async () => {
  const draft = [
    "# How does an order flow? {#q}",
    "",
    "It is queued.",
    "",
    "## Why a queue? {#p-a}",
    "",
    "Prose.",
    "",
  ].join("\n");
  const ok = await ask(JSON.stringify({ text: draft }));
  assert.equal(ok.exit, 0);
  assert.equal(ok.reply.status, "ok");
  assert.equal(ok.reply.document.panels.length, 1);
  assert.equal(ok.reply.document.answer.summary, "It is queued.");
  const invalid = await ask(JSON.stringify({ text: "@meta locale=en\n" }));
  assert.equal(invalid.reply.status, "invalid");
  assert.ok(invalid.reply.diagnostics.length > 0);
  const failed = await ask("not json");
  assert.equal(failed.reply.status, "failed");
  assert.match(failed.reply.message, /JSON/u);
});
