## Context

See [proposal.md](proposal.md). This Change serves the queue item `line-table`, step 2 of the design kept in
`openspec/changes/archive/2026-11-14-queue-the-roadmap-and-name-roles/design.md`, called the design below. The
design sets this step's acceptance and its stop line, lists eleven invariants of the value table, and leaves the
home of the comparison to this Change. The trial record is in the publications repository under `trials/`; its
files are cited by name. What the two halves that built this Change measured is stated here, since their working
reports are not kept in the repository.

At the base a plate's line values stand in `POSTER.wire` and `POSTER.dash` of `src/poster/tokens.mjs`, in a literal
for the boundary in `src/poster/figure.mjs`, and in the key's samples in `src/overview/house.typ`, which draws the
statuses with Typst's presets and the boundary at another pitch than the plate. `src/house.json` is read by both
the drawing code and the house class.

The item's time box is three working days from its lane's start, as the design sets it. A row whose tasks are
unfinished then leaves the table and returns to the queue, and `fact-layer` opens as planned.

## Goals / Non-Goals

**Goals:**

- One table that the figure, the key, the documents and the tests read, holding only rows the first step passed.
- A reviewer reads only the plates a change touched.
- Five of the design's invariants become tests that can fail.

**Non-Goals:**

- The single anatomy of a part, the hub's annotation on its part, and the removal of `edition.marks`
  (`one-anatomy`).
- Measured facts in a layer of their own (`fact-layer`). The hub and the citation count stay where they are computed.
- The refusal of a meaning a medium cannot express (invariant 10). The table carries what the page does for each
  row as data, and nothing refuses on it.
- A dash-dot boundary, new patterns for the lifecycle rows, or any drawing work on them.
- The smallest type of a figure, the minimum delivery width that follows from it, any new type size, and scales,
  missing values, type sizes and typefaces in the table (invariants 5, 7 and the rest of 8).
- A change of the manifest's format: the design's budget raises it in `fact-layer` and `roles-and-records` only.
- The rule that a maintenance Change changes no byte of the twelve editions: a maintenance Change of its own.

## Decisions

### Three of these decisions are the owner's

The draft's open questions were decided on 2026-11-15 by the landing owner, each as a reading that can be reversed.
A summary was put to the owner, who answered 「按你建议的方式。同意」. It named three
decisions: lines into the hub drawn as the measured cell drew them, cited files as a number in place of ticks, and
the pass line of the figure-reading check fixed before any reading. Those three are the owner's; the others were
not put to the owner one by one. One rule stands behind all of them. The queue admits "only the rows the
experiments passed", so a row is drawn exactly as the cell that was measured and read drew it, and a variant no
cell drew is a new hypothesis that is not built here.

### The table is a section of `src/house.json`

The design names `src/house.json` as the candidate, and both readers that draw already load it: `tokens.mjs` for
the figure and `house.typ` for the key. A `lines` section there has one owner. Each row is keyed by its meaning and
states the channel, the value in the plate's drawing space, the figure-reading question from `binding-table.md`,
whether a work has tested it, the shape of its sample in the key, and what the page does for it, or `null` where the
page has no expression of it. The section also records the three image widths the tests measure at, 2400, 1920 and
960 px, as `definitions.md` fixes them, and how many levels the weight channel holds. The drawing reads the table
through one function, `linesOf` in `src/poster/tokens.mjs`, which takes the house's table or a copy a test gives in
the style, and fails with the row's id where a plate needs a row the table lacks. Rejected: a second file, which the
house class would have to stage apart; and keeping the values in `tokens.mjs`, which Typst cannot read, so the key
would keep samples of its own.

No file records a digest of `src/house.json`, so none was renewed. A build computes one digest over the class and
the tokens as it stages them (`stage` in `src/overview/typeset.mjs`) and writes it to the manifest, so the digest
follows the table with no command to run. Rejected: a recorded digest with a command that renews it, a second place
to keep in step with the table.

### Rows: what the record admits, and nothing else

The rows follow the table "What follows for the line table" of `2026-11-15-comparison.md`.

| Row              | Value in the drawing space                                 | Question | Tested | On the page         |
| ---------------- | ---------------------------------------------------------- | -------- | ------ | ------------------- |
| relation         | continuous, 1.6 px                                         | Q5       | yes    | a connection's line |
| emphasis         | twice the relation's weight, arrowhead 1.45 times as large | Q10      | yes    | no expression       |
| boundary         | dashed 8 and 5, 1.4 px                                     | Q8       | yes    | a region            |
| citation count   | a number, 14 px, in its line's colour                      | Q7       | yes    | no expression       |
| planned, retired | today's patterns, `6 4` and `1.5 3.5`                      | Q11      | no     | one dashed line     |

