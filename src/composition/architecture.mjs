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
const componentType = new Set([
  'frontend',
  'backend',
  'database',
  'cloud',
  'security',
  'messagebus',
  'external',
]);
const variant = new Set(['default', 'emphasis', 'security', 'dashed']);

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
  const grammar = edition.visualGrammar;
  for (const type of document.vocabulary.entities)
    if (!componentType.has(grammar.entityTypes[type]))
      fail('semantic_publication_entity_style_missing');
  if (
    Object.keys(grammar.entityTypes).some(
      (type) => !document.vocabulary.entities.includes(type),
    )
  )
    fail('semantic_publication_entity_style_unknown');
  for (const type of document.vocabulary.relations) {
    const style = grammar.relationTypes[type];
    if (
      !exact(style, ['label', 'variant']) ||
      typeof style.label !== 'string' ||
      !style.label.trim() ||
      !variant.has(style.variant)
    )
      fail('semantic_publication_relation_style_missing');
  }
  if (
    Object.keys(grammar.relationTypes).some(
      (type) => !document.vocabulary.relations.includes(type),
    )
  )
    fail('semantic_publication_relation_style_unknown');
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

export function interactiveArchitectureDiagram(document, edition, view) {
  const widest = Math.max(
    ...view.groups.map((group) => group.entities.length),
  );
  const cellWidth = 170,
    columnGap = 70,
    contentWidth = widest * cellWidth + (widest - 1) * columnGap;
  const width = Math.max(920, contentWidth + 240);
  const height = 170 + view.groups.length * 210;
  const components = [];
  for (const [row, group] of view.groups.entries())
    for (const [col, id] of group.entities.entries()) {
      const entity = document.entities[id];
      const rowWidth =
          group.entities.length * cellWidth +
          (group.entities.length - 1) * columnGap,
        rowX = (width - rowWidth) / 2;
      components.push({
        id,
        type: edition.visualGrammar.entityTypes[entity.type],
        label: entity.label,
        pos: [rowX + col * (cellWidth + columnGap), 110 + row * 210],
        size: [cellWidth, 82],
      });
    }
  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: edition.title,
      subtitle: view.label,
      locale: 'en',
      quality_profile: 'showcase',
      visual_preset: 'editorial',
      viewBox: [width, height],
      legend: { mode: 'hidden' },
    },
    components,
    boundaries: view.groups.map((group) => ({
      kind: 'region',
      label: group.label,
      wraps: group.entities,
      pad: 24,
    })),
    connections: view.relations.map((layout) => {
      const relation = document.relations[layout.id],
        style = edition.visualGrammar.relationTypes[relation.type];
      return {
        id: layout.id,
        from: relation.subject,
        to: relation.object,
        label: style.label,
        variant: style.variant,
        fromSide: layout.fromSide,
        toSide: layout.toSide,
        route: layout.route,
        ...(layout.labelAt ? { labelAt: layout.labelAt } : {}),
        ...(layout.labelDx === undefined ? {} : { labelDx: layout.labelDx }),
        ...(layout.labelDy === undefined ? {} : { labelDy: layout.labelDy }),
        ...(layout.labelSegment === undefined
          ? {}
          : { labelSegment: layout.labelSegment }),
      };
    }),
  };
}

export function semanticArchitectureDiagram(document, edition, viewId) {
  const projections = semanticArchitectureProjections(document, edition),
    view = projections.interactiveScenes.find((item) => item.id === viewId);
  if (!view) fail('semantic_publication_view_missing');
  return interactiveArchitectureDiagram(document, edition, view);
}
