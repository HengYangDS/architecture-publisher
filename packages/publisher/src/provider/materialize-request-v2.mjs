import path from 'node:path';
import { readBuildRequestSelection, readDirectSelectedInputs } from '../edition/materialize.mjs';
import { deriveSourceRevision } from '../edition/revision.mjs';
import { assembleEditionSelection } from '../edition/selection.mjs';
import { fail } from '../source/manifest.mjs';
import { readDeclarativeProviderV2Files } from './materialize-v2.mjs';

/** Materialize one Build Request; executable v2 remains explicitly unadmitted. */
export async function materializeBuildRequestInput(requestPath, expectedSha256) {
  const { file, root, request } = await readBuildRequestSelection(requestPath, expectedSha256);
  const direct = await readDirectSelectedInputs({ file, root, request });
  let edition = direct.edition;
  const sources = [...direct.sources];
  const derived = [];
  const observations = [...direct.observations];
  const limits = [...direct.limits];
  const invocations = [];

  for (const selection of request.providers) {
    if (Object.hasOwn(selection, 'packageRoot')) fail('materialized_provider_package_root_invalid');
    const manifest = path.resolve(root, ...selection.manifest.split('/'));
    const provider = await readDeclarativeProviderV2Files(manifest, selection.sha256);
    const selected = provider.selected;
    if (selected.edition !== null) {
      if (
        edition !== null ||
        request.edition.kind !== 'provider' ||
        request.edition.provider !== selection.id
      )
        fail('materialized_edition_ambiguous');
      edition = {
        content: provider.read('edition', selected.edition.id),
        resources: [],
        expected: { id: selected.edition.id, editor: selected.edition.editor },
      };
      observations.push({
        kind: 'edition',
        key: selected.edition.id,
        method: 'filesystem-read-sha256/v1',
      });
    }
    for (const item of selected.native) {
      const content = provider.read('native', item.id);
      sources.push({
        namespace: item.namespace,
        format: item.format,
        claimant: item.claimant,
        revisionEvidence: deriveSourceRevision(item.revision, content, null, null),
        content,
      });
      if (item.revision.kind === 'vcs') limits.push(`vcs-provenance-unverified:${item.namespace}`);
      observations.push({
        kind: 'native',
        key: item.namespace,
        method: 'filesystem-read-sha256/v1',
      });
    }
    for (const item of selected.derived) {
      derived.push({
        claimant: item.claimant,
        format: item.format,
        derivedFrom: item.derivedFrom.map(({ namespace, sha256 }) => ({ namespace, sha256 })),
        adapter: item.adapter,
        method: item.method,
        content: provider.read('derived', item.id),
      });
      observations.push({
        kind: 'derived',
        key: `${selection.id}/${item.id}`,
        method: 'filesystem-read-sha256/v1',
      });
    }
    for (const limit of provider.limits)
      limits.push(
        limit.startsWith('adapter-code-unverified:')
          ? `adapter-code-unverified:${selection.id}/${limit.slice('adapter-code-unverified:'.length)}`
          : limit,
      );
    invocations.push({
      selection: selection.id,
      manifest: selection.manifest,
      ...provider.invocation,
    });
  }
  if (request.edition.kind === 'provider' && edition === null)
    fail('materialized_provider_edition_missing');
  return assembleEditionSelection({
    request,
    edition,
    sources,
    derived,
    limits,
    observations,
    invocations,
  });
}
