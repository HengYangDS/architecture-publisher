## Why

A Chinese note in a narrow column of the overview is spread to the column's edge, each line opened by up to three
tenths of an em at each place. Of the 72 lines that are not a note's last on the six Chinese overviews, 19 open more
than a tenth of an em, and a reader of another origin named eight first lines whose characters stand visibly apart
beside the notes around them. The line that cannot be spread is named to its author, and twelve notes of four works
were reworded on 2026-11-18 so that their lines fill; a second reader faulted five of the twelve.

A committee of three seats was asked for a rule (`docs/research/narrow-notes-committee-2026-11-18.md`). Each seat
alone, and all three after a second round, chose that a note be justified to its own longest line. The owner saw
the comparison and took it on 2026-11-18 at 18:44.

## What Changes

- A text written without spaces between words that takes more than one line in a column narrower than twenty ems
  is justified to its own longest line: a shorter line but the last is spread to it where that opens a tenth of an
  em or less at each place, and is set as it is otherwise. Its breaks stay. Notes side by side no longer end at
  one right edge.
- Of the settings on the fewest lines, one that leaves no line before the last to a single character is taken
  first. One note of the six works read 单 / 个 Content-Length， and now reads 单个 / Content-Length，.
- No line of such a note is named to its author. `overview_line_loose` stays for a measure of twenty ems or more.
- The requirement on the page's module says which text ends on it: one justified to its column.
- The release 0.15.0 is recorded: `VERSION`, the files the version tool writes, and the changelog's date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: "A note without spaces justified to its own measure" is added; "Running text justified", "A
  line that cannot be spread is named" and "Texts on one module and one grid of baselines" change.

## Impact

- Source: `src/overview/house.typ` (the setting of a text line by line), `src/overview/typeset.mjs` (the bound it
  hands the class), their tests.
- Documents: the model reference, the changelog, one research page, `VERSION` and what the version tool writes.
- The published works: their overviews' statements keep their authors' wording when they move to this release;
  the twelve rewordings of 2026-11-18 are not carried into the publications.

Queue: `overview`.
