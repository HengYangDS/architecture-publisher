import { validateEdition, validateEditionProject } from 'architecture-publisher/edition';
import { validateClaimModel } from 'architecture-publisher/semantics';

const namespace = 'architecture-publisher/self';

/** Derive successor authoring from the existing self-owned reader and claim choices. */
export function projectFromSelfEdition(sourceModel, authoredEdition) {
  const model = validateClaimModel(sourceModel);
  const edition = validateEdition(model, authoredEdition);
  const questionIds = [...edition.narrative];
  const questionsFor = (claimId) =>
    questionIds.filter((id) => edition.questions[id].claims.includes(claimId));
  const selection = (kind, id, claimId) => ({
    id: `${kind}-${id}`,
    namespace,
    kind: 'reference',
    reference: `${kind}:${id}`,
    questions: questionsFor(claimId),
  });
  const groupsFor = (composition) =>
    composition.groups.map(({ id, label, entities }) => ({
      id,
      label,
      elements: entities.map((id) => ({ namespace, id })),
    }));
  const staticWidths = new Set(
    edition.qualification.human
      .filter(({ scope }) => scope.medium === 'static' && scope.kind === 'physical')
      .map(({ scope }) => scope.width),
  );
  if (staticWidths.size !== 1)
    throw Object.assign(new Error('self_project_static_width_ambiguous'), {
      code: 'self_project_static_width_ambiguous',
    });
  return validateEditionProject({
    schema: 'architecture.edition-project/v1',
    id: edition.id,
    editor: edition.owner,
    title: edition.title,
    audiences: Object.entries(edition.audiences).map(([id, { label }]) => ({ id, label })),
    questions: questionIds.map((id) => ({
      id,
      audience: edition.questions[id].audience,
      text: edition.questions[id].prompt,
    })),
    scope: {
      sourceNamespaces: [namespace],
      selections: [
        ...Object.keys(model.entities).map((id) => selection('entity', id, `role-${id}`)),
        ...Object.keys(model.relations).map((id) => selection('relation', id, `flow-${id}`)),
        ...Object.keys(model.claims).map((id) => selection('claim', id, id)),
      ],
      limits: [{ question: 'overview', reason: edition.scope }],
    },
    omissions: [],
    narrative: { summary: edition.scenes.static.label },
    presentation: {
      static: {
        views: [
          {
            id: 'overview',
            questions: ['overview'],
            groups: groupsFor(edition.scenes.static.composition),
          },
        ],
        intent: edition.questions.overview.prompt,
        width: [...staticWidths][0],
      },
      interactive: {
        views: questionIds.map((id) => ({
          id,
          questions: [id],
          groups: groupsFor(edition.scenes.interactive[id].composition),
        })),
        intent: edition.questions.overview.prompt,
      },
    },
    visualPolicy: { profile: 'neutral' },
  });
}
