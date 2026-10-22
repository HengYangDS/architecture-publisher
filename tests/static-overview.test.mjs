import test from "node:test";
import assert from "node:assert/strict";
import { composeStaticOverview } from "../packages/publisher/renderers/svg/architecture.mjs";
import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/edition.mjs";
import * as groupedGeometry from "../packages/publisher/src/scene/static/architecture.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { figureIcons, fixture, unlabeledGraph } from "./fixtures/static-overview.mjs";

test("converging relations retain distinct target ports and unmasked labels", () => {
  const { document, edition, view } = fixture();
  const svg = composeStaticOverview(document, edition, view).bytes.toString();
  const ends = [...svg.matchAll(/data-edge-to="target" d="([^"]+)"/g)].map((match) =>
    match[1].split(" L ").at(-1),
  );
  assert.equal(ends.length, 3);
  assert.equal(new Set(ends).size, 3);
  assert.doesNotMatch(svg, /data-edge-label="[^"]+"><rect/);
});

test("adjacent cross-group relations do not join at one bend", () => {
  const graph = groupedGeometry.composeGroupedGeometry({
    nodes: ["operator", "control", "guard", "adapters", "projection", "client"].map((id) => ({
      id,
      label: id,
    })),
    groups: [
      { id: "intent", label: "Control intent", members: ["operator", "control", "guard"] },
      {
        id: "configuration",
        label: "Client configuration",
        members: ["adapters", "projection", "client"],
      },
    ],
    relations: [
      {
        id: "dispatch",
        from: "control",
        to: "adapters",
        text: "",
        fromSide: "bottom",
        toSide: "top",
        route: "orthogonal-v",
      },
      {
        id: "guard",
        from: "guard",
        to: "projection",
        text: "",
        fromSide: "bottom",
        toSide: "top",
        route: "orthogonal-v",
      },
    ],
  });
  const [intent, configuration] = graph.layout.groups;
  const dispatch = graph.routes.find(({ id }) => id === "dispatch").points;
  const guard = graph.routes.find(({ id }) => id === "guard").points;

  assert(dispatch[1][1] >= intent.y + intent.h + 8);
  assert(guard[1][1] <= configuration.y - 8);
  assert(guard[1][1] - dispatch[1][1] >= 20);
});

test("a single-node group does not inherit a three-node group frame", () => {
  const { layout } = unlabeledGraph();
  const groups = layout.groups;
  const target = groups.find(({ id }) => id === "output");
  const callers = groups.find(({ id }) => id === "inputs");
  const targetNode = layout.nodes.get("target");

  assert(target.w <= targetNode.w * 2 + 80);
  assert(target.w < callers.w);
});

test("an on-edge caption does not force a small group to inherit a wider group frame", () => {
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ["first", "second", "third", "target"].map((id) => ({ id, label: id })),
    groups: [
      { id: "sources", label: "Sources", members: ["first", "second", "third"] },
      { id: "consumer", label: "Consumer", members: ["target"] },
    ],
    relations: [
      {
        id: "delivery",
        from: "second",
        to: "target",
        text: "delivers to",
        fromSide: "bottom",
        toSide: "top",
        route: "orthogonal-v",
      },
    ],
  });
  const [sources, consumer] = layout.groups;
  const target = layout.nodes.get("target");
  assert(consumer.w < sources.w);
  assert(consumer.w <= target.w + 80);
  assert(routes[0].labelBox);
});

test("group spacing leaves a readable heading without doubling node height", () => {
  const { layout } = unlabeledGraph();
  const callers = layout.groups.find(({ id }) => id === "inputs");
  const node = layout.nodes.get("left");

  assert(callers.h <= node.h * 2);
  assert(node.y - callers.y >= 48);
  assert(callers.y + callers.h - node.y - node.h >= 20);
});

test("a dense corridor does not widen a later unrelated group gap", () => {
  const { layout } = groupedGeometry.composeGroupedGeometry({
    nodes: ["a", "b", "c", "target", "later"].map((id) => ({ id, label: id })),
    groups: [
      { id: "inputs", label: "Inputs", members: ["a", "b", "c"] },
      { id: "output", label: "Output", members: ["target"] },
      { id: "later", label: "Later", members: ["later"] },
    ],
    relations: ["a", "b", "c"].map((id) => ({
      id,
      from: id,
      to: "target",
      text: "",
      fromSide: "bottom",
      toSide: "top",
      route: "orthogonal-v",
    })),
  });
  const [inputs, output, later] = layout.groups;
  const denseGap = output.y - inputs.y - inputs.h;
  const quietGap = later.y - output.y - output.h;

  assert(denseGap > quietGap);
  assert(quietGap <= 62);
});

test("an on-graph label reserves only its own cross-group gap", () => {
  const { layout } = groupedGeometry.composeGroupedGeometry({
    nodes: ["source", "target", "later"].map((id) => ({ id, label: id })),
    groups: [
      { id: "source-group", label: "Source", members: ["source"] },
      { id: "target-group", label: "Target", members: ["target"] },
      { id: "later-group", label: "Later", members: ["later"] },
    ],
    relations: [
      {
        id: "supplies",
        from: "source",
        to: "target",
        text: "supplies",
        fromSide: "bottom",
        toSide: "top",
        route: "straight",
      },
    ],
  });
  const [source, target, later] = layout.groups;
  const labeledGap = target.y - source.y - source.h;
  const quietGap = later.y - target.y - target.h;

  assert(labeledGap > quietGap);
  assert(quietGap <= 62);
});

