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

### Details of such a language wrap as a paragraph

The engine keeps a list's items whole when it wraps a detail, which suits lines set flush left and
leaves a line short by up to an item. Set so and then spread, `包括：setup、use、sync、check、status、`
would open 0.37 em in each place. In an edition written without word spaces a detail is wrapped
as a paragraph instead: a line breaks wherever the script allows, between two Han characters and
at a space, never inside a word of letters. A line of Han then ends within a character of its
measure. An item of Han may break across two lines, as any phrase of a Chinese paragraph does.
Editions in other languages keep their items whole.

### Lines to be spread are filled by the width Typst sets them in

The engine measures a text one face draws whole in that face. The CJK face draws Latin letters and
digits too, so a line with Han in it is measured in the CJK face alone, while Typst sets each
character in the first face that draws it: letters and digits in Source Sans 3, which is narrower.
The first build showed the cost. `存放：Archify、LikeC4 解析器、` measured 349 px in a 365 px measure
and was set in 321 px, so the line broke a character early and spreading it opened 0.22 em in each
of its eight places.

The engine gains the typeset width of a line: each character in the first face that draws it, a
quarter em where Han meets a letter or digit, and a full-width mark in half its width where it ends
or starts the line or stands beside another, the rules the summary's serif lines already follow.
In an edition written without word spaces a part's details are filled by this width and their
boxes are checked by it. Each line of details reports this width as its own, spread or not, so the
class holds Typst to what the engine laid out: reporting the CJK face's wider measure would let a
last line Typst set wider than its measure pass unseen. Every other run reports the engine's own
measure, as before.
Alternative rejected: measuring all text by the typeset width, which would move every label and
box of every Chinese edition for a change that concerns details.

### The house faces are measured with their own kerning

The font reader the engine measures with applies no kerning for Source Sans 3 or Source Serif 4:
their `kern` feature points at extension lookups (GPOS lookup type 9), which the reader reports as
unsupported. Typst kerns 1,787 of 14,400 pairs of 120 characters in the regular weight. Most it
sets closer, which left the engine's width the wider and safe. Some it sets apart: an opening
bracket before a j by 0.08 em, a closing bracket after an f by 0.049 em, a period before a j by
0.026 em. The class refuses a run more than half a point wider than the engine measured, so 0.13.1
refuses `format: (json)` at the largest type step, and a line filled to its measure could be set
wider than it.

The engine now reads each house face's pair adjustments itself, from the lookups of the `kern`
feature in the Latin script's default language, pair and extension lookups in both formats, and
adds them to the advances the reader gives. Against Typst 0.15.1 it agrees on all 14,400 pairs but
three in each weight of the sans and six in the serif: `ff`, `ft`, `fi`, `fj`, `fl` and a doubled
interpunct, which Typst sets as ligatures or closes up, and where the engine is the wider. A
further 114,510 pairs in each face, of accented Latin letters, typographic marks, Greek and
Cyrillic with each other and with ASCII, agree but for the doubled interpunct. Source Serif 4's
`kern` feature names one lookup more, a contextual one that closes up the interpunct of a Catalan
`l·l` by 0.29 em; the engine does not read it and measures such a word the wider, as Typst's own
width of `col·lecció` confirms. No pair subtable of a house face gives the second glyph a value,
so a run's kerning is the sum over its pairs. On 218 lines of the six publications works the
typeset width is now within 0.011 em of Typst's, 0.26 px at the largest step, inside the class's
half point.

Alternatives rejected. A newer font reader: 2.0.0 is the latest release. Changing the bundled
reader: it is vendor source, pinned by digest. Filling spread lines a tenth of an em short of
their measure and leaving kerning unread: tried, and it turned details that had fitted one line
into two, the second a single character. A wider allowance in the class: it would let a wrongly
measured run through.

### A line's slack is at most a tenth of an em for each place it opens

