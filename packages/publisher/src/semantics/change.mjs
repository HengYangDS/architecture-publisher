import { createHash } from 'node:crypto';
import {
  CLAIM_MODEL_SECTIONS,
  canonical,
  deepFreeze,
  exact,
  record,
  strings,
  text,
  semanticError,
  normalizedClaimModel,
  claimModelDigest,
  referenceKey,
  jsonValue,
} from './document.mjs';

const key = (section, id) => referenceKey({ section, id });
const sorted = (values) => [...new Set(values)].sort();
const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function changedFieldNames(before, after) {
  if (!record(before) || !record(after)) return ['$'];
  return sorted([...Object.keys(before), ...Object.keys(after)]).filter(
    (field) => canonical(before[field]) !== canonical(after[field]),
  );
}

function correspondence(rows, before, after, added, removed) {
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
      const evidence = row.evidence.map((item) => {
        if (
          !exact(item, ['version', 'source', 'sha256', 'locator']) ||
          !['before', 'after'].includes(item.version) ||
          !text(item.source) ||
          !text(item.locator) ||
          !Object.hasOwn((item.version === 'before' ? before : after).sources, item.source) ||
          (item.version === 'before' ? before : after).sources[item.source].sha256 !== item.sha256
        )
          semanticError('semantic_correspondence_evidence');
        return {
          version: item.version,
          source: item.source,
          sha256: item.sha256,
          locator: item.locator,
        };
      });
      if (new Set(evidence.map(canonical)).size !== evidence.length)
        semanticError('semantic_correspondence_evidence');
      evidence.sort((left, right) => lexical(canonical(left), canonical(right)));
      return {
        kind: row.kind,
        section: row.section,
        from: [...row.from].sort(),
        to: [...row.to].sort(),
        evidence,
      };
    })
    .sort((left, right) => lexical(canonical(left), canonical(right)));
}

function dependencyGraph(model, reverse) {
  const edge = (dependency, dependent) => {
    if (!reverse.has(dependency)) reverse.set(dependency, new Set());
    reverse.get(dependency).add(dependent);
  };
  for (const section of ['entities', 'relations', 'claims'])
    for (const [id, value] of Object.entries(model[section])) {
      const dependent = key(section, id);
      for (const source of value.provenance) edge(key('sources', source), dependent);
      if (section === 'relations') {
        edge(key('entities', value.subject), dependent);
        edge(key('entities', value.object), dependent);
      }
      if (section === 'claims') {
        edge(key('entities', value.subject), dependent);
        if (value.object !== null) edge(key('entities', value.object), dependent);
        for (const reference of value.dependsOn) edge(referenceKey(reference), dependent);
      }
    }
}

function closure(seeds, reverse) {
  const queue = [...seeds],
    reached = new Set(queue);
  for (let index = 0; index < queue.length; index++)
    for (const dependent of reverse.get(queue[index]) ?? [])
      if (!reached.has(dependent)) {
        reached.add(dependent);
        queue.push(dependent);
      }
  return reached;
}