test("an unavoidable cross-group edge crossing fails instead of merging routes", () => {
  assert.throws(
    () =>
      groupedGeometry.composeGroupedGeometry({
        nodes: ["a", "b", "x", "y"].map((id) => ({ id, label: id })),
        groups: [
          { id: "upper", label: "Upper", members: ["a", "b"] },
          { id: "lower", label: "Lower", members: ["x", "y"] },
        ],
        relations: [
          {
            id: "a-to-y",
            from: "a",
            to: "y",
            text: "",
            fromSide: "bottom",
            toSide: "top",
            route: "orthogonal-v",
          },
          {
            id: "b-to-x",
            from: "b",
            to: "x",
            text: "",
            fromSide: "bottom",
            toSide: "top",
            route: "orthogonal-v",
          },
        ],
      }),
    { code: "semantic_publication_static_route_crossing" },
  );
});

test("fan-out corridor order follows target ports rather than relation IDs", () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ["source", "left", "middle", "right"].map((id) => ({ id, label: id })),
    groups: [
      { id: "source-group", label: "Source", members: ["source"] },
      { id: "targets", label: "Targets", members: ["left", "middle", "right"] },
    ],
    relations: [
      { id: "c", to: "left" },
      { id: "b", to: "middle" },
      { id: "a", to: "right" },
    ].map(({ id, to }) => ({
      id,
      from: "source",
      to,
      text: "",
      fromSide: "bottom",
      toSide: "top",
      route: "orthogonal-v",
    })),
  });
  const bends = Object.fromEntries(routes.map(({ id, points }) => [id, points]));

  assert(bends.c[1][1] < bends.a[1][1]);
  assert.equal(bends.b.length, 2);
});

test("rightward fan-out selects a corridor order without crossing the adjacent port", () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ["source", "left-a", "left-b", "near", "far"].map((id) => ({ id, label: id })),
    groups: [
      { id: "source-group", label: "Source", members: ["source"] },
      { id: "targets", label: "Targets", members: ["left-a", "left-b", "near", "far"] },
    ],
    relations: ["near", "far"].map((id) => ({
      id,
      from: "source",
      to: id,
      text: "realized by",
      fromSide: "bottom",
      toSide: "top",
      route: "orthogonal-v",
    })),
  });

  assert.equal(routes.length, 2);
  assert(routes.every(({ points }) => points.length === 4));
  assert(routes.every(({ labelBox }) => labelBox?.w > 0));
});

test("a singleton group admits its heading beside three incoming ports", () => {
  const ids = ["a", "b", "c", "target"];
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ids.map((id) => ({ id, label: id })),
    groups: [
      { id: "sources", label: "Sources", members: ids.slice(0, 3) },
      { id: "target", label: "Desired-state coordination", members: ["target"] },
    ],
    relations: ids.slice(0, 3).map((id) => ({
      id,
      from: id,
      to: "target",
      text: "",
      fromSide: "bottom",
      toSide: "top",
      route: "orthogonal-v",
    })),
  });
  const scene = staticEditionScene();
  const { namespace, sha256, origin } = scene.nodes[0];
  scene.nodes = [...layout.nodes].map(([id, box]) => ({
    namespace,
    id,
    sha256,
    origin,
    kind: "component",
    figureKind: "component",
    icon: "lucide:box",
    label: id,
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
  }));
  scene.groups = layout.groups.map(({ x, y, w, h, ...group }) => ({
    ...group,
    x,
    y,
    width: w,
    height: h,
  }));
  scene.edges = routes.map(({ id, from, to, points }) => ({
    from: { namespace, id: from },
    to: { namespace, id: to },
    relations: [
      {
        namespace,
        reference: `relation:${id}`,
        sha256,
        label: "calls",
        kind: null,
        direction: "forward",
        origin,
      },
    ],
    points,
  }));
  scene.sourceAssertionCarriers[0].nodeRefs = ids.map((id) => ({ namespace, id }));
  scene.sourceAssertionCarriers[0].relationRefs = routes.map(({ id }) => ({
    namespace,
    reference: `relation:${id}`,
    sha256,
  }));
  scene.bounds = {
    x: layout.groups[0].x,
    y: layout.groups[0].y,
    width: layout.groups[0].w,
    height: layout.groups[1].y + layout.groups[1].h - layout.groups[0].y,
  };

  assert.doesNotThrow(() => composeStaticEditionSvg(scene, { icons: figureIcons, fragment: true }));
});

test("an upward adjacent relation bends between groups rather than through a heading", () => {
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ["upper", "peer", "lower"].map((id) => ({ id, label: id })),
    groups: [
      { id: "first", label: "First", members: ["upper", "peer"] },
      { id: "second", label: "Second", members: ["lower"] },
    ],
    relations: [
      {
        id: "return",
        from: "lower",
        to: "upper",
        text: "",
        fromSide: "top",
        toSide: "bottom",
        route: "orthogonal-v",
      },
    ],
  });
  const [upper, lower] = layout.groups;
  const points = routes[0].points;

  assert(points[0][1] > points.at(-1)[1]);
  assert(points[1][1] >= upper.y + upper.h + 8);
  assert(points[1][1] <= lower.y - 8);
});
