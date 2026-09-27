import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { canonical } from '../source/json.mjs';
import { fail } from '../source/manifest.mjs';
import { IMPLEMENTATION_MANIFEST_SHA256 } from './implementation-identity.mjs';

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
  const files = manifest.profiles[profile];
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
    id: `publisher-${profile.startsWith('static-') ? 'static' : 'interactive'}-media-file-set`,
    sha256: sha(Buffer.from(canonical(files))),
    method: 'checked-installed-file-set/v1',
  };
}

/** Check package-relative implementation files selected by the executed media path. */
export function readImplementationSupply(profile) {
  return verifyImplementationSupplyAtRoot(packageRoot, profile);
}
