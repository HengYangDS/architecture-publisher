import { exact, jsonValue, record, text } from "./document.mjs";
import { relationReference, resolveLikeC4Selection } from "./native-selection.mjs";
import { fail, isDigest } from "../protocol/values.mjs";
import { LIMITS } from "../file-input/contract.mjs";

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const geometry = (value) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 10_000_000;
const positive = (value) => geometry(value) && value > 0;

/** This geometry protocol cannot carry groups, repeated entities or separate view labels. */
export function likeC4LayoutMembers(index, view) {
  const elements = new Map(index.elements.map((element) => [key(element), element]));
  const nodes = new Map();
  const unique = new Set();
  for (const node of view.nodes) {
    if (!node.element || unique.has(key(node.element)))
      fail("native_likec4_layout_unrepresentable");
    const element = elements.get(key(node.element));
    if (!element) fail("native_likec4_layout_unrepresentable");
    if (node.label !== element.label) fail("native_likec4_layout_label_unrepresentable");
    unique.add(key(node.element));
    nodes.set(node.id, node.element);
  }
  const sourceRelations = new Map(index.relations.map((relation) => [relation.id, relation]));
  const relations = new Map();
  for (const edge of view.edges) {
    for (const id of edge.relations) {
      const relation = sourceRelations.get(id);
      if (
        !relation ||
        relations.has(id) ||
        key(relation.from) !== key(nodes.get(edge.from)) ||
        key(relation.to) !== key(nodes.get(edge.to))
      )
        fail("native_likec4_layout_unrepresentable");
      if (edge.label !== relation.label) fail("native_likec4_layout_label_unrepresentable");
      relations.set(id, relation);
    }
  }
  return { nodes, relations };
}

/** Project one authored structural view's geometry without promoting it to source meaning. */
export async function buildLikeC4Layout(index, parsed, view) {
  const selected = resolveLikeC4Selection(index, {
    id: "layout",
    namespace: view?.namespace,
    kind: "reference",
    reference: `view:${view?.id}`,
  });
  const projection = index.views.find(
    (item) => item.namespace === view.namespace && item.id === view.id,
  );
  const expected = likeC4LayoutMembers(index, projection);
  let raw;
  try {
    raw = (await parsed.layoutedModel()).view(view.id).$layouted;
  } catch {
    fail("native_likec4_layout_unrepresentable");
  }
  if (
    raw?._stage !== "layouted" ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.edges) ||
    raw.nodes.length !== expected.nodes.size
  )
    fail("native_likec4_layout_unrepresentable");
  const members = new Map(selected.members.elements.map((element) => [element.id, element]));
  if (members.size !== selected.members.elements.length)
    fail("native_likec4_layout_unrepresentable");
  const nodesByNativeId = new Map();
  const nodes = raw.nodes.map((node) => {
    const member = members.get(node.modelRef);
    if (
      !member ||
      !expected.nodes.has(node.id) ||
      key(expected.nodes.get(node.id)) !== key(member) ||
      nodesByNativeId.has(node.id)
    )
      fail("native_likec4_layout_unrepresentable");
    const projected = {
      namespace: member.namespace,
      id: member.id,
      sha256: member.sha256,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    };
    nodesByNativeId.set(node.id, projected);
    return projected;
  });
  nodes.sort((left, right) => compare(key(left), key(right)));
  const relations = new Map(index.relations.map((relation) => [relation.id, relation]));
  const edges = raw.edges.map((edge) => {
    const from = nodesByNativeId.get(edge.source);
    const to = nodesByNativeId.get(edge.target);
    if (!from || !to || !Array.isArray(edge.relations) || !Array.isArray(edge.points))
      fail("native_likec4_layout_unrepresentable");
    return {
      from: { namespace: from.namespace, id: from.id },
      to: { namespace: to.namespace, id: to.id },
      relations: edge.relations.map((id) => {
        const relation = relations.get(id);
        if (!relation) fail("native_likec4_layout_unrepresentable");
        return {
          namespace: relation.origin.namespace,
          reference: relationReference(relation),
          sha256: relation.origin.sha256,
        };
      }),
      points: edge.points.map((point) => [...point]),
    };
  });
  edges.sort((left, right) =>
    compare(JSON.stringify(left.relations), JSON.stringify(right.relations)),
  );
  return {
    schema: "architecture.native-layout/v1",
    format: "likec4/dsl",
    closure: "upstream-layout-unqualified",
    view: {
      namespace: selected.source.namespace,
      id: selected.target.id,
      sha256: selected.source.sha256,
    },
    bounds: { ...raw.bounds },
    nodes,
    edges,
  };
}

