import { parseStrictJson } from '../source/json.mjs';
import { fail, LIMITS } from '../source/manifest.mjs';
import { sealMaterializedInputLock } from '../source/materialize.mjs';
import { deepFreeze } from '../semantics/document.mjs';
import { validateEditionProject } from './authoring.mjs';

function sameSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function mediaQuestions(project, medium) {
  return [...new Set(project.presentation[medium].views.flatMap(({ questions }) => questions))];
}

function questionObligations(project, media) {
  const limited = new Set(project.scope.limits.map(({ question }) => question));
  return deepFreeze(
    Object.fromEntries(
      media.map((medium) => {
        const questionIds = mediaQuestions(project, medium);
        const assertionsByQuestion = Object.fromEntries(
          questionIds.map((id) => [
            id,
            project.requiredAssertions
              .filter((assertion) => assertion.questions.includes(id))
              .map(({ id: assertionId }) => assertionId),
          ]),
        );
        if (questionIds.some((id) => !assertionsByQuestion[id].length && !limited.has(id)))
          fail('materialized_question_unanswered');
        return [
          medium,
          {
            questionIds,
            assertionsByQuestion,
            assertionIds: project.requiredAssertions
              .filter(({ questions }) => questions.some((id) => questionIds.includes(id)))
              .map(({ id }) => id),
            limitQuestionIds: questionIds.filter((id) => limited.has(id)),
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
  derived = [],
  limits = [],
  observations = [],
  invocations = [],
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
  const selectedQuestions = new Set(
    request.media.flatMap((medium) => mediaQuestions(project, medium)),
  );
  if (project.questions.some(({ id }) => !selectedQuestions.has(id)))
    fail('materialized_selected_media_incomplete');
  const obligations = questionObligations(project, request.media);

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
