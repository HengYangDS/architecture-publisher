import { canonical, exact, record } from '../semantics/document.mjs';
import { compileClaimModelDelta, compileNativeSelectionDelta } from '../semantics/change.mjs';
import { inspectEditionForEvolution, normalizedEdition } from './contract.mjs';

const obligationKeys = Object.freeze([
  'rebuild',
  'semanticVerification',
  'mediumVerification',
  'humanReview',
  'acceptance',
  'publication',
]);
const sorted = (values) => [...new Set(values)].sort();
const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const evolutionError = (code, detail = '') => {
  throw Object.assign(new Error(code + (detail ? ': ' + detail : '')), {
    code,
  });
};

function side(value, inspect = false) {
  if (
    !exact(value, ['claimModel', 'editions']) ||
    !Array.isArray(value.editions) ||
    value.editions.length > 256
  )
    evolutionError('edition_evolution_input_invalid');
  const editions = new Map(),
    qualificationObligations = new Map(),
    digests = {};
  for (const edition of value.editions) {
    const inspected = inspect
        ? inspectEditionForEvolution(value.claimModel, edition)
        : {
            edition: normalizedEdition(value.claimModel, edition),
            digest: null,
            qualificationObligations: null,
          },
      normalized = inspected.edition;
    if (editions.has(normalized.id)) evolutionError('edition_evolution_duplicate', normalized.id);
    editions.set(normalized.id, normalized);
    if (inspected.qualificationObligations)
      qualificationObligations.set(normalized.id, inspected.qualificationObligations);
    digests[normalized.id] =
      inspected.digest ?? inspectEditionForEvolution(value.claimModel, normalized).digest;
  }
  return {
    claimModel: value.claimModel,
    editions,
    qualificationObligations,
    digests,
  };
}

function sceneReferences(scene) {
  return {
    entities: new Set(scene.composition.groups.flatMap((group) => group.entities)),
    relations: new Set(scene.composition.relations.map((relation) => relation.id)),
  };
}

function admitExistingEvolutionEdition(beforeModel, afterModel, edition) {
  try {
    normalizedEdition(afterModel, edition);
    return;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (!['edition_overview_incomplete', 'edition_overview_carrier_drift'].includes(String(code)))
      throw error;
    const overview = edition.scenes.interactive[edition.narrative[0]],
      staticReferences = sceneReferences(edition.scenes.static),
      interactiveReferences = sceneReferences(overview);
    for (const section of ['entities', 'relations']) {
      const retained = Object.keys(beforeModel[section]).filter((id) =>
        Object.hasOwn(afterModel[section], id),
      );
      if (
        retained.some(
          (id) => !staticReferences[section].has(id) || !interactiveReferences[section].has(id),
        )
      )
        throw error;
    }
  }
}

const different = (left, right) => canonical(left) !== canonical(right);
const changedKeys = (left, right) =>
  sorted([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]).filter((key) =>
    different(left?.[key], right?.[key]),
  );
const intersects = (values, selected) => values.some((value) => selected.has(value));

function sceneFacts(scene, model) {
  return {
    claims: new Set(scene?.claims ?? []),
    questions: new Set(scene?.questions ?? []),
    entities: new Set((scene?.composition?.groups ?? []).flatMap((group) => group.entities)),
    relations: new Set((scene?.composition?.relations ?? []).map((relation) => relation.id)),
    entityTypes: new Set(
      (scene?.composition?.groups ?? [])
        .flatMap((group) => group.entities)
        .map((id) => model.entities[id]?.type)
        .filter(Boolean),
    ),
    relationTypes: new Set(
      (scene?.composition?.relations ?? [])
        .map((relation) => model.relations[relation.id]?.type)
        .filter(Boolean),
    ),
  };
}

function allScenes(edition, model) {
  return {
    static: sceneFacts(edition?.scenes.static, model),
    interactive: new Map(
      Object.entries(edition?.scenes.interactive ?? {}).map(([id, scene]) => [
        id,
        sceneFacts(scene, model),
      ]),
    ),
  };
}

