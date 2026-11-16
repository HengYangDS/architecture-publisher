## Context

See [proposal.md](proposal.md). On 2026-11-16 the owner asked: 「你深入盘点下，还有哪些幻觉和误区，给我系统性地都揪出来，改正掉」,
and 「并且要求至少一位独立评审，进行全面审视和纠错」. Four reviewers with no part in the building, and a fifth of another
origin, read the plan, its records and the documents against a ledger of the owner's own messages, extracted by
script from the sessions' transcripts. The ledger and the reviewers' reports are the maintainer's local evidence
and are not in the repository. This Change carries what they found in the documents on `dev`; the Change
`order-the-queue-by-the-figure-language` carried what they found in the queue.

Every edit of a research page was logged with its old words, its new words and the evidence read, and a script
confirmed that no other word of a page changed. The log is local evidence beside the reviewers' reports.

## Goals / Non-Goals

**Goals:**

- A research page states no number, time or attribution that a reviewer found wrong.
- A reader of a page that reports a withdrawn ruling learns that under the page's title.
- The README and the tutorial claim nothing that no record supports.

**Non-Goals:**

- Rewriting what a research page concludes. A page stands as a record of what was read and measured.
- The picture at the head of the README, which shows a plate that the code no longer draws: it is rebuilt with the
  item `composable-parts`, which changes every plate again.
- The name "print edition" in the documents and the command's messages: the item `portrait-edition` names both
  forms of the edition.
- A page on the reach of type on figures. It was drafted on 2026-11-16 for a Change that did not land, and its
  premise was withdrawn.
- The words "text is never shrunk" in the contract and the README. The facts reviewer found them contradicted by a
  queue item that spoke of steps of smaller type; that item left the queue with the Change
  `order-the-queue-by-the-figure-language`. The specification `edition-delivery` states the principle in the same
  words, and the specification `poster-composition` and the operations reference describe the five type steps, a
  sparse view being set at a larger one.

## Decisions

1. A wrong fact is corrected to what its source shows, and a number without a source says so.
   - Rests on: the facts reviewer's findings with their evidence. The counts of the second proof's cited passages
     were derived again from the proof's data, and the share of small type in the first sample book from its pages.
   - Considered: removing the sentences that held the wrong numbers.
   - Chosen because: a research page is a record, and a corrected number with its derivation serves a reader
     better than a gap. Where no derivation was found the page says that the number could not be traced, so that
     nothing rests on it.
   - Applies to: `second-proof.md`, `viewing-distance-and-letter-height.md`, `room-size-plate-fit.md`,
     `tidiness.md`, `text-page-layout.md`.
2. What the owner said is given in the ledger's words with its time, and a pick or a preference is called what it
   was.
   - Rests on: the attribution reviewer's findings. A pick in a dialog is the owner's pick among options the
     builder worded, and the option's wording is the builder's. A sentence that prefers one of two pages shown is a
     preference between those pages. A ruling of the committee of 2026-11-15 is its chair's: the owner had
     delegated the decision and confirmed no ruling.
   - Considered: leaving the attributions and adding one general note to the index.
   - Chosen because: each wrong attribution became a premise somewhere else; the plan of 2026-11-14 to 2026-11-16
     went wrong in that way. A note in an index does not reach a reader of one page.
   - Applies to: `edition-forms-committee-2026-11-15.md`, `second-proof.md`, `text-on-projected-pages.md`,
     `text-page-layout.md`, `pdf-links-and-outlines.md`, `tidiness.md`, `room-size-plate-fit.md` and the index.
3. A page that reports a ruling withdrawn on 2026-11-16 says so in a dated note under its title.
   - Rests on: the withdrawals of that day: pages of statements, tiers of type as sizes typed into a scale with a
     floor of 24 pt for a room, and a booklet of statements. Each note quotes the owner's words that the withdrawal
     answered, with their times.
   - Considered: removing the pages; rewriting their "What follows".
   - Chosen because: what the pages read and measured stands, and only what was built on it fell. A note under the
     title is read before the conclusions it qualifies.
   - Applies to: six pages; `tidiness.md`, `pdf-links-and-outlines.md` and the index report no withdrawn ruling.
4. The tutorial's duration is removed.
   - Rests on: the facts reviewer's finding that no timing of the tutorial is on record. The only timings of an
     author on record are for whole works: one delivered in 53 minutes and two not delivered in ninety.
   - Considered: timing the tutorial once with an agent as its reader.
   - Chosen because: the sentence promises a person's time, and an agent's run does not measure it. The tutorial
     says what it builds without the number.
   - Applies to: `README.md`, `docs/tutorial.md`.

## Risks / Trade-offs

- [A correction is itself wrong] → Every edit is logged with its evidence, a script confirms that nothing else
  changed, and each quotation of the owner in a changed page is looked up in the ledger before the lane is proven.
- [The notes make the pages read as void] → Each note says what was withdrawn and that the page stands as a record
  of what was read and measured.
- [A reader misses the tutorial's duration] → A timing by a person can return the sentence, with who timed it.
