// The suite as `npm test` runs it: every test file of `tests/`, as many at a time as the machine's cores carry.
// A test file that builds a delivery starts Archify, Typst and a browser of its own and keeps two to three cores
// busy: the whole suite took 5.96 cores at two files and 10.2 at four on 2026-11-23
// (docs/research/build-and-suite-time.md). So the width is the machine's cores over 2.5, at least two, and at most
// four until a wider run is measured.
import { spawnSync } from "node:child_process";
import { availableParallelism } from "node:os";

/** The number of test files run at once on a machine of `cores` cores. */
export function width(cores) {
  return Math.min(4, Math.max(2, Math.floor(cores / 2.5)));
}

if (import.meta.main) {
  const run = spawnSync(
    process.execPath,
    [
      "--import=./tests/fixtures/npm-environment.mjs",
      "--test",
      `--test-concurrency=${width(availableParallelism())}`,
      "--test-force-exit",
      "tests/*.test.mjs",
    ],
    { stdio: "inherit" },
  );
  process.exitCode = run.status ?? 1;
}
