import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fail, isDigest } from '../../src/protocol/values.mjs';

/** Explicit host capability identity, not a dependency closure or OS sandbox. */
export async function fileIdentity(file, expected, maximum, code) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !isDigest(expected)) fail(code);
  const resolved = await fs.realpath(file),
    stat = await fs.stat(resolved);
  if (!stat.isFile() || stat.size > maximum) fail(code);
  const h = createHash('sha256');
  for await (const bytes of createReadStream(resolved)) h.update(bytes);
  const digest = h.digest('hex');
  if (digest !== expected) fail(code);
  return { path: resolved, sha256: digest, bytes: stat.size };
}