/** Compare two valid Claim Models; this owner has no Edition or effect policy. */
export function compileClaimModelDelta(before, after, correspondences = []) {
  jsonValue(correspondences);
  const a = normalizedClaimModel(before),
    b = normalizedClaimModel(after);
  if (a.owner !== b.owner) semanticError('semantic_owner_changed');
  const added = {},
    removed = {},
    changed = {},
    changedFields = {};
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
          Object.hasOwn(b[section], id) && canonical(a[section][id]) !== canonical(b[section][id]),
      )
      .sort();
    changedFields[section] = Object.fromEntries(
      changed[section].map((id) => [id, changedFieldNames(a[section][id], b[section][id])]),
    );
  }
  const mappings = correspondence(correspondences, a, b, added, removed),
    changes = CLAIM_MODEL_SECTIONS.flatMap((section) =>
      [...added[section], ...removed[section], ...changed[section]].map((id) => ({ section, id })),
    ),
    reverse = new Map();
  dependencyGraph(a, reverse);
  dependencyGraph(b, reverse);
  const reached = closure(changes.map(referenceKey), reverse),
    renderChanges = changes.filter(({ section }) => !['sources'].includes(section)),
    renderReached = closure(renderChanges.map(referenceKey), reverse),
    affectedClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter((id) =>
      reached.has(key('claims', id)),
    ),
    renderAffectedClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter(
      (id) => renderReached.has(key('claims', id)),
    ),
    unknownClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter(
      (id) => a.claims[id]?.coverage === 'unknown' || b.claims[id]?.coverage === 'unknown',
    ),
    globalReasons = [];
  if (added.context.length || removed.context.length || changed.context.length)
    globalReasons.push('opaque-context-change');
  if (added.vocabulary.length || removed.vocabulary.length || changed.vocabulary.length)
    globalReasons.push('vocabulary-change');
  if (renderChanges.length && unknownClaims.length)
    globalReasons.push('unknown-claim-dependencies');
  return {
    schema: 'architecture.claim-model-change/v1',
    before: claimModelDigest(a),
    after: claimModelDigest(b),
    added,
    removed,
    changed,
    changedFields,
    correspondences: mappings,
    affectedClaims,
    renderAffectedClaims,
    affectedReferences: [...reached].sort(),
    unknownClaims,
    globalReasons: sorted(globalReasons),
    hasChanges: changes.length > 0,
    scope:
      'Claim Model identity and dependency change only; no Edition, artifact, verification, acceptance or publication effect',
  };
}

const nativeDigest = (value) => createHash('sha256').update(canonical(value)).digest('hex');
const nativeIdentity = ({ namespace, id }) => canonical([namespace, id]);
const relationValues = (members) =>
  members
    .map(({ from, to, kind, direction, label, opaqueMetadata }) =>
      canonical([from, to, kind, direction, label, opaqueMetadata]),
    )
    .sort();

function validClaimDependencyBindings(selection) {
  if (selection.format !== 'architecture.claim-model/v2') return true;
  if (selection.target?.kind !== 'claim') return !Object.hasOwn(selection, 'dependencyBindings');
  if (!Array.isArray(selection.members?.claims) || !selection.members.claims.every(record))
    return false;
  const claim = selection.members.claims.find(
    (member) => record(member) && member.id === selection.target.id,
  );
  if (
    !claim ||
    !Array.isArray(claim.dependsOn) ||
    !claim.dependsOn.every(
      (reference) =>
        exact(reference, ['section', 'id']) &&
        ['entities', 'relations', 'sources'].includes(reference.section) &&
        text(reference.id),
    ) ||
    !Array.isArray(selection.dependencyBindings)
  )
    return false;
  const expected = claim.dependsOn.map(referenceKey).sort();
  if (new Set(expected).size !== expected.length) return false;
  const bindings = selection.dependencyBindings;
  if (
    bindings.length !== expected.length ||
    !bindings.every(
      (binding) =>
        exact(binding, ['section', 'id', 'sha256']) &&
        text(binding.section) &&
        text(binding.id) &&
        /^[0-9a-f]{64}$/u.test(binding.sha256),
    )
  )
    return false;
  const received = bindings.map(referenceKey).sort();
  return canonical(received) === canonical(expected);
}

const claimSelectionCorrespondence = (selection) =>
  canonical([
    selection.sourceClass,
    selection.sourceOwner,
    selection.source.namespace,
    selection.source.claimant,
    selection.source.format,
    selection.source.adapter ?? null,
    selection.source.method ?? null,
    selection.source.derivedFrom ?? null,
    selection.target.id,
    selection.target.identityScope,
  ]);

