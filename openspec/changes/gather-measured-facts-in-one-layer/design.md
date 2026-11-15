## Context

See [proposal.md](proposal.md). This Change serves the queue item `fact-layer`, the first Change of step 3 of the
design kept in `openspec/changes/archive/2026-11-14-queue-the-roadmap-and-name-roles/design.md`, called the design
below. The design's row for the step reads: "moves derived facts out of `src/poster/strip.mjs` into a separate
layer and sets up the property catalogue; a pure refactoring; at its end it measures without drawing how many of
the 41 views do not fit at the fullest detail level". Its acceptance is "zero change by the step 2 definition" and
its stop line "If the layout or typesetting engine would need rewriting, stop and re-estimate".

It starts from the state `line-table` left: a relation's cited files are a number, lines into a view's hub are
heavy, ticks are gone, the module that draws a figure's lines is `src/poster/lines.mjs`, and
`archpub compare <delivery> <delivery>` exists.

Today a plate's facts are measured in four places. `src/style.mjs` (`editionStyle`) builds each part's files with
their bytes and age bands, the largest part's bytes, the bands and the pin's date, and hands them to the drawing
as fields of the style. `src/poster/strip.mjs` measures a group's files (`partOf`), the edition's scale (`scaleOf`), a
part's number of files, a file's share and the bands a view shows; `src/poster/lines.mjs` measures a relation's
cited files (`citedFiles`) and a view's hub (`hubOf`). `src/build.mjs` (`commitFacts`) and `src/sources/bind.mjs` each read the
pin's date and time. `src/edition/record.mjs` and `src/map/explainer.mjs` take a part's first file from the
binding.

## Goals / Non-Goals

**Goals:**

- One unit measures every fact a plate draws that its author did not state, and each fact says what it is a fact
  of, in which unit, and whether it was measured or stated.
- The drawing code, the edition's record and the page read that unit and measure nothing, and a test can fail on
  it.
- Every delivered byte of the twelve editions stays as it is.

**Non-Goals:**

- The edition as data, the reader file, the evidence table and any new field of the manifest or of
  `archpub check --json` (`reader-and-data`).
- The single anatomy of a part, the hub's annotation on its part, three levels of detail (`one-anatomy`).
- Questions, written statements, line ranges, strength, and `source` in the model's schema (`model-four`).
- Scales, missing values and the row "source: stated, measured" of the value table; a channel that shows origin
  on a plate.
- Facts no plate draws today: coverage, currency and the re-pin worklist stay in `src/sources`, and a plate's
  layout measures stay with the plate.
- Any change to `src/layout`, `src/plan`, `src/overview` or `src/house.json`.
- Any change to what an edition draws: the requirement "Age bands" is reworded to say what editions already do.

## Decisions

### The layer is a unit of its own, `src/facts`, that imports no other unit

`tests/module-boundaries.test.mjs` gains `facts: ["facts"]`; `build` gains `facts`; `style` loses `sources`; and
`src/sources/ages.mjs` moves to `src/facts/ages.mjs`, because sorting an age into a band reads nothing from Git.
The layer takes the model, the binding and the pin's commit facts as values. Rejected: a module of `src/sources`,
which reads Git and which `poster` may not import, so the hub and the count could not live there without widening
the table; `src/style.mjs`, where half the facts sit today, because the style is the choice of marks and palette
and the design moves it beside the model in `model-four`; and a module of `src/poster`, because the edition's
record and the page read the same facts.

### Two stages: the edition's facts before the plan, a view's facts for each planned view

`src/build.mjs` plans views inside `withStripLength`, and admitting a view lays it out with its strips, so a part's
bytes are needed before any view exists. An overview's parts and relations exist only after planning: a group
drawn as one part, and a relation that stands for several (`relation.relations`). So `editionFacts(model, binding,
commit)` holds parts, groups, the scale, the pin and the files read, and `facts.view(view)` holds the hub, each
relation's cited files, each part of the view and the bands it shows, cached by the view as `src/poster/plate.mjs`
already caches layouts. Rejected: one pass after planning, which the admission cannot wait for; and measuring a
view's facts for every possible view beforehand, which would have to know the plan's rules.

### The facts travel in the scene the drawing already receives

The style object handed to `admitsView` and `composePlates` carries `facts` in place of `parts`, `most`, `bands` and
`reference`. The drawing units import neither `src/facts` nor `src/sources`; their rows of the import table stay as
they are. Rejected: letting `poster` import the layer and call it, after which the table could not tell reading a
fact from measuring one with other inputs. With cards and no checkout the edition's facts hold what the model
alone gives, as `scaffoldGuide` needs.

