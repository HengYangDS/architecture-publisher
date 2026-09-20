import { fail } from '../source/manifest.mjs';
import { validateEdition } from '../edition/contract.mjs';
const record = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) =>
  record(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const allowed = (value, required, optional = []) =>
  record(value) &&
  required.every((field) => Object.hasOwn(value, field)) &&
  Object.keys(value).every(
    (field) => required.includes(field) || optional.includes(field),
  );
const identifier = (value) =>
  typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const side = new Set(['top', 'right', 'bottom', 'left']);
const staticRoute = new Set(['straight', 'orthogonal-h', 'orthogonal-v']);
const interactiveRoute = new Set([
  'auto',
  'straight',
  'orthogonal-h',
  'orthogonal-v',
]);
function validateView(view, document, purposeRequired) {
  const fields = purposeRequired
    ? ['id', 'label', 'purpose', 'groups', 'relations']
    : ['id', 'label', 'groups', 'relations'];
  if (
    !exact(view, fields) ||
    !identifier(view.id) ||
    typeof view.label !== 'string' ||
    !view.label.trim() ||
    (purposeRequired && !['overview', 'mechanism'].includes(view.purpose)) ||
    !Array.isArray(view.groups) ||
    !view.groups.length ||
    !Array.isArray(view.relations)
  )
    fail('semantic_publication_view_invalid');
  const entities = new Set(),
    groups = new Set();
  for (const group of view.groups) {
    if (
      !exact(group, ['id', 'label', 'entities']) ||
      !identifier(group.id) ||
      groups.has(group.id) ||
      typeof group.label !== 'string' ||
      !group.label.trim() ||
      !Array.isArray(group.entities) ||
      !group.entities.length ||
      group.entities.length > 8
    )
      fail('semantic_publication_group_invalid');
    groups.add(group.id);
    for (const id of group.entities) {
      if (!Object.hasOwn(document.entities, id) || entities.has(id))
        fail('semantic_publication_membership_invalid');
      entities.add(id);
    }
  }
  const relations = new Set();
  for (const layout of view.relations) {
    const required = ['id', 'fromSide', 'toSide', 'route'],
      optional = purposeRequired
        ? ['labelAt', 'labelDx', 'labelDy', 'labelSegment']
        : [];
    if (
      !allowed(layout, required, optional) ||
      typeof layout.id !== 'string' ||
      relations.has(layout.id) ||
      !Object.hasOwn(document.relations, layout.id) ||
      !side.has(layout.fromSide) ||
      !side.has(layout.toSide) ||
      !(purposeRequired ? interactiveRoute : staticRoute).has(layout.route)
    )
      fail('semantic_publication_relation_layout_invalid');
    if (
      (Object.hasOwn(layout, 'labelAt') &&
        (!Array.isArray(layout.labelAt) ||
          layout.labelAt.length !== 2 ||
          layout.labelAt.some((value) => !Number.isFinite(value)))) ||
      (Object.hasOwn(layout, 'labelDx') && !Number.isFinite(layout.labelDx)) ||
      (Object.hasOwn(layout, 'labelDy') && !Number.isFinite(layout.labelDy)) ||
      (Object.hasOwn(layout, 'labelSegment') &&
        (!Number.isSafeInteger(layout.labelSegment) ||
          layout.labelSegment < 0))
    )
      fail('semantic_publication_relation_layout_invalid');
    const relation = document.relations[layout.id];
    if (!entities.has(relation.subject) || !entities.has(relation.object))
      fail('semantic_publication_relation_endpoint_missing');
    relations.add(layout.id);
  }
  return { entities, relations };
}

export function semanticArchitectureProjections(document, edition) {
  validateEdition(document, edition);
  const overviewId = edition.narrative[0],
    staticScene = {
      id: overviewId,
      label: edition.scenes.static.label,
      ...edition.scenes.static.composition,
    },
    interactiveScenes = edition.narrative.map((id) => ({
      id,
      label: edition.scenes.interactive[id].label,
      purpose: edition.scenes.interactive[id].purpose,
      ...edition.scenes.interactive[id].composition,
    })),
    staticIds = validateView(staticScene, document, false);
  if (
    staticIds.entities.size !== Object.keys(document.entities).length ||
    staticIds.relations.size !== Object.keys(document.relations).length
  )
    fail('semantic_publication_overview_incomplete');
  const viewIds = new Set();
  let overview = 0;
  for (const view of interactiveScenes) {
    const selected = validateView(view, document, true);
    if (viewIds.has(view.id)) fail('semantic_publication_view_invalid');
    viewIds.add(view.id);
    if (view.purpose === 'overview') overview++;
    if (view.purpose === 'overview') {
      const sameEntities =
          selected.entities.size === staticIds.entities.size &&
          [...selected.entities].every((id) => staticIds.entities.has(id)),
        sameRelations =
          selected.relations.size === staticIds.relations.size &&
          [...selected.relations].every((id) => staticIds.relations.has(id));
      if (!sameEntities || !sameRelations)
        fail('semantic_publication_projection_drift');
    }
  }
  if (overview !== 1) fail('semantic_publication_overview_required');
  return {
    staticScene,
    interactiveScenes,
  };
}
