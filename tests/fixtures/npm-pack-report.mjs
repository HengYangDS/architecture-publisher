import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "../..");

/**
 * The CLI entrypoint of the npm the repository declares. npm names its own in
 * `npm_execpath`; a runner that calls Node directly, as the ETHOS behavior gate does, names
 * none, and Mise's installation of the declared npm carries the package. The npm package is
 * not a development dependency: its bundle carries advisories no override reaches.
 */
function npmCli() {
  if (path.isAbsolute(process.env.npm_execpath ?? "")) return process.env.npm_execpath;
  const where = spawnSync("mise", ["where", "npm:npm"], { cwd: root, encoding: "utf8" });
  const installation = where.status === 0 ? where.stdout.trim() : "";
  if (!path.isAbsolute(installation))
    throw Error("npm_cli_unavailable: run the tests through npm or with Mise");
  const manifest = createRequire(path.join(installation, "package.json")).resolve(
    "npm/package.json",
  );
  return path.join(path.dirname(manifest), JSON.parse(readFileSync(manifest, "utf8")).bin.npm);
}

/** Invoke the declared npm through its own entrypoint, without a platform shell shim. */
export function npmInvocation(args) {
  return { command: process.execPath, args: [npmCli(), ...args] };
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
