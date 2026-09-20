import { SELF_ENTITY_IDS, SELF_RELATION_IDS } from '../model.mjs';

const entity = (id) => `entity:${id}`;
const relation = (id) => `relation:${id}`;
const entities = (...ids) => ids.map(entity);
const relations = (...ids) => ids.map(relation);

const STATIONS = Object.freeze([
  {
    id: 'source-field',
    title: 'Source',
    lines: ['intent · code', 'observe · evidence', 'adapter · bundle'],
    semantics: entities(
      'accepted-intent',
      'implementation',
      'runtime-observation',
      'evidence',
      'source-adapter',
      'source-bundle',
    ),
  },
  {
    id: 'semantic-contract',
    title: 'Claims',
    lines: ['typed meaning', 'provenance · unknowns'],
    semantics: entities('claim-model', 'uncertainty'),
  },
  {
    id: 'editorial-contract',
    title: 'Edition',
    lines: ['audience · questions', 'coverage · narrative', 'build request'],
    semantics: entities('edition', 'build-request', 'publisher-core'),
  },
  {
    id: 'independent-scenes',
    title: 'Scenes',
    lines: ['static + interactive', 'independent geometry'],
    semantics: entities('static-scene', 'interactive-scenes'),
  },
  {
    id: 'exact-media',
    title: 'Artifacts',
    lines: ['separate renderers', 'SVG · PNG · HTML', 'candidate binds bytes'],
    semantics: entities(
      'static-renderer',
      'static-artifact',
      'interactive-renderer',
      'interactive-atlas',
      'edition-candidate',
    ),
  },
  {
    id: 'qualification',
    title: 'Qualification',
    lines: ['machine predicates', 'human judgment'],
    semantics: entities('qualification-set', 'human-review'),
  },
  {
    id: 'acceptance',
    title: 'Acceptance',
    lines: ['exact candidate', 'non-compensating'],
    semantics: entities('acceptance'),
  },
  {
    id: 'authorization',
    title: 'Authorization',
    lines: ['explicit authority', 'bounded effect'],
    semantics: entities('authorization'),
  },
  {
    id: 'recoverable-publication',
    title: 'Publication',
    lines: ['atomic replacement', 'recovery receipt', 'off-host unproved'],
    semantics: entities('publication', 'recovery', 'off-host-recovery'),
  },
  {
    id: 'consumers-feedback',
    title: 'Adoption',
    lines: ['self · ETHOS · AIGW', 'feedback returns native'],
    semantics: entities(
      'self-consumer',
      'ethos-consumer',
      'aigw-consumer',
      'feedback',
    ),
  },
]);

const SPINE_RELATIONS = Object.freeze([
  relations(
    'intent-enters-adapter',
    'implementation-enters-adapter',
    'observation-enters-adapter',
    'evidence-enters-bundle',
    'adapter-builds-bundle',
    'bundle-binds-claims',
  ),
  relations(
    'claims-inform-edition',
    'uncertainty-broadens-edition',
    'bundle-selects-build',
    'claims-select-build',
    'edition-selects-build',
    'build-invokes-core',
  ),
  relations(
    'edition-authors-static',
    'edition-authors-interactive',
    'core-compiles-static',
    'core-compiles-interactive',
  ),
  relations(
    'static-scene-enters-renderer',
    'interactive-scenes-enter-renderer',
    'backend-renders-static',
    'backend-renders-interactive',
    'static-enters-candidate',
    'interactive-enters-candidate',
  ),
  relations(
    'candidate-enters-qualification',
    'human-review-enters-qualification',
  ),
  relations('qualification-precedes-acceptance'),
  relations('acceptance-precedes-authorization'),
  relations(
    'authorization-precedes-publication',
    'publication-supports-recovery',
    'recovery-excludes-off-host',
  ),
  relations(
    'publication-serves-self',
    'publication-serves-ethos',
    'publication-serves-aigw',
    'publication-returns-feedback',
  ),
]);