function representedReferences(edition, model) {
  const scenes = allScenes(edition, model),
    represented = new Set(),
    add = (facts) => {
      for (const section of ['entities', 'relations', 'claims'])
        for (const id of facts[section]) represented.add(`${section}:${id}`);
    };
  add(scenes.static);
  for (const facts of scenes.interactive.values()) add(facts);
  for (const id of edition.requiredClaims) represented.add(`claims:${id}`);
  for (const id of Object.keys(edition.omissions)) represented.add(`claims:${id}`);
  return represented;
}

function unrepresentedChanges(delta, beforeEdition, afterEdition, beforeModel, afterModel) {
  const represented = new Set([
      ...representedReferences(beforeEdition, beforeModel),
      ...representedReferences(afterEdition, afterModel),
    ]),
    overviewCarries = (edition, section, id) => {
      const overview = edition.scenes.interactive[edition.narrative[0]],
        selected = (scene) =>
          section === 'entities'
            ? scene.composition.groups.flatMap((group) => group.entities)
            : scene.composition.relations.map((relation) => relation.id);
      return selected(edition.scenes.static).includes(id) && selected(overview).includes(id);
    },
    structurallyRepresented = (section, id) =>
      [
        [beforeEdition, beforeModel],
        [afterEdition, afterModel],
      ]
        .filter(([, model]) => Object.hasOwn(model[section], id))
        .every(([edition]) => overviewCarries(edition, section, id)),
    unrepresented = [];
  for (const section of ['entities', 'relations', 'claims'])
    for (const kind of ['added', 'removed', 'changed'])
      for (const id of delta[kind][section])
        if (
          (section === 'claims' && !represented.has(`${section}:${id}`)) ||
          (section !== 'claims' && !structurallyRepresented(section, id))
        )
          unrepresented.push(`${section}:${id}`);
  return sorted(unrepresented);
}

function changeReasons(delta, editionFields) {
  const reasons = [],
    singular = {
      sources: 'source',
      entities: 'entity',
      relations: 'relation',
      claims: 'claim',
      context: 'context',
    };
  for (const section of ['sources', 'entities', 'relations', 'claims', 'context'])
    for (const kind of ['added', 'removed', 'changed'])
      for (const id of delta[kind][section] ?? [])
        reasons.push(`${singular[section]}-${kind}:${id}`);
  for (const field of delta.changed.vocabulary ?? []) reasons.push(`vocabulary-changed:${field}`);
  for (const field of editionFields) reasons.push(`edition-field:${field}`);
  return sorted(reasons);
}

function semanticSceneImpact(
  delta,
  beforeEdition,
  afterEdition,
  beforeModel,
  afterModel,
  conservativeClaims = [],
) {
  const directEntities = new Set([
      ...delta.added.entities,
      ...delta.removed.entities,
      ...delta.changed.entities,
    ]),
    directRelations = new Set([
      ...delta.added.relations,
      ...delta.removed.relations,
      ...delta.changed.relations,
    ]),
    renderedClaims = new Set([...delta.renderAffectedClaims, ...conservativeClaims]),
    broad = delta.globalReasons.some((reason) =>
      ['opaque-context-change', 'vocabulary-change'].includes(reason),
    ),
    beforeScenes = allScenes(beforeEdition, beforeModel),
    afterScenes = allScenes(afterEdition, afterModel),
    affected = { static: false, interactive: new Set() };
  const touches = (facts) =>
    broad ||
    intersects([...facts.claims], renderedClaims) ||
    intersects([...facts.entities], directEntities) ||
    intersects([...facts.relations], directRelations);
  affected.static = touches(beforeScenes.static) || touches(afterScenes.static);
  for (const id of sorted([...beforeScenes.interactive.keys(), ...afterScenes.interactive.keys()]))
    if (
      touches(beforeScenes.interactive.get(id) ?? sceneFacts(null, beforeModel)) ||
      touches(afterScenes.interactive.get(id) ?? sceneFacts(null, afterModel))
    )
      affected.interactive.add(id);
  return affected;
}