/** Check the child reply against selected view membership, not visual adequacy. */
export function validateLikeC4LayoutReply(layout, index, selectedView) {
  if (
    !exact(layout, ["schema", "format", "closure", "view", "bounds", "nodes", "edges"]) ||
    layout.schema !== "architecture.native-layout/v1" ||
    layout.format !== "likec4/dsl" ||
    layout.closure !== "upstream-layout-unqualified" ||
    !record(selectedView) ||
    !text(selectedView.namespace) ||
    !text(selectedView.id) ||
    !Array.isArray(layout.nodes) ||
    !Array.isArray(layout.edges)
  )
    fail("native_likec4_response_invalid");
  try {
    jsonValue(layout);
  } catch {
    fail("native_likec4_response_invalid");
  }
  const view = index.views.find(
    (item) => item.namespace === selectedView.namespace && item.id === selectedView.id,
  );
  if (!view) fail("native_likec4_reference_unselected");
  const expected = likeC4LayoutMembers(index, view);
  if (
    !exact(layout.view, ["namespace", "id", "sha256"]) ||
    layout.view.namespace !== view.namespace ||
    layout.view.id !== view.id ||
    layout.view.sha256 !== view.origin.sha256 ||
    !exact(layout.bounds, ["x", "y", "width", "height"]) ||
    !geometry(layout.bounds.x) ||
    !geometry(layout.bounds.y) ||
    !positive(layout.bounds.width) ||
    !positive(layout.bounds.height) ||
    layout.nodes.length !== expected.nodes.size ||
    layout.nodes.length > LIMITS.entries ||
    layout.edges.length > LIMITS.entries
  )
    fail("native_likec4_response_invalid");
  const expectedNodes = new Map(
    [...expected.nodes.values()].map((member) => {
      const element = index.elements.find((item) => key(item) === key(member));
      return [key(member), element?.origin.sha256];
    }),
  );
  const nodes = new Set();
  for (const node of layout.nodes) {
    if (
      !exact(node, ["namespace", "id", "sha256", "x", "y", "width", "height"]) ||
      !isDigest(node.sha256) ||
      expectedNodes.get(key(node)) !== node.sha256 ||
      !geometry(node.x) ||
      !geometry(node.y) ||
      !positive(node.width) ||
      !positive(node.height) ||
      nodes.has(key(node))
    )
      fail("native_likec4_response_invalid");
    nodes.add(key(node));
  }
  const expectedRelations = new Map(
    [...expected.relations.values()].map((relation) => {
      return [
        JSON.stringify([
          relation.origin.namespace,
          relationReference(relation),
          relation.origin.sha256,
        ]),
        relation,
      ];
    }),
  );
  if (expectedRelations.size !== expected.relations.size) fail("native_likec4_response_invalid");
  const found = new Set();
  for (const edge of layout.edges) {
    if (
      !exact(edge, ["from", "to", "relations", "points"]) ||
      !exact(edge.from, ["namespace", "id"]) ||
      !exact(edge.to, ["namespace", "id"]) ||
      !nodes.has(key(edge.from)) ||
      !nodes.has(key(edge.to)) ||
      !Array.isArray(edge.relations) ||
      !edge.relations.length ||
      !Array.isArray(edge.points) ||
      edge.points.length < 2 ||
      edge.points.length > LIMITS.entries ||
      edge.points.some(
        (point) => !Array.isArray(point) || point.length !== 2 || !point.every(geometry),
      )
    )
      fail("native_likec4_response_invalid");
    for (const relation of edge.relations) {
      if (!exact(relation, ["namespace", "reference", "sha256"]))
        fail("native_likec4_response_invalid");
      const identity = JSON.stringify([relation.namespace, relation.reference, relation.sha256]);
      const selected = expectedRelations.get(identity);
      if (
        !selected ||
        found.has(identity) ||
        key(selected.from) !== key(edge.from) ||
        key(selected.to) !== key(edge.to)
      )
        fail("native_likec4_response_invalid");
      found.add(identity);
    }
  }
  if (found.size !== expectedRelations.size) fail("native_likec4_response_invalid");
  return layout;
}
