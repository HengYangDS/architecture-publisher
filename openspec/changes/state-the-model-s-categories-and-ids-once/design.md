## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` found the model's vocabulary written
in the schema and again elsewhere. The vocabulary and fields Changes of 2026-11-26 had the loader read it from the
schema; their reviews left the restatements outside the loader, which this Change takes, all but the reference
documents.

## Goals / Non-Goals

**Goals:**

- Each fact about the model's categories, its default category, its ids and its earlier versions is stated once in
  the publisher's code, and what restates it across a boundary of the publisher's units is held to it.

**Non-Goals:**

- The reference documents' tables, sentences and sample, which the writer can fill: a later Change, which must first
  move a section of `model.md` (500 non-blank lines, the cap).
- What a category looks like: no icon, type or hue changes.

## Decisions

1. **One table of looks, where the drawing units can read it.** The icons, the map and the poster may not import the
   model (`tests/module-boundaries.test.mjs`), and three tables and a set were keyed by the categories. The looks
   move into one table in `src/kinds.mjs`, which the map and the poster already import; `src/icons.mjs` keeps only
   its artwork, and a group's look stands beside the table as a fact of its own. A test holds the table's keys to
   the schema's categories in their order, and the category of a part with no kind to the schema's default.
   Alternative: let the drawing units read the model's schema, or pass the default through the normalized model.
   Rejected: the first breaks the boundary that keeps a plate independent of the model's loader; the second adds a
   field to the normalized model, which the delivery's data carries.
2. **The default category in the schema.** `default: "backend"` on the kind's category is an annotation a validator
   ignores; the vocabulary reads it and refuses at import one that is no category.
3. **The importer's categories held at import.** The words of a LikeC4 kind's name and the category each gives stand
   in one list, every category of which must be the model's; anything else takes the default. The importer reads
   the model's vocabulary through the loader, as other units do.
4. **An id's form read from its pattern.** The longest id is found by trying the pattern (it states 128 inside itself,
   `{0,127}`), the characters an id may hold and begin with by testing each, so the importer writes neither; a
   pattern that would accept an id as long as the longest text is refused at import. A text cut for a suffix keeps
   the suffix within the longest id. Alternative: shorten the pattern to `^[a-z0-9][a-z0-9._-]*$` and state
   `maxLength: 128`, which states the number once and declaratively, with no trial. Not taken here: the loader would
   need a length check beside the pattern, every refused id's message (which quotes the pattern, as the
   characterisation records) would change, and the published pattern would change form; the trial changes none of
   them, at the cost of two stated assumptions (a character an id may hold may stand anywhere after the first, and
   each is one code point).
5. **The earlier versions in the loader.** The loader, which refuses them with the command that converts them, names
   them; the migrator reads them and hands the command line, which may not import the model, the versions its help
   names.

## Risks / Trade-offs

- [A test, not an import, holds the looks to the categories] → The boundary allows no import; the test runs in every
  check, and a category added to the schema without a look fails it by name.
- [Ids the LikeC4 import makes from texts longer than 120 characters change] → They grow to the model's longest id. A
  workspace imported again gets the longer ids; anything that named the old ids, such as a delivery built from the
  earlier import, names them no longer.
- [The pattern is tried up to 128 times at import] → Once per process, in microseconds.
