import { validateInteractiveArchitectureScene } from 'architecture-publisher/scene';

const ROLES = Object.freeze({
  source: 'external',
  meaning: 'security',
  authorship: 'cloud',
  media: 'frontend',
  assurance: 'security',
  delivery: 'backend',
  adoption: 'external',
  evolution: 'cloud',
  'source-field': 'external',
  sources: 'external',
  adapter: 'backend',
  bundle: 'database',
  claims: 'security',
  reader: 'cloud',
  build: 'cloud',
  compiler: 'backend',
  'static-scene': 'frontend',
  'interactive-scene': 'frontend',
  'static-renderer': 'messagebus',
  'interactive-renderer': 'messagebus',
  'static-artifact': 'database',
  'interactive-artifact': 'database',
  qualification: 'security',
  'human-review': 'security',
  acceptance: 'security',
  authorization: 'security',
  publication: 'backend',
  recovery: 'backend',
  'off-host-limit': 'external',
  self: 'external',
  ethos: 'external',
  aigw: 'external',
  feedback: 'cloud',
  'source-owner': 'external',
  intake: 'backend',
  'semantic-contract': 'security',
  audience: 'cloud',
  scenes: 'frontend',
  rendering: 'messagebus',
  artifacts: 'database',
  candidate: 'database',
  judgment: 'security',
  'effect-admission': 'security',
  admission: 'security',
  effects: 'backend',
  consumers: 'external',
  return: 'cloud',
  inputs: 'external',
  delta: 'cloud',
  impact: 'cloud',
  rebuild: 'backend',
  verification: 'security',
  review: 'security',
  effect: 'backend',
  'renewed-values': 'database',
});

const DETAILS = Object.freeze({
  source: 'intent · code · runtime · evidence',
  meaning: 'typed claims · provenance · uncertainty',
  media: 'independent scenes · exact bytes',
  assurance: 'qualify · accept · authorize',
  delivery: 'publish · replace · recover',
  adoption: 'self · ETHOS · AIGW · feedback',
  evolution: 'change invalidates proof',
  'source-field': 'intent · code · runtime · evidence',
  sources: 'intent · code · runtime · evidence',
  adapter: 'explicit mapping · no inferred authority',
  bundle: 'selected bytes · revision · provenance',
  claims: 'typed meaning · planes · conditions',
  uncertainty: 'unknowns broaden obligations',
  reader: 'audience · questions · coverage · omissions',
  build: 'exact source · claims · Edition · outputs',
  compiler: 'validates · resolves · composes',
  'static-scene': 'one-frame causal composition',
  'interactive-scene': 'overview · mechanisms · exploration',
  'static-renderer': 'scene to SVG and PNG bytes',
  'interactive-renderer': 'scene to standalone HTML',
  'static-artifact': 'independent static delivery',
  'interactive-artifact': 'independent interactive delivery',
  qualification: 'predicate-specific exact judgments',
  'human-review': 'faithful · intelligible · restrained',
  acceptance: 'explicit exact-artifact decision',
  authorization: 'one exact publication plan',
  publication: 'apply · replace · withdraw',
  recovery: 're-observe · resume same plan',
  'off-host-limit': 'unproved without operator custody',
  self: 'source-owned self Edition',
  ethos: 'native ETHOS lifecycle and authority',
  aigw: 'native AIGW lifecycle and authority',
  feedback: 'findings only · no silent mutation',
  'source-owner': 'accept · reject · evolve natively',
  intake: 'loss-aware adapter · Source Bundle',
  'semantic-contract': 'claims · provenance · unknowns',
  audience: 'reader questions · coverage',
  authorship: 'Edition · Build Request · compiler',
  scenes: 'static and interactive stay independent',
  rendering: 'replaceable rendering capabilities',
  artifacts: 'SVG · PNG · standalone HTML',
  candidate: 'source · meaning · scenes · bytes',
  judgment: 'machine predicates · human judgment',
  'effect-admission': 'explicit bounded authority',
  admission: 'qualification · acceptance · authorization',
  effects: 'publication · recovery · explicit limit',
  consumers: 'independent source-owned adopters',
  return: 'feedback through native lifecycle',
  inputs: 'before and after Claim Model + Edition',
  delta: 'meaning · lineage · uncertainty',
  impact: 'affected Editions and scenes',
  rebuild: 'candidate and medium rebuild',
  verification: 'semantic and medium re-verification',
  review: 'human review and acceptance renewal',
  effect: 'publish · replace · withdraw',
  'renewed-values': 'scenes · proof · approval · release',
});

