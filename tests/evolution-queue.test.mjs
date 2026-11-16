import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { queueItem, queueProblems, readQueue, researchPages } from "./fixtures/evolution-queue.mjs";

const root = path.resolve(import.meta.dirname, "..");
const queue = [
  { id: "first", done: true },
  { id: "second", done: false },
  { id: "third", done: false },
];
const held = ["parts.md", "lines.md"];
const rests = ["parts.md"];

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
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "second", rests }], held), []);
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: null, rests }], held), [
    "a names no queue item",
  ]);
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "fourth", rests }], held), [
    "a names fourth, which the queue does not hold",
  ]);
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "third", rests }], held), [
    "a names third while second is unfinished",
  ]);
  const changed = ["docs/how-to.md", "src/poster/figure.mjs", "src/cli/run.mjs"];
  assert.deepEqual(queueProblems(queue, [{ name: "m", item: "maintenance", changed }], held), [
    "m is maintenance and changes src/poster/figure.mjs",
  ]);
  assert.deepEqual(queueProblems(queue, [{ name: "p", item: "second", changed, rests }], held), []);
});

test("the design of a queue item's Change names a research page the repository holds", () => {
  const design =
    "Rests on: `docs/research/parts.md`, and docs/research/parts.md again; see docs/research/README.md.";
  assert.deepEqual(researchPages(design), ["parts.md"]);
  assert.deepEqual(researchPages("Rests on: the owner's words."), []);
  assert.deepEqual(queueProblems(queue, [{ name: "a", item: "second" }], held), [
    "a names second and its design names no research page",
  ]);
  assert.deepEqual(
    queueProblems(queue, [{ name: "a", item: "second", rests: ["parts.md", "gone.md"] }], held),
    ["a rests on docs/research/gone.md, which the repository does not hold"],
  );
  assert.deepEqual(queueProblems(queue, [{ name: "m", item: "maintenance" }], held), []);
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
  const pages = (await fs.readdir(path.join(root, "docs/research")))
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
  const changes = [];
  for (const entry of entries.filter((each) => each.isDirectory() && each.name !== "archive"))
    changes.push({
      name: entry.name,
      item: queueItem(await fs.readFile(path.join(directory, entry.name, "proposal.md"), "utf8")),
      changed,
      rests: researchPages(
        await fs.readFile(path.join(directory, entry.name, "design.md"), "utf8").catch(() => ""),
      ),
    });
  assert.deepEqual(queueProblems(held, changes, pages), []);
});
