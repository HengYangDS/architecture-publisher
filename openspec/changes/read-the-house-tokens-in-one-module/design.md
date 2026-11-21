## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "The house's measures":
`src/house.json` is parsed in five places, two of them by the JavaScript, and the page's width, its right edge and
the faces' names stand in modules beside the tokens that state them. This is the first Change of the item
`one-source`; each later Change of the item adds its searches to the test this one writes.

The class and the drawing read the staged copy of the tokens in Typst. The manifest records their digest with the
tokens' (`stage` in `src/overview/typeset.mjs`), so a Change that edits `src/house.json` or a Typst file moves a
delivered byte, the manifest's `house`. This Change edits neither.

## Goals / Non-Goals

**Goals:**

- The JavaScript reads `src/house.json` in one module, and every reader shares what it read.
- No module restates a face's name or a page's measure that the house states, and a test refuses one that does.
- Every delivered byte stays as it is.

**Non-Goals:**

- The Typst side of the house: the class's measures that no token holds, the foot's two baselines, the cinnabar of
  the colophon and the four numbers of the body's box. Each edits the class or the tokens, and so the manifest's
  digest; they are a later Change of the item.
- The names the JavaScript and the Typst share, the staged `house.json` among them, and the names a delivery's files
  take: later Changes of the item.
- The tests' own reading of the file (`tests/style.test.mjs`, `tests/edition-style.test.mjs`): a test may read what
  it holds the product to.

## Decisions

1. A unit of its own reads the file.
   - Rests on: `docs/research/one-source.md`, "The house's measures": `src/poster/tokens.mjs` and
     `src/model/edition.mjs` each parse the file; `tests/module-boundaries.test.mjs` lets no input unit (`model`)
     import a medium (`poster`).
   - Considered: `src/model/edition.mjs` importing the poster's tokens, which the boundaries refuse; the poster's
     module handing the tokens on to its importers, which keeps two names for one object and a wider surface.
   - Chosen because: a unit that imports nothing can be imported by every unit that needs a token, and it is the one
     place that names the file. Its surface is the file's address, which the overview stages, and the tokens.
   - Applies to: `src/house.mjs`, its importers, and the units `tests/module-boundaries.test.mjs` admits.
2. The tokens are one object, read-only throughout.
   - Rests on: the census's five readers, which held two copies and will hold one; a reader that wrote to its copy
     would now change what another reads. A search of `src` finds no write to the tokens.
   - Considered: a copy for each reader, which repeats the parse's effect; the object as parsed, which leaves a write
     unnoticed.
   - Chosen because: a write throws where it is made, and the suite runs every reader.
   - Applies to: `HOUSE` in `src/house.mjs`.
3. A literal beside its token reads the token.
   - Rests on: the same section, "The page's width, 1600, and right edge, 1552" and "The faces' names", counted
     twice and by a reader.
   - Considered: leaving the overview check's bounds as they stand. Its top and bottom, 16 and 892, follow from no
     token the research page could name ("What is not established"), so they stay the check's own until the class's
     measures are tokens; its width and height were read by nothing and go.
   - Chosen because: the margin and the right edge are the page's, and the faces are the house's.
   - Applies to: `src/edition/typeset.mjs`, `src/overview/checks.mjs`, `src/poster/text.mjs`,
     `src/overview/glyphs.mjs`.
4. A search refuses the repetition, not a disagreement.
   - Rests on: the same page, "What follows": each kind of repetition has a mechanical form a test can refuse; and
     the owner's rule that a check which refuses a disagreement afterwards is not a source.
   - Considered: a test that holds each restated value equal to its token, which would pass on every repetition
     while the two agree.
   - Chosen because: a module that addresses the file itself, or holds a face's name in quotes or the page's width,
     height or right edge as a number, is found whether or not it agrees. The staged name `house.json`, by which
     Typst reads its copy, is not an address of the file, and the search passes over it.
   - Applies to: `tests/one-source.test.mjs`.

## Risks / Trade-offs

- [A reader that writes to the tokens now throws] → No write is found by search; the suite in the proof runs every
  reader, and a write found there is removed, not the freezing.
- [The page's height, 900, written for another reason, such as a browser's viewport] → The test refuses it, and
  the author names that value as its own token where it is a fact of its own.
- [A repetition written in a form the search does not know] → The search holds the forms the census found; a new
  form joins the test when it is found.
