import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { materializeBuildRequestInput } from '../provider/build-request.mjs';
import { composeInteractiveHtml } from '../rendering/interactive-html.mjs';
import { composeAuthoredInteractiveArchitecture } from '../scene/interactive/authored-architecture.mjs';
import { composeInteractiveEditionScene } from '../scene/interactive/edition.mjs';
import { composeAuthoredStaticCanvas } from '../scene/static/authored-canvas.mjs';
import {
  composeGroupedSelectionLayout,
  composeSelectedStaticRefinementLayout,
  selectedStaticNativeViews,
} from '../scene/static/grouped-selection.mjs';
import { composeStaticEditionScene } from '../scene/static/edition.mjs';
import { importLikeC4Layout } from '../semantics/native-likec4.mjs';
import { canonical } from '../semantics/document.mjs';
import { fail } from '../source/manifest.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { renderInteractiveEditionHtml } from '../../renderers/cytoscape/index.mjs';
import { renderArchitectureScene } from '../../renderers/archify/index.mjs';
import { loadBundledFonts } from '../../renderers/fonts/index.mjs';
import { composeStaticEditionSvg, renderAuthoredCanvasSvg } from '../../renderers/svg/index.mjs';
import { selectedEditionCandidateDigest, validateSelectedEditionCandidate } from './candidate.mjs';
import { validateVisibleSelection } from './coverage.mjs';
import { compileEditionMeaning } from './meaning.mjs';
import { embedFonts, rasterizeSvg } from './media.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const artifact = (id, artifactPath, mediaType, content) => ({
  id,
  path: artifactPath,
  mediaType,
  bytes: content.length,
  sha256: sha(content),
});

async function destination(output) {
  const target = path.resolve(output);
  const parent = path.dirname(target);
  let parentStat;
  try {
    parentStat = await fs.lstat(parent);
    if (!parentStat.isDirectory() || parentStat.isSymbolicLink())
      fail('edition_candidate_output_parent_invalid');
    if ((await fs.realpath(parent)) !== parent) fail('edition_candidate_output_parent_invalid');
  } catch (error) {
    if (error?.code === 'ENOENT') fail('edition_candidate_output_parent_invalid');
    throw error;
  }
  try {
    await fs.lstat(target);
    fail('edition_candidate_output_exists');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return { target, parent };
}

async function staticMedium(selected, meaning, scratch) {
  const staticRefinement = meaning.refinement?.media?.static;
  const authoredCanvas = staticRefinement?.kind === 'authored-canvas';
  const claimMode = meaning.native.selections.some(
    ({ format }) => format === 'architecture.claim-model/v2',
  );
  let layout = null;
  if (staticRefinement && staticRefinement.kind !== 'neutral' && !authoredCanvas)
    layout = composeSelectedStaticRefinementLayout(meaning, meaning.refinement);
  else if (!authoredCanvas && meaning.editorial.presentation.static.views[0].groups !== undefined)
    layout = composeGroupedSelectionLayout(meaning);
  else if (!authoredCanvas && !claimMode) {
    const views = selectedStaticNativeViews(meaning, meaning.media.static.views[0]);
    if (views.length !== 1) fail('static_scene_composition_ambiguous');
    const view = { namespace: views[0].source.namespace, id: views[0].target.id };
    layout = await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view,
    });
  }
  let scene;
  let rendered;
  let limits = [];
  if (authoredCanvas) {
    const authored = composeAuthoredStaticCanvas(meaning);
    scene = authored.scene;
    const rasterWidth = meaning.editorial.presentation.static.width;
    if (!Number.isSafeInteger(rasterWidth)) fail('authored_canvas_width_required');
    rendered = {
      bytes: renderAuthoredCanvasSvg(scene),
      rasterWidth,
      carriers: authored.carriers,
    };
    limits = authored.limits;
  } else {
    scene = composeStaticEditionScene(meaning, layout);
    rendered = composeStaticEditionSvg(scene);
    validateVisibleSelection(meaning, 'static', scene, rendered.carriers);
  }
  const fontSupply = await loadBundledFonts();
  const fonts = fontSupply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  if (fonts.length !== 2 || !fontSupply.license?.bytes) fail('static_edition_font_supply_invalid');
  const svg = embedFonts(rendered.bytes, fonts, fontSupply.license);
  const png = await rasterizeSvg(
    scratch,
    rendered.bytes,
    { id: selected.lock.edition.id, revision: selected.lockSha256 },
    fonts,
    rendered.rasterWidth,
  );
  const files = [
    { path: 'static/architecture.svg', content: svg },
    { path: 'static/architecture.png', content: png.bytes },
  ];
  return {
    files,
    limits,
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
      carrierSha256: sha(Buffer.from(canonical(rendered.carriers))),
      artifacts: [
        artifact('architecture-svg', files[0].path, 'image/svg+xml', svg),
        artifact('architecture-png', files[1].path, 'image/png', png.bytes),
      ],
      supplies: [
        { id: 'font-supply', sha256: fontSupply.sha256 },
        { id: 'raster-supply', sha256: png.result.supply.sha256 },
      ],
    },
  };
}

