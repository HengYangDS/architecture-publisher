import assert from "node:assert/strict";

export const emptyLabel = () => ({
  lines: [""],
  width: 0,
  height: 0,
  fontSize: 12,
  weight: "400",
  baselines: [],
});

export function graphFor(offset = 41, gap = 44) {
  const source = { id: "source", x: 200, y: 24, width: 224, height: 128, label: emptyLabel() };
  const target = {
    id: "target",
    x: source.x + offset,
    y: source.y + source.height + gap,
    width: 224,
    height: 96,
    label: emptyLabel(),
  };
  const start = { x: source.x + source.width / 2, y: source.y + source.height };
  const end = { x: target.x + target.width / 2, y: target.y };
  return {
    bounds: { width: 760, height: target.y + target.height + 40 },
    nodes: [source, target],
    groups: [],
    relations: [
      {
        id: "connection",
        source: source.id,
        target: target.id,
        direction: "forward",
        label: null,
        points: [
          start,
          { x: start.x, y: start.y + 24 },
          { x: end.x, y: start.y + 24 },
          { x: end.x, y: end.y - 24 },
          end,
        ],
      },
    ],
  };
}

export function groupTitleGraph() {
  const title = {
    x: 65,
    y: 40,
    width: 600,
    height: 140,
    lines: ["Wide title", "Second row", "Third row", "Fourth row", "Fifth row"],
    fontSize: 12,
    weight: "600",
    baselines: [
      { text: "Wide title", x: 365, baseline: 62, box: { x: 71, y: 50, width: 588, height: 14 } },
      ...["Second row", "Third row", "Fourth row", "Fifth row"].map((text, index) => ({
        text,
        x: 365,
        baseline: 88 + index * 26,
        box: { x: 305, y: 76 + index * 26, width: 120, height: 14 },
      })),
    ],
  };
  return {
    bounds: { width: 800, height: 480 },
    groups: [{ id: "group", x: 50, y: 30, width: 650, height: 390, label: title }],
    nodes: [
      { id: "source", x: 100, y: 240 },
      { id: "target", x: 230, y: 240 },
    ].map((node) => ({ ...node, width: 100, height: 80, groupId: "group", label: emptyLabel() })),
    relations: [
      {
        id: "connection",
        source: "source",
        target: "target",
        direction: "forward",
        points: [
          { x: 150, y: 240 },
          { x: 150, y: 190 },
          { x: 280, y: 190 },
          { x: 280, y: 240 },
        ],
        label: {
          x: 185,
          y: 149.25,
          width: 60,
          height: 32,
          lines: ["Connect"],
          fontSize: 12,
          weight: "400",
          baselines: [
            {
              text: "Connect",
              x: 215,
              baseline: 167.25,
              box: { x: 191, y: 155.25, width: 48, height: 14 },
            },
          ],
        },
      },
    ],
  };
}

export function incomingArrowGraph(gap = 7, variant = "default") {
  return {
    bounds: { width: 760, height: 460 },
    groups: [],
    nodes: [
      { id: "left", x: 150, y: 60 },
      { id: "right", x: 490, y: 60 },
      { id: "target", x: 350, y: 320 },
    ].map((node) => ({ ...node, width: 176, height: 80, label: emptyLabel() })),
    relations: [
      {
        id: "left-edge",
        source: "left",
        points: [
          { x: 326, y: 100 },
          { x: 420, y: 100 },
          { x: 420, y: 320 },
        ],
      },
      {
        id: "right-edge",
        source: "right",
        points: [
          { x: 490, y: 100 },
          { x: 420 + gap, y: 100 },
          { x: 420 + gap, y: 320 },
        ],
      },
    ].map((relation) => ({
      ...relation,
      target: "target",
      direction: "forward",
      label: null,
      variant,
    })),
  };
}

export async function routing() {
  const module =
    await import("../../packages/publisher/renderers/archify/intrinsic-routing.mjs").catch(
      () => null,
    );
  assert.equal(
    typeof module?.routeIntrinsicGeometry,
    "function",
    "the native adapter must resolve exact routes before the unchanged paint audit",
  );
  return module.routeIntrinsicGeometry;
}

export function facingGraph({ blockedTop = false, label = false } = {}) {
  const nodes = [
    { id: "source", x: 64, y: 120, width: 176, height: 80, label: emptyLabel() },
    { id: "target", x: 400, y: 120, width: 176, height: 80, label: emptyLabel() },
    ...(blockedTop
      ? [{ id: "roof", x: 64, y: 30, width: 512, height: 80, label: emptyLabel() }]
      : []),
  ];
  const ink = { x: 94, y: 98, width: 116, height: 14 };
  return {
    bounds: { width: 640, height: 300 },
    nodes,
    groups: [],
    relations: [
      {
        id: "edge",
        source: "source",
        target: "target",
        direction: "forward",
        points: [
          { x: 152, y: 120 },
          { x: 152, y: 96 },
          { x: 488, y: 96 },
          { x: 488, y: 120 },
        ],
        label: label
          ? {
              ...emptyLabel(),
              lines: ["Exact  relationship"],
              x: 88,
              y: 92,
              width: 128,
              height: 32,
              baselines: [{ text: "Exact  relationship", x: 94, baseline: 112, box: ink }],
              paintBox: ink,
            }
          : null,
      },
    ],
  };
}

export function occupiedCorridorGraph() {
  const node = (id, x, y) => ({ id, x, y, width: 224, height: 64, label: emptyLabel() });
  const relation = (id, source, target, points) => ({
    id,
    source,
    target,
    direction: "forward",
    label: null,
    points: points.map(([x, y]) => ({ x, y })),
  });
  return {
    bounds: { width: 1201, height: 1581 },
    groups: [],
    nodes: [
      node("target", 33, 365),
      node("branch", 921, 685),
      node("left", 33, 1005),
      node("middle", 329, 1005),
      node("right", 921, 365),
      node("lower", 625, 1165),
      node("source", 329, 1485),
      node("upper", 329, 205),
      node("obstacle", 33, 205),
    ],
    relations: [
      relation("outer", "middle", "upper", [
        [441, 1005],
        [441, 981],
        [1182.25, 981],
        [1182.25, 293],
        [441, 293],
        [441, 269],
      ]),
      relation("return", "left", "upper", [
        [138, 1005],
        [138, 925.25],
        [14.312, 925.25],
        [14.312, 328.194],
        [577, 328.194],
        [577, 251],
        [553, 251],
      ]),
      relation("right", "lower", "right", [
        [737, 1165],
        [737, 1141],
        [1169, 1141],
        [1169, 397],
        [1145, 397],
      ]),
      relation("branch", "target", "branch", [
        [152, 365],
        [152, 341],
        [1161.25, 341],
        [1161.25, 621.25],
        [897, 621.25],
        [897, 703],
        [921, 703],
      ]),
      relation("candidate", "source", "target", [
        [441, 1549],
        [441, 1573],
        [1170.618, 1573],
        [1170.618, 303.25],
        [145, 303.25],
        [145, 365],
      ]),
    ],
  };
}
