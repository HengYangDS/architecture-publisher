import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Invoke the npm that runs this test's script through its own entrypoint, without a
 * platform shell shim. Every test entrypoint runs under npm, which names its CLI in
 * `npm_execpath`; the npm package is not a development dependency, because its bundle
 * would carry advisories no override reaches.
 */
export function npmInvocation(args) {
  const cli = process.env.npm_execpath ?? "";
  if (!path.isAbsolute(cli))
    throw Error("npm_execpath_unavailable: run the tests through npm, as `npm test` does");
  return { command: process.execPath, args: [cli, ...args] };
}

function npmSetupOptions(command, args, options) {
  if (
    command !== "npm" ||
    !["pack", "install", "ci"].includes(args[0]) ||
    !args.includes("--ignore-scripts")
  )
    return options;
  // Scripts-disabled setup cannot execute owned runtime; instrument product children separately.
  const env = { ...(options?.env ?? process.env) };
  for (const name of Object.keys(env))
    if (name.toUpperCase() === "NODE_V8_COVERAGE") delete env[name];
  env.NODE_V8_COVERAGE = "";
  return { ...options, env };
}

export function spawnNativeSync(command, args, options) {
  const selected = command === "npm" ? npmInvocation(args) : { command, args };
  const result = spawnSync(
    selected.command,
    selected.args,
    npmSetupOptions(command, args, options),
  );
  if (result.error)
    throw Object.assign(result.error, {
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  return result;
}

/** Parse the one-package npm pack report across supported npm JSON envelopes. */
export function parseNpmPackRecord(output) {
  const value = JSON.parse(output);
  const records = Array.isArray(value)
    ? value
    : value !== null && typeof value === "object"
      ? Object.values(value)
      : null;
  if (!records || records.length !== 1) throw Error("npm_pack_record_count_invalid");
  const record = records[0];
  if (
    record === null ||
    typeof record !== "object" ||
    Array.isArray(record) ||
    typeof record.name !== "string" ||
    typeof record.filename !== "string" ||
    !Array.isArray(record.files) ||
    record.files.some((file) => typeof file?.path !== "string")
  )
    throw Error("npm_pack_record_invalid");
  if (!Array.isArray(value) && Object.keys(value)[0] !== record.name)
    throw Error("npm_pack_record_name_mismatch");
  return record;
}
