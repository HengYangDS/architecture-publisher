## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "The house's measures": the rows
on the cinnabar, the body's box and the key's samples of planned and retired, and the tokens that no file of `src/`
reads. This is the second part of the item's fourth Change, after the first, `make-the-class-s-measures-tokens`,
which gave the class's measures their tokens, and after the fifth, `derive-a-file-s-address-from-the-forge`.

Drafting confirmed each reader by search. `plate.x` and `plate.y` are read by the tests `line-row-weight` and
`line-pairwise` alone; `plate.width` and `plate.height` by `src/poster/compose/plates.mjs` and the tests
`line-row-weight`, `line-pairwise` and `strip-lengths`; `src/pinned/face.mjs` derives the box itself from the
margin and the body's top and bottom. `lines.widths` is read by the tests `line-table`, `line-row-weight` and
`line-pairwise`; `lines.levels` and each row's `channel` by `tests/fixtures/line-tables.mjs` and `line-table`; each
row's `question` and `page` by `line-table`, which holds the line reference to them. The rows' `dash` is read in
`src/`: the engine draws a planned or a retired line with it and the class the boundary's sample.

One fact bounds the Change. `stage()` in `src/overview/typeset.mjs` hands back the SHA-256 of the class, the
drawing, the staged tokens and the shared table, and the manifest records it twice, as `edition.house` and
`overview.house`. The holder ruled on 2026-11-21 that those two may change and nothing else of a delivery may, and
that the key's samples are not drawn from the rows' dashes, since that would change pages.

## Goals / Non-Goals

**Goals:**

- The cinnabar stands once, in the tokens, and the colophon page and the palette check read it there.
- The body's box is derived once, from the page and the edition, and every reader of it reads the derivation.
- Every key of the tokens has a reader in `src/`, and a test says which key has none.
- Every page, image, figure, edition, data and reader file keeps its bytes.

**Non-Goals:**

- The key's samples of planned and retired drawn from the rows' dashes, or in another colour: no sample changes.
- Values restated in documents, such as the cinnabar in the model reference: the census did not compare documents
  with the tokens, and the item covers the source.
- The tests `style` and `edition-style`, which parse the tokens themselves to read the palettes.
- The 112, 120 and 48 points the research page leaves open, and the overview check's 16 and 892, as in the first
  part.

## Decisions

1. The cinnabar is a token of a group of its own, `seal`.
   - Rests on: the staging writes a custom palette's tokens over `palette`, `figure` and `dye` alone, and the seal's
     colour is the same in every palette; Typst's `rgb("#A93D31")` and `rgb("#a93d31")` are one colour.
   - Considered: a role of `palette`, which a custom palette's staging would drop.
   - Chosen because: two small documents, one setting the seal and the key's samples from the tokens as the class
     and the colophon page now do and one from the literals, compiled to the same PDF bytes.
   - Applies to: `src/house.json`, `src/edition/colophon.typ`, `src/model/edition.mjs`.
2. The unit `house` derives the body's box.
   - Rests on: the box's left is the margin, 48; its top the body's top, 112; its width 1600 − 2 × 48 = 1504; its
     height 826 − 112 = 714. Each is a sum of whole numbers, so exact, and a frame's top under a summary,
     `y + height − h`, is `826 − h` as before.
   - Considered: keeping the four numbers with a test that holds them to the page; derived keys added to `HOUSE`,
     which would then differ from the file the class reads.
   - Chosen because: `bodyOf(tokens)` serves a plate's frame, which is handed the tokens, and `HOUSE_BODY` the
     plates' composition and the tests. `pinned` imports `house`, a unit that imports nothing, as `model`, `poster`,
     `overview` and `edition` do.
   - Applies to: `src/house.mjs`, `src/poster/compose/plates.mjs`, `src/pinned/face.mjs`,
     `tests/module-boundaries.test.mjs`, and the tests that read the box.
3. The rows of planned and retired name the dash of their sample in the key, and the class reads it there.
   - Rests on: the holder's ruling; the rows' `dash` has a reader, the engine.
   - Considered: removing the rows' `dash`, which the engine draws with.
   - Chosen because: a row's `keyDash` states the preset the class draws, `dashed` or `dotted`; the class finds the
     row whose `key` is the entry's shape, since the engine names the shape by that `key`.
   - Applies to: `src/house.json`, `src/overview/house.typ`, no longer than it was.
