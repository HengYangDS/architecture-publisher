import path from 'node:path';
import { readBuildRequestSelection, readDirectSelectedInputs } from '../edition/materialize.mjs';
import { deriveSourceRevision } from '../edition/revision.mjs';
import { assembleEditionSelection } from '../edition/selection.mjs';
import { fail } from '../source/manifest.mjs';
import { readDeclarativeSelectedInputs } from './declarative-selection.mjs';
import { readExecutableSelectedInputs } from './executable-selection.mjs';
import { readSelectedProviderManifest } from './manifest.mjs';

/** Materialize one Build Request across direct, declarative, and executable inputs. */
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
    const manifest = path.resolve(root, ...selection.manifest.split('/'));
    const selectedManifest = await readSelectedProviderManifest(manifest, selection.sha256);
    let provider;
    if (selectedManifest.manifest.delivery.kind === 'declarative') {
      if (Object.hasOwn(selection, 'packageRoot'))
        fail('materialized_provider_package_root_invalid');
      provider = await readDeclarativeSelectedInputs(manifest, selection.sha256);
    } else {
      if (!Object.hasOwn(selection, 'packageRoot'))
        fail('materialized_provider_package_root_required');
      const packageRoot = path.resolve(root, ...selection.packageRoot.split('/'));
      provider = await readExecutableSelectedInputs(manifest, selection.sha256, packageRoot);
    }
    const selected = provider.selected;
    const invocation = provider.invocation;
    const inputMethod =
      invocation.delivery === 'executable'
        ? 'provider-input-sha256/v2'
        : 'filesystem-read-sha256/v1';
    const derivedMethod =
      invocation.delivery === 'executable'
        ? 'provider-reply-sha256/v2'
        : 'filesystem-read-sha256/v1';
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
        method: inputMethod,
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
        method: inputMethod,
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
        method: derivedMethod,
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
      ...invocation,
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
