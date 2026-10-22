import { validateEditionProject } from "architecture-publisher/edition";
import { validateClaimModel } from "architecture-publisher/semantics";
import { architecturePublisherInteractiveScenes } from "./interactive-scenes.mjs";
import { composeArchitecturePublisherStaticComposition } from "./static/composition.mjs";
import { SELF_FIGURE_TYPES } from "./figure-types.mjs";

export const SELF_NAMESPACE = "architecture-publisher/self";

const groupsFor = (composition) =>
  composition.groups.map(({ id, label, entities }) => ({
    id,
    label,
    elements: entities.map((id) => ({ namespace: SELF_NAMESPACE, id })),
  }));

const QUESTION_TEXT = Object.freeze({
  "system-map": "What is the source-to-publication causal structure and its renewal path?",
  overview:
    "How does explicit system meaning become a trustworthy, renewable Architecture Edition?",
  semantics: "How are source truth, provenance, uncertainty, and claims preserved?",
  edition: "How does an Edition align a reader, questions, coverage, and expression?",
  composition: "How do static and interactive media remain independently composed?",
  qualification: "How are exact artifacts judged without compensating away a failed predicate?",
  "publication-recovery": "How are publication effects authorized, replaced, and recovered?",
  adoption:
    "How do self-use, ETHOS, and AIGW exercise one generic product without sharing authority?",
  evolution:
    "How does semantic change create conservative rebuild and requalification obligations?",
});

/** Author the current self Edition directly through the public Project contract. */
export function projectFromSelfModel(sourceModel) {
  const model = validateClaimModel(sourceModel);
  const interactive = architecturePublisherInteractiveScenes();
  const composition = composeArchitecturePublisherStaticComposition();
  const interactiveIds = Object.keys(interactive);
  const questionIds = ["system-map", ...interactiveIds];
  const questionsFor = (claimId) =>
    interactiveIds.filter((id) => interactive[id].claims.includes(claimId));
  const selection = (kind, id, claimId) => ({
    id: `${kind}-${id}`,
    namespace: SELF_NAMESPACE,
    kind: "reference",
    reference: `${kind}:${id}`,
    questions: [...(kind === "claim" ? [] : ["system-map"]), ...questionsFor(claimId)],
  });
  if (questionIds.some((id) => !Object.hasOwn(QUESTION_TEXT, id)))
    throw Object.assign(new Error("self_project_question_missing"), {
      code: "self_project_question_missing",
    });
  return validateEditionProject({
    schema: "architecture.edition-project/v1",
    id: "architecture-publisher-self",
    editor: model.owner,
    title: "Architecture Publisher",
    audiences: [{ id: "steward", label: "System stewards and architecture readers" }],
    questions: questionIds.map((id) => ({ id, audience: "steward", text: QUESTION_TEXT[id] })),
    scope: {
      sourceNamespaces: [SELF_NAMESPACE],
      selections: [
        ...Object.keys(model.entities).map((id) => selection("entity", id, `role-${id}`)),
        ...Object.keys(model.relations).map((id) => selection("relation", id, `flow-${id}`)),
        ...Object.keys(model.claims).map((id) => selection("claim", id, id)),
      ],
      limits: [
        {
          question: "system-map",
          reason:
            "Structural target overview only; exact Claim conditions, scope, and maturity are carried by the interactive Edition.",
        },
      ],
    },
    omissions: [],
    narrative: { summary: composition.subtitle },
    presentation: {
      static: {
        views: [
          {
            id: "system-map",
            questions: ["system-map"],
            groups: groupsFor(composition.editionComposition),
          },
        ],
        intent: QUESTION_TEXT["system-map"],
        width: 6000,
      },
      interactive: {
        views: interactiveIds.map((id) => ({
          id,
          questions: [id],
          groups: groupsFor(interactive[id].composition),
        })),
        intent: QUESTION_TEXT.overview,
      },
    },
    visualPolicy: {
      profile: "neutral",
      override: "refinement.json",
      figureTypes: SELF_FIGURE_TYPES,
    },
  });
}