const EVOLUTION = Object.freeze([
  {
    id: 'evolution-inputs',
    title: 'Before + after',
    lines: ['Claim Model · Edition'],
    semantics: entities('evolution-inputs'),
  },
  {
    id: 'semantic-delta',
    title: 'Semantic delta',
    lines: ['meaning · lineage · unknowns'],
    semantics: entities('semantic-delta'),
  },
  {
    id: 'affected-views',
    title: 'Affected views',
    lines: ['conservative propagation'],
    semantics: entities('affected-views'),
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
  },
  {
    id: 'review-publication',
    title: 'Renew trust',
    lines: ['human review · acceptance', 'publication or withdrawal'],
    semantics: entities(
      'human-review-obligations',
      'acceptance-obligations',
      'publication-obligations',
    ),
  },
]);

const EVOLUTION_RELATIONS = Object.freeze([
  relations(
    'models-enter-evolution',
    'edition-enters-evolution',
    'evolution-produces-delta',
  ),
  relations('delta-identifies-affected-views'),
  relations(
    'affected-views-require-rebuild',
    'affected-views-require-semantic-verification',
    'affected-views-require-medium-verification',
  ),
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
const point = (x, y) => ({ x, y });

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
    missingEntities: expectedEntities.filter(
      (id) => !selectedEntities.includes(id),
    ),
    missingRelations: expectedRelations.filter(
      (id) => !selectedRelations.includes(id),
    ),
    duplicateEntities,
    duplicateRelations,
  };
}

function editionComposition(groups, relationEdges) {
  return {
    groups: groups.map((group) => ({
      id: group.id,
      label: group.title,
      entities: group.semantics
        .filter((id) => id.startsWith('entity:'))
        .map((id) => id.slice(7)),
    })),
    relations: relationEdges.flatMap((edge) =>
      edge.semantics
        .filter((id) => id.startsWith('relation:'))
        .map((id) => ({
          id: id.slice(9),
          fromSide: edge.kind === 'feedback' ? 'left' : 'right',
          toSide: edge.kind === 'feedback' ? 'right' : 'left',
          route: 'straight',
        })),
    ),
  };
}

