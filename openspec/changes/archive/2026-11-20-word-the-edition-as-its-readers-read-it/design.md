## Context

See [proposal.md](proposal.md) and the research page `docs/research/contents-and-index.md`, whose finding 8 records
the reading of 2026-11-20 and what became of each of its fifteen findings. The words are one table a language in
`src/edition/words.mjs`, and the key's in `src/locale.mjs`.

## Goals / Non-Goals

**Goals:**

- Fixed words that are true of every edition and that a reader of each language reads once.

**Non-Goals:**

- The label over a work's limits. The works word their first limit as a bound in a Change of the publications,
  which is what the label promises.
- The product's vocabulary for its carriers and for what a plate does to a part ("draw"), which the same finding
  records as by design.
- The middle age band's two bounds: an age is counted in seconds, so a file seven and a half days old belongs to
  the middle band, and "8 to 90" would be untrue.

## Decisions

1. The reading note says only what holds for every edition.
   - Rests on: `docs/research/contents-and-index.md`, finding 8: a part's title links to the first of its files
     in the order it claims them, and five of six works hold between three and seven claims with no source.
   - Considered: "the file it rests on", which a card of thirty-three files does not have; "cites every claim",
     kept with a clause for the claims without a source, which makes the note's last sentence its longest.
   - Chosen because: "the first of its files" is what the link does, and "the claims' sources are on the page"
     sends a reader there without counting.
   - Applies to: the note in all five languages.
2. The key's label says what is measured, in the fewest words each language needs.
   - Rests on: the same finding: all four readers took "before commit:" and 「距提交：」 for a label that names
     a point in time and no measure.
   - Considered: one form in every language. The readers of English, Spanish and Korean read "changed before
     commit" as changes not yet committed and asked for "last"; the reader of the Chinese found 末次 stiff and
     改动 unambiguous, since the three bands exclude one another.
   - Chosen because: a label is read in its language; each says the same measure.
   - Applies to: the key's label, undated on a page and dated under a figure set alone.
3. One fact has one notation and one verb.
   - Rests on: the same finding: a commit and its date joined by a comma in the foot and by a point on the cover;
     "Written from" on the overview and "Built from" under the index; 「主题」 on the cover and 「对象」 in the
     colophon for one thing.
   - Considered: leaving each page its own.
   - Chosen because: a reader who meets one fact twice in two forms looks for a difference.
   - Applies to: the foot, the overview's line of files, and the cover's label in four languages.

## Risks / Trade-offs

- The key's label is longer in three languages, and a key refuses a third line. → The published works are built
  with it before the set that carries it is sent.
- The Spanish and the Korean were read by one reader, and no language by a person. → Each change is the one its
  reader asked for.