function nativeSide(value) {
  if (
    !record(value) ||
    value.lock?.schema !== 'architecture.materialized-input-lock/v1' ||
    !Array.isArray(value.lock.sources) ||
    !Array.isArray(value.lock.derived) ||
    !record(value.native) ||
    !Array.isArray(value.native.selections) ||
    !Array.isArray(value.native.limits) ||
    value.native.semanticDigest !== nativeDigest(value.native.selections) ||
    value.native.subjectLockSha256 !== nativeDigest(value.lock)
  )
    semanticError('native_evolution_input_invalid');
  const sources = new Map();
  for (const source of value.lock.sources) {
    if (!text(source?.namespace) || !text(source?.sha256) || sources.has(source.namespace))
      semanticError('native_evolution_input_invalid');
    sources.set(source.namespace, source);
  }
  const derived = new Map();
  for (const projection of value.lock.derived) {
    if (
      !text(projection?.namespace) ||
      !text(projection?.sha256) ||
      sources.has(projection.namespace) ||
      derived.has(projection.namespace)
    )
      semanticError('native_evolution_input_invalid');
    derived.set(projection.namespace, projection);
  }
  const selections = new Map();
  for (const selection of value.native.selections) {
    if (
      selection?.format === 'architecture.claim-model/v2' &&
      !['native', 'derived'].includes(selection.sourceClass)
    )
      semanticError('native_evolution_input_invalid');
    const selectedSource =
      selection?.sourceClass === 'derived'
        ? derived.get(selection.source?.namespace)
        : sources.get(selection?.source?.namespace);
    if (
      !text(selection?.selectionId) ||
      !record(selection.source) ||
      !record(selection.target) ||
      !record(selection.members) ||
      !Array.isArray(selection.members.elements) ||
      !Array.isArray(selection.members.relations) ||
      !Array.isArray(selection.limits) ||
      !validClaimDependencyBindings(selection) ||
      !selectedSource ||
      selectedSource.sha256 !== selection.source.sha256 ||
      selections.has(selection.selectionId)
    )
      semanticError('native_evolution_input_invalid');
    selections.set(selection.selectionId, selection);
  }
  return { lock: value.lock, native: value.native, sources, derived, selections };
}

function mapMembers(members, identity) {
  const result = new Map();
  for (const member of members) {
    const key = identity(member);
    if (result.has(key)) semanticError('native_evolution_input_invalid');
    result.set(key, member);
  }
  return result;
}

function claimModelSelectionChanges(prior, next, selectionId, add, unknown) {
  if (!Array.isArray(prior.members.claims) || !Array.isArray(next.members.claims))
    semanticError('native_evolution_input_invalid');
  for (const field of ['sourceClass', 'sourceOwner'])
    if (canonical(prior[field]) !== canonical(next[field]))
      unknown.push({ reason: `claim-model-${field}-changed`, selectionId });
  if (canonical(prior.provenanceSources) !== canonical(next.provenanceSources))
    unknown.push({ reason: 'claim-model-provenance-changed', selectionId });
  if (canonical(prior.source.adapter) !== canonical(next.source.adapter))
    unknown.push({ reason: 'claim-model-adapter-changed', selectionId });
  const namespace = next.source.namespace;
  if (prior.source.namespace !== namespace)
    unknown.push({ reason: 'claim-model-namespace-changed', selectionId });
  if (canonical(prior.predicate) !== canonical(next.predicate)) {
    const predicateId = next.members.claims[0]?.predicate ?? prior.members.claims[0]?.predicate;
    if (!text(predicateId))
      unknown.push({ reason: 'claim-model-predicate-binding-changed', selectionId });
    else
      add(
        selectionId,
        { kind: 'predicate', namespace, id: predicateId },
        changedFieldNames(prior.predicate, next.predicate),
      );
  }
  if (
    prior.target.kind === 'claim' &&
    next.target.kind === 'claim' &&
    claimSelectionCorrespondence(prior) === claimSelectionCorrespondence(next)
  ) {
    const previous = new Map(
      prior.dependencyBindings.map((binding) => [referenceKey(binding), binding.sha256]),
    );
    for (const binding of next.dependencyBindings)
      if (
        previous.has(referenceKey(binding)) &&
        previous.get(referenceKey(binding)) !== binding.sha256
      )
        add(
          selectionId,
          {
            kind: 'claim-dependency',
            namespace,
            id: next.target.id,
            reference: { section: binding.section, id: binding.id },
          },
          ['target-value'],
        );
  }
  const memberSections =
    /** @type {Array<['elements' | 'relations' | 'claims', string, string[]]>} */ ([
      ['elements', 'entity', ['kind', 'label', 'qualifiers', 'provenance']],
      ['relations', 'relation', ['from', 'to', 'kind', 'qualifiers', 'provenance']],
      [
        'claims',
        'claim',
        [
          'subject',
          'predicate',
          'object',
          'plane',
          'condition',
          'scope',
          'maturity',
          'validity',
          'value',
          'dependsOn',
          'coverage',
          'provenance',
        ],
      ],
    ]);
  for (const [section, subjectKind, fields] of memberSections) {
    const left = mapMembers(prior.members[section], ({ id }) => id);
    const right = mapMembers(next.members[section], ({ id }) => id);
    if (canonical([...left.keys()].sort()) !== canonical([...right.keys()].sort()))
      add(selectionId, { kind: 'selection-membership', namespace, id: next.target.id }, [section]);
    for (const id of sorted([...left.keys(), ...right.keys()])) {
      if (!left.has(id) || !right.has(id)) continue;
      const changed = changedFieldNames(left.get(id), right.get(id));
      const supported = changed.filter((field) => fields.includes(field));
      add(selectionId, { kind: subjectKind, namespace, id }, supported);
      const unrecognized = changed.filter(
        (field) =>
          !fields.includes(field) &&
          !['id', 'namespace', 'sha256', 'origin', 'identityScope'].includes(field),
      );
      if (unrecognized.length)
        unknown.push({ reason: 'claim-model-member-field-unrecognized', selectionId });
    }
  }
}