export function composeArchitecturePublisherFlagship() {
  const labels = [
      text('title', 'Architecture Publisher', 64, 72, 38, '600', 'start', 'ink'),
      text(
        'subtitle',
        'Meaning becomes a trustworthy Architecture Edition',
        64,
        110,
        17,
        '400',
        'start',
        'muted',
      ),
      text(
        'state-boundary',
        'Build · qualify · accept · authorize · publish remain distinct',
        1536,
        72,
        12,
        '400',
        'end',
        'muted',
      ),
      text(
        'main-kicker',
        'SOURCE-BOUND SEMANTIC PUBLICATION',
        64,
        174,
        12,
        '600',
        'start',
        'accent',
      ),
    ],
    marks = [],
    relationEdges = [],
    groups = [];
  const start = 112,
    end = 1488,
    step = (end - start) / (STATIONS.length - 1),
    y = 264;
  for (const [index, station] of STATIONS.entries()) {
    const x = start + index * step;
    marks.push({ id: station.id, x, y, r: 9, tone: index < 5 ? 'ink' : 'accent' });
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        x,
        212,
        17,
        '600',
        'middle',
        index < 5 ? 'ink' : 'accent',
        station.semantics,
      ),
    );
    station.lines.forEach((line, lineIndex) =>
      labels.push(
        text(
          `${station.id}-line-${lineIndex + 1}`,
          line,
          x,
          322 + lineIndex * 22,
          11.5,
          '400',
          'middle',
          'muted',
        ),
      ),
    );
    groups.push({ id: station.id, semantics: station.semantics });
    if (index < STATIONS.length - 1) {
      const nextX = start + (index + 1) * step,
        edgeSemantics = SPINE_RELATIONS[index];
      relationEdges.push({
        id: `spine-${index + 1}`,
        kind: index >= 4 ? 'trust' : 'flow',
        source: station.id,
        target: STATIONS[index + 1].id,
        points: [point(x + 9, y), point(nextX - 9, y)],
        semantics: edgeSemantics,
      });
      labels.push(
        text(
          `spine-${index + 1}-label`,
          [
            'select · bind',
            'inform · broaden',
            'author · compile',
            'render · bundle',
            'qualify',
            'accept',
            'authorize',
            'publish · recover',
            'serve · learn',
          ][index],
          (x + nextX) / 2,
          242,
          10.5,
          '600',
          'middle',
          index >= 4 ? 'accent' : 'line',
          edgeSemantics,
        ),
      );
    }
  }
  labels.push(
    text(
      'feedback-return',
      'Feedback returns through each source owner’s native lifecycle',
      800,
      410,
      12,
      '400',
      'middle',
      'muted',
      relations('feedback-returns-to-adapter'),
    ),
    text(
      'evolution-kicker',
      'CHANGE INVALIDATES PROOF, NOT ONLY PIXELS',
      64,
      540,
      12,
      '600',
      'start',
      'accent',
    ),
  );
  marks.push(
    { id: 'feedback-return-start', x: end, y: 430, r: 5, tone: 'ghost' },
    { id: 'feedback-return-end', x: start, y: 430, r: 5, tone: 'ghost' },
  );
  relationEdges.push({
    id: 'feedback-return',
    kind: 'feedback',
    source: 'feedback-return-start',
    target: 'feedback-return-end',
    points: [point(end - 5, 430), point(start + 5, 430)],
    semantics: relations('feedback-returns-to-adapter'),
  });

  const evolutionX = [140, 470, 800, 1130, 1460],
    evolutionY = 648;
  for (const [index, station] of EVOLUTION.entries()) {
    const x = evolutionX[index];
    marks.push({ id: station.id, x, y: evolutionY, r: 8, tone: 'proof' });
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        x,
        602,
        16,
        '600',
        'middle',
        'ink',
        station.semantics,
      ),
    );
    station.lines.forEach((line, lineIndex) =>
      labels.push(
        text(
          `${station.id}-line-${lineIndex + 1}`,
          line,
          x,
          702 + lineIndex * 22,
          11.5,
          '400',
          'middle',
          'muted',
        ),
      ),
    );
    groups.push({ id: station.id, semantics: station.semantics });
    if (index < EVOLUTION.length - 1) {
      const nextX = evolutionX[index + 1],
        edgeSemantics = EVOLUTION_RELATIONS[index];
      relationEdges.push({
        id: `evolution-${index + 1}`,
        kind: 'renewal',
        source: station.id,
        target: EVOLUTION[index + 1].id,
        points: [point(x + 8, evolutionY), point(nextX - 8, evolutionY)],
        semantics: edgeSemantics,
      });
      labels.push(
        text(
          `evolution-${index + 1}-label`,
          ['compare', 'propagate', 'rebuild · verify', 'review · renew'][index],
          (x + nextX) / 2,
          628,
          10.5,
          '600',
          'middle',
          'proof',
          edgeSemantics,
        ),
      );
    }
  }

  const semanticGroups = [
      ...groups,
      ...relationEdges.map((edge) => ({ id: edge.id, semantics: edge.semantics })),
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
    subtitle: 'Meaning becomes a trustworthy Architecture Edition',
    width: 1600,
    height: 900,
    spine: STATIONS.map(({ id }) => id),
    marks,
    labels,
    relations: relationEdges,
    editionComposition: editionComposition(
      [...STATIONS, ...EVOLUTION],
      relationEdges,
    ),
    rules: [
      { id: 'header-rule', points: [point(64, 146), point(1536, 146)] },
      { id: 'evolution-rule', points: [point(64, 510), point(1536, 510)] },
      { id: 'footer-rule', points: [point(64, 820), point(1536, 820)] },
    ],
    requiredSemanticIds: [
      ...SELF_ENTITY_IDS.map(entity),
      ...SELF_RELATION_IDS.map(relation),
    ],
    coverage: selectedCoverage,
  };
}