const OVERVIEW_CLUSTERS = Object.freeze([
  ['source', 'Source truth', ['source-field', 'intake']],
  ['meaning', 'Claim Model', ['semantic-contract']],
  ['authorship', 'Edition authorship', ['authorship']],
  ['media', 'Independent media', ['scenes', 'rendering', 'candidate']],
  ['assurance', 'Trust gates', ['qualification', 'authorization']],
  ['delivery', 'Publication', ['effects']],
  ['adoption', 'Native adoption', ['adoption', 'return']],
  ['evolution', 'Conservative evolution', ['evolution', 'renewal']],
]);

const OVERVIEW_RELATIONS = Object.freeze([
  ['source-meaning', 'source', 'meaning', 'binds', ['bundle-binds-claims']],
  [
    'meaning-authorship',
    'meaning',
    'authorship',
    'informs · selects',
    [
      'claims-inform-edition',
      'uncertainty-broadens-edition',
      'claims-select-build',
      'bundle-selects-build',
    ],
  ],
  [
    'authorship-media',
    'authorship',
    'media',
    'authors · compiles',
    [
      'edition-authors-static',
      'edition-authors-interactive',
      'core-compiles-static',
      'core-compiles-interactive',
    ],
  ],
  [
    'media-assurance',
    'media',
    'assurance',
    'qualifies',
    ['candidate-enters-qualification'],
    {
      fromSide: 'right',
      toSide: 'right',
      route: 'auto',
      waypoints: [point(1160, 144), point(1160, 504)],
      labelPlacement: { at: [1138, 324] },
    },
  ],
  [
    'assurance-delivery',
    'assurance',
    'delivery',
    'authorizes',
    ['authorization-precedes-publication'],
  ],
  [
    'delivery-adoption',
    'delivery',
    'adoption',
    'serves · learns',
    [
      'publication-serves-self',
      'publication-serves-ethos',
      'publication-serves-aigw',
      'publication-returns-feedback',
    ],
  ],
  [
    'adoption-source',
    'adoption',
    'source',
    'returns',
    ['feedback-returns-to-adapter'],
    {
      fromSide: 'left',
      toSide: 'left',
      route: 'auto',
      waypoints: [point(20, 504), point(20, 144)],
      labelPlacement: { at: [44, 324] },
    },
  ],
  [
    'meaning-evolution',
    'meaning',
    'evolution',
    'compares',
    ['models-enter-evolution', 'edition-enters-evolution'],
    {
      fromSide: 'bottom',
      toSide: 'left',
      route: 'auto',
      waypoints: [point(410, 240), point(580, 240), point(580, 324)],
      labelPlacement: { at: [500, 228] },
    },
  ],
  [
    'evolution-renews',
    'evolution',
    'assurance',
    'invalidates · renews',
    [
      'rebuild-renews-static',
      'rebuild-renews-interactive',
      'semantic-verification-renews-claims',
      'medium-verification-renews-qualification',
      'human-review-obligation-renews-review',
      'acceptance-obligation-renews-acceptance',
      'publication-obligation-renews-publication',
    ],
    {
      fromSide: 'right',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(870, 324), point(870, 410), point(1010, 410)],
      labelPlacement: { at: [930, 398] },
    },
  ],
]);

