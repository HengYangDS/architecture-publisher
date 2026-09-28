import { parseStrictJson } from '../protocol/json.mjs';
import { fail, isDigest } from '../protocol/values.mjs';
import { LIMITS } from '../file-input/contract.mjs';
import { sealMaterializedInputLock } from '../source/materialize.mjs';
import { deepFreeze } from '../semantics/document.mjs';
import { deriveEditionAssertions, validateEditionProject } from './authoring.mjs';

function sameSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function mediaQuestions(project, medium) {
  return [...new Set(project.presentation[medium].views.flatMap(({ questions }) => questions))];
}

function unansweredViewQuestion(project, editionSha256, medium, view, question, omissions, code) {
  const diagnostics = isDigest(editionSha256)
    ? [
        {
          code,
          severity: 'error',
          message: 'Edition view question has no visible assertion or explicit limit.',
          predicate: 'view-question-answered',
          subject: {
            kind: 'edition-view-question',
            editionId: project.id,
            editionSha256,
            medium,
            viewId: view.id,
            questionId: question,
            omissions: omissions
              .filter((item) => item.question === question)
              .map(({ selection, disposition, coveredIn }) => ({
                selection,
                disposition,
                ...(coveredIn ? { coveredIn } : {}),
              })),
          },
          responsibility: { role: 'edition-editor', declaredOwner: project.editor },
          evidence: {},
          supportedFixes: [],
        },
      ]
    : null;
  throw Object.assign(new Error(code), { code, ...(diagnostics ? { diagnostics } : {}) });
}

/** Derive finite view/question obligations from the sole authored Edition project. */
export function deriveEditionQuestionObligations(project, media, editionSha256 = null) {
  const assertions = deriveEditionAssertions(project);
  const assertionsFor = (question) =>
    assertions.filter(({ questions }) => questions.includes(question));
  const orderedIds = (ids) => assertions.filter(({ id }) => ids.has(id)).map(({ id }) => id);
  return deepFreeze(
    Object.fromEntries(
      media.map((medium) => {
        const questionIds = mediaQuestions(project, medium);
        const views = project.presentation[medium].views.map((view) => {
          const omissions = project.omissions.filter(
            (item) => item.medium === medium && item.view === view.id,
          );
          const limitsByQuestion = Object.fromEntries(
            view.questions.map((question) => [
              question,
              [
                ...project.scope.limits
                  .filter((item) => item.question === question)
                  .map(({ reason }) => ({ kind: 'scope', reason })),
                ...omissions
                  .filter(
                    (item) => item.question === question && item.disposition === 'explicit-limit',
                  )
                  .map(({ selection, reason }) => ({ kind: 'omission', selection, reason })),
              ],
            ]),
          );
          const assertionsByQuestion = Object.fromEntries(
            view.questions.map((question) => {
              const omittedSelections = new Set(
                omissions
                  .filter((item) => item.question === question)
                  .map(({ selection }) => selection),
              );
              const candidates = assertionsFor(question);
              const assertionIds = candidates
                .filter(
                  (assertion) =>
                    assertion.kind !== 'source' || !omittedSelections.has(assertion.selection),
                )
                .map(({ id }) => id);
              const limited = limitsByQuestion[question].length > 0;
              if (!assertionIds.length && !limited)
                unansweredViewQuestion(
                  project,
                  editionSha256,
                  medium,
                  view,
                  question,
                  omissions,
                  candidates.length
                    ? 'materialized_view_question_unanswered'
                    : 'materialized_question_unanswered',
                );
              return [question, assertionIds];
            }),
          );
          const present = new Set(Object.values(assertionsByQuestion).flat());
          return {
            id: view.id,
            questionIds: view.questions,
            assertionsByQuestion,
            limitsByQuestion,
            assertionIds: orderedIds(present),
            limitQuestionIds: view.questions.filter(
              (question) => limitsByQuestion[question].length > 0,
            ),
          };
        });
        const assertionsByQuestion = Object.fromEntries(
          questionIds.map((question) => {
            const present = new Set(
              views.flatMap((view) => view.assertionsByQuestion[question] ?? []),
            );
            return [question, orderedIds(present)];
          }),
        );
        const present = new Set(Object.values(assertionsByQuestion).flat());
        return [
          medium,
          {
            questionIds,
            assertionsByQuestion,
            assertionIds: orderedIds(present),
            limitQuestionIds: questionIds.filter((question) =>
              views.some((view) => view.limitQuestionIds.includes(question)),
            ),
            views,
          },
        ];
      }),
    ),
  );
}