function authoredSceneImpact(beforeEdition, afterEdition, beforeModel, afterModel) {
  const affected = { static: false, interactive: new Set(), atlas: false },
    fields = changedKeys(beforeEdition, afterEdition);
  if (different(beforeEdition.scenes.static, afterEdition.scenes.static)) affected.static = true;
  const interactiveIds = sorted([
    ...Object.keys(beforeEdition.scenes.interactive),
    ...Object.keys(afterEdition.scenes.interactive),
  ]);
  for (const id of interactiveIds)
    if (different(beforeEdition.scenes.interactive[id], afterEdition.scenes.interactive[id]))
      affected.interactive.add(id);
  if (
    different(beforeEdition.narrative, afterEdition.narrative) ||
    different(
      Object.keys(beforeEdition.scenes.interactive).sort(),
      Object.keys(afterEdition.scenes.interactive).sort(),
    )
  )
    affected.atlas = true;

  if (fields.includes('title')) {
    affected.static = true;
    for (const id of interactiveIds) affected.interactive.add(id);
  }
  const changedQuestions = changedKeys(beforeEdition.questions, afterEdition.questions),
    changedAudiences = new Set(changedKeys(beforeEdition.audiences, afterEdition.audiences)),
    questions = new Set(changedQuestions);
  for (const [id, question] of Object.entries(beforeEdition.questions))
    if (changedAudiences.has(question.audience)) questions.add(id);
  for (const [id, question] of Object.entries(afterEdition.questions))
    if (changedAudiences.has(question.audience)) questions.add(id);
  if (
    intersects(beforeEdition.scenes.static.questions, questions) ||
    intersects(afterEdition.scenes.static.questions, questions)
  )
    affected.static = true;
  for (const id of interactiveIds) {
    const before = beforeEdition.scenes.interactive[id],
      after = afterEdition.scenes.interactive[id];
    if (
      intersects(before?.questions ?? [], questions) ||
      intersects(after?.questions ?? [], questions)
    )
      affected.interactive.add(id);
  }

  const beforeGrammar = beforeEdition.visualGrammar,
    afterGrammar = afterEdition.visualGrammar;
  if (different(beforeGrammar.principles, afterGrammar.principles)) {
    affected.static = true;
    for (const id of interactiveIds) affected.interactive.add(id);
  } else {
    const entityTypes = new Set(changedKeys(beforeGrammar.entityTypes, afterGrammar.entityTypes)),
      relationTypes = new Set(changedKeys(beforeGrammar.relationTypes, afterGrammar.relationTypes)),
      beforeScenes = allScenes(beforeEdition, beforeModel),
      afterScenes = allScenes(afterEdition, afterModel),
      touches = (facts) =>
        intersects([...facts.entityTypes], entityTypes) ||
        intersects([...facts.relationTypes], relationTypes);
    if (touches(beforeScenes.static) || touches(afterScenes.static)) affected.static = true;
    for (const id of interactiveIds)
      if (
        touches(beforeScenes.interactive.get(id) ?? sceneFacts(null, beforeModel)) ||
        touches(afterScenes.interactive.get(id) ?? sceneFacts(null, afterModel))
      )
        affected.interactive.add(id);
  }
  return { affected, fields };
}

function qualificationChanges(beforeEdition, afterEdition) {
  return new Set(changedKeys(beforeEdition.qualification, afterEdition.qualification));
}

function addUnique(target, value) {
  const identity = canonical(value);
  if (!target.some((item) => canonical(item) === identity)) target.push(value);
}

function predicates(edition, ...kinds) {
  return sorted(kinds.flatMap((kind) => edition.qualification[kind] ?? []));
}

