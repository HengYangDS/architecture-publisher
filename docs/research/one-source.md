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

The product's version in the package files; the palettes and the locales in code (the keys of `house.json` and of
`locale.mjs`); a link to a file (`linkOf`, one caller) and the address without `.git`; an image's and a figure's
name; the rows of the contents and of the index (`edition.contentsRows`, `edition.indexRows`); line strokes and
dashes; the line reference, which a test holds to the table.

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

## What is not established

- The rows marked a reader's count: their places were not counted again by the maintainer.
- Whether three measures of the Typst files (112, 120 and 48 points) restate tokens or only equal them; where two
  bounds of `overview/checks.mjs` (16 and 892) come from; whether the colophon is set in the edition's palette.
- `data.md`, `command-line.md`, `how-to.md` and `tutorial.md` were not compared with the source, and no document's
  house measures with `house.json`.
- What the repetitions have cost beyond the three incidents above.
