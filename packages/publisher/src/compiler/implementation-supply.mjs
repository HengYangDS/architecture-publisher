import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { canonical, parseStrictJson } from '../source/json.mjs';
import { fail, isDigest, portablePath } from '../source/manifest.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const profileNames = [
  'static-claim',
  'static-grouped',
  'static-likec4',
  'static-authored',
  'interactive-neutral',
  'interactive-authored',
];

/** @internal Check a relocated package in regression tests. */
export async function verifyImplementationSupplyAtRoot(root, profile) {
  if (!profileNames.includes(profile)) fail('publisher_implementation_profile_invalid');
  const manifestPath = path.join(root, 'supplies/implementation.json');
  let manifest;
  try {
    await noSymlinkAncestors(manifestPath);
    manifest = parseStrictJson(
      await regularBytes(manifestPath, 1024 * 1024),
      'publisher_implementation_supply_invalid',
      'publisher_implementation_supply_invalid',
    );
  } catch {
    fail('publisher_implementation_supply_invalid');
  }
  if (
    manifest?.schema !== 'architecture.publisher-implementation-supply/v1' ||
    !manifest.profiles ||
    typeof manifest.profiles !== 'object' ||
    Array.isArray(manifest.profiles) ||
    Object.keys(manifest.profiles).sort().join('\0') !== [...profileNames].sort().join('\0')
  )
    fail('publisher_implementation_supply_invalid');
  const files = manifest.profiles[profile];
  if (!Array.isArray(files) || !files.length) fail('publisher_implementation_supply_invalid');
  let previous = '';
  for (const item of files) {
    if (
      !item ||
      typeof item !== 'object' ||
      Object.keys(item).sort().join('\0') !== 'bytes\0path\0sha256' ||
      typeof item.path !== 'string' ||
      !/^(?:src|renderers)\//u.test(item.path) ||
      item.path <= previous ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 1 ||
      !isDigest(item.sha256)
    )
      fail('publisher_implementation_supply_invalid');
    try {
      portablePath(item.path);
      const file = path.join(root, ...item.path.split('/'));
      await noSymlinkAncestors(file);
      const content = await regularBytes(file, 2 * 1024 * 1024);
      if (content.length !== item.bytes || sha(content) !== item.sha256)
        fail('publisher_implementation_supply_invalid');
    } catch {
      fail('publisher_implementation_supply_invalid');
    }
    previous = item.path;
  }
  return {
    id: `publisher-${profile.startsWith('static-') ? 'static' : 'interactive'}-implementation`,
    sha256: sha(Buffer.from(canonical(files))),
    method: 'checked-installed-file-set/v1',
  };
}

/** Check package-relative implementation files selected by the executed media path. */
export function readImplementationSupply(profile) {
  return verifyImplementationSupplyAtRoot(packageRoot, profile);
}