function addVerificationObligations(
  obligations,
  edition,
  editionObligations,
  impact,
  qualificationChanged,
  reasons,
  humanReviewRequired = impact.static ||
    impact.atlas ||
    impact.interactive.size > 0 ||
    qualificationChanged.has('human'),
) {
  addUnique(obligations.semanticVerification, {
    edition: edition.id,
    predicates: predicates(edition, 'semantic', 'coverage'),
    reasons,
  });
  if (
    impact.static ||
    qualificationChanged.has('static') ||
    qualificationChanged.has('accessibility')
  )
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: 'static',
      scene: 'static',
      predicates: predicates(edition, 'static', 'accessibility'),
      reasons,
    });
  if (impact.atlas)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: 'interactive',
      scene: null,
      predicates: predicates(edition, 'interactive', 'accessibility'),
      reasons,
    });
  const interactive = new Set(impact.interactive);
  if (qualificationChanged.has('interactive') || qualificationChanged.has('accessibility'))
    for (const id of Object.keys(edition.scenes.interactive)) interactive.add(id);
  for (const id of [...interactive].sort())
    if (Object.hasOwn(edition.scenes.interactive, id))
      addUnique(obligations.mediumVerification, {
        edition: edition.id,
        medium: 'interactive',
        scene: id,
        predicates: predicates(edition, 'interactive', 'accessibility'),
        reasons,
      });
  if (edition.qualification.installed.length)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: 'installed-use',
      scene: null,
      predicates: predicates(edition, 'installed'),
      reasons,
    });
  if (edition.qualification.recovery.length)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: 'recovery',
      scene: null,
      predicates: predicates(edition, 'recovery'),
      reasons,
    });
  if (humanReviewRequired)
    for (const { predicate, scope } of editionObligations.filter(
      (item) =>
        item.kind === 'human' &&
        (qualificationChanged.has('human') ||
          (item.scope.medium === 'static' && impact.static) ||
          (item.scope.medium === 'interactive' && (impact.atlas || impact.interactive.size > 0))),
    ))
      addUnique(obligations.humanReview, {
        edition: edition.id,
        predicate,
        scope: structuredClone(scope),
        reasons,
      });
}

function addRebuildObligations(obligations, edition, impact, reasons) {
  addUnique(obligations.rebuild, {
    edition: edition.id,
    target: 'publication-bundle',
    scene: null,
    reasons,
  });
  if (impact.static)
    addUnique(obligations.rebuild, {
      edition: edition.id,
      target: 'static',
      scene: 'static',
      reasons,
    });
  if (impact.atlas)
    addUnique(obligations.rebuild, {
      edition: edition.id,
      target: 'interactive-atlas',
      scene: null,
      reasons,
    });
  for (const id of [...impact.interactive].sort())
    if (Object.hasOwn(edition.scenes.interactive, id))
      addUnique(obligations.rebuild, {
        edition: edition.id,
        target: 'interactive',
        scene: id,
        reasons,
      });
}

