import assert from "node:assert/strict";
import test from "node:test";
import { drawnEntries } from "../src/map/guide-figures.mjs";
import { PARTS } from "./fixtures/guide-work.mjs";

// The queue item `page-figures`: the page's diagrams are laid out by the publisher. A guide's architecture file that
// places nothing is laid out as the generated page's diagrams are: Archify's own layout, repaired and pinned, chosen
// by what a reader misreads. Its sources stay; a file that places anything is drawn as its author placed it.

const entry = (name, value) => ({
  name,
  bytes: Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`),
});

/** The fixture's parts without their places, with a source on a card and on the connection. */
const placeless = () => {
  const document = JSON.parse(PARTS);
  for (const component of document.components) {
    delete component.pos;
    delete component.size;
  }
  document.components[0].sources = [{ path: "src/main.mjs", line: 1, label: "Front end" }];
  document.connections[0].sources = [{ path: "src/main.mjs", line: 1, label: "Calls" }];
  document.meta.repository = {
    url: "https://github.com/example/shop.git",
    revision: "a".repeat(40),
  };
  return document;
};

test("a guide's architecture file that places nothing is laid out by the publisher, its sources kept", async () => {
  const draft = entry("guide.archify.md", "# A guide {#g}\n");
  const notes = entry("notes.txt", "Not a diagram.\n");
  const author = placeless();
  const [drawnDraft, drawn, drawnNotes] = await drawnEntries(
    [draft, entry("parts.architecture.json", author), notes],
    "showcase",
  );
  assert.deepEqual(drawnDraft.bytes, draft.bytes);
  assert.deepEqual(drawnNotes.bytes, notes.bytes);
  const laidOut = JSON.parse(drawn.bytes.toString("utf8"));
  assert.deepEqual(laidOut.layout, { mode: "auto" });
  assert.deepEqual(laidOut.components, author.components, "the parts as the author stated them");
  assert.deepEqual(laidOut.meta, author.meta);
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

test("a guide's architecture file that places its parts is drawn as its author placed it", async () => {
  const placed = entry("parts.architecture.json", PARTS);
  const [drawn] = await drawnEntries([placed], "showcase");
  assert.deepEqual(drawn.bytes, placed.bytes);
});

test("a placeless file is chosen at the build's quality, and one without connections takes Archify's layout", async () => {
  // A file need not name its quality profile; the build's is the one the chooser measures at (the review of the
  // Change, 2026-11-25, found a file without it refused).
  const author = placeless();
  delete author.meta.quality_profile;
  const [drawn] = await drawnEntries([entry("parts.architecture.json", author)], "standard");
  assert.deepEqual(JSON.parse(drawn.bytes.toString("utf8")).meta, author.meta);
  const alone = placeless();
  delete alone.connections;
  const [single] = await drawnEntries([entry("alone.architecture.json", alone)], "showcase");
  assert.deepEqual(JSON.parse(single.bytes.toString("utf8")), {
    ...alone,
    layout: { mode: "auto" },
  });
  const sided = placeless();
  sided.connections[0].fromSide = "right";
  const [kept] = await drawnEntries([entry("sided.architecture.json", sided)], "showcase");
  assert.deepEqual(
    JSON.parse(kept.bytes.toString("utf8")),
    sided,
    "a side the author chose places the file",
  );
});
