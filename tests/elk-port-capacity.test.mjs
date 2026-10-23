import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { layoutInteractivePages } from "../packages/publisher/renderers/elk/layout.mjs";
import * as placement from "../packages/publisher/renderers/elk/placement.mjs";
import { preparePage } from "../packages/publisher/renderers/elk/input.mjs";
import { measurePages } from "./fixtures/elk-layout.mjs";
import { measureArchitectureTypography } from "../packages/publisher/renderers/archify/text.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import {
  architectureTextBudget,
  measureArchitectureNodeText,
} from "../packages/publisher/renderers/archify/node-text.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

const network = () => {
  const nodes = Array.from({ length: 12 }, (_, index) => ({
    id: `subject-${index}`,
    label: `Service ${index}`,
  }));
  const pairs = [];
  for (let index = 1; index < nodes.length; index++) {
    pairs.push([0, index], [index, 0]);
    if (index + 1 < nodes.length) pairs.push([index, index + 1]);
  }
  return {
    nodes,
    relations: pairs.map(([from, to], index) => ({
      id: `relation-${index}`,
      source: nodes[from].id,
      target: nodes[to].id,
      graphLabel: `relates ${index}`,
    })),
  };
};

test("native cyclic routing reserves corner clearance and complete independent terminals", async () => {
  const input = network();
  const original = structuredClone(input);
  const { layouts } = await layoutInteractivePages([input], await measurePages([input]), {
    readingWidth: 12000,
    minimumLabelSize: 12,
  });
  const graph = layouts[0];
  assert.deepEqual(input, original);
  assert.deepEqual(
    graph.nodes.map(({ id }) => id),
    input.nodes.map(({ id }) => id),
  );
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations.map(({ id, source, target }) => ({ id, source, target })),
  );
  const hub = graph.nodes.find(({ id }) => id === input.nodes[0].id);
  const contacts = graph.relations.flatMap(({ id, source, target, points }) =>
    source === hub.id
      ? [{ id, point: points[0] }]
      : target === hub.id
        ? [{ id, point: points.at(-1) }]
        : [],
  );
  assert.equal(new Set(contacts.map(({ point }) => JSON.stringify(point))).size, contacts.length);
  const corners = [
    [hub.x, hub.y],
    [hub.x + hub.width, hub.y],
    [hub.x, hub.y + hub.height],
    [hub.x + hub.width, hub.y + hub.height],
  ];
  for (const { id, point } of contacts)
    assert(
      Math.min(...corners.map(([x, y]) => Math.hypot(point.x - x, point.y - y))) >=
        marks.routeEndpointStub - 0.000001,
      `${id} crowds a node corner`,
    );
});

test("endpoint capacity is derived from degree and direction without mutating measured input", async () => {
  const input = network();
  const prepared = preparePage(input, await measurePages([input]));
  const original = structuredClone(prepared);
  for (const direction of ["RIGHT", "DOWN"]) {
    const selected = placement.allocateEndpointFootprints(prepared, direction);
    assert.deepEqual(prepared, original);
    const hub = selected.nodes[0];
    assert.equal(hub.ports.length, 22);
    const span = direction === "RIGHT" ? hub.height : hub.width;
    assert(span >= marks.routeEndpointStub * 2 + marks.routeInteriorSegment * 10);
    const byId = new Map(selected.nodes.map((node) => [node.id, node]));
    for (const relation of selected.relations) {
      for (const [field, owner] of [
        ["sourcePort", "source"],
        ["targetPort", "target"],
      ]) {
        const node = byId.get(relation[owner]);
        const port = node.ports.find(({ id }) => id === relation[field]);
        assert(port);
        assert.equal(port.width, 0);
        assert.equal(port.height, 0);
        if (direction === "RIGHT") assert(port.x === 0 || port.x === node.width);
        else assert(port.y === 0 || port.y === node.height);
      }
      assert.deepEqual(
        relation.label,
        prepared.relations.find(({ id }) => id === relation.id).label,
      );
    }
  }
});

