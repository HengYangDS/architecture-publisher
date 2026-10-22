import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";
import { meaningFor, sceneFor } from "./fixtures/authored-routes.mjs";

test("automatic typography preserves the source font budget without declaring a stricter projected floor", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-floor-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "source",
    title: "Selected source",
    subtitle: "Native reader owns the undeclared projection floor",
    nodes: [
      {
        id: "source",
        label: "Source evidence",
        detail: "Exact selected bytes",
        visualRole: "external",
      },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(scene);
  const composed = await composeIntrinsicArchitecture(scene);
  assert.equal(Object.hasOwn(composed.scene, "typography"), false);
  assert(composed.nodeText.layouts.source.rows.every(({ fontSize }) => fontSize >= 12));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  const svg = html.match(/<svg\b[^>]*data-diagram-type="architecture"[^>]*>/u)?.[0];
  assert.match(svg, /data-reader-min-text="6"/u);
  assert.match(svg, /data-reader-primary-text="14.4"/u);
  assert.deepEqual(scene, before);
});

test("intrinsic grouping paints the exact measured frames and complete title rows", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-group-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "ownership",
    title: "Declared scope",
    subtitle: "Exact title allocation",
    nodes: [{ id: "source", label: "Source", visualRole: "backend" }],
    groups: [
      {
        id: "source-scope",
        label: "The complete declared source-owned scope remains explicit",
        nodeIds: ["source"],
      },
    ],
    edges: [],
  };
  const composed = await composeIntrinsicArchitecture(scene);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  const group = composed.physical.groups[0];
  const frame = html.match(/<rect\b[^>]*data-graph-role="structural-frame"[^>]*>/u)?.[0];
  assert(frame);
  for (const key of ["x", "y", "width", "height"])
    assert(frame.includes(`${key}="${group[key]}"`), `${key} must use the measured frame`);
  assert.equal(group.label.lines.join(""), scene.groups[0].label);
  for (const row of group.label.baselines)
    assert(html.includes(`<tspan x="${row.x}" y="${row.baseline}">${row.text}</tspan>`));
});

test("intrinsic primitive allocation encloses exact negative local paint extents", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-primitive-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "ownership",
    title: "Exact local artwork",
    subtitle: "Bounds precede layout",
    nodes: [
      {
        id: "source",
        semanticIds: [JSON.stringify(["example", "entity", "source"])],
        primitives: [
          {
            kind: "rect",
            box: { x: -24, y: -12, width: 40, height: 28 },
            fill: "paper",
            stroke: "ink",
            strokeWidth: 2,
          },
        ],
      },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(scene);
  const composed = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  const primitive = composed.scene.nodes[0].primitives[0];
  assert.deepEqual(primitive, {
    ...scene.nodes[0].primitives[0],
    box: { ...scene.nodes[0].primitives[0].box, x: 1, y: 1 },
  });
  const node = composed.scene.nodes[0];
  assert.equal(node.size.width, 42);
  assert.equal(node.size.height, 30);
  assert(node.paintBox.x >= 0 && node.paintBox.y >= 0);
  assert(node.paintBox.x + node.paintBox.width <= composed.scene.viewport.width);
  assert(node.paintBox.y + node.paintBox.height <= composed.scene.viewport.height);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert(
    html.includes(
      `<rect x="${node.position.x + primitive.box.x}" y="${node.position.y + primitive.box.y}" width="40" height="28"`,
    ),
  );
});

test("automatic shared traversals preserve local primitive artwork without a second routing authority", async () => {
  const scene = structuredClone(sceneFor(meaningFor("interactive"), "interactive"));
  delete scene.viewport;
  for (const node of scene.nodes) {
    delete node.position;
    delete node.size;
    delete node.paintBox;
  }
  for (const edge of scene.edges) {
    delete edge.points;
    delete edge.arrowGeometry;
  }
  for (const text of scene.texts) {
    delete text.x;
    delete text.baseline;
    delete text.box;
    delete text.fontSize;
  }
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(result.scene.routes, scene.routes);
  assert.deepEqual(
    result.scene.edges.map(({ id }) => id),
    scene.edges.map(({ id }) => id),
  );
  assert.equal(result.scene.nodes[1].adornment, true);
  assert.equal(
    result.scene.texts.map(({ text }) => text).join("|"),
    scene.texts.map(({ text }) => text).join("|"),
  );
  const byId = new Map(result.scene.edges.map((edge) => [edge.id, edge]));
  assert.deepEqual(byId.get("approach").points.at(-1), byId.get("bridge").points[0]);
  assert.deepEqual(byId.get("bridge").points.at(-1), byId.get("terminal").points[0]);
});

test("intrinsic junction contacts join only explicitly shared traversals", async () => {
  const scene = structuredClone(sceneFor(meaningFor("interactive"), "interactive"));
  delete scene.viewport;
  for (const node of scene.nodes) {
    delete node.position;
    delete node.size;
    delete node.paintBox;
  }
  for (const edge of scene.edges) {
    delete edge.points;
    delete edge.arrowGeometry;
  }
  for (const text of scene.texts) {
    delete text.x;
    delete text.baseline;
    delete text.box;
    delete text.fontSize;
  }
  scene.edges.push(...scene.edges.map((edge) => ({ ...edge, id: `${edge.id}-separate` })));
  scene.routes[1].traversals = scene.routes[1].traversals.map((traversal) => ({
    ...traversal,
    edge: `${traversal.edge}-separate`,
  }));
  const original = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, original);
  assert.deepEqual(result.scene.routes, original.routes);
  const edges = new Map(result.scene.edges.map((edge) => [edge.id, edge]));
  for (const suffix of ["", "-separate"]) {
    assert.deepEqual(
      edges.get(`approach${suffix}`).points.at(-1),
      edges.get(`bridge${suffix}`).points[0],
    );
    assert.deepEqual(
      edges.get(`bridge${suffix}`).points.at(-1),
      edges.get(`terminal${suffix}`).points[0],
    );
  }
  assert.notDeepEqual(edges.get("bridge").points[0], edges.get("bridge-separate").points[0]);
  assert.notDeepEqual(
    edges.get("bridge").points.at(-1),
    edges.get("bridge-separate").points.at(-1),
  );
});

test("ordinary architecture rendering derives node boxes and viewport with no geometry input", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Source ownership",
    subtitle: "Independent publication",
    nodes: [
      {
        id: "source",
        label: "Source  owner",
        detail: "Native facts and exact relationships",
        note: "No source mutation",
        visualRole: "external",
      },
      {
        id: "publisher",
        label: "Publisher",
        detail: "Complete intrinsic typesetting",
        visualRole: "backend",
      },
      {
        id: "reader",
        label: "Reader",
        detail: "A complete architecture diagram",
        visualRole: "frontend",
      },
    ],
    groups: [],
    edges: [
      { id: "publish", from: "source", to: "publisher", label: "supplies", visualRole: "default" },
      { id: "read", from: "publisher", to: "reader", label: "publishes", visualRole: "default" },
    ],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  assert.deepEqual(scene, before);
  const html = await fs.readFile(output, "utf8");
  for (const node of scene.nodes) {
    assert(html.includes(`data-node-label="${node.label}"`));
    assert(html.includes(`data-node-sublabel="${node.detail}"`));
  }
  assert(html.includes('data-reader-fit="intrinsic-height"'));
  assert(html.includes("No source mutation"));
});
