import {
  SELF_ENTITY_IDS,
  SELF_RELATION_IDS,
  SELF_RELATIONS,
} from './model.mjs';

const overviewGroups = Object.freeze([
  ['source-field', 'Source field', ['accepted-intent', 'implementation', 'runtime-observation', 'evidence']],
  ['intake', 'Loss-aware intake', ['source-adapter', 'source-bundle']],
  ['semantic-contract', 'Semantic contract', ['claim-model', 'uncertainty']],
  ['authorship', 'Editorial contract', ['edition', 'build-request', 'publisher-core']],
  ['scenes', 'Independent scenes', ['static-scene', 'interactive-scenes']],
  ['rendering', 'Replaceable rendering', ['static-artifact', 'static-renderer', 'interactive-renderer', 'interactive-atlas']],
  ['candidate', 'Exact candidate', ['edition-candidate']],
  ['qualification', 'Non-compensating qualification', ['human-review', 'qualification-set', 'acceptance']],
  ['authorization', 'Explicit effect admission', ['authorization']],
  ['effects', 'Recoverable publication', ['publication', 'recovery', 'off-host-recovery']],
  ['adoption', 'Independent consumers', ['self-consumer', 'ethos-consumer', 'aigw-consumer']],
  ['return', 'Native source lifecycle', ['feedback']],
  ['evolution', 'Conservative evolution', ['evolution-inputs', 'semantic-delta', 'affected-views']],
  ['renewal', 'Independent renewal obligations', ['rebuild-obligations', 'semantic-verification-obligations', 'medium-verification-obligations', 'human-review-obligations', 'acceptance-obligations', 'publication-obligations']],
]);

const mechanisms = Object.freeze({
  semantics: {
    label: 'Source-bound meaning and uncertainty',
    groups: [
      overviewGroups[0],
      overviewGroups[1],
      overviewGroups[2],
      ['audience', 'Reader contract', ['edition']],
    ],
    relations: [
      'intent-enters-adapter',
      'implementation-enters-adapter',
      'observation-enters-adapter',
      'evidence-enters-bundle',
      'adapter-builds-bundle',
      'bundle-binds-claims',
      'claims-inform-edition',
      'uncertainty-broadens-edition',
    ],
  },
  edition: {
    label: 'Audience-specific Edition contract',
    groups: [
      ['meaning', 'Meaning', ['claim-model', 'uncertainty']],
      ['authorship', 'Authorship', ['edition', 'build-request', 'publisher-core']],
      ['scenes', 'Independent scenes', ['static-scene', 'interactive-scenes']],
    ],
    relations: [
      'claims-inform-edition',
      'uncertainty-broadens-edition',
      'edition-authors-static',
      'edition-authors-interactive',
      'claims-select-build',
      'edition-selects-build',
      'build-invokes-core',
      'core-compiles-static',
      'core-compiles-interactive',
    ],
  },
  composition: {
    label: 'Independent static and interactive composition',
    groups: [
      ['authorship', 'Authorship and compilation', ['edition', 'build-request', 'publisher-core']],
      ['scenes', 'Scenes', ['static-scene', 'interactive-scenes']],
      ['rendering', 'Replaceable rendering', ['static-renderer', 'interactive-renderer']],
      ['artifacts', 'Exact artifacts', ['static-artifact', 'interactive-atlas']],
      ['candidate', 'Edition Candidate', ['edition-candidate']],
    ],
    relations: [
      'edition-authors-static',
      'edition-authors-interactive',
      'edition-selects-build',
      'build-invokes-core',
      'core-compiles-static',
      'core-compiles-interactive',
      'static-scene-enters-renderer',
      'interactive-scenes-enter-renderer',
      'backend-renders-static',
      'backend-renders-interactive',
      'static-enters-candidate',
      'interactive-enters-candidate',
    ],
  },
  qualification: {
    label: 'Non-compensating qualification',
    groups: [
      ['candidate', 'Exact candidate', ['edition-candidate']],
      ['judgment', 'Judgment', ['human-review', 'qualification-set', 'acceptance']],
      ['effect-admission', 'Effect admission', ['authorization']],
    ],
    relations: [
      'candidate-enters-qualification',
      'human-review-enters-qualification',
      'qualification-precedes-acceptance',
      'acceptance-precedes-authorization',
    ],
  },
  'publication-recovery': {
    label: 'Authorized publication and recovery',
    groups: [
      ['admission', 'Admission', ['qualification-set', 'acceptance', 'authorization']],
      ['effects', 'Effects', ['publication', 'recovery', 'off-host-recovery']],
    ],
    relations: [
      'qualification-precedes-acceptance',
      'acceptance-precedes-authorization',
      'authorization-precedes-publication',
      'publication-supports-recovery',
      'recovery-excludes-off-host',
    ],
  },
  adoption: {
    label: 'Independent adoption and native feedback',
    groups: [
      ['delivery', 'Publication', ['publication']],
      ['consumers', 'Consumers', ['self-consumer', 'ethos-consumer', 'aigw-consumer']],
      ['return', 'Native source lifecycle', ['feedback', 'source-adapter']],
    ],
    relations: [
      'publication-serves-self',
      'publication-serves-ethos',
      'publication-serves-aigw',
      'publication-returns-feedback',
      'feedback-returns-to-adapter',
    ],
  },
  evolution: {
    label: 'Conservative semantic evolution',
    groups: [
      ['inputs', 'Exact before and after', ['claim-model', 'edition', 'evolution-inputs']],
      ['delta', 'Meaning change', ['semantic-delta']],
      ['impact', 'Affected Editions and scenes', ['affected-views']],
      ['rebuild', 'Rebuild', ['rebuild-obligations']],
      ['verification', 'Fresh verification', ['semantic-verification-obligations', 'medium-verification-obligations']],
      ['review', 'Fresh judgment', ['human-review-obligations', 'acceptance-obligations']],
      ['effect', 'Publication renewal', ['publication-obligations']],
      ['renewed-values', 'Renewed values', ['static-scene', 'interactive-scenes', 'qualification-set', 'human-review', 'acceptance', 'publication']],
    ],
    relations: [
      'models-enter-evolution',
      'edition-enters-evolution',
      'evolution-produces-delta',
      'delta-identifies-affected-views',
      'affected-views-require-rebuild',
      'affected-views-require-semantic-verification',
      'affected-views-require-medium-verification',
      'affected-views-require-human-review',
      'affected-views-require-acceptance',
      'affected-views-require-publication',
      'rebuild-renews-static',
      'rebuild-renews-interactive',
      'semantic-verification-renews-claims',
      'medium-verification-renews-qualification',
      'human-review-obligation-renews-review',
      'acceptance-obligation-renews-acceptance',
      'publication-obligation-renews-publication',
    ],
  },
});

