## Context

See [proposal.md](proposal.md). The kit is in the checkout's ignored `build/runtime/work/parts-index/` (`PLAN.md`,
the sample's copy and works, `20261125-parts-index-sample/`). The research is `docs/research/contents-and-index.md`.

## Goals / Non-Goals

**Goals:**

- A reader of the edition learns what a part is and what it relates to one link from the plate, and goes on to
  its source one link further.

**Non-Goals:**

- A page a part: the owner ruled it out.
- A part's details on its card: the queue's `composable-parts`.

## Decisions

1. The index is the part's place, a short paragraph each.
   - Rests on: the owner's choice of 2026-11-25 18:06 among three forms, and the sample of AIGW Client and ETHOS
     (`docs/research/contents-and-index.md`).
   - Considered: a hover or an icon on the plate (links work in every PDF reader, hovers in few); a page a part
     (ruled out); the index as it was (names and plates only).
   - Chosen because: one link from the plate, the way back the reader's own; the index already names every part.
   - Applies to: `editionRecord`, `_index`.
2. A card's title links to its paragraph; the paragraph's paths link to the source.
   - Rests on: the sample; the plate had one link a part, to its first file, which said nothing of the part.
   - Considered: the title to the source and a second mark to the index (two links on a short name).
   - Chosen because: one link a name, and the source stays two links away with every path the part claims, not
     only its first. A folder's address under GitHub's template redirects to its tree (checked 2026-11-25); under
     another host's template it is not checked.
   - Applies to: `editionRecord`, `_plate`, `readingNote`.
3. A paragraph lists 24 paths at most and counts the rest; one taller than a page is refused.
   - Rests on: the published works: the largest part claims 20 paths, the most connected 16 relations.
   - Considered: every path (a part of 400 paths took a page alone); a paragraph across two columns.
   - Chosen because: every published part stays whole, and the reader file and the data hold every path. The
     number is the house's `indexPaths`. A path wider than the column breaks after its slashes, as a reader splits
     it; a part between two slashes wider than the column is refused, since no break there reads as a path.
4. A paragraph's rows are as tall as their term or their text, whichever is taller, and alike relations are said
   once.
   - Rests on: the Change's independent review, which found a long detail name overprinting the next row and two
     relations of one label and end listed twice.
   - Considered: a cap on a detail name's length (the schema allows 64 characters, and one wraps at a quarter of
     the column).
   - Chosen because: the measure follows what is drawn; two relations alike say one thing.
   - Applies to: `_index`, `editionRecord`.
   - Applies to: `house.json`, `editionRecord`.
5. A part with nothing but its name and plates keeps the index's line; the rest of a paragraph stands at the
   text's pitch, a detail justified where it wraps.
   - Rests on: the index's pitch requirement and the house's rule that a text of more than one line is justified.
   - Considered: every paragraph on the index's grid (a detail would stand 36 points from the next).
   - Chosen because: a short index reads as before, and a paragraph as prose.
   - Applies to: `_index`.

## Risks / Trade-offs

- The index takes more pages: in the sample, AIGW Client's from one to two and ETHOS's from two to four.
- A card's title no longer leads straight to the source: the source is two links away, with every path the part
  claims instead of its first.
- A folder's link relies on the host's browser redirecting a file address to its tree: GitHub's does (checked
  2026-11-25); another host's template is not checked.
- A paragraph taller than a page's body is refused (`edition_index_too_long`); no published part comes near it (the
  largest claims 20 paths, the most connected has 16 relations).
