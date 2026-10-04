import { canonical, exact, record } from '../semantics/document.mjs';
import { compileClaimModelDelta, compileNativeSelectionDelta } from '../semantics/change.mjs';
import { isDigest } from '../protocol/values.mjs';
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

function packageSide(rows) {
  if (!Array.isArray(rows) || rows.length > 256)
    evolutionError('native_evolution_execution_invalid');
  const packages = new Map();
  for (const row of rows) {
    if (
      !exact(row, ['id', 'sha256']) ||
      typeof row.id !== 'string' ||
      !row.id ||
      !isDigest(row.sha256) ||
      packages.has(row.id)
    )
      evolutionError('native_evolution_execution_invalid');
    packages.set(row.id, row.sha256);
  }
  return packages;
}

function providerPackageChanges(value) {
  if (!exact(value, ['before', 'after'])) evolutionError('native_evolution_execution_invalid');
  const before = packageSide(value.before);
  const after = packageSide(value.after);
  const changes = /** @type {{
    added: {id: string, sha256: string}[],
    removed: {id: string, sha256: string}[],
    changed: {id: string, beforeSha256: string, afterSha256: string}[]
  }} */ ({ added: [], removed: [], changed: [] });
  for (const id of sorted([...before.keys(), ...after.keys()])) {
    const prior = before.get(id);
    const next = after.get(id);
    if (!prior) changes.added.push({ id, sha256: next });
    else if (!next) changes.removed.push({ id, sha256: prior });
    else if (prior !== next) changes.changed.push({ id, beforeSha256: prior, afterSha256: next });
  }
  return changes;
}

