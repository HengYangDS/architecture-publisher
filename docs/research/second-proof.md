---
subject: architecture-publisher:research-second-proof
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# What the second proof showed

A research page. It records what a hand-set proof of the edition's two PDF forms showed, part by part, on one work:
what was set, what was checked and how, what was read from a simulated distance, and what the proof's own rules did
not foresee. It decides nothing; the decisions that rest on it are named under "What follows". The proof is trial
material and none of it is in the product.

**Note of 2026-11-16.** The owner asked: 「为什么那个 booklet 和 presentation 里大量都是文字？」 (gloss: "why are that booklet and
that presentation mostly text?"). The chair's reading: this proof inverted the product, since 2 of the presentation's
30 pages and none of the booklet's 189 are figures. As a form it is superseded, for the presentation, by a third proof
with figures first: 12 pages, 10 of them figures; the booklet under that reading is not begun. The measurements on
this page stand. The third proof lies in `build/runtime/work/sample-book/proof-3/` (ignored, local).

## Question

The committee's ruling of 2026-11-15 ordered a proof by hand before any number enters the product (R10; see the
[committee's record](edition-forms-committee-2026-11-15.md)). Set by the ruling's trial values, does a presentation
page hold what the ruling says it holds; can its text be recovered as it appears from 4 and 6 image heights; and
what does a whole proof, a presentation and a booklet from one data set, show that the rules did not foresee?

## Short answer

- A model read a statement page back from images at 4 H and 6 H: all exact but one character (scale A, 6 H).
- The ruling's first trial capacity fit neither scale and is withdrawn: a page holds five lines in scale A, six in B.
- One view was set as two plates on a fixed base; three of its fourteen relations are asserted by neither sentence.
- The first whole booklet had 699 pages, reprinting each cited passage per section; with a quoting rule it has 189.
- An overrun that neither the tidiness measure nor the face check saw led to a check of every box of the page face.

## What was measured

Working material under `build/runtime/work/sample-book/proof-2/`, ignored and local to one checkout. The review by
the queue's holder was read in full; the setters' notes, the pages, the build script and the check outputs it names
were not opened. Decision D6 was read in `build/runtime/work/style-research/round-5/DECISIONS.md`.

| Part         | When (CST)                | What was set                                                                                                                              | By                            |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1            | 2026-11-15, about 22:1x   | One statement page, the question `binds-whom`, in scale A (48 / 32 / 24 / 16) and scale B (40 / 28 / 24 / 16), with three room renderings | A setter agent, in 30 minutes |
| S            | 22:15 to 22:41            | The statement page's second version and a table page (`terms`)                                                                            | A setter agent                |
| P            | 22:15 to 22:56            | One view, `overview` (nine parts, fourteen relations), as two plates on one fixed base                                                    | A setter agent                |
| 4 and 5      | 23:5x to 2026-11-16 01:47 | The whole proof for one work from one data set: a presentation of 30 pages and a booklet of 189 pages of 1008 × 1344 pt                   | Not stated in the review      |
| The holder's | 2026-11-16 01:53 to 02:04 | Changes to the quoting rule, the pointer's words, the key and the build's checks                                                          | The queue's holder            |

**Checks.** The tidiness measure was rerun by the holder on the PDFs of parts 1, S and P; each part has its own
check script, reported as 28 of 28 (part 1), 23 of 23 (S) and 27 of 27 (P). The whole proof's build passes on 60
sources; the holder ran it four times, the last at 02:02, and looked at eleven pages.

**Readings from a simulated distance.** 2026-11-15, 22:07 to 22:18 CST. A model of another origin than the setters,
one session for each image, was given nothing but the page as it appears at a distance: the page cropped from the
room rendering at its simulated pixel size, 1713 × 963 px for 4 image heights and 1144 × 644 px for 6. It was asked
to transcribe every text exactly, to say what it could not read, and to state the page's point, what the work does
not vouch for, and what the marks mean. The answers were compared with the data by script, whitespace set aside.

## Findings

### Part 1: one statement page in two scales

- The page: a claim that is the author's conclusion from three statements (s-352, s-254, s-353); five statements shown
  (those three, s-019 and s-364); two items that must be shown (s-210 and s-211: uncited, and classed wrong by the
  review). Author's time: 3 minutes, by a setter who had just read the first proof.
- Scale A: statement letter 28 pt, 17.8′ at 6 H, body full with five one-line statements. Scale B: 24.5 pt, 15.6′ at
  6 H, 54 pt of room left, six one-line statements fit.
- The page has 582 characters, 67 % at the 24 pt tier or above. The same question's page in the first proof had 3272
  characters, 14 % at 16 pt and nothing above.
- The tidiness measure reported no failing finding; two `budget` findings were accepted in a sidecar, because faces
  of one tier differ in font size.
- The holder looked at both pages (1500 px copies) and one 6 H rendering: marks on one axis, numbers in one column,
  statements from one x, keys in one column; one claim, five statements, a count with two named items, one link, one
  key.

The readings:

| Page as seen | Claim | Five statements                                                        | Evidence keys | Count line and the two named items | Point, unvouched items, marks |
| ------------ | ----- | ---------------------------------------------------------------------- | ------------- | ---------------------------------- | ----------------------------- |
| Scale A, 4 H | exact | 5 of 5 exact                                                           | 5 of 5        | exact                              | stated rightly                |
| Scale A, 6 H | exact | 4 of 5 exact; in statement 5 one character misread (授予 read as 授受) | 5 of 5        | exact                              | stated rightly                |
| Scale B, 6 H | exact | 5 of 5 exact                                                           | 5 of 5        | exact                              | stated rightly                |

Against the fail conditions the ruling set: none at 4 H; at 6 H one misread character on scale A and none on scale
B. Scale B at 4 H was not run. The owner chose scale B before these readings were compared. The review's own
judgement of them: one reading for each image, by a model, of a small image, is a harsh proxy for a reader at the
back of a room and not a measurement of one; one misread on the larger scale and none on the smaller says the
difference between the scales is within this reader's noise.

To change, from part 1:

1. The must-show lines print the published wording that the review found wrong, and not what the pin has; a room sees
   "wrong" and not "what is right". Each is to be a row of two cells from the data: the published wording, and the
   statement of the work that says it as the pin has it (s-359, s-360: the guide's own sentences, cited), or the pin's
   sentence where no statement does.
2. Capacity is to be stated as lines of the statement tier (A: 5, B: 6), a two-line statement counting as two. The
   ruling took this up on 2026-11-16.
3. The measure's budget of styles counts font sizes; under tiers by letter height it should count tiers and faces.
4. The kit's Chinese words are the setter's; they go into one table for the holder to settle.
5. The evidence key repeats one path four times. Left as it is: it is what the data says.

### Piece S: the statement page's second version and a table page

- Each must-show item is two stacked rows of typed columns: the overview's wording, then the guide's statement (s-359
  or s-360) with its file. The two paired items cost 84 pt, so four statements fit and s-019 was dropped from the set.
- Capacity is the declared lines (six in scale B) capped by what the rest of the body leaves. A set of seven is
  refused with the number that fits ("7 lines … 4 fit").
- The table page's question has no claim, so its headline is the question, over six cited rows.
- Weak, by the setter's own account: the wrong line is stronger than the right one; the count sentence omits a
  statement that is cited and classed wrong (s-356, on `terms`); the pin-sentence fallback cannot hold an English
  sentence in the column.

To change when the kit is consolidated: the count sentence counts every statement the review found wrong, cited or
not, and says how many of them cite a file; in a pair the right row carries the solid mark and the statement style
and the wrong row is the lighter; the budget rule counts tiers, so that no page needs a sidecar for it.

### Piece P: one view as two plates on a fixed base

- Plate 1 inks and labels the six relations its sentence says, plate 2 the five its sentence says. Three relations
  (`从这里读起`, `依据、底线`, `底线`) are said by neither sentence and stay hairlines on both (the information designer's
  reading of seven and seven holds for eleven).
- Both claims carry the unvouched ring: the model's summary cites nothing.
- The four `风险分级` relations into the charter are one bundled line with one label: two crossings where the engine
  has none, and 15 bends against the engine's 26.
- Hub weight is left out: weight already means "the claim asserts it".
- The tidiness measure: no failing finding, one accepted `stack` per plate (arrowheads of different relations).
- Room renderings of plate 1, by the setter's own reading: at 4 H every room-tier text reads; at 6 H the claim and
  the names read, the 24 pt labels with effort.
- The base was set by hand. The row of six topics is full at 28 pt names (1320 of 1336 pt): a seventh part of that
  row would not fit.
- Plate 2 prints the model's "four topics" where the review found five at the pin, and the plate's foot has no place
  for such an item yet.

### Parts 4 and 5: the whole proof

- Presentation, 30 pages: contents, two plates of `overview`, a page for each of the 27 questions. Booklet, 189
  pages: contents, 27 sections, the source table, the review's findings.
- The booklet's first whole build came out at 699 pages. Measured from its data: 154 distinct cited passages hold
  7,287 lines, of which 53 whole-file citations hold 5,899 (one file has 885 lines); the median ranged passage has
  11 lines and 81 of 154 have at most 12; passages were printed once in every section that cites them, 25,732 lines
  in all.
- The key carried two marks with the same words on the findings and two sections. A mark is built of two meanings,
  so the key now has the base marks and the cross alone, and a check refuses two key entries with the same words.
- The holder's first repair of the key overran the key's line on pages 94, 167 and 182: one entry over the next,
  the last 120 pt past the margin. Neither the tidiness measure nor the face check saw it. The build now checks
  every box of the face: none over another, none outside the frame; 11 977 boxes in the booklet and 1 257 in the
  presentation; the survey found these three keys and nothing else. Six wrong pages are kept as fixtures, and all six
  are refused: two for this rule, beside four from part 5 (a mark on another column's axis, a number ending at
  another column's x, a continued table without the head that names its statement, a source table without its column
  heads on its second page). See [tidiness](tidiness.md).

Weak, as said to the owner with the proof:

- 22 of the 27 question pages are the default page (counts by carrier, the files most cited): no author has recorded
  a claim and a set for them. Two have a record made by the proof's setter.
- One view of six is set as plates. The booklet has no plate.
- The review's readings and the pin's lines are English in a Chinese booklet. No English edition is set.
- An entry may break between its id line and its evidence (page 38, s-326).
- No viewer has followed a link from one file into the other.

## What was compared

| Matter                           | Options                                                                                                                                                                                                                       | What speaks for and against                                                                                                                                                                                                                                                                                                                                                  | Outcome                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| The scale of a statement page    | A (48 / 32 / 24 / 16); B (40 / 28 / 24 / 16)                                                                                                                                                                                  | A: larger letter at 6 H (17.8′ against 15.6′), body full at five lines. B: six lines and 54 pt of room. The model's readings do not separate them; by the standard A's statements reach 6 H and B's 5.4 H                                                                                                                                                                    | The owner preferred B                     |
| What the booklet quotes          | (a) every cited passage, once per section; (b) every passage once, in an appendix; (c) a ranged passage of at most twelve lines in full, a longer range and a whole file by reference; (d) nothing, all text left to the data | (a) gave 699 pages and reprinted the described repository several times over; (b) saves pages and takes the passage away from the statement it backs; (d) loses the sentence beside the claim; (c) keeps the median passage whole, and a whole-file citation is evidence by reference by its nature                                                                          | (c), decision D6                          |
| Where a statement stands in full | Once in the booklet, in the first section whose question it answers, by reference later; in full in every section whose question it answers                                                                                   | The first gave 161 pages and left three sections (`terms`, `repository-structure`, `in-use`) with no statement in full and `binds-whom` with one of seventeen, while the presentation's pages point to those sections for the full text; the second gives 189 pages, and a section is whole in itself, since a reader arrives at one section from a page of the presentation | The second: D6 as amended                 |
| Relations into one part          | The engine's separate lines; one bundled line with one label                                                                                                                                                                  | The bundle has two crossings where the engine has none, and 15 bends against 26                                                                                                                                                                                                                                                                                              | Set as a bundle in the proof; not decided |

## What follows, and where it applies

- **Decision D6** (what the booklet quotes of the pin) rests on the measurement of the 699-page build. As amended,
  every section sets every statement that answers its question in full, with its apparatus, and a range of at most
  twelve lines is quoted once in a section, under the first statement there that cites it; longer ranges and whole
  files stand by reference. It applies to the booklet; the presentation quotes nothing, and the data is unchanged by
  it: it holds the full text of every cited range. It is kept with the other decisions in the working material until
  it enters a Change's design.
- **The open part of ruling R7**, ruled on 2026-11-16, rests on piece P together with the
  [room-size fit](room-size-plate-fit.md): one base and one plate for each claim the author records.
- **For the model** (queue item `model-four`): each sentence of a view names the relations it asserts, and the check
  reports relations no sentence names.
- **For the engine**: one layout per view with every part placed once, and a draw pass per sentence that changes
  line weight and label presence only.
- **For the kit of the proof**: the changes listed under parts 1 and S, and the pointer's words: 「N 句的全文、出处和所引原文」
  promised every passage and is now 「N 句的全文和出处」, with the quoting rule stated in the section's head.
- **For the geometry acceptance**: the check of every box, on the page [tidiness](tidiness.md).

## Where the files disagreed, and what stands now

- **Decision D6: reconciled on 2026-11-16.** The decisions file first said that a statement is set in full once in
  the booklet, in the first section whose question it answers, and stands in later sections with its words, its mark
  and a link; the review of parts 4 and 5 held the holder's amendment and the decisions file did not. The decision now
  marks that half as withdrawn on 2026-11-16 01:41 CST and carries the amendment itself: every section sets every
  statement that answers its question in full; 189 pages.
- **Capacity: reconciled on 2026-11-16.** R3 kept "five statements of at most two lines" where the proof measured
  five and six one-line statements. The ruling now withdraws that trial capacity for six lines of the statement tier;
  see the committee's record.

## Not established

- No person has read either page at any distance. The three readings measure a model's reading of a small image.
- The author's three minutes are a setter's, not those of an author who comes to the work cold.
- Scale B at 4 H was not read.
- 22 of 27 question pages have no authored claim and set; five views are not set as plates; no English edition
  exists; no viewer has followed a cross-file link.

## Record

Set and reviewed 2026-11-15 to 2026-11-16 by setter agents and the queue's holder; read back by a model of another
origin. Working material: `build/runtime/work/sample-book/proof-2/` and the pages sent for review under
`build/review/sample-book-20261115/proof-2/`, both ignored and local to one checkout. Written up for this directory
on 2026-11-16 by the author of the documents lane, and brought in line the same day with the decisions, the ruling and
the review as amended.
