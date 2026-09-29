import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseStrictJson, readBoundedFile } from 'architecture-publisher/file-input';
import { writeSourceBundle } from 'architecture-publisher/source';
import { claimModelDigest, validateClaimModel } from 'architecture-publisher/semantics';
import { architecturePublisherClaimModel } from './model.mjs';
import { projectFromSelfModel, SELF_NAMESPACE } from './project.mjs';
import { refinementFromSelfProject } from './refinement.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) =>
  record(value) && Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const sourceAuthorities = Object.freeze({
  'product-contract': 'Canonical product meaning and authority boundary',
  'core-package': 'Installed generic product identity and public package surface',
  'self-prepare-owner': 'Explicit self-Edition source selection and preparation',
  'self-model-owner': 'First-party product self-model authorship',
  'self-project-owner': 'First-party Edition Project authorship',
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

async function writeBuildInput(scratch, model, semanticBytes, metricBytes) {
  const root = path.join(scratch, 'build-input');
  const project = projectFromSelfModel(model);
  const refinement = refinementFromSelfProject(model, project, metricBytes);
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
  const projectBytes = encode(project);
  await fs.mkdir(path.join(root, 'source'), { recursive: true });
  await fs.mkdir(path.join(root, 'edition'));
  await fs.writeFile(path.join(root, 'source/model.json'), semanticBytes, { flag: 'wx' });
  await fs.writeFile(path.join(root, 'edition/project.json'), projectBytes, { flag: 'wx' });
  await fs.writeFile(path.join(root, 'edition/refinement.json'), encode(refinement), {
    flag: 'wx',
  });
  await fs.writeFile(path.join(root, 'build-request.json'), requestBytes, { flag: 'wx' });
  return { buildRequestSha256: sha256(requestBytes), projectSha256: sha256(projectBytes) };
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
  const selectedCoreVersion = selectedProductVersion(members),
    model = validateClaimModel(architecturePublisherClaimModel(selected)),
    semanticBytes = encode(model),
    scratch = await fs.mkdtemp(path.join(parent, '.publisher-self-')),
    final = selectedOutput.output;
  try {
    const bundle = await writeSourceBundle(
      path.join(scratch, 'source'),
      structuredClone(input.source),
      [{ path: 'semantic.json', content: semanticBytes }, ...members],
    );
    const prepared = await writeBuildInput(
      scratch,
      model,
      semanticBytes,
      members.find(({ path: memberPath }) => memberPath === selected['self-static-metrics'].locator)
        ?.content,
    );
    await installPreparedOutput(scratch, final);
    return {
      status: 'prepared',
      sourceManifest: path.join(final, 'source/manifest.json'),
      sourceSha256: bundle.manifestSha256,
      semanticDigest: claimModelDigest(model),
      selectedCoreVersion,
      project: path.join(final, 'build-input/edition/project.json'),
      projectSha256: prepared.projectSha256,
      buildRequest: path.join(final, 'build-input/build-request.json'),
      buildRequestSha256: prepared.buildRequestSha256,
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
