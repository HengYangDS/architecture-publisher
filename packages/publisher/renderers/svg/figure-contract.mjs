import { fail } from "../../src/protocol/values.mjs";

function validGroups(groups) {
  if (!Array.isArray(groups)) return false;
  const ids = new Set();
  const labels = new Set();
  const members = new Set();
  for (const group of groups) {
    if (
      typeof group?.id !== "string" ||
      !group.id ||
      ids.has(group.id) ||
      typeof group.label !== "string" ||
      !group.label.trim() ||
      labels.has(group.label) ||
      !Array.isArray(group.members) ||
      !group.members.length
    )
      return false;
    ids.add(group.id);
    labels.add(group.label);
    for (const member of group.members) {
      if (typeof member !== "string" || !member.trim() || members.has(member)) return false;
      members.add(member);
    }
  }
  return true;
}

export function checkedViews(views) {
  if (!Array.isArray(views) || views.length < 1 || views.length > 256)
    fail("static_figure_views_invalid");
  const ids = new Set();
  return views.map(({ id, scene, rendered }) => {
    const parts = rendered?.parts;
    if (
      typeof id !== "string" ||
      !/^[a-z][a-z0-9-]*$/u.test(id) ||
      ids.has(id) ||
      scene?.editorialViewId !== id ||
      !Array.isArray(scene.questions) ||
      !scene.questions.length ||
      scene.questions.some(({ text }) => typeof text !== "string" || !text.trim()) ||
      typeof parts?.graph !== "string" ||
      (scene.nodes?.length &&
        (!parts.figureTypes ||
          typeof parts.figureTypes.markup !== "string" ||
          ![parts.figureTypes.width, parts.figureTypes.height].every(Number.isFinite))) ||
      !validGroups(parts.groups) ||
      !Array.isArray(parts.relations) ||
      (parts.claim !== null &&
        (typeof parts.claim?.markup !== "string" ||
          (parts.claim.reflow !== undefined && typeof parts.claim.reflow !== "function") ||
          ![parts.claim.x, parts.claim.y, parts.claim.width, parts.claim.height].every(
            Number.isFinite,
          ))) ||
      !Number.isSafeInteger(rendered.rasterWidth)
    )
      fail("static_figure_views_invalid");
    ids.add(id);
    return { id, scene, rendered, parts };
  });
}