The boundary's pitch measured 6 and 4 px on the 1920 px image; the table stores 8 and 5 because it stores the
drawing space, and the test measures the image. Emphasis is stored as a multiple, so that the two steps stay 1 : 2
if the relation's weight changes. Not rows: ticks and a mark on the hub's part (withdrawn and not needed, same
record); a dash-dot boundary, which no cell drew; the outline of a part that owns no files, a tier's ring, a card's
outline and an icon's strokes, which no trial measured either and which `one-anatomy` redraws. Those widths stay
literals, so the design's invariant 8 is met for relations' lines, statuses and the boundary only.

### The hub's lines are drawn as the measured cell drew them

The cell `wide-hub` is what was measured (2.50 against 1.25 px on the 1920 px image) and read (hub items 36 of 36):
twice the wire's stroke, still in the oldest dye, the arrowhead 1.45 times as large. The owner asked for the dark
lines to be made twice as wide, not for the colour to go; width carries the fact and the dye repeats it. Rejected:
heavy lines in the ordinary line colour with one arrowhead, the first draft's row, which no cell drew and no holder
read. A planned relation into the hub is heavy, in the oldest dye and in its dashes, as in the cell. A retired one
keeps its faint colour, the ordinary weight, the ordinary arrowhead and its dots, as in 0.14.0 and the prototype.

A heavy line ends half a head short of each tip it carries, inside the head. The prototype ran the line to the tip
under a round cap, which at 3.2 px reaches 1.6 px past the point and shows beside the head; this closes that loose
end, since it is the same line being drawn. An ordinary line runs to its tip as before, and the layout reserves
room for the ordinary head.

### The key holds a row exactly when the figure draws it

The figure reports the rows of the table it drew, and the key is made from that list and from the shape the table
names for each row's sample; a plain relation's line has none. So a view whose hub is reached by retired relations
alone shows no heavy line and no sample of one, and a relation that cites files but has no run of its own, and so
no number, adds no sample of a number. The key's sample of the hub takes its weight and its arrowhead from the
table, the sample of the count is a figure at the plate's size, and the house class reads the boundary's weight,
dash and gap from the staged table, on card plates too. The statuses' samples keep Typst's presets: no drawing work
on untested rows.

### A row no work has tested is reported

The lifecycle rows enter the table with the patterns they had and the mark that no work has tested them. They are
left out of the pairwise test, which the planned pattern would fail against the boundary by the rule fixed
beforehand. A build or a check whose plates draw a planned or a retired part or relation carries the warning
`line_row_untested`, once for each row, naming the plates. Rejected: a refusal, since no work states a status and
the pair is settled when a work first needs it.

### A number replaces ticks, placed clear or reported

The count stands where the cell `citation-numbers` set it: 12 px along the relation's own run from its source end,
its line box 9 px right of a stretch that falls or above one that crosses, in the smallest figure type and its
line's colour. Places are tried in order, every 5 px along the run, clear of its corners and its far end, then the
middle of its first stretch; a place is clear when the count's figures keep 2 px of paper from every part's marks,
relation label, stretch of a line, arrowhead, edge and name of the boundary, and count already set. A count with no
clear place stands at the first and the result carries the warning `citation_count_touches`, one for each such
relation, with the plate's number and the relation's id. Rejected: a new gate in the layout, which would refuse
views that fit today and raise the line count of `src/layout`; a refusal, which would add to the cost the author's
timing found in `plate_unfittable`; and a new measure in the manifest, which would raise its format.

### One weight for every piece: the figure stands in a square canvas

`2026-11-15-comparison.md` found two vertical pieces at x = 1200.00 of 2400 at a third of their weight. The cause
was established inside the half working day this Change gave it. A plate's figure reaches the page as one SVG
image. Typst's PNG export draws an SVG image into a texture as many texels wide and high as the image is in pixels,
rounded up, and paints each pixel from its nearest texel. A figure set at the margin is a fraction of a pixel
smaller than its texture, so one column of texels is left out, at the three delivered widths on the figure's
middle, and at 2400 px one row. A native mark at the same place loses nothing, and the released 0.14.0 has the
loss. On the plate the trial read, the hub's line on the middle was 2 px wide beside neighbours of 3.2 px, and at
960 px two lines on the middle were not drawn.

