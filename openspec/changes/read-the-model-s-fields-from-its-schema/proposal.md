## Why

The model's loader checks 30 objects of a model, at 26 call sites, against lists of fields it writes by hand, and
each list against a fewest number of items it writes too; the schema states both again. The queue item
`derived-references` asks that each be stated once. The two already disagree in one place: a spur of the overview's
course may name the view that enlarges it, as the loader and the model reference say, but the schema refuses it.

Queue: `derived-references`.

## What Changes

- `src/model/vocabulary.mjs` gains `fieldsOf`, `variantOf`, `leastOf` and `sizeOf`: the fields of the schema's
  object at a pointer, required ones first; the member of a `oneOf` that requires a field; the fewest items of a list;
  the one length of a list of fixed length. Each refuses at import a value the schema does not state.
- The loader, its overview, path and palette checks read every object's fields and every list's fewest items with
  them. Where the code gives each item a part (a palette's three steps, a pair's term and text), the schema's length
  is held to those parts at import.
- The schema gains a spur's `view`, and four objects take the order of fields the loader had, so that no problem and
  no suggested name moves.
- A spur without `at` reports it as every object reports a missing field, before its other problems.
- The characterisation grows by 50 models, each wrong in an object's fields or a list's length. A test holds that
  the checks read every object and every list the schema states, and the type check refuses fields written by hand.

Out of scope: the words of problems' messages; rules across values, which the schema cannot state; the restatements
outside the model unit (per-category tables, the LikeC4 importer's id, the reference's category table), a later
Change of the queue item.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the fields of the model's objects and the lengths of its lists read from its schema.

## Impact

`src/model/` (the vocabulary, four modules and the schema), the refusal registry's wording of
`model_field_required` and its reference table, the model tests and their fixtures. No model is accepted or refused
differently by the publisher; a JSON Schema validator now accepts a spur's view.
