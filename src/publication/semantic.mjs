import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readSourceBundle } from '../source/bundle.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, isDigest, portablePath } from '../source/manifest.mjs';
import {
  interactiveArchitectureDiagram,
  semanticArchitectureProjections,
} from '../composition/architecture.mjs';
import { composeStaticOverview } from '../composition/static-overview.mjs';
import {
  claimModelDigest,
  validateClaimModel,
} from '../semantics/document.mjs';
import {
  editionDigest,
  interactiveSceneDigest,
  staticSceneDigest,
  validateEdition,
} from '../edition/contract.mjs';
import { renderSemanticDiagram } from '../interactive/archify.mjs';
import { loadBundledFonts } from '../interactive/fonts.mjs';
import { rasterize } from '../static/raster.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exact = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');

function json(bytes, code) {
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
  } catch {
    fail(code);
  }
}

async function selectedEdition(file, digest) {
  if (!isDigest(digest)) fail('edition_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 4 * 1024 * 1024);
  if (sha(bytes) !== digest) fail('edition_digest_mismatch');
  return { bytes, value: json(bytes, 'edition_json_invalid') };
}

async function selectedPlan(file, digest) {
  if (!isDigest(digest)) fail('semantic_plan_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 1024 * 1024);
  if (sha(bytes) !== digest) fail('semantic_plan_digest_mismatch');
  return json(bytes, 'semantic_plan_json_invalid');
}

function sourceBindings(document, members) {
  const bound = [];
  for (const [id, source] of Object.entries(document.sources)) {
    portablePath(source.locator);
    const content = members.get(source.locator);
    if (!content || sha(content) !== source.sha256)
      fail('semantic_source_binding_mismatch', id);
    bound.push({ id, path: source.locator, sha256: source.sha256 });
  }
  return bound.sort((left, right) => left.id.localeCompare(right.id));
}

async function renderOverviewPng(scratch, svg, source, fonts) {
  const bundle = await writeSourceBundle(
      path.join(scratch, 'static-input'),
      { id: `${source.id}:static-overview`, revision: source.revision ?? '' },
      [
        { path: 'overview.svg', content: svg },
        ...fonts.map((font) => ({ path: font.path, content: font.bytes })),
      ],
    ),
    output = path.join(scratch, 'overview.png'),
    result = await rasterize({
      manifest: bundle.manifestPath,
      manifestSha256: bundle.manifestSha256,
      svg: 'overview.svg',
      fonts: fonts.map((font) => ({
        path: font.path,
        family: 'JetBrains Mono',
        weight: font.weight,
      })),
      width: 2400,
      output,
    });
  return { bytes: await fs.readFile(output), result };
}

function standaloneSvg(svg, fonts, license) {
  const xml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const css = fonts.map((font) =>
    "@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:" + font.weight +
    ";font-display:block;src:url(data:font/ttf;base64," + font.bytes.toString('base64') +
    ") format('truetype');}").join('\n');
  return Buffer.from(svg.toString('utf8').replace('</svg>',
    '<style>' + css + '</style><metadata id="font-license">' +
    xml(license.bytes.toString('utf8')) + '</metadata></svg>'));
}

/** Coordinate one atomic semantic publication across independent media. */
export async function compileSemanticPublication(plan) {
  if (
    !exact(plan, [
      'sourceManifest',
      'sourceSha256',
      'semanticMember',
      'edition',
      'editionSha256',
      'output',
    ]) ||
    !path.isAbsolute(plan.sourceManifest ?? '') ||
    !path.isAbsolute(plan.edition ?? '') ||
    !path.isAbsolute(plan.output ?? '')
  )
    fail('semantic_publication_plan_invalid');
  portablePath(plan.semanticMember);
  const source = await readSourceBundle(
      plan.sourceManifest,
      plan.sourceSha256,
    ),
    members = new Map(source.members.map((item) => [item.path, item.content])),
    semanticBytes = members.get(plan.semanticMember);
  if (!semanticBytes) fail('semantic_publication_document_missing');
  const document = validateClaimModel(
      json(semanticBytes, 'semantic_publication_document_invalid'),
    ),
    digest = claimModelDigest(document),
    bindings = sourceBindings(document, members),
    selected = await selectedEdition(plan.edition, plan.editionSha256),
    edition = validateEdition(document, selected.value),
    selectedEditionDigest = editionDigest(document, edition),
    selectedStaticSceneDigest = staticSceneDigest(document, edition),
    selectedInteractiveSceneDigest = interactiveSceneDigest(document, edition),
    projections = semanticArchitectureProjections(document, selected.value),
    parent = path.dirname(plan.output),
    parentStat = await fs.lstat(parent);
  if (edition.source.manifestSha256 !== source.manifestSha256)
    fail('edition_source_mismatch');
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('semantic_publication_output_parent_invalid');
  const scratch = await fs.mkdtemp(path.join(parent, '.semantic-publication-'));
  try {
    const artifacts = [],
      receipts = [],
      staticResult = composeStaticOverview(
        document,
        selected.value,
        projections.staticScene,
      ),
      selectedFonts = await loadBundledFonts(),
      fonts = selectedFonts.fonts.filter((font) => [400, 600].includes(font.weight)),
      overviewSvg = standaloneSvg(staticResult.bytes, fonts, selectedFonts.license),
      overviewPng = await renderOverviewPng(
        scratch,
        staticResult.bytes,
        source.source,
        fonts,
      );
    for (const view of projections.interactiveScenes) {
      const output = path.join(scratch, view.id + '.html'),
        inputBytes = Buffer.from(
          JSON.stringify(
            interactiveArchitectureDiagram(document, selected.value, view),
            null,
            2,
          ) + '\n',
        ),
        receipt = await renderSemanticDiagram({
          type: 'architecture',
          inputBytes,
          output,
        }),
        html = await fs.readFile(output);
      artifacts.push({ path: `views/${view.id}.html`, content: html });
      receipts.push({
        id: view.id,
        purpose: view.purpose,
        htmlSha256: sha(html),
        nodeIds: view.groups.flatMap((group) => group.entities),
        relationIds: view.relations.map((relation) => relation.id),
        relations: view.relations.map((layout) => {
          const relation = document.relations[layout.id];
          return {
            id: layout.id,
            from: relation.subject,
            to: relation.object,
            fromSide: layout.fromSide,
            toSide: layout.toSide,
            route: layout.route,
          };
        }),
        renderer: receipt.supply,
      });
    }
    artifacts.push(
      { path: 'overview.svg', content: overviewSvg },
      { path: 'overview.png', content: overviewPng.bytes },
      { path: 'semantic.json', content: semanticBytes },
      { path: 'edition.json', content: selected.bytes },
    );
    const publication = {
      schema: 'architecture.edition-publication/v1',
      sourceManifestSha256: source.manifestSha256,
      source: source.source,
      semanticMember: plan.semanticMember,
      semanticSha256: sha(semanticBytes),
      semanticDigest: digest,
      sourceBindings: bindings,
      editionSha256: plan.editionSha256,
      editionDigest: selectedEditionDigest,
      staticSceneDigest: selectedStaticSceneDigest,
      interactiveSceneDigest: selectedInteractiveSceneDigest,
      static: {
        id: projections.staticScene.id,
        svgSha256: sha(overviewSvg),
        pngSha256: sha(overviewPng.bytes),
        width: overviewPng.result.width,
        height: overviewPng.result.height,
        nodeIds: staticResult.nodeIds,
        relationIds: staticResult.relationIds,
        relations: projections.staticScene.relations.map((layout) => {
          const relation = document.relations[layout.id];
          return {
            id: layout.id,
            from: relation.subject,
            to: relation.object,
            fromSide: layout.fromSide,
            toSide: layout.toSide,
            route: layout.route,
          };
        }),
        renderer: { name: 'architecture-static-overview', version: 1 },
        raster: overviewPng.result.supply,
      },
      views: receipts,
      overviewSvgSha256: sha(overviewSvg),
      overviewPngSha256: sha(overviewPng.bytes),
      staticWidth: overviewPng.result.width,
      scope: edition.scope,
      semanticAcceptance: 'source-bound-structure',
      browserAcceptance: 'not-performed',
    };
    artifacts.unshift({
      path: 'publication.json',
      content: Buffer.from(JSON.stringify(publication, null, 2) + '\n'),
    });
    const written = await writeSourceBundle(
      plan.output,
      source.source,
      artifacts,
    );
    return {
      status: 'published',
      ...written,
      views: receipts.length,
      semanticDigest: digest,
      editionDigest: selectedEditionDigest,
      staticSceneDigest: selectedStaticSceneDigest,
      interactiveSceneDigest: selectedInteractiveSceneDigest,
      semanticAcceptance: publication.semanticAcceptance,
      browserAcceptance: publication.browserAcceptance,
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function compileSemanticPublicationInput(file, digest) {
  const planPath = path.resolve(file),
    plan = await selectedPlan(planPath, digest);
  for (const key of ['sourceManifest', 'edition', 'output']) {
    if (typeof plan?.[key] !== 'string' || !plan[key])
      fail('semantic_publication_plan_invalid');
    plan[key] = path.resolve(path.dirname(planPath), plan[key]);
  }
  return compileSemanticPublication(plan);
}
