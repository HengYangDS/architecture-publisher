import { sceneRefinementValid } from './generated/validators.mjs';
import { deepFreeze } from '../semantics/document.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { fail, isDigest } from '../source/manifest.mjs';

/** Admit only bounded presentation data, never pre-rendered media or assertions. */
export function parseSelectedSceneRefinement(bytes, media, sha256) {
  if (!Buffer.isBuffer(bytes) || !Array.isArray(media) || !isDigest(sha256))
    fail('scene_refinement_invalid');
  const value = parseStrictJson(bytes, 'scene_refinement_invalid', 'scene_refinement_invalid');
  if (value?.schema !== 'architecture.scene-refinement/v1') fail('scene_refinement_invalid');
  if (
    value.media === null ||
    typeof value.media !== 'object' ||
    Array.isArray(value.media) ||
    Object.keys(value.media).sort().join('\n') !== [...media].sort().join('\n')
  )
    fail('scene_refinement_medium_unadmitted');
  if (!sceneRefinementValid(value)) fail('scene_refinement_invalid');
  if (Object.values(value.media).every((decision) => decision.kind === 'neutral'))
    fail('scene_refinement_invalid');
  return deepFreeze({ schema: value.schema, sha256, media: value.media });
}
