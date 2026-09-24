import { createHash } from 'node:crypto';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { fail, isDigest, LIMITS } from '../source/manifest.mjs';
import { validateEditionProviderV2 } from './contract-v2.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Read only selected declarative files; this is not a closed compiler input. */
export async function readDeclarativeProviderV2Files(file, expectedSha256) {
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
  if (manifest.delivery.kind !== 'declarative') fail('edition_provider_v2_delivery_unsupported');

  const descriptors = new Map([
    ...manifest.selected.native.map((item) => [`native:${item.id}`, item]),
    ...manifest.selected.derived.map((item) => [`derived:${item.id}`, item]),
    ...(manifest.selected.edition === null
      ? []
      : [[`edition:${manifest.selected.edition.id}`, manifest.selected.edition]]),
  ]);
  const contents = new Map();
  const root = path.dirname(manifestPath);
  for (const item of manifest.delivery.files) {
    const identity = `${item.kind}:${item.id}`;
    const descriptor = descriptors.get(identity);
    const selectedFile = path.resolve(root, ...item.path.split('/'));
    await noSymlinkAncestors(selectedFile);
    const content = await regularBytes(
      selectedFile,
      item.kind === 'edition' ? 4 * 1024 * 1024 : LIMITS.memberBytes,
    );
    if (content.length !== descriptor.bytes) fail('edition_provider_v2_member_size_mismatch');
    if (sha(content) !== descriptor.sha256) fail('edition_provider_v2_member_digest_mismatch');
    contents.set(identity, Buffer.from(content));
  }

  const nativeById = new Map(manifest.selected.native.map((item) => [item.id, item]));
  const selected = {
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
  const selectedJson = JSON.stringify(selected);
  const invocationJson = JSON.stringify({
    provider: manifest.provider,
    delivery: 'declarative',
    manifestSha256: expectedSha256,
  });
  return Object.freeze({
    closure: 'selected-provider-files-only',
    limits: Object.freeze([
      'path-confinement-under-concurrent-mutation-unproved',
      ...manifest.selected.derived.map((item) => `adapter-code-unverified:${item.id}`),
    ]),
    get selected() {
      return JSON.parse(selectedJson);
    },
    get invocation() {
      return JSON.parse(invocationJson);
    },
    read(kind, id) {
      const content = contents.get(`${kind}:${id}`);
      if (!content) fail('edition_provider_v2_item_unselected');
      return Buffer.from(content);
    },
  });
}
