export function orderedFlow(page) {
  const outgoing = new Map(page.nodes.map(({ id }) => [id, new Set()]));
  const incoming = new Map(page.nodes.map(({ id }) => [id, new Set()]));
  for (const relation of page.relations) {
    if (relation.source === relation.target) continue;
    if (relation.direction === "bidirectional") return false;
    outgoing.get(relation.source).add(relation.target);
    incoming.get(relation.target).add(relation.source);
  }
  if ([...outgoing.values(), ...incoming.values()].some(({ size }) => size > 1)) return false;
  const pending = [...incoming.keys()].filter((id) => !incoming.get(id).size);
  for (let index = 0; index < pending.length; index++)
    for (const target of outgoing.get(pending[index])) pending.push(target);
  return pending.length === page.nodes.length;
}

/** A presentation circuit is proved from endpoints; it is not an execution model. */
export function circuitHub(page) {
  const found = [];
  const key = (node) => JSON.stringify([node.label?.lines ?? node.label, node.width, node.height]);
  for (const hub of page.nodes) {
    const members = page.nodes.filter(({ id }) => id !== hub.id);
    if (members.length < 4) continue;
    const outgoing = new Map(members.map(({ id }) => [id, new Set()]));
    const incoming = new Map(members.map(({ id }) => [id, new Set()]));
    const adjacent = new Set();
    let invalid = false;
    for (const edge of page.relations) {
      if (edge.source === hub.id || edge.target === hub.id) {
        adjacent.add(edge.source === hub.id ? edge.target : edge.source);
        continue;
      }
      if (edge.source === edge.target || edge.direction === "bidirectional") {
        invalid = true;
        break;
      }
      outgoing.get(edge.source).add(edge.target);
      incoming.get(edge.target).add(edge.source);
    }
    if (
      invalid ||
      adjacent.size < 3 ||
      [...outgoing.values(), ...incoming.values()].some(({ size }) => size !== 1)
    )
      continue;
    members.sort((a, b) => key(a).localeCompare(key(b), "en"));
    if (key(members[0]) === key(members[1])) continue;
    const order = [];
    let current = members[0].id;
    while (!order.includes(current)) {
      order.push(current);
      current = [...outgoing.get(current)][0];
    }
    if (order.length === members.length && current === order[0]) found.push({ hub: hub.id, order });
  }
  return found.length === 1 ? found[0] : null;
}

export function connectedComponents(page) {
  const parent = new Map(page.nodes.map(({ id }) => [id, id]));
  const root = (id) => {
    const current = parent.get(id);
    if (current !== id) parent.set(id, root(current));
    return parent.get(id);
  };
  for (const relation of page.relations) parent.set(root(relation.target), root(relation.source));
  for (const group of page.groups)
    for (const id of group.nodeIds) parent.set(root(id), root(group.nodeIds[0]));
  const components = new Map();
  for (const node of page.nodes) {
    const id = root(node.id);
    if (!components.has(id)) components.set(id, { nodes: [], groups: [], relations: [] });
    components.get(id).nodes.push(node);
  }
  for (const group of page.groups) components.get(root(group.nodeIds[0])).groups.push(group);
  for (const relation of page.relations)
    components.get(root(relation.source)).relations.push(relation);
  return [...components.values()];
}

export function orderedLayoutPage(page) {
  const key = (node) => JSON.stringify([node.label.lines, node.width, node.height]);
  const nodes = [...page.nodes].sort((left, right) => key(left).localeCompare(key(right), "en"));
  if (orderedFlow(page)) {
    const remaining = [...nodes];
    const visited = new Set();
    nodes.length = 0;
    while (remaining.length) {
      const at = remaining.findIndex(({ id }) =>
        page.relations.every(
          ({ source, target }) => target !== id || source === id || visited.has(source),
        ),
      );
      const [node] = remaining.splice(at, 1);
      nodes.push(node);
      visited.add(node.id);
    }
  }
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  const relations = [...page.relations].sort(
    (left, right) =>
      order.get(left.source) - order.get(right.source) ||
      order.get(left.target) - order.get(right.target) ||
      JSON.stringify(left.label?.lines ?? []).localeCompare(
        JSON.stringify(right.label?.lines ?? []),
        "en",
      ),
  );
  return { ...page, nodes, relations };
}

export function rootedTree(anchor, internal) {
  const visit = (id, parent) => {
    const children = internal
      .filter(
        (edge) =>
          (edge.source === id && edge.target !== parent) ||
          (edge.target === id && edge.source !== parent),
      )
      .map((edge) => {
        const next = visit(edge.source === id ? edge.target : edge.source, id);
        const direction =
          edge.direction === "bidirectional" ? "both" : edge.source === id ? "out" : "in";
        return { ...next, signature: `${direction}${next.signature}` };
      })
      .sort((left, right) => left.signature.localeCompare(right.signature, "en"));
    return {
      signature: `(${children.map(({ signature }) => signature).join(",")})`,
      order: [id, ...children.flatMap(({ order }) => order)],
    };
  };
  return visit(anchor, null);
}

function hopDistances(origin, relations, reverse = false) {
  const distance = new Map([[origin, 0]]);
  const pending = [origin];
  for (let index = 0; index < pending.length; index++) {
    const id = pending[index];
    for (const edge of relations) {
      const [from, to] = reverse ? [edge.target, edge.source] : [edge.source, edge.target];
      if (from !== id || distance.has(to)) continue;
      distance.set(to, distance.get(id) + 1);
      pending.push(to);
    }
  }
  return distance;
}

