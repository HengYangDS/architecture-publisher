import test from "node:test";
import assert from "node:assert/strict";
import { composeStaticOverview } from "../packages/publisher/renderers/svg/architecture.mjs";
import * as groupedGeometry from "../packages/publisher/src/scene/static/architecture.mjs";
import { composeStaticArchitectureScene, fixture } from "./fixtures/static-overview.mjs";

test("opposing straight relations retain separate source and target ports", () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ["left", "right"].map((id) => ({ id, label: id })),
    groups: [{ id: "peers", label: "Peers", members: ["left", "right"] }],
    relations: [
      {
        id: "forward",
        from: "left",
        to: "right",
        text: "",
        fromSide: "right",
        toSide: "left",
        route: "straight",
      },
      {
        id: "backward",
        from: "right",
        to: "left",
        text: "",
        fromSide: "left",
        toSide: "right",
        route: "straight",
      },
    ],
  });

  assert.notDeepEqual(routes[0].points, routes[1].points);
  assert(Math.abs(routes[0].points[0][1] - routes[1].points[0][1]) >= 20);
});

test("a relation through an unrelated node is rejected before publication", () => {
  const { document, edition } = fixture();
  document.relations = { skip: { subject: "left", object: "right", type: "calls" } };
  const view = {
    label: "Invalid skipped neighbor",
    groups: [{ id: "row", label: "Peers", entities: ["left", "center", "right"] }],
    relations: [{ id: "skip", fromSide: "right", toSide: "left", route: "straight" }],
  };
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: "semantic_publication_static_route_infeasible",
  });
});

test("SVG renderer owns its supported visual-role vocabulary", () => {
  const { document, edition, view } = fixture();
  edition.visualGrammar.entityTypes.component = "brand-primary";
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: "render_scene_visual_role_unsupported",
  });

  edition.visualGrammar.entityTypes.component = "backend";
  edition.visualGrammar.relationTypes.calls.variant = "ambient";
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: "render_scene_edge_role_unsupported",
  });
});

test("one neutral grouped geometry owner preserves the legacy route result", () => {
  assert.equal(typeof groupedGeometry.composeGroupedGeometry, "function");
  const { document, edition, view } = fixture();
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: Object.entries(document.entities).map(([id, entity]) => ({
      id,
      label: entity.label,
    })),
    groups: view.groups.map(({ id, label, entities }) => ({ id, label, members: entities })),
    relations: view.relations.map((authored) => {
      const relation = document.relations[authored.id];
      return {
        ...authored,
        from: relation.subject,
        to: relation.object,
        text: edition.visualGrammar.relationTypes[relation.type].label,
      };
    }),
  });
  const incumbent = composeStaticArchitectureScene(document, edition, view);
  assert.equal(selected.layout.width, incumbent.layout.width);
  assert.equal(selected.layout.height, incumbent.layout.height);
  assert.deepEqual([...selected.layout.nodes], [...incumbent.layout.nodes]);
  assert.deepEqual(
    selected.routes.map(({ id, points, label }) => ({ id, points, label })),
    incumbent.routes.map(({ authored, points, label }) => ({
      id: authored.id,
      points,
      label,
    })),
  );
});

test("the legacy scene still rejects an empty relation label", () => {
  const { document, edition, view } = fixture();
  edition.visualGrammar.relationTypes.calls.label = "";
  assert.throws(() => composeStaticArchitectureScene(document, edition, view), {
    code: "grouped_geometry_input_invalid",
  });
});

test("neutral groups bind source-qualified node identities exactly once", () => {
  const left = JSON.stringify(["source-a", "shared"]);
  const right = JSON.stringify(["source-b", "shared"]);
  const graph = {
    nodes: [
      { id: left, label: "First" },
      { id: right, label: "Second" },
    ],
    groups: [
      { id: "first", label: "First source", members: [left] },
      { id: "second", label: "Second source", members: [right] },
    ],
    relations: [
      {
        id: "edge",
        from: left,
        to: right,
        text: "calls",
        fromSide: "bottom",
        toSide: "top",
        route: "orthogonal-v",
      },
    ],
  };
  const selected = groupedGeometry.composeGroupedGeometry(graph);
  assert.equal(selected.layout.nodes.size, 2);
  assert.equal(selected.routes.length, 1);
  assert.throws(
    () =>
      groupedGeometry.composeGroupedGeometry({
        ...graph,
        groups: [{ ...graph.groups[0], members: [left, right] }, graph.groups[1]],
      }),
    { code: "grouped_geometry_input_invalid" },
  );
  assert.throws(
    () => groupedGeometry.composeGroupedGeometry({ ...graph, groups: [graph.groups[0]] }),
    { code: "grouped_geometry_input_invalid" },
  );
});

test("the neutral owner does not narrow admitted v1 group counts", () => {
  const groups = Array.from({ length: 17 }, (_, index) => ({
    id: `group-${index}`,
    label: `Group ${index}`,
    members: Array.from({ length: 8 }, (_, member) => `node-${index}-${member}`),
  }));
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: groups.flatMap(({ members }) => members.map((id) => ({ id, label: id }))),
    groups,
    relations: [],
  });
  assert.equal(selected.layout.nodes.size, 136);
  assert.equal(selected.layout.groups.length, 17);
});

test("measured node and edge captions fit a three-member group without excess horizontal padding", () => {
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: [
      { id: "artifact", label: "Signed local artifact" },
      { id: "peer", label: "External forge peer" },
      { id: "installed", label: "Installed product copy" },
    ],
    groups: [
      {
        id: "distribution",
        label: "Distribution",
        members: ["artifact", "peer", "installed"],
      },
    ],
    relations: [
      {
        id: "published",
        from: "artifact",
        to: "peer",
        text: "publishes asset to",
        fromSide: "right",
        toSide: "left",
        route: "straight",
      },
      {
        id: "installed",
        from: "peer",
        to: "installed",
        text: "installs as",
        fromSide: "right",
        toSide: "left",
        route: "straight",
      },
    ],
  });
  assert(selected.layout.width <= 1300);
  assert(selected.routes.every(({ label, labelBox }) => label && labelBox));
});