4. A token no file of `src/` reads leaves the tokens for the place its readers read it.
   - Rests on: the readers above; the tokens are an input of every build, digested into every manifest, so a
     reworded question would move every delivery's digest without a page changing.
   - Considered: a reader made for them in `src/`, such as a check of the table's invariants that only tests would
     call.
   - Chosen because: the trials' widths and levels are the tests' record (`WIDTHS`, `LEVELS` in
     `tests/fixtures/line-tables.mjs`); a row's channel follows from its values (`channelOf`: a dash makes a
     pattern, a stroke or a factor a weight, neither a number); a row's question and the page's expression of it
     stand in `docs/reference/lines.md` alone, whose table the line table's test now holds to the tokens for the
     columns they state and reads for the two others.
   - Applies to: `src/house.json`, `tests/fixtures/line-tables.mjs`, `tests/line-table.test.mjs`,
     `tests/line-row-weight.test.mjs`, `tests/line-pairwise.test.mjs`, `docs/reference/lines.md`.
5. A new test file holds the tokens' searches, and each search stands in one file.
   - Rests on: `tests/one-source.test.mjs` stood at 458 effective lines of 500 after the fifth Change.
   - Chosen because: `tests/one-source-tokens.test.mjs` takes the first part's searches (the class's measures as
     numbers, the tokens read once in the Typst) and adds this part's: the cinnabar's hexadecimal in either
     language and either case, the body's width and height as numbers, a dash's name in quotes in the Typst, and
     every key of the tokens without a reader. `tests/one-source.test.mjs` keeps the first Change's search (a module
     that reads the tokens' file, a face's name, a page's measure), the second's names, the third's table and labels
     and the fifth's templates. Both read the source through `tests/fixtures/source.mjs`. The earlier Changes' own
     artifacts name `tests/one-source.test.mjs` as it stood when each landed.
   - Applies to: `tests/one-source-tokens.test.mjs`, `tests/one-source.test.mjs`, `tests/fixtures/source.mjs`.
6. A key is read where a file reaches it through its table.
   - Rests on: a key's name alone is no evidence: `widths` and `question` are names of other values in `src/`.
   - Considered: a reader declared for every key, about a hundred lines of the test.
   - Chosen because: a declared table names how the source reaches each table of the tokens, as `HOUSE.page` or the
     class's `_e`, and a key is read where a file writes it after one of those, takes it apart from one, or names it
     in quotes where the source names keys so. A table the source iterates is read whole, and a table with no
     declared way is refused.
   - Applies to: `tests/one-source-tokens.test.mjs`.
7. Exactly these bytes of a delivery change: in `manifest.json`, the 64 hexadecimal digits of `edition.house` and
   of `overview.house`, since the class and the staged tokens change, and so the manifest's own digest, which an
   acceptance record and a colophon page accepted at the head name.
   - Rests on: the holder's ruling of 2026-11-21 in the item's cut.
   - Chosen because: the colophon page is not among the digest's inputs and sets the same colour; the data's frames
     keep their numbers, derived where they were stated.
   - Applies to: nothing new; `stage()` already covers the tokens and the class.

## Risks / Trade-offs

- [The reader test finds a key through the names its table is reached by, not by following values] → A variable
  named like a handle passes as a reader; the handles are declared narrow where a name is common, and a table
  without one is refused.
- [Only two small documents were compiled while this was drafted] → The lane's builds and the test files that
  typeset run every edited line; a changed byte is fixed in the source, never excluded from the comparison.
- [Neither the bundled example nor the publications' work states a planned or a retired part, so the lane's builds
  draw no sample of a status] → The two documents drew both samples from the rows and from the literals to the
  same bytes; a build of a model that states both statuses, at the base and at the head, would show it on a page.
- [An entry of a shape no row names, falling to the class's branch for a status, now fails where it drew a dashed
  line] → The engine gives that branch only the two statuses' shapes, each a row's `key`.
- [The trials' widths and levels stand in a test fixture] → They are what the trials measured and what the tests
  render at; the reference page states them, and the line table's test holds it to them.
