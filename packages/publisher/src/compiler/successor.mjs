import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { materializeBuildRequestInput } from '../provider/build-request.mjs';
import { composeInteractiveEditionScene } from '../scene/interactive/edition.mjs';
import { composeStaticEditionScene } from '../scene/static/edition.mjs';
import { importLikeC4Layout } from '../semantics/native-likec4.mjs';
import { canonical } from '../semantics/document.mjs';
import { fail } from '../source/manifest.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { renderInteractiveEditionHtml } from '../../renderers/cytoscape/index.mjs';
import { loadBundledFonts } from '../../renderers/fonts/index.mjs';
import { composeStaticEditionSvg } from '../../renderers/svg/index.mjs';
import { selectedEditionCandidateDigest, validateSelectedEditionCandidate } from './candidate.mjs';
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
  const views = meaning.native.selections.filter(({ target }) => target.kind === 'view');
  if (views.length !== 1) fail('static_scene_composition_ambiguous');
  const view = { namespace: views[0].source.namespace, id: views[0].target.id };
  const layout = await importLikeC4Layout({
    lock: selected.lock,
    readSource: selected.readSource,
    view,
  });
  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene);
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
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
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

async function interactiveMedium(meaning) {
  const scene = composeInteractiveEditionScene(meaning);
  const rendered = await renderInteractiveEditionHtml(scene);
  const file = { path: 'interactive/architecture.html', content: rendered.bytes };
  return {
    files: [file],
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
      artifacts: [artifact('architecture-html', file.path, 'text/html', file.content)],
      supplies: rendered.supplies,
    },
  };
}

/** Compile selected native meaning to two independent, unqualified media. */
export async function compileSelectedEditionCandidateInput(requestPath, digest, output) {
  const { target, parent } = await destination(output);
  const selected = await materializeBuildRequestInput(requestPath, digest);
  if (selected.lock.toolchain.profile !== 'portable') fail('edition_toolchain_profile_unadmitted');
  const meaning = await compileEditionMeaning(selected);
  const scratch = await fs.mkdtemp(path.join(parent, '.edition-candidate-'));
  try {
    const media = {};
    const files = [];
    for (const medium of selected.lock.media) {
      const rendered =
        medium === 'static'
          ? await staticMedium(selected, meaning, scratch)
          : await interactiveMedium(meaning);
      media[medium] = rendered.record;
      files.push(...rendered.files);
    }
    const candidate = validateSelectedEditionCandidate({
      schema: 'architecture.edition-candidate/v2',
      qualification: 'unqualified',
      input: {
        lockSha256: selected.lockSha256,
        editionSha256: selected.lock.edition.sha256,
        semanticDigest: meaning.native.semanticDigest,
        parserSupplySha256: meaning.native.parserSupply.sha256,
        closure: selected.closure,
      },
      media,
      obligations: Object.fromEntries(
        selected.lock.media.map((medium) => [medium, meaning.media[medium]]),
      ),
      limits: [...meaning.limits],
    });
    const candidateBytes = Buffer.from(JSON.stringify(candidate, null, 2) + '\n');
    const written = await writeSourceBundle(
      target,
      { id: 'edition-candidate', revision: selected.lockSha256 },
      [{ path: 'candidate.json', content: candidateBytes }, ...files],
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
