import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  noSymlinkAncestors,
  readSourceBundle,
  regularBytes,
  writeSourceBundle,
} from 'architecture-publisher/source';
import { fail, isDigest } from 'architecture-publisher/source';
import { canonical, validateClaimModel } from 'architecture-publisher/semantics';
import { editionDigest, validateEdition } from 'architecture-publisher/edition';
import {
  auditCanvasEnvelope,
  auditEmittedEdges,
  auditScene,
  inspectRgbaPngCanvas,
  inspectRgbaPngElements,
} from 'architecture-publisher/qualification';
import { createMetricReader } from 'architecture-publisher/renderers/svg';
import { loadBundledFonts } from 'architecture-publisher/renderers/fonts';
import { rasterize } from 'architecture-publisher/renderers/resvg';
import {
  architecturePublisherStaticScene,
  staticAuthoringDigest,
} from './static-scene.mjs';
import { composeArchitecturePublisherFlagship } from './static/composition.mjs';
import { compileArchitecturePublisherStaticScene } from './static/scene.mjs';
import {
  embedArchitecturePublisherStaticFonts,
  renderArchitecturePublisherStaticSvg,
} from './static/svg.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const exact = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const runtimeSources = Object.freeze({
  'self-static-scene-owner': new URL('./static-scene.mjs', import.meta.url),
  'self-static-composition-owner': new URL('./static/composition.mjs', import.meta.url),
  'self-static-compiler-owner': new URL('./static/scene.mjs', import.meta.url),
  'self-static-svg-owner': new URL('./static/svg.mjs', import.meta.url),
  'self-static-flagship-owner': new URL('./static-flagship.mjs', import.meta.url),
  'self-static-metrics': new URL('./static/authoring/metrics.json', import.meta.url),
});

async function selectedJson(file, digest, code) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !isDigest(digest))
    fail(code);
  const bytes = await fs.readFile(file);
  if (sha256(bytes) !== digest) fail(code);
  try {
    return { bytes, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    fail(code);
  }
}

async function verifyRuntimeSources(model, members) {
  const identities = [];
  for (const [id, file] of Object.entries(runtimeSources)) {
    const selected = model.sources[id],
      bytes = selected && members.get(selected.locator),
      runtime = await fs.readFile(file);
    if (
      !selected ||
      !bytes ||
      sha256(bytes) !== selected.sha256 ||
      sha256(runtime) !== selected.sha256
    )
      fail('self_flagship_runtime_source_mismatch', id);
    identities.push({ id, sha256: selected.sha256 });
  }
  identities.sort(({ id: left }, { id: right }) => left.localeCompare(right));
  return Object.freeze({
    id: 'self-static-runtime',
    sha256: sha256(Buffer.from(JSON.stringify(identities))),
  });
}

function envelopeFraction(canvas) {
  const left = Math.min(...canvas.envelopes.map(({ box }) => box.x)),
    top = Math.min(...canvas.envelopes.map(({ box }) => box.y)),
    right = Math.max(...canvas.envelopes.map(({ box }) => box.x + box.width)),
    bottom = Math.max(...canvas.envelopes.map(({ box }) => box.y + box.height));
  return ((right - left) * (bottom - top)) / (1600 * 900);
}