const group = ([id, label, entities]) => ({ id, label, entities: [...entities] });
function relation(groups, id, sourceOffset = 0) {
  const { subject, object } = SELF_RELATIONS[id];
  let from;
  let to;
  for (const [row, descriptor] of groups.entries())
    for (const [column, entity] of descriptor[2].entries()) {
      if (entity === subject) from = { row, column };
      if (entity === object) to = { row, column };
    }
  if (!from || !to) throw Error('self_scene_relation_endpoint_missing: ' + id);
  if (from.row === to.row)
    return {
      id,
      fromSide: from.column < to.column ? 'right' : 'left',
      toSide: from.column < to.column ? 'left' : 'right',
      route: 'straight',
    };
  return {
    id,
    fromSide: from.row < to.row ? 'bottom' : 'top',
    toSide: from.row < to.row ? 'top' : 'bottom',
    route: 'auto',
    labelSegment: 0,
    labelDx: sourceOffset,
  };
}
function relationsFor(groups, ids) {
  const bySource = new Map();
  for (const id of ids) {
    const subject = SELF_RELATIONS[id].subject,
      siblings = bySource.get(subject) ?? [];
    siblings.push(id);
    bySource.set(subject, siblings);
  }
  const offsets = new Map();
  for (const siblings of bySource.values())
    siblings.forEach((id, index) =>
      offsets.set(id, (index - (siblings.length - 1) / 2) * 128),
    );
  return ids.map((id) => relation(groups, id, offsets.get(id)));
}
const claimsFor = (groups, relations) => [
  ...new Set([
    ...groups.flatMap(([, , entities]) => entities.map((id) => 'role-' + id)),
    ...relations.map((id) => 'flow-' + id),
  ]),
];

export function architecturePublisherInteractiveScenes() {
  const overview = {
    label: 'The complete semantic publication system',
    purpose: 'overview',
    questions: ['overview'],
    claims: [
      ...SELF_ENTITY_IDS.map((id) => 'role-' + id),
      ...SELF_RELATION_IDS.map((id) => 'flow-' + id),
    ],
    composition: {
      groups: overviewGroups.map(group),
      relations: relationsFor(overviewGroups, SELF_RELATION_IDS),
    },
  };
  return Object.fromEntries([
    ['overview', overview],
    ...Object.entries(mechanisms).map(([id, view]) => [
      id,
      {
        label: view.label,
        purpose: 'mechanism',
        questions: [id],
        claims: claimsFor(view.groups, view.relations),
        composition: {
          groups: view.groups.map(group),
          relations: relationsFor(view.groups, view.relations),
        },
      },
    ]),
  ]);
}
