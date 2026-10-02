import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

/** Invoke npm through the selected Node installation instead of a Windows cmd shim. */
export function npmInvocation(args) {
  if (path.isAbsolute(process.env.npm_execpath ?? ''))
    return { command: process.execPath, args: [process.env.npm_execpath, ...args] };
  if (process.platform !== 'win32') return { command: 'npm', args };
  return {
    command: process.execPath,
    args: [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...args],
  };
}

export function spawnNativeSync(command, args, options) {
  const selected = command === 'npm' ? npmInvocation(args) : { command, args };
  const result = spawnSync(selected.command, selected.args, options);
  if (result.error)
    throw Object.assign(result.error, {
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  return result;
}

export function execNativeSync(command, args, options) {
  const selected = command === 'npm' ? npmInvocation(args) : { command, args };
  return execFileSync(selected.command, selected.args, options);
}

/** Parse the one-package npm pack report across supported npm JSON envelopes. */
export function parseNpmPackRecord(output) {
  const value = JSON.parse(output);
  const records = Array.isArray(value)
    ? value
    : value !== null && typeof value === 'object'
      ? Object.values(value)
      : null;
  if (!records || records.length !== 1) throw Error('npm_pack_record_count_invalid');
  const record = records[0];
  if (
    record === null ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    typeof record.name !== 'string' ||
    typeof record.filename !== 'string' ||
    !Array.isArray(record.files) ||
    record.files.some((file) => typeof file?.path !== 'string')
  )
    throw Error('npm_pack_record_invalid');
  if (!Array.isArray(value) && Object.keys(value)[0] !== record.name)
    throw Error('npm_pack_record_name_mismatch');
  return record;
}
