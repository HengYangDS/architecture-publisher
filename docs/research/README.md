---
subject: architecture-publisher:research
role: index
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Research

What the publisher's decisions rest on: studies, measurements and records, one page each. The directory exists on
the owner's direction of 2026-11-15, quoted here as it was relayed to this repository:

> 「说简单点，会话易失、仓库稳定，关键的东西需要沉淀到仓库中最佳位置和载体上」
>
> 「另外，docs/research 也要好好建设下，调研很重要」

Glosses, which are translations and not the owner's words: "Put simply: a session is volatile and a repository is
stable; what matters has to settle in the repository, in its best place and on its best carrier." "Also, docs/research
should be built up well; research matters."

## What a research page is, and is not

A research page records what was asked, what was read or measured, what was found, what was compared, what follows
and where it applies, and what is not established. It keeps every source with how it was read, and every marking of
second-hand, unverified and trial where the finding stands.

A research page decides nothing. A decision lives in the design of its OpenSpec Change, in four labelled parts (Rests
on, Considered, Chosen because, Applies to), and its "Rests on" names the research page. A page is not a plan, a
task list or a log of work; where its working material lies only in an ignored, local directory, the page says so.

## The form of a page

Every page has these parts, in this order; headings may be worded to fit:

1. Question.
2. Short answer, five lines at most.
3. What was read or measured: each source with what it is and how it was read (directly, in part, second-hand); a
   measurement with its method and its numbers.
4. Findings.
5. What was compared, and what speaks for and against each.
6. What follows for the product, and where it applies.
7. What is not established; where two sources or files disagree, both are given and the page settles neither; when
   the records settle one later, the page says what stands and when it was reconciled.
8. Record: the date, the role that did the work, and where the working material lies.

Sources read through a tool or a search summary carry their mark at every claim. A page is amended, with the date,
when its study is extended; a table that waits for a run says so.

## Pages

| Page                                                                           | Topic                                                                                        | Date                     | State                                                                                                                                               | Decisions that rest on it                                                                                                                                    |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Letter height by viewing distance](viewing-distance-and-letter-height.md)     | How large a letter must be to be read from the farthest seat; standards, rooms, print        | 2026-11-15               | Study of one day; the CJK floor is second-hand. The study stands; the default and the tiers drawn from it are withdrawn (2026-11-16)                | Decision D5; its relation of size, angle and distance stands in decision D7. Rulings R5 (default of 4 H) and R6 (typed tiers) rested on it and are withdrawn |
| [Text on projected pages](text-on-projected-pages.md)                          | How much text a page shown in a room holds; practice; how lines of Chinese text are set      | 2026-11-15               | Study of one day; measured gains are for narrated talks only. Its subject, pages of text in the presentation, is set aside (2026-11-16)             | Committee rulings R2 and R3, read again on 2026-11-16: a statement page is a fallback, no page class of the presentation                                     |
| [Layout of pages that are mostly text](text-page-layout.md)                    | Type scale, a page that stands alone, tables, code, alignment, the portrait booklet          | 2026-11-15               | Study of one day; several items not established. Its subject is set aside for the presentation (2026-11-16)                                         | Committee ruling R9; R2 and R4, read again on 2026-11-16; R6, whose typed tiers are withdrawn                                                                |
| [Tidiness, built in and measured](tidiness.md)                                 | What untidiness is; a measure of the finished PDF, its calibration and limits; overruns      | 2026-11-15 to 2026-11-16 | Calibrated on six labelled pages; not in the product                                                                                                | Committee ruling R9 (geometry); the three layers of the working note                                                                                         |
| [Links and outlines in the PDFs Typst writes](pdf-links-and-outlines.md)       | What Typst 0.15.1 writes for internal, cross-file and web links and for the outline          | 2026-11-15               | Internal links measured; cross-file links not proved                                                                                                | Decision D4; committee ruling R9 (links)                                                                                                                     |
| [The committee of 2026-11-15: a record](edition-forms-committee-2026-11-15.md) | The questions, the seats' votes, the ruling R1 to R10, the dissent, the owner's decisions    | 2026-11-15               | Record. On 2026-11-16 R2, R3, R4 and R8 were read again, and R5's default, R6's typed tiers and R7's 24 pt floor for relation labels were withdrawn | Decision D3; it is itself the record of R1 to R10                                                                                                            |
| [Room-size fit of the six works' views](room-size-plate-fit.md)                | Which views the layout places on one page at room sizes, and how they are wired              | 2026-11-15 to 2026-11-16 | All six works in both languages measured; layout only, nothing drawn. The requirement it tested is withdrawn (2026-11-16)                           | Decision D7, whose reach of the present plates is computed from this run's record. The ruling of R7's open part, which rested on it, is withdrawn            |
| [What the second proof showed](second-proof.md)                                | A hand-set proof of the presentation and the booklet: capacity, readings, plates, page count | 2026-11-15 to 2026-11-16 | Trial material; readings by a model only. Superseded as a form by the third proof (2026-11-16); its measurements stand                              | Decision D6. Two that rested on it are withdrawn: R6's tiers as typed sizes, among them the scale B preferred here, and the ruling of R7's open part         |
| [Reach of type on figures](reach-of-type-on-figures.md)                        | To what distance a figure's text can be read, and what size a viewing condition asks for     | 2026-11-16               | Prototype on two views of one work; every angle second-hand; nothing in the product                                                                 | Decision D7, a design to be shown and not yet ruled                                                                                                          |

The rulings R1 to R10 and the decisions D1 to D6 are not yet in any Change's design. Until each enters one, they lie
in `build/runtime/work/committee-20261115/` and `build/runtime/work/style-research/round-5/`, which are ignored and
local to one checkout. Decisions D1 and D2 name no study and rest on no page here.

The pages hold 51 external addresses, each given by its study. They were requested once on 2026-11-16: 49 answered;
the handout cited in [Layout of pages that are mostly text](text-page-layout.md) was already gone when the study
read it, and the address of the FAA standard in [Letter height by viewing distance](viewing-distance-and-letter-height.md)
refused an automated request. No check of the repository requests them again.

The queue item `blocks-by-question` was renamed `figure-pages` on 2026-11-16. Pages that point forward to the item
use the new name; records of earlier rulings keep the name they used.

## Not yet written up

- The style research of rounds 1 to 4 and its topic directories: what was studied, the 33 prototypes, what was kept
  and cut and why. It lies in `build/runtime/work/style-research/` (ignored, local).
- The first hand-set sample book: its plan, kit, 37 page sources and the setters' reports, in
  `build/runtime/work/sample-book/` (ignored, local).
- The position papers and votes of the committee's seats, which the committee's record did not read.
- The test of cross-file links on named viewers: open; its page says what to test.
