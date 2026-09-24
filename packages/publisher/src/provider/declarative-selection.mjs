import { createHash } from 'node:crypto';
import path from 'node:path';
import { EDITION_PROJECT_FILE_BYTES } from '../edition/authoring.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, LIMITS } from '../source/manifest.mjs';
import { normalizeSelectedContributions, readSelectedProviderManifest } from './manifest.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Read only selected declarative files; this is not a closed compiler input. */
export async function readDeclarativeSelectedInputs(file, expectedSha256) {
  const { manifest, root } = await readSelectedProviderManifest(file, expectedSha256);
  if (manifest.delivery.kind !== 'declarative') fail('edition_provider_v2_delivery_unsupported');

  const descriptors = new Map([
    ...manifest.selected.native.map((item) => [`native:${item.id}`, item]),
    ...manifest.selected.derived.map((item) => [`derived:${item.id}`, item]),
    ...(manifest.selected.edition === null
      ? []
      : [
          [`edition:${manifest.selected.edition.id}`, manifest.selected.edition],
          ...manifest.selected.edition.resources.map((resource) => [
            `edition-resource:${resource.ref}`,
            resource,
          ]),
        ]),
  ]);
  const contents = new Map();
  for (const item of manifest.delivery.files) {
    const identity = `${item.kind}:${item.id}`;
    const descriptor = descriptors.get(identity);
    const selectedFile = path.resolve(root, ...item.path.split('/'));
    await noSymlinkAncestors(selectedFile);
    const content = await regularBytes(
      selectedFile,
      item.kind === 'edition' || item.kind === 'edition-resource'
        ? EDITION_PROJECT_FILE_BYTES
        : LIMITS.memberBytes,
    );
    if (content.length !== descriptor.bytes) fail('edition_provider_v2_member_size_mismatch');
    if (sha(content) !== descriptor.sha256) fail('edition_provider_v2_member_digest_mismatch');
    contents.set(identity, Buffer.from(content));
  }

  const selected = normalizeSelectedContributions(manifest);
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
