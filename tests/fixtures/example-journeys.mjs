import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sax from "../../packages/publisher/renderers/resvg/supply/sax/sax.cjs";
import { parse as parseFont } from "../../packages/publisher/renderers/resvg/supply/opentype/opentype.mjs";
import { auditScene } from "../../packages/publisher/src/scene/static/audit.mjs";

export const root = fileURLToPath(new URL("../..", import.meta.url));

export const publisher = path.join(root, "packages/publisher");

export const sha = (b) => createHash("sha256").update(b).digest("hex");

export const examples = [
  ["service-topology", "architecture"],
  ["job-lifecycle", "lifecycle"],
];

export async function checkGeometry(svg) {
  const fonts = new Map();
  for (const [weight, name] of [
    [400, "Regular"],
    [700, "Bold"],
  ]) {
    const b = await fs.readFile(
      path.join(
        root,
        "packages/publisher/renderers/fonts/supply",
        "JetBrainsMono-" + name + ".ttf",
      ),
    );
    fonts.set(weight, parseFont(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
  }
  const scene = { nodes: [], texts: [], edges: [], decorations: [], requiredSemanticIds: [] };
  const parser = sax.parser(true),
    stack = [];
  parser.onopentag = ({ name, attributes: a }) => {
    for (const key of ["transform", "display", "visibility", "opacity", "style"])
      assert(!Object.hasOwn(a, key), "Unexpected authored visibility or transform");
    const owner = a["data-node-id"] ?? stack.at(-1)?.owner;
    const entry = { name, a, owner, text: "" };
    stack.push(entry);
    if (name === "svg") {
      scene.width = Number(a.width);
      scene.height = Number(a.height);
      scene.referenceWidth = scene.width;
    }
    if (a["data-node-box"])
      scene.nodes.push({
        id: a["data-node-box"],
        strokeWidth: Number(a["stroke-width"]),
        box: Object.fromEntries(["x", "y", "width", "height"].map((k) => [k, Number(a[k])])),
      });
    if (a["data-edge-id"]) {
      // These examples deliberately use only explicit orthogonal M/H/V routes.
      assert.match(a.d, /^M \d+ \d+(?: [HV] \d+)+$/);
      const tokens = a.d.split(" "),
        points = [{ x: Number(tokens[1]), y: Number(tokens[2]) }];
      for (let i = 3; i < tokens.length; i += 2) {
        const p = { ...points.at(-1) };
        p[tokens[i] === "H" ? "x" : "y"] = Number(tokens[i + 1]);
        points.push(p);
      }
      scene.edges.push({
        id: a["data-edge-id"],
        source: a["data-from"],
        target: a["data-to"],
        points,
        strokeWidth: Number(a["stroke-width"]),
        arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 0.1 },
      });
    }
    if (name === "line")
      scene.decorations.push({
        id: "rule-" + scene.decorations.length,
        strokeWidth: Number(a["stroke-width"]),
        points: [
          { x: Number(a.x1), y: Number(a.y1) },
          { x: Number(a.x2), y: Number(a.y2) },
        ],
      });
  };
  parser.ontext = (text) => {
    for (const e of stack) e.text += text;
  };
  parser.onclosetag = () => {
    const e = stack.pop();
    if (e.name !== "text") return;
    assert.match(e.text, /^[\x20-\x7e]+$/);
    const font = fonts.get(Number(e.a["font-weight"])),
      size = Number(e.a["font-size"]);
    assert(font);
    const scale = size / font.unitsPerEm;
    let cursor = Number(e.a.x),
      x1 = Infinity,
      y1 = Infinity,
      x2 = -Infinity,
      y2 = -Infinity;
    for (const ch of e.text) {
      const g = font.charToGlyph(ch),
        b = g.getBoundingBox();
      assert.notEqual(g.index, 0, "Missing glyph");
      if (ch !== " ") {
        x1 = Math.min(x1, cursor + b.x1 * scale);
        x2 = Math.max(x2, cursor + b.x2 * scale);
        y1 = Math.min(y1, Number(e.a.y) - b.y2 * scale);
        y2 = Math.max(y2, Number(e.a.y) - b.y1 * scale);
      }
      cursor += g.advanceWidth * scale;
    }
    scene.texts.push({
      id: "text-" + scene.texts.length,
      text: e.text,
      owner: e.owner,
      visible: true,
      semanticIds: [],
      fontSize: size,
      box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
    });
  };
  parser.write(svg).close();
  // Unshaped ASCII glyph envelopes are an analytic check, not browser paint.
  const result = auditScene(scene, {
    widthGrowth: 0,
    heightGrowth: 0,
    minimumFont: 14,
    ownerClearance: 12,
    textClearance: 8,
    endpointTolerance: 0.01,
    minimumTerminal: 24,
  });
  assert.deepEqual(result.failures, []);
}

export function compareMeaning(diagram, svg) {
  const parser = sax.parser(true),
    stack = [],
    nodes = [],
    edges = [],
    texts = [];
  parser.onopentag = (tag) => {
    const owner = tag.attributes["data-node-id"] ?? stack.at(-1)?.owner;
    const entry = { name: tag.name, attrs: tag.attributes, owner, text: "" };
    stack.push(entry);
    if (tag.attributes["data-node-id"]) nodes.push(entry);
    if (tag.attributes["data-edge-id"]) edges.push(entry);
  };
  parser.ontext = (text) => {
    for (const entry of stack) entry.text += text;
  };
  parser.onclosetag = () => {
    const entry = stack.pop();
    if (entry.name === "text") texts.push(entry);
  };
  parser.write(svg).close();
  const sourceNodes = diagram.components ?? diagram.states;
  assert.deepEqual(
    nodes.map((n) => n.owner).sort(),
    sourceNodes.map((n) => n.id).sort(),
    "Every source node appears once",
  );
  for (const node of sourceNodes) {
    const visible = texts.filter((t) => t.owner === node.id).map((t) => t.text);
    assert(visible.includes(node.label), "Missing node label: " + node.id);
    if (node.sublabel)
      assert(visible.includes(node.sublabel), "Missing node condition: " + node.id);
  }
  const sourceEdges = [...(diagram.connections ?? diagram.transitions)];
  assert.deepEqual(
    edges.map((e) => e.attrs["data-edge-id"]).sort(),
    sourceEdges.map((e) => e.id).sort(),
    "Every selected directed relationship remains explicit",
  );
  for (const edge of sourceEdges) {
    const actual = edges.find((e) => e.attrs["data-edge-id"] === edge.id);
    assert.equal(actual.attrs["data-from"], edge.from);
    assert.equal(actual.attrs["data-to"], edge.to);
    assert.equal(actual.name, "path");
    assert.match(actual.attrs.d, /^M /);
    assert.match(actual.attrs["marker-end"], /^url\(#.+\)$/);
    if (edge.label)
      assert(
        texts.some((t) => t.text === edge.label),
        "Missing edge label",
      );
  }
  const copy = texts.map((t) => t.text);
  assert(copy.includes(diagram.meta.title));
  for (const card of diagram.cards ?? []) {
    assert(copy.includes(card.title));
    for (const item of card.items) assert(copy.includes(item), "Missing condition");
  }
  for (const view of diagram.meta.views ?? [])
    if (view.note) assert(copy.includes(view.note), "Missing view condition");
}

export function compareInteractiveMeaning(diagram, html) {
  const start = html.indexOf("<svg");
  const end = html.indexOf("</svg>", start);
  assert(start >= 0 && end > start, "Rendered SVG is required");
  const svg = html.slice(start, end + 6);
  const parser = sax.parser(true),
    stack = [],
    nodes = [],
    edges = [];
  parser.onopentag = ({ name, attributes: a }) => {
    const item = { name, a, text: "" };
    stack.push(item);
    if (a["data-node-id"]) nodes.push(item);
    if (name === "path" && a["data-edge-id"]) edges.push(item);
  };
  parser.ontext = (text) => {
    for (const item of stack) item.text += text;
  };
  parser.onclosetag = () => {
    stack.pop();
  };
  parser.write(svg).close();
  const selectedNodes = diagram.components ?? diagram.states;
  assert.deepEqual(
    nodes.map((n) => n.a["data-node-id"]).sort(),
    selectedNodes.map((n) => n.id).sort(),
  );
  for (const source of selectedNodes) {
    const actual = nodes.find((n) => n.a["data-node-id"] === source.id);
    assert(actual.text.includes(source.label), "Missing visible interactive node label");
    if (source.sublabel)
      assert(actual.text.includes(source.sublabel), "Missing visible interactive condition");
  }
  const selectedEdges = diagram.connections ?? diagram.transitions;
  assert.deepEqual(
    edges.map((e) => e.a["data-edge-id"]).sort(),
    selectedEdges.map((e) => e.id).sort(),
  );
  for (const source of selectedEdges) {
    const actual = edges.find((e) => e.a["data-edge-id"] === source.id);
    assert.equal(actual.a["data-edge-from"], source.from);
    assert.equal(actual.a["data-edge-to"], source.to);
    assert.match(actual.a.d, /^M /);
    assert.match(actual.a["marker-end"], /^url\(#.+\)$/);
  }
}

export function assertSemanticUpdate(name, original, updated) {
  assert.equal(updated.meta.title, original.meta.title, "Semantic update is not a title change");
  const nodes = (d) => (d.components ?? d.states).map((n) => n.id).sort();
  const edges = (d) => (d.connections ?? d.transitions).map((e) => [e.id, e.from, e.to]);
  assert.notDeepEqual(nodes(updated), nodes(original), "Node membership must change");
  assert.notDeepEqual(edges(updated), edges(original), "Directed relationships must change");
  assert.notDeepEqual(updated.cards, original.cards, "Visible semantic conditions must change");
  if (name === "service-topology") {
    assert(updated.components.some((n) => n.id === "audit"));
    assert(updated.connections.some((e) => e.from === "events" && e.to === "audit"));
  } else {
    assert(!updated.states.some((n) => n.id === "ready"));
    assert.equal(updated.states.find((n) => n.id === "accepted").sublabel, "Capacity reserved");
    assert(
      updated.transitions.some(
        (e) => e.id === "transient" && e.from === "result" && e.to === "wait",
      ),
    );
    assert.match(updated.meta.views[0].note, /attempts remain/);
  }
}
