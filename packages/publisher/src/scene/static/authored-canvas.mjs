import { deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../source/manifest.mjs';
import { linkClaimModelSources } from '../claim-relations.mjs';

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

const selectionReference = ({ source, target }) =>
  JSON.stringify([source.namespace, target.kind, target.id]);

/** Re-derive source-to-graphic anchors without accepting authored coverage claims. */
export function composeAuthoredStaticCanvas(meaning) {
  const view = meaning?.media?.static?.views?.[0];
  const selected = meaning?.refinement?.media?.static;
  const scene = selected?.scene;
  if (
    meaning?.media?.static?.views?.length !== 1 ||
    selected?.kind !== 'authored-canvas' ||
    selected.view !== view.id ||
    scene?.schema !== 'architecture.authored-static-scene/v1' ||
    scene.title !== meaning.editorial?.title ||
    !Array.isArray(view.assertionIds) ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.native?.selections)
  )
    fail('authored_canvas_input_invalid');
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  if (
    assertions.size !== meaning.assertions.length ||
    selections.size !== meaning.native.selections.length
  )
    fail('authored_canvas_input_invalid');
  const required = new Map();
  const selectedByAssertion = new Map();
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
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
    if (required.has(key)) fail('authored_canvas_membership_mismatch');
    required.set(key, item);
  }
  const declared = scene.requiredSemanticIds.map((id) => {
    reference(id);
    return id;
  });
  if (
    declared.length !== required.size ||
    new Set(declared).size !== declared.length ||
    declared.some((id) => !required.has(id))
  )
    fail('authored_canvas_membership_mismatch');

  const nodes = new Map();
  const membersByNode = new Map();
  const entityGraphics = new Map();
  for (const node of scene.nodes) {
    if (nodes.has(node.id)) fail('authored_canvas_graphic_ambiguous');
    nodes.set(node.id, node);
    const members = new Set();
    for (const id of node.semanticIds) {
      const [, kind] = reference(id);
      if (kind !== 'entity' || !required.has(id) || entityGraphics.has(id) || members.has(id))
        fail('authored_canvas_membership_mismatch');
      members.add(id);
      entityGraphics.set(id, `node:${node.id}`);
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
  for (const label of scene.texts) {
    if (textIds.has(label.id)) fail('authored_canvas_graphic_ambiguous');
    textIds.add(label.id);
    for (const id of label.semanticIds) {
      reference(id);
      if (!label.visible || !required.has(id) || textGraphics.has(id))
        fail('authored_canvas_membership_mismatch');
      textGraphics.set(id, `text:${label.id}`);
    }
  }
  if (textGraphics.size !== required.size) fail('authored_canvas_membership_mismatch');

  const edgeIds = new Set();
  const edgeRelations = new Set();
  for (const edge of scene.edges) {
    if (edgeIds.has(edge.id)) fail('authored_canvas_graphic_ambiguous');
    edgeIds.add(edge.id);
    const from = membersByNode.get(edge.source);
    const to = membersByNode.get(edge.target);
    if (!from || !to || !edge.semanticIds.length) fail('authored_canvas_edge_binding_mismatch');
    let crosses = false;
    for (const id of edge.semanticIds) {
      const [, kind] = reference(id);
      const item = required.get(id);
      if (kind !== 'relation' || item?.target.kind !== 'relation' || edgeRelations.has(id))
        fail('authored_canvas_edge_binding_mismatch');
      edgeRelations.add(id);
      const relation = item.members.relations[0];
      const subject = JSON.stringify([item.source.namespace, 'entity', relation.from.id]);
      const object = JSON.stringify([item.source.namespace, 'entity', relation.to.id]);
      if ((!from.has(subject) && !to.has(subject)) || (!from.has(object) && !to.has(object)))
        fail('authored_canvas_edge_binding_mismatch');
      if (from.has(subject) && to.has(object)) crosses = true;
    }
    if (!crosses) fail('authored_canvas_edge_binding_mismatch');
  }

  const links = linkClaimModelSources(
    view,
    assertions,
    selections,
    'authored_canvas_claim_unbound',
  );
  const relationAnchor = new Map(
    links.links.map(({ claimAssertionId, relationAssertionId }) => [
      claimAssertionId,
      selectionReference(selectedByAssertion.get(relationAssertionId)),
    ]),
  );
  const subjectAnchor = new Map(
    links.subjectLinks.map(({ claimAssertionId, subject }) => [
      claimAssertionId,
      JSON.stringify([subject.namespace, 'entity', subject.id]),
    ]),
  );
  const carriers = view.assertionIds.map((id) => {
    const item = selectedByAssertion.get(id);
    const anchor =
      item.target.kind === 'claim'
        ? (relationAnchor.get(id) ?? subjectAnchor.get(id))
        : selectionReference(item);
    const graphicId = textGraphics.get(anchor);
    if (!graphicId) fail('authored_canvas_claim_unbound');
    return {
      assertionId: id,
      source: {
        namespace: item.source.namespace,
        sha256: item.source.sha256,
        kind: item.target.kind,
        id: item.target.id,
      },
      graphicId,
      representation: 'source-anchored-aggregate',
    };
  });
  return deepFreeze({
    scene,
    carriers: {
      schema: 'architecture.authored-canvas-carriers/v1',
      assertions: carriers,
      nodeGraphics: [...entityGraphics],
      textGraphics: [...textGraphics],
      edgeRelations: [...edgeRelations],
    },
    limits: ['authored-canvas-claim-facts-not-exhaustively-painted'],
  });
}