const EDITION_RELATIONS = Object.freeze([
  [
    'meaning-reader',
    'meaning',
    'reader',
    'informs · broadens',
    ['claims-inform-edition', 'uncertainty-broadens-edition'],
    {
      fromSide: 'right',
      toSide: 'left',
      route: 'auto',
      waypoints: [point(240, 296), point(240, 126)],
      labelPlacement: { at: [240, 214] },
    },
  ],
  ['reader-static', 'reader', 'static-scene', 'authors', ['edition-authors-static']],
  [
    'reader-interactive',
    'reader',
    'interactive-scene',
    'authors',
    ['edition-authors-interactive'],
    {
      fromSide: 'top',
      toSide: 'right',
      route: 'auto',
      waypoints: [point(348, 24), point(1060, 24), point(1060, 466)],
      labelPlacement: { at: [1044, 246] },
    },
  ],
  [
    'meaning-build',
    'meaning',
    'build',
    'selects',
    ['claims-select-build'],
    {
      fromSide: 'bottom',
      toSide: 'left',
      route: 'auto',
      waypoints: [point(118, 466), point(250, 466)],
      labelPlacement: { at: [176, 454] },
    },
  ],
  ['reader-build', 'reader', 'build', 'selects', ['edition-selects-build']],
  ['build-compiler', 'build', 'compiler', 'invokes', ['build-invokes-core']],
  [
    'compiler-static',
    'compiler',
    'static-scene',
    'compiles',
    ['core-compiles-static'],
    {
      fromSide: 'top',
      toSide: 'bottom',
      route: 'auto',
      waypoints: [point(648, 250), point(928, 250)],
      labelPlacement: { at: [788, 238] },
    },
  ],
  [
    'compiler-interactive',
    'compiler',
    'interactive-scene',
    'compiles',
    ['core-compiles-interactive'],
  ],
]);

const ADOPTION_RELATIONS = Object.freeze([
  [
    'publication-self',
    'publication',
    'self',
    'serves',
    ['publication-serves-self'],
    {
      fromSide: 'left',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(118, 106), point(118, 260)],
      labelPlacement: { at: [208, 94] },
    },
  ],
  ['publication-ethos', 'publication', 'ethos', 'serves', ['publication-serves-ethos']],
  [
    'publication-aigw',
    'publication',
    'aigw',
    'serves',
    ['publication-serves-aigw'],
    {
      fromSide: 'right',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(678, 106), point(678, 260)],
      labelPlacement: { at: [586, 94] },
    },
  ],
  [
    'publication-feedback',
    'publication',
    'feedback',
    'returns',
    ['publication-returns-feedback'],
    {
      fromSide: 'top',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(398, 20), point(948, 20), point(948, 260)],
      labelPlacement: { at: [774, 38] },
    },
  ],
  ['feedback-source-owner', 'feedback', 'source-owner', 'returns', ['feedback-returns-to-adapter']],
]);

const SLOTS = Object.freeze({
  overview: Object.freeze({
    viewport: [1240, 700],
    source: [40, 90],
    meaning: [300, 85],
    authorship: [570, 85],
    media: [860, 85],
    assurance: [900, 445],
    delivery: [620, 450],
    adoption: [340, 450],
    evolution: [620, 270],
  }),
  semantics: Object.freeze({
    viewport: [1100, 620],
    sources: [20, 240],
    adapter: [250, 80],
    bundle: [250, 400],
    claims: [480, 240],
    uncertainty: [710, 80],
    reader: [880, 400],
  }),
  edition: Object.freeze({
    viewport: [1100, 650],
    meaning: [20, 250],
    reader: [250, 80],
    build: [280, 420],
    compiler: [550, 420],
    'static-scene': [830, 80],
    'interactive-scene': [830, 420],
  }),
  composition: Object.freeze({
    viewport: [1080, 700],
    authorship: [20, 300],
    'static-scene': [240, 90],
    'static-renderer': [460, 90],
    'static-artifact': [680, 90],
    'interactive-scene': [240, 510],
    'interactive-renderer': [460, 510],
    'interactive-artifact': [680, 510],
    candidate: [860, 300],
  }),
  qualification: Object.freeze({
    viewport: [1080, 600],
    candidate: [20, 170],
    qualification: [300, 270],
    'human-review': [20, 400],
    acceptance: [580, 270],
    authorization: [850, 270],
  }),
  'publication-recovery': Object.freeze({
    viewport: [1100, 620],
    qualification: [20, 100],
    acceptance: [240, 100],
    authorization: [460, 100],
    publication: [680, 100],
    recovery: [620, 400],
    'off-host-limit': [880, 400],
  }),
  adoption: Object.freeze({
    viewport: [1080, 720],
    publication: [300, 60],
    self: [20, 300],
    ethos: [300, 300],
    aigw: [580, 300],
    feedback: [850, 300],
    'source-owner': [850, 560],
  }),
  evolution: Object.freeze({
    viewport: [1240, 900],
    inputs: [40, 90],
    delta: [350, 90],
    impact: [660, 90],
    rebuild: [120, 390],
    verification: [420, 390],
    review: [720, 390],
    effect: [1020, 390],
    'renewed-values': [570, 690],
  }),
});

