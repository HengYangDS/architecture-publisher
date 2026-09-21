import { SELF_ENTITY_IDS, SELF_RELATION_IDS } from '../model.mjs';

const entity = (id) => `entity:${id}`;
const relation = (id) => `relation:${id}`;
const entities = (...ids) => ids.map(entity);
const relations = (...ids) => ids.map(relation);
const point = (x, y) => ({ x, y });

const PIPELINE = Object.freeze([
  {
    id: 'source-field',
    title: 'Source',
    lines: ['intent · code', 'runtime · evidence', 'adapter · bundle'],
    semantics: entities(
      'accepted-intent',
      'implementation',
      'runtime-observation',
      'evidence',
      'source-adapter',
      'source-bundle',
    ),
    x: 112,
    y: 300,
    r: 8,
    tone: 'ink',
    titleY: 246,
    lineY: 344,
  },
  {
    id: 'semantic-contract',
    title: 'Claim Model',
    lines: ['typed meaning', 'provenance · unknowns'],
    semantics: entities('claim-model', 'uncertainty'),
    x: 250,
    y: 300,
    r: 10,
    tone: 'ink',
    titleY: 246,
    lineY: 344,
  },
  {
    id: 'editorial-contract',
    title: 'Edition',
    lines: ['audience · questions', 'coverage · narrative', 'build request'],
    semantics: entities('edition', 'build-request', 'publisher-core'),
    x: 420,
    y: 300,
    r: 12,
    tone: 'accent',
    titleY: 242,
    lineY: 346,
  },
  {
    id: 'static-scene',
    title: 'Static scene',
    lines: ['one-frame overview'],
    semantics: entities('static-scene'),
    x: 600,
    y: 220,
    r: 8,
    tone: 'line',
    titleY: 204,
    lineY: 260,
  },
  {
    id: 'interactive-scenes',
    title: 'Interactive scenes',
    lines: ['overview + mechanisms'],
    semantics: entities('interactive-scenes'),
    x: 600,
    y: 400,
    r: 8,
    tone: 'line',
    titleY: 384,
    lineY: 440,
  },
  {
    id: 'static-artifact',
    title: 'SVG + PNG',
    lines: ['measured geometry'],
    semantics: entities('static-renderer', 'static-artifact'),
    x: 790,
    y: 220,
    r: 8,
    tone: 'line',
    titleY: 204,
    lineY: 260,
  },
  {
    id: 'interactive-artifact',
    title: 'Standalone atlas',
    lines: ['search · focus · trace'],
    semantics: entities('interactive-renderer', 'interactive-atlas'),
    x: 790,
    y: 400,
    r: 8,
    tone: 'line',
    titleY: 384,
    lineY: 440,
  },
  {
    id: 'edition-candidate',
    title: 'Candidate',
    lines: ['exact media pair'],
    semantics: entities('edition-candidate'),
    x: 970,
    y: 300,
    r: 13,
    tone: 'accent',
    titleY: 244,
    lineY: 346,
  },
  {
    id: 'qualification',
    title: 'Qualification',
    lines: ['machine + human'],
    semantics: entities('qualification-set', 'human-review'),
    x: 1080,
    y: 300,
    r: 8,
    tone: 'accent',
    titleY: 232,
    lineY: 366,
  },
  {
    id: 'acceptance',
    title: 'Acceptance',
    lines: ['non-compensating'],
    semantics: entities('acceptance'),
    x: 1190,
    y: 300,
    r: 8,
    tone: 'proof',
    titleY: 252,
    lineY: 346,
  },
  {
    id: 'authorization',
    title: 'Authorization',
    lines: ['explicit · bounded'],
    semantics: entities('authorization'),
    x: 1300,
    y: 300,
    r: 8,
    tone: 'proof',
    titleY: 232,
    lineY: 366,
  },
  {
    id: 'recoverable-publication',
    title: 'Publication',
    lines: ['atomic replace', 'recovery · off-host unproved'],
    semantics: entities('publication', 'recovery', 'off-host-recovery'),
    x: 1430,
    y: 300,
    r: 11,
    tone: 'accent',
    titleY: 244,
    lineX: 1445,
    lineY: 346,
    lineSize: 10,
  },
  {
    id: 'consumers-feedback',
    title: 'Adoption',
    lines: ['self · ETHOS · AIGW', 'findings return to owners'],
    semantics: entities('self-consumer', 'ethos-consumer', 'aigw-consumer', 'feedback'),
    x: 1480,
    y: 460,
    r: 8,
    tone: 'proof',
    titleX: 1452,
    titleY: 452,
    lineX: 1452,
    lineY: 476,
    anchor: 'end',
  },
]);

