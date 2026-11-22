## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "The house's measures": the
foot's rule and line beside their tokens, the measures the Typst files repeat and no token holds, and the tokens
parsed in five places, the colophon page reading them though it imports the class. Its "What follows" names the
kind: a literal beside its token, found by searching the source for a token's value. This is the fourth Change of
the item `one-source`, after the first, which made `src/house.mjs` the one reader of the tokens in JavaScript, and
the third, which gave the class the table of names it shares; it adds its searches to `tests/one-source.test.mjs`.

The item's cut allows the fourth Change in two parts. This is the first, the class's measures: some fifty literals
of three Typst files and three modules. The second, the cinnabar, the body's box and the tokens no file reads,
reaches other readers (the palette check of `model/edition.mjs`, the frame of a plate in the data, the plates'
composition and three test files that read the box) and adds more than twenty edits of its own.

One fact bounds the Change. `stage()` in `src/overview/typeset.mjs` hands back the SHA-256 of the class, the
drawing, the staged tokens and the shared table, and the manifest records it twice, as `edition.house` and
`overview.house`. The holder ruled on 2026-11-21 that those two may change, and nothing else of a delivery may.

## Goals / Non-Goals

**Goals:**

- Each measure the class repeated as a number stands once, in `src/house.json`, and every place that set it reads
  it there: the class once, in Typst; the drawing and the colophon page through the class; the engine through
  `src/house.mjs`.
- Every measure keeps its number, so every page, image and figure keeps its bytes.
- A test refuses a measure written again as a number in the forms the census and the drafting found, and a second
  reading of the tokens in the Typst.

**Non-Goals:**

- The cinnabar as a token, the body's box derived from `page` and `edition`, the key's planned and retired samples
  from the rows of `lines`, and the tokens no file reads (`plate.x`, `plate.y`, `lines.widths`, `lines.levels`,
  each row's `channel`, `question` and `page`): the second part of the fourth Change.
- Numbers equal to a measure that set another fact: `16pt` as a cell's padding or a key sample's width, `24pt` as a
  spacing of the drawing's bands, `5pt` as a ring's radius or an arrowhead's size, `84pt` as the cover's space under
  the title. The 112, 120 and 48 points the research page leaves open, and the overview check's bounds 16 and 892,
  which no token holds and which bound the check, not the page.
- Measures stated once in the class, such as the drawing's spacings, a summary's size and pitch on the title page,
  or the masthead's built line: each has one place already.

## Decisions

1. Five groups of tokens, each measure in the unit and the digits of the literal it replaces.
   - Rests on: the holder's ruling that every delivered byte but two digests stays; Typst sets `16 * 1pt` and `16pt`
     alike, and JSON's `6.6` and Typst's `6.6` are the same number.
   - Considered: a measure derived from another (the summary's pitch as a ratio of its size, the ring's stroke as a
     share of a rule's), which rounds; a table of the class's own, which the engine could not read.
   - Chosen because: two small documents, one setting each measure from the tokens as the class does and one from
     its literal, compiled to the same PDF bytes. The groups are `text` (pitch 16, leading 6.6), `baselines` (label
     64, title 52, lead 84), `summary` (size 17, pitch 24), `mark` (gap 5, middle 0.36 em) and `weights` (rule 0.8,
     hair 0.4, ring 1.7).
   - Applies to: `src/house.json`.
2. The class reads the tokens once and converts them as it converts its sizes; the drawing and the colophon page
   take them from it.
   - Rests on: the class's `sizes` from `_house.sizes`; the census's count of the colophon's second reading.
   - Considered: each place reading `_house` and multiplying, as the foot does; the colophon keeping its reading.
   - Chosen because: one function, `_points`, turns a group into lengths for the sizes and the four new groups;
     the colophon page imports `_house` and the measures with the rest of the class.
   - Applies to: `src/overview/house.typ`, `src/overview/drawn.typ`, `src/edition/colophon.typ`.
3. A literal is the measure where it sets that measure, and only there.
   - Rests on: what each line sets, read in place; the engine reserves a summary's height as its lines times its
     pitch, so the summary's first baseline stands a pitch below the body's top.
   - Considered: every literal of an equal number, which would make a cell's padding the pitch of text.
   - Chosen because: the pitch is set where a text's pitch, leading or spacing is given (the class's text
     primitives, the key, the drawing's spacing at the house's size); the leading where a page or a figure alone
     sets its paragraphs; the baselines in the masthead, the plates' head, the cover and the colophon page; the
     summary's size and pitch beside and above a figure; the mark's gap in both keys; the weights wherever a rule,
     a hair rule or a ring is drawn or recorded, the colophon slip's edge among them.
   - Applies to: the three Typst files.
4. The engine reads the measures it shares with the class.
   - Rests on: `STANDFIRST` (17 points on 24-point lines), `MARK` (5 points, 0.36 em) and `RING_STROKE` (half of
     1.7) state what the class sets.
   - Chosen because: each reads `HOUSE`, and the half of a ring's stroke is the token halved, exactly 0.85.
   - Applies to: `src/poster/compose/plates.mjs`, `src/poster/part.mjs`, `src/overview/checks.mjs`.
5. The search finds a measure in the forms it takes, from a table of the tokens it guards.
   - Rests on: the first three Changes' searches, which refuse a repetition in the forms the census found.
   - Considered: any length equal to any token, which refuses the paddings and radii of Non-Goals.
   - Chosen because: a number that no other measure of the class takes is refused as any length; the pitch and the
     summary's pitch where a pitch, a leading or a spacing is given; a baseline where a text is set on it; the
     mark's gap as a space across; a weight where one is given or recorded, bare or in points. In the JavaScript a
     number the JavaScript takes for nothing else is refused bare. A second test holds the tokens read once in the
     Typst, by `house.typ`.
   - Applies to: `tests/one-source.test.mjs`.
6. The class's digest changes, and this is the one change a delivery shows.
   - Rests on: the holder's ruling of 2026-11-21 in the item's cut.
   - Chosen because: the digest records the class's inputs. Exactly these bytes change: in every delivery's
     `manifest.json`, the 64 hexadecimal digits of `edition.house` and of `overview.house`, so the manifest's own
     digest differs; a build accepted at the head has an acceptance record and a colophon page that name it.
   - Applies to: nothing new; `stage()` already covers the tokens.

## Risks / Trade-offs

- [Only two small documents were compiled while this was drafted] → The lane's builds and the test files that
  typeset run every edited Typst line; a changed byte is fixed in the source, never excluded from the comparison.
- [A number equal to a measure in another role is not refused] → The search refuses the forms that name the role;
  a new form joins the test when it is found.
- [The colophon slip's edge read as a rule's weight] → It was drawn at a rule's weight; were it meant to differ, it
  needs a token of its own, not the literal back.
- [The staged tokens of a custom palette are written again by `JSON.stringify`] → The new groups are numbers that
  print as they are stated, and the staged copy is read by the class alone.
