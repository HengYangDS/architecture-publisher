import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * One directory of Archify's answers for a run of the suite. The process that finds none named makes it, names
 * it to every process it starts and removes it when it ends: the runner of `node --test`, or a test file run on
 * its own. The suite's files build the same fixtures, and each candidate diagram of a fixture is measured once a
 * run where each file measured it again. A run ended by a signal leaves its directory; the next run removes
 * those a day old.
 */
const VARIABLE = "ARCHPUB_ARCHIFY_ANSWERS";
const PREFIX = "archpub-test-answers-";
const DAY = 24 * 60 * 60 * 1000;

/** Remove a directory, or leave it: a directory that cannot be removed changes nothing of a run. */
function remove(directory) {
  try {
    rmSync(directory, { recursive: true, force: true });
  } catch {
    // Left for a later run.
  }
}

if (!process.env[VARIABLE]) {
  const home = os.tmpdir();
  try {
    for (const name of readdirSync(home)) {
      if (!name.startsWith(PREFIX)) continue;
      const left = path.join(home, name);
      if (Date.now() - statSync(left).mtimeMs > DAY) remove(left);
    }
  } catch {
    // Unreadable, or removed meanwhile by another run: nothing of this run depends on it.
  }
  const directory = mkdtempSync(path.join(home, PREFIX));
  process.env[VARIABLE] = directory;
  process.on("exit", () => remove(directory));
}
