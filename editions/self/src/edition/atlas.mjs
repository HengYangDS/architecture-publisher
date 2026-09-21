import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { noSymlinkAncestors, readSourceBundle, regularBytes } from 'architecture-publisher/source';
import { claimModelDigest, validateClaimModel } from 'architecture-publisher/semantics';
import {
  editionDigest,
  interactiveSceneDigest,
  validateEdition,
} from 'architecture-publisher/edition';
import { composeStandaloneAtlas } from 'architecture-publisher/rendering';
import { renderArchitectureScene } from 'architecture-publisher/renderers/archify';
import { architecturePublisherInteractiveScenes } from './interactive-scenes.mjs';
import { composeArchitecturePublisherInteractiveScene } from './interactive-scene.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exact = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const labels = Object.freeze({
  overview: 'Overview',
  semantics: 'Semantics',
  edition: 'Edition',
  composition: 'Composition',
  qualification: 'Qualification',
  'publication-recovery': 'Publication',
  adoption: 'Adoption',
  evolution: 'Evolution',
});
const runtimeSources = Object.freeze({
  'self-interactive-scene-owner': new URL('./interactive-scenes.mjs', import.meta.url),
  'self-interactive-composition-owner': new URL('./interactive-scene.mjs', import.meta.url),
  'self-interactive-atlas-owner': new URL('./atlas.mjs', import.meta.url),
});

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function json(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

async function selectedJson(file, digest, code) {
  if (
    typeof file !== 'string' ||
    !path.isAbsolute(file) ||
    typeof digest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(digest)
  )
    fail(code);
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 4 * 1024 * 1024);
  if (sha256(bytes) !== digest) fail(code);
  return { bytes, value: json(bytes, code) };
}

