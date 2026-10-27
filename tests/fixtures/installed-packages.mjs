import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnNativeSync, parseNpmPackRecord } from "./npm-pack-report.mjs";

function run(command, args, cwd, cache, timeout = 120000) {
  const result = spawnNativeSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    env: {
      ...process.env,
      npm_config_offline: "true",
      npm_config_update_notifier: "false",
      npm_config_audit: "false",
      npm_config_cache: cache,
    },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}

/** Pack the publisher with scripts disabled and install the archive into a fresh consumer. */
export async function installPublisher(root, directory) {
  const cache = path.join(directory, "npm-cache");
  const packed = run(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", directory],
    path.join(root, "packages/publisher"),
    cache,
  );
  const record = parseNpmPackRecord(packed.stdout);
  const consumer = path.join(directory, "consumer");
  await fs.mkdir(consumer);
  run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-save",
      "--package-lock=false",
      "--prefix",
      consumer,
      path.join(directory, record.filename),
    ],
    consumer,
    cache,
  );
  return { consumer, record };
}