/** Compile exact Claim Model and Edition changes into non-executing obligations. */
export function compileEditionEvolution(input) {
  if (!record(input) || !exact(input, ['before', 'after', 'correspondences']))
    evolutionError('edition_evolution_input_invalid');
  const before = side(input.before),
    after = side(input.after, true),
    delta = compileClaimModelDelta(before.claimModel, after.claimModel, input.correspondences),
    beforeDigests = Object.fromEntries(
      Object.entries(before.digests).sort(([left], [right]) => lexical(left, right)),
    ),
    afterDigests = Object.fromEntries(
      Object.entries(after.digests).sort(([left], [right]) => lexical(left, right)),
    ),
    ids = sorted([...before.editions.keys(), ...after.editions.keys()]),
    added = ids.filter((id) => !before.editions.has(id) && after.editions.has(id)),
    removed = ids.filter((id) => before.editions.has(id) && !after.editions.has(id)),
    changed = ids.filter(
      (id) =>
        before.editions.has(id) && after.editions.has(id) && beforeDigests[id] !== afterDigests[id],
    ),
    affected = [],
    obligations = /** @type {Record<string, Array<Record<string, any>>>} */ (
      Object.fromEntries(obligationKeys.map((key) => [key, []]))
    );

  for (const [id, edition] of after.editions) {
    const prior = before.editions.get(id);
    if (prior) admitExistingEvolutionEdition(before.claimModel, after.claimModel, edition);
    else normalizedEdition(after.claimModel, edition);
  }

  for (const id of ids) {
    const prior = before.editions.get(id),
      next = after.editions.get(id);
    if (prior && next && prior.owner !== next.owner) evolutionError('edition_owner_changed', id);
    if (!prior && next) {
      const interactive = Object.keys(next.scenes.interactive).sort(),
        reasons = ['edition-added'],
        impact = { static: true, interactive: new Set(interactive), atlas: true };
      affected.push({
        edition: id,
        beforeDigest: null,
        afterDigest: afterDigests[id],
        claims: sorted([...next.requiredClaims, ...Object.keys(next.omissions)]),
        static: true,
        interactiveAtlas: true,
        interactive,
        reasons,
        scope: 'complete',
      });
      addRebuildObligations(obligations, next, impact, reasons);
      addVerificationObligations(
        obligations,
        next,
        after.qualificationObligations.get(id),
        impact,
        new Set(),
        reasons,
      );
      obligations.acceptance.push({ edition: id, action: 'accept', reasons });
      obligations.publication.push({ edition: id, action: 'publish', scene: null, reasons });
      continue;
    }
    if (prior && !next) {
      const reasons = ['edition-removed'];
      affected.push({
        edition: id,
        beforeDigest: beforeDigests[id],
        afterDigest: null,
        claims: sorted([...prior.requiredClaims, ...Object.keys(prior.omissions)]),
        static: false,
        interactiveAtlas: false,
        interactive: [],
        reasons,
        scope: 'complete',
      });
      obligations.acceptance.push({ edition: id, action: 'withdraw', reasons });
      obligations.publication.push({ edition: id, action: 'withdraw', scene: null, reasons });
      continue;
    }
    if (!changed.includes(id)) continue;

    const meaningChanged = ['entities', 'relations', 'claims', 'context', 'vocabulary'].some(
        (section) =>
          ['added', 'removed', 'changed'].some((kind) => delta[kind][section].length > 0),
      ),
      representedUnknownClaims = meaningChanged
        ? delta.unknownClaims.filter((claim) =>
            [prior, next].some(
              (edition) =>
                edition.requiredClaims.includes(claim) ||
                edition.omissions[claim]?.disposition === 'represented-by',
            ),
          )
        : [],
      semantic = semanticSceneImpact(
        delta,
        prior,
        next,
        before.claimModel,
        after.claimModel,
        representedUnknownClaims,
      ),
      authored = authoredSceneImpact(prior, next, before.claimModel, after.claimModel),
      unrepresented = unrepresentedChanges(delta, prior, next, before.claimModel, after.claimModel),
      broad = unrepresented.length > 0,
      impact = {
        static: broad || semantic.static || authored.affected.static,
        interactive: new Set([
          ...(broad ? Object.keys(next.scenes.interactive) : []),
          ...semantic.interactive,
          ...authored.affected.interactive,
        ]),
        atlas: authored.affected.atlas,
      },
      claims = sorted([
        ...delta.affectedClaims.filter(
          (claim) =>
            prior.requiredClaims.includes(claim) ||
            next.requiredClaims.includes(claim) ||
            Object.hasOwn(prior.omissions, claim) ||
            Object.hasOwn(next.omissions, claim),
        ),
        ...representedUnknownClaims,
      ]),
      unknown =
        representedUnknownClaims.length > 0 ||
        claims.some(
          (claim) =>
            before.claimModel.claims[claim]?.coverage === 'unknown' ||
            after.claimModel.claims[claim]?.coverage === 'unknown',
        ),
      scope =
        unknown ||
        broad ||
        delta.globalReasons.some((reason) =>
          ['opaque-context-change', 'vocabulary-change'].includes(reason),
        )
          ? 'complete'
          : 'targeted',
      reasons = sorted([
        ...changeReasons(delta, authored.fields),
        ...representedUnknownClaims.map((claim) => `unknown-claim-dependencies:${claim}`),
        ...unrepresented.map((reference) => `unrepresented-change:${reference}`),
      ]),
      qualificationChanged = qualificationChanges(prior, next),
      removedScenes = Object.keys(prior.scenes.interactive)
        .filter((scene) => !Object.hasOwn(next.scenes.interactive, scene))
        .sort();
    affected.push({
      edition: id,
      beforeDigest: beforeDigests[id],
      afterDigest: afterDigests[id],
      claims,
      unrepresented,
      static: impact.static,
      interactiveAtlas: impact.atlas,
      interactive: [...impact.interactive].sort(),
      reasons,
      scope,
    });
    addRebuildObligations(obligations, next, impact, reasons);
    addVerificationObligations(
      obligations,
      next,
      after.qualificationObligations.get(id),
      impact,
      qualificationChanged,
      reasons,
    );
    obligations.acceptance.push({ edition: id, action: 'reaccept', reasons });
    obligations.publication.push({ edition: id, action: 'replace', scene: null, reasons });
    for (const scene of removedScenes)
      obligations.publication.push({
        edition: id,
        action: 'withdraw',
        scene,
        reasons: sorted([...reasons, `interactive-scene-removed:${scene}`]),
      });
  }

  return {
    schema: 'architecture.semantic-change/v2',
    before: { claimModel: delta.before, editions: beforeDigests },
    after: { claimModel: delta.after, editions: afterDigests },
    delta,
    editions: { added, removed, changed, affected },
    obligations,
    scope:
      'Impact compilation only; no execution, evidence, approval, acceptance or publication effect',
  };
}