function joinedPaths(page, adjacent) {
  const seen = new Set();
  const signatures = new Map();
  let selected = [];
  for (const node of page.nodes) {
    const through = (id) =>
      adjacent.get(id).length === 2 &&
      page.relations.filter((edge) => edge.source === id).length === 1 &&
      page.relations.filter((edge) => edge.target === id).length === 1;
    if (seen.has(node.id) || !through(node.id)) continue;
    const ids = [],
      pending = [node.id];
    seen.add(node.id);
    while (pending.length) {
      const id = pending.pop();
      ids.push(id);
      for (const next of adjacent.get(id))
        if (!seen.has(next) && through(next)) {
          seen.add(next);
          pending.push(next);
        }
    }
    if (ids.length < 3) continue;
    const members = new Set(ids);
    const internal = page.relations.filter(
      (edge) => members.has(edge.source) && members.has(edge.target),
    );
    const boundary = page.relations.filter(
      (edge) => members.has(edge.source) !== members.has(edge.target),
    );
    if (internal.length !== ids.length - 1 || boundary.length !== 2) continue;
    const incoming = boundary.find((edge) => !members.has(edge.source) && members.has(edge.target));
    const outgoing = boundary.find((edge) => members.has(edge.source) && !members.has(edge.target));
    if (
      !incoming ||
      !outgoing ||
      incoming.source === outgoing.target ||
      page.relations.filter((edge) => edge.source === incoming.source).length < 2 ||
      page.relations.filter((edge) => edge.target === outgoing.target).length < 2 ||
      boundary.some((edge) => edge.direction === "bidirectional")
    )
      continue;
    const order = [incoming.target];
    while (order.length < ids.length) {
      const edge = internal.find((edge) => edge.source === order.at(-1));
      if (!edge || edge.direction === "bidirectional" || order.includes(edge.target)) break;
      order.push(edge.target);
    }
    if (order.length !== ids.length || order.at(-1) !== outgoing.source) continue;
    const key = JSON.stringify([incoming.source, outgoing.target, ids.length]);
    if (!signatures.has(key)) signatures.set(key, []);
    signatures
      .get(key)
      .push({ ids, order, internal, entry: incoming.source, exit: outgoing.target });
  }
  for (const family of signatures.values())
    if (
      family.length >= 2 &&
      family.length * family[0].ids.length > selected.length * (selected[0]?.ids.length ?? 0)
    )
      selected = family;
  return selected;
}

export function repeatedBranches(page) {
  const adjacent = new Map(page.nodes.map(({ id }) => [id, []]));
  for (const edge of page.relations) {
    adjacent.get(edge.source).push(edge.target);
    adjacent.get(edge.target).push(edge.source);
  }
  let selected = joinedPaths(page, adjacent);
  for (const hub of page.nodes) {
    const seen = new Set([hub.id]);
    const signatures = new Map();
    for (const node of page.nodes) {
      if (seen.has(node.id)) continue;
      const ids = [],
        pending = [node.id];
      seen.add(node.id);
      while (pending.length) {
        const id = pending.pop();
        ids.push(id);
        for (const next of adjacent.get(id))
          if (!seen.has(next)) {
            seen.add(next);
            pending.push(next);
          }
      }
      if (ids.length < 3) continue;
      const members = new Set(ids);
      const internal = page.relations.filter(
        (edge) => members.has(edge.source) && members.has(edge.target),
      );
      const boundary = page.relations.filter(
        (edge) => members.has(edge.source) !== members.has(edge.target),
      );
      if (internal.length !== ids.length - 1 || boundary.length !== 1) continue;
      const edge = boundary[0];
      const anchor = edge.source === hub.id ? edge.target : edge.source;
      const tree = rootedTree(anchor, internal);
      const direction =
        edge.direction === "bidirectional" ? "both" : edge.source === hub.id ? "out" : "in";
      const signature = `${direction}${tree.signature}`;
      if (!signatures.has(signature)) signatures.set(signature, []);
      signatures.get(signature).push({ ids, order: tree.order, internal });
    }
    for (const family of signatures.values())
      if (
        family.length >= 2 &&
        family.length * family[0].ids.length > selected.length * (selected[0]?.ids.length ?? 0)
      )
        selected = family;
  }
  return selected;
}

export function branchStages(page, family) {
  const branchIds = new Set(family.flatMap(({ ids }) => ids));
  const remainder = page.nodes.filter(({ id }) => !branchIds.has(id));
  const connected = new Set(page.relations.flatMap(({ source, target }) => [source, target]));
  const context = remainder.filter(({ id }) => !connected.has(id));
  const edges = page.relations.filter(
    ({ source, target }) => !branchIds.has(source) && !branchIds.has(target),
  );
  const entry = family[0]?.entry;
  const exit = family[0]?.exit;
  if (!entry)
    return { context, before: [], after: remainder.filter(({ id }) => connected.has(id)), edges };
  const toEntry = hopDistances(entry, edges, true);
  const fromExit = hopDistances(exit, edges);
  const before = remainder.filter(
    ({ id }) =>
      connected.has(id) &&
      (id === entry ||
        (id !== exit && (toEntry.get(id) ?? Infinity) < (fromExit.get(id) ?? Infinity))),
  );
  const introductionIds = new Set([...context, ...before].map(({ id }) => id));
  return {
    context,
    before,
    after: remainder.filter(({ id }) => !introductionIds.has(id)),
    edges,
    toEntry,
  };
}
