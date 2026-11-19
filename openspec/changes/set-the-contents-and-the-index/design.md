## Context

See [proposal.md](proposal.md) and the research page `docs/research/contents-and-index.md`, which holds the
owner's words, the measurements, the three drawings with what each was dropped for, the record of five readers of
the drawings, and practice elsewhere. This Change is the first of the queue item `edition-map`; plates tied back
to the overview, a plate's answer in one place and the overview's three sizes follow in Changes of their own.

## Goals / Non-Goals

**Goals:**

- A contents that says what the edition answers, in order, and stays full on every page it takes.
- A last page that finds any part by its name and leads to the plates that draw it.
- Each fact of the edition stated once.

**Non-Goals:**

- A level above the views (sections), which would shorten a contents of very many plates: the model has none.
- The portrait booklet's index and the page's own search: other carriers, other items.
- The label over a work's limits and a check of a question that repeats its title: findings of the same reading,
  recorded in the research page.

## Decisions

1. The overview is no row: its entry opens the left half of the first page with its number, name and claim.
   - Rests on: `docs/research/contents-and-index.md`, the owner's word of 2026-11-19 22:29 and finding 8: with
     the overview's lead under the claim, the English edition of one published work was refused, its left half
     737 points tall on a page that holds 714.
   - Considered: the overview as the first row, as released; the entry with claim and lead.
   - Chosen because: the entry then has what a row has, a number, a name and one line, and the lead stands on the
     overview's own page.
   - Applies to: every edition whose model states an overview.
2. A half takes eleven rows at most, and the rows are shared out evenly over the halves.
   - Rests on: the research page, finding 4 and "What was compared": the owner's words (sixteen a page are too
     close; ten a side), and the largest published work, which has eleven plates.
   - Considered: ten, which sets that work on two pages of four, four and three rows; twelve, the released page's
     density.
   - Chosen because: every published work keeps one page of contents, and one constant, `edition.contentsRows`,
     holds the number, so the owner's answer changes one value.
   - Applies to: every edition.
3. A row names no page.
   - Rests on: the research page, finding 6: a row carried two numbers at a constant offset.
   - Considered: the page number kept at the row's right edge.
   - Chosen because: the row is the link, and the index cites plates by their numbers.
   - Applies to: the contents.
4. The last pages are an index by name, each part followed by its own plates' numbers.
   - Rests on: the research page, finding 1: 349 of 1,308 cells of parts against plates hold a number, and a part
     stands on 1.5 to 2.5 plates; and finding 5, all five readers for an order by name.
   - Considered: a table of parts against plates (unreadable from about sixteen plates); parts under their kinds
     (three works have a kind for every two parts); no last page.
   - Chosen because: the page's length follows the parts and the few plates of each, and a name is what a
     question from the room gives.
   - Applies to: every edition.
5. Four facts stand under the index, and none beside the contents.
   - Rests on: the research page, finding 9, where each fact of the released contents stands after the Change.
   - Considered: the facts kept beside the contents; the model's digest and the acceptance under the index.
   - Chosen because: the title page states the subject, release, editors, licence and publisher, and every page's
     foot the revision and date; a digest cut to fit verifies nothing and stands whole in the manifest; an
     edition is typeset before it is accepted, and the acceptance has its own page.
   - Applies to: every edition.
6. Names are compared word by word, a word in Latin letters or digits before any other.
   - Rests on: the research page, finding 6: one name stood before another against the stated rule.
   - Considered: the whole name collated in the model's language.
   - Chosen because: a reader finds the Latin names together, whatever follows their first word.
   - Applies to: the index.

## Risks / Trade-offs

- A work one plate past the cap has two pages of contents with few rows each; twelve plates give three halves of
  four. Not solved here.
- A Chinese name is sorted by its characters' readings, so a character read two ways may stand under the wrong
  one. Recorded in the research page.
- The columns of an index whose parts take several lines end at different heights.
- The page and the data are named as links beside the edition's file; no viewer was tried.