The figure's SVG is therefore nested, unchanged, in a square canvas as wide as the page less a hair and set at the
page's origin. Its texture is then exactly as wide and as high as the picture is wide, at any width, so each pixel
is one texel. The canvas reaches below the page, where it holds nothing and the page cuts it off; the figure keeps
its size and place, in the PDF too. `tests/line-row-weight.test.mjs` reads twelve pieces at the three widths and a
census of sloped lines at two widths a caller might name. Every plate's page picture changes.

Rejected: moving lines to pixel centres, which the measurements showed would not cure it; a `shape-rendering`
hint, which erased the line; a canvas of the page's own proportions, which keeps every column and loses a row
wherever nine sixteenths of the width is not whole; and narrowing `--png` to multiples of sixteen.

### `archpub compare` is a command of its own, built on what `verify` already does

The design counts the difference between two bodies of bytes among the uses of checking and leaves the command to
this Change. `verify` refuses a delivery without an acceptance record, and a reviewer compares before accepting;
`check --against` already means a revision. So the comparison is `archpub compare <delivery> <delivery>`, first
under the reviewer's heading of the help. Rejected: `verify --against <delivery>`, which would make one command
mean two things and loosen its demand for a record.

The command first runs the check of a delivery against its own manifest that `accept`, `verify` and `publish`
share, then compares every file the two manifests list and the manifests themselves. That check now names the
delivery in its refusal, because a comparison is given two; the same words reach the three other commands, whose
refusal codes are unchanged. The exit status is 0 whether or not the deliveries differ: a difference is a finding,
not a refusal, and a program reads `identical` in the `--json` result.

A plate's own files are its page images at every width delivered. A plate is identified by the record either
manifest holds for the image (`plates[].images[].file`), with its page and views, and plates are ordered by page.
Every file no manifest records under a plate is a file of the whole edition: the print edition, the page and what
it loads, the overview's images, the manifest, and every image of a manifest that predates the plates' image
records. Rejected: saying whether a plate's record in the manifest differs, as the first draft of the specification
asked. A record that differs shows as `manifest.json` among the files of the whole edition, and which record
differs is not said.

`acceptance.json`, `acceptance.sig` and `colophon.pdf` are not compared. The shared check already sets them aside,
since `accept` writes them after the build with the reviewer and the time, so a delivery compares the same before
and after its acceptance. The report is composed in `src/cli/comparison.mjs` and printed by the report module; the
fact constructors both use moved to `src/cli/facts.mjs`, since `src/cli/report.mjs` stood near the 500 lines allowed.

### The comparison's definition rests on one commit built twice

The design's first task for this step was to build one work at two adjacent commits and list which files differ.
What was measured is narrower: one commit built the bundled example twice on one host with
one `SOURCE_DATE_EPOCH` and no `--repo`, and all five delivered files, the manifest among them, had the same bytes.
So the comparison leaves out no file and no field of a build. Not measured: two adjacent commits, a build with
`--repo`, a work with strips, an overview or a guide, and a second platform. The definition stands in
`docs/reference/command-line.md` under "Comparison of two deliveries" and not in `docs/reference/operations.md`,
where the design put it: that page stands near its size limit and takes one line in its command list.

### Five invariants become tests, each with a broken table

The design says: "Each invariant has a deliberately broken table that proves the test fails." This item makes
these testable, in the design's words, with the broken tables of `tests/fixtures/line-tables.mjs`:

- 1: "A channel carries one meaning on one figure; the number of value levels does not exceed what the channel can
  keep apart." Broken table: a second row with the weight of emphasis.
- 3, in part: "The pairwise distinguishability test runs over the four values times two line widths". Here it runs
  over the tested rows, on the 1920 px image and in grey, by the limits of `definitions.md`. Broken table: emphasis
  at one and a half times the weight. The four stroke meanings of invariant 3 are not settled here.
- 4: "A bound channel varies with the fact: change one fact, and exactly the matching channel of the matching mark
  changes on the product". Tested on the drawing of lines with a layout held by hand. Broken table: emphasis at the
  relation's weight.
- 6: "The legend equals the rows this figure actually uses." Broken table: a row for emphasis without a key sample.
- 8, in part: "Every type size, line width and typeface in the product is in the table". Here it covers the weight
  and pattern of relations' lines, statuses and the boundary. Broken table: the boundary's row removed.

Invariant 2, "Hue carries no fact; the main channels hold in greyscale", is not claimed: the age bands still use
hue and the hub's lines repeat their weight in a dye. Invariants 5, 7, 9, 10 and 11 belong to later items.

