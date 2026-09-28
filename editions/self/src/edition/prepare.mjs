import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseStrictJson, readBoundedFile } from 'architecture-publisher/file-input';
import { writeSourceBundle } from 'architecture-publisher/source';
import { claimModelDigest, validateClaimModel } from 'architecture-publisher/semantics';
import { editionDigest, validateEdition } from 'architecture-publisher/edition';
import { architecturePublisherClaimModel } from './model.mjs';
import { projectFromSelfEdition, SELF_NAMESPACE } from './project.mjs';
import { refinementFromSelfEdition } from './refinement.mjs';
import { architecturePublisherStaticScene, staticAuthoringDigest } from './static-scene.mjs';
import { architecturePublisherInteractiveScenes } from './interactive-scenes.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) =>
  record(value) && Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const sourceAuthorities = Object.freeze({
  'product-contract': 'Canonical product meaning and authority boundary',
  'edition-contract': 'Canonical Edition authorship and coverage boundary',
  'ethos-source-owned-handoff': 'Immutable ETHOS source-ownership and adoption evidence',
  'aigw-source-owned-handoff': 'Immutable AIGW source-ownership and adoption evidence',
  'core-package': 'Installed generic product identity and public package surface',
  'self-prepare-owner': 'Explicit self-Edition source selection and preparation',
  'self-model-owner': 'First-party product self-model authorship',
  'self-static-scene-owner': 'Flagship static Edition scene contract',
  'self-static-composition-owner': 'Flagship static authored composition',
  'self-static-compiler-owner': 'Flagship measured scene compiler',
  'static-renderer-owner': 'Generic authored SVG renderer',
  'self-static-metrics': 'Recorded typography input; not fresh runtime observation',
  'self-interactive-scene-owner': 'Independent flagship interactive scene authorship',
  'self-interactive-composition-owner':
    'Flagship interactive visual-carrier composition and routing',
  'interactive-compositor-owner': 'Generic standalone interactive HTML compositor',
  'source-owner': 'Source Bundle validation and exclusive output implementation',
  'claim-owner': 'Claim Model schema, validation, and canonical identity owner',
  'evolution-owner': 'Semantic delta and Edition evolution obligation compiler',
  'compiler-owner': 'Edition candidate compilation implementation',
  'interactive-renderer-owner': 'Interactive HTML renderer implementation',
  'qualification-owner': 'Qualification schema and validation owner',
  'publication-owner': 'Recoverable publication effect implementation',
  'installed-test-owner': 'Installed-use test implementation; not an execution observation',
});

export async function installPreparedOutput(
  staged,
  destination,
  afterReservation = async () => {},
) {
  try {
    await fs.mkdir(destination);
  } catch (error) {
    if (error.code === 'EEXIST') fail('self_output_exists');
    throw error;
  }
  await afterReservation({ phase: 'output-reserved', path: '' });
  async function install(source, target, relative) {
    const stat = await fs.lstat(source);
    if (stat.isDirectory()) {
      try {
        await fs.mkdir(target);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        if (!(await fs.lstat(target)).isDirectory()) fail('self_output_member_exists');
      }
      await afterReservation({ phase: 'directory-reserved', path: relative });
      for (const entry of await fs.readdir(source))
        await install(
          path.join(source, entry),
          path.join(target, entry),
          relative ? `${relative}/${entry}` : entry,
        );
      await fs.rmdir(source);
      return;
    }
    try {
      await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') fail('self_output_member_exists');
      throw error;
    }
    await fs.rm(source);
  }
  // The destination name was exclusively reserved by this invocation. Keep
  // any incomplete state visible rather than deleting bytes after a failure.
  for (const entry of await fs.readdir(staged))
    await install(path.join(staged, entry), path.join(destination, entry), entry);
  await fs.rmdir(staged);
}

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

