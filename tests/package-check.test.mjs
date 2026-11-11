import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { npmInvocation, spawnNativeSync } from "./fixtures/npm-pack-report.mjs";

const root = path.resolve(import.meta.dirname, "..");
const checker = path.join(root, "tools/checks/package.mjs");

async function workspace(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-package-check-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const temporary = path.join(directory, "temporary");
  await fs.mkdir(temporary);
  return { directory, temporary };
}

function environment(temporary) {
  return {
    ...process.env,
    PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
  };
}

async function assertArchivesRemoved(temporary) {
  const entries = await fs.readdir(temporary);
  assert.deepEqual(
    entries.filter((entry) => entry.startsWith("archpub-package-check-")),
    [],
  );
}

test("the package check uses selected npm and removes its temporary archive", async (t) => {
  const { temporary } = await workspace(t);
  const result = spawnNativeSync("npm", ["run", "check:package"], {
    cwd: root,
    env: environment(temporary),
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await assertArchivesRemoved(temporary);
});

test("the package check validates packed files and cleans up rejected archives", async (t) => {
  const { directory, temporary } = await workspace(t);
  const selected = npmInvocation([]).args[0];
  const manifest = {
    name: "package-check-fixture",
    version: "1.0.0",
    type: "module",
    license: "MIT",
    engines: { node: ">=22.13" },
    exports: "./index.mjs",
    files: ["index.mjs"],
  };
  await fs.writeFile(path.join(directory, "index.mjs"), "export const value = 1;\n");
  const run = () =>
    spawnNativeSync("node", [checker], {
      cwd: directory,
      env: { ...environment(temporary), npm_execpath: selected },
      encoding: "utf8",
      timeout: 120_000,
    });
  await fs.writeFile(path.join(directory, "package.json"), JSON.stringify(manifest));
  const valid = run();
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  await assertArchivesRemoved(temporary);
  manifest.files = ["absent.mjs"];
  await fs.writeFile(path.join(directory, "package.json"), JSON.stringify(manifest));
  const invalid = run();
  assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
  assert.match(invalid.stdout + invalid.stderr, /index\.mjs/u);
  await assertArchivesRemoved(temporary);
  await fs.writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({
      ...manifest,
      devEngines: { packageManager: { name: "npm", version: "0.0.0", onFail: "error" } },
    }),
  );
  const packFailure = run();
  assert.equal(packFailure.status, 1, packFailure.stdout + packFailure.stderr);
  await assertArchivesRemoved(temporary);
});
