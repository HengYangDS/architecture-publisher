import fs from 'node:fs/promises';
import path from 'node:path';
import { materializeDeclarativeProvider } from './declarative.mjs';
import { materializeExecutableProvider } from './executable.mjs';
import { readEditionProviderInput } from './input.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { fail } from '../protocol/values.mjs';

/** Keep temporary executable values alive only for the selected compiler callback. */
export async function withMaterializedEditionProvider(selection, callback) {
  if (typeof callback !== 'function') fail('edition_provider_callback_required');
  const selected = await readEditionProviderInput(
    selection.providerManifest,
    selection.providerManifestSha256,
  );
  if (selected.manifest.delivery.kind === 'declarative') {
    if (Object.hasOwn(selection, 'providerPackageRoot')) fail('edition_candidate_plan_invalid');
    const result = await materializeDeclarativeProvider({
      providerManifest: selection.providerManifest,
      providerManifestSha256: selection.providerManifestSha256,
    });
    return callback(
      {
        sourceManifest: result.sourceManifest,
        sourceSha256: result.sourceSha256,
        semanticMember: result.semanticMember,
        edition: result.edition,
        editionSha256: result.editionSha256,
        output: selection.output,
      },
      result.receipt,
    );
  }
  if (!Object.hasOwn(selection, 'providerPackageRoot'))
    fail('edition_provider_package_root_required');
  const result = await materializeExecutableProvider(
      {
        providerManifest: selection.providerManifest,
        providerManifestSha256: selection.providerManifestSha256,
        providerPackageRoot: selection.providerPackageRoot,
      },
      { verifyDeterminism: false },
    ),
    parent = path.dirname(selection.output),
    scratch = await fs.mkdtemp(path.join(parent, '.edition-provider-'));
  try {
    const source = await writeSourceBundle(
      path.join(scratch, 'source'),
      { id: result.source.id, revision: result.source.revision },
      result.source.members.map(({ path: member, contentBase64 }) => ({
        path: member,
        content: Buffer.from(contentBase64, 'base64'),
      })),
    );
    if (source.manifestSha256 !== result.sourceSha256)
      fail('edition_provider_source_identity_mismatch');
    const edition = path.join(scratch, 'edition.json');
    await fs.writeFile(edition, Buffer.from(result.edition.contentBase64, 'base64'), {
      flag: 'wx',
    });
    return await callback(
      {
        sourceManifest: source.manifestPath,
        sourceSha256: source.manifestSha256,
        semanticMember: result.semanticMember,
        edition,
        editionSha256: result.editionSha256,
        output: selection.output,
      },
      result.receipt,
    );
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