async function physicalOutput(output) {
  if (typeof output !== 'string' || !path.isAbsolute(output)) fail('self_atlas_output_invalid');
  const parent = path.dirname(path.resolve(output)),
    stat = await fs.lstat(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (await fs.realpath(parent)) !== parent)
    fail('self_atlas_output_parent_invalid');
  try {
    await fs.lstat(output);
    fail('output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return path.resolve(output);
}

async function verifyRuntimeSources(model, members) {
  const identities = [];
  for (const [id, file] of Object.entries(runtimeSources)) {
    const selected = model.sources[id],
      source = selected && members.get(selected.locator),
      runtime = await fs.readFile(file);
    if (
      !selected ||
      !source ||
      sha256(source) !== selected.sha256 ||
      sha256(runtime) !== selected.sha256
    )
      fail('self_atlas_runtime_source_mismatch');
    identities.push({ id, sha256: selected.sha256 });
  }
  identities.sort(({ id: left }, { id: right }) => left.localeCompare(right));
  return Object.freeze({
    id: 'self-interactive-runtime',
    sha256: sha256(Buffer.from(JSON.stringify(identities))),
  });
}

function sourceIdsFor(document, semanticIds, claimIds) {
  const selected = new Set();
  for (const semanticId of semanticIds) {
    const [kind, id] = semanticId.split(':'),
      subject =
        kind === 'entity'
          ? document.entities[id]
          : kind === 'relation'
            ? document.relations[id]
            : null;
    if (!subject) fail('self_atlas_semantic_binding_invalid');
    for (const source of subject.provenance) selected.add(source);
  }
  for (const id of claimIds)
    for (const source of document.claims[id].provenance) selected.add(source);
  selected.add('self-interactive-composition-owner');
  return [...selected].sort();
}

function subjectSources(document, scene, claimIds) {
  const sourcesFor = (semanticIds) => {
    const values = new Set();
    const subjects = new Set(),
      dependencies = new Set();
    for (const semanticId of semanticIds) {
      const [kind, id] = semanticId.split(':'),
        subject =
          kind === 'entity'
            ? document.entities[id]
            : kind === 'relation'
              ? document.relations[id]
              : null;
      if (!subject) fail('self_atlas_semantic_binding_invalid');
      for (const source of subject.provenance) values.add(source);
      if (kind === 'entity') subjects.add(id);
      else {
        dependencies.add(id);
        subjects.add(subject.subject);
        subjects.add(subject.object);
      }
    }
    for (const id of claimIds) {
      const claim = document.claims[id];
      if (
        subjects.has(claim.subject) ||
        subjects.has(claim.object) ||
        claim.dependsOn.some(
          (reference) => reference.section === 'relations' && dependencies.has(reference.id),
        )
      )
        for (const source of claim.provenance) values.add(source);
    }
    values.add('self-interactive-composition-owner');
    return values;
  };
  const result = {};
  for (const carrier of [...scene.nodes, ...scene.edges])
    result[carrier.id] = [...sourcesFor(carrier.semanticIds)].sort();
  return result;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Render the source-owned flagship interactive Edition as one standalone Atlas. */
export async function renderArchitecturePublisherAtlas(plan) {
  if (
    !exact(plan, [
      'sourceManifest',
      'sourceSha256',
      'semanticMember',
      'edition',
      'editionSha256',
      'output',
    ]) ||
    typeof plan.sourceManifest !== 'string' ||
    !path.isAbsolute(plan.sourceManifest) ||
    plan.semanticMember !== 'semantic.json'
  )
    fail('self_atlas_plan_invalid');
  const output = await physicalOutput(plan.output),
    source = await readSourceBundle(plan.sourceManifest, plan.sourceSha256),
    members = new Map(source.members.map((member) => [member.path, member.content])),
    semanticBytes = members.get(plan.semanticMember);
  if (!semanticBytes) fail('self_atlas_semantic_missing');
  const document = validateClaimModel(json(semanticBytes, 'self_atlas_semantic_invalid')),
    selectedEdition = await selectedJson(
      plan.edition,
      plan.editionSha256,
      'self_atlas_edition_invalid',
    ),
    edition = validateEdition(document, selectedEdition.value),
    expectedScenes = architecturePublisherInteractiveScenes(),
    projections = edition.narrative.map((id) => ({
      id,
      label: edition.scenes.interactive[id].label,
      purpose: edition.scenes.interactive[id].purpose,
      ...edition.scenes.interactive[id].composition,
    }));
  if (
    edition.id !== 'architecture-publisher-self' ||
    edition.class !== 'flagship' ||
    edition.source.manifestSha256 !== source.manifestSha256 ||
    !same(edition.scenes.interactive, expectedScenes)
  )
    fail('self_atlas_edition_invalid');
  const runtimeSupply = await verifyRuntimeSources(document, members);

  const parent = path.dirname(output),
    scratch = await fs.mkdtemp(path.join(parent, '.publisher-self-atlas-'));
  try {
    const pages = [],
      rendererSupplies = new Map();
    for (const view of projections) {
      const file = path.join(scratch, view.id + '.html'),
        scene = composeArchitecturePublisherInteractiveScene(document, edition, view),
        rendered = await renderArchitectureScene({ scene, output: file }),
        content = await fs.readFile(file),
        semanticIds = [
          ...scene.nodes.flatMap(({ semanticIds }) => semanticIds),
          ...scene.edges.flatMap(({ semanticIds }) => semanticIds),
        ],
        declaration = edition.scenes.interactive[view.id];
      for (const supply of rendered.supplies) rendererSupplies.set(supply.id, supply);
      pages.push({
        id: view.id,
        label: view.label,
        shortLabel: labels[view.id],
        purpose: view.purpose,
        path: `views/${view.id}.html`,
        sha256: rendered.artifact.sha256,
        sourceIds: sourceIdsFor(document, semanticIds, declaration.claims),
        subjectSources: subjectSources(document, scene, declaration.claims),
        content,
      });
    }
    if (pages.some(({ shortLabel }) => typeof shortLabel !== 'string'))
      fail('self_atlas_narrative_invalid');
    const selectedSources = [...new Set(pages.flatMap(({ sourceIds }) => sourceIds))]
        .sort()
        .map((id) => {
          const sourceRecord = document.sources[id],
            content = members.get(sourceRecord.locator);
          if (!content || sha256(content) !== sourceRecord.sha256)
            fail('self_atlas_source_mismatch');
          return {
            id,
            path: sourceRecord.locator,
            sha256: sourceRecord.sha256,
            authority: sourceRecord.authority,
            content,
          };
        }),
      bytes = composeStandaloneAtlas({
        schema: 'architecture.atlas-composition/v1',
        title: edition.title,
        source: {
          ...structuredClone(source.source),
          manifestSha256: source.manifestSha256,
        },
        semanticDigest: claimModelDigest(document),
        editionSha256: plan.editionSha256,
        editionDigest: editionDigest(document, edition),
        overview: edition.narrative[0],
        pages,
        sources: selectedSources,
        state: {
          qualification: 'not-performed',
          humanAcceptance: 'not-performed',
          publication: 'not-performed',
        },
      }),
      staged = path.join(scratch, 'architecture-publisher.html');
    await fs.writeFile(staged, bytes, { flag: 'wx' });
    try {
      await fs.copyFile(staged, output, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') fail('output_exists');
      throw error;
    }
    if (sha256(await fs.readFile(output)) !== sha256(bytes)) fail('self_atlas_output_changed');
    return {
      status: 'rendered',
      sourceSha256: source.manifestSha256,
      semanticSha256: sha256(semanticBytes),
      semanticDigest: claimModelDigest(document),
      editionSha256: plan.editionSha256,
      editionDigest: editionDigest(document, edition),
      interactiveSceneDigest: interactiveSceneDigest(document, edition),
      pages: pages.length,
      output,
      sha256: sha256(bytes),
      bytes: bytes.length,
      supplies: [...rendererSupplies.values(), runtimeSupply].sort(({ id: left }, { id: right }) =>
        left.localeCompare(right),
      ),
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function renderArchitecturePublisherAtlasInput(file) {
  const selected = path.resolve(file);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, 1024 * 1024),
    plan = json(bytes, 'self_atlas_plan_invalid'),
    base = path.dirname(selected);
  for (const key of ['sourceManifest', 'edition', 'output']) {
    if (typeof plan?.[key] !== 'string' || !plan[key]) fail('self_atlas_plan_invalid');
    plan[key] = path.resolve(base, plan[key]);
  }
  return renderArchitecturePublisherAtlas(plan);
}
