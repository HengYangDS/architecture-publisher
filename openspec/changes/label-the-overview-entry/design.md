## Context

See [proposal.md](proposal.md) and the research page `docs/research/contents-and-index.md`. The left half of the
contents' first page is a list of blocks, each with a head on its first baseline and a body under it, each under
a rule across the half; the overview's entry is the first of them and a link to the overview's page.

## Goals / Non-Goals

**Goals:**

- An overview's entry that no reader takes for a plate.

**Non-Goals:**

- The plates' rows, the number of rows a half, the index and the overview's own page.
- The label `plate-00` and the image `00-overview.png`, which name the overview's page in files and links, not on
  a page a reader reads.

## Decisions

1. The entry's head is the overview's name in the tracked capitals that head the other blocks of the half.
   - Rests on: the house class gives a plate's number one size, face and colour, in the contents and in the index,
     so that a number read in one is found in the other; 00 in that form claims a plate. Contents of more than
     one page count the plates without the overview.
   - Considered: the number kept and set in the colour of the notes; the name alone in the size of a row's title.
     The first still reads as a number among numbers; the second sets the entry level with the rows and
     unlike the three blocks under it.
   - Chosen because: the left half then reads as one column of four blocks, the overview's first, and the claim
     under the name keeps the entry's weight.
   - Applies to: every edition whose model states an overview, in every language.
2. The record's entry keeps its key and loses its number.
   - Rests on: the number was read by the contents alone.
   - Chosen because: a field that nothing prints is a second statement of the label.
   - Applies to: `src/edition/record.mjs` and the test that states the record.

## Risks / Trade-offs

- The first block of the left half and the first row of the right no longer share a form. The claim, set large,
  still marks the entry as the page's first.