/** Compare admitted native selections without converting them to an editable Claim Model. */
export function compileNativeSelectionDelta(beforeValue, afterValue) {
  const before = nativeSide(beforeValue);
  const after = nativeSide(afterValue);
  const sourceBytes = /** @type {{added: string[], removed: string[], changed: string[]}} */ ({
    added: [],
    removed: [],
    changed: [],
  });
  const sourceBindings = /** @type {{changed: string[]}} */ ({ changed: [] });
  for (const namespace of sorted([...before.sources.keys(), ...after.sources.keys()])) {
    const prior = before.sources.get(namespace);
    const next = after.sources.get(namespace);
    if (!prior) sourceBytes.added.push(namespace);
    else if (!next) sourceBytes.removed.push(namespace);
    else {
      if (prior.sha256 !== next.sha256) sourceBytes.changed.push(namespace);
      if (
        canonical([prior.claimant, prior.format, prior.revision]) !==
        canonical([next.claimant, next.format, next.revision])
      )
        sourceBindings.changed.push(namespace);
    }
  }
  const supported = [];
  const unknown = [];
  for (const namespace of sorted([...before.derived.keys(), ...after.derived.keys()])) {
    const prior = before.derived.get(namespace);
    const next = after.derived.get(namespace);
    if (!prior || !next)
      unknown.push({
        reason: prior ? 'derived-projection-removed' : 'derived-projection-added',
        namespace,
      });
    else if (prior.sha256 !== next.sha256)
      unknown.push({ reason: 'derived-projection-bytes-changed', namespace });
    else if (canonical(prior) !== canonical(next))
      unknown.push({ reason: 'derived-projection-binding-changed', namespace });
  }
  if (
    before.native.subjectLockSha256 === after.native.subjectLockSha256 &&
    canonical(before.native.parserSupply) === canonical(after.native.parserSupply) &&
    before.native.semanticDigest !== after.native.semanticDigest
  )
    unknown.push({ reason: 'native-output-drift' });
  if (canonical(sorted(before.native.limits)) !== canonical(sorted(after.native.limits)))
    unknown.push({ reason: 'native-limits-changed' });
  if (before.native.nativeClosure !== after.native.nativeClosure)
    unknown.push({ reason: 'native-closure-changed' });
  const changedSourceSet = new Set([
    ...sourceBytes.added,
    ...sourceBytes.removed,
    ...sourceBytes.changed,
  ]);
  const add = (selectionId, subject, fields) => {
    if (fields.length) supported.push({ selectionId, subject, fields: sorted(fields) });
  };
  for (const selectionId of sorted([...before.selections.keys(), ...after.selections.keys()])) {
    const prior = before.selections.get(selectionId);
    const next = after.selections.get(selectionId);
    if (!prior || !next) {
      add(selectionId, { kind: 'selection', id: selectionId }, [prior ? 'removed' : 'added']);
      continue;
    }
    if (canonical(sorted(prior.limits)) !== canonical(sorted(next.limits)))
      unknown.push({ reason: 'selection-limits-changed', selectionId });
    const targetFields = ['kind', 'id', 'identityScope'].filter(
      (field) => canonical(prior.target[field]) !== canonical(next.target[field]),
    );
    add(selectionId, { kind: 'selection', id: selectionId }, targetFields);
    if (prior.format !== next.format) {
      unknown.push({ reason: 'native-selection-format-changed', selectionId });
      continue;
    }
    if (next.format === 'architecture.claim-model/v2') {
      claimModelSelectionChanges(prior, next, selectionId, add, unknown);
      continue;
    }
    const priorElements = mapMembers(prior.members.elements, nativeIdentity);
    const nextElements = mapMembers(next.members.elements, nativeIdentity);
    const priorRelations = mapMembers(prior.members.relations, (item) =>
      nativeIdentity({ namespace: item.origin?.namespace, id: item.id }),
    );
    const nextRelations = mapMembers(next.members.relations, (item) =>
      nativeIdentity({ namespace: item.origin?.namespace, id: item.id }),
    );
    const membershipFields = [];
    if (canonical([...priorElements.keys()].sort()) !== canonical([...nextElements.keys()].sort()))
      membershipFields.push('elements');
    const relationIdsChanged =
      canonical([...priorRelations.keys()].sort()) !== canonical([...nextRelations.keys()].sort());
    if (
      relationIdsChanged ||
      [...priorRelations.values(), ...nextRelations.values()].some(({ origin }) =>
        changedSourceSet.has(origin.namespace),
      )
    )
      unknown.push({ reason: 'relation-lineage-unproved', selectionId });
    if (
      canonical(relationValues(prior.members.relations)) !==
      canonical(relationValues(next.members.relations))
    )
      add(
        selectionId,
        { kind: 'relation-set', namespace: next.target.origin.namespace, id: next.target.id },
        ['relation-values'],
      );
    add(
      selectionId,
      {
        kind: next.target.kind === 'view' ? 'view-membership' : 'selection-membership',
        namespace: next.target.origin.namespace,
        id: next.target.id,
      },
      membershipFields,
    );
    for (const identity of sorted([...priorElements.keys(), ...nextElements.keys()])) {
      const left = priorElements.get(identity);
      const right = nextElements.get(identity);
      if (!left || !right) continue;
      add(
        selectionId,
        { kind: 'element', namespace: right.namespace, id: right.id },
        ['kind', 'label', 'opaqueMetadata'].filter(
          (field) => canonical(left[field]) !== canonical(right[field]),
        ),
      );
    }
  }
  const changedSources = sorted([
    ...sourceBytes.added,
    ...sourceBytes.removed,
    ...sourceBytes.changed,
  ]);
  if (
    changedSources.length &&
    (before.native.nativeClosure !== 'complete' || after.native.nativeClosure !== 'complete')
  )
    unknown.push({ reason: 'dependency-closure-unproved', sources: changedSources });
  const supplyChanged =
    canonical(before.native.parserSupply) !== canonical(after.native.parserSupply);
  supported.sort((left, right) => lexical(canonical(left), canonical(right)));
  unknown.sort((left, right) => lexical(canonical(left), canonical(right)));
  return deepFreeze({
    schema: 'architecture.native-selection-change/v1',
    before: before.native.semanticDigest,
    after: after.native.semanticDigest,
    sourceBytes,
    sourceBindings,
    supported,
    unknown,
    supplyChanged,
    hasChanges:
      changedSources.length > 0 ||
      sourceBindings.changed.length > 0 ||
      supported.length > 0 ||
      unknown.length > 0 ||
      supplyChanged,
    scope: 'Selected native change facts only; no Edition, media, approval or publication effect',
  });
}
