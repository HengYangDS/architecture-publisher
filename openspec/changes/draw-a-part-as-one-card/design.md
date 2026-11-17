## Context

`docs/research/figure-language.md` maps the edition's figure language and what was measured of a part drawn as
one card; `docs/research/figure-prototypes.md` records the prototypes of the joined part (`one-anatomy`, three
levels) and their designer's findings. Today a part is drawn by one of two modules chosen by `edition.marks`:
`src/poster/strip.mjs` (label, strip, caption, the leading detail alone) or the card loop of
`src/poster/figure.mjs` (outline, bar, icon, label, every detail). The key lists the kinds with cards and the
strip's entries with strips.

## Goals / Non-Goals

**Goals:**

- One part, drawn by one module, that every later figure of the edition can reuse.
- No choice between two ways in the model, and no fallback in the build.
- No plate loses a type step to a caption that cannot break.

**Non-Goals:**

- The part's three sizes of the contract's end state: this Change draws the card. The name alone and the plate of
  one part come with `compositions` and `carriers`.
- The key in the head's free room and the page that teaches how the figures are read: the next two Changes of
  `composable-parts`.
- Fewer crossings or larger type than today: `compositions`.

## Decisions

1. A part is one card whose regions are drawn where the part has the fact.
   - Rests on: `docs/research/figure-language.md` ("The part" among the dimensions, and what was compared) and
     `docs/research/figure-prototypes.md` (`one-anatomy`: a region with no fact is left out at every level; level
     2 is the default). The owner asked for it on 2026-11-14 15:49:07, 「卡片和上述条带，难道非得是互斥的么？我觉得设计上还不
     够本质吧」, and the end state the owner agreed with in the main on 2026-11-17 states it.
   - Considered: keeping both marks and adding a third; a strip plate with the kind's icon added.
   - Chosen because: the two marks each hold half of what a part is, and a third way would leave the choice in the
     model. One card with regions holds both halves, and a part that lacks a fact simply lacks its region.
   - Applies to: every plate of every edition, with and without file facts.
2. `edition.marks` is refused by name.
   - Rests on: the model's rule that an unknown field is refused with the nearest valid one.
   - Considered: accepting and ignoring the field, with a warning.
   - Chosen because: a model that says `card` would be drawn with strips and one that says `strip` without a
     checkout would be drawn without them; a field that no longer chooses anything misleads its author. The
     refusal says what replaced it.
   - Applies to: the model's `edition` object. No published work names the field.
3. A caption may break in two lines.
   - Rests on: `docs/research/figure-language.md`, "Measured on 2026-11-16": with a caption that may break, no plate
     of the work measured is set a step smaller than with card marks, and one a step larger.
   - Considered: a shorter caption (the count alone); a smaller type for captions.
   - Chosen because: the kind and the count are two facts and both stay; a count under its kind reads as well as
     beside it, and no type is shrunk.
   - Applies to: a card narrower than its caption on one line.
4. A kind's icon stands by the kind's label, and the key lists no kind.
   - Rests on: `docs/research/figure-language.md`, "What follows": the owner's answer of 2026-11-17 01:43:24 to the
     holder's recommendation on the key.
   - Considered: the icon before the name, with every kind in each plate's key.
   - Chosen because: a mark's meaning written where the mark stands needs no looking up, and a key of fifteen
     entries in four sorts was what the owner found inelegant on 2026-11-16.
   - Applies to: every card's caption and every plate's key. The key keeps its place and its two lines here.
5. A plate is composed for compact cards, and its cards take their details where it has the room.
   - Rests on: `docs/research/figure-prototypes.md` (`one-anatomy`: the card without fact text is the default, and
     whether a whole view holds every part's text is a property of the view) and
     `docs/research/figure-language.md`, "Measured on 2026-11-17": on the eleven plates of one work, cards that set
     every detail raise crossings from 17 to 29 and route defects from 6 to 16 against today's strips and lower
     the sum of type steps from 11 to 6; cards that set the leading detail alone cost as much (29 and 13, 7);
     compact cards stand at 20 and 10 with a sum of steps of 13.
   - Considered: every detail on every card (the first build of this Change); the leading detail alone, as strips
     show today; a ranking that puts details before the type step.
   - Chosen because: any detail widens a card as far as a line of it runs, so one costs as much as all, and the
     cost falls on wiring and type, which a reader of a projected plate meets first. A plate is therefore laid
     out for its parts' names, strips, kinds and counts, and what its parts state is added only when the
     composition chosen holds it at the same type step with wiring no worse. What a part answers for stays in
     the reader file and on the page, and gets a plate of its own with `carriers`.
   - Applies to: every plate of the landscape edition. The portrait edition, made for reading, may choose
     otherwise by its own Change.
6. The edition's longest strip is 320 px, and 208 px on its shorter scale.
   - Rests on: `docs/research/figure-language.md`, "Measured on 2026-11-17": on one dense view every candidate was
     printed with what it made or why it was refused. As bare strips six parts stood in one row at the two densest
     type steps, with 5 crossings; as cards no row of six was made at any step, and the view stood at 10. A column
     of a row of six is 328 and 321 px wide at those steps, and a card is wider than its strip by twice its
     padding, 32 px. With the scale at 320 px the row of six is made again, with 5 crossings and 1 route defect.
     Neither the card's least width nor a padding of 12 in place of 20 changed that view.
   - Considered: a strip that runs to the card's edges; a smaller padding at the dense steps; a least width for
     each column in place of one for the view, which is a change of the lattice.
   - Chosen because: the scale is the one number that gives a card the footprint its bare strip had, and it is a
     token of the strip, not a change of the engine. 320 px is the longest length on the 8 px grid at which a
     strip that a row of six held bare is still held within its card; 208 px keeps the ratio for the shorter
     scale. A strip is 11 % shorter on every plate and still measures what it measured.
   - Applies to: every edition that draws strips.

## Risks / Trade-offs

- [A plate shows less of what its parts state than a strip plate, which set each part's leading detail] → Where a
  plate has the room its cards set every detail; the reader file and the page hold all of them; a part opened on
  a plate of its own comes with `carriers`.
- [A key without kinds may be asked for again] → The reading page of the next Change lists a work's kinds once; the
  key's entries are data, and one line of `legendOf` puts kinds back.
- [Every delivered plate changes] → One breaking release; the six works are rebuilt and looked at whole.
