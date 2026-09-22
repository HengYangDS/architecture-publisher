import path from 'node:path';
import { createHash } from 'node:crypto';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, isDigest, LIMITS, portablePath } from '../source/manifest.mjs';
import { validateEditionProvider } from './contract.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function json(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

/** Resolve one already validated portable provider path below its manifest root. */
export function resolveProviderPath(root, selected, code) {
  try {
    portablePath(selected);
  } catch {
    fail(code);
  }
  const resolved = path.resolve(root, ...selected.split('/'));
  if (resolved === root || !resolved.startsWith(root + path.sep)) fail(code);
  return resolved;
}

/** Read and verify one exact Provider manifest before opening selected payloads. */
export async function readEditionProviderInput(file, expectedSha256) {
  if (typeof file !== 'string' || !file) fail('edition_provider_manifest_path_required');
  if (!isDigest(expectedSha256)) fail('edition_provider_manifest_digest_required');
  const selected = path.resolve(file);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, LIMITS.manifestBytes);
  if (sha(bytes) !== expectedSha256) fail('edition_provider_manifest_digest_mismatch');
  const manifest = validateEditionProvider(json(bytes, 'edition_provider_manifest_json_invalid'));
  const root = path.dirname(selected);
  if (manifest.delivery.kind === 'declarative') {
    for (const selectedPath of [
      manifest.delivery.sourceManifest,
      manifest.delivery.edition,
      manifest.delivery.evolution,
    ])
      if (selectedPath !== null)
        resolveProviderPath(root, selectedPath, 'edition_provider_delivery_path_invalid');
  }
  return { manifest, root, sha256: expectedSha256 };
}

/** Resolve the exact provider-form Edition build request. */
export function resolveEditionProviderSelection(planPath, value) {
  const fields = Object.keys(value ?? {})
    .sort()
    .join('\n');
  if (
    fields !== ['output', 'providerManifest', 'providerManifestSha256'].sort().join('\n') &&
    fields !==
      ['output', 'providerManifest', 'providerManifestSha256', 'providerPackageRoot']
        .sort()
        .join('\n')
  )
    fail('edition_candidate_plan_invalid');
  if (
    typeof value.providerManifest !== 'string' ||
    !value.providerManifest ||
    !isDigest(value.providerManifestSha256) ||
    typeof value.output !== 'string' ||
    !value.output ||
    (Object.hasOwn(value, 'providerPackageRoot') &&
      (typeof value.providerPackageRoot !== 'string' || !value.providerPackageRoot))
  )
    fail('edition_candidate_plan_invalid');
  const base = path.dirname(path.resolve(planPath));
  return {
    providerManifest: path.resolve(base, value.providerManifest),
    providerManifestSha256: value.providerManifestSha256,
    ...(Object.hasOwn(value, 'providerPackageRoot')
      ? { providerPackageRoot: path.resolve(base, value.providerPackageRoot) }
      : {}),
    output: path.resolve(base, value.output),
  };
}
