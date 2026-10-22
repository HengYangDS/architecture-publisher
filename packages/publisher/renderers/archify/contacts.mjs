/** Shared contact is a property of ordered traversals, never of source identity. */
export function sharedContacts(scene, sizes) {
  const edges = new Map(scene.edges.map((edge) => [edge.id, edge]));
  const junctions = new Set(scene.nodes.filter((node) => node.adornment).map(({ id }) => id));
  const parent = new Map();
  const key = (edge, end) => `${edge}:${end}`;
  const root = (id) => {
    if (!parent.has(id)) parent.set(id, id);
    const current = parent.get(id);
    if (current !== id) parent.set(id, root(current));
    return parent.get(id);
  };
  for (const route of scene.routes ?? []) {
    for (let index = 1; index < route.traversals.length; index++) {
      const previous = route.traversals[index - 1];
      const next = route.traversals[index];
      const a = edges.get(previous.edge),
        b = edges.get(next.edge);
      const previousEnd = previous.direction === "forward" ? "to" : "from";
      const nextStart = next.direction === "forward" ? "from" : "to";
      if (!junctions.has(a[previousEnd])) continue;
      parent.set(root(key(a.id, previousEnd)), root(key(b.id, nextStart)));
    }
  }
  const ports = Object.create(null),
    endpoints = new Map();
  const groups = new Map();
  for (const edge of scene.edges)
    for (const end of ["from", "to"]) {
      if (!junctions.has(edge[end])) continue;
      const contact = root(key(edge.id, end));
      if (!groups.has(contact)) groups.set(contact, []);
      groups.get(contact).push({ edge, end });
    }
  for (const [contact, members] of groups) {
    const node = members[0].edge[members[0].end];
    const bridge = members.find(({ edge }) => edge.from === edge.to);
    const side = bridge ? (bridge.end === "from" ? "WEST" : "EAST") : "WEST";
    const size = sizes[node];
    const port = {
      id: `archpub:contact:${contact}`,
      x: side === "WEST" ? 0 : size.width,
      y: 0,
      width: 0,
      height: 0,
      layoutOptions: { "elk.port.side": side },
    };
    (ports[node] ??= []).push(port);
    for (const { edge, end } of members) endpoints.set(key(edge.id, end), port.id);
  }
  for (const [id, contacts] of Object.entries(ports)) {
    for (const side of ["WEST", "EAST"]) {
      const peers = contacts.filter((port) => port.layoutOptions["elk.port.side"] === side);
      for (const [index, port] of peers.entries())
        port.y = (sizes[id].height * (index + 1)) / (peers.length + 1);
    }
  }
  return { ports, endpoints };
}
