## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` found every enumeration, pattern
and limit of the model written twice, in the schema and in the loader, and no module reading the schema. The
committee of 2026-11-26 chose, three of three, that the loader read them from the schema and keep its own checks
and problem codes (the page's section "How the rest of the references are written").

## Goals / Non-Goals

**Goals:**

- Each pattern, enumeration and longest length that the loader holds a single value to is stated once, in the
  schema, and read from there.
- The published schema refuses every value the loader refuses by a rule of that value alone.

**Non-Goals:**

- The 26 lists of required and allowed fields, and the shortest and longest lengths of lists (`minItems`,
  `maxItems`: the views, the overview's blocks and steps, the three dyes of a palette), which the item's next Change
  reads with the schema's objects.
- The locales and the palettes: their source is code (`src/locale.mjs`, the house), and tests already hold the
  schema's enumerations to it.
- Rules across values (a duplicate id, an unknown reference, an overlap, a path claimed twice, a palette's
  measures): JSON Schema cannot state them, and they stay the loader's alone.
- A JSON Schema validator: its errors would need a second table of the model's problem codes (the committee).
- Changing what the publisher accepts, or a problem's code, path or message.

## Decisions

1. **One module reads the schema.** `vocabulary.mjs` reads each value at its JSON pointer and refuses at import a
   pattern that is not a string or a limit that is not an integer, so a schema edit that moves a value stops the
   publisher instead of turning a check off. A pattern is compiled in Unicode mode, as the loader's were. The loader
   re-exports the format, the version and the categories, so no caller outside the model unit changes.
2. **The schema takes the loader's rules of one value.** A text's `not` refuses a NUL beside its non-blank
   `pattern`, which stays where it was; a path's pattern refuses an empty segment, and its look-aheads read
   `[\s\S]*`, so a line separator no longer hides a `.` or `..` segment; a model's id refuses a device's name and a
   final dot. A path's pattern is the loader's whole rule of a file's path, with the final slash a directory adds.
3. **A characterisation test stands before the change.** 68 models, each wrong in one way or a few, from the
   minimal model, cover 47 of the 48 model problem codes (`model_lacks` is the projection's, not the loader's); their
   problems were written from the loader before it read the schema, and the test holds each problem's code, path and
   message, in order. A one-off probe in the work directory also held the old and the new checks of a path, a guide,
   a glob, a browse address, a model's id and a text equal on 124,579 strings.
4. **The guard walks the schema.** The vocabulary test refuses a model module other than `vocabulary.mjs` that
   writes one of the schema's patterns, as the schema writes it or as a regular expression's source does, or one of
   its longest lengths as a number standing alone (not a factor, such as the 4 MiB of a model file). A shorter limit
   (2, 3, 4) is too common a number to search for; it is read from the vocabulary and held by the characterisation.
5. **The reference is written from the schema.** `tools/docs/references.mjs` writes the rules of an id, a model's
   id, a text and a path into `docs/reference/model.md`, with the schema's patterns and limits; the words that say
   what each rule refuses are the writer's.

## Risks / Trade-offs

- [A length means two things] → JSON Schema counts a length in code points; the loader counts UTF-16 units, so it
  refuses a text of 1,500 emoji that a validator accepts. Kept, so that no model is accepted differently; the
  reference says so. Counting code points would accept more models, a change of its own.
- [A track's name is the schema's text, and the loader checks only that it is not blank] → The schema refuses a NUL
  or more than 2,000 characters in a track's name that the publisher accepts. Kept for the same reason; holding the
  name with the text check would refuse more models.
- [A pattern compiled from JSON differs from the literal it replaces] → The characterisation test and the probe
  above.