### A fact is a value with its property, subject, unit and origin; the catalogue lists each property once

The design asks for a catalogue "that states name, measure, unit and source" and for every value to be "marked
stated or measured". A fact is `{ property, of, value, unit, origin, from }`. `origin` is `measured` or `stated`.
`from` says what a measured value was measured from: `pin` (bytes, ages, date, release, ownership resolved at the
revision) or `model` (a count or a choice the tool makes over what the author stated: cited files, the hub).
Without a checkout a part's files are the declared paths (`declared` in `src/sources/bind.mjs`), and their origin is
`stated`. Rejected: the five origins the binding table of the trials uses (stated, measured, derived, layout,
stated outside the model): a choice of the layout is no fact of the system, and "derived" is a measure taken from
the model. Rejected also: the word "basis" for `from`, which the design keeps for the category of evidence.

The catalogue's rows, each with one figure-reading question of `trials/screen/binding-table.md` where a plate
draws it:

| Property        | Fact of        | Unit            | Origin, from                      | Drawn as                              |
| --------------- | -------------- | --------------- | --------------------------------- | ------------------------------------- |
| `owned-files`   | part, group    | files, paths    | measured, pin; stated without one | caption's count; first file's link    |
| `owned-bytes`   | part, group    | bytes           | measured, pin                     | strip length; caption's size (Q3)     |
| `file-share`    | file of a part | ratio           | measured, pin                     | a segment's width                     |
| `file-age-band` | file of a part | band 0, 1 or 2  | measured, pin                     | a segment's dye (Q4)                  |
| `largest-part`  | edition        | bytes           | measured, pin                     | the scale of every strip; key sample  |
| `pin-date`      | edition        | date            | measured, pin                     | the key's commit date; the foot (Q14) |
| `pin-release`   | edition        | release name    | measured, pin                     | the foot and the title page           |
| `files-read`    | edition        | files           | measured, pin                     | the contents' facts                   |
| `cited-files`   | relation       | files           | measured, model                   | the number on a line (Q7)             |
| `hub`           | view           | part id or none | measured, model                   | heavy lines; the key's entry (Q10)    |
| `bands-shown`   | view           | set of bands    | measured, pin                     | which band entries the key holds      |

The two spans of the age bands are the definition of `file-age-band` and stand in the catalogue with it, in
seconds as the manifest records them.

### The drawing keeps the mapping from a fact to a mark, in today's order of arithmetic

Measuring leaves the drawing; binding stays. `src/poster/strip.mjs` keeps `lengthOf` (bytes on the scale to px,
the 2 px floor, the 40 px outline), the merging of segments under a seam, the caption's rounding to kilobytes, the
key's round sample and the bands' names in days. Each expression keeps its operands and their order: a strip is
`(longest * bytes) / scale` and a segment `length * share`, so the layer hands over `bytes`, `scale` and `share`
and never a product the drawing used to form another way. Rejected: handing over a part's fraction of the scale,
which is shorter and can differ in the last bit of a float, and with it in a rounded width. The design's words are
"`details` cannot be bound": nothing here binds a detail.

### One refusal changes its precedence

The layer needs the pin's commit facts before the style is chosen, so `commitFacts` runs before `editionStyle`. A
model that claims and cites no file, asks for strips and names a revision its checkout lacks was refused with
`marks_need_files`; it is now refused with `source_revision_unknown`, as every model that claims files already is.
The same holds for any other refusal the reading of the pin raises for such a model. A model that was built is
built as before, and one that was refused is refused still. Rejected: reading the binding's state in the style to keep the old order, which
is the measuring this Change removes.

### The pin is read once

`commitFacts` in `src/build.mjs` reads the pin's date, time and release whenever a checkout and a revision are
given; `resolved` in `src/sources/bind.mjs` reads date and time again when files are bound. The layer holds the
pin once, from the commit facts, and computes ages from that time; `pinTime` and `pinDate` leave the binding.
Both readings call `commitTime` and `commitDate` of `src/sources/git.mjs` on the commit `commitOf` resolves from
the same revision, so the values are equal. Rejected: keeping both and asserting equality, which keeps a fact in
two places.

### The edition's record and the page read ownership from the layer; nothing else is shared

`src/edition/record.mjs` links a part's title to its first owned file, and `src/map/explainer.mjs` cites the same
file; both take it from the binding's `owned` today. The layer holds a part's files in claim order for these two
and in path order for the strip's segments, as the two readers use them now. The page shows no size, age, count
or hub, so it reads nothing more. The places a plate's reading lists (`record.mjs`, "as the model claims it") are
the author's own paths and stay read from the model: they are stated, and printed as stated.

