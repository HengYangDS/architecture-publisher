import { createHash } from 'node:crypto';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { parseStrictJson } from '../protocol/json.mjs';
import { fail, isDigest } from '../protocol/values.mjs';
import { LIMITS } from '../file-input/contract.mjs';
import { validateEditionProviderV2 } from './selection-contract.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Read one exact selected Provider manifest without choosing its transport. */
export async function readSelectedProviderManifest(file, expectedSha256) {
  if (typeof file !== 'string' || !file) fail('edition_provider_v2_manifest_path_required');
  if (!isDigest(expectedSha256)) fail('edition_provider_v2_manifest_digest_required');
  const manifestPath = path.resolve(file);
  await noSymlinkAncestors(manifestPath);
  const manifestBytes = await regularBytes(manifestPath, LIMITS.manifestBytes);
  if (sha(manifestBytes) !== expectedSha256) fail('edition_provider_v2_manifest_digest_mismatch');
  const manifest = validateEditionProviderV2(
    parseStrictJson(
      manifestBytes,
      'edition_provider_v2_manifest_json_invalid',
      'edition_provider_v2_manifest_duplicate_key',
    ),
  );
  return { manifest, root: path.dirname(manifestPath) };
}

/** Resolve Provider-local native ancestry without exporting local IDs as identity. */
export function normalizeSelectedContributions(manifest) {
  const nativeById = new Map(manifest.selected.native.map((item) => [item.id, item]));
  return {
    native: manifest.selected.native,
    derived: manifest.selected.derived.map((item) => ({
      ...item,
      derivedFrom: item.derivedFrom.map((id) => {
        const ancestor = nativeById.get(id);
        return { id, namespace: ancestor.namespace, sha256: ancestor.sha256 };
      }),
    })),
    edition: manifest.selected.edition,
  };
}
