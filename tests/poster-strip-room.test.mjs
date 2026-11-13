import assert from "node:assert/strict";
import test from "node:test";
import {
  files,
  part,
  platesIn,
  rectsOf,
  stripModel,
  stripOf,
  stripStyle,
} from "./fixtures/strips.mjs";

// A strip is as long as its part's code, so its box makes room for it: a strip never runs past its box into a
// neighbour or across the boundary around it.

/** Four parts that one outside client calls, in one row, their strips 411, 249, 291 and 60 px long. */
function rowOfFour() {
  const sizes = { a: 48000, b: 29000, c: 34000, d: 7000 };
  const parts = new Map(
    Object.entries(sizes).map(([id, bytes]) => [id, part([[`src/${id}.mjs`, bytes, 2]])]),
  );
  // The edition's largest part, 56 KB, stands in another view.
  parts.set("e", part([["src/e.mjs", 56000, 2]]));
  const model = stripModel("en", {
    components: [
      { id: "client", label: "Client", kind: "tool" },
      ...Object.keys(sizes).map((id) => ({ id, label: `Part ${id.toUpperCase()}`, kind: "stage" })),
      { id: "e", label: "Part E", kind: "stage" },
    ],
    relations: [
      ...Object.keys(sizes).map((id) => ({
        id: `client-${id}`,
        from: "client",
        to: id,
        label: "calls",
        files: files(1),
      })),
      { id: "d-e", from: "d", to: "e", label: "writes", files: files(1) },
    ],
  });
  return { model, style: stripStyle(undefined, parts), ids: Object.keys(sizes) };
}

test("strips in a row stay inside their boxes and the boundary", async () => {
  const { model, style, ids } = rowOfFour();
  const {
    plates: [plate],
  } = await platesIn(model, style);
  const strips = ids.map((id) => {
    const strip = stripOf(plate, id);
    return { id, x: strip[0].x, end: strip.at(-1).x + strip.at(-1).width, y: strip[0].y };
  });
  const boundary = rectsOf(plate.svg).find(({ dash }) => dash === "8 5");
  assert.ok(boundary, "the plate draws a boundary");
  for (const strip of strips) {
    assert.ok(
      strip.end <= boundary.x + boundary.width,
      `${strip.id} ends at ${strip.end}, past the boundary`,
    );
    for (const other of strips)
      if (other !== strip && other.y === strip.y && other.x > strip.x)
        assert.ok(strip.end < other.x, `${strip.id} runs into ${other.id}`);
  }
});