/** Join already-read selected meaning without acquiring files or Provider authority. */
export function assembleEditionSelection({
  request,
  edition,
  sources,
  derived = /** @type {import('../source/materialize.mjs').DerivedInput[]} */ ([]),
  limits = /** @type {string[]} */ ([]),
  observations = /** @type {{kind: string, key: string, method: string}[]} */ ([]),
  invocations = /** @type {unknown[]} */ ([]),
}) {
  if (!edition) fail('materialized_provider_edition_missing');
  const project = validateEditionProject(
    parseStrictJson(
      edition.content,
      'materialized_edition_json_invalid',
      'materialized_edition_json_duplicate_key',
    ),
  );
  if (
    edition.expected &&
    (edition.expected.id !== project.id || edition.expected.editor !== project.editor)
  )
    fail('materialized_provider_edition_identity_mismatch');

  const override = project.visualPolicy.override ?? null;
  const resources = edition.resources;
  if (
    !Array.isArray(resources) ||
    (override === null && resources.length !== 0) ||
    (override !== null && (resources.length !== 1 || resources[0].ref !== override))
  )
    fail('materialized_edition_resource_missing');

  const selectedBytes = [
    edition.content,
    ...resources.map(({ content }) => content),
    ...sources.map(({ content }) => content),
    ...derived.map(({ content }) => content),
  ];
  if (selectedBytes.reduce((total, content) => total + content.length, 0) > LIMITS.totalBytes)
    fail('bundle_size_exceeded');

  const sealed = sealMaterializedInputLock({
    edition: { id: project.id, editor: project.editor, content: edition.content, resources },
    sources,
    derived,
    media: request.media,
    toolchain: request.toolchain,
  });
  if (
    !sameSet(
      sealed.lock.sources.map(({ namespace }) => namespace),
      project.scope.sourceNamespaces,
    )
  )
    fail('materialized_edition_sources_mismatch');
  const derivedNamespaces = new Set(sealed.lock.derived.map(({ namespace }) => namespace));
  if (
    (project.scope.projectionNamespaces ?? []).some(
      (namespace) => !derivedNamespaces.has(namespace),
    )
  )
    fail('materialized_edition_projections_mismatch');
  const selectedQuestions = new Set(
    request.media.flatMap((medium) => mediaQuestions(project, medium)),
  );
  if (project.questions.some(({ id }) => !selectedQuestions.has(id)))
    fail('materialized_selected_media_incomplete');
  const obligations = deriveEditionQuestionObligations(
    project,
    request.media,
    sealed.lock.edition.sha256,
  );

  const sourceNamespaceById = new Map(request.sources.map(({ id, namespace }) => [id, namespace]));
  const readEvidence = Object.freeze({
    subjectLockSha256: sealed.lockSha256,
    items: Object.freeze(observations.map((item) => Object.freeze({ ...item }))),
  });
  const invocationJson = JSON.stringify(invocations);
  return Object.freeze({
    closure: request.providers.length ? 'selected-inputs-only' : 'selected-roots-only',
    get lock() {
      return sealed.lock;
    },
    lockJson: sealed.lockJson,
    lockSha256: sealed.lockSha256,
    readEvidence,
    get invocations() {
      return JSON.parse(invocationJson);
    },
    read(id) {
      const namespace = sourceNamespaceById.get(id);
      if (!namespace) fail('materialized_item_unknown');
      return sealed.readSource(namespace);
    },
    readSource: sealed.readSource,
    readDerived: sealed.readDerived,
    readEdition: sealed.readEdition,
    readEditionResource: sealed.readEditionResource,
    readEditionOverride() {
      return override === null ? null : sealed.readEditionResource(override);
    },
    project,
    questionObligations: obligations,
    limits: Object.freeze([...new Set(limits)]),
  });
}
