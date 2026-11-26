## Context

See [proposal.md](proposal.md). The census of 2026-11-26 classed each table of the reference documents outside the
written blocks: restating the source, held to it by a test, or the document's own. The committee of three (one
source, the readers, Occam's razor) answered alone on each; the research page `docs/research/one-source.md` records
the votes and how the item ended.

## Goals / Non-Goals

**Goals:**

- No table of a reference document restates the source by hand: each is written from it, points at a written table,
  or is the source itself and is read by the code's tests.
- The item `derived-references` ends, recorded with what is left and why.

**Non-Goals:**

- Prose that names a whole set the source states (seventeen sentences in the census): the item names tables; they
  are recorded for the queue.
- A machine-readable statement of the delivery format's keys: no consumer reads one.

## Decisions

1. **The palettes and the lines are written from the house.** The sentence on a palette's colours and a line row's
   question and page expression are document text kept beside the values they describe, as a line row's `meaning`
   already is. The test of the house tokens requires every key to have a reader; for the keys only the reference
   writer reads (`documents`), it searches the writer by the handle the writer reads them with, as it searches the
   shipped source for the rest, so a key the writer stops reading is reported as unread.
2. **The data reference is the format's statement of its keys.** The page promises that a later release removes no
   key written there; a table written from the code would drop a row when the code drops a key, breaking that
   promise while looking right, and its column of what each key holds has no source in the code. So the page is the
   source, and the two tests read its first column (`tests/fixtures/data-format.mjs`) where they held literal lists.
   Alternative, by one vote: a JSON schema of the data, which would be a fourth statement of the same keys and a new
   published entity with no consumer.
3. **Pointers where a written table exists.** The three files of a delivery are rows of `src/delivery.json`, which the
   operations reference prints; the configuration's carriers are named by the npm scripts. A filtered copy of either
   would print the same facts twice.
4. **The terms reference stays the source.** No code states which word names each concept; the page declares the
   vocabulary and its test holds the product's words to it.
5. **The document text goes back into the tokens, against the decision of 2026-11-22.** The Change
   `derive-the-body-s-box-and-read-every-token` (its decision 4) took each line row's question and the page's
   expression of it out of the tokens, because the tokens are an input of every build, digested into every
   manifest, so a reworded question would move every delivery's `edition.house` and `overview.house` without a page
   changing. That cost stands: rewording a palette's `colours` or a row's `answers` or `page` changes those two
   digests in every later delivery, and each such Change says so in its Changelog entry. It is taken because the
   lines reference then had a second statement of the rows, held to the tokens by a test that parses the page,
   which is the restatement this item removes; a release already changes every manifest, which records the
   publisher's version; and no command or test compares those two digests across builds. Alternative: the document
   text in a table of the tools', keyed by the house's ids, which the writer refuses on a mismatch. No digest moves,
   at the price of a second set of ids for every palette and row, kept equal by a check, the kind of statement this
   item retires.
6. **The item ends in this Change.** The research page states how it ended and what is left; the contract's box is
   ticked here, so the record and the code land together.

## Risks / Trade-offs

- [The manifest's digests of the class's inputs change, now and at every later rewording] → They cover the house
  tokens, which gain text; no page, image, figure or file a delivery lists changes, as when the tokens last changed.
  Decision 5 weighs the standing cost.
- [A reader of the data reference loses the table of the three files] → The sentence names them and their formats,
  and links the table that holds them with when each is written.
- [The lines test no longer reads the page] → The writer's check refuses the page changed by hand, and the writer's
  test does so for a cell of it.
