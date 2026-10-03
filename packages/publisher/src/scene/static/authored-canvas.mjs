import { deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../protocol/values.mjs';
import { classifyAggregateRelation } from '../aggregate-relation.mjs';
import { assertPrimitiveContrast, resolvePrimitiveNodes } from '../primitives.mjs';
import { bindAuthoredRoutes } from '../routes.mjs';
import { validateAuthoredTextOwners } from '../text-ownership.mjs';
import {
  authoredReference,
  deriveAuthoredStatements,
  requireAuthoredStatementText,
} from '../statements.mjs';

function reference(value) {
  if (typeof value !== 'string') fail('authored_canvas_reference_invalid');
  let parts;
  try {
    parts = JSON.parse(value);
  } catch {
    fail('authored_canvas_reference_invalid');
  }
  if (
    !Array.isArray(parts) ||
    parts.length !== 3 ||
    parts.some((part) => typeof part !== 'string' || !part) ||
    !['entity', 'relation'].includes(parts[1]) ||
    JSON.stringify(parts) !== value
  )
    fail('authored_canvas_reference_invalid');
  return parts;
}

function admitEditorial(assertion) {
  if (assertion?.kind !== 'editorial') return false;
  if (typeof assertion.statement !== 'string' || !assertion.statement.trim())
    fail('authored_canvas_editorial_unadmitted');
  return true;
}

function staticRouteBindings(
  scene,
  membersByNode,
  required,
  statements,
  selections,
  relationGraphics,
) {
  const routes = bindAuthoredRoutes(scene, {
    medium: 'static',
    entities: membersByNode,
    relations: new Map(
      [...required]
        .filter(([, item]) => item.target.kind === 'relation')
        .map(([id, item]) => [id, item.members.relations[0]]),
    ),
    editorials: statements.editorial,
    selections,
  });
  for (const [id, graphics] of routes) {
    if (JSON.parse(id)[1] !== 'relation') continue;
    const previous = relationGraphics.get(id) ?? [];
    for (const graphic of graphics) {
      const occurrence = `edge:${graphic}`;
      if (!previous.includes(occurrence)) previous.push(occurrence);
    }
    relationGraphics.set(id, previous);
  }
  return routes;
}

function staticEditorialCarrier(editorial, textGraphics, routeGraphics) {
  return {
    edition: editorial.edition,
    graphicIds: [
      ...textGraphics.get(editorial.reference),
      ...(routeGraphics.get(editorial.reference) ?? []).map((id) => `edge:${id}`),
    ],
    representation: 'editorial-statement',
  };
}

const selectionReference = ({ source, target }) =>
  JSON.stringify([source.namespace, target.kind, target.id]);

/** Re-derive source-to-graphic anchors without accepting authored coverage claims. */
export function composeAuthoredStaticCanvas(meaning) {
  const views = meaning?.media?.static?.views;
  const selected = meaning?.refinement?.media?.static;
  let scene = selected?.scene;
  if (
    !Array.isArray(views) ||
    !views.length ||
    views.some(
      (view) =>
        typeof view?.id !== 'string' ||
        !view.id ||
        !Array.isArray(view.assertionIds) ||
        !view.assertionIds.length ||
        view.assertionIds.some((id) => typeof id !== 'string' || !id) ||
        new Set(view.assertionIds).size !== view.assertionIds.length,
    ) ||
    new Set(views.map(({ id }) => id)).size !== views.length ||
    selected?.kind !== 'authored-canvas' ||
    scene?.schema !== 'architecture.authored-static-scene/v1' ||
    scene.title !== meaning.editorial?.title ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.native?.selections)
  )
    fail('authored_canvas_input_invalid');
  scene = { ...scene, nodes: resolvePrimitiveNodes(scene.nodes, 'static') };
  const tone = (name) => {
    const color = scene.paint?.[name];
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/iu.test(color))
      fail('authored_canvas_tone_invalid');
    return color.toLowerCase();
  };
  assertPrimitiveContrast(scene.nodes, tone, tone('paper'));
  const requiredAssertionIds = [...new Set(views.flatMap(({ assertionIds }) => assertionIds))];
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  if (
    assertions.size !== meaning.assertions.length ||
    selections.size !== meaning.native.selections.length
  )
    fail('authored_canvas_input_invalid');
  const required = new Map();
  const selectedStructure = new Set();
  const selectedByAssertion = new Map();
  const addMember = (id, item) => {
    const previous = required.get(id);
    if (
      previous &&
      (previous.source.namespace !== item.source.namespace ||
        previous.source.sha256 !== item.source.sha256)
    )
      fail('authored_canvas_membership_mismatch');
    if (!previous) required.set(id, item);
  };
  for (const id of requiredAssertionIds) {
    const assertion = assertions.get(id);
    if (admitEditorial(assertion)) continue;
    if (assertion?.kind !== 'source') fail('authored_canvas_editorial_unadmitted');
    const item = selections.get(assertion.selection);
    if (
      item?.format !== 'architecture.claim-model/v2' ||
      !['entity', 'relation', 'claim'].includes(item.target?.kind)
    )
      fail('authored_canvas_source_unadmitted');
    selectedByAssertion.set(id, item);
    if (item.target.kind === 'claim') continue;
    const key = selectionReference(item);
    if (selectedStructure.has(key)) fail('authored_canvas_membership_mismatch');
    selectedStructure.add(key);
    addMember(key, item);
    if (item.target.kind === 'relation') {
      if (!Array.isArray(item.members?.elements) || !item.members.elements.length)
        fail('authored_canvas_source_unadmitted');
      for (const element of item.members.elements) {
        if (
          typeof element?.id !== 'string' ||
          !element.id ||
          element.namespace !== item.source.namespace ||
          element.sha256 !== item.source.sha256
        )
          fail('authored_canvas_source_unadmitted');
        addMember(JSON.stringify([element.namespace, 'entity', element.id]), {
          source: item.source,
          target: { kind: 'entity', id: element.id },
        });
      }
    }
  }
  for (const id of scene.requiredSemanticIds)
    authoredReference(
      id,
      ['entity', 'relation', 'claim', 'editorial'],
      'authored_canvas_reference_invalid',
    );
  const statements = deriveAuthoredStatements(
    {
      views,
      assertions,
      selections,
      edition: meaning.edition,
      structuralReferences: new Set(required.keys()),
      declaredReferences: scene.requiredSemanticIds,
    },
    'authored_canvas_membership_mismatch',
    'authored_canvas_claim_unbound',
  );

  const nodes = new Map();
  const membersByNode = new Map();
  const entityGraphics = new Map();
  const bindOccurrence = (map, id, graphicId) => {
    const graphics = map.get(id) ?? [];
    if (graphics.includes(graphicId)) fail('authored_canvas_membership_mismatch');
    graphics.push(graphicId);
    map.set(id, graphics);
  };
  for (const node of scene.nodes) {
    if (nodes.has(node.id)) fail('authored_canvas_graphic_ambiguous');
    nodes.set(node.id, node);
    if (node.adornment) continue;
    const members = new Set();
    for (const id of node.semanticIds) {
      const [, kind] = reference(id);
      if (kind !== 'entity' || !required.has(id) || members.has(id))
        fail('authored_canvas_membership_mismatch');
      members.add(id);
      bindOccurrence(entityGraphics, id, `node:${node.id}`);
    }
    membersByNode.set(node.id, members);
  }
  if (
    entityGraphics.size !==
    [...required.values()].filter(({ target }) => target.kind === 'entity').length
  )
    fail('authored_canvas_membership_mismatch');

  const textGraphics = new Map();
  const textIds = new Set();
  validateAuthoredTextOwners(scene.texts, scene.nodes);
  for (const label of scene.texts) {
    if (textIds.has(label.id)) fail('authored_canvas_graphic_ambiguous');
    textIds.add(label.id);
    for (const id of label.semanticIds) {
      authoredReference(
        id,
        ['entity', 'relation', 'claim', 'editorial'],
        'authored_canvas_reference_invalid',
      );
      if (!label.visible || !label.text?.trim() || !statements.requiredReferences.has(id))
        fail('authored_canvas_membership_mismatch');
      bindOccurrence(textGraphics, id, `text:${label.id}`);
    }
  }
  requireAuthoredStatementText(statements, textGraphics);
  if (textGraphics.size !== statements.requiredReferences.size)
    fail('authored_canvas_membership_mismatch');

  const edgeIds = new Set();
  const relationGraphics = new Map();
  for (const edge of scene.edges.filter((edge) => !Object.hasOwn(edge, 'adornment'))) {
    if (edgeIds.has(edge.id)) fail('authored_canvas_graphic_ambiguous');
    edgeIds.add(edge.id);
    const from = membersByNode.get(edge.source);
    const to = membersByNode.get(edge.target);
    if (!from || !to || !edge.semanticIds.length) fail('authored_canvas_edge_binding_mismatch');
    const localRelations = new Set();
    let crosses = false;
    for (const id of edge.semanticIds) {
      const [, kind] = reference(id);
      const item = required.get(id);
      if (kind !== 'relation' || item?.target.kind !== 'relation' || localRelations.has(id))
        fail('authored_canvas_edge_binding_mismatch');
      localRelations.add(id);
      const relation = item.members.relations[0];
      const subject = JSON.stringify([item.source.namespace, 'entity', relation.from.id]);
      const object = JSON.stringify([item.source.namespace, 'entity', relation.to.id]);
      const role = classifyAggregateRelation(from, to, subject, object);
      if (role === null) fail('authored_canvas_edge_binding_mismatch');
      const graphicId =
        role === 'cross'
          ? `edge:${edge.id}`
          : `node:${role === 'from-context' ? edge.source : edge.target}`;
      const graphics = relationGraphics.get(id) ?? [];
      if (!graphics.includes(graphicId)) graphics.push(graphicId);
      relationGraphics.set(id, graphics);
      if (role === 'cross') crosses = true;
    }
    if (!crosses) fail('authored_canvas_edge_binding_mismatch');
  }

  const routeGraphics = staticRouteBindings(
    scene,
    membersByNode,
    required,
    statements,
    selections,
    relationGraphics,
  );

  const carriers = requiredAssertionIds.map((id) => {
    const editorial = statements.editorial.get(id);
    if (editorial)
      return {
        assertionId: id,
        ...staticEditorialCarrier(editorial, textGraphics, routeGraphics),
      };
    const item = selectedByAssertion.get(id);
    const statement = statements.claims.get(id);
    const anchor = item.target.kind === 'claim' ? statement.anchor : selectionReference(item);
    const textIds = textGraphics.get(statement?.direct ? statement.reference : anchor);
    if (!textIds?.length) fail('authored_canvas_claim_unbound');
    const structuralIds =
      item.target.kind === 'claim'
        ? (anchor && JSON.parse(anchor)[1] === 'relation' ? relationGraphics : entityGraphics).get(
            anchor,
          )
        : [];
    if (
      item.target.kind === 'claim' &&
      (anchor !== null || !statement.direct) &&
      !structuralIds?.length
    )
      fail('authored_canvas_claim_unbound');
    return {
      assertionId: id,
      source: {
        namespace: item.source.namespace,
        sha256: item.source.sha256,
        kind: item.target.kind,
        id: item.target.id,
      },
      graphicIds: [...new Set([...textIds, ...(structuralIds ?? [])])],
      representation: statement?.direct ? 'source-statement' : 'source-anchored-aggregate',
    };
  });
  return deepFreeze({
    scene,
    carriers: {
      schema: 'architecture.authored-canvas-carriers/v2',
      views: views.map(({ id, assertionIds }) => ({ id, assertionIds: [...assertionIds] })),
      assertions: carriers,
      nodeGraphics: [...entityGraphics],
      textGraphics: [...textGraphics],
      relationGraphics: [...relationGraphics],
    },
    limits: [
      'authored-canvas-text-meaning-unverified',
      ...(statements.directReferences.size || statements.editorialReferences.size
        ? ['authored-statement-wording-unverified']
        : []),
      ...(carriers.some(({ source }) => source?.kind === 'claim')
        ? ['authored-canvas-claim-facts-not-exhaustively-painted']
        : []),
    ],
  });
}