const EVOLUTION_RELATIONS = Object.freeze([
  ['inputs-delta', 'inputs', 'delta', 'derives', ['evolution-produces-delta']],
  ['delta-impact', 'delta', 'impact', 'propagates', ['delta-identifies-affected-views']],
  [
    'impact-rebuild',
    'impact',
    'rebuild',
    'rebuild',
    ['affected-views-require-rebuild'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(758, 226), point(218, 226)],
      labelPlacement: { at: [320, 214] },
    },
  ],
  [
    'impact-verification',
    'impact',
    'verification',
    'verify',
    ['affected-views-require-semantic-verification', 'affected-views-require-medium-verification'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(758, 258), point(518, 258)],
      labelPlacement: { at: [590, 246] },
    },
  ],
  [
    'impact-review',
    'impact',
    'review',
    're-review',
    ['affected-views-require-human-review', 'affected-views-require-acceptance'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(758, 290), point(818, 290)],
      labelPlacement: { at: [820, 278] },
    },
  ],
  [
    'impact-effect',
    'impact',
    'effect',
    'renew effect',
    ['affected-views-require-publication'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(758, 322), point(1118, 322)],
      labelPlacement: { at: [1000, 310] },
    },
  ],
  [
    'rebuild-renewed',
    'rebuild',
    'renewed-values',
    'rebuilds',
    ['rebuild-renews-static', 'rebuild-renews-interactive'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(218, 554), point(668, 554)],
      labelPlacement: { at: [350, 542] },
    },
  ],
  [
    'verification-renewed',
    'verification',
    'renewed-values',
    'revalidates',
    ['semantic-verification-renews-claims', 'medium-verification-renews-qualification'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(518, 586), point(668, 586)],
      labelPlacement: { at: [570, 574] },
    },
  ],
  [
    'review-renewed',
    'review',
    'renewed-values',
    'renews judgment',
    ['human-review-obligation-renews-review', 'acceptance-obligation-renews-acceptance'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(818, 618), point(668, 618)],
      labelPlacement: { at: [770, 606] },
    },
  ],
  [
    'effect-renewed',
    'effect',
    'renewed-values',
    'publishes',
    ['publication-obligation-renews-publication'],
    {
      fromSide: 'bottom',
      toSide: 'top',
      route: 'auto',
      waypoints: [point(1118, 650), point(668, 650)],
      labelPlacement: { at: [990, 638] },
    },
  ],
]);

function nodeWidth(label, viewId) {
  const required =
      String(label).length * (viewId === 'overview' ? 7.2 : 6.6) +
      (viewId === 'overview' ? 20 : -8),
    widths = viewId === 'overview' ? [220, 248, 276] : [196, 220, 244];
  return widths.find((width) => width >= required) ?? widths.at(-1);
}

function nodeHeight(id, viewId) {
  if (viewId !== 'overview') return 92;
  return ['meaning', 'authorship', 'media', 'assurance'].includes(id) ? 118 : 108;
}

function point(x, y) {
  return { x, y };
}

