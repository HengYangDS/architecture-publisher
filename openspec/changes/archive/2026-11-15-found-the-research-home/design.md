## Context

See [proposal.md](proposal.md). The material was written between 2026-11-14 and 2026-11-16 in
`build/runtime/work/` (ignored, local): `sample-book/book/redesign/RESEARCH.md` and `RESEARCH-layout.md`,
`tidy/README.md`, `committee-20261115/`, `style-research/round-5/DECISIONS.md`, `room-fit/` and
`sample-book/proof-2/`. The pages were drafted from it by an agent that added no fact, source or number, and were
read by the queue's holder; where two of the records disagreed, the holder settled the record first and the page
says what stands and when it was reconciled.

## Goals / Non-Goals

**Goals:**

- Every study and record that a ruling on the edition's forms rests on is a page of the repository, with its
  sources, how each was read, and what is not established.
- A later design can write "Rests on" and name a page.

**Non-Goals:**

- Any change of the product, its contract or its queue: the rulings enter through the Changes of `model-four`,
  `one-anatomy` and `blocks-by-question`.
- The tools of the studies (`tidy.py` with its tests, the room-fit scripts, the proofs' kit and build): they stay
  where they are until the queue item that makes one a gate of the product takes it in with its tests.
- The style research of rounds 1 to 4 and the first sample book: the index names them as not yet written up.

## Decisions

1. A research page records and decides nothing; a decision lives in a Change's design and names the page.
   - Rests on: the owner's direction quoted in the proposal, and ETHOS's rule for a design decision (Rests on,
     Considered, Chosen because, Applies to), landed there on 2026-11-15.
   - Considered: decision records under `docs/`; keeping studies inside each Change's design.
   - Chosen because: a study outlives the Change that first used it and serves several; a design that carried its
     studies would be archived with them. A page that also decided would be a second place where the product is
     ruled.
   - Applies to: every page under `docs/research/`.
2. One form for every page, in eight parts, with the marks of how a source was read kept at each claim.
   - Rests on: the studies' own practice of marking a source as read in full, in part or from a search summary.
   - Considered: free-form notes; one long document.
   - Chosen because: a reader must see at a claim whether it was read or relayed, and "what is not established"
     is the part a later decision most needs. One document of the two studies alone would pass the size limit of
     500 lines.
   - Applies to: the eight pages; the index states the form.
3. The committee's ruling is kept as a record, its numbers marked as trial values.
   - Rests on: the ruling's own text: it advises and decides under the owner's delegation, and each ruling enters
     the product through its queue item's Change.
   - Considered: writing the rulings into the product contract now.
   - Chosen because: the contract's queue changes by a commit that says what it moves back, and the owner has not
     yet seen the whole second proof. A record can be cited today without ruling the product.
   - Applies to: `edition-forms-committee-2026-11-15.md` and `second-proof.md`.
4. External addresses are kept as the studies give them and requested once, with the result in the index.
   - Rests on: one request of each of the 51 addresses on 2026-11-16: 49 answered, one was gone when its study
     read it, one refused an automated request.
   - Considered: a gate that requests them at every check; removing the addresses.
   - Chosen because: a source without its address cannot be reread, and a gate on other hosts' availability would
     fail the repository's checks for reasons outside it.
   - Applies to: the pages' source lists.

## Risks / Trade-offs

- [A page states as fact what its study only relayed] → The drafting kept every mark of second-hand, unverified and
  trial; the holder read the index and the reconciled places; the pages name their working material so that a
  doubt can be checked while that directory exists.
- [The working material is lost with the checkout] → The pages hold the findings, numbers and sources; the tools
  and proofs are named in the index as not yet in the repository, with the queue item that takes them in.
- [The room-fit page is stale] → Its tables are replaced by the full run's before the lane is proven, or the page
  says which works are measured.
