import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";

test("complete declared groups fit the desktop frame without upstream coordinates", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "grouped-delivery",
    title: "Local artifact delivery",
    subtitle: "From exact selection to guarded destinations",
    typography: { minimumTextPx: 12 },
    nodes: [
      ["contract", "Delivery contract", "contract"],
      ["one", "Output one", "client"],
      ["two", "Output two", "client"],
      ["request", "Request CLI", "interface"],
      ["three", "Output three", "client"],
      ["config", "Configuration", "authority"],
      ["access", "Access authority", "authority"],
      ["discovery", "Target discovery", "observer"],
      ["four", "Output four", "client"],
      ["registry", "Target registry", "registry"],
      ["planner", "Delivery planner", "coordinator"],
      ["transaction", "Guarded transaction", "boundary"],
    ].map(([id, label, figureKind]) => ({ id, label, figureKind, visualRole: "backend" })),
    groups: [
      ["selection", "Selection and observed state", ["request", "config", "discovery"]],
      ["coordination", "Planning and coordination", ["planner"]],
      ["admission", "Authority and target admission", ["access", "registry"]],
      ["delivery", "Contract and guarded delivery", ["contract", "transaction"]],
      ["destinations", "Selected output destinations", ["three", "one", "two", "four"]],
    ].map(([id, label, nodeIds]) => ({ id, label, nodeIds })),
    edges: [
      ["request", "planner", "delegates"],
      ["config", "planner", "configures"],
      ["contract", "one", "realized-by"],
      ["contract", "two", "realized-by"],
      ["contract", "three", "realized-by"],
      ["contract", "four", "realized-by"],
      ["contract", "transaction", "guards"],
      ["access", "contract", "supplies-authority"],
      ["discovery", "planner", "reports-to"],
      ["registry", "contract", "dispatches"],
      ["planner", "registry", "delegates"],
    ].map(([from, to, label], index) => ({
      id: `flow-${index}`,
      from,
      to,
      label,
      visualRole: "default",
    })),
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert(result.scene.viewport.width <= marks.desktopFrameWidth);
  assert(result.scene.viewport.height <= marks.desktopReadingHeight);
  assert.equal(new Set(result.scene.nodes.map(({ size }) => JSON.stringify(size))).size, 1);
  assert.deepEqual(
    result.scene.nodes.map((node) => {
      const meaning = { ...node };
      delete meaning.position;
      delete meaning.size;
      return meaning;
    }),
    before.nodes,
  );
  assert.deepEqual(
    result.scene.groups.map((group) => {
      const meaning = { ...group };
      delete meaning.padding;
      return meaning;
    }),
    before.groups,
  );
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    before.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  assert.equal(Object.keys(result.physical.edges).length, before.edges.length);
  assert.equal(result.physical.legend.entries.length, 8);
  for (const { id, label } of before.nodes) {
    const rows = result.nodeText.layouts[id].rows;
    assert.equal(
      rows
        .filter(({ field }) => field === "label")
        .map(({ text }) => text)
        .join(""),
      label,
    );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
  const allocated = new Map(result.physical.groups.map((group) => [group.id, group]));
  for (const group of before.groups) {
    const physical = allocated.get(group.id);
    assert.equal(physical.label.lines.join(""), group.label);
    assert(physical.label.fontSize >= 12);
    for (const id of group.nodeIds) {
      const { position, size } = result.scene.nodes.find((node) => node.id === id);
      assert(position.x >= physical.x + marks.textOwnerClearance);
      assert(position.y >= physical.y + marks.textOwnerClearance);
      assert(position.x + size.width <= physical.x + physical.width - marks.textOwnerClearance);
      assert(position.y + size.height <= physical.y + physical.height - marks.textOwnerClearance);
    }
  }
  assert.deepEqual(scene, before);
});
