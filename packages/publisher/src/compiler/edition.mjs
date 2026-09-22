import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readSourceBundle } from '../source/bundle.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, isDigest, portablePath } from '../source/manifest.mjs';
import { interactiveArchitectureScene } from '../scene/interactive/architecture.mjs';
import { semanticArchitectureProjections } from '../scene/contract.mjs';
import { composeStaticOverview } from '../../renderers/svg/architecture.mjs';
import { canonical, claimModelDigest, validateClaimModel } from '../semantics/document.mjs';
import {
  editionDigest,
  editionQualificationObligations,
  interactiveSceneDigest,
  staticSceneDigest,
  validateEdition,
} from '../edition/contract.mjs';
import { renderArchitectureScene } from '../../renderers/archify/index.mjs';
import { loadBundledFonts } from '../../renderers/fonts/index.mjs';
import { rasterize } from '../../renderers/resvg/index.mjs';
import { editionCandidateDigest, validateEditionCandidate } from './candidate.mjs';
import { resolveEditionProviderSelection } from '../provider/input.mjs';
import { withMaterializedEditionProvider } from '../provider/materialize.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exact = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');

function json(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
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
    if (!content || sha(content) !== source.sha256) fail('semantic_source_binding_mismatch', id);
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
  const xml = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const css = fonts
    .map(
      (font) =>
        "@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:" +
        font.weight +
        ';font-display:block;src:url(data:font/ttf;base64,' +
        font.bytes.toString('base64') +
        ") format('truetype');}",
    )
    .join('\n');
  return Buffer.from(
    svg
      .toString('utf8')
      .replace(
        '</svg>',
        '<style>' +
          css +
          '</style><metadata id="font-license">' +
          xml(license.bytes.toString('utf8')) +
          '</metadata></svg>',
      ),
  );
}

/** Compile one exact Edition Candidate across independent media.
 * @internal Focused verification seam; compileEditionCandidateInput is public. */