### The pairwise test reads medians over the places a line can take

`definitions.md` reports the median effective width and the median core width over the runs of one kind of line. A
single line's core width depends on where it falls on the pixel grid: on a boundary between pixels of the 1920 px
image an ordinary line reads 1.50 px with a core of 2 px and a line into the hub 2.50 px with a core of 2 px, which
the limits do not tell apart. The test therefore reads ten upright lines, five of each weight, that stand once on
each of the five places a whole coordinate of the drawing space can take within a pixel, and compares the medians.
The boundary is read on a built plate. Rejected: the medians of one small plate, which depend on the places its few
lines happen to take and fail the core-width limit on the small strip work's own plate.

### `src/poster` grows, and the requirement count stays at 32

The table and its invariants are a capability of their own, because the key, the documents and the tests read the
table as much as the figure does. In `poster-composition` one requirement is removed and one added, so its count
stays at 32, and `src/layout` is untouched at 2823 lines. `src/poster` rises from 3367 lines in 11 files to 3545 in
12, where the design asks that the count not rise. That is a cost of this Change. It is accepted because the
table's reader, the placing of the counts and the two warnings are new behaviour, which the withdrawal of ticks
does not pay for; the fall the roadmap expects belongs to `fact-layer` and `one-anatomy`. Rejected: holding the
number by squeezing lines, which the design rules out.

### The pass line is fixed before any reading

The design asks for a pass line written after the baseline and before this step runs. It is fixed on plate 05 of
the Chinese work on Architecture Publisher at 2400, 1920 and 960 px, read by two holders three times each: hub
items right at least 35 of 36, citation items at least 50 of 54, and the items that are the same task in every cell
at least 51 of 54. The baseline was 35, 28 and 51 (`2026-11-15-comparison.md`). The line is committed to the
publications before any reading, and a row whose items fall below its line is taken out of the table. Rejected: a
line set after the readings, which no reading could fail.

### A reading of rebuilt plates gives a verdict on each item, not an acceptance

A holder other than the author reads plate 05 and every plate that carries a new warning, against a list written
before the editions are rebuilt. The reading starts from what the build measures: the warnings and the missed gates
of the six works' Chinese editions, and the plates `archpub compare` names against the same works built from the
base. It gives a verdict on each item of the list and names the items not judged. It is not an acceptance of form:
no holder passed the seeded check on defects of form (`2026-11-15-outcome.md`), and the owner's looks are the
sample book and the six works. Rejected: an acceptance of form by eye from a holder that has not passed that check.

## Risks / Trade-offs

- [The oldest dye colours the files of the oldest age band and the lines into the hub: two meanings on one plate]
  → a conflict the plates already have; width now carries the hub and the dye repeats it. Left to `one-anatomy`.
- [The key's icons are SVG images in the text's flow and still lose a texel column at some places: 10 of 24 marks
  read at 2400 px, 9 at 1920 and 3 at 960] → measured and not cured here, since an icon has no known offset to
  nest it at; it returns to the queue with `one-anatomy`, which redraws the key's marks.
- [The canvas reaches 700 pt below the page in the PDF] → it holds nothing there, Typst's compile to PDF/A-3a and
  PDF/UA-1 accepts it, and a test holds the page at 1600 by 900 pt; no validator outside Typst was run.
- [The loss is Typst's, and a later Typst may change how it draws an image] → the test reads pictures, not the
  placement, so it fails if the loss returns under any placement.
- [At the largest type step two enlarged heads at neighbouring ports stand 0.8 px apart by the prototype's
  arithmetic (`trees/README.md`); no built plate was checked for it] → the reviewer's list names the case.
- [The key's words for the count and the heavy line in `zh-TW`, `es` and `ko` were written by the author and read
  by no speaker of those languages] → the limit is stated here; a speaker's reading is not part of this Change.
- [Every cited relation now carries a text box; on a crowded plate some will touch] → the warning counts them per
  plate. The work on Architecture Publisher in Chinese raises none on its six plates; the other five works are
  counted in task 8.5.
- [Byte equality was measured on one commit and the bundled example alone] → task 8.5 is the first comparison
  across commits and of works with strips; a difference no change of the drawing caused is named in the definition.
- [The manifest records neither the platform nor the publisher's commit, so the command cannot tell whether two
  builds are comparable] → the help and the reference state the condition, and the reviewer who compares knows how
  each delivery was built.
