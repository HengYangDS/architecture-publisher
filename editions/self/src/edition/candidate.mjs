import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createEditionCandidate, editionCandidateDigest } from 'architecture-publisher/compiler';
import { editionDigest, staticSceneDigest, validateEdition } from 'architecture-publisher/edition';
import { claimModelDigest, validateClaimModel } from 'architecture-publisher/semantics';
import {
  fail,
  isDigest,
  noSymlinkAncestors,
  portablePath,
  readSourceBundle,
  regularBytes,
  writeSourceBundle,
} from 'architecture-publisher/source';
import { renderArchitecturePublisherAtlas } from './atlas.mjs';
import { renderArchitecturePublisherFlagship } from './static-flagship.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const exact = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');

async function selectedEdition(file, expectedSha256) {
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 4 * 1024 * 1024);
  if (sha256(bytes) !== expectedSha256) fail('self_candidate_edition_mismatch');
  try {
    return { bytes, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    fail('self_candidate_edition_invalid');
  }
}

/** Build one exact self Candidate from independently composed sibling media. */
export async function buildArchitecturePublisherCandidate(plan) {
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
    !path.isAbsolute(plan.output ?? '') ||
    !isDigest(plan.sourceSha256) ||
    !isDigest(plan.editionSha256)
  )
    fail('self_candidate_plan_invalid');
  portablePath(plan.semanticMember);
  const parent = path.dirname(plan.output),
    parentStat = await fs.lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('self_candidate_output_parent_invalid');
  try {
    await fs.lstat(plan.output);
    fail('output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const source = await readSourceBundle(plan.sourceManifest, plan.sourceSha256),
    members = new Map(source.members.map((member) => [member.path, member.content])),
    claimModelBytes = members.get(plan.semanticMember);
  if (!claimModelBytes) fail('self_candidate_claim_model_missing');
  let model;
  try {
    model = validateClaimModel(JSON.parse(claimModelBytes));
  } catch {
    fail('self_candidate_claim_model_invalid');
  }
  const selected = await selectedEdition(plan.edition, plan.editionSha256),
    edition = validateEdition(model, selected.value),
    semanticStaticSceneDigest = staticSceneDigest(model, edition);
  if (
    edition.id !== 'architecture-publisher-self' ||
    edition.source.manifestSha256 !== source.manifestSha256
  )
    fail('self_candidate_edition_invalid');

  const scratch = await fs.mkdtemp(path.join(parent, '.publisher-self-candidate-'));
  try {
    const staticOutput = path.join(scratch, 'static-render'),
      interactiveOutput = path.join(scratch, 'architecture-publisher.html'),
      staticResult = await renderArchitecturePublisherFlagship({
        sourceManifest: plan.sourceManifest,
        sourceSha256: plan.sourceSha256,
        edition: plan.edition,
        editionSha256: plan.editionSha256,
        output: staticOutput,
      }),
      interactiveResult = await renderArchitecturePublisherAtlas({
        ...plan,
        output: interactiveOutput,
      }),
      staticBundle = await readSourceBundle(
        staticResult.output.manifestPath,
        staticResult.output.manifestSha256,
      ),
      staticMembers = new Map(staticBundle.members.map((member) => [member.path, member.content])),
      svg = staticMembers.get('architecture-publisher.svg'),
      png = staticMembers.get('architecture-publisher-6000.png'),
      html = await fs.readFile(interactiveOutput);
    if (!svg || !png) fail('self_candidate_static_artifact_missing');
    const candidate = createEditionCandidate({
      sourceManifestSha256: source.manifestSha256,
      claimModelSha256: sha256(claimModelBytes),
      claimModel: model,
      editionSha256: plan.editionSha256,
      edition,
      media: {
        static: {
          sceneSha256: semanticStaticSceneDigest,
          artifacts: [
            {
              id: 'flagship-svg',
              path: 'static/architecture-publisher.svg',
              mediaType: 'image/svg+xml',
              bytes: svg.length,
              sha256: sha256(svg),
            },
            {
              id: 'flagship-png',
              path: 'static/architecture-publisher-6000.png',
              mediaType: 'image/png',
              bytes: png.length,
              sha256: sha256(png),
            },
          ],
          supplies: staticResult.supplies,
        },
        interactive: {
          sceneSha256: interactiveResult.interactiveSceneDigest,
          artifacts: [
            {
              id: 'standalone-atlas',
              path: 'interactive/architecture-publisher.html',
              mediaType: 'text/html',
              bytes: html.length,
              sha256: sha256(html),
            },
          ],
          supplies: interactiveResult.supplies,
        },
      },
    });
    const written = await writeSourceBundle(plan.output, source.source, [
      { path: 'candidate.json', content: encode(candidate) },
      { path: 'static/architecture-publisher.svg', content: svg },
      { path: 'static/architecture-publisher-6000.png', content: png },
      { path: 'interactive/architecture-publisher.html', content: html },
    ]);
    return {
      status: 'built',
      ...written,
      views: interactiveResult.pages,
      candidateSha256: editionCandidateDigest(candidate),
      claimModelDigest: claimModelDigest(model),
      editionDigest: editionDigest(model, edition),
      staticSceneDigest: semanticStaticSceneDigest,
      interactiveSceneDigest: interactiveResult.interactiveSceneDigest,
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