function route(from, to, viewport, hint) {
  if (hint && typeof hint === 'object') return structuredClone(hint);
  const left = from.position.x,
    right = left + from.size.width,
    top = from.position.y,
    bottom = top + from.size.height,
    targetLeft = to.position.x,
    targetRight = targetLeft + to.size.width,
    targetTop = to.position.y,
    targetBottom = targetTop + to.size.height,
    sourceCenter = point((left + right) / 2, (top + bottom) / 2),
    targetCenter = point((targetLeft + targetRight) / 2, (targetTop + targetBottom) / 2);
  if (hint === 'outer-left') {
    const channel = 28;
    return {
      fromSide: 'left',
      toSide: 'left',
      route: 'auto',
      waypoints: [point(channel, sourceCenter.y), point(channel, targetCenter.y)],
      labelPlacement: { at: [channel + 26, (sourceCenter.y + targetCenter.y) / 2] },
    };
  }
  if (hint === 'outer-bottom') {
    const channel = viewport.height - 42;
    return {
      fromSide: 'bottom',
      toSide: 'bottom',
      route: 'auto',
      waypoints: [point(sourceCenter.x, channel), point(targetCenter.x, channel)],
      labelPlacement: { at: [(sourceCenter.x + targetCenter.x) / 2, channel - 10] },
    };
  }
  const dx = targetCenter.x - sourceCenter.x,
    dy = targetCenter.y - sourceCenter.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const forward = dx >= 0,
      startX = forward ? right : left,
      endX = forward ? targetLeft : targetRight,
      startY = sourceCenter.y,
      endY = targetCenter.y;
    if (Math.abs(startY - endY) < 1)
      return {
        fromSide: forward ? 'right' : 'left',
        toSide: forward ? 'left' : 'right',
        route: 'straight',
        labelPlacement: { at: [(startX + endX) / 2, top - 16] },
      };
    const channel = (startX + endX) / 2;
    return {
      fromSide: forward ? 'right' : 'left',
      toSide: forward ? 'left' : 'right',
      route: 'auto',
      waypoints: [point(channel, startY), point(channel, endY)],
      labelPlacement: { at: [channel + (forward ? 16 : -16), (startY + endY) / 2] },
    };
  }
  const forward = dy >= 0,
    startX = sourceCenter.x,
    endX = targetCenter.x,
    startY = forward ? bottom : top,
    endY = forward ? targetTop : targetBottom;
  if (Math.abs(startX - endX) < 1)
    return {
      fromSide: forward ? 'bottom' : 'top',
      toSide: forward ? 'top' : 'bottom',
      route: 'straight',
      labelPlacement: { at: [startX + 18, (startY + endY) / 2] },
    };
  const channel = (startY + endY) / 2;
  return {
    fromSide: forward ? 'bottom' : 'top',
    toSide: forward ? 'top' : 'bottom',
    route: 'auto',
    waypoints: [point(startX, channel), point(endX, channel)],
    labelPlacement: { at: [(startX + endX) / 2, channel - 12] },
  };
}

function groupsFor(view) {
  return new Map(view.groups.map((group) => [group.id, group]));
}

function relationEndpoints(document, view) {
  const entityGroup = new Map();
  for (const group of view.groups) for (const id of group.entities) entityGroup.set(id, group.id);
  return new Map(
    view.relations.map(({ id }) => {
      const relation = document.relations[id];
      return [
        id,
        {
          from: entityGroup.get(relation.subject),
          to: entityGroup.get(relation.object),
        },
      ];
    }),
  );
}

function defaultClusters(view) {
  return view.groups.map(({ id, label }) => [id, label, [id]]);
}

function defaultRelations(document, view) {
  const endpoints = relationEndpoints(document, view),
    pairs = new Map();
  for (const { id } of view.relations) {
    const { from, to } = endpoints.get(id);
    if (from === to) continue;
    const key = from + '\u0000' + to,
      values = pairs.get(key) ?? [];
    values.push(id);
    pairs.set(key, values);
  }
  return [...pairs.entries()].map(([key, relationIds], index) => {
    const [from, to] = key.split('\u0000'),
      labels = [...new Set(relationIds.map((id) => document.relations[id].type))];
    return ['flow-' + (index + 1), from, to, labels.join(' · '), relationIds];
  });
}

function programFor(document, view) {
  if (view.id === 'overview') return { clusters: OVERVIEW_CLUSTERS, relations: OVERVIEW_RELATIONS };
  if (view.id === 'edition')
    return { clusters: defaultClusters(view), relations: EDITION_RELATIONS };
  if (view.id === 'adoption')
    return { clusters: defaultClusters(view), relations: ADOPTION_RELATIONS };
  if (view.id === 'evolution')
    return { clusters: defaultClusters(view), relations: EVOLUTION_RELATIONS };
  return {
    clusters: defaultClusters(view),
    relations: defaultRelations(document, view),
  };
}

function assertExactCoverage(expected, actual, code) {
  const sortedExpected = [...expected].sort(),
    sortedActual = [...actual].sort();
  if (
    sortedExpected.length !== sortedActual.length ||
    sortedExpected.some((value, index) => value !== sortedActual[index])
  )
    throw Object.assign(new Error(code), {
      code,
      expected: sortedExpected,
      actual: sortedActual,
    });
}

