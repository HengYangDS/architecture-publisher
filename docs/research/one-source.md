---
subject: architecture-publisher:research-one-source
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# One source for each fact: where the product states a fact more than once

A research page. It records a census taken on 2026-11-20 at dev `aa31551e`: which facts the product's source, its
schema and its documents state in more than one place, how each count was made, and which repetitions have already
gone wrong. It decides nothing; the decisions that rest on it are in the designs of the Changes of the queue items
`one-source` and `derived-references`.

## What was asked

On 2026-11-20 the owner asked how the address of a work's repository is written, and then where it is written:
「事实出处应该唯一，否则要维护多处」. The same morning they made it a rule for everything built here:
「SSOT,DRY,MECE,SOLID, 深模块，小表面积，充分解耦，声明式等最佳实践，是硬性要求」. Glosses, which are translations
and not their words: "a fact should have one place it comes from, or several places have to be maintained"; "SSOT,
DRY, MECE, SOLID, deep modules, a small surface, full decoupling and declarative form are hard requirements."

The question for this page: where does the product state one fact in more than one place, and what would its one
source be?

## How it was read

- Three readers other than the maintainer (agents, read-only, 10:25 to 10:33) each took one part of the tracked
  source at dev: the house's measures, the names the source forms, and the schema against the code and the
  documents. Each searched with `git grep -P` and reported places by file and line.
- The maintainer ran the searches again for the rows marked **counted twice** below, count first and every line
  (10:40). A row marked **a reader's count** was not counted again.
- The works were counted in the publications at `5ec7687` (06:40 to 06:50, the maintainer).

`git grep -E` on the host where this was read knows neither `\b` nor `\s`: an earlier search for a literal with a
word boundary found nothing where the literal stands three times. A census uses `-P` or plain strings.

## What was found

### A model's repository, in the published works

| Place                                      | Files                         | What repeats                                                                |
| ------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------- |
| `model.json`, `repository.url`             | 12 (six works, two languages) | the address                                                                 |
| `model.json`, `repository.browse`          | 12                            | the same address without `.git`, then `/blob/{revision}/{path}`, in all six |
| a guide's diagram files, `meta.repository` | 74 of 78                      | `url`, `provider` and `revision`, equal to the model's block in all 74      |
| the two languages of one work              | 6 pairs                       | the whole `repository` block, equal in all six                              |

A re-pin therefore rewrites every diagram file of a guide, and the product refuses a guide that disagrees with its
model (`guide_repository_mismatch`): a refusal after the fact, not one source.

### Names the source forms

| Fact                                                | Where it is formed                                                                                                            | Count            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| A delivery's file names, from the model's id        | `build.mjs` 3, `manifest.mjs` 5, `cli/report.mjs` 2, `pinned/reader.mjs` 2, `projection.mjs` 2, `edition/record.mjs` 1        | counted twice    |
| A plate's key, `plate-` and its number              | `edition/record.mjs` (`keyOf`), `edition/typeset.mjs` 4, `overview/drawn.typ` 1                                               | counted twice    |
| A number set in two digits                          | eight lines of six modules                                                                                                    | counted twice    |
| `manifest.json`                                     | `delivery.mjs` (a constant), `build.mjs`, `pinned/reader.mjs`, `projection.mjs`                                               | counted twice    |
| `acceptance.json`, `acceptance.sig`, `colophon.pdf` | `delivery.mjs` (constants), `projection.mjs` 2, `edition/colophon.mjs` 1, five locales' words, two help texts                 | counted twice    |
| The delivered `model.json`                          | `manifest.mjs`, `pinned/data.mjs`, `projection.mjs` 2                                                                         | counted twice    |
| `images/` and `figures/`                            | six lines of `build.mjs`, `edition/typeset.mjs`, `pinned/reader.mjs`                                                          | counted twice    |
| Labels that Typst sets and JavaScript queries       | five names (`archpub-end`, `-mark`, `-line`, `-box`, `-loose`), each a bare string on both sides                              | counted twice    |
| Files staged for Typst                              | `edition.json`, `breaks.json`, `colophon.json`, `model.json`, `house.json`: written by name, read by name                     | counted twice    |
| A revision cut to seven characters                  | five lines of `cli/report.mjs`, `edition/colophon.mjs`, `edition/record.mjs`                                                  | counted twice    |
| The Typst version                                   | `overview/typeset.mjs` (a constant), `build.mjs` (a literal), the Mise configuration, five lines of three reference documents | counted twice    |
| The eight categories                                | the schema, `model/load.mjs`, `icons.mjs`, `map/archify.mjs`, `poster/tokens.mjs`, the model reference                        | a reader's count |
| The statuses                                        | the schema, `model/load.mjs`, a subset in `poster/compose/plates.mjs`, the model reference                                    | a reader's count |