async function authoredInteractiveMedium(selected, meaning, scratch) {
  const authored = composeAuthoredInteractiveArchitecture(meaning);
  const sourceRecords = [
    ...new Map(
      meaning.native.selections.map(({ source, sourceClass }) => [
        source.namespace,
        { ...source, kind: sourceClass },
      ]),
    ).values(),
  ];
  const sources = sourceRecords.map((source, index) => ({
    id: `selected-${index + 1}`,
    kind: source.kind,
    namespace: source.namespace,
    sha256: source.sha256,
    claimant: source.claimant,
  }));
  const sourceIds = new Map(sources.map(({ namespace, id }) => [namespace, id]));
  if (sourceIds.size !== sources.length) fail('authored_interactive_source_ambiguous');
  const pageRecords = [];
  const supplies = new Map();
  for (const page of authored.pages) {
    const output = path.join(scratch, `${page.id}.html`);
    const rendered = await renderArchitectureScene({ scene: page.scene, output });
    const content = await fs.readFile(output);
    for (const supply of rendered.supplies) {
      const previous = supplies.get(supply.id);
      if (previous && previous.sha256 !== supply.sha256)
        fail('authored_interactive_supply_conflict');
      supplies.set(supply.id, supply);
    }
    const subjectSources = Object.fromEntries(
      Object.entries(page.subjectNamespaces).map(([id, namespaces]) => {
        const selectedIds = namespaces.map((namespace) => sourceIds.get(namespace));
        if (selectedIds.some((value) => !value)) fail('authored_interactive_source_unbound');
        return [id, [...new Set(selectedIds)].sort()];
      }),
    );
    pageRecords.push({
      id: page.id,
      label: page.label,
      shortLabel: page.id
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' '),
      purpose: page.purpose,
      path: `views/${page.id}.html`,
      sha256: sha(content),
      sourceIds: [...new Set(Object.values(subjectSources).flat())].sort(),
      subjectSources,
      facts: page.facts,
      content,
    });
  }
  const bytes = composeInteractiveHtml({
    schema: 'architecture.interactive-html-composition/v1',
    title: meaning.editorial.title,
    build: {
      lockSha256: selected.lockSha256,
      editionSha256: selected.lock.edition.sha256,
      semanticDigest: meaning.native.semanticDigest,
    },
    overview: authored.pages[0].id,
    pages: pageRecords,
    sources,
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
  });
  const file = { path: 'interactive/architecture.html', content: bytes };
  return {
    files: [file],
    limits: authored.limits,
    record: {
      sceneSha256: sha(Buffer.from(canonical(authored.pages.map(({ scene }) => scene)))),
      carrierSha256: sha(Buffer.from(canonical(authored.carriers))),
      artifacts: [artifact('architecture-html', file.path, 'text/html', bytes)],
      supplies: [...supplies.values()],
    },
  };
}

async function interactiveMedium(selected, meaning, scratch) {
  if (meaning.refinement?.media?.interactive?.kind === 'authored-architecture')
    return authoredInteractiveMedium(selected, meaning, scratch);
  const scene = composeInteractiveEditionScene(meaning);
  const rendered = await renderInteractiveEditionHtml(scene);
  validateVisibleSelection(meaning, 'interactive', scene, rendered.carriers);
  const file = { path: 'interactive/architecture.html', content: rendered.bytes };
  return {
    files: [file],
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
      carrierSha256: sha(Buffer.from(canonical(rendered.carriers))),
      artifacts: [artifact('architecture-html', file.path, 'text/html', file.content)],
      supplies: rendered.supplies,
    },
  };
}

/** Compile selected native meaning to two independent, unqualified media. */
export async function compileSelectedEditionCandidateInput(
  requestPath,
  digest,
  output,
  executionChoice,
) {
  const { target, parent } = await destination(output);
  const selected = await materializeBuildRequestInput(requestPath, digest, executionChoice);
  if (selected.lock.toolchain.profile !== 'portable') fail('edition_toolchain_profile_unadmitted');
  const meaning = await compileEditionMeaning(selected);
  const scratch = await fs.mkdtemp(path.join(parent, '.edition-candidate-'));
  try {
    const media = {};
    const files = [];
    const mediumLimits = [];
    for (const medium of selected.lock.media) {
      const rendered =
        medium === 'static'
          ? await staticMedium(selected, meaning, scratch)
          : await interactiveMedium(selected, meaning, scratch);
      media[medium] = rendered.record;
      files.push(...rendered.files);
      mediumLimits.push(...(rendered.limits ?? []));
    }
    const candidate = validateSelectedEditionCandidate({
      schema: 'architecture.edition-candidate/v2',
      qualification: 'unqualified',
      input: {
        lockSha256: selected.lockSha256,
        editionSha256: selected.lock.edition.sha256,
        semanticDigest: meaning.native.semanticDigest,
        semanticSupplies: meaning.native.parserSupply === null ? [] : [meaning.native.parserSupply],
        closure: selected.closure,
      },
      media,
      obligations: Object.fromEntries(
        selected.lock.media.map((medium) => [medium, meaning.media[medium]]),
      ),
      limits: [...new Set([...meaning.limits, ...mediumLimits])],
    });
    const candidateBytes = Buffer.from(JSON.stringify(candidate, null, 2) + '\n');
    const written = await writeSourceBundle(
      target,
      { id: 'edition-candidate', revision: selected.lockSha256 },
      [
        { path: 'input-lock.json', content: Buffer.from(selected.lockJson) },
        { path: 'candidate.json', content: candidateBytes },
        ...files,
      ],
    );
    return {
      status: 'built',
      output: target,
      ...written,
      lockSha256: selected.lockSha256,
      candidateSha256: selectedEditionCandidateDigest(candidate),
      media: Object.keys(media),
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
