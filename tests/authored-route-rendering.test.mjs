import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sax from "../packages/publisher/renderers/resvg/supply/sax/sax.cjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";

test("automatic composition retains editorial segments, exact allocated text and occurrence identity", async () => {
  const reference = JSON.stringify(["example", "editorial", "reconsider"]);
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "continuity",
    title: "Fresh evaluation",
    subtitle: "Geometry is internal",
    nodes: [
      { id: "plan", label: "Plan", visualRole: "backend" },
      { id: "admit", label: "Admission", visualRole: "backend" },
      { id: "plan-again", label: "Plan", visualRole: "backend" },
    ],
    groups: [],
    edges: [
      {
        id: "reconsider",
        from: "plan",
        to: "admit",
        adornment: true,
        semanticIds: [],
        strokeWidth: 1.6,
        strokeTone: "muted",
        arrow: true,
      },
    ],
    routes: [
      {
        id: "fresh",
        reference,
        source: "plan",
        target: "admit",
        traversals: [{ edge: "reconsider", direction: "forward" }],
      },
    ],
    texts: [
      {
        id: "reconsider-label",
        text: "new  Plan",
        owner: "reconsider",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(result.scene.routes, scene.routes);
  assert.deepEqual(
    result.scene.nodes.map(({ id }) => id),
    scene.nodes.map(({ id }) => id),
  );
  assert.equal(result.scene.texts[0].text, "new  Plan");
  assert.equal(result.scene.texts[0].owner, "reconsider");
  assert.equal(result.scene.edges[0].adornment, true);
  assert(result.scene.edges[0].points.length >= 2);
  assert.deepEqual(result.scene.nodes[0].size, result.scene.nodes[1].size);
});

test("automatic relationship arrows resolve the original native marker definition", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-arrow-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({
    scene: {
      schema: "architecture.interactive-scene/v1",
      id: "native-arrows",
      title: "Directed architecture",
      subtitle: "Original marker identity",
      nodes: [
        { id: "source", label: "Source", visualRole: "backend" },
        { id: "target", label: "Target", visualRole: "backend" },
      ],
      groups: [],
      edges: [
        { id: "deliver", from: "source", to: "target", label: "Deliver", visualRole: "default" },
      ],
    },
    output,
  });
  const html = await fs.readFile(output, "utf8");
  const paths = [...html.matchAll(/<path\b[^>]*data-composition-edge-from="source"[^>]*>/gu)];
  assert.equal(paths.length, 1);
  const target = /marker-end="url\(#([^)]*)\)"/u.exec(paths[0][0])?.[1];
  assert.ok(target, "the physical relationship retains its arrow");
  const definitions = new Set(
    [...html.matchAll(/<marker id="([^"]+)"/gu)].map((match) => match[1]),
  );
  assert(definitions.has(target), "the arrow must resolve an actual original marker definition");
});

test("intrinsic rendering paints the exact allocated label rows and ELK contacts", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-paint-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "continuity",
    title: "Fresh evaluation",
    subtitle: "Geometry is internal",
    nodes: [
      { id: "source", label: "Source", visualRole: "backend" },
      { id: "target", label: "Target", visualRole: "backend" },
    ],
    groups: [],
    edges: [
      {
        id: "evaluate",
        from: "source",
        to: "target",
        label: "Select a qualified successor without rewriting source meaning",
        visualRole: "default",
      },
    ],
  };
  const composed = await composeIntrinsicArchitecture(scene);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  const d = composed.physical.edges.evaluate.points
    .map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`)
    .join(" ");
  assert(html.includes(`d="${d}"`));
  assert(html.includes('data-composition-crossover="halo"'));
  assert.equal(composed.scene.edges[0].waypoints, undefined);
  assert.equal((html.match(/data-intrinsic-relation-label="evaluate"/gu) ?? []).length, 1);
  const label = composed.physical.edges.evaluate.label;
  assert(label.baselines.length > 1);
  const paintedLabel =
    /<g\b[^>]*data-intrinsic-relation-label="evaluate"[^>]*>([\s\S]*?)<\/g>/u.exec(html)?.[1];
  assert(paintedLabel);
  assert.equal(
    (paintedLabel.match(/data-intrinsic-label-ink=""/gu) ?? []).length,
    label.baselines.length,
  );
  for (const { box } of label.baselines)
    assert(
      paintedLabel.includes(
        `x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"`,
      ),
    );
  for (const line of label.baselines)
    assert(paintedLabel.includes(`<tspan x="${line.x}" y="${line.baseline}">${line.text}</tspan>`));
});