function nativeReasons(delta, before, after, authoredChanged, mediaChanges) {
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
  for (const medium of mediaChanges.added) reasons.push(`medium-added:${medium}`);
  for (const medium of mediaChanges.removed) reasons.push(`medium-removed:${medium}`);
  for (const medium of mediaChanges.changed) reasons.push(`medium-meaning-changed:${medium}`);
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

function remainingLock(lock) {
  return { ...withoutEditionBytes(lock), sources: null, media: null };
}

function globalEditorial(meaning) {
  const editorial = { ...meaning.editorial };
  delete editorial.presentation;
  return { editorial, questions: meaning.questions, assertions: meaning.assertions };
}

/** Plan obligations from already compiled native meaning; this function executes no effect. */
export function compileNativeEditionEvolution(
  input,
  executionPackages = { before: [], after: [] },
) {
  if (!exact(input, ['before', 'after'])) evolutionError('native_evolution_input_invalid');
  const before = nativeEvolutionSide(input.before);
  const after = nativeEvolutionSide(input.after);
  if (before.meaning.edition.id !== after.meaning.edition.id)
    evolutionError('native_evolution_edition_identity_changed');
  if (before.meaning.edition.editor !== after.meaning.edition.editor)
    evolutionError('native_evolution_editor_changed');
  const delta = compileNativeSelectionDelta(
    { lock: before.lock, native: before.meaning.native },
    { lock: after.lock, native: after.meaning.native },
  );
  const providerPackages = providerPackageChanges(executionPackages);
  const packageChanged = Object.values(providerPackages).some((items) => items.length > 0);
  const globalEditorialChanged = different(
    globalEditorial(before.meaning),
    globalEditorial(after.meaning),
  );
  const mediaNames = ['static', 'interactive'];
  const mediaChanges = {
    added: mediaNames.filter(
      (medium) => !before.lock.media.includes(medium) && after.lock.media.includes(medium),
    ),
    removed: mediaNames.filter(
      (medium) => before.lock.media.includes(medium) && !after.lock.media.includes(medium),
    ),
    changed: mediaNames.filter(
      (medium) =>
        before.lock.media.includes(medium) &&
        after.lock.media.includes(medium) &&
        (different(before.meaning.media[medium], after.meaning.media[medium]) ||
          different(
            before.meaning.editorial.presentation[medium],
            after.meaning.editorial.presentation[medium],
          )),
    ),
  };
  const authoredChanged =
    globalEditorialChanged ||
    mediaNames.some((medium) =>
      different(
        before.meaning.editorial.presentation[medium],
        after.meaning.editorial.presentation[medium],
      ),
    );
  const lockChanged =
    before.meaning.native.subjectLockSha256 !== after.meaning.native.subjectLockSha256;
  const editionBytesChanged = before.meaning.edition.sha256 !== after.meaning.edition.sha256;
  const candidateChanged =
    delta.hasChanges ||
    authoredChanged ||
    lockChanged ||
    mediaChanges.added.length > 0 ||
    mediaChanges.removed.length > 0 ||
    mediaChanges.changed.length > 0;
  const changed = candidateChanged || packageChanged;
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
        .filter(({ kind, selection, basis }) =>
          kind === 'source'
            ? changedSelections.has(selection)
            : basis.some((selected) => changedSelections.has(selected)),
        )
        .map(({ id: assertionId }) => assertionId),
    );
    const broad =
      globalEditorialChanged ||
      delta.unknown.length > 0 ||
      delta.sourceBindings.changed.length > 0 ||
      delta.supplyChanged ||
      different(remainingLock(before.lock), remainingLock(after.lock));
    const selectedMedia = mediaNames.filter((medium) => after.lock.media.includes(medium));
    const media = {};
    const affectedMedia = new Set();
    for (const medium of selectedMedia) {
      const prior = new Map(
        (before.meaning.media[medium]?.views ?? []).map((view) => [view.id, view]),
      );
      const current = after.meaning.media[medium].views;
      const added = mediaChanges.added.includes(medium);
      const presentationChanged = mediaChanges.changed.includes(medium);
      const intentChanged = different(
        before.meaning.editorial.presentation[medium]?.intent,
        after.meaning.editorial.presentation[medium]?.intent,
      );
      const views = current
        .filter(
          (view) =>
            broad ||
            added ||
            (medium === 'interactive' && intentChanged) ||
            !prior.has(view.id) ||
            different(prior.get(view.id), view) ||
            view.assertionIds.some((assertionId) => affectedAssertions.has(assertionId)),
        )
        .map(({ id: viewId }) => viewId);
      media[medium] =
        medium === 'static' && presentationChanged
          ? current.map(({ id: viewId }) => viewId)
          : views;
      if (broad || added || presentationChanged || media[medium].length) affectedMedia.add(medium);
    }
    const withdrawn = mediaChanges.removed.map((medium) => ({
      medium,
      scene: medium === 'static' ? 'static' : null,
    }));
    if (before.lock.media.includes('interactive') && after.lock.media.includes('interactive')) {
      const current = new Set(
        after.meaning.media.interactive.views.map(({ id: viewId }) => viewId),
      );
      for (const { id: scene } of before.meaning.media.interactive.views)
        if (!current.has(scene)) withdrawn.push({ medium: 'interactive', scene });
    }
    const questionIds = new Set(
      [...before.meaning.assertions, ...after.meaning.assertions]
        .filter(({ id: assertionId }) => affectedAssertions.has(assertionId))
        .flatMap(({ questions: selectedQuestions }) => selectedQuestions),
    );
    const questionsByMedium = new Map();
    for (const medium of affectedMedia) {
      const viewIds = new Set(media[medium]);
      const allViews =
        (medium === 'static' && mediaChanges.changed.includes(medium)) ||
        (medium === 'interactive' &&
          !viewIds.size &&
          !withdrawn.some(({ medium: withdrawnMedium }) => withdrawnMedium === medium));
      const mediumQuestions = new Set();
      for (const side of [before, after]) {
        const scopedQuestions = (side.meaning.media[medium]?.views ?? [])
          .filter((view) => allViews || viewIds.has(view.id))
          .flatMap(({ questionIds: questions }) => questions);
        for (const question of scopedQuestions) mediumQuestions.add(question);
      }
      questionsByMedium.set(medium, mediumQuestions);
    }
    for (const { medium, scene } of withdrawn) {
      const mediumQuestions = questionsByMedium.get(medium) ?? new Set();
      for (const view of before.meaning.media[medium].views)
        if (scene === null || scene === 'static' || view.id === scene)
          for (const question of view.questionIds) mediumQuestions.add(question);
      questionsByMedium.set(medium, mediumQuestions);
    }
    for (const mediumQuestions of questionsByMedium.values())
      for (const question of mediumQuestions) questionIds.add(question);
    const questions =
      broad || packageChanged
        ? sorted(
            [...before.meaning.questions, ...after.meaning.questions].map(
              ({ id: questionId }) => questionId,
            ),
          )
        : sorted([...questionIds]);
    const reasons = sorted([
      ...nativeReasons(delta, before, after, authoredChanged, mediaChanges),
      ...providerPackages.added.map(({ id: provider }) => `provider-package-added:${provider}`),
      ...providerPackages.removed.map(({ id: provider }) => `provider-package-removed:${provider}`),
      ...providerPackages.changed.map(({ id: provider }) => `provider-package-changed:${provider}`),
    ]);
    affected.push({
      edition: id,
      questions,
      media,
      withdrawn,
      scope: broad || packageChanged ? 'complete' : 'targeted',
      reasons,
    });
    if (candidateChanged)
      obligations.rebuild.push({ edition: id, target: 'edition-candidate', scene: null, reasons });
    for (const medium of selectedMedia) {
      const views = media[medium];
      if (!affectedMedia.has(medium)) continue;
      if (medium === 'static')
        obligations.rebuild.push({ edition: id, target: 'static', scene: 'static', reasons });
      else {
        obligations.rebuild.push({
          edition: id,
          target: 'interactive-document',
          scene: null,
          reasons,
        });
        for (const scene of views)
          obligations.rebuild.push({ edition: id, target: 'interactive', scene, reasons });
      }
      const mediumQuestions = sorted([...questionsByMedium.get(medium)]);
      obligations.mediumVerification.push({
        edition: id,
        medium,
        views,
        questions: mediumQuestions,
        reasons,
      });
      obligations.humanReview.push({
        edition: id,
        medium,
        views,
        questions: mediumQuestions,
        reasons,
      });
    }
    obligations.semanticVerification.push({ edition: id, questions, reasons });
    obligations.acceptance.push({ edition: id, action: 'reaccept', reasons });
    obligations.publication.push({ edition: id, action: 'replace', scene: null, reasons });
    for (const { medium, scene } of withdrawn)
      obligations.publication.push({
        edition: id,
        action: 'withdraw',
        medium,
        scene,
        reasons: sorted([...reasons, `withdrawn:${medium}:${scene ?? 'all'}`]),
      });
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
    delta: {
      native: delta,
      execution: { providerPackages },
      editorialChanged: authoredChanged,
      editionBytesChanged,
      media: mediaChanges,
    },
    editions: { added: [], removed: [], changed: changed ? [id] : [], affected },
    obligations,
    scope:
      'Impact compilation only; no execution, evidence, approval, acceptance or publication effect',
  };
}
