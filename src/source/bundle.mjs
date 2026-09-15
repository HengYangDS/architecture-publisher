import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fail, isDigest, LIMITS, portableKey, portablePath, validateManifest} from './manifest.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function regularBytes(file, maximum) {
  const before = await fs.lstat(file);
  if (before.isSymbolicLink()) fail('bundle_symlink_forbidden');
  if (!before.isFile()) fail('bundle_type_unsupported');
  if (before.size > maximum) fail('file_size_exceeded');
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    const opened = await handle.stat();
    if (!opened.isFile()) fail('bundle_type_unsupported');
    if (before.dev !== opened.dev || before.ino !== opened.ino || before.size !== opened.size) fail('bundle_changed');
    const bytes = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < bytes.length) {
      const read = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (!read.bytesRead) fail('bundle_changed');
      offset += read.bytesRead;
    }
    const extra = await handle.read(Buffer.alloc(1), 0, 1, offset);
    const after = await handle.stat();
    if (extra.bytesRead || after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) fail('bundle_changed');
    return bytes;
  } finally {
    await handle.close();
  }
}
async function inventory(root) {
  const files = [];
  const keys = new Set();
  let entries = 0;
  async function visit(directory, prefix, depth) {
    if (depth > LIMITS.depth) fail('bundle_depth_exceeded');
    const dir = await fs.opendir(directory);
    for await (const entry of dir) {
      if (++entries > LIMITS.entries) fail('bundle_entries_exceeded');
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      portablePath(relative);
      const key = portableKey(relative);
      if (keys.has(key)) fail('member_path_duplicate');
      keys.add(key);
      const file = path.join(directory, entry.name);
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) fail('bundle_symlink_forbidden');
      if (stat.isDirectory()) await visit(file, relative, depth + 1);
      else if (stat.isFile()) files.push(relative);
      else fail('bundle_type_unsupported');
    }
  }
  await visit(root, '', 0);
  return files.sort();
}

/** Return verified bytes, not a promise that later reads of the paths are unchanged. */
export async function readSourceBundle(manifestPath, expectedSha256) {
  if (!isDigest(expectedSha256)) fail('manifest_digest_required');
  if (typeof manifestPath !== 'string' || !manifestPath) fail('manifest_path_required');
  const file = path.resolve(manifestPath);
  const root = path.dirname(file);
  const rootStat = await fs.lstat(root);
  if (rootStat.isSymbolicLink()) fail('bundle_symlink_forbidden');
  if (!rootStat.isDirectory()) fail('bundle_type_unsupported');
  const raw = await regularBytes(file, LIMITS.manifestBytes);
  if (sha(raw) !== expectedSha256) fail('manifest_digest_mismatch');
  let decoded;
  try { decoded = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(raw)); }
  catch { fail('manifest_json_invalid'); }
  const manifest = validateManifest(decoded);
  const manifestName = portablePath(path.basename(file));
  if (manifest.files.some(member => portableKey(member.path) === portableKey(manifestName))) fail('manifest_self_member');
  const required = [manifestName, ...manifest.files.map(member => member.path)].sort();
  const before = await inventory(root);
  if (JSON.stringify(before) !== JSON.stringify(required)) fail('bundle_members_mismatch');
  const members = [];
  for (const member of manifest.files) {
    const content = await regularBytes(path.join(root, ...member.path.split('/')), LIMITS.memberBytes);
    if (content.length !== member.bytes) fail('member_size_mismatch');
    if (sha(content) !== member.sha256) fail('member_digest_mismatch');
    members.push({...member, content});
  }
  if (sha(await regularBytes(file, LIMITS.manifestBytes)) !== expectedSha256 || JSON.stringify(await inventory(root)) !== JSON.stringify(before)) fail('bundle_changed');
  return {source: manifest.source, manifestSha256: expectedSha256, members, scope: 'source-file-integrity', officialReplay: 'not-performed', semanticAcceptance: 'not-performed'};
}
