import assert from "node:assert/strict";
import test from "node:test";

test("a graph-proved circuit surrounds its cross-cutting hub without declaration-order coupling", async () => {
  const topology = await import("../packages/publisher/renderers/elk/topology.mjs");
  assert.equal(
    typeof topology.circuitHub,
    "function",
    "The topology owner must identify the circuit",
  );
  const ids = ["capture", "meaning", "edition", "media", "quality", "publish", "adopt"];
  const page = {
    nodes: [...ids, "change"].map((id, index) => ({
      id,
      label: { lines: [index === 7 ? "Cross-cutting change" : `Stage ${index}`] },
      width: 176,
      height: 80,
    })),
    relations: [
      ...ids.map((id, index) => ({
        id: `loop-${index}`,
        source: id,
        target: ids[(index + 1) % ids.length],
      })),
      ...["meaning", "edition", "media", "quality", "publish"].map((target, index) => ({
        id: `reconsider-${index}`,
        source: "change",
        target,
      })),
      { id: "observes-change", source: "meaning", target: "change" },
    ],
  };
  const before = structuredClone(page);
  assert.deepEqual(topology.circuitHub(page), { hub: "change", order: ids });
  const shuffled = {
    ...page,
    nodes: [...page.nodes].reverse(),
    relations: [...page.relations].reverse(),
  };
  assert.deepEqual(topology.circuitHub(shuffled), { hub: "change", order: ids });
  const rename = new Map(page.nodes.map(({ id }, index) => [id, `opaque-${91 - index}`]));
  assert.deepEqual(
    topology.circuitHub({
      nodes: shuffled.nodes.map((node) => ({ ...node, id: rename.get(node.id) })),
      relations: shuffled.relations.map((edge) => ({
        ...edge,
        source: rename.get(edge.source),
        target: rename.get(edge.target),
      })),
    }),
    { hub: rename.get("change"), order: ids.map((id) => rename.get(id)) },
  );
  assert.equal(
    topology.circuitHub({ ...page, relations: page.relations.filter(({ id }) => id !== "loop-3") }),
    null,
  );
  assert.equal(
    topology.circuitHub({
      ...page,
      relations: [...page.relations, { id: "cross", source: "capture", target: "media" }],
    }),
    null,
  );
  assert.equal(
    topology.circuitHub({
      ...page,
      relations: page.relations.map((edge, index) =>
        index ? edge : { ...edge, direction: "bidirectional" },
      ),
    }),
    null,
  );
  assert.deepEqual(page, before);

  const { intrinsicPlacements, unpackGeometry } =
    await import("../packages/publisher/renderers/elk/placement.mjs");
  const { createRequire } = await import("node:module");
  const ELK = createRequire(import.meta.url)("elkjs/lib/elk.bundled.js");
  const measured = {
    ...page,
    nodes: page.nodes.map((node) => ({
      ...node,
      label: { ...node.label, width: 176, height: 40 },
    })),
    relations: page.relations.map((edge) => ({
      ...edge,
      label: { lines: ["Exact caption"], width: 96, height: 32 },
    })),
  };
  const entry = intrinsicPlacements(measured, 1346, undefined, { width: 1240, height: 574 })[1];
  const raw = await new ELK().layout(entry.graph);
  const geometry = unpackGeometry(raw, entry.containers, true);
  const byId = new Map(geometry.children.map((node) => [node.id, node]));
  const hub = byId.get("change");
  const circuit = ids.map((id) => byId.get(id));
  assert(
    hub.y > Math.min(...circuit.map(({ y }) => y)) &&
      hub.y < Math.max(...circuit.map(({ y }) => y)),
    "The hub occupies the interior vertical band",
  );
  assert(
    hub.x > Math.min(...circuit.map(({ x }) => x)) &&
      hub.x < Math.max(...circuit.map(({ x }) => x)),
    "The hub occupies the interior horizontal band",
  );
  assert.equal(
    new Set(geometry.children.map(({ y }) => y)).size,
    3,
    "Three reading bands, not two packed rows",
  );
  assert.equal(geometry.children.length, page.nodes.length, "Native regions introduce no figures");
});

test("compact placement reserves complete caption height before routing without enlarging peers", async () => {
  const { intrinsicPlacements } = await import("../packages/publisher/renderers/elk/placement.mjs");
  const { createRequire } = await import("node:module");
  const ELK = createRequire(import.meta.url)("elkjs/lib/elk.bundled.js");
  const label = { lines: ["Subject"], width: 176, height: 64, fontSize: 12, baselines: [] };
  const page = {
    orderedFlow: false,
    groups: [],
    nodes: Array.from({ length: 8 }, (_, index) => ({
      id: `subject-${index}`,
      width: 224,
      height: 80,
      label,
    })),
    relations: Array.from({ length: 8 }, (_, index) => ({
      id: `step-${index}`,
      source: `subject-${index}`,
      target: `subject-${(index + 1) % 8}`,
      label: { ...label, lines: ["Complete", "relationship", "caption"], width: 176, height: 80 },
    })),
  };
  const before = structuredClone(page);
  const entry = intrinsicPlacements(page, 1346, undefined, { width: 1240, height: 574 })[1];
  const geometry = await new ELK().layout(entry.graph);
  const upper = geometry.children.filter(({ y }) => y === geometry.children[0].y);
  const lower = geometry.children.filter(({ y }) => y > geometry.children[0].y);
  const lastInk = Math.max(
    ...upper.map(({ y }) => y + (entry.verticalEscape ?? entry.escape) + 80),
  );
  const firstInk = Math.min(...lower.map(({ y }) => y + (entry.verticalEscape ?? entry.escape)));
  assert(firstInk - lastInk >= 128, "The 80px caption and 24px reserves on both sides need 128px");
  assert(
    geometry.children.every(
      ({ width, height }) =>
        width - entry.escape * 2 === 224 &&
        height - (entry.verticalEscape ?? entry.escape) * 2 === 80,
    ),
  );
  assert.deepEqual(page, before);
});