### No new output

The design's budget lets the manifest's version rise at most twice through the roadmap, in steps 3 and 6, and
gives step 3's rise to its second Change. So the manifest, `archpub check --json` and the delivery are unchanged,
and the style record (`bands`, `reference`, `longest`) is written from the layer with the same keys and values.
Rejected: a `facts` field in the check's result now, which would be the data file of `reader-and-data` under
another name.

### "Measures nothing" is held by three tests

1. The import table: no drawing unit may import `sources` or `facts`.
2. A search driven by the catalogue: each property names the function that measures it, and no module outside
   `src/facts` defines or calls a function of that name. The old names (`citedFiles`, `hubOf`, `partOf`, `scaleOf`,
   `bandOf`) are in the list, so a copy put back fails.
3. Substitution: a plate, the edition's record and the page's draft are built from a layer with deliberately false
   values (a hub the relations do not have, nine cited files where the model names none, a part of 1000 bytes
   whose files hold 100000), and each shows the false value. This is the design's replacement test and its
   invariant 4 turned on the layer: "change one fact, and exactly the matching channel of the matching mark
   changes".

Rejected: a search for expressions such as `.files.length` in the drawing, which also matches the reading of a
stated list and misses a count written another way.

### Byte equality is proved by `archpub compare` on the twelve editions, base against head

The design's definition of done for an invisible step is "equal digests under the comparison command's
definition". Each of the six works is built in both languages by the lane's base and by its head, on one host,
with the work's checkout at its pin and `SOURCE_DATE_EPOCH` set to one value, with its page and its images at 960,
1920 and 2400 px, into new directories; each pair goes to `archpub compare`, and all twelve must report identical.
The comparison's definition leaves out the three files `accept` writes after a build and nothing a build writes.
Before that, the base is built twice for one work: if the two base builds differ in anything, the proof stops and
the finding goes to the queue. The Change bumps no
version, because the manifest and the edition's byline print it.

### The closing measurement is a scratch run that lands nothing

The design asks that the Change "measures without drawing how many of the 41 views do not fit at the fullest
detail level". The levels of detail are defined by `one-anatomy`. Here the fullest level is read as: label, kind,
strip, caption and every detail the model states for the part, where a strip plate prints the first detail only.
The measurement sizes each part's box from the layer and the typefaces' measures and asks the layout whether the
view fits, in a scratch copy; the count and the views go into `tasks.md`. Rejected: a product option that draws
every detail, which is the anatomy brought forward.

### Line counts are recorded, not gated

The design's "does not rise" line covers steps 2 and 5b. This Change records the effective lines of
`src/poster/strip.mjs`, `src/poster/lines.mjs`, `src/poster/figure.mjs`, `src/poster/plate.mjs`,
`src/poster/compose/plates.mjs`, `src/style.mjs` and `src/facts/*` before and after. `strip.mjs` shrinks by what it
measured; every new file stays under 450 effective lines.

## Risks / Trade-offs

- [A float formed in another order changes a width by its last bit, and a byte of a plate] → the rule above on
  operands; the comparison on twelve editions is the test, and a plate it lists is fixed before anything else.
- [The six works may not draw every branch: no model has groups, none states a status, no edition falls back to
  the shorter strips] → the unit tests of the layer cover groups, the overview's relations, a part with no files
  and equal sizes on hand-made models, and the existing strip tests run unchanged against the new wiring.
- [Reading the pin once changes a build with a checkout whose model cites no file: the binding has no pin there,
  the commit facts have] → strips are refused without owned files, so no age is computed in that build; a test
  builds that case and compares it with the base.
- [One measured count stays outside the layer: the number of relations an overview's relation stands for, which
  `src/plan/views.mjs` writes into the planned relation's details, and which `src/layout/placement.mjs` reads in a
  key] → named in the spec as the plan's. Moving it changes `src/plan` and `src/layout`, which this Change does not
  touch. Owner: the queue's holder; next action: decide with the draft of `one-anatomy` whether the plan's two
  written details (a group's members, a relation's count) become facts the drawing words itself; reviewed when that
  draft is written.
- [The catalogue grows into the data file] → it lists properties, not values, and nothing writes it to a
  delivery.
- [The stop line] → the layout is untouched by design; if a view's facts cannot be had without changing how
  `src/layout` or `src/plan` call the drawing, the work stops and is estimated again.

## Migration Plan

None. A delivery built before this Change and one built after it are the same bytes.

## Open Questions

None. Which key of `archpub check --json` carries the layer is decided by `reader-and-data`.