async function physicalParent(output) {
  if (typeof output !== 'string' || !path.isAbsolute(output)) fail('self_output_path_invalid');
  const requested = path.resolve(output),
    parent = await fs.realpath(path.dirname(requested));
  if (!(await fs.lstat(parent)).isDirectory()) fail('self_output_parent_invalid');
  try {
    await fs.lstat(requested);
    fail('self_output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return { parent, output: path.join(parent, path.basename(requested)) };
}

function claimsFor(scene) {
  return scene.claims;
}

function selectedProductVersion(members) {
  const bytes = members.find(({ path: name }) => name === 'sources/core-package.source')?.content;
  const selected = parseStrictJson(
    bytes,
    'self_core_package_invalid',
    'self_core_package_json_duplicate_key',
  );
  if (
    selected?.name !== 'architecture-publisher' ||
    typeof selected.version !== 'string' ||
    !selected.version
  )
    fail('self_core_package_invalid');
  return selected.version;
}

function editionFor(model, sourceSha256, sources, productVersion) {
  const interactive = architecturePublisherInteractiveScenes(),
    question = (id, prompt, risk) => ({
      audience: 'steward',
      prompt,
      claims: [...claimsFor(interactive[id])],
      detail: id === 'overview' ? 'overview' : 'mechanism',
      risk,
    });
  return {
    schema: 'architecture.edition/v1',
    id: 'architecture-publisher-self',
    owner: model.owner,
    class: 'flagship',
    product: {
      name: 'Architecture Publisher',
      schema: 'architecture.publisher/v1',
      version: productVersion,
    },
    source: { manifestSha256: sourceSha256 },
    claimModel: {
      schema: model.schema,
      digest: claimModelDigest(model),
    },
    title: 'Architecture Publisher',
    audiences: {
      steward: { label: 'System stewards and architecture readers' },
    },
    questions: {
      overview: question(
        'overview',
        'How does explicit system meaning become a trustworthy, renewable Architecture Edition?',
        'Omission would obscure the product purpose, causal chain, or authority boundary.',
      ),
      semantics: question(
        'semantics',
        'How are source truth, provenance, uncertainty, and claims preserved?',
        'Omission would allow representation to masquerade as source truth.',
      ),
      edition: question(
        'edition',
        'How does an Edition align a reader, questions, coverage, and expression?',
        'Omission would collapse semantic truth into presentation.',
      ),
      composition: question(
        'composition',
        'How do static and interactive media remain independently composed?',
        'Omission would imply one medium is a lossy derivative of the other.',
      ),
      qualification: question(
        'qualification',
        'How are exact artifacts judged without compensating away a failed predicate?',
        'Omission would turn successful generation into a false acceptance claim.',
      ),
      'publication-recovery': question(
        'publication-recovery',
        'How are publication effects authorized, replaced, and recovered?',
        'Omission would hide effect authority, preservation, or recovery limits.',
      ),
      adoption: question(
        'adoption',
        'How do self-use, ETHOS, and AIGW exercise one generic product without sharing authority?',
        'Omission would confuse conformance, adoption, and source ownership.',
      ),
      evolution: question(
        'evolution',
        'How does semantic change create conservative rebuild and requalification obligations?',
        'Omission would permit changed meaning or bytes to inherit stale approval.',
      ),
    },
    requiredClaims: Object.keys(model.claims),
    omissions: {},
    narrative: [
      'overview',
      'semantics',
      'edition',
      'composition',
      'qualification',
      'publication-recovery',
      'adoption',
      'evolution',
    ],
    visualGrammar: {
      entityTypes: {
        authority: 'external',
        adapter: 'backend',
        semantic: 'security',
        editorial: 'cloud',
        scene: 'frontend',
        artifact: 'database',
        capability: 'messagebus',
        verification: 'security',
        authorization: 'security',
        publication: 'backend',
        consumer: 'external',
        feedback: 'cloud',
        limit: 'external',
        evolution: 'cloud',
        obligation: 'security',
      },
      relationTypes: {
        selects: { label: 'selects', variant: 'default' },
        maps: { label: 'maps', variant: 'default' },
        binds: { label: 'binds', variant: 'emphasis' },
        informs: { label: 'informs', variant: 'default' },
        broadens: { label: 'broadens', variant: 'dashed' },
        authors: { label: 'authors', variant: 'emphasis' },
        invokes: { label: 'invokes', variant: 'default' },
        compiles: { label: 'compiles', variant: 'emphasis' },
        feeds: { label: 'feeds', variant: 'default' },
        renders: { label: 'renders', variant: 'default' },
        bundles: { label: 'bundles', variant: 'emphasis' },
        qualifies: { label: 'qualifies', variant: 'security' },
        gates: { label: 'gates', variant: 'security' },
        authorizes: { label: 'authorizes', variant: 'security' },
        recovers: { label: 'recovers', variant: 'dashed' },
        serves: { label: 'serves', variant: 'default' },
        returns: { label: 'returns', variant: 'dashed' },
        excludes: { label: 'excludes', variant: 'dashed' },
        compares: { label: 'compares', variant: 'default' },
        derives: { label: 'derives', variant: 'emphasis' },
        propagates: { label: 'propagates', variant: 'emphasis' },
        requires: { label: 'requires', variant: 'security' },
        renews: { label: 'renews', variant: 'dashed' },
      },
      principles: [
        'Meaning before representation',
        'One owner for every durable value',
        'Independent media share identity, not geometry',
        'Qualification never manufactures authority',
        'Feedback returns through the native source lifecycle',
      ],
    },
    scenes: {
      static: architecturePublisherStaticScene(staticAuthoringDigest(sources)),
      interactive,
    },
    qualification: {
      semantic: ['source-and-claim-integrity'],
      coverage: ['required-claims-and-omissions'],
      static: ['painted-static-geometry'],
      interactive: ['browser-behavior-and-complete-views'],
      accessibility: ['keyboard-focus-contrast-text-and-reduced-motion'],
      installed: ['offline-relocated-reproduction'],
      recovery: ['replacement-and-interrupted-effect-recovery'],
      human: ['faithful', 'intelligible', 'restrained'].flatMap((predicate) => [
        {
          predicate,
          scope: {
            kind: 'physical',
            medium: 'static',
            artifact: 'flagship-png',
            width: 6000,
            height: 3375,
          },
        },
        {
          predicate,
          scope: {
            kind: 'viewport',
            medium: 'interactive',
            artifact: 'architecture-html',
            width: 1440,
            height: 1000,
          },
        },
      ]),
    },
    scope:
      'First-party product self-Edition; source-bound self-use, not independent adoption, source acceptance, or off-host recovery proof.',
  };
}

async function writeBuildInput(scratch, model, edition, semanticBytes, metricBytes) {
  const root = path.join(scratch, 'build-input');
  const project = structuredClone(projectFromSelfEdition(model, edition));
  project.visualPolicy.override = 'refinement.json';
  const refinement = refinementFromSelfEdition(model, edition, metricBytes);
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'self-model',
        namespace: SELF_NAMESPACE,
        format: { id: 'architecture.claim-model', version: '2' },
        claimant: model.owner,
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'source/model.json', sha256: sha256(semanticBytes) },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  const requestBytes = encode(request);
  await fs.mkdir(path.join(root, 'source'), { recursive: true });
  await fs.mkdir(path.join(root, 'edition'));
  await fs.writeFile(path.join(root, 'source/model.json'), semanticBytes, { flag: 'wx' });
  await fs.writeFile(path.join(root, 'edition/project.json'), encode(project), { flag: 'wx' });
  await fs.writeFile(path.join(root, 'edition/refinement.json'), encode(refinement), {
    flag: 'wx',
  });
  await fs.writeFile(path.join(root, 'build-request.json'), requestBytes, { flag: 'wx' });
  return sha256(requestBytes);
}

export async function prepareArchitecturePublisherEdition(input) {
  if (
    !exact(input, ['schema', 'source', 'sources', 'output']) ||
    input.schema !== 'architecture.publisher-self-input/v1' ||
    !exact(input.source, ['id', 'revision']) ||
    input.source.id !== 'architecture-publisher' ||
    typeof input.source.revision !== 'string' ||
    !input.source.revision.trim() ||
    !record(input.sources) ||
    Object.keys(input.sources).sort().join('\n') !==
      Object.keys(sourceAuthorities).sort().join('\n')
  )
    fail('self_input_invalid');
  const selectedOutput = await physicalParent(input.output),
    parent = selectedOutput.parent,
    selected = {},
    members = [];
  for (const [id, authority] of Object.entries(sourceAuthorities)) {
    const source = input.sources[id];
    if (
      !exact(source, ['path', 'sha256']) ||
      typeof source.path !== 'string' ||
      !path.isAbsolute(source.path) ||
      !digest(source.sha256)
    )
      fail('self_source_invalid');
    const bytes = await readBoundedFile(source.path, 32 * 1024 * 1024);
    if (sha256(bytes) !== source.sha256) fail('self_source_digest_mismatch');
    const locator = `sources/${id}.source`;
    selected[id] = { sha256: source.sha256, locator, authority };
    members.push({ path: locator, content: bytes });
  }
  const productVersion = selectedProductVersion(members),
    model = validateClaimModel(architecturePublisherClaimModel(selected)),
    semanticBytes = encode(model),
    scratch = await fs.mkdtemp(path.join(parent, '.publisher-self-')),
    final = selectedOutput.output;
  try {
    const bundle = await writeSourceBundle(
        path.join(scratch, 'source'),
        structuredClone(input.source),
        [{ path: 'semantic.json', content: semanticBytes }, ...members],
      ),
      edition = validateEdition(
        model,
        editionFor(model, bundle.manifestSha256, selected, productVersion),
      ),
      editionBytes = encode(edition),
      plan = {
        sourceManifest: path.join(final, 'source/manifest.json'),
        sourceSha256: bundle.manifestSha256,
        semanticMember: 'semantic.json',
        edition: path.join(final, 'edition.json'),
        editionSha256: sha256(editionBytes),
        output: path.join(final, 'publication'),
      };
    const buildRequestSha256 = await writeBuildInput(
      scratch,
      model,
      edition,
      semanticBytes,
      members.find(({ path: memberPath }) => memberPath === selected['self-static-metrics'].locator)
        ?.content,
    );
    await fs.writeFile(path.join(scratch, 'edition.json'), editionBytes, {
      flag: 'wx',
    });
    await fs.writeFile(path.join(scratch, 'plan.json'), encode(plan), {
      flag: 'wx',
    });
    await installPreparedOutput(scratch, final);
    return {
      status: 'prepared',
      sourceManifest: plan.sourceManifest,
      sourceSha256: plan.sourceSha256,
      semanticDigest: claimModelDigest(model),
      edition: plan.edition,
      editionSha256: plan.editionSha256,
      editionDigest: editionDigest(model, edition),
      plan: path.join(final, 'plan.json'),
      buildRequest: path.join(final, 'build-input/build-request.json'),
      buildRequestSha256,
      adoptionRole: 'self-hosted',
      independentAdopterEvidence: false,
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    };
  } catch (error) {
    await fs.rm(scratch, { recursive: true, force: true });
    throw error;
  }
}

export async function prepareArchitecturePublisherEditionInput(file) {
  const selected = path.resolve(file);
  const bytes = await readBoundedFile(selected, 1024 * 1024);
  const input = parseStrictJson(bytes, 'self_input_invalid', 'self_input_json_duplicate_key');
  const base = path.dirname(selected);
  if (typeof input.output !== 'string' || !input.output) fail('self_output_path_invalid');
  input.output = path.resolve(base, input.output);
  if (!record(input.sources)) fail('self_input_invalid');
  for (const source of Object.values(input.sources)) {
    if (!record(source) || typeof source.path !== 'string' || !source.path)
      fail('self_source_invalid');
    source.path = path.resolve(base, source.path);
  }
  return prepareArchitecturePublisherEdition(input);
}
