import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnNativeSync, parseNpmPackRecord } from "./npm-pack-report.mjs";

function run(command, args, cwd, cache, timeout = 60000) {
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

function archive(directory, result) {
  return path.join(directory, parseNpmPackRecord(result.stdout).filename);
}

export async function installCoreAndSelf(root, directory, extraArchives = []) {
  const cache = path.join(directory, "npm-cache"),
    core = run(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", directory],
      path.join(root, "packages/publisher"),
      cache,
    ),
    extension = run(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", directory],
      path.join(root, "editions/self"),
      cache,
    ),
    consumer = path.join(directory, "consumer");
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
      archive(directory, core),
      archive(directory, extension),
      ...extraArchives,
    ],
    consumer,
    cache,
  );
  return {
    consumer,
    coreRoot: path.join(consumer, "node_modules/architecture-publisher"),
    selfRoot: path.join(consumer, "node_modules/@architecture-publisher/self-edition"),
    core: parseNpmPackRecord(core.stdout),
    extension: parseNpmPackRecord(extension.stdout),
  };
}
