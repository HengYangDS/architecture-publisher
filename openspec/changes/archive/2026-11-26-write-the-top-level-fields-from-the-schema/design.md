## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` recorded the reference tables that
restate the source; the Changes of the queue item `derived-references` wrote them from it one by one. The table of
top-level fields was left by hand, and its meanings and the schema's descriptions said the same thing twice in
different words.

## Goals / Non-Goals

**Goals:**

- A top-level field's meaning is stated once, in the schema, and the model reference's table is written from it; the
  reference's sections on a field open with what the table does not say.
- No table of a reference document restates the schema or the refusal registry by hand.

**Non-Goals:**

- The descriptions of the schema's nested objects, which no reference table prints.
- The enumerations that a table of the code is keyed by (the categories with their looks, the languages with their
  words, the palettes), and the default language the overview's class states itself (`src/overview/house.typ`): the
  item's next Change.

## Decisions

1. **The schema's description is the one statement of a field's meaning.** An editor shows it, and the writer prints
   it. Each description was written from the two texts it replaces, in plain words an editor can show: code spans,
   no links. Alternatives: keep the table by hand and hold it to the schema with a test, which is a check and not a
   source; or `markdownDescription`, which only some editors read.
2. **What the schema states of a value is printed from the schema.** A constant as "Always", the values of an
   enumeration, a default, a list's fewest items or, for a required list without them, that it may be empty.
   The locale's default moves from its description into the schema's `default`, an annotation validators ignore, and
   the locale test holds it to the publisher's default language as it holds the languages.
3. **A description says no rule another statement holds.** The id's devices and final dot stand in the table of
   values, a coverage path's globs in the coverage section, the edition's default palette in the palette's own
   description, and the fields of a nested object in the schema's own structure (its required and allowed fields,
   its patterns); the top-level descriptions say what the field is for.
4. **A detail's name in the table of values.** Its row prints the pattern of the names, as the id's row does, and the
   prose on details points to it instead of stating 64 characters.
5. **The data reference's holds as rows of the registry.** `reader_ids_differ`, `data_face_differs` and
   `projection_fact_unknown` shared one row that deferred to the data reference's table; each now has its own row with
   that table's meaning, the refusals reference prints them, and the data reference names the codes and links it.

## Risks / Trade-offs

- [The table loses three links: the version to the earlier versions, the overview to its reference, the edition to
  the palette] → Each target is a section of the same page or the reference's index; a description an editor shows
  cannot carry a link.
- [An author's editor shows new and shorter descriptions] → The id's and the coverage's rules leave their
  descriptions; they stand in the reference, and the publisher's problems name them.
