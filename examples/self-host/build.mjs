import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { writeSourceBundle } from '../../packages/publisher/src/source/write.mjs';
import { claimModelDigest } from '../../packages/publisher/src/semantics/document.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const selectedFiles = Object.freeze({
  'public-cli': 'packages/publisher/src/cli/main.mjs',
  'source-bundle': 'packages/publisher/src/source/bundle.mjs',
  'semantic-contract': 'packages/publisher/src/semantics/document.mjs',
  'publication-coordinator': 'packages/publisher/src/compiler/edition.mjs',
  'static-compositor': 'packages/publisher/renderers/svg/architecture.mjs',
  'interactive-renderer': 'packages/publisher/renderers/archify/index.mjs',
  'raster-boundary': 'packages/publisher/renderers/resvg/index.mjs',
  'publication-writer': 'packages/publisher/src/publication/files.mjs',
});

async function main() {
  const requestedOutput = process.argv[2];
  if (!requestedOutput || !path.isAbsolute(requestedOutput))
    throw new Error('absolute output required');
  await fs.mkdir(requestedOutput);
  const output = await fs.realpath(requestedOutput);
  const members = [],
    sources = {};
  for (const [id, locator] of Object.entries(selectedFiles)) {
    const content = await fs.readFile(path.join(root, locator));
    members.push({ path: `source/${locator}`, content });
    sources[id] = {
      sha256: sha(content),
      locator: `source/${locator}`,
      authority: 'selected installed architecture-publisher package member',
    };
  }
  const selectedRevision = sha(
    Buffer.from(
      Object.entries(sources)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([id, source]) => `${id}\t${source.locator}\t${source.sha256}`)
        .join('\n') + '\n',
    ),
  );
  const entity = (type, label, provenance) => ({
      type,
      label,
      qualifiers: {},
      provenance: [provenance],
    }),
    relation = (type, subject, object, provenance) => ({
      type,
      subject,
      object,
      qualifiers: {},
      provenance: [provenance],
    }),
    semantic = {
      schema: 'architecture.claim-model/v2',
      owner: 'architecture-publisher',
      vocabulary: {
        entities: [
          'interface',
          'source',
          'contract',
          'coordinator',
          'renderer',
          'boundary',
          'writer',
        ],
        relations: [
          'invokes',
          'supplies',
          'validates',
          'delegates',
          'rasterizes',
          'publishes',
        ],
        maturities: ['implemented'],
        predicates: Object.fromEntries(
          Object.entries({
            invokes: 'single',
            supplies: 'single',
            validates: 'single',
            delegates: 'multiple',
            rasterizes: 'single',
            publishes: 'single',
          }).map(([id, cardinality]) => [
            id,
            {
              valueKind: 'entity',
              cardinality,
              values: [],
              provenance: ['semantic-contract'],
            },
          ]),
        ),
      },
      entities: {
        'public-cli': entity('interface', 'Public CLI', 'public-cli'),
        'source-bundle': entity('source', 'Source bundle', 'source-bundle'),
        'semantic-contract': entity('contract', 'Semantic contract', 'semantic-contract'),
        'publication-coordinator': entity('coordinator', 'Publication coordinator', 'publication-coordinator'),
        'static-compositor': entity('renderer', 'Static compositor', 'static-compositor'),
        'interactive-renderer': entity('renderer', 'Interactive renderer', 'interactive-renderer'),
        'raster-boundary': entity('boundary', 'Raster boundary', 'raster-boundary'),
        'publication-writer': entity('writer', 'Publication writer', 'publication-writer'),
      },
      relations: {
        'cli-coordinator': relation('invokes', 'public-cli', 'publication-coordinator', 'public-cli'),
        'source-coordinator': relation('supplies', 'source-bundle', 'publication-coordinator', 'source-bundle'),
        'contract-coordinator': relation('validates', 'semantic-contract', 'publication-coordinator', 'semantic-contract'),
        'coordinator-static': relation('delegates', 'publication-coordinator', 'static-compositor', 'publication-coordinator'),
        'coordinator-interactive': relation('delegates', 'publication-coordinator', 'interactive-renderer', 'publication-coordinator'),
        'static-raster': relation('rasterizes', 'static-compositor', 'raster-boundary', 'raster-boundary'),
        'interactive-writer': relation('publishes', 'interactive-renderer', 'publication-writer', 'publication-writer'),
        'raster-writer': relation('publishes', 'raster-boundary', 'publication-writer', 'publication-writer'),
      },
      claims: {},
      sources,
      context: {
        adoptionRole: 'self-hosted',
        independentAdopterEvidence: false,
        scope: 'Selected installed package modules; not an exhaustive code graph',
      },
    },
    relationTypes = {
      invokes: { label: 'invokes', variant: 'emphasis' },
      supplies: { label: 'supplies', variant: 'default' },
      validates: { label: 'validates', variant: 'default' },
      delegates: { label: 'delegates', variant: 'emphasis' },
      rasterizes: { label: 'rasterizes', variant: 'default' },
      publishes: { label: 'publishes', variant: 'default' },
    };
  for (const [id, value] of Object.entries(semantic.relations))
    semantic.claims[id] = {
      subject: value.subject,
      predicate: value.type,
      object: value.object,
      value: null,
      plane: 'implemented',
      condition: {},
      scope: structuredClone(value.qualifiers),
      maturity: 'implemented',
      validity: 'affirmed',
      dependsOn: [{ section: 'relations', id }],
      coverage: 'complete',
      provenance: [...new Set([...value.provenance, 'semantic-contract'])],
    };
  const allClaims = Object.keys(semantic.claims),
    mediaClaims = [
      'coordinator-static',
      'coordinator-interactive',
      'static-raster',
      'interactive-writer',
      'raster-writer',
    ],
    edition = {
      schema: 'architecture.edition/v1',
      id: 'architecture-publisher-structural',
      owner: semantic.owner,
      class: 'structural',
      product: {
        name: 'Architecture Publisher',
        schema: 'architecture.publisher/v1',
        version: '0.2.0-alpha.0',
      },
      source: { manifestSha256: '' },
      claimModel: {
        schema: 'architecture.claim-model/v2',
        digest: claimModelDigest(semantic),
      },
      title: 'Architecture Publisher',
      audiences: {
        maintainer: { label: 'Maintainers' },
      },
      questions: {
        overview: {
          audience: 'maintainer',
          prompt: 'How does selected meaning become two published media?',
          claims: [...allClaims],
          detail: 'overview',
          risk: 'Omission would hide part of the declared publication chain.',
        },
        media: {
          audience: 'maintainer',
          prompt: 'How do static and interactive media remain independent?',
          claims: [...mediaClaims],
          detail: 'mechanism',
          risk: 'Omission would hide a medium-specific composition boundary.',
        },
      },
      requiredClaims: [...allClaims],
      omissions: {},
      narrative: ['overview', 'media'],
      visualGrammar: {
        entityTypes: {
          interface: 'external',
          source: 'database',
          contract: 'security',
          coordinator: 'backend',
          renderer: 'frontend',
          boundary: 'messagebus',
          writer: 'database',
        },
        relationTypes,
        principles: [
          'One semantic authority',
          'Independent medium composition',
          'Visible source-bound structure',
        ],
      },
      scenes: {
        static: {
          label: 'One semantic authority, two independent media',
          questions: ['overview'],
          claims: [...allClaims],
          composition: {
            groups: [
              { id: 'inputs', label: 'Selected inputs', entities: ['public-cli', 'source-bundle', 'semantic-contract'] },
              { id: 'coordination', label: 'Publication', entities: ['publication-coordinator'] },
              { id: 'projection', label: 'Independent media', entities: ['static-compositor', 'interactive-renderer'] },
              { id: 'delivery', label: 'Delivery', entities: ['raster-boundary', 'publication-writer'] },
            ],
            relations: [
              { id: 'cli-coordinator', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'source-coordinator', fromSide: 'bottom', toSide: 'top', route: 'straight' },
              { id: 'contract-coordinator', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'coordinator-static', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'coordinator-interactive', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'static-raster', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'interactive-writer', fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v' },
              { id: 'raster-writer', fromSide: 'right', toSide: 'left', route: 'straight' },
            ],
          },
        },
        interactive: {
          overview: {
            label: 'Semantic publication pipeline',
            purpose: 'overview',
            questions: ['overview'],
            claims: [...allClaims],
            composition: {
              groups: [
                { id: 'inputs', label: 'Selected inputs', entities: ['public-cli', 'source-bundle', 'semantic-contract'] },
                { id: 'coordination', label: 'Publication', entities: ['publication-coordinator'] },
                { id: 'projection', label: 'Independent media', entities: ['static-compositor', 'interactive-renderer'] },
                { id: 'delivery', label: 'Delivery', entities: ['raster-boundary', 'publication-writer'] },
              ],
              relations: [
                { id: 'cli-coordinator', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'source-coordinator', fromSide: 'bottom', toSide: 'top', route: 'auto', labelAt: [460, 220] },
                { id: 'contract-coordinator', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'coordinator-static', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'coordinator-interactive', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'static-raster', fromSide: 'bottom', toSide: 'top', route: 'auto', labelAt: [365, 676] },
                { id: 'interactive-writer', fromSide: 'bottom', toSide: 'top', route: 'auto', labelAt: [605, 676] },
                { id: 'raster-writer', fromSide: 'right', toSide: 'left', route: 'auto' },
              ],
            },
          },
          media: {
            label: 'Independent composition boundaries',
            purpose: 'mechanism',
            questions: ['media'],
            claims: [...mediaClaims],
            composition: {
              groups: [
                { id: 'coordination', label: 'Publication', entities: ['publication-coordinator'] },
                { id: 'projection', label: 'Independent media', entities: ['static-compositor', 'interactive-renderer'] },
                { id: 'delivery', label: 'Delivery', entities: ['raster-boundary', 'publication-writer'] },
              ],
              relations: [
                { id: 'coordinator-static', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'coordinator-interactive', fromSide: 'bottom', toSide: 'top', route: 'auto' },
                { id: 'static-raster', fromSide: 'bottom', toSide: 'top', route: 'auto', labelAt: [365, 466] },
                { id: 'interactive-writer', fromSide: 'bottom', toSide: 'top', route: 'auto', labelAt: [605, 466] },
                { id: 'raster-writer', fromSide: 'right', toSide: 'left', route: 'auto' },
              ],
            },
          },
        },
      },
      qualification: {
        semantic: ['claim-model-valid'],
        coverage: ['required-claims-visible'],
        static: ['static-geometry'],
        interactive: ['browser-behavior'],
        accessibility: ['keyboard-and-reduced-motion'],
        installed: ['offline-reproduction'],
        recovery: [],
        human: [],
      },
      scope: 'Self-hosted selected package architecture; not independent adoption or exhaustive implementation coverage',
    };
  members.unshift({ path: 'semantic.json', content: encode(semantic) });
  const bundle = await writeSourceBundle(
      path.join(output, 'source'),
      { id: 'architecture-publisher', revision: `source-set:${selectedRevision}` },
      members,
    ),
    editionPath = path.join(output, 'edition.json'),
    planPath = path.join(output, 'plan.json');
  edition.source.manifestSha256 = bundle.manifestSha256;
  await fs.writeFile(editionPath, encode(edition), { flag: 'wx' });
  const plan = {
    sourceManifest: bundle.manifestPath,
    sourceSha256: bundle.manifestSha256,
    semanticMember: 'semantic.json',
    edition: editionPath,
    editionSha256: sha(await fs.readFile(editionPath)),
    output: path.join(output, 'publication'),
  };
  const planBytes = encode(plan);
  await fs.writeFile(planPath, planBytes, { flag: 'wx' });
  process.stdout.write(
    JSON.stringify({
      status: 'prepared',
      sourceManifest: bundle.manifestPath,
      sourceSha256: bundle.manifestSha256,
      edition: editionPath,
      semanticDigest: edition.claimModel.digest,
      plan: planPath,
      planSha256: sha(planBytes),
      adoptionRole: 'self-hosted',
      independentAdopterEvidence: false,
    }) + '\n',
  );
}

await main();
