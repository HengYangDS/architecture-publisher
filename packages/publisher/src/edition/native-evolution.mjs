import { exact, record } from "../semantics/document.mjs";
import { different, sorted } from "../semantics/comparison.mjs";
import { compileNativeSelectionDelta } from "../semantics/native-change.mjs";
import { fail as evolutionError, isDigest } from "../protocol/values.mjs";
import { obligationKeys } from "./evolution-obligations.mjs";

function nativeEvolutionSide(value) {
  if (
    !exact(value, ["lock", "meaning"]) ||
    value.lock?.schema !== "architecture.materialized-input-lock/v1" ||
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
    evolutionError("native_evolution_input_invalid");
  for (const medium of value.lock.media)
    if (!Array.isArray(value.meaning.media[medium]?.views))
      evolutionError("native_evolution_input_invalid");
  return value;
}

function packageSide(rows) {
  if (!Array.isArray(rows) || rows.length > 256)
    evolutionError("native_evolution_execution_invalid");
  const packages = new Map();
  for (const row of rows) {
    if (
      !exact(row, ["id", "sha256"]) ||
      typeof row.id !== "string" ||
      !row.id ||
      !isDigest(row.sha256) ||
      packages.has(row.id)
    )
      evolutionError("native_evolution_execution_invalid");
    packages.set(row.id, row.sha256);
  }
  return packages;
}

function providerPackageChanges(value) {
  if (!exact(value, ["before", "after"])) evolutionError("native_evolution_execution_invalid");
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
  for (const kind of ["added", "removed", "changed"])
    for (const namespace of delta.sourceBytes[kind])
      reasons.push(`source-bytes-${kind}:${namespace}`);
  for (const namespace of delta.sourceBindings.changed)
    reasons.push(`source-binding-changed:${namespace}`);
  for (const change of delta.supported)
    reasons.push(`native-selection-changed:${change.selectionId}`);
  for (const uncertainty of delta.unknown) reasons.push(`native-uncertainty:${uncertainty.reason}`);
  if (delta.supplyChanged) reasons.push("parser-supply-changed");
  if (before.meaning.edition.sha256 !== after.meaning.edition.sha256)
    reasons.push("edition-bytes-changed");
  if (authoredChanged) reasons.push("edition-authoring-changed");
  for (const medium of mediaChanges.added) reasons.push(`medium-added:${medium}`);
  for (const medium of mediaChanges.removed) reasons.push(`medium-removed:${medium}`);
  for (const medium of mediaChanges.changed) reasons.push(`medium-meaning-changed:${medium}`);
  if (different(before.lock.toolchain, after.lock.toolchain)) reasons.push("toolchain-changed");
  if (different(before.lock.edition.resources, after.lock.edition.resources))
    reasons.push("edition-resource-changed");
  if (
    !reasons.length &&
    before.meaning.native.subjectLockSha256 !== after.meaning.native.subjectLockSha256
  )
    reasons.push("selected-input-lock-changed");
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
  if (!exact(input, ["before", "after"])) evolutionError("native_evolution_input_invalid");
  const before = nativeEvolutionSide(input.before);
  const after = nativeEvolutionSide(input.after);
  if (before.meaning.edition.id !== after.meaning.edition.id)
    evolutionError("native_evolution_edition_identity_changed");
  if (before.meaning.edition.editor !== after.meaning.edition.editor)
    evolutionError("native_evolution_editor_changed");
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
  const mediaNames = ["static", "interactive"];
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
          kind === "source"
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
            (medium === "interactive" && intentChanged) ||
            !prior.has(view.id) ||
            different(prior.get(view.id), view) ||
            view.assertionIds.some((assertionId) => affectedAssertions.has(assertionId)),
        )
        .map(({ id: viewId }) => viewId);
      media[medium] =
        medium === "static" && presentationChanged
          ? current.map(({ id: viewId }) => viewId)
          : views;
      if (broad || added || presentationChanged || media[medium].length) affectedMedia.add(medium);
    }
    const withdrawn = mediaChanges.removed.map((medium) => ({
      medium,
      scene: medium === "static" ? "static" : null,
    }));
    if (before.lock.media.includes("interactive") && after.lock.media.includes("interactive")) {
      const current = new Set(
        after.meaning.media.interactive.views.map(({ id: viewId }) => viewId),
      );
      for (const { id: scene } of before.meaning.media.interactive.views)
        if (!current.has(scene)) withdrawn.push({ medium: "interactive", scene });
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
        (medium === "static" && mediaChanges.changed.includes(medium)) ||
        (medium === "interactive" &&
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
        if (scene === null || scene === "static" || view.id === scene)
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
      scope: broad || packageChanged ? "complete" : "targeted",
      reasons,
    });
    if (candidateChanged)
      obligations.rebuild.push({ edition: id, target: "edition-candidate", scene: null, reasons });
    for (const medium of selectedMedia) {
      const views = media[medium];
      if (!affectedMedia.has(medium)) continue;
      if (medium === "static")
        obligations.rebuild.push({ edition: id, target: "static", scene: "static", reasons });
      else {
        obligations.rebuild.push({
          edition: id,
          target: "interactive-document",
          scene: null,
          reasons,
        });
        for (const scene of views)
          obligations.rebuild.push({ edition: id, target: "interactive", scene, reasons });
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
    obligations.acceptance.push({ edition: id, action: "reaccept", reasons });
    obligations.publication.push({ edition: id, action: "replace", scene: null, reasons });
    for (const { medium, scene } of withdrawn)
      obligations.publication.push({
        edition: id,
        action: "withdraw",
        medium,
        scene,
        reasons: sorted([...reasons, `withdrawn:${medium}:${scene ?? "all"}`]),
      });
  }
  return {
    schema: "architecture.semantic-change/v3",
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
      "Impact compilation only; no execution, evidence, approval, acceptance or publication effect",
  };
}