### The house's measures

`src/house.json` is parsed in five places: `poster/tokens.mjs` and `model/edition.mjs` each parse it,
`overview/typeset.mjs` stages a copy, and the class and the colophon each read the staged copy, though the
colophon imports the class (counted twice).

| Fact                                               | Where it stands beside its token, or with none                                                                                                      | Count            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| The page's width, 1600, and right edge, 1552       | `edition/typeset.mjs`, `overview/checks.mjs` 2, beside `page.width`                                                                                 | counted twice    |
| The foot's rule and line, 866 and 886 points       | three lines of the class, beside `edition.rule` and `edition.foot`, read six lines above                                                            | counted twice    |
| Cinnabar, `#a93d31`                                | `edition/colophon.typ`, `model/edition.mjs`; no token                                                                                               | counted twice    |
| The body's box                                     | four numbers of `house.json` that follow from `page` and `edition`                                                                                  | a reader's count |
| The faces' names                                   | `poster/text.mjs` 4, `overview/glyphs.mjs` 1, beside `faces`                                                                                        | a reader's count |
| Measures the Typst files repeat and no token holds | the summary's size and lead, a key mark's gap, a ring's stroke, a rule's weight, the head's baselines, the pitch, a leading, the cover's label line | a reader's count |
| The key's samples of planned and retired           | drawn as "dashed" and "dotted", not from the rows of `lines`                                                                                        | a reader's count |

Tokens that no file of `src/` reads, each key searched whole: `plate.x`, `plate.y`, `lines.widths`, `lines.levels`,
and each row's `channel`, `question` and `page`; tests read them (a reader's count).

### The model's vocabulary

No module of the source reads `src/model/schema.json`, and no schema validator is a dependency. Every enumeration,
pattern, limit and list of fields of the model is therefore written twice, in the schema and in the loader (a
reader's count, by file and line): the categories and statuses; the id's pattern, the limits of a text and of a
path; six more patterns; twenty-three lists of required and allowed fields in `model/load.mjs`,
`model/paths.mjs` and `model/overview.mjs`; the format and the version. Tests hold four of them to the schema
(the locales, the palettes, the overview's fields, the guide's pattern).

### The reference documents

| Fact                                       | State                                                                                                                        | Count            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| The bundled icons' version                 | the package and the icons' policy hold 1.74.0, held to the lock by a tool; the model reference says 1.73.0                   | counted twice    |
| Commands and options                       | the operations reference and the README by hand; the Skill held by a test                                                    | a reader's count |
| Refusal codes                              | literals where they are raised, no registry; the operations reference lists 97 by hand, all found in the source              | a reader's count |
| A delivery's files; the manifest's version | the operations reference by hand                                                                                             | a reader's count |
| The table of configuration owners          | the configuration reference by hand, beside `package.json`                                                                   | a reader's count |
| The product's version                      | `VERSION`, from which the package files are generated and checked; a caption of the README and three tests' literals by hand | counted twice    |

## What has already gone wrong

- The model reference names an icon set one release behind the one bundled (above).
- On 2026-11-20 a reviewer and the maintainer both held a token of `house.json` to have no reader; the colophon
  read it, the token was removed, and the lane's tests refused. Who reads a token is a search's question.
- A re-pin of a work rewrites every diagram file of its guide.

## What already has one source

The product's version in the package files; the palettes and the locales in code (the keys of `house.json` and the
table `src/locales.json`, from 2026-11-26); a link to a file (`linkOf`, one caller) and the address without `.git`; an image's and a figure's
name; the rows of the contents and of the index (`edition.contentsRows`, `edition.indexRows`); line strokes and
dashes; the line reference, written from the table.

