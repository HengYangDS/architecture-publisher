import assert from "node:assert/strict";
import test from "node:test";
import { asAuthored, drawnEntries, publishersPaths } from "../src/map/guide-figures.mjs";
import { PARTS } from "./fixtures/guide-work.mjs";

// The queue item `page-figures`: the page's diagrams are laid out by the publisher. A guide's architecture file is
// laid out as the generated page's diagrams are: Archify's own layout, repaired and pinned, chosen by what a reader
// misreads. Its sources stay, and it takes the model's repository; a file that states a place, a size, the course of
// a line or a repository is refused.

const entry = (name, value) => ({
  name,
  bytes: Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`),
});

const REPOSITORY = Object.freeze({
  url: "https://github.com/example/shop.git",
  revision: "a".repeat(40),
});

/** The fixture's parts, with a source on a card and on the connection. */
const cited = () => {
  const document = JSON.parse(PARTS);
  document.components[0].sources = [{ path: "src/main.mjs", line: 1, label: "Front end" }];
  document.connections[0].sources = [{ path: "src/main.mjs", line: 1, label: "Calls" }];
  return document;
};

test("a guide's architecture file is laid out by the publisher, its sources kept and the model's repository filled", async () => {
  const draft = entry("guide.archify.md", "# A guide {#g}\n");
  const notes = entry("notes.txt", "Not a diagram.\n");
  const author = cited();
  const [drawnDraft, drawn, drawnNotes] = await drawnEntries(
    [draft, entry("parts.architecture.json", author), notes],
    "showcase",
    { ...REPOSITORY, name: "shop" },
  );
  assert.deepEqual(drawnDraft.bytes, draft.bytes);
  assert.deepEqual(drawnNotes.bytes, notes.bytes);
  const laidOut = JSON.parse(drawn.bytes.toString("utf8"));
  assert.deepEqual(laidOut.layout, { mode: "auto" });
  assert.deepEqual(laidOut.components, author.components, "the parts as the author stated them");
  assert.deepEqual(laidOut.meta, { ...author.meta, repository: REPOSITORY });
  assert.deepEqual(
    laidOut.connections.map(({ id, from, to, label, sources }) => ({
      id,
      from,
      to,
      label,
      sources,
    })),
    author.connections,
  );
});

test("a file that states where its parts sit, a line's course or a repository is refused, each field a problem", async () => {
  const placed = cited();
  Object.assign(placed.components[0], { pos: [40, 40], size: [180, 68] });
  placed.connections[0].fromSide = "right";
  placed.meta.repository = REPOSITORY;
  placed.layout = { mode: "auto" };
  await assert.rejects(
    drawnEntries([entry("parts.architecture.json", placed)], "showcase", REPOSITORY),
    (error) => {
      assert.equal(error.code, "page_diagram_publisher_field");
      assert.match(error.message, /state 5 fields/u);
      assert.deepEqual(
        error.problems.map(({ path }) => path),
        [
          "parts.architecture.json/layout",
          "parts.architecture.json/meta/repository",
          "parts.architecture.json/components/0/pos",
          "parts.architecture.json/components/0/size",
          "parts.architecture.json/connections/0/fromSide",
        ],
      );
      return true;
    },
  );
  assert.deepEqual(asAuthored("architecture", placed), cited(), "what the author may state");
});

test("a file is chosen at the build's quality, one without connections takes Archify's layout, and one Archify judges is kept", async () => {
  // A file need not name its quality profile; the build's is the one the chooser measures at (the review of the
  // Change, 2026-11-25, found a file without it refused).
  const author = cited();
  delete author.meta.quality_profile;
  const [drawn] = await drawnEntries([entry("parts.architecture.json", author)], "standard");
  assert.deepEqual(JSON.parse(drawn.bytes.toString("utf8")).meta, author.meta);
  const alone = cited();
  delete alone.connections;
  const [single] = await drawnEntries([entry("alone.architecture.json", alone)], "showcase");
  assert.deepEqual(JSON.parse(single.bytes.toString("utf8")), {
    ...alone,
    layout: { mode: "auto" },
  });
  for (const odd of [
    entry("odd.architecture.json", { ...cited(), components: "none" }),
    entry("odd.architecture.json", { ...cited(), components: [null, 1] }),
    entry("odd.architecture.json", { ...cited(), meta: "text" }),
    entry("odd.architecture.json", { ...cited(), diagram_type: "erd" }),
    entry("odd.constructor.json", { x: 1 }),
  ]) {
    // The review of the Change (2026-11-25): a list of non-objects threw inside the chooser, a text `meta` was
    // spread into an object, and a name alone decided the kind.
    const [kept] = await drawnEntries([odd], "showcase", REPOSITORY);
    assert.deepEqual(kept.bytes, odd.bytes, "a file Archify judges reaches it as written");
  }
});

test("a file of another kind takes the repository with the draft's Forge and link mode, and is refused where it sets a gap", async () => {
  const tree = {
    schema_version: 1,
    diagram_type: "tree",
    meta: { title: "Files", output: "files.html", locale: "en" },
    layout: { direction: "right" },
    nodes: [{ id: "root", label: "Root" }],
  };
  const authored = entry("files.tree.json", tree);
  const declared = { ...REPOSITORY, provider: "gitlab", link_mode: "local-only" };
  const [filled] = await drawnEntries([authored], "showcase", declared);
  assert.deepEqual(JSON.parse(filled.bytes.toString("utf8")), {
    ...tree,
    meta: { ...tree.meta, repository: declared },
  });
  const [kept] = await drawnEntries([authored], "showcase");
  assert.deepEqual(kept.bytes, authored.bytes, "without a repository the file is as written");
  const spaced = entry("files.tree.json", { ...tree, layout: { direction: "right", gapX: 40 } });
  await assert.rejects(drawnEntries([spaced], "showcase"), (error) => {
    assert.equal(error.code, "page_diagram_publisher_field");
    assert.deepEqual(
      error.problems.map(({ path }) => path),
      ["files.tree.json/layout/gapX"],
    );
    return true;
  });
});

test("every field the table names is refused, of every file of the guide at once, and the authored form states none", async () => {
  // The review of the Change (2026-11-25): only the first file was named, and most fields had no test.
  const route = { fromSide: "right", channelX: 4, bias: 1 };
  const files = {
    "a.architecture.json": {
      diagram_type: "architecture",
      meta: { viewBox: [0, 0, 1, 1] },
      boundaries: [{ pad: 8 }],
      components: [{ id: "x", row: 0 }],
      connections: [{ id: "c", via: [] }],
    },
    "b.erd.json": {
      diagram_type: "erd",
      entities: [{ width: 200 }],
      relationships: [{ labelAt: 0.5 }],
    },
    "c.workflow.json": {
      diagram_type: "workflow",
      groups: [],
      nodes: [{ id: "n", lane: "l", yOffset: 2 }],
      edges: [{ from: "n", to: "n", ...route }],
    },
    "d.timeline.json": { diagram_type: "timeline", layout: { width: 900, breaks: "auto" } },
    "e.waterfall.json": { diagram_type: "waterfall", layout: { width: 900 } },
    "f.dataflow.json": {
      diagram_type: "dataflow",
      nodes: [{ id: "n", stage: 0, row: 0, yOffset: 2 }],
      flows: [{ from: "n", to: "n", channelY: 3 }],
    },
    "g.sequence.json": {
      diagram_type: "sequence",
      meta: { column_fit: "spread" },
      messages: [{ from: "a", to: "b", y: 40 }],
    },
  };
  const expected = [
    "a.architecture.json/meta/viewBox",
    "a.architecture.json/components/0/row",
    "a.architecture.json/boundaries/0/pad",
    "a.architecture.json/connections/0/via",
    "b.erd.json/entities/0/width",
    "b.erd.json/relationships/0/labelAt",
    "c.workflow.json/groups",
    "c.workflow.json/nodes/0/yOffset",
    "c.workflow.json/edges/0/fromSide",
    "c.workflow.json/edges/0/channelX",
    "c.workflow.json/edges/0/bias",
    "d.timeline.json/layout/width",
    "e.waterfall.json/layout/width",
    "f.dataflow.json/nodes/0/yOffset",
    "f.dataflow.json/flows/0/channelY",
    "g.sequence.json/meta/column_fit",
  ];
  await assert.rejects(
    drawnEntries(
      Object.entries(files).map(([name, document]) => entry(name, document)),
      "showcase",
    ),
    (error) => {
      assert.deepEqual(
        error.problems.map(({ path }) => path),
        expected,
      );
      return true;
    },
  );
  for (const [name, document] of Object.entries(files)) {
    const kind = document.diagram_type;
    assert.deepEqual(publishersPaths(kind, asAuthored(kind, document)), [], name);
  }
});