test("intrinsic rendering retains an independent exact text occurrence allocated to a segment", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-text-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "continuity",
    title: "Fresh evaluation",
    subtitle: "Geometry is internal",
    nodes: [
      { id: "source", label: "Source", visualRole: "backend" },
      { id: "target", label: "Target", visualRole: "backend" },
    ],
    groups: [],
    edges: [
      {
        id: "evaluate",
        from: "source",
        to: "target",
        adornment: true,
        semanticIds: [],
        strokeWidth: 1.6,
        strokeTone: "muted",
        arrow: true,
      },
    ],
    routes: [
      {
        id: "fresh",
        reference: JSON.stringify(["example", "editorial", "fresh"]),
        source: "source",
        target: "target",
        traversals: [{ edge: "evaluate", direction: "forward" }],
      },
    ],
    texts: [
      {
        id: "evaluate-label",
        text: "Select a qualified successor without rewriting source meaning",
        owner: "evaluate",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert(html.includes('data-graphic-id="text:evaluate-label"'));
  assert.equal((html.match(/data-intrinsic-text="evaluate-label"/gu) ?? []).length, 1);
  assert(!html.includes("Select a qualified successor without rewriting source meaning</text>"));
  assert(html.includes('data-literal-segment-id="evaluate"'));
  const literal = html.match(/<path\b[^>]*data-literal-segment-id="evaluate"[^>]*>/u)?.[0];
  assert.ok(literal);
  assert(
    literal.includes('data-composition-crossover="halo"'),
    "internally derived editorial geometry needs actual crossover paint, not an authored-path label",
  );
  const halo = html.match(/<path\b[^>]*data-intrinsic-segment-underlay="evaluate"[^>]*>/u)?.[0];
  assert.ok(halo);
  assert.equal(halo.match(/\bd="([^"]*)"/u)?.[1], literal.match(/\bd="([^"]*)"/u)?.[1]);
  assert.equal(Number(halo.match(/stroke-width="([^"]*)"/u)?.[1]), scene.edges[0].strokeWidth + 4);
});

test("intrinsic composition preserves several exact text occurrences owned by one segment", async () => {
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "continuity",
    title: "Fresh evaluation",
    subtitle: "One owner, distinct occurrences",
    nodes: [
      { id: "source", label: "Source", visualRole: "backend" },
      { id: "target", label: "Target", visualRole: "backend" },
    ],
    groups: [],
    edges: [
      {
        id: "evaluate",
        from: "source",
        to: "target",
        adornment: true,
        semanticIds: [],
        strokeWidth: 1.6,
        strokeTone: "muted",
        arrow: true,
      },
    ],
    texts: ["First  selected statement", "Second independent statement"].map((text, index) => ({
      id: `statement-${index}`,
      text,
      owner: "evaluate",
      weight: "400",
      anchor: "middle",
      tone: "muted",
      visible: true,
      semanticIds: [],
    })),
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  for (const text of scene.texts) {
    assert.equal(result.physical.texts[text.id].lines.join(""), text.text);
    assert.equal(result.scene.texts.find(({ id }) => id === text.id).owner, text.owner);
  }
  const first = result.physical.texts["statement-0"].paintBox;
  const second = result.physical.texts["statement-1"].paintBox;
  assert(first.y + first.height + 5 <= second.y);
});

test("intrinsic composition allocates exact statements inside their declared node", async (t) => {
  const reference = JSON.stringify(["example", "entity", "source"]);
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "ownership",
    title: "Source ownership",
    subtitle: "Allocation belongs inside Publisher",
    nodes: [{ id: "source", label: "Source", visualRole: "backend", semanticIds: [reference] }],
    groups: [],
    edges: [],
    texts: [
      {
        id: "statement",
        text: "The complete selected meaning remains source-owned.",
        owner: "source",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [reference],
      },
    ],
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.equal(result.physical.texts.statement.lines.join(""), scene.texts[0].text);
  const node = result.scene.nodes[0];
  const box = result.physical.texts.statement.paintBox;
  assert(box.x >= node.position.x + 8);
  assert(box.y >= node.position.y + 8);
  assert(box.x + box.width <= node.position.x + node.size.width - 8);
  assert(box.y + box.height <= node.position.y + node.size.height - 8);
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-owned-text-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.equal((html.match(/data-intrinsic-text="statement"/gu) ?? []).length, 1);
  const statement = /<text\b[^>]*data-intrinsic-text="statement"[^>]*>[\s\S]*?<\/text>/u.exec(
    html,
  )?.[0];
  assert.ok(statement, "the allocated statement has an actual SVG text carrier");
  let painted = "";
  const parser = sax.parser(true);
  parser.ontext = (value) => {
    painted += value;
  };
  parser.write(statement).close();
  assert.equal(painted, scene.texts[0].text);
});

test("intrinsic rendering retains native relationship text alongside separately owned statements", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-label-occurrences-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "ownership",
    title: "Independent occurrences",
    subtitle: "Meaning is not merged by allocation",
    nodes: [
      { id: "source", label: "Source", visualRole: "backend" },
      { id: "target", label: "Target", visualRole: "backend" },
    ],
    groups: [],
    edges: [
      {
        id: "evaluate",
        from: "source",
        to: "target",
        label: "Native relationship",
        visualRole: "default",
      },
    ],
    texts: ["First  exact statement", "Second independent occurrence"].map((text, index) => ({
      id: `statement-${index}`,
      text,
      owner: "evaluate",
      weight: "400",
      anchor: "middle",
      tone: "muted",
      visible: true,
      semanticIds: [],
    })),
  };
  const before = structuredClone(scene);
  const composed = await composeIntrinsicArchitecture(scene);
  assert.equal(composed.physical.edges.evaluate.label.lines.join(""), scene.edges[0].label);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  assert.deepEqual(scene, before);
  const html = await fs.readFile(output, "utf8");
  assert.equal((html.match(/data-intrinsic-relation-label="evaluate"/gu) ?? []).length, 1);
  for (const text of scene.texts) {
    assert.equal(
      (html.match(new RegExp(`data-intrinsic-text="${text.id}"`, "gu")) ?? []).length,
      1,
    );
    assert.equal(composed.physical.texts[text.id].lines.join(""), text.text);
  }
});
