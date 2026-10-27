import { POSTER } from "../../packages/publisher/src/poster/tokens.mjs";

const OUTSIDE = new Set(["person", "external"]);

/**
 * Font-free metrics with the poster's spacing: fixed card height and labels
 * eight pixels per character, so layout tests do not depend on typefaces.
 * @param {any} [model] marks components whose kind is a person or external system as outside
 */
export function simpleMetrics(model = null) {
  const outside = (component) => {
    const kind = model?.kinds.find(({ id }) => id === component.kind);
    return OUTSIDE.has(kind?.category);
  };
  return {
    contentWidth: (labelled) => (labelled ? 1440 : 1656),
    card: { minWidth: 196, maxWidth: 280, height: () => 96 },
    label: (relation, maxWidth = 250) => ({
      width: Math.min(maxWidth, relation.label.length * 8 + 18),
      height: 27,
      lines: [{ text: relation.label, role: /** @type {const} */ ("label") }],
    }),
    external: (component) => outside(component),
    spacing: POSTER.spacing,
  };
}

/** A view of every component of a model, with optional tiers of component ids. */
export function wholeView(model, tiers = null) {
  return {
    id: "view",
    title: model.title,
    question: model.question,
    summary: null,
    origin: /** @type {const} */ ("complete"),
    tiers:
      tiers?.map((members, index) => ({ id: `t${index}`, label: `Tier ${index + 1}`, members })) ??
      null,
    components: model.components,
    relations: model.relations,
  };
}