function nativeEvolutionSide(value) {
  if (
    !exact(value, ['lock', 'meaning']) ||
    value.lock?.schema !== 'architecture.materialized-input-lock/v1' ||
    !record(value.meaning) ||
    !record(value.meaning.edition) ||
    !record(value.meaning.native) ||
    !record(value.meaning.media) ||
    !Array.isArray(value.meaning.questions) ||
    !Array.isArray(value.meaning.assertions) ||
    !Array.isArray(value.lock.media) ||
    value.meaning.edition.sha256 !== value.lock.edition?.sha256 ||
    value.meaning.edition.id !== value.lock.edition?.id ||
    value.meaning.edition.editor !== value.lock.edition?.editor ||
    different(Object.keys(value.meaning.media).sort(), [...value.lock.media].sort())
  )
    evolutionError('native_evolution_input_invalid');
  for (const medium of value.lock.media)
    if (!Array.isArray(value.meaning.media[medium]?.views))
      evolutionError('native_evolution_input_invalid');
  return value;
}

function nativeReasons(delta, before, after, authoredChanged) {
  const reasons = [];
  for (const kind of ['added', 'removed', 'changed'])
    for (const namespace of delta.sourceBytes[kind])
      reasons.push(`source-bytes-${kind}:${namespace}`);
  for (const namespace of delta.sourceBindings.changed)
    reasons.push(`source-binding-changed:${namespace}`);
  for (const change of delta.supported)
    reasons.push(`native-selection-changed:${change.selectionId}`);
  for (const uncertainty of delta.unknown) reasons.push(`native-uncertainty:${uncertainty.reason}`);
  if (delta.supplyChanged) reasons.push('parser-supply-changed');
  if (before.meaning.edition.sha256 !== after.meaning.edition.sha256)
    reasons.push('edition-bytes-changed');
  if (authoredChanged) reasons.push('edition-authoring-changed');
  if (different(before.lock.toolchain, after.lock.toolchain)) reasons.push('toolchain-changed');
  if (different(before.lock.edition.resources, after.lock.edition.resources))
    reasons.push('edition-resource-changed');
  if (
    !reasons.length &&
    before.meaning.native.subjectLockSha256 !== after.meaning.native.subjectLockSha256
  )
    reasons.push('selected-input-lock-changed');
  return sorted(reasons);
}

function withoutEditionBytes(lock) {
  return { ...lock, edition: { ...lock.edition, bytes: null, sha256: null } };
}