const EVOLUTION = Object.freeze([
  {
    id: 'evolution-inputs',
    title: 'Before + after',
    lines: ['Claim Model · Edition'],
    semantics: entities('evolution-inputs'),
    x: 160,
  },
  {
    id: 'semantic-delta',
    title: 'Semantic delta',
    lines: ['meaning · lineage · unknowns'],
    semantics: entities('semantic-delta'),
    x: 440,
  },
  {
    id: 'affected-views',
    title: 'Affected views',
    lines: ['conservative propagation'],
    semantics: entities('affected-views'),
    x: 720,
  },
  {
    id: 'rebuild-verification',
    title: 'Rebuild + verify',
    lines: ['candidate · semantic · media'],
    semantics: entities(
      'rebuild-obligations',
      'semantic-verification-obligations',
      'medium-verification-obligations',
    ),
    x: 1000,
  },
  {
    id: 'review-publication',
    title: 'Renew trust',
    lines: ['review · accept · publish', 'or explicitly withdraw'],
    semantics: entities(
      'human-review-obligations',
      'acceptance-obligations',
      'publication-obligations',
    ),
    x: 1320,
  },
]);

const text = (id, value, x, y, size, weight, anchor, tone, semantics = []) => ({
  id,
  text: value,
  x,
  y,
  size,
  weight,
  anchor,
  tone,
  semantics,
});

const edge = (id, kind, source, target, points, semantics, label, labelX, labelY) => ({
  id,
  kind,
  source,
  target,
  points,
  semantics,
  label,
  labelX,
  labelY,
});

function coverage(groups) {
  const selected = groups.flatMap((group) => group.semantics),
    counts = new Map();
  for (const id of selected) counts.set(id, (counts.get(id) ?? 0) + 1);
  const selectedEntities = [...counts.keys()]
      .filter((id) => id.startsWith('entity:'))
      .map((id) => id.slice(7))
      .sort(),
    selectedRelations = [...counts.keys()]
      .filter((id) => id.startsWith('relation:'))
      .map((id) => id.slice(9))
      .sort(),
    expectedEntities = [...SELF_ENTITY_IDS].sort(),
    expectedRelations = [...SELF_RELATION_IDS].sort(),
    duplicateEntities = [...counts]
      .filter(([id, count]) => id.startsWith('entity:') && count > 1)
      .map(([id]) => id.slice(7))
      .sort(),
    duplicateRelations = [...counts]
      .filter(([id, count]) => id.startsWith('relation:') && count > 1)
      .map(([id]) => id.slice(9))
      .sort();
  return {
    entities: selectedEntities,
    relations: selectedRelations,
    missingEntities: expectedEntities.filter((id) => !selectedEntities.includes(id)),
    missingRelations: expectedRelations.filter((id) => !selectedRelations.includes(id)),
    duplicateEntities,
    duplicateRelations,
  };
}

function editionComposition(groups, relationEdges) {
  return {
    groups: groups.map((group) => ({
      id: group.id,
      label: group.title,
      entities: group.semantics.filter((id) => id.startsWith('entity:')).map((id) => id.slice(7)),
    })),
    relations: relationEdges.flatMap((selectedEdge) =>
      selectedEdge.semantics
        .filter((id) => id.startsWith('relation:'))
        .map((id) => ({
          id: id.slice(9),
          fromSide: selectedEdge.kind === 'feedback' ? 'bottom' : 'right',
          toSide: selectedEdge.kind === 'feedback' ? 'bottom' : 'left',
          route: 'straight',
        })),
    ),
  };
}