test("explicit shared contacts and occupied identifiers remain exact", async () => {
  const input = network();
  const prepared = preparePage(input, await measurePages([input]));
  const port = { id: "relation-0:target", x: 0, y: 12, width: 0, height: 0 };
  prepared.nodes[0].ports = [port];
  prepared.relations[0].sourcePort = port.id;
  const original = structuredClone(prepared);
  const selected = placement.allocateEndpointFootprints(prepared, "RIGHT");
  assert.deepEqual(prepared, original);
  assert.deepEqual(selected.nodes[0], prepared.nodes[0]);
  assert.equal(selected.relations[0].sourcePort, port.id);
  const ids = selected.nodes.flatMap(({ ports }) => (ports ?? []).map(({ id }) => id));
  assert.equal(new Set(ids).size, ids.length);
  const isolated = { ...prepared, relations: [] };
  assert.deepEqual(placement.allocateEndpointFootprints(isolated, "RIGHT"), isolated);
});

test("focused source reading keeps the complete native graph without borrowing overview acceptance", async () => {
  const input = network();
  const measure = await measurePages([input]);
  const selection = { readingWidth: 1000, minimumLabelSize: 12 };
  await assert.rejects(layoutInteractivePages([input], measure, selection), {
    code: "render_interactive_layout_infeasible",
  });
  const { layouts } = await layoutInteractivePages([input], measure, {
    ...selection,
    readingContext: "source",
  });
  assert.equal(layouts[0].nodes.length, input.nodes.length);
  assert.equal(layouts[0].relations.length, input.relations.length);
  assert(layouts[0].bounds.width > selection.readingWidth);
  assert(layouts[0].nodes.every(({ label }) => label.fontSize >= selection.minimumLabelSize));
  await assert.rejects(
    layoutInteractivePages([input], measure, { ...selection, readingContext: "unbounded" }),
    { code: "render_interactive_layout_execution_limit_invalid" },
  );
});

test("measured source reading retains its native focus floor while overview projection stays strict", async () => {
  const scene = { viewport: { width: 4000, height: 2000 }, texts: [] };
  const measured = { layouts: { component: { valid: true } }, sizes: {} };
  const fonts = await loadBundledFonts();
  await assert.rejects(measureArchitectureTypography(scene, fonts, measured), {
    code: "render_native_rejected",
  });
  const result = await measureArchitectureTypography(scene, fonts, measured, "source");
  assert.equal(result.budget.minimum, 12);
  assert.equal(result.requestedMinimum, 12);
  assert.deepEqual(result.layouts, measured.layouts);
  await assert.rejects(
    measureArchitectureTypography(
      scene,
      fonts,
      { layouts: { component: { valid: false } } },
      "source",
    ),
    { code: "render_native_rejected" },
  );
});

test("measured overview text must keep its declared floor in the complete desktop aperture", async () => {
  const fonts = await loadBundledFonts();
  const input = {
    nodes: [{ id: "subject", label: "Selected source", detail: "Complete exact declaration" }],
    texts: [],
    typography: { minimumTextPx: 12 },
  };
  const measured = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
  );
  assert(measured.layouts.subject.valid);
  const original = structuredClone(measured);
  const fitted = await measureArchitectureTypography(
    { ...input, viewport: { width: 1240, height: 574 } },
    fonts,
    measured,
  );
  assert.equal(fitted.budget.minimum, 12);
  for (const viewport of [
    { width: 1240, height: 1148 },
    { width: 2480, height: 574 },
  ]) {
    const scene = { ...input, viewport };
    await assert.rejects(measureArchitectureTypography(scene, fonts, measured), {
      code: "render_native_rejected",
    });
    const source = await measureArchitectureTypography(scene, fonts, measured, "source");
    assert.equal(source.budget.minimum, 12);
    assert.equal(source.requestedMinimum, 12);
    assert.deepEqual(structuredClone(source.layouts), original.layouts);
  }
  assert.deepEqual(structuredClone(measured), original);
});