Typst opens a justified line after each character written without word spaces and at each space,
not inside a word of letters and not after the line's last character. It gives each space up to
half its width first, a tenth of an em in Source Sans 3, and shares the rest of the slack evenly
among all those places; two built lines, read back from their PDFs, are set so. A line is spread
only when its slack is no more than a tenth of an em for each place it opens. Between two Han
characters it then opens a tenth of an em at most, and at a space up to as much again.

JIS X 4051 lets a line add a quarter em between characters at most, and the W3C's Requirements for
Japanese Text Layout (3.8.4) and for Chinese Text Layout (6.2.2) follow it; that is a ceiling for
body text in a full measure. A part's details are two or three short lines over a last line set
tight, and there the eye compares them. Three readers went through the 41 plates of the six works
built at a limit of a fifth of an em: lines whose slack came to 0.12 em a place and more they
called clearly or badly loose, as `操作：发现、收敛、规划、应用、` at 0.14 em, and lines at 0.085 em
and less slightly loose or even. A sheet of the borderline lines, set flush left and spread side
by side, agrees.

Of the 216 lines the six works could spread, 165 are within the limit and are spread: they open
0.09 em at most between Han characters, 0.023 em at the median, and 0.19 em at most at a space.
The other 51 stay flush left: lines broken before a long word in another script, which have few
places to open, and five that gave their last unit to the line below.

Alternative rejected: a least share of the measure a line must fill, the first draft's nine
tenths, which let a line with few places open 0.23 em while it kept a line with many places flush
left that would have opened 0.15 em.

### A detail's last line does not hold one character alone

Wrapped as paragraphs, 13 of the 199 details of more than one line in the six works ended on a
line of one Han character, as `观测：主机上的客户端和路径，只看不采` over `纳`. Chinese setting does
not leave a line to one character; the Requirements for Chinese Text Layout (7.1.2) name it an
orphan and move the last character of the line above down to it. The engine does so as it wraps a
detail: a last line of one character written without word spaces, with or without the marks beside
it, takes the unit before it, a character or a whole word of letters, where the two fit the
measure.

The line above is then a unit short and is spread like any other line. Eight of the thirteen
still are, their slack 0.045 to 0.092 em a place. Five would need 0.107 to 0.234 em a place and
stay flush left, 1.0 to 2.6 ems short of their measure, over a last line of two characters or of a
word and a character. Set side by side with what they replace, four of the five make whole a word
the break had cut, `文件`, `另选`, `事实` and `npm 包`, and the fifth breaks `检查图` a character
earlier. Alternative rejected: moving the unit only where the line above can still be spread,
which keeps five orphans to keep five right edges.

### A strip part's counts end where its spread lines end

A strip part's counts are set flush right at the box's edge by their measured width. Measured in
the CJK face alone they stood some 7 px short of the edge, beside spread lines that reach it. In an
edition written without word spaces they are placed by their typeset width, which their run
reports.

### The text block's measured width

A part whose details hold a spread line reports its text block at the measure, and any other
detail line of such an edition at its typeset width, so the balance gates measure what is drawn.

## Risks / Trade-offs

- [Typst measures a line wider than its measure and wraps it] → the class sets a line already as
  wide as its measure as it is, and refuses one wider by more than half a point with
  `edition_text_wider`, the allowance it gives any run.
- [A face's kerning uses a lookup the engine does not read] → the test holds the engine's widths to
  Typst's for lines of the bundled faces, in three weights; a changed face fails it.
- [Kerning moves a label's width, and with it a box and a plate's layout, in every language] → the
  twelve editions of the six works are composed from this Change and from dev and compared; the
  count is in the tasks.
- [A part's details mix spread and flush-left lines] → a flush-left line among spread ones is a
  short line before a long word or above a rescued orphan, as a paragraph's last line is short.

## Migration Plan

None. Chinese editions are rebuilt with the release that carries this.

## Open Questions

None.
