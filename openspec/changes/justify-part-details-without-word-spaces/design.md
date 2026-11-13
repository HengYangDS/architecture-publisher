## Context

The engine breaks a part's details into lines and reports each line as a run with its position and
measured width; the house class sets each run at that position and refuses a run Typst measures
wider than the engine did. Readings are Typst paragraphs and are justified by the class. Before
0.12.0, justifying English details in these columns opened word spaces to 1.6 to 2.2 times, so
figure text stayed flush left in every language.

## Goals / Non-Goals

**Goals:**

- A Chinese edition's part details share one right edge, as its readings do.
- No line is set visibly loose.

**Non-Goals:**

- Justifying details in languages that separate words by spaces.
- Justifying names, captions, relation labels, tier labels or paths.
- The page (HTML), which Archify sets.

## Decisions

### The language decides, by how it is written

A locale is marked as written without spaces between words; `zh-CN` and `zh-TW` are. The rule is
about the script, not about one language, so another such locale takes it by its mark alone.

### The engine keeps its lines; Typst spreads them

The engine's line breaks stay, since boxes, gates and the text check depend on them. A run that is
to be spread names its measure, and the class sets it in a box of that width with a justified
paragraph ended by a justifying line break. A prototype with the house faces showed the spread
line on the same baseline as the run it replaces, with no added height, and Typst closing up
full-width punctuation as it does in readings. Alternative rejected: tracking computed by the
engine, which would duplicate Typst's justification and drift from it.

### Every line but a detail's last, to the details' measure

The measure is the width the engine wrapped the part's details to, so the lines of all of a part's
details end on one edge. A detail's last line stays flush left, as a paragraph's does.

### A loose line stays flush left

The same prototype set a line filling 97 percent of its measure with no visible spread, one at 86
percent visibly open, and one at 76 percent, or a mixed line with a long Latin word at 73 percent,
loose. A line is spread only when it fills at least 90 percent of its measure. A greedy break of
Chinese text leaves less than one character of slack, so nearly every line qualifies; a line broken
early before a long Latin word does not.

### The text block's measured width

A part whose details hold a spread line reports its text block at the measure, so the balance
gates measure what is drawn.

## Risks / Trade-offs

- [Typst measures a line wider than its measure and wraps it] → the class refuses the run with
  `edition_text_wider`, as it refuses any run wider than the engine measured.
- [A part's details mix spread and flush-left lines] → the threshold makes it rare; a flush-left
  line among spread ones is a short line, as a paragraph's last line is.

## Migration Plan

None. Chinese editions are rebuilt with the release that carries this.

## Open Questions

None.