export async function renderArchitecturePublisherFlagship(plan) {
  if (
    !exact(plan, [
      'sourceManifest',
      'sourceSha256',
      'edition',
      'editionSha256',
      'output',
    ]) ||
    !path.isAbsolute(plan.sourceManifest ?? '') ||
    !path.isAbsolute(plan.edition ?? '') ||
    !path.isAbsolute(plan.output ?? '') ||
    !isDigest(plan.sourceSha256) ||
    !isDigest(plan.editionSha256)
  )
    fail('self_flagship_plan_invalid');
  try {
    await fs.lstat(plan.output);
    fail('output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const source = await readSourceBundle(plan.sourceManifest, plan.sourceSha256),
    members = new Map(source.members.map((member) => [member.path, member.content])),
    semanticBytes = members.get('semantic.json');
  if (!semanticBytes) fail('self_flagship_semantic_missing');
  let model;
  try {
    model = validateClaimModel(JSON.parse(semanticBytes));
  } catch {
    fail('self_flagship_semantic_invalid');
  }
  const runtimeSupply = await verifyRuntimeSources(model, members);
  const selectedEdition = await selectedJson(
      plan.edition,
      plan.editionSha256,
      'self_flagship_edition_invalid',
    ),
    edition = validateEdition(model, selectedEdition.value);
  if (
    edition.id !== 'architecture-publisher-self' ||
    edition.class !== 'flagship' ||
    edition.source.manifestSha256 !== source.manifestSha256
  )
    fail('self_flagship_edition_invalid');

  if (
    canonical(edition.scenes.static) !==
    canonical(
      architecturePublisherStaticScene(staticAuthoringDigest(model.sources)),
    )
  )
    fail('self_flagship_scene_mismatch');
  const metrics = JSON.parse(
      await fs.readFile(new URL('./static/authoring/metrics.json', import.meta.url)),
    ),
    reader = createMetricReader(metrics),
    composition = composeArchitecturePublisherFlagship();
  if (
    edition.scenes.static.authoredInputSha256 !==
    staticAuthoringDigest(model.sources)
  )
    fail('self_flagship_scene_mismatch');
  const scene = compileArchitecturePublisherStaticScene(composition, reader.measure),
    supply = await loadBundledFonts(),
    selectedFonts = supply.fonts.filter((font) => [400, 600].includes(font.weight)),
    rasterSvg = renderArchitecturePublisherStaticSvg(scene),
    quality = {
      schema: 'architecture.publisher-static-quality/v1',
      hard_gates: {
        geometry_each_scale: {
          canvas_clearance_source_units_min: 24,
          font_width_growth_fraction: 0.04,
          font_height_growth_fraction: 0.04,
        },
      },
    },
    geometry = auditScene(scene, {
      minimumFont: 10,
      ownerClearance: 8,
      textClearance: 5,
      endpointTolerance: 1,
      minimumTerminal: 14,
      widthGrowth: 0.04,
      heightGrowth: 0.04,
    }),
    emittedEdges = auditEmittedEdges(rasterSvg.toString('utf8'), scene, {
      endpointTolerance: 1,
      minimumTerminal: 14,
    }),
    envelope = auditCanvasEnvelope(scene, quality),
    canvas = {
      width: scene.width,
      height: scene.height,
      occupiedEnvelopeFraction: envelopeFraction(envelope),
      minimumClearance: envelope.minimumClearance,
      failures: envelope.failures,
    },
    coverage = structuredClone(scene.coverage),
    checks = {
      geometry,
      emittedEdges,
      canvas,
      scope:
        'Analytic authored-scene, emitted-SVG and canvas-envelope checks. Browser paint, aesthetic acceptance and publication are not performed.',
    };
  if (
    geometry.failures.length ||
    emittedEdges.failures.length ||
    canvas.failures.length ||
    coverage.missingEntities.length ||
    coverage.missingRelations.length ||
    coverage.duplicateEntities.length ||
    coverage.duplicateRelations.length
  )
    fail('self_flagship_checks_failed');

  const parent = await fs.realpath(path.dirname(plan.output)),
    scratch = await fs.mkdtemp(path.join(parent, '.publisher-self-static-'));
  try {
    const rasterInput = await writeSourceBundle(
        path.join(scratch, 'raster-input'),
        { id: 'architecture-publisher:self-static', revision: plan.editionSha256 },
        [
          { path: 'flagship.svg', content: rasterSvg },
          ...selectedFonts.map((font) => ({
            path: `fonts/${font.path}`,
            content: font.bytes,
          })),
        ],
      ),
      pngFile = path.join(scratch, 'flagship-6000.png'),
      raster = await rasterize({
        manifest: rasterInput.manifestPath,
        manifestSha256: rasterInput.manifestSha256,
        svg: 'flagship.svg',
        fonts: selectedFonts.map((font) => ({
          path: `fonts/${font.path}`,
          family: 'JetBrains Mono',
          weight: font.weight,
        })),
        width: 6000,
        output: pngFile,
      }),
      png = await fs.readFile(pngFile),
      rasterCanvas = inspectRgbaPngCanvas(png, {
        background: [243, 240, 232, 255],
        colorDistance: 8,
        minimumClearance: 90,
      }),
      rasterElements = inspectRgbaPngElements(png, scene, {
        background: [243, 240, 232, 255],
        colorDistance: 8,
        sourcePadding: 2,
        paintTolerance: 18,
      }),
      svg = embedArchitecturePublisherStaticFonts(rasterSvg, selectedFonts),
      output = await writeSourceBundle(
        plan.output,
        {
          id: 'architecture-publisher:self-static',
          revision: plan.editionSha256,
        },
        [
          { path: 'architecture-publisher.svg', content: svg },
          { path: 'architecture-publisher-6000.png', content: png },
          { path: 'scene.json', content: encode(scene) },
          { path: 'coverage.json', content: encode(coverage) },
          {
            path: 'checks.json',
            content: encode({ ...checks, rasterCanvas, rasterElements }),
          },
          { path: 'FONT-LICENSE.txt', content: supply.license.bytes },
        ],
      );
    return {
      status: 'rendered',
      sourceSha256: plan.sourceSha256,
      semanticSha256: sha256(semanticBytes),
      editionSha256: plan.editionSha256,
      editionDigest: editionDigest(model, edition),
      sceneSha256: sha256(encode(scene)),
      svgSha256: sha256(svg),
      pngSha256: raster.artifact.sha256,
      staticWidth: raster.width,
      staticHeight: raster.height,
      supplies: [
        { id: 'font-supply', sha256: supply.sha256 },
        { id: 'raster-supply', sha256: raster.supply.sha256 },
        runtimeSupply,
      ],
      output,
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function renderArchitecturePublisherFlagshipInput(file) {
  const selected = path.resolve(file);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, 1024 * 1024);
  let input;
  try {
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('self_flagship_plan_invalid');
  }
  if (
    !exact(input, [
      'sourceManifest',
      'sourceSha256',
      'semanticMember',
      'edition',
      'editionSha256',
      'output',
    ]) ||
    input.semanticMember !== 'semantic.json'
  )
    fail('self_flagship_plan_invalid');
  const base = path.dirname(selected);
  return renderArchitecturePublisherFlagship({
    sourceManifest: path.resolve(base, input.sourceManifest),
    sourceSha256: input.sourceSha256,
    edition: path.resolve(base, input.edition),
    editionSha256: input.editionSha256,
    output: path.resolve(base, input.output),
  });
}
