import {
  CLAIM_MODEL_SECTIONS,
  canonical,
  exact,
  strings,
  text,
  semanticError,
  normalizedClaimModel,
  claimModelDigest,
  referenceKey,
  validClaimReference,
  jsonValue,
} from './document.mjs';

const key = (section, id) => referenceKey({ section, id });
const sorted = (values) => [...new Set(values)].sort();

function correspondence(rows, a, b, added, removed) {
  if (!Array.isArray(rows)) semanticError('semantic_correspondence_invalid');
  const seenFrom = new Set(),
    seenTo = new Set();
  return rows
    .map((row) => {
      if (
        !exact(row, ['kind', 'section', 'from', 'to', 'evidence']) ||
        !['rename', 'split', 'merge'].includes(row.kind) ||
        !['entities', 'relations', 'claims'].includes(row.section) ||
        !strings(row.from, true) ||
        !strings(row.to, true) ||
        !{
          rename: row.from.length === 1 && row.to.length === 1,
          split: row.from.length === 1 && row.to.length > 1,
          merge: row.from.length > 1 && row.to.length === 1,
        }[row.kind] ||
        !Array.isArray(row.evidence) ||
        !row.evidence.length
      )
        semanticError('semantic_correspondence_invalid');
      for (const [ids, allowed, seen] of [
        [row.from, removed, seenFrom],
        [row.to, added, seenTo],
      ])
        for (const id of ids) {
          const identity = key(row.section, id);
          if (!allowed[row.section].includes(id) || seen.has(identity))
            semanticError('semantic_correspondence_overlap');
          seen.add(identity);
        }
      const evidence = row.evidence.map((e) => {
        if (
          !exact(e, ['version', 'source', 'sha256', 'locator']) ||
          !['before', 'after'].includes(e.version) ||
          !text(e.source) ||
          !text(e.locator) ||
          !Object.hasOwn(
            (e.version === 'before' ? a : b).sources,
            e.source,
          ) ||
          (e.version === 'before' ? a : b).sources[e.source].sha256 !==
            e.sha256
        )
          semanticError('semantic_correspondence_evidence');
        return structuredClone(e);
      });
      if (new Set(evidence.map(canonical)).size !== evidence.length)
        semanticError('semantic_correspondence_evidence');
      evidence.sort((x, y) => (canonical(x) < canonical(y) ? -1 : 1));
      return {
        ...row,
        from: [...row.from].sort(),
        to: [...row.to].sort(),
        evidence,
      };
    })
    .sort((x, y) => (canonical(x) < canonical(y) ? -1 : 1));
}