export async function compileEditionCandidate(plan, providerReceipt = null) {
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
    fail('edition_candidate_plan_invalid');
  portablePath(plan.semanticMember);
  const source = await readSourceBundle(plan.sourceManifest, plan.sourceSha256),
    members = new Map(source.members.map((item) => [item.path, item.content])),
    semanticBytes = members.get(plan.semanticMember);
  if (!semanticBytes) fail('edition_candidate_document_missing');
  const document = validateClaimModel(json(semanticBytes, 'edition_candidate_document_invalid')),
    digest = claimModelDigest(document),
    selected = await selectedEdition(plan.edition, plan.editionSha256),
    edition = validateEdition(document, selected.value),
    selectedEditionDigest = editionDigest(document, edition),
    selectedStaticSceneDigest = staticSceneDigest(document, edition),
    selectedInteractiveSceneDigest = interactiveSceneDigest(document, edition),
    projections = semanticArchitectureProjections(document, selected.value),
    parent = path.dirname(plan.output),
    parentStat = await fs.lstat(parent);
  sourceBindings(document, members);
  if (edition.source.manifestSha256 !== source.manifestSha256) fail('edition_source_mismatch');
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('edition_candidate_output_parent_invalid');
  const scratch = await fs.mkdtemp(path.join(parent, '.edition-candidate-'));
  try {
    const artifacts = [],
      receipts = [],
      staticResult = composeStaticOverview(document, selected.value, projections.staticScene),
      selectedFonts = await loadBundledFonts(),
      fonts = selectedFonts.fonts.filter((font) => [400, 600].includes(font.weight)),
      overviewSvg = standaloneSvg(staticResult.bytes, fonts, selectedFonts.license),
      overviewPng = await renderOverviewPng(scratch, staticResult.bytes, source.source, fonts);
    for (const view of projections.interactiveScenes) {
      const output = path.join(scratch, view.id + '.html'),
        scene = interactiveArchitectureScene(document, selected.value, view),
        receipt = await renderArchitectureScene({
          scene,
          output,
        }),
        html = await fs.readFile(output);
      artifacts.push({ path: `views/${view.id}.html`, content: html });
      receipts.push({
        id: view.id,
        purpose: view.purpose,
        htmlSha256: sha(html),
        bytes: html.length,
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
        supplies: receipt.supplies,
      });
    }
    artifacts.push(
      { path: 'overview.svg', content: overviewSvg },
      { path: 'overview.png', content: overviewPng.bytes },
      { path: 'semantic.json', content: semanticBytes },
      { path: 'edition.json', content: selected.bytes },
    );
    const candidate = validateEditionCandidate({
      schema: 'architecture.edition-candidate/v1',
      source: {
        manifestSha256: source.manifestSha256,
      },
      claimModel: {
        sha256: sha(semanticBytes),
        digest,
      },
      edition: {
        sha256: plan.editionSha256,
        digest: selectedEditionDigest,
      },
      media: {
        static: {
          sceneSha256: selectedStaticSceneDigest,
          artifacts: [
            {
              id: 'overview-svg',
              path: 'overview.svg',
              mediaType: 'image/svg+xml',
              bytes: overviewSvg.length,
              sha256: sha(overviewSvg),
            },
            {
              id: 'overview-png',
              path: 'overview.png',
              mediaType: 'image/png',
              bytes: overviewPng.bytes.length,
              sha256: sha(overviewPng.bytes),
            },
          ],
          supplies: [
            { id: 'font-supply', sha256: selectedFonts.sha256 },
            { id: 'raster-supply', sha256: overviewPng.result.supply.sha256 },
          ],
        },
        interactive: {
          sceneSha256: selectedInteractiveSceneDigest,
          artifacts: receipts.map(({ id, htmlSha256, bytes }) => ({
            id,
            path: `views/${id}.html`,
            mediaType: 'text/html',
            bytes,
            sha256: htmlSha256,
          })),
          supplies: [
            ...new Map(
              receipts.flatMap(({ supplies }) => supplies).map((supply) => [supply.id, supply]),
            ).values(),
          ],
        },
      },
      obligations: editionQualificationObligations(document, edition),
    });
    artifacts.unshift({
      path: 'candidate.json',
      content: Buffer.from(JSON.stringify(candidate, null, 2) + '\n'),
    });
    let providerMaterializationSha256;
    if (providerReceipt !== null) {
      const bytes = Buffer.from(canonical(providerReceipt));
      artifacts.push({ path: 'provider.json', content: bytes });
      providerMaterializationSha256 = sha(bytes);
    }
    const written = await writeSourceBundle(plan.output, source.source, artifacts);
    const result = {
      status: 'built',
      ...written,
      views: receipts.length,
      candidateSha256: editionCandidateDigest(candidate),
      semanticDigest: digest,
      editionDigest: selectedEditionDigest,
      staticSceneDigest: selectedStaticSceneDigest,
      interactiveSceneDigest: selectedInteractiveSceneDigest,
    };
    return providerReceipt === null ? result : { ...result, providerMaterializationSha256 };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function compileEditionCandidateInput(file, digest) {
  const planPath = path.resolve(file),
    plan = await selectedPlan(planPath, digest);
  if (
    exact(plan, [
      'sourceManifest',
      'sourceSha256',
      'semanticMember',
      'edition',
      'editionSha256',
      'output',
    ])
  ) {
    for (const key of ['sourceManifest', 'edition', 'output']) {
      if (typeof plan[key] !== 'string' || !plan[key]) fail('edition_candidate_plan_invalid');
      plan[key] = path.resolve(path.dirname(planPath), plan[key]);
    }
    return compileEditionCandidate(plan);
  }
  const selection = resolveEditionProviderSelection(planPath, plan);
  return withMaterializedEditionProvider(selection, (materialized, receipt) =>
    compileEditionCandidate(materialized, receipt),
  );
}
