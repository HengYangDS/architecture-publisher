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
5. A part shows every detail it states.
   - Rests on: `docs/research/figure-language.md`, "Measured on 2026-11-16": showing the leading detail alone gives
     no type step back on the plates measured.
   - Considered: the leading detail alone, as strips do today.
   - Chosen because: what a part answers for is what a card is for, and hiding it bought nothing measurable. Which
     size of a part a figure takes is a later choice of the figure, not of this Change.
   - Applies to: every card. It costs crossings on dense views, which `compositions` answers.

## Risks / Trade-offs

- [Cards are larger than strips: on the 17 Chinese plates of two works crossings rose from 26 to 38] → Recorded by
  the plates' own measures and shown with the works; `compositions` chooses a composition for dense views.
- [A key without kinds may be asked for again] → The reading page of the next Change lists a work's kinds once; the
  key's entries are data, and one line of `legendOf` puts kinds back.
- [Every delivered plate changes] → One breaking release; the six works are rebuilt and looked at whole.
