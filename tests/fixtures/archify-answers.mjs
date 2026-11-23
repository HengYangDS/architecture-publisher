import { readdirSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * One directory of Archify's answers kept between runs of the suite on this machine. An answer is kept by the
 * vendored supply's digest, the Node.js and platform that ran it, the kind of answer, the quality and the document
 * (`candidateAnswer` in `src/map/archify.mjs`), and answers one document one way, so a run asks Archify only for the
 * candidate diagrams no earlier run asked for. On 2026-11-23 one test file started Archify 2116 times, 333 s of its
 * processes' time. The process that finds no directory named names this one to every process it starts: the runner
 * of `node --test`, or a test file run on its own. An answer written more than a week ago is removed by the next run,
 * which asks again; a run that cannot remove one changes nothing of what it measures.
 */
const VARIABLE = "ARCHPUB_ARCHIFY_ANSWERS";
const NAME = "archpub-test-answers";
const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Remove a file or a directory, or leave it for a later run. */
function remove(entry) {
  try {
    rmSync(entry, { recursive: true, force: true });
  } catch {
    // Left for a later run.
  }
}

if (!process.env[VARIABLE]) {
  const home = os.tmpdir();
  const directory = path.join(home, NAME);
  try {
    // The directories a run of the suite made for itself until 2026-11-23 (`archpub-test-answers-<suffix>`).
    for (const name of readdirSync(home))
      if (name.startsWith(`${NAME}-`)) remove(path.join(home, name));
    for (const name of readdirSync(directory)) {
      const answer = path.join(directory, name);
      if (Date.now() - statSync(answer).mtimeMs > WEEK) remove(answer);
    }
  } catch {
    // No directory yet, or one removed meanwhile by another run: nothing of this run depends on it.
  }
  process.env[VARIABLE] = directory;
}
