import assert from "node:assert/strict";
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

// A build starts its page's run of Archify and then lays its plates out, which holds the event loop. A limit on the
// run that expired during the layout must not throw away an answer that came in meanwhile (the review of
// 2026-11-24). A stand-in for Archify answers at once; the test holds the loop past a short limit, as a long layout
// does, and the answer is read.
const execFile = cp.execFile;
const archify = (args) =>
  Array.isArray(args) && String(args[0]).endsWith(path.join("bin", "archify.mjs"));
const answer = JSON.stringify({ ok: true, stand: "in" });
// A stand-in for Archify: it answers at once, or, given `--hang`, never.
const standIn = (rest) => [
  process.execPath,
  [
    "-e",
    rest[0].includes("--hang")
      ? "setInterval(() => {}, 1000)"
      : `process.stdout.write(${JSON.stringify(answer)})`,
  ],
  ...rest.slice(1),
];
function swapped(file, ...rest) {
  return archify(rest[0])
    ? execFile.call(this, ...standIn(rest))
    : execFile.call(this, file, ...rest);
}
swapped[promisify.custom] = (file, ...rest) =>
  archify(rest[0])
    ? execFile[promisify.custom](...standIn(rest))
    : execFile[promisify.custom](file, ...rest);
cp.execFile = swapped;
syncBuiltinESMExports();
const { runArchify, telling } = await import("../src/map/archify.mjs");

/** Hold the event loop for `ms` milliseconds, as a synchronous layout does. */
const hold = (ms) => {
  const until = Date.now() + ms;
  while (Date.now() < until);
};

test("a run of Archify that ended while the loop was held past its limit is read", async () => {
  const { answer: read } = await telling(
    () => hold(1500),
    new AbortController().signal,
    () => runArchify(["validate", "explainer", "x.md", "--json"], { limit: 200, grace: 2000 }),
  );
  assert.deepEqual(read, { ok: true, stand: "in" });
});

test("a run of Archify that does not answer is ended after its limit and the grace", async () => {
  const begun = Date.now();
  const { answer: read } = await runArchify(["validate", "explainer", "x.md", "--json", "--hang"], {
    limit: 200,
    grace: 300,
  });
  assert.equal(read.ok, false);
  assert.equal(read.diagnostics[0].code, "archify_failed");
  assert.match(
    read.diagnostics[0].message,
    /did not answer within its limit of 200 ms and a grace of 300 ms/u,
  );
  assert.ok(Date.now() - begun < 5000, `ended after ${Date.now() - begun} ms`);
});
