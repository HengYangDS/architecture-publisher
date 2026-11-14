---
subject: architecture-publisher:roadmap
role: reference
state: canonical
relations:
  governed_by: product-contract.md
---

# Roadmap details

This document holds the detail behind the queue of the [product contract](product-contract.md#queue): which step
carries each item of the design, the protocol of the reader experiment, the table of what each mark on a plate
means, and what each step does in detail. The decisions themselves, each step's acceptance and the line at which
it stops are in the design of the Change `queue-the-roadmap-and-name-roles`, kept in `openspec/changes/archive/`
and called the design below. A committee of eight wrote both on 2026-11-14; its working record, with the two
ledgers cited here, is the maintainer's local evidence and is not in the repository. Bracketed marks name the
committee's seats, and a number after a seat, as in [language 6], is that seat's condition or comment number.

## Design items by step

From the committee's appendix A [language 6], with the round 4 additions in the last eight rows.

| Design item                                                                                                                                                                                                     | From                               | Lands in                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Review procedure, independence rule, E2a, E2b, hand-written acceptance records                                                                                                                                  | Roles and records; the figure half | Step 1(a)                                                                                                                     |
| Three-state predicate, text statements, strength predicates, basis category                                                                                                                                     | Content                            | Step 1(b) trial fill on paper; step 5a into the schema                                                                        |
| Replayable silence search; undeclared kinds refused; `editors` renamed; `kinds.category` and `kinds.icon` split out                                                                                             | Content; Roles and records         | Step 5a                                                                                                                       |
| Value table: four line values, dash-dot boundary, missing values, reference viewing conditions, scales                                                                                                          | Presentation grammar               | Step 2                                                                                                                        |
| Property catalogue; fact layer                                                                                                                                                                                  | Concepts; Content                  | Step 3, first Change                                                                                                          |
| Evidence table (output side), reader file, `<id>.json`, data face equal to the view's statement set, data face records page and position                                                                        | Content; Projections               | Step 3, second Change                                                                                                         |
| Type scale, whole-page tier and zoom tier, title block, the channel for source (stated, measured), block positions                                                                                              | Presentation grammar               | Proofed in the sample edition and layout proof sheet of step 4; into the product in steps 5b and 5c                           |
| One anatomy, three detail levels, automatic type-size tiers deleted, hub annotation, position in the legend (invariant 9), medium totality (invariant 10)                                                       | Presentation grammar               | Step 5b                                                                                                                       |
| Blocks, sections by question, block position comparison (invariant 11), alternative text, PDF round trip, clickable marks, the change to the contract's clause "the edition does not print verification status" | Projections; Presentation grammar  | Step 5c                                                                                                                       |
| Record format, signature-authenticated and self-reported fields, review-checklist command, reviewer Skill                                                                                                       | Roles and records                  | Step 6                                                                                                                        |
| Static check that nothing branches on kind of holder; labels in works renamed                                                                                                                                   | Roles and records                  | Step 0; step 6 reruns it and covers the record format                                                                         |
| Release script checks the CHANGELOG, report first-line script, five weekly numbers                                                                                                                              | Execution safeguards               | Step 0                                                                                                                        |
| Entry in the described repository, routine report of pin lag                                                                                                                                                    | Execution safeguards               | Step 7                                                                                                                        |
| On the web page "planned" and "retired" fall back to text, and an issue goes upstream                                                                                                                           | Projections                        | Step 2 (the web column of the table says "falls back to text"); the issue is filed after the owner agrees                     |
| Splitting acceptance                                                                                                                                                                                            | D4                                 | Not in the queue; discussed again after step 6 measures                                                                       |
| Sinking mechanisms into ETHOS                                                                                                                                                                                   | Where each constraint is carried   | Proposed after step 6; the principle is not bound by this roadmap                                                             |
| Figure-reading check: items, scoring, self-check, pass line, handling                                                                                                                                           | The figure half                    | Step 1(f) baseline; step 2 line proof sheet; step 4 sample edition and engine comparison; steps 5b and 5c rerun on all plates |
| Arm C of E1 (record-only)                                                                                                                                                                                       | Step 1(d)                          | Step 1(d); if step 1 runs over, deferred to the rerun of step 3                                                               |
| False-positive ceiling of E2; isolation of the reviewer, the figure reader and the cold-start builder                                                                                                           | Roles and records                  | Step 1(a); step 0                                                                                                             |
| The four existing works reviewed once under the current procedure                                                                                                                                               | R11                                | Step 1(a), after E2 is passed, one day                                                                                        |
| Minimum delivery width; stroke of group frames that are no boundary; each row's figure-reading question                                                                                                         | Presentation grammar               | Measured in step 1(f); into the value table in step 2                                                                         |
| List of page classes                                                                                                                                                                                            | Invariant 11                       | Produced in step 4; into the table in step 5c                                                                                 |
| Reader file against arm B                                                                                                                                                                                       | Step 3                             | The E1 rerun of step 3                                                                                                        |
| Whether text statements carry a lifecycle; `person` renamed                                                                                                                                                     | Concepts                           | Step 5a                                                                                                                       |

## Reader experiment protocol

The protocol of E1, committed before the run [critic 4, agent 2, product 3, engineering 9]. The round 4
revisions are merged in and marked. The consequences of each outcome are in the E1 outcome table of the design.

1. Before anything else (round 4): count the Changes of the two works that were archived after the pin and changed
   product behaviour. If there are too few for 8 items, use the fallback of item 4 [product 5].
2. Subjects: ETHOS and AIGW CLI at their present pins. At least 8 items per work, three runs per arm. Two works with
   16 items over three runs give 48 answers per arm (R5).
3. Arms. A is the repository at the pin plus search tools. A is also the control; reading only the README is no
   control. B adds the model and the explainer text. D adds one hand-written page of constraints, processes and
   decisions. C (restored in round 4) gives the material of arm A plus plate images, with no model and no explainer
   text. C is record-only: it does not enter the decision, does not decide whether figures are useful to people, and
   does not decide whether the own engine stays [engineering, R3]. The rerun of step 3 uses the same arm A.
4. Items. Take Changes archived after the pin that changed product behaviour; release, supply and rebinding Changes
   do not count. Give only the motivation and ask for a prediction of the paths the change lands in. Add a second
   class, getting-started items with mechanical answers: who owns a path, where to enter, what must not be broken.
   The two classes are reported apart, and getting-started items do not enter the median recall; who owns what and
   how it is judged is committed with the protocol (round 4) [product 4]. If items run short, take an earlier pinned
   edition and pin of that work from the history of publications, or change the work.
5. Isolation. The subject's checkout stays at the pin, without later commits and refs. Out of reach: the canonical
   checkout on this machine, later commits of publications, the item bank, the answers, the committee directory and
   the chair's memory directory. The subject's session carries no memory index and no Skill of the host. Where this
   cannot be done, all arms get the same and it is recorded. The same method applies to the E2 reviewer, the holder
   of the figure-reading check and the cold-start builder of step 0 (round 4) [agent 5, critic 2].
6. All arms use the same model, the same tool permissions and the same token budget. A script computes the score
   against the real diff; no agent judges. Arm C has the same model, permissions and budget as the other three; it
   runs after them and takes none of their rounds; if step 1 runs over, it is deferred to the rerun of step 3 and is
   not cancelled (round 4).
7. The page of arm D is written by a holder that has seen only the checkout at the pin and has not seen the items,
   and is committed before items are drawn.
8. Pass line: median recall 0.15 above arm A, or tokens at most 70% at equal recall. This is the critic's suggested
   value and has no precedent; the owner can change it before the run.
9. Three outcomes: passed, failed, undecidable. Undecidable (as revised in round 4): the range of arm A's three runs
   is at least 0.15; or the medians differ by the pass line while the three-run intervals of the two compared arms
   overlap. Then items are added and the experiment reruns once; if it is still undecidable it is treated as failed
   and reported to the owner. A median difference below the pass line is a plain fail with no rerun [language 2].
10. Commit first: items, scoring rules, pass line, criteria, handling, and the isolation rules of items 5 to 7
    (round 4) [critic 3] go to a tracked directory of publications before the run. The record of each run is
    committed afterwards.
11. Added in round 4: when B fails and D passes, the report also lists the cheapest explanation, that one
    hand-written page is enough and the product need not generate a reader file for the constraint classes [critic
    7].
12. Added in round 4: the rerun of step 3 with the reader file adds one item, reader file against arm B. If the
    special format is no better than the plain model plus explainer text, the reader file falls back to its minimum
    form, "placed in the delivery and listed in the manifest" [agent 4].

Item numbers here run one higher than in the ledger's appendix B from item 2 on, because the round 4 preliminary
step is numbered 1; the ledger's "item 4" (isolation) is item 5 here.

## Binding table details

The details of the binding table of step 1(c) [language, information 7, typography 11, language 11],
with the round 4 additions as items 7 and 8.

1. Every visible difference on the existing plates becomes one row, marked bound, unbound or ambiguous, across the
   six works.
2. Each row states which figure-reading question it answers; rows that cannot are listed as candidates for deletion.
3. Which regions each view's question needs, as a test of whether three detail levels are enough. The three levels
   are nested and cannot produce a combination such as "name plus measure bar, without annotation".
4. All type sizes, typefaces and line widths are read from the product PDFs and listed among the visible
   differences.
5. The twelve `overview.typ` files are split into blocks and counted, to see how much the five kinds figure,
   sequence, table, text and list cover. Marks on the overview page that trace to no statement id are listed apart.
6. The labels of the 352 relations of the six works are classified. If they do not fall into three classes, no
   relation kind is set up; if they do, step 5a takes the classes into the schema.
7. Added in round 4: whether the figure shows that the two rows of a wrapped row belong to one layer [information
   8].
8. Added in round 4: the figure-reading question each visible difference answers is also the source of item types
   for the figure-reading check. A difference that answers no figure-reading question yields no item and is listed
   for deletion under item 2.

## Execution details by step

This section joins the per-step detail of the final text's section 4 with appendix D of the round 4 ledger: details
the members said could be left to execution, and values for which the main text keeps only a pointer. Work,
acceptance and stop line of each step are in the queue table of the design.

**Step 0.**

- Queue tests: the active product Change must be the first unfinished item of the queue. Every Change's proposal
  states `queue: <queue item>` or `queue: maintenance` and is refused without it. A maintenance Change may not touch
  `src/layout`, `src/poster`, `src/map`, `src/overview` or `src/edition`; once the comparison command lands, this
  rule becomes zero byte change across the twelve editions [engineering].
- At release, the CHANGELOG entries are checked to come from the queue or to state the deviation; the first line of
  the report is generated mechanically [documentation, agent, language]. Both become part of an existing command or
  test, with no new shell script [engineering 6].
- The README's first sentence is corrected. The descriptions of the two GitHub repositories are public content and
  change with the owner's next explicitly stated release.
- Wording in the documents and the Skill that presumes who holds a role becomes roles. In the works the labels 人员 and
  审阅人 (personnel, reviewing person) become 角色 and 审阅者 (role, reviewer). A static check finds no wording or branch by
  kind of holder in documents, Skill, refusal codes and product copy [agent].
- Find out whether publications can build a review set from an unreleased commit [engineering].
- Each work's pin lag is reported from this step on [product].

**Step 1(a) Review procedure and E2.**

- The one-page procedure of Roles and records. E2a and E2b each run once on holders of two origins. The pass line
  and the value of the false-positive ceiling are committed with the seed list before the run [critic 1].
- The round-trip time of the channel to the other vendor's model is measured first [agent].
- After E2 is passed, the four existing works are reviewed once under the current procedure. The review may accept
  or refuse, takes one day at most and belongs to the publications side; defects found go to the queue and are not
  fixed in place (R11) [product, critic].
- The first acceptance record states which contents of which repositories were given to the reviewer of different
  origin to read [documentation 7].

**Step 1(b) Question matrix** [documentation, product].

- ETHOS and Film Kit are filled by hand under the three-state predicate; for DDWG only the matrix is filled. Each
  cell records which statement answered it [language], and one line is reported per asking role [documentation].
- Under the present predicate, when one question marks several entries, one statement with evidence makes all of
  them count as answered. If the filled matrix turns out absurdly loose, the marking moves onto statements [language
  8].

**Step 1(c) Binding table** [language, information, typography]. Every visible difference on the existing plates is
marked bound, unbound or ambiguous and states the figure-reading question it answers; those that cannot are
candidates for deletion. Also counted: type sizes, typefaces, line widths, block kinds, classes of relation labels,
and the regions each view needs. The details are in the section above.

**Step 1(d) E1 reader** [critic; protocol from agent, product, engineering, critic]. The protocol is in the section
above. Arm C is record-only, runs after the three arms and takes none of their rounds; if step 1 runs over it is
deferred to the rerun of step 3 and is not cancelled.

**Step 1(e) E3 author** [critic, product]. One work is written from scratch for a third-party repository and is not
published. It is re-pinned once. Both are timed.

**Step 1(f) Screen comparison and figure-reading baseline** [typography, information; the baseline per all, round
3].

- Written down and committed before measuring: the operational definition of "distinguishable" in pixels, the lower
  limit in pixels of line-pattern pitch, and the method of measuring "character height"; and the pixel space of the
  line-width numbers is verified [information, typography, agent].
- "Distinguishable", initial value from the information seat: after rasterizing under the base condition, the dashes
  and gaps of a dashed line are each at least 2 pixels, and two line widths differ by at least 1 pixel. The numbers
  are that seat's judgement with no basis. If they are not written first, passing or failing is derived backwards
  from the measured result [information 2].
- Line-pattern pitch: ISO 128-2 sets dash and gap lengths as multiples of line width, for drawing paper. A thin line
  converts to about 1.28 px under the base condition; copied as is, a dotted line may blur on screen into a light
  grey solid line. This is the typography seat's calculation and was not measured on screen. The pitch of dashed,
  dotted and dash-dot lines gets a lower limit in base-condition pixels [typography 5].
- "Character height": for Chinese the type size (the body box); for Latin a separate floor for x-height [typography
  3, information 3].
- Pixel space of the line-width numbers. What the rapporteur verified read-only this round: in
  `src/edition/typeset.mjs`, lines 17 to 20, `PAGE_WIDTH = 1600` is the page width in pt, and a PNG w pixels wide is
  rendered at w × 72 / 1600 ppi; `OWN_WIDTH = 2400` is the width of the default image. In `src/poster/tokens.mjs`,
  line 125, `stroke: 1.6`. In `src/poster/figure.mjs`, line 302, the boundary line has
  `stroke-width="1.4" stroke-dasharray="8 5"`. Not verified: how drawing coordinates scale to page coordinates. So
  1.28 against 2.56 px, 14.4 px and 11.2 px remain the members' conversions [agent 1, information 3].
- Plate 05 is rendered once each at base, zoomed and half size, with the legible and illegible text levels listed.
  Line width and dotted lines are measured in pixels. After the half-size measurement, the minimum delivery width of
  a single plate image is set at the level that can be read [information 5, typography 4].
- The comparison has two groups [information]: thick line for the hub against the hub marked on the component with
  the width unchanged; tick against citation number.
- The figure-reading check runs once each on the present plate 05 and on every comparison cell, under the three
  conditions, as the baseline. The items are hand-written against the model and the answers are derived mechanically
  [information, agent].

**Step 2.**

- The definition of the comparison command states which products are compared, which fields are excluded, and that
  comparison holds only on the same platform with the same date source. Under which command the comparison hangs is
  settled by this step's Change design [engineering].
- The value table as filed holds: the line rows that passed step 1, the unified strokes, the boundary changed to
  dash-dot, the stroke of group frames that are no boundary, missing values, the reference viewing conditions, the
  minimum delivery width, the scales, and each row's figure-reading question.
- Which stroke a group frame that is no boundary takes is written when the table is filed. Whether today's plates
  have group frames other than boundaries was checked by neither the information seat nor the rapporteur
  [information 4].
- The hard "does not rise" line covers the Requirement count of `poster-composition` and the line counts of
  `src/poster` and `src/layout`, in steps 2 and 5b; steps 5a and 5c only record net added lines. The line count of
  the five directories of the projection layer and the increment of the core are reported weekly (R8).

**Step 3.** Line ranges are added on the output side only; line ranges in the model input come with step 5a (R7).
Equality of the data face lands here and the PDF round trip in step 5c (R12).

**Step 4.**

- Contents of the sample edition: the contents page is the question table, and every entry has a page or a printed
  silence; at least one walkthrough; the source table; the title block; one layout proof sheet; one engine
  comparison page; a list of page classes [typography]; a statement list in which every statement and every mark in
  the book carries its id, and those that cannot be given one are listed one by one as input to the schema of step
  5a [language, typography].
- ETHOS has 11 views. If a week is too short, all question pages are set, only the plates that can be finished are
  set, and the missing ones are named (R10).
- Order when time runs short: the overview page, the densest structure plate, the sparsest one, one walkthrough, the
  engine comparison page. Without at least two pages of each class, invariant 11 cannot be tested on the sample
  edition. Without the densest plate, the type scale and "refuse or split what does not fit" cannot be tested either
  [typography 1].

**Step 5a.** Questions, text statements, line ranges, strength, source and basis category enter the schema. Whether
text statements carry a lifecycle is settled here [language]. Styles (palette, `kinds.icon`, `kinds.category`) move
to a file alongside, and `person` in `kinds.category` is renamed [language]. `editors` is renamed. An undeclared
kind no longer defaults to `backend` and is refused. The silence search can be replayed. `check` outputs the
three-state matrix. `migrate` is deleted and migration uses a one-off script [language, information, engineering].
Before starting, the new content is written once on paper with the existing fields of LikeC4 or Structurizr, in half
a day [language].

**Steps 5b to 8.** No detail beyond the queue table of the design.

**Figure-reading check.**

- How many items per plate, whether the item types include "list the relations you see" [documentation], and the
  value of the pass line are settled after the baseline of step 1(f) [agent].
- Items that could not be read are governed by the floor on the correct rate: when the floor is met they are only
  recorded; when it is not, they are handled like misreadings. The rapporteur chose this; the members did not treat
  the two cases apart.
- For the unscored item the reviewer gives one of three verdicts, "answered, not answered, answered off the point",
  and the counts go into the record. The three-way split is the rapporteur's addition.
- Item types that the self-check cannot separate on the baseline (scores unchanged after a seeded change) do not
  enter the pass line and are listed as they are. This is the rapporteur's addition.

**Unverified items recorded by the rapporteur** (from the closing sections of both ledgers).

- The owner's words come from `OWNER-RULINGS.md` and the dossier. Both are the chair's records, and the rapporteur
  has no independent source. The times of the two supplements are approximate; several members noted that the
  modification time of the rulings file (17:21:58) is slightly earlier than the time it gives for the second
  sentence. The engineering and critic seats stated that their blocks are withdrawn if the two sentences are untrue.
- The figure-reading check has never been prototyped. There is no data on how far a multimodal model's figure
  reading differs from human reading; on a dense figure 1920 px wide a model's misreading may come from its own
  eyesight.
- "Agent sessions of another vendor's model are available in the owner's environment" is a fact supplied by the
  chair; neither the rapporteur nor the members verified it. The two-model rule and the different-origin reviewer
  both rest on it, and both have a fallback.
- Step durations, the pass lines of E1 and E2, item counts and the initial viewing conditions are judgements of
  members or the rapporteur with no measured basis. The 8-day ceiling of step 1, the two things of step 7 lying
  outside its estimate, and the four musts of step 0 fitting into two days are the rapporteur's judgement.
- Nobody has counted how many Changes archived after the pin changed product behaviour. The product seat looked only
  at the names of ETHOS's 24 and did not count AIGW CLI's 12.
- The engineering seat's block asked for arm C to be restored. It was restored with "may be deferred to step 3";
  whether that seat sees the deferral as a weakening, the rapporteur cannot judge for it.
- Rounds 3 and 4 ran no build or test and made no Git write. Verified read-only in round 4: the quotations at
  dossier lines 52, 77, 80 and 82; the four source constants above; that the two sentences match the rulings file
  literally; that the five dissents match the vote files literally. Other numbers newly reported by members, such as
  the count of archived Changes after the pin and the 10,113 lines of the projection layer, were not rechecked.
