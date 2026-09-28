import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { canonical } from '../protocol/json.mjs';
import { fail } from '../protocol/values.mjs';
import { IMPLEMENTATION_MANIFEST_SHA256 } from './implementation-identity.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const profileNames = [
  'semantic-claim',
  'semantic-likec4',
  'static-claim',
  'static-grouped',
  'static-likec4',
  'static-authored',
  'static-figure',
  'interactive-neutral',
  'interactive-authored',
];

/** @internal Check a relocated package in regression tests. */
export async function verifyImplementationSupplyAtRoot(root, profile) {
  const profiles = typeof profile === 'string' ? [profile] : profile;
  if (
    !Array.isArray(profiles) ||
    !profiles.length ||
    profiles.length > 8 ||
    new Set(profiles).size !== profiles.length ||
    profiles.some((name) => !profileNames.includes(name)) ||
    (profiles.length > 1 && profiles.some((name) => !name.startsWith('static-')))
  )
    fail('publisher_implementation_profile_invalid');
  const manifestPath = path.join(root, 'supplies/implementation.json');
  let bytes;
  try {
    await noSymlinkAncestors(manifestPath);
    bytes = await regularBytes(manifestPath, 1024 * 1024);
  } catch {
    fail('publisher_implementation_supply_invalid');
  }
  if (sha(bytes) !== IMPLEMENTATION_MANIFEST_SHA256)
    fail('publisher_implementation_supply_invalid');
  // The generated pin fixes the schema and profile membership; rechecking
  // their shape here would be a second, redundant authority.
  const manifest = JSON.parse(bytes);
  const selected = new Map();
  for (const name of profiles)
    for (const item of manifest.profiles[name]) {
      const previous = selected.get(item.path);
      if (previous && canonical(previous) !== canonical(item))
        fail('publisher_implementation_supply_invalid');
      selected.set(item.path, item);
    }
  const files = [...selected.values()].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  for (const item of files) {
    try {
      const file = path.join(root, ...item.path.split('/'));
      await noSymlinkAncestors(file);
      const content = await regularBytes(file, 2 * 1024 * 1024);
      if (content.length !== item.bytes || sha(content) !== item.sha256)
        fail('publisher_implementation_supply_invalid');
    } catch {
      fail('publisher_implementation_supply_invalid');
    }
  }
  return {
    id: profiles[0].startsWith('semantic-')
      ? 'publisher-semantic-file-set'
      : `publisher-${profiles[0].startsWith('static-') ? 'static' : 'interactive'}-media-file-set`,
    sha256: sha(Buffer.from(canonical(files))),
    basis: 'checked-declared',
    method: 'checked-installed-file-set/v1',
  };
}

/** Check package-relative implementation files selected by the executed media path. */
export function readImplementationSupply(profile) {
  return verifyImplementationSupplyAtRoot(packageRoot, profile);
}
