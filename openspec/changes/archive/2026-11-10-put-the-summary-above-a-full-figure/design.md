## Context

See [proposal.md](proposal.md). `widthOf` in `src/poster/compose/plates.mjs` gives a view with a summary 80 or 65
percent of the body's width when its figure wires no worse there than at the full width, and otherwise the full width
with `reading: "omitted"`. The house class sets a summary beside a narrowed figure at 17 points in Source Serif 4 with
24-point leading, justified when its column holds 24 em. The engine measures and breaks figure text in Source Sans 3
and Noto Sans CJK SC with the deterministic rules of `src/breaks.mjs`, and the edition sets each line at the engine's
position, refusing a line Typst sets wider than measured with `edition_text_wider`.

Measured with the composition functions of 0.10.2, read-only, on the six works at publications `b774089`:

| Figure                                                        | Plates of the 21 that wire no worse than at the full body |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| 80 percent of the width (today's rule)                        | 0                                                         |
| Full width, 90 percent of the height                          | 17                                                        |
| Full width, the height a 32 em standfirst at 17 points leaves | 17                                                        |
| Full width, 85 percent of the height                          | 14                                                        |

The four that still do not fit are archpub's "Print edition" and filmkit's "Sound" and "Picture" in English, and
filmkit's "Film" in Chinese. At 17 points within 32 em, an English summary takes three or four lines and a Chinese one
two or three.

## Goals / Non-Goals

**Goals:**

- Every plate that can keep its wiring sets its view's summary: 78 of the 82 plates of the published works.
- One summary type across the edition: 17 points, Source Serif 4, 24-point leading, at most 32 em to a line.
- No plate wires worse than it does today.

**Non-Goals:**

- Changing how the engine wires a figure; the 19 figures with defects at the full width keep them.
- A fixed number of plates: 78 of 82 is the measured expectation, not a gate. The rule decides each plate.
- Balancing a plate's ink: blank areas and centring are a separate change.
- The four plates that cannot keep their wiring: they leave their reading out, as today.
- Listing where each part lives under a standfirst.

**Anti-goals:**

- Lines longer than the house's 32 em measure, or type smaller than 17 points, to fit a summary.
- A summary overlapping the figure.

## Approaches

- **A. The summary above a full-width figure (chosen by the owner).** The figure keeps the width at which it wires
  best and gives up height. Measured: 17 of 21. Changes only the width rule, the record and the house class.
- **B. Fewer wiring defects at the full width.** It would help every plate, but it changes the channel solver; how many
  plates it would free is unknown. Left for later.
- **C. Allow a few more route defects in exchange for a summary.** It trades faults a reader sees for text. Rejected.

The owner chose A, and then 17 points within 32 em over the trial's 15 points across 960 points, whose lines ran to
about 140 characters.

## Decisions

- **The engine breaks the standfirst into lines and the edition sets them as given.** The engine also loads Source Serif
  4 at 400 with Noto Sans CJK SC at 400 as its fallback, the faces Typst sets the summary in, and wraps the summary with
  its own rules into lines no wider than 32 em at 17 points (544 points). The figure's height is then exact before the
  edition is typeset: no estimate, and no second pass through Typst. The edition sets each line at its baseline and
  refuses one set wider than measured with `edition_text_wider`, as for a figure's text.
- **Flush left.** Justifying lines the engine broke greedily, without hyphenation, would stretch some word spaces past
  the house's limits; a standfirst of three or four lines reads well ragged. Beside a figure the summary stays
  justified.
- **Reserved height: the standfirst's lines at 24 points each, and 16 points more before the figure.** This is the
  height the measurement above used; changing it changes which plates fit and needs measuring again.
- **The engine breaks as Typst does for these summaries.** The measurement counted lines with Typst breaking flush
  left, at spaces for Latin text and between characters for Han; none of the 21 summaries holds a hyphen or a slash,
  the one place Typst would break where the engine does not. The engine adds the space Typst sets between Han and Latin
  text, and a test holds the two to the same line count for every summary of the plates that leave their reading out
  today. A count that still differs moves only that plate between "above" and "omitted"; acceptance reports it.
- **The standfirst sits in the title's column.** It starts at the claim column (124 points), the left edge of the title
  and the question, with its first baseline 24 points below the body's top; the figure is placed at the body's bottom.
- **A plate tries the standfirst only after narrowing fails.** The order is: 80 percent, then the standfirst, then the
  reading left out. A plate that sets its summary beside the figure today keeps doing so, byte for byte.
- **`reading: "above"`.** The plate's record carries the standfirst's lines and the figure's height; `archpub check`
  prints "its reading above the figure" where it prints "beside its reading" for a narrowed plate.

## Left to the builder

- How the engine's typefaces expose a serif style beside the figure styles.
- Names of the new record fields and of internal functions.
- The exact wording of the check line, within the meaning above.

## Risks / Trade-offs

- [Typst sets a line of the standfirst wider than the engine measured it] → The edition refuses it with
  `edition_text_wider`; the faces are the same files, as for figure text.
- [Each plate that cannot narrow is composed once more, at the reduced height] → One more composition for 21 of 82 plates;
  the build measures how long it takes.
- [The engine's breaking differs from Typst's for a script it does not break the same way] → It sets the engine's lines
  as given, so Typst does not break them again.
