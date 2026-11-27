import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { INDIGO, part, platesIn, stripStyle } from "./fixtures/strips.mjs";

// A figure moves across its plate to bring its ink near the plate's centre line, but only as far as all it draws
// stays on the plate. The boundary's frame is not ink, so the balance measure leaves it out; the move and the check
// that nothing is drawn outside the plate count it all the same, out to the outer edge of its stroke. While they read
// the cards alone, a figure whose cards stand in its left columns moved right until its last card met the plate's
// edge, and the frame around that card stood 20 px past the edge, where the plate cut it off.

/**
 * A work whose command line fans out to two stages, one of which reaches three parts, drawn as one view with a
 * summary: its rows stand uncentred in their left columns, so its ink lies left of its outline's centre.
 */
function leftHeavyModel() {
  const parts = [
    ["author", "Author", "author"],
    ["cli", "archpub", "command"],
    ["importer", "Importer", "stage"],
    ["migration", "Model migration", "stage"],
    ["model", "Model loader", "check"],
    ["words", "Words", "medium"],
    ["supplies", "Supplies", "supply"],
  ];
  const relations = [
    ["author", "cli", "runs check, build"],
    ["cli", "importer", "imports"],
    ["cli", "migration", "migrates"],
    ["importer", "model", "validates"],
    ["importer", "supplies", "parses with"],
    ["importer", "words", "takes its words"],
    ["migration", "model", "reads, validates"],
  ];
  return validateModel(
    minimalModel({
      id: "intake",
      title: "The model's way in",
      question: "Which parts bring a model in?",
      kinds: {
        author: { label: "author", category: "person", icon: "user-pen" },
        command: { label: "command line", category: "frontend", icon: "square-terminal" },
        stage: { label: "stage", category: "backend", icon: "workflow" },
        check: { label: "check", category: "security", icon: "shield-check" },
        medium: { label: "medium", category: "frontend", icon: "image" },
        supply: { label: "vendored supply", category: "database", icon: "package" },
      },
      components: parts.map(([id, label, kind]) => ({ id, label, kind })),
      relations: relations.map(([from, to, label]) => ({ id: `${from}-${to}`, from, to, label })),
      views: [
        {
          id: "models",
          title: "Where a model comes from",
          question: "Which parts bring a model in, and which validates every model?",
          summary:
            "The author writes the model by hand, or the command line brings one in: the importer parses a workspace, and the migration converts an earlier model. The loader validates every model.",
          members: parts.map(([id]) => id),
        },
      ],
    }),
  );
}

test("a figure moved to balance its ink keeps its boundary within its plate", async () => {
  const model = leftHeavyModel();
  // Every part inside the boundary owns one file, so each card carries a strip and is as wide as it.
  const owned = new Map(
    ["cli", "importer", "migration", "model", "words", "supplies"].map((id, index) => [
      id,
      part([[`src/${id}.mjs`, 2000 * (index + 1), index % 3]]),
    ]),
  );
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle(INDIGO, owned, model));
  const { x, width } = plate.extent;
  assert.ok(
    x >= 0 && x + width <= plate.width,
    `the figure draws from ${x} to ${x + width} on a plate ${plate.width} wide`,
  );
  // The frame (the one rect drawn with a radius of 18) has its stroke centred on its outline, so half of the stroke
  // lies outside the frame.
  const frame = plate.svg.match(/<rect\b[^>]*rx="18"[^>]*>/)?.[0];
  assert.ok(frame, "the figure draws its boundary");
  const value = (name) => Number(frame.match(new RegExp(` ${name}="([^"]*)"`))?.[1]);
  const half = value("stroke-width") / 2;
  const [from, to] = [value("x") - half, value("x") + value("width") + half];
  assert.ok(
    from >= 0 && to <= plate.width,
    `the boundary's stroke reaches from ${from} to ${to} on a plate ${plate.width} wide`,
  );
  // The figure moves right until its boundary's stroke meets the plate's right edge, so the rule is exercised.
  assert.ok(
    plate.width - to < 2,
    `the boundary stops ${plate.width - to} px short of the plate's edge`,
  );
});