## What follows, and where it applies

The repetitions are of five kinds, and each has a mechanical form a test can refuse: a literal beside its token
(search the source for a token's value); a name formed in several modules (search for the pattern outside its one
module); a string that two languages of the source share with no table between them (the labels and staged names
queried in JavaScript equal those set in Typst); a vocabulary in a schema and in code (the loader's lists equal the
schema's, or are read from it); a table of a document kept by hand (the table equals what a command writes from
the source). What holds for the publisher's source at `aa31551e`; the works' diagram files belong to the queue
item `page-figures`.

### How the item ended (2026-11-23)

Six Changes held it, from `name-a-delivery-s-files-in-one-module` to `derive-the-body-s-box-and-read-every-token`,
the last landed on 2026-11-23, each with a test that refuses the repetition it removed and every delivered byte
the same. The publisher derives a file's address on the two public Forges from the repository's own; the works
state their addresses once since the publications' Change `drop-the-derived-browse-from-the-works` of the same
day, whose input check refuses a template the address implies. The publisher does not refuse one: a model that
states it builds the same pages, and refusing a model another release accepted is a breaking release (the
contract's Evolution), which a repetition with no effect on a page does not warrant.

## The codes, counted again (2026-11-26)

For the first Change of the queue item `derived-references` a reader other than the maintainer counted the codes
at dev `39655548` (05:48 to 05:59), the maintainer scanned the source again (06:0x), and an independent reviewer
of the Change found 8 problem codes of the projection's invariants that both had missed (06:5x). The source raises
or reports 181 codes: 2 printed by a failed command, 103 as a refusal's code, 67 only as a problem's, 8 as a
warning's and 1 used inside and never shown; 12 of them are formed from a medium's name and 10 raised by the Typst
classes. The refusals reference named
102, in 55 rows written by hand; four `layout_*` refusals and the problems' codes were in no table, and one row,
`plan_not_admitted`'s, left out that a plan refuses with a view's own code when its layout or plate refused it.
Four more `code` fields named the route defects that rank candidate layouts and never reach a reader. With the
Change the codes stand in `src/refusal.json`; the type check holds the raises it can follow, a test holds every
literal in a code's place to the registry both ways, and the reference's three tables are written from it.

## How the rest of the references are written (2026-11-26)

Four questions stood open after the registry of codes, and the maintainer put them to a committee of three, each
blind to the others: an architect of one source, a reader of the product for people and agents, and a reader of
risk and supply. Each read the census of 2026-11-26 and the registry's design and answered alone (10:45 to 10:48); the
maintainer decided under the owner's delegation.

| Question                       | Decision                                                                                                                 | Votes  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| The model's vocabulary         | the loader reads its enumerations, patterns, limits and field lists from `schema.json`; its problem codes and paths stay | 3 of 3 |
| The commands and their options | `archpub --help --json` catalogues the program, and the reference's block is written from it                             | 2 of 3 |
| A delivery's files             | a registry of a delivery's files as data, read by the source that names them and by the writer                           | 3 of 3 |
| Versions of supplies           | one table in one document, filled from each version's own owner, which the prose points to                               | 3 of 3 |

The reasons that decided: a JSON Schema validator's errors would need a second table of the model's problem codes,
which tests hold in their order, and a runtime library in the model's module is refused by the module boundaries;
parsing a help's text breaks on a commander release, and a data file the program is built from would state the
program twice (the dissent chose it to keep the writer from running the product); a build of a fixture is too heavy
for the check of generated inputs; a number written inside a sentence cannot be written from its owner. Taken with
them: the schema gains what only the loader states, and a test of the problems' codes, paths and order on bad
models stands before the loader changes.

## The sets the code keys its data by (2026-11-26)

Four enumerations of the schema were weighed: the categories (their looks, `src/categories.json`), the built-in
palettes (their tokens, `src/house.json`), the languages (the words of each, in `src/locale.mjs` and two more modules)
and the statuses. The first three are sets the code keys its data by; each was stated in the schema and again in the
code, the categories and the languages with a default, and a test held the two equal. The statuses had one list, the
schema's. The maintainer put the question of each set's one statement to a committee of three, each blind to the
others: a reader of decoupling, a reader of the schema's users and a reader for the fewest entities (21:56 to 22:00).
The maintainer decided under the owner's delegation.

| Set        | Decision                                                                                                        | Votes                                |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Statuses   | no change: the schema is the one list, and code that branches on a status is behaviour                          | 3 of 3                               |
| Categories | the table of looks states the set and the default; the schema's are written from it                             | 2 of 3                               |
| Palettes   | the house's tokens state the set, written into the schema; the schema states the default, which the model reads | 2 of 3; the default the maintainer's |
| Languages  | a table of languages states the set and the default; the schema's are written from it                           | 1 of 3, the maintainer's             |

The reasons that decided: the units that draw may not read the model's unit, so a table they read cannot take its set
from the schema without a dependency the boundary test cannot see; a table keyed by the members names them anyway, so
it is the larger statement, and the schema is filled in from it as the reference tables are. For the languages, the
dissent kept the tests (the words are code, which a tool may not import) or made the schema the source (which makes
`src/locale.mjs`, which may import nothing, read the model's file); the first leaves the item's clause unmet, and a
table of five languages beside the module is the smaller entity. The schema reader's objection, that a hand-written
file gains written parts a hand edit of which is refused only by the check, holds of the written reference tables too.
The palettes' default went against both majority members, who put it in the house: the maintainer kept it in the
schema, since only the model's unit reads it and it is a fact of the model's contract, not a token. Not taken: a
default status, which would state what an absent status means in a contract that writes `null` for it.

## The last hand tables (2026-11-26)

A reader other than the maintainer read every table of the reference documents outside the written blocks
(23:00 to 23:12): five restated the source, two were held to it by a test that parses the page, and one was the
document's own. The maintainer put each table's source to a committee of three, each blind to the others: a reader
of one source, a reader for the documents' readers and a reader for the fewest entities (23:15 to 23:22).

| Table                                    | Decision                                                                  | Votes  |
| ---------------------------------------- | ------------------------------------------------------------------------- | ------ |
| The palettes, model reference            | written from the house's palettes and the schema's default                | 3 of 3 |
| The lines, lines reference               | written from the house's table of lines                                   | 3 of 3 |
| A delivery's three files, data reference | a pointer to the operations reference's written table                     | 3 of 3 |
| The data's members and an evidence row   | the page is the format's statement; the tests read it                     | 2 of 3 |
| The configuration's carriers             | a pointer to the npm scripts, and a sentence on the four they do not name | 2 of 3 |
| The terms                                | the page is the vocabulary's statement, as before                         | 3 of 3 |

The glossary (`docs/glossary.md`), a reference page outside `docs/reference/`, which the census did not read, was
read against the source afterwards: its table defines each word and links the reference that states it, and in six
of its definitions names a delivery file as `src/delivery.json` names it (the data, the manifest, the page, the
print edition, the reader file, and the delivery's contents), and the balance gates as four, as the operations
reference does. Each agrees with its source today. It is the vocabulary's definitions, not a table of the source:
the names are words a reader looks up, each with the link to the table that states them; it stays by hand, as the
terms reference does, and the six names are recorded below with the prose that names a set.

The reasons that decided: the data reference promises that a later release removes no key written there, which a
table written from the code could break while looking right, and the column of what each key holds has no source in
the code; the dissent proposed a JSON schema of the data, a new published entity no consumer reads. A table filtered
from a written table elsewhere would print the same facts twice.

## How the item ended (2026-11-26)

Twelve Changes held `derived-references`, from `register-every-refusal-code` to
`write-the-last-reference-tables-from-their-sources`, each landed on 2026-11-26 or 2026-11-27, each
after an independent review whose findings were answered in its code or design. The refusal codes stand in `src/refusal.json`; the commands in the program's own catalogue
(`archpub --help --json`); a delivery's files in `src/delivery.json`; the versions the publisher needs in
`package.json` and the bundled Archify's manifest; the model's fields, patterns, limits and top-level descriptions
in `src/model/schema.json`, which the loader reads; the categories, the built-in palettes and the languages in the
tables that key their data by them, from which the schema's enumerations are written; the table of lines in
`src/house.json`. Every table of a reference document that restates one of them is written from it by
`tools/docs/references.mjs`, and `npm run check:generated` refuses a committed table or schema that differs, on this
host, in the proof and on both Forges' runners.

Three things were decided to be their own source and stay by hand: the data reference's tables of the data's members
and of an evidence row's keys, which state the delivery format and which the tests hold the data to; the terms
reference, which states the product's vocabulary and which the tests hold the words to; and the model reference's
advice on which address to state, which no code states. What is left, and why it is left:

- A length is counted in UTF-16 units by the loader and in code points by a JSON Schema validator; the requirement
  that states the vocabulary once names this exception.
- Prose that names a whole set the source states is outside the item, which names tables. The census of 2026-11-26
  counted 17 sentences; this Change rewrote two (the data reference's three files and the command line reference's
  commands by role), and the glossary adds six names. No item of the queue holds them yet; they are listed below,
  by place, for the item that takes them up.
- The current model version `3` stands by hand in the model reference's smallest model, an example an author
  copies; its row of `version` is written from the schema's `const`.
- The delivery format has no machine-readable statement of its keys; no consumer reads one today.

## Prose that names a set the source states (2026-11-27)

Each place, with the source that states the set:

- `docs/reference/data.md`, "The data": the four ids that would give two files one name (`src/delivery.json`).
- `docs/reference/data.md`, "A plate's record and face" and the keys of a component, a relation, a group and a fact
  (`src/pinned/data.mjs`).
- `docs/reference/model.md`: the statuses a part may have, the strip's longest and drawn lengths, the three age
  bands, and a palette's colours from ground to dye (`src/model/schema.json`, `src/poster/strip.mjs`,
  `src/facts/ages.mjs`).
- `docs/reference/lines.md`: the three widths the trials measured at (`tests/fixtures/line-tables.mjs`).
- `docs/reference/operations.md`: the release's platforms and the archive's members
  (`tools/release/archive/assemble.mjs`), the runtime dependencies (`package.json`), and the variables a child
  process receives (`src/environment.mjs`).
- `docs/reference/command-line.md` and `docs/reference/refusals.md`: the exit statuses and the JSON shapes
  (`src/cli/run.mjs`).
- `README.md` and `docs/how-to.md`: the release's platforms.
- `docs/glossary.md`: the names of the data, the manifest, the page, the print edition, the reader file and the
  delivery's contents (`src/delivery.json`), and the four balance gates.

## What is not established

- The rows marked a reader's count: their places were not counted again by the maintainer.
- Whether three measures of the Typst files (112, 120 and 48 points) restate tokens or only equal them; where two
  bounds of `overview/checks.mjs` (16 and 892) come from; whether the colophon is set in the edition's palette.
- `how-to.md` and `tutorial.md` were not compared with the source, and no document's house measures with
  `house.json`; `data.md` and `command-line.md` were read by the census of 2026-11-26 for their tables only.
- Whether the terms reference lists every concept and every key: its test holds the keys it lists, not the ones
  it leaves out.
- What the repetitions have cost beyond the three incidents above.