/** Compose the source-owned flagship interactive visual carriers. */
export function composeArchitecturePublisherInteractiveScene(document, edition, view) {
  const slots = SLOTS[view.id];
  if (!slots)
    throw Object.assign(new Error('self_interactive_layout_missing'), {
      code: 'self_interactive_layout_missing',
    });
  const groupMap = groupsFor(view),
    endpoints = relationEndpoints(document, view),
    program = programFor(document, view),
    nodeByGroup = new Map(),
    representedGroups = [],
    representedRelations = new Set(),
    nodes = program.clusters.map(([id, label, groupIds]) => {
      const entities = [];
      for (const groupId of groupIds) {
        const group = groupMap.get(groupId);
        if (!group)
          throw Object.assign(new Error('self_interactive_group_missing'), {
            code: 'self_interactive_group_missing',
          });
        representedGroups.push(groupId);
        entities.push(...group.entities);
        nodeByGroup.set(groupId, id);
      }
      const semanticIds = entities.map((entity) => 'entity:' + entity);
      for (const { id: relationId } of view.relations) {
        const endpoint = endpoints.get(relationId);
        if (groupIds.includes(endpoint.from) && groupIds.includes(endpoint.to)) {
          semanticIds.push('relation:' + relationId);
          representedRelations.add(relationId);
        }
      }
      const [x, y] = slots[id],
        width = nodeWidth(label, view.id);
      return {
        id,
        label,
        detail: DETAILS[id] ?? `${entities.length} semantic subjects`,
        visualRole: ROLES[id] ?? 'backend',
        position: { x, y },
        size: { width, height: nodeHeight(id, view.id) },
        semanticIds,
      };
    }),
    nodeMap = new Map(nodes.map((node) => [node.id, node])),
    edges = program.relations.map(([id, from, to, label, relationIds, hint]) => {
      if (!nodeMap.has(from) || !nodeMap.has(to))
        throw Object.assign(new Error('self_interactive_edge_endpoint_missing'), {
          code: 'self_interactive_edge_endpoint_missing',
        });
      for (const relationId of relationIds) {
        if (!endpoints.has(relationId) || representedRelations.has(relationId))
          throw Object.assign(new Error('self_interactive_relation_invalid'), {
            code: 'self_interactive_relation_invalid',
          });
        representedRelations.add(relationId);
      }
      return {
        id,
        from,
        to,
        label,
        visualRole: relationIds.some(
          (relationId) =>
            document.relations[relationId].type === 'requires' ||
            document.relations[relationId].type === 'gates' ||
            document.relations[relationId].type === 'authorizes',
        )
          ? 'security'
          : relationIds.some(
                (relationId) =>
                  document.relations[relationId].type === 'returns' ||
                  document.relations[relationId].type === 'renews' ||
                  document.relations[relationId].type === 'excludes',
              )
            ? 'dashed'
            : relationIds.some(
                  (relationId) =>
                    document.relations[relationId].type === 'binds' ||
                    document.relations[relationId].type === 'authors' ||
                    document.relations[relationId].type === 'compiles' ||
                    document.relations[relationId].type === 'derives' ||
                    document.relations[relationId].type === 'propagates',
                )
              ? 'emphasis'
              : 'default',
        ...route(
          nodeMap.get(from),
          nodeMap.get(to),
          {
            width: slots.viewport[0],
            height: slots.viewport[1],
          },
          hint,
        ),
        semanticIds: relationIds.map((relationId) => 'relation:' + relationId),
      };
    });
  assertExactCoverage(
    groupMap.keys(),
    representedGroups,
    'self_interactive_group_coverage_invalid',
  );
  assertExactCoverage(
    view.relations.map(({ id }) => id),
    representedRelations,
    'self_interactive_relation_coverage_invalid',
  );
  return validateInteractiveArchitectureScene({
    schema: 'architecture.interactive-scene/v1',
    id: view.id,
    title: edition.title,
    subtitle: view.label,
    viewport: { width: slots.viewport[0], height: slots.viewport[1] },
    nodes,
    groups: [],
    edges,
  });
}
