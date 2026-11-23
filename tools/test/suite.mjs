// The suite as `npm test` runs it: every test file of `tests/`, as many at a time as the cores it may use carry.
// A test file that builds a delivery starts Archify, Typst and a browser of its own and keeps two to three cores
// busy: the whole suite took 5.96 cores at two files and 10.2 at four on 2026-11-23
// (docs/research/build-and-suite-time.md). So the width is the cores over 2.5, at least two, and at most four until
// a wider run is measured. The cores are the machine's, or, under the host's queue, the share ETHOS gives the run
// it admits (`ETHOS_HOST_CPU_CAP`), so that two runs admitted at once do not use more than the host holds.
import { spawnSync } from "node:child_process";
import { availableParallelism } from "node:os";

/** The cores the suite may use: the machine's, or fewer where the host's queue names a cap. */
export function coresOf(machine, cap) {
  const share = Number.parseInt(cap ?? "", 10);
  return Number.isInteger(share) && share > 0 ? Math.min(machine, share) : machine;
}

/** The number of test files run at once on `cores` cores. */
export function width(cores) {
  return Math.min(4, Math.max(2, Math.floor(cores / 2.5)));
}

if (import.meta.main) {
  const cores = coresOf(availableParallelism(), process.env.ETHOS_HOST_CPU_CAP);
  const run = spawnSync(
    process.execPath,
    [
      "--import=./tests/fixtures/npm-environment.mjs",
      "--test",
      `--test-concurrency=${width(cores)}`,
      "--test-force-exit",
      "tests/*.test.mjs",
    ],
    { stdio: "inherit" },
  );
  process.exitCode = run.status ?? 1;
}
