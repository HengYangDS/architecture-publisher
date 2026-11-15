import assert from "node:assert/strict";
import test from "node:test";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { guideFigures } from "../src/pinned/invariants.mjs";
import { CITATIONS, DIAGRAM, READ, shopBuild } from "./fixtures/pinned.mjs";

const DOCUMENTS = [{ name: "parts.architecture.json", document: DIAGRAM }];

/** The shop's model and its evidence table, read at the pin or without a checkout. */
async function shop(locale = "en", { verified = true } = {}) {
  const { model, binding } = await shopBuild(locale, { verified });
  const evidence = evidenceTable({
    records: binding.records,
    citations: CITATIONS,
    read: verified ? READ : new Map(),
  });
  return { model, evidence };
}

test("a diagram's node that cites an owned file is matched to its owner, and a connection to the relations between", async () => {
  const { model, evidence } = await shop();
  const figures = guideFigures({
    documents: DOCUMENTS,
    evidence,
    relations: model.relations,
    pinned: true,
  });
  assert.deepEqual(figures, {
    state: "verified",
    nodes: [
      { file: "parts.architecture.json", id: "parts-sync", components: ["sync"] },
      { file: "parts.architecture.json", id: "parts-store", components: ["store"] },
    ],
    connections: [
      {
        file: "parts.architecture.json",
        id: "persists",
        from: "parts-sync",
        to: "parts-store",
        relations: ["sync-store"],
      },
    ],
    unmatched: {
      // One cites a file no component owns, the other cites none.
      nodes: [
        { file: "parts.architecture.json", id: "parts-readme" },
        { file: "parts.architecture.json", id: "parts-cloud" },
      ],
      connections: [
        {
          file: "parts.architecture.json",
          id: "explains",
          from: "parts-readme",
          to: "parts-store",
        },
        { file: "parts.architecture.json", id: "hosts", from: "parts-cloud", to: "parts-sync" },
      ],
    },
  });
});

test("a connection between matched nodes without a relation of the model is listed, and nothing is refused", async () => {
  const { model, evidence } = await shop();
  const relations = model.relations.filter(({ id }) => id !== "sync-store");
  const reversed = {
    lanes: [{ id: "lane", label: "A lane is no node" }],
    mainPath: ["a", null],
    nodes: [
      { id: "a", sources: [{ path: "src/sync/a.go" }, { path: "src/sync/b.go" }, { path: 7 }] },
      { id: "b", sources: [{ path: "src/store/store.go" }, { path: "src/sync/b.go" }] },
      { label: "A node without an id is not listed" },
      { id: "half", from: "a" },
    ],
    edges: [{ from: "b", to: "a" }],
    meta: { title: "No list" },
  };
  const figures = guideFigures({
    documents: [...DOCUMENTS, { name: "flow.workflow.json", document: reversed }],
    evidence,
    relations,
    pinned: true,
  });
  assert.deepEqual(figures.connections, []);
  assert.deepEqual(figures.unmatched.connections[0], {
    file: "parts.architecture.json",
    id: "persists",
    from: "parts-sync",
    to: "parts-store",
  });
  // A connection without an id is named by its ends; one drawn against a relation's direction matches it.
  assert.deepEqual(figures.unmatched.connections.at(-1), {
    file: "flow.workflow.json",
    from: "b",
    to: "a",
  });
  assert.deepEqual(figures.nodes.slice(2), [
    { file: "flow.workflow.json", id: "a", components: ["sync"] },
    { file: "flow.workflow.json", id: "b", components: ["store", "sync"] },
  ]);
  const matched = guideFigures({
    documents: [{ name: "flow.workflow.json", document: reversed }],
    evidence,
    relations: model.relations,
    pinned: true,
  });
  assert.deepEqual(matched.connections, [
    { file: "flow.workflow.json", from: "b", to: "a", relations: ["sync-store"] },
  ]);
  // An entry with one end alone joins nothing: it is a node, and here one without a match.
  assert.deepEqual(matched.unmatched, {
    nodes: [{ file: "flow.workflow.json", id: "half" }],
    connections: [],
  });
});

test("without a checkout no figure is matched, and the list says so", async () => {
  const { model, evidence } = await shop("en", { verified: false });
  const figures = guideFigures({
    documents: DOCUMENTS,
    evidence,
    relations: model.relations,
    pinned: false,
  });
  assert.equal(figures.state, "unverified");
  assert.deepEqual(figures.nodes, []);
  assert.deepEqual(figures.connections, []);
  assert.equal(figures.unmatched.nodes.length, 4);
  assert.equal(figures.unmatched.connections.length, 3);
});
