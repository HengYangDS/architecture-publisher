## Context

See [proposal.md](proposal.md). The census of the sets the documents restate is the last section of
`docs/research/one-source.md`, which also records the decision of 2026-11-26 that this Change replaces. The two
Changes before it put a command's outcomes and the release's and runtime's sets in one place each; the generator
`tools/docs/references.mjs` writes marked blocks of a document from their sources, by family of sources, and `npm run
check:generated` refuses a block that differs.

## Goals / Non-Goals

**Goals:** the data's format stated once, in a schema an agent can read, which the data, the reference and the tests
all take it from; every data file as before.

**Non-Goals:** shipping the schema in a delivery, which would change every delivery; the skill's list of the four ids,
which `archpub skill` prints as written and which is left to its own Change.

## Decisions

1. **A JSON Schema in the package, the format's one statement.** Rests on: the owner's choice of 2026-11-28 and the
   research page's census. Considered: keeping the data reference's tables as the statement (the decision of
   2026-11-26), which an agent cannot read as data. Chosen because: a schema is the form a program reads a format in,
   and the reference can be written from its descriptions. Applies to: `src/pinned/data.schema.json`; values that a
   code table owns (media, figure formats, kinds, units) stay plain strings there, so they are not stated twice.
2. **The data's objects shaped from the schema.** Rests on: the owner's rule that what repeats a fact is derived from
   its source, never kept beside it with a check. Chosen because: the order and the set of each object's keys are then
   stated once, and a value passed straight through keeps its bytes when it holds exactly its definition's keys.
   `src/pinned/format.mjs` writes an object at every depth in its definition's order and refuses a key it lacks or a
   required key that is missing; it also takes from a larger record the fields a definition lists. Every object the
   schema states is closed (`additionalProperties: false`), a map aside, and the writer and the tests' checker both
   read that keyword, so they refuse the same keys. One unit-level case changes: a view handed to the data with no
   question is refused, since the schema requires one; the plan always supplies a question, so no build reaches it.
   Applies to: `src/pinned/data.mjs`, `evidence.mjs`, `face.mjs` and `projection.mjs`.
3. **A checker in the tests, not a dependency.** Rests on: the repository has no JSON Schema validator, and the
   model's loader reads its schema's values and checks them in its own code. Considered: `ajv` as a development
   dependency, which adds a dependency and cannot check key order. Chosen because: the format's order is part of it,
   and a checker of the few keywords the schema uses, which refuses any keyword it does not read, is small. Applies
   to: `tests/fixtures/data-format.mjs` and every test that builds data and reads it.
4. **The ids that would give two files one name, computed once.** Rests on: the same rule. Considered: the reference's
   generator computing them beside the writer, which agreed with it while nothing held the two together, as an
   independent review found. Chosen because: `src/names.mjs` owns the delivery's table of files, and the refusal and
   the generator both read its `TAKEN`. If an id ever clashed twice, the refusal would name the first clash in the
   table's order; none does. Applies to: `src/names.mjs`, `src/projection.mjs` and
   `tools/docs/references/delivery.mjs`.

## Risks / Trade-offs

- The tests that build a full delivery and now hold its data to the schema are heavy; they run in the lane's pre-run.
