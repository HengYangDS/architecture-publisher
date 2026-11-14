import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { queueItem, queueProblems, readQueue } from "./fixtures/evolution-queue.mjs";

const root = path.resolve(import.meta.dirname, "..");
const queue = [
  { id: "first", done: true },
  { id: "second", done: false },
  { id: "third", done: false },
];

test("a queue is read in order with what is finished, and a proposal's queue line names its item", () => {
  const contract =
    "## Evolution\n\ntext\n\n### Queue\n\n- [x] `first`: a\n- [ ] `second`: b\n\n## Next\n\n- [ ] `no`: c\n";
  assert.deepEqual(readQueue(contract), [
    { id: "first", done: true },
    { id: "second", done: false },
  ]);
  assert.equal(queueItem("## Impact\n\nfiles.\n\nQueue: `second`.\n"), "second");
  assert.equal(queueItem("## Impact\n\nfiles.\n"), null);
});

test("a Change is held to the queue's order, and maintenance to the source outside the drawing", () => {
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "second" }]), []);
  assert.deepEqual(
    queueProblems(
      queue,
      [{ name: "a", item: "second" }].map((c) => ({ ...c, item: null })),
    ),
    ["a names no queue item"],
  );
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "fourth" }]), [
    "a names fourth, which the queue does not hold",
  ]);
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "third" }]), [
    "a names third while second is unfinished",
  ]);
  const changed = ["docs/how-to.md", "src/poster/figure.mjs", "src/cli/run.mjs"];
  assert.deepEqual(queueProblems(queue, [{ name: "m", item: "maintenance", changed }]), [
    "m is maintenance and changes src/poster/figure.mjs",
  ]);
  assert.deepEqual(queueProblems(queue, [{ name: "p", item: "second", changed }]), []);
});

/** The files this checkout changes against dev, or nothing where no dev is known, as in a hosted job. */
function changedAgainstDev() {
  const git = (/** @type {string[]} */ ...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  try {
    const dev = ["refs/heads/dev", "refs/remotes/origin/dev"].find((ref) => {
      try {
        return git("rev-parse", "--verify", "--quiet", ref);
      } catch {
        return false;
      }
    });
    if (!dev) return [];
    const committed = git("diff", "--name-only", `${dev}...HEAD`).split("\n");
    const working = git("status", "--porcelain")
      .split("\n")
      .map((line) => line.slice(3));
    return [...new Set([...committed, ...working])].filter(Boolean);
  } catch {
    return [];
  }
}

test("the contract holds a queue, and every active Change names an item in its order", async () => {
  const held = readQueue(await fs.readFile(path.join(root, "docs/product-contract.md"), "utf8"));
  assert.ok(held.length > 0, "the product contract holds no queue");
  assert.equal(new Set(held.map(({ id }) => id)).size, held.length, "a queue item is named twice");
  assert.ok(!held.some(({ id }) => id === "maintenance"), "maintenance is no queue item");
  const directory = path.join(root, "openspec/changes");
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const changed = changedAgainstDev();
  const changes = [];
  for (const entry of entries.filter((each) => each.isDirectory() && each.name !== "archive"))
    changes.push({
      name: entry.name,
      item: queueItem(await fs.readFile(path.join(directory, entry.name, "proposal.md"), "utf8")),
      changed,
    });
  assert.deepEqual(queueProblems(held, changes), []);
});
