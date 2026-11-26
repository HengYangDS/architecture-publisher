## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` recorded the model's vocabulary
written twice, in the schema and in the loader; the earlier Changes of the queue item `derived-references` made the
loader read the schema. Three sets remained whose members the code keys its data by: a unit that draws needs the
categories' looks and the words of each language, and may not read the model's unit, so a table in the code stated
each set again and a test held it to the schema's.

## Goals / Non-Goals

**Goals:**

- The categories, the built-in palettes and the languages, with the default category and the default language, are
  each stated once, in the table that keys its data by them, and the schema's are written from it.
- The default palette is stated once, in the schema.
- No module and no Typst class names a default language, palette or category beside its one statement.
- A track's name is held to the rule every text of the model is held to.

**Non-Goals:**

- The statuses: the schema is already their one list, which the loader reads; code that branches on a status is
  behaviour, not a list.
- The model reference's table of palettes and the sentence after it, which restate the house's names and the default
  palette, and the data reference's tables of the data's members and of an evidence row's keys: the item's next
  Change.
- The sets the specification's requirements name: a requirement is the contract a change of the set changes too.
- The sets prose names: the five languages in the contract's sentence on the page, and the four palettes with their
  Chinese names in the Skill's step on palettes: prose that names a whole set is the item's last Change to record,
  with the other such sentences, for the queue.

## Decisions

1. **The table that keys its data by a set owns the set.** The committee of 2026-11-26 (three members, each blind to
   the others) weighed three forms: the schema as the source, with the tables held to it at import; the table as the
   source, with the schema written from it; and the tables held by tests, as before. The units that draw may not
   read the model's unit, and a table keyed by the members must name each member anyway, so the table is the larger
   statement and the schema is filled in from it, as the reference tables are. The categories and the palettes took
   this by two votes to one; the languages were split three ways, and the maintainer chose the table: the schema as
   the source would make `locale.mjs`, which may import nothing, read the model's file, and the tests as before leave
   the item's clause unmet.
2. **The languages get a table of their own.** The words of each language are code, with functions, and a tool may
   not import the product's source; `src/locales.json` states the languages in order and the default, beside the
   module that reads it. Each table of words keyed by language is held to it where it is built (`keyedByLanguage`), and
   refused at import otherwise: before, a language without words read English silently.
3. **The default palette is the schema's.** Only the model's unit reads it, and the model's unit may read the schema;
   a key in the house for it would put a fact of the model's contract among the tokens. The house owns the palettes,
   the schema the default.
4. **The writer fills the schema in place.** It sets each set's `enum` and `default` at a declared pointer and
   writes the schema in the repository's Prettier form, which reproduces the committed schema byte for byte; the
   rest of the schema's content stays the authors', and its layout is the writer's: a hand edit laid out otherwise is
   refused by `check:generated` until written again, though the format check accepts it. Alternatives: a generated copy beside the schema, which would ship two
   schemas, or a schema written whole from a declaration, which would move the authors' descriptions out of it.
5. **The overview takes its language from the publisher.** The class drawn alone read the model file as its author
   wrote it and defaulted the language itself; the check hands it the loader's language, as the edition's record
   does.
6. **A track's name is a text.** The loader's rule of a text moves to the vocabulary, beside the limits it reads, and
   the stretch's check uses it. The publisher held a track's name only to not being blank, so a model naming a track
   with a NUL character or with more than a text's longest length was accepted. The schema of 0.20.0 refused the
   longer name, and refuses a NUL character from this release on, as the publisher's other texts were refused before.
   Refusing both is breaking by the contract's Evolution, and taken: the requirement that the checks read the
   schema's rules covers every text, an editor that validates the model already flagged the longer name, and a
   release below 1.0.0 may break. A name of 1,001 to 2,000 characters outside the Basic Multilingual Plane is
   refused by the publisher, which counts UTF-16 units, and accepted by the schema, which counts code points: the
   requirement's stated exception. The other way, keeping the hand rule, leaves the requirement unmet for one text.

## Risks / Trade-offs

- [The schema is partly written: a hand edit of a written enumeration is refused only by the check] → The same holds
  for the written reference tables; `npm run check:generated` runs in every proof and pipeline, and the written
  enumerations are committed, so a removed member shows in the same diff.
- [A table of words keyed otherwise stops every command at import] → It stops at the first command that loads it, with
  the table's keys in the message; the test of the languages builds such a table.
- [The overview's check needs the language] → Every caller passes it; the class refuses to draw without it rather than
  guess.
- [A model with such a track name stops building] → The Changelog and the commit mark it breaking and name the
  refusal; the problem names the stretch's tracks and its message the rule of a name.
- [The manifest's digests of the class's inputs change] → They cover `src/overview/house.typ`, which changes; no page,
  image, figure or file a delivery lists changes, as when the class last changed.
