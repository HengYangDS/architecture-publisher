import fs from 'node:fs/promises';
import path from 'node:path';
import { readSourceBundle } from '../../src/source/bundle.mjs';
import { writeSourceBundle } from '../../src/source/write.mjs';
import {
  readEthosSource,
  sha256,
  stableStringify,
} from '../../src/integrations/ethos/projection.mjs';
import { readEthosAtlasSelection } from './atlas.mjs';
import { checkBindings } from './bindings.mjs';
import { compareEthosMeaning, verifyMeaningCarriers } from './evolution.mjs';

const encode = (v) => Buffer.from(JSON.stringify(v, null, 2) + '\n');
const exact = (v, keys) =>
  v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join(',') === [...keys].sort().join(',');

/** Rebind selected authoring, never rewrite source meaning or qualify new bytes. */
export async function prepareEthosCandidate(plan) {
  if (
    !exact(plan, [
      'previous',
      'source',
      'authoring',
      'authoringSha256',
      'output',
    ]) ||
    !exact(plan.source, ['sourceManifest', 'sourceSha256', 'projectionDigest'])
  )
    throw Error('Explicit candidate preparation inputs required');
  if (
    !path.isAbsolute(plan.output ?? '') ||
    !path.isAbsolute(plan.authoring ?? '')
  )
    throw Error('Explicit absolute candidate paths required');
  const previous = await readEthosAtlasSelection(plan.previous);
  const source = await readEthosSource(
    plan.source.sourceManifest,
    plan.source.sourceSha256,
    plan.source.projectionDigest,
  );
  const selected = await readSourceBundle(
    plan.previous.editionManifest,
    plan.previous.editionSha256,
  );
  const stat = await fs.lstat(plan.authoring);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size > 1024 * 1024 ||
    (await fs.realpath(plan.authoring)) !== plan.authoring
  )
    throw Error('Regular bounded authored input required');
  const bytes = await fs.readFile(plan.authoring);
  if (sha256(bytes) !== plan.authoringSha256)
    throw Error('Candidate authoring identity changed');
  const authoring = JSON.parse(bytes);
  if (
    !exact(authoring, [
      'schema',
      'node',
      'sha256',
      'static',
      'interactive',
      'scope',
    ]) ||
    authoring.schema !== 'architecture.ethos-refresh-authoring/v1' ||
    authoring.node !== 'candidate_base_stale' ||
    !exact(authoring.static, ['replay', 'merge', 'pending']) ||
    !exact(authoring.interactive, ['summary', 'candidate']) ||
    !exact(authoring.interactive.candidate, ['label', 'sublabel', 'tag']) ||
    typeof authoring.scope !== 'string' ||
    !authoring.scope.trim()
  )
    throw Error('Unsupported refresh authoring');
  verifyMeaningCarriers(
    source.projection,
    [
      {
        kind: 'node',
        id: authoring.node,
        sha256: authoring.sha256,
        carriers: ['summary', ...Object.keys(authoring.static)],
      },
    ],
    { ...authoring.static, summary: authoring.interactive.summary },
  );
  const views = previous.pages.map((p) => ({
    id: p.id,
    nodes: Object.values(p.bindings.nodes).flat(),
    relations: Object.values(p.bindings.relations).flatMap(
      (r) => r.sourceRelations ?? [],
    ),
    assertions: Object.values(p.bindings.connections).flat(),
  }));
  const delta = compareEthosMeaning(
    previous.source.projection,
    source.projection,
    views,
  );
  const supported =
    delta.added.nodes.length === 0 &&
    delta.removed.nodes.length === 0 &&
    delta.changed.nodes.every((id) => id === authoring.node) &&
    ['relations', 'assertions', 'contracts', 'presentation'].every(
      (k) =>
        !delta.added[k].length &&
        !delta.removed[k].length &&
        !delta.changed[k].length,
    );
  if (!supported || delta.unrepresented.length)
    throw Error('Unsupported semantic delta requires authored mapping');
  const members = new Map(selected.members.map((m) => [m.path, m.content]));
  const edition = structuredClone(previous.edition);
  edition.schema = 'architecture.ethos-atlas-candidate/v1';
  delete edition.acceptedAtlasManifestSha256;
  edition.source = {
    commit: source.projection.source.git.commit,
    projectionDigest: plan.source.projectionDigest,
    manifestSha256: plan.source.sourceSha256,
  };
  const catalog = structuredClone(previous.catalog);
  catalog.sourceDigest = plan.source.projectionDigest;
  for (const page of edition.pages) {
    delete page.acceptedHtmlSha256;
    const original = previous.pages.find((p) => p.id === page.id),
      spec = structuredClone(original.spec),
      bindings = structuredClone(original.bindings);
    bindings.sourceRevision = edition.source.commit;
    bindings.sourceDigest = edition.source.projectionDigest;
    if (bindings.writeBoundaryRequired) {
      const sourceId = bindings.writeBoundaryRequired.sourceId;
      bindings.writeBoundaryRequired.sourceSha256 =
        source.projection.source.bindings.find(
          (b) => b.id === sourceId,
        )?.sha256;
    }
    if (['overview', 'lanes', 'candidate'].includes(page.id)) {
      const card = page.id === 'overview' ? 1 : 0;
      const item = spec.cards[card].items.length;
      spec.cards[card].items.push(authoring.interactive.summary);
      bindings.meaning = [
        {
          kind: 'node',
          id: authoring.node,
          sha256: authoring.sha256,
          carriers: [`cards/${card}/items/${item}`],
        },
      ];
      if (page.id === 'candidate') {
        const node = spec.components.find((c) => c.id === 'expected');
        if (!node) throw Error('Missing candidate refresh carrier');
        Object.assign(node, authoring.interactive.candidate);
        if (!bindings.nodes.expected.includes(authoring.node))
          bindings.nodes.expected.push(authoring.node);
        bindings.meaning[0].carriers.push(
          'nodes/expected/sublabel',
          'nodes/expected/tag',
        );
      }
    }
    checkBindings(spec, bindings, source.projection);
    members.set(page.spec, encode(spec));
    members.set(page.bindings, encode(bindings));
    page.specSha256 = sha256(members.get(page.spec));
    page.bindingsSha256 = sha256(members.get(page.bindings));
  }
  members.set('edition.json', encode(edition));
  members.set('catalog.json', encode(catalog));
  const written = await writeSourceBundle(
    plan.output,
    { id: 'ethos:atlas-authoring', revision: edition.source.commit },
    [...members].map(([path, content]) => ({ path, content })),
  );
  return {
    status: 'prepared',
    pages: edition.pages.length,
    input: plan,
    atlas: {
      ...plan.source,
      editionManifest: written.manifestPath,
      editionSha256: written.manifestSha256,
    },
    delta,
    posterAuthoring: {
      refresh: { sha256: authoring.sha256, ...authoring.static },
    },
    authoringSha256: plan.authoringSha256,
    semanticAcceptance: 'not-performed',
    browserAcceptance: 'not-performed',
  };
}