/** One complete-value diff and conservative dependency compiler; no execution authority. */
export function compileSemanticChange(
  before,
  after,
  views,
  correspondences = [],
) {
  jsonValue(views);
  jsonValue(correspondences);
  const a = normalizedClaimModel(before),
    b = normalizedClaimModel(after);
  if (a.owner !== b.owner) semanticError('semantic_owner_changed');
  const added = {},
    removed = {},
    changed = {};
  for (const section of CLAIM_MODEL_SECTIONS) {
    added[section] = Object.keys(b[section])
      .filter((id) => !Object.hasOwn(a[section], id))
      .sort();
    removed[section] = Object.keys(a[section])
      .filter((id) => !Object.hasOwn(b[section], id))
      .sort();
    changed[section] = Object.keys(a[section])
      .filter(
        (id) =>
          Object.hasOwn(b[section], id) &&
          canonical(a[section][id]) !== canonical(b[section][id]),
      )
      .sort();
  }
  const mappings = correspondence(correspondences, a, b, added, removed);
  if (
    !Array.isArray(views) ||
    views.length > 2000 ||
    views.some(
      (v) =>
        !exact(v, ['id', 'dependsOn', 'views', 'coverage']) ||
        !text(v.id) ||
        !['complete', 'unknown'].includes(v.coverage) ||
        !strings(v.views) ||
        !Array.isArray(v.dependsOn) ||
        v.dependsOn.some((r) => !validClaimReference(r)) ||
        new Set(v.dependsOn.map(referenceKey)).size !== v.dependsOn.length,
    ) ||
    new Set(views.map((v) => v.id)).size !== views.length
  )
    semanticError('semantic_views_invalid');
  const reasons = new Set(),
    reverse = new Map(),
    dependencies = new Map(),
    viewKeys = new Map(views.map((v) => [v.id, key('views', v.id)]));
  const edge = (dependency, dependent) => {
    if (!reverse.has(dependency)) reverse.set(dependency, new Set());
    reverse.get(dependency).add(dependent);
    if (!dependencies.has(dependent)) dependencies.set(dependent, new Set());
    dependencies.get(dependent).add(dependency);
  };
  for (const doc of [a, b]) {
    for (const section of ['entities', 'relations', 'claims']) {
      for (const [id, value] of Object.entries(doc[section])) {
        const dependent = key(section, id);
        for (const source of value.provenance)
          edge(key('sources', source), dependent);
        if (section === 'relations') {
          edge(key('entities', value.subject), dependent);
          edge(key('entities', value.object), dependent);
        }
        if (section === 'claims') {
          for (const ref of value.dependsOn)
            edge(referenceKey(ref), dependent);
          if (value.coverage === 'unknown')
            reasons.add('unknown-claim-dependencies');
        }
      }
    }
  }
  for (const view of views) {
    if (view.coverage === 'unknown') reasons.add('unknown-view-dependencies');
    for (const ref of view.dependsOn) {
      if (
        !Object.hasOwn(a[ref.section], ref.id) &&
        !Object.hasOwn(b[ref.section], ref.id)
      )
        reasons.add('unknown-view-reference');
      edge(referenceKey(ref), viewKeys.get(view.id));
    }
    for (const dependency of view.views) {
      if (!viewKeys.has(dependency)) reasons.add('unknown-view-reference');
      else edge(viewKeys.get(dependency), viewKeys.get(view.id));
    }
  }
  const closure = (seeds, graph = reverse) => {
    const queue = [...seeds],
      reached = new Set(queue);
    for (let i = 0; i < queue.length; i++)
      for (const dependent of graph.get(queue[i]) ?? [])
        if (!reached.has(dependent)) {
          reached.add(dependent);
          queue.push(dependent);
        }
    return reached;
  };
  const changes = CLAIM_MODEL_SECTIONS.flatMap((section) =>
    [...added[section], ...removed[section], ...changed[section]].map(
      (id) => ({ section, id }),
    ),
  );
  const reached = closure(changes.map(referenceKey));
  const represented = closure(viewKeys.values(), dependencies);
  const unrepresented = changes
    .filter((r) =>
      ['entities', 'relations', 'claims'].includes(r.section),
    )
    .filter((r) => !represented.has(referenceKey(r)))
    .map((r) => r.section + ':' + r.id)
    .sort();
  if (unrepresented.length) reasons.add('unrepresented-change');
  if (
    changes.some((r) =>
      ['sources', 'context', 'vocabulary'].includes(r.section),
    )
  )
    reasons.add('source-or-context-change');
  if (!changes.length) reasons.clear();
  const requiresCompleteReview = reasons.size > 0;
  const affectedViews = views
    .filter((v) => requiresCompleteReview || reached.has(viewKeys.get(v.id)))
    .map((v) => v.id)
    .sort();
  const why = requiresCompleteReview
    ? [...reasons].sort()
    : ['transitive-semantic-change'];
  const obligations = {
    rebuild: affectedViews.map((view) => ({ view, reasons: [...why] })),
    verify: affectedViews.map((view) => ({
      view,
      reasons: [...why],
      checks: ['meaning', 'geometry', 'medium-behavior', 'output-identity'],
    })),
    review: affectedViews.map((view) => ({ view, reasons: [...why] })),
  };
  return {
    schema: 'architecture.semantic-change/v2',
    before: claimModelDigest(a),
    after: claimModelDigest(b),
    added,
    removed,
    changed,
    correspondences: mappings,
    affectedClaims: sorted([
      ...Object.keys(a.claims),
      ...Object.keys(b.claims),
    ]).filter(
      (id) => requiresCompleteReview || reached.has(key('claims', id)),
    ),
    affectedViews,
    unrepresented,
    requiresCompleteReview,
    obligations,
    acceptance: 'not-performed',
    scope:
      'Declared meaning and dependencies; not equivalence, layout, executed verification or approval',
  };
}