export function composeArchitecturePublisherFlagship() {
  const labels = [
      text('brand', 'ARCHITECTURE PUBLISHER', 64, 48, 11.5, '600', 'start', 'accent'),
      text('title', 'Source-bound meaning, explicitly trusted', 64, 88, 38, '600', 'start', 'ink'),
      text(
        'subtitle',
        'Independent media · exact qualification · recoverable publication',
        64,
        119,
        15,
        '400',
        'start',
        'muted',
      ),
      text(
        'state-boundary',
        'Build, judgment and effects remain distinct',
        1536,
        48,
        11,
        '400',
        'end',
        'muted',
      ),
      text('meaning-field', 'SOURCE TRUTH', 64, 164, 11.5, '600', 'start', 'accent'),
      text('media-field', 'INDEPENDENT MEDIA', 548, 164, 11.5, '600', 'start', 'accent'),
      text('trust-field', 'TRUSTED DELIVERY', 944, 164, 11.5, '600', 'start', 'accent'),
    ],
    marks = PIPELINE.map(({ id, x, y, r, tone }) => ({ id, x, y, r, tone })),
    relationEdges = [
      edge(
        'source-to-claims',
        'flow',
        'source-field',
        'semantic-contract',
        [point(120, 300), point(240, 300)],
        relations(
          'intent-enters-adapter',
          'implementation-enters-adapter',
          'observation-enters-adapter',
          'evidence-enters-bundle',
          'adapter-builds-bundle',
          'bundle-binds-claims',
        ),
        'select · bind',
        180,
        282,
      ),
      edge(
        'claims-to-edition',
        'flow',
        'semantic-contract',
        'editorial-contract',
        [point(260, 300), point(408, 300)],
        relations(
          'claims-inform-edition',
          'uncertainty-broadens-edition',
          'bundle-selects-build',
          'claims-select-build',
          'edition-selects-build',
          'build-invokes-core',
        ),
        'inform · select',
        334,
        282,
      ),
      edge(
        'edition-to-static',
        'flow',
        'editorial-contract',
        'static-scene',
        [point(432, 294), point(500, 294), point(500, 220), point(592, 220)],
        relations('edition-authors-static', 'core-compiles-static'),
        'static',
        540,
        245,
      ),
      edge(
        'edition-to-interactive',
        'flow',
        'editorial-contract',
        'interactive-scenes',
        [point(432, 306), point(500, 306), point(500, 400), point(592, 400)],
        relations('edition-authors-interactive', 'core-compiles-interactive'),
        'interactive',
        555,
        365,
      ),
      edge(
        'static-render',
        'flow',
        'static-scene',
        'static-artifact',
        [point(608, 220), point(782, 220)],
        relations('static-scene-enters-renderer', 'backend-renders-static'),
        'SVG',
        695,
        204,
      ),
      edge(
        'interactive-render',
        'flow',
        'interactive-scenes',
        'interactive-artifact',
        [point(608, 400), point(782, 400)],
        relations('interactive-scenes-enter-renderer', 'backend-renders-interactive'),
        'HTML',
        695,
        424,
      ),
      edge(
        'static-to-candidate',
        'flow',
        'static-artifact',
        'edition-candidate',
        [point(798, 220), point(900, 220), point(900, 270), point(970, 270), point(970, 287)],
        relations('static-enters-candidate'),
        'bind SVG',
        849,
        245,
      ),
      edge(
        'interactive-to-candidate',
        'flow',
        'interactive-artifact',
        'edition-candidate',
        [point(798, 400), point(900, 400), point(900, 330), point(970, 330), point(970, 313)],
        relations('interactive-enters-candidate'),
        'bind HTML',
        849,
        365,
      ),
      edge(
        'candidate-to-qualification',
        'trust',
        'edition-candidate',
        'qualification',
        [point(983, 300), point(1072, 300)],
        relations('candidate-enters-qualification', 'human-review-enters-qualification'),
        'qualify',
        1027,
        282,
      ),
      edge(
        'qualification-to-acceptance',
        'trust',
        'qualification',
        'acceptance',
        [point(1088, 300), point(1182, 300)],
        relations('qualification-precedes-acceptance'),
        'accept',
        1135,
        282,
      ),
      edge(
        'acceptance-to-authorization',
        'trust',
        'acceptance',
        'authorization',
        [point(1198, 300), point(1292, 300)],
        relations('acceptance-precedes-authorization'),
        'authorize',
        1245,
        282,
      ),
      edge(
        'authorization-to-publication',
        'trust',
        'authorization',
        'recoverable-publication',
        [point(1308, 300), point(1419, 300)],
        relations(
          'authorization-precedes-publication',
          'publication-supports-recovery',
          'recovery-excludes-off-host',
        ),
        'publish',
        1363,
        282,
      ),
      edge(
        'publication-to-adoption',
        'trust',
        'recoverable-publication',
        'consumers-feedback',
        [point(1441, 300), point(1540, 300), point(1540, 460), point(1488, 460)],
        relations(
          'publication-serves-self',
          'publication-serves-ethos',
          'publication-serves-aigw',
          'publication-returns-feedback',
        ),
        'serve',
        1492,
        286,
      ),
      edge(
        'feedback-return',
        'feedback',
        'consumers-feedback',
        'source-field',
        [point(1480, 468), point(1480, 530), point(40, 530), point(40, 300), point(104, 300)],
        relations('feedback-returns-to-adapter'),
        'findings return through source owners',
        800,
        555,
      ),
    ],
    groups = [...PIPELINE];

  for (const station of PIPELINE) {
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        station.titleX ?? station.x,
        station.titleY,
        station.r >= 11 ? 17 : ['qualification', 'authorization'].includes(station.id) ? 13 : 14.5,
        '600',
        station.anchor ?? 'middle',
        station.tone === 'line' ? 'ink' : station.tone,
        station.semantics,
      ),
    );
    station.lines.forEach((line, index) =>
      labels.push(
        text(
          `${station.id}-line-${index + 1}`,
          line,
          station.lineX ?? station.x,
          station.lineY + index * 19,
          station.lineSize ?? 10.5,
          '400',
          station.anchor ?? 'middle',
          'muted',
        ),
      ),
    );
  }
  for (const selectedEdge of relationEdges)
    labels.push(
      text(
        `${selectedEdge.id}-label`,
        selectedEdge.label,
        selectedEdge.labelX,
        selectedEdge.labelY,
        selectedEdge.id === 'feedback-return' ? 11 : 10.5,
        '600',
        'middle',
        selectedEdge.kind === 'trust'
          ? 'accent'
          : selectedEdge.kind === 'feedback'
            ? 'muted'
            : 'line',
        selectedEdge.semantics,
      ),
    );

  labels.push(
    text(
      'evolution-kicker',
      'SEMANTIC CHANGE RENEWS PROOF',
      64,
      610,
      11.5,
      '600',
      'start',
      'proof',
    ),
    text(
      'evolution-note',
      'Change propagates by meaning; prior acceptance never transfers',
      1536,
      610,
      11,
      '400',
      'end',
      'muted',
    ),
  );

  const evolutionY = 700;
  for (const station of EVOLUTION) {
    marks.push({ id: station.id, x: station.x, y: evolutionY, r: 8, tone: 'proof' });
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        station.x,
        658,
        15,
        '600',
        'middle',
        'ink',
        station.semantics,
      ),
    );
    station.lines.forEach((line, index) =>
      labels.push(
        text(
          `${station.id}-line-${index + 1}`,
          line,
          station.x,
          746 + index * 19,
          10.5,
          '400',
          'middle',
          'muted',
        ),
      ),
    );
    groups.push(station);
  }

  const evolutionEdges = [
    edge(
      'evolution-1',
      'renewal',
      'evolution-inputs',
      'semantic-delta',
      [point(168, 700), point(432, 700)],
      relations('models-enter-evolution', 'edition-enters-evolution', 'evolution-produces-delta'),
      'compare · derive',
      300,
      684,
    ),
    edge(
      'evolution-2',
      'renewal',
      'semantic-delta',
      'affected-views',
      [point(448, 700), point(712, 700)],
      relations('delta-identifies-affected-views'),
      'propagate',
      580,
      684,
    ),
    edge(
      'evolution-3',
      'renewal',
      'affected-views',
      'rebuild-verification',
      [point(728, 700), point(992, 700)],
      relations(
        'affected-views-require-rebuild',
        'affected-views-require-semantic-verification',
        'affected-views-require-medium-verification',
      ),
      'rebuild · verify',
      860,
      684,
    ),
    edge(
      'evolution-4',
      'renewal',
      'rebuild-verification',
      'review-publication',
      [point(1008, 700), point(1312, 700)],
      relations(
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
      ),
      'review · renew',
      1160,
      684,
    ),
  ];
  relationEdges.push(...evolutionEdges);
  for (const selectedEdge of evolutionEdges)
    labels.push(
      text(
        `${selectedEdge.id}-label`,
        selectedEdge.label,
        selectedEdge.labelX,
        selectedEdge.labelY,
        10.5,
        '600',
        'middle',
        'proof',
        selectedEdge.semantics,
      ),
    );

  const semanticGroups = [
      ...groups,
      ...relationEdges.map((selectedEdge) => ({
        id: selectedEdge.id,
        semantics: selectedEdge.semantics,
      })),
    ],
    selectedCoverage = coverage(semanticGroups);
  if (
    selectedCoverage.missingEntities.length ||
    selectedCoverage.missingRelations.length ||
    selectedCoverage.duplicateEntities.length ||
    selectedCoverage.duplicateRelations.length
  )
    throw Object.assign(new Error('self_flagship_coverage_invalid'), {
      code: 'self_flagship_coverage_invalid',
      coverage: selectedCoverage,
    });

  return {
    schema: 'architecture.publisher-static-composition/v1',
    title: 'Architecture Publisher',
    subtitle: 'Source-bound meaning becomes an exact, reviewable Edition',
    width: 1600,
    height: 900,
    spine: PIPELINE.map(({ id }) => id),
    marks,
    labels,
    relations: relationEdges,
    editionComposition: editionComposition([...PIPELINE, ...EVOLUTION], relationEdges),
    rules: [
      { id: 'header-rule', points: [point(64, 142), point(1536, 142)] },
      { id: 'meaning-field-rule', points: [point(64, 182), point(492, 182)] },
      { id: 'media-field-rule', points: [point(548, 182), point(892, 182)] },
      { id: 'trust-field-rule', points: [point(944, 182), point(1536, 182)] },
      { id: 'evolution-rule', points: [point(64, 580), point(1536, 580)] },
      { id: 'footer-rule', points: [point(64, 836), point(1536, 836)] },
    ],
    requiredSemanticIds: [...SELF_ENTITY_IDS.map(entity), ...SELF_RELATION_IDS.map(relation)],
    coverage: selectedCoverage,
  };
}
