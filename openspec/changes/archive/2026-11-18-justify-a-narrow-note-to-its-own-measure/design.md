## Context

`draw-the-overview-from-the-model` sets a text written without spaces line by line (`_filled` and `wrapped` in
`src/overview/house.typ`): on the fewest lines, broken where the loosest line opens least, every line but the last
spread to the column's edge within three tenths of an em at each place (`OVERVIEW_OPENING` in `src/breaks.mjs`),
and a line that cannot be is named with `overview_line_loose`. English in a column under twenty ems is a caption:
justified to its own widest line, or flush left on even lines.

Measured on the six Chinese overviews, in columns under twenty ems, on 2026-11-18: 55 notes of more than one line,
72 lines that are not a note's last.

| How far a line opens at each place, in ems | 0.05 or less | to 0.10 | to 0.15 | to 0.20 | to 0.30 | over 0.30 |
| ------------------------------------------ | ------------ | ------- | ------- | ------- | ------- | --------- |
| spread to the column's edge                | 29           | 24      | 2       | 11      | 6       | 0         |
| the same breaks, to the note's own longest | 63           | 4       | 1       | 3       | 1       | 0         |
| a caption's even breaks, to its longest    | 59           | 5       | 0       | 3       | 3       | 2         |

With the wording the authors had before the rewordings of that day, the rule of then leaves 14 lines unspread, each
named to its author.

## Goals / Non-Goals

**Goals:**

- The characters of a short note stand as close on every line as on its last.
- No author rewords a note so that a line fills.

**Non-Goals:**

- Breaks that know words. The pages still break 输入相 / 同 and 辅 / 导; the publisher has no list of words. To be
  measured with the texts of `edition-map`.
- A change to English captions, to text in a measure of twenty ems or more, or to a part's details on a plate.

## Decisions

1. In a column under twenty ems, a text without spaces is justified to its own longest line, within a tenth of an
   em at each place.
   - Rests on: `docs/research/narrow-notes-committee-2026-11-18.md`: three seats, each alone and then together; the
     owner, who saw the comparison and took it on 2026-11-18 at 18:44.
   - Considered: the column's edge within three tenths of an em (19 of 72 lines open more than a tenth, and a
     reader sees it); every line spread to the note's longest however far (a note of four lines opens two of them
     again, up to 0.23 em); a caption's even breaks (a note ends 2.3 em short of its column at the median, 31 of 55
     by more than two ems, and breaks fall inside words more often).
   - Chosen because: within a tenth of an em a reader does not see a line opened, which is the bound a part's
     details keep on a plate; 67 of 72 lines reach their note's longest line within it, and a note ends 0.39 em
     short of its column at the median, 1.64 em at the most.
   - Applies to: `_filled` and `wrapped`. The class takes both bounds from the publisher (`breaks.json`): the one of
     a wide measure and the one a part's details keep (`SPREAD_OPENING`), which a note in a narrow column now
     shares. The measure is the longest line as set, the last included. A line that would open more, or has no
     place to open, is set as it is.
2. Of the settings on the fewest lines, one that leaves no line before the last to a single character is taken
   before one that does.
   - Rests on: the six pages drawn with the authors' wording, where one note read 单 / 个 Content-Length，: the search
     weighs how far a line would open, and a line of one character and a line of one long word both cannot open.
     The rule of before named that line to its author. The committee took the amendment in its second round, and
     refused an added line as a way to avoid it.
   - Applies to: the search's order (the count of such lines, then the loosest opening, then the sum), and the
     comparison with the lines filled in turn.
3. `overview_line_loose` is reported only for a measure of twenty ems or more.
   - Rests on: the committee. Two seats signed dropping it for a narrow note; the third had proposed that in the
     first round and offered in the second to sign a diagnostic that asks nothing of an author, which the seat
     that first proposed it had left. All three keep the rule of a wide measure as it is.
   - Chosen because: the warning's one use was to have a note reworded, and five of twelve rewordings were faulted.
4. The release 0.15.0 is recorded in this Change.
   - Rests on: `CONTRIBUTING.md` (Release): a release lands like any change.
   - Applies to: `VERSION`, `node tools/release/version.mjs --write`, the changelog's `Unreleased` notes dated.

## Risks / Trade-offs

- Notes side by side end at different right edges, which strains the owner's repeated request for two aligned
  edges → every seat said so, the owner was shown both settings on whole pages and enlarged, and took this one.
- A tenth of an em was judged on this house's faces at 11 and 12.5 pt → it is one value in `src/breaks.mjs`.
- The works' statements were reworded for the rule of before → the publications take the authors' wording when
  they move to the release, in their own Change.
