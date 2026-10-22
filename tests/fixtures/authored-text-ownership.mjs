import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadBundledFonts } from "../../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../../packages/publisher/renderers/resvg/measurement.mjs";

export const reference = JSON.stringify(["example", "entity", "client"]);

export const otherReference = JSON.stringify(["example", "entity", "server"]);

export function scene() {
  return {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Owned text",
    subtitle: "Source labels retain their declared component",
    viewport: { width: 900, height: 460 },
    nodes: [
      {
        id: "client",
        position: { x: 180, y: 180 },
        size: { width: 300, height: 100 },
        semanticIds: [reference],
        primitives: [
          {
            kind: "rect",
            box: { x: 0, y: 0, width: 300, height: 100 },
            fill: "paper",
            stroke: "ink",
            strokeWidth: 1.2,
          },
        ],
      },
    ],
    texts: [
      {
        id: "client-label",
        text: "Source client",
        owner: "client",
        fontSize: 14,
        weight: "400",
        anchor: "start",
        tone: "ink",
        x: 200,
        baseline: 226,
        visible: true,
        semanticIds: [reference],
        box: { x: 200, y: 212, width: 110, height: 14 },
      },
    ],
    edges: [],
    groups: [],
    requiredSemanticIds: [reference],
  };
}

export async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-owned-text-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const value = scene();
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts, value.texts);
  for (const label of value.texts) label.box = measurer.box(label);
  return { root, value };
}

export function staticScene(value) {
  return {
    schema: "architecture.authored-static-scene/v1",
    title: value.title,
    subtitle: value.subtitle,
    width: value.viewport.width,
    height: value.viewport.height,
    referenceWidth: value.viewport.width,
    spine: [],
    paint: { paper: "#f3f0e8", ink: "#26362f" },
    nodes: value.nodes.map(({ id, position, size, semanticIds, primitives }) => ({
      id,
      box: { ...position, ...size },
      semanticIds,
      primitives,
    })),
    texts: value.texts,
    edges: [],
    decorations: [],
    requiredSemanticIds: value.requiredSemanticIds,
  };
}

export function crossingPrimitive(value) {
  value.nodes[0].primitives.push({
    kind: "line",
    start: { x: 0, y: 40 },
    end: { x: 300, y: 40 },
    fill: null,
    stroke: "ink",
    strokeWidth: 1.2,
  });
}
