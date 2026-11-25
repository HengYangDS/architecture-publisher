import assert from "node:assert/strict";
import test from "node:test";
import { drawnEntries } from "../src/map/guide-figures.mjs";
import { workflowColumns } from "../src/map/guide-workflow.mjs";

// The queue item `page-figures`: a guide's workflow, which Archify draws only where every node names its column,
// takes the publisher's columns: the longest path along the edges, a hand-off between lanes in one column.

const node = (id, lane) => ({ id, lane, type: "backend", label: id });

test("a node's column is the longest path to it, a hand-off between lanes keeps its column, and a cycle is cut", () => {
  const nodes = [
    node("a", "one"),
    node("b", "one"),
    node("c", "two"),
    node("d", "two"),
    node("e", "one"),
  ];
  const edges = [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
    { from: "c", to: "d" },
    { from: "a", to: "e" },
    { from: "d", to: "a" },
  ];
  assert.deepEqual(Object.fromEntries(workflowColumns(nodes, edges)), {
    a: 0,
    b: 1,
    c: 1,
    d: 2,
    e: 2,
  });
});

test("two nodes of one lane in one column move the later right, and its successors after it", () => {
  const nodes = [node("a", "one"), node("b", "one"), node("c", "one")];
  const edges = [{ from: "b", to: "c" }];
  assert.deepEqual(Object.fromEntries(workflowColumns(nodes, edges)), { a: 0, b: 1, c: 2 });
});

const rollout = () => ({
  schema_version: 1,
  diagram_type: "workflow",
  meta: { title: "Rollout", output: "rollout.html", locale: "en" },
  lanes: [
    { id: "maintainer", label: "Maintainer" },
    { id: "member", label: "Member" },
  ],
  nodes: [
    {
      ...node("curate", "maintainer"),
      sources: [{ path: "src/main.mjs", line: 1, label: "Curate" }],
    },
    node("publish", "maintainer"),
    node("import", "member"),
    node("check", "member"),
  ],
  edges: [
    { from: "curate", to: "publish" },
    { from: "publish", to: "import" },
    { from: "import", to: "check" },
  ],
});

test("a guide's workflow whose nodes name no column takes the publisher's, its sources kept", async () => {
  const author = rollout();
  const [drawn] = await drawnEntries(
    [{ name: "rollout.workflow.json", bytes: Buffer.from(JSON.stringify(author)) }],
    "showcase",
  );
  const laidOut = JSON.parse(drawn.bytes.toString("utf8"));
  assert.deepEqual(
    laidOut.nodes.map(({ id, col }) => [id, col]),
    [
      ["curate", 0],
      ["publish", 1],
      ["import", 1],
      ["check", 2],
    ],
  );
  assert.deepEqual(laidOut.nodes[0].sources, author.nodes[0].sources);
});

test("a workflow that names a column or a phase is refused, and one that needs seven columns is refused", async () => {
  const placed = rollout();
  placed.nodes[0].col = 0;
  placed.phases = [{ id: "p", label: "Phase", fromCol: 0, toCol: 1 }];
  await assert.rejects(
    drawnEntries(
      [{ name: "rollout.workflow.json", bytes: Buffer.from(JSON.stringify(placed)) }],
      "showcase",
    ),
    (error) => {
      assert.equal(error.code, "page_diagram_publisher_field");
      assert.deepEqual(
        error.problems.map(({ path }) => path),
        ["rollout.workflow.json/phases", "rollout.workflow.json/nodes/0/col"],
      );
      return true;
    },
  );
  const long = rollout();
  long.nodes = Array.from({ length: 7 }, (_, index) => node(`s${index}`, "maintainer"));
  long.edges = long.nodes.slice(1).map((item, index) => ({ from: `s${index}`, to: item.id }));
  await assert.rejects(
    drawnEntries(
      [{ name: "long.workflow.json", bytes: Buffer.from(JSON.stringify(long)) }],
      "showcase",
    ),
    { code: "page_workflow_too_wide" },
  );
});

test("a workflow of six columns is laid out, and one with a repeated id is passed to Archify as written", async () => {
  // The review of the Change (2026-11-25): a repeated id held the columns' loop for ever.
  const six = rollout();
  six.nodes = Array.from({ length: 6 }, (_, index) => node(`s${index}`, "maintainer"));
  six.edges = six.nodes.slice(1).map((item, index) => ({ from: `s${index}`, to: item.id }));
  const [wide] = await drawnEntries(
    [{ name: "six.workflow.json", bytes: Buffer.from(JSON.stringify(six)) }],
    "showcase",
  );
  assert.deepEqual(
    JSON.parse(wide.bytes.toString("utf8")).nodes.map(({ col }) => col),
    [0, 1, 2, 3, 4, 5],
  );
  const repeated = rollout();
  repeated.nodes.push(node("curate", "member"));
  const authored = { name: "rollout.workflow.json", bytes: Buffer.from(JSON.stringify(repeated)) };
  const [kept] = await drawnEntries([authored], "showcase");
  assert.deepEqual(kept.bytes, authored.bytes);
});
