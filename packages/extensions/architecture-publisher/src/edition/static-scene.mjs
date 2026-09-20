import { createHash } from 'node:crypto';
import { SELF_ENTITY_IDS, SELF_RELATION_IDS } from './model.mjs';
import { composeArchitecturePublisherFlagship } from './static/composition.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function staticAuthoringDigest(sources) {
  for (const id of [
    'self-static-composition-owner',
    'self-static-metrics',
  ])
    if (typeof sources?.[id]?.sha256 !== 'string')
      throw Object.assign(new Error('self_static_authoring_source_missing'), {
        code: 'self_static_authoring_source_missing',
      });
  return sha256(
    Buffer.from(
      JSON.stringify({
        compositionSha256: sources['self-static-composition-owner'].sha256,
        metricsSha256: sources['self-static-metrics'].sha256,
      }),
    ),
  );
}

export function architecturePublisherStaticScene(authoredInputSha256) {
  if (
    typeof authoredInputSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(authoredInputSha256)
  )
    throw Object.assign(new Error('self_static_authoring_digest_invalid'), {
      code: 'self_static_authoring_digest_invalid',
    });
  const authored = composeArchitecturePublisherFlagship();
  return {
    label: authored.subtitle,
    questions: ['overview'],
    claims: [
      ...SELF_ENTITY_IDS.map((id) => 'role-' + id),
      ...SELF_RELATION_IDS.map((id) => 'flow-' + id),
    ],
    composition: structuredClone(authored.editionComposition),
    authoredInputSha256,
  };
}
