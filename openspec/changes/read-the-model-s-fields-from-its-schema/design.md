## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` found the model's lists of fields
written twice, in the schema and in the loader. The vocabulary Change of 2026-11-26 read the model's patterns and
longest lengths from its schema and left this Change the 26 call sites that check 30 objects' fields, and the lists'
fewest items (its design's non-goals). The committee of 2026-11-26 chose, three of three, that the loader read the schema and keep its
own checks and problem codes.

## Goals / Non-Goals

**Goals:**

- The fields of each object of the model and the fewest items of each list are stated once, in the schema, and read
  from there.
- The schema accepts what the loader accepts: a spur's view.

**Non-Goals:**

- The words of a problem's message ("non-empty", "three colours"): the messages are a contract the
  characterisation holds; only the numbers are read.
- Rules across values, which the schema cannot state.
- The restatements outside the model unit (per-category tables, the LikeC4 importer's slug, the reference's category
  table): a later Change of the queue item.

## Decisions

1. **An object is named by its pointer.** `fieldsOf(pointer)` gives an object's required fields in the order the
   schema requires them and its other fields in the order of its properties: the loader reports a missing field in
   the first order and offers the nearest name in the second. Four objects of the schema take the loader's order (the
   top level's `$schema` last; a step's `view` before its `text` and `stations`; a course's `parallel` before its
   `spurs`; a further course's `pass` and `aside` before its `text`), so that no problem and no suggested name moves.
2. **A variant is named by a field it requires.** A block of the overview, a tier and a palette are told apart by
   their fields, as the loader tells them; `variantOf` finds the one member of a `oneOf` that requires a field, so a
   reordered `oneOf` changes nothing.
3. **A length is read where it stands.** `leastOf` reads a list's `minItems`; `sizeOf` reads a list of fixed length
   (a term and its text, a palette's dyes) and refuses at import a list whose fewest and most differ. Two lists the
   loader checks with one function (the term and text pairs of a headed list and of a list in a group) each read
   their own. Where the code gives each item a part of its own (a palette's steps new, mid and old; a pair's term and
   text), the schema's length is held to those parts at import, so a schema that states another length stops the
   publisher instead of leaving an item unchecked and undrawn. A list's fewest items no longer says whether it may be
   absent: the three lists of references are always required where they are checked.
4. **A spur's `at` is a required field.** The loader reported it after the spur's other problems; it now reports it
   as every object does, first. This is the one change of a problem's order, held by the characterisation's case
   "overview spur without at".
5. **The characterisation holds every object.** 50 models more, 118 in all, each wrong in one object's fields or
   one list's length (five of them give a second problem that follows from the first), recorded from dev's loader;
   all but the spur's case are unchanged by this Change.
6. **What is read is held whole, positively.** The vocabulary records each pointer `fieldsOf` and `leastOf` read; a
   test imports the loader and holds the records equal to every object of the schema with fields and every list
   with a fewest number of items, and every definition of the schema to be one a `$ref` reaches. Fields carry a
   mark only `fieldsOf` gives, so the type check refuses fields written by hand where an object is checked. A list
   of patterns or numbers forbidden in the source was tried first and dropped: it missed the forms the old code used
   (a constant, an object literal, `== 0`).

## Risks / Trade-offs

- [A pointer through a `oneOf` or an `allOf` by position: a detail's list, a stretch's counted tracks] → A moved
  member lacks the value read there, and the module refuses at import.
- [A field added to the schema is taken by the loader at once] → That is the point of the Change; the loader's
  checks of the field's value are still written by hand, and a test of the new field shows its absence.
- [The loader names definitions (`/$defs/overviewStation`) where the model reaches them through a `$ref`] → A
  definition no `$ref` reaches fails the test of decision 6; an object inlined in place of a definition is unread
  and fails it too.
- [The schema still writes a station's fields again in a spur, and a view's description eight times] → Left to the
  item's next Change, the restatements, with a definition of a view; it is how the spur lost its view.
- [A number of items still stands in a problem's message ("three colours", "non-empty")] → The messages' words are a
  non-goal; the holds of decision 3 stop the publisher before a message could contradict the schema.