/** Plan obligations from already compiled native meaning; this function executes no effect. */
export function compileNativeEditionEvolution(input) {
  if (!exact(input, ['before', 'after'])) evolutionError('native_evolution_input_invalid');
  const before = nativeEvolutionSide(input.before);
  const after = nativeEvolutionSide(input.after);
  if (before.meaning.edition.id !== after.meaning.edition.id)
    evolutionError('native_evolution_edition_identity_changed');
  if (before.meaning.edition.editor !== after.meaning.edition.editor)
    evolutionError('native_evolution_editor_changed');
  if (different([...before.lock.media].sort(), [...after.lock.media].sort()))
    evolutionError('native_evolution_media_change_unadmitted');
  const delta = compileNativeSelectionDelta(
    { lock: before.lock, native: before.meaning.native },
    { lock: after.lock, native: after.meaning.native },
  );
  const authoredChanged = different(
    {
      editorial: before.meaning.editorial,
      questions: before.meaning.questions,
      assertions: before.meaning.assertions,
      media: before.meaning.media,
    },
    {
      editorial: after.meaning.editorial,
      questions: after.meaning.questions,
      assertions: after.meaning.assertions,
      media: after.meaning.media,
    },
  );
  const lockChanged =
    before.meaning.native.subjectLockSha256 !== after.meaning.native.subjectLockSha256;
  const editionBytesChanged = before.meaning.edition.sha256 !== after.meaning.edition.sha256;
  const editionBytesOnly =
    editionBytesChanged &&
    !authoredChanged &&
    !delta.hasChanges &&
    !different(withoutEditionBytes(before.lock), withoutEditionBytes(after.lock));
  const changed = delta.hasChanges || authoredChanged || lockChanged;
  const id = after.meaning.edition.id;
  const obligations = /** @type {Record<string, Array<Record<string, any>>>} */ (
    Object.fromEntries(obligationKeys.map((key) => [key, []]))
  );
  const affected = [];
  if (changed) {
    const changedSelections = new Set([
      ...delta.supported.map(({ selectionId }) => selectionId),
      ...delta.unknown.map(({ selectionId }) => selectionId).filter(Boolean),
    ]);
    const affectedAssertions = new Set(
      [...before.meaning.assertions, ...after.meaning.assertions]
        .filter(({ kind, selection }) => kind === 'source' && changedSelections.has(selection))
        .map(({ id: assertionId }) => assertionId),
    );
    const broad =
      authoredChanged ||
      delta.unknown.length > 0 ||
      delta.sourceBindings.changed.length > 0 ||
      delta.supplyChanged ||
      (lockChanged &&
        !editionBytesOnly &&
        !delta.sourceBytes.added.length &&
        !delta.sourceBytes.removed.length &&
        !delta.sourceBytes.changed.length &&
        !delta.supported.length);
    const questions = broad
      ? sorted(after.meaning.questions.map(({ id: questionId }) => questionId))
      : sorted(
          [...before.meaning.assertions, ...after.meaning.assertions]
            .filter(({ id: assertionId }) => affectedAssertions.has(assertionId))
            .flatMap(({ questions: selectedQuestions }) => selectedQuestions),
        );
    const selectedMedia = ['static', 'interactive'].filter((medium) =>
      after.lock.media.includes(medium),
    );
    const media = Object.fromEntries(
      selectedMedia.map((medium) => [
        medium,
        after.meaning.media[medium].views
          .filter(
            (view) =>
              broad || view.assertionIds.some((assertionId) => affectedAssertions.has(assertionId)),
          )
          .map(({ id: viewId }) => viewId),
      ]),
    );
    const reasons = nativeReasons(delta, before, after, authoredChanged);
    affected.push({
      edition: id,
      questions,
      media,
      scope: broad ? 'complete' : 'targeted',
      reasons,
    });
    obligations.rebuild.push({ edition: id, target: 'publication-bundle', scene: null, reasons });
    for (const medium of selectedMedia) {
      const views = media[medium];
      if (!views.length) continue;
      if (medium === 'static')
        obligations.rebuild.push({ edition: id, target: 'static', scene: 'static', reasons });
      else {
        obligations.rebuild.push({
          edition: id,
          target: 'interactive-atlas',
          scene: null,
          reasons,
        });
        for (const scene of views)
          obligations.rebuild.push({ edition: id, target: 'interactive', scene, reasons });
      }
      obligations.mediumVerification.push({ edition: id, medium, views, questions, reasons });
      obligations.humanReview.push({ edition: id, medium, views, questions, reasons });
    }
    obligations.semanticVerification.push({ edition: id, questions, reasons });
    obligations.acceptance.push({ edition: id, action: 'reaccept', reasons });
    obligations.publication.push({ edition: id, action: 'replace', scene: null, reasons });
  }
  return {
    schema: 'architecture.semantic-change/v3',
    before: {
      editionSha256: before.meaning.edition.sha256,
      inputLockSha256: before.meaning.native.subjectLockSha256,
      nativeDigest: before.meaning.native.semanticDigest,
    },
    after: {
      editionSha256: after.meaning.edition.sha256,
      inputLockSha256: after.meaning.native.subjectLockSha256,
      nativeDigest: after.meaning.native.semanticDigest,
    },
    delta: { native: delta, editorialChanged: authoredChanged, editionBytesChanged },
    editions: { added: [], removed: [], changed: changed ? [id] : [], affected },
    obligations,
    scope:
      'Impact compilation only; no execution, evidence, approval, acceptance or publication effect',
  };
}
