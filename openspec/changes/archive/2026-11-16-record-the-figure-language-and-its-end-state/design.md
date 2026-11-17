## Context

The research home, `docs/research/`, holds what decisions rest on. On `dev` at `fedb474e` it held eight pages, none
on how a figure is drawn. What had been studied and drawn of the figures between 2026-11-01 and 2026-11-16 lay in
ignored directories; `docs/research/figure-language.md`, added by this Change, maps it and measures the gap.

The queue of `docs/product-contract.md` orders the product's open work by the dimensions of the figure language. It
states no end: an item's Change was written against the owner's latest remark. On 2026-11-17 the owner asked for
the end state, and decided three things that this design records.

## Goals / Non-Goals

**Goals:**

- The material every open item of the queue starts from is tracked, and a Change of an item cannot be written
  without naming it.
- The contract says where the queue leads, and what an input may state.

**Non-Goals:**

- No figure changes. Each item of the queue changes the product by its own Change.
- The overview composition is not removed here: `carriers` replaces it.
- The handbook design of 2026-11-07, on what a work says, is the publications' and is not tracked here.

## Decisions

1. No input states where anything stands.
   - Rests on: `docs/research/figure-language.md`, "Inputs that state positions": the model's schema holds no
     property of position and the twelve guides no coordinate, while the twelve overview compositions place every
     mark by coordinates, 66 to 85 lines of each. The owner, 2026-11-17 02:08:37:
     「产品能力不应该要求上游输入写坐标，这不符合产品的定位、产品逻辑和价值点等」.
   - Considered: keeping the composition as an author's free page beside the generated figures; removing it at once.
   - Chosen because: the product's promise is that its author says what a work is and the publisher draws it. A
     page placed by hand is the author's drawing set in the publisher's faces; it is what the product exists to
     make unnecessary, and it is each edition's first figure. Removing it at once would leave the six works
     without that page before a figure of the publisher's can take its place.
   - Applies to: every input, now and added later. The overview composition stays until `carriers` draws the
     overview from the model; a test holds the model's schema to the rule.
2. The contract states the end state of the figure language.
   - Rests on: `docs/research/figure-language.md`, "Why the material was not at hand", and
     `docs/research/figure-prototypes.md`. The owner, 2026-11-17 02:07:23:
     「对于构件，我们讨论很多了，以及其他方面也都讨论过。现在收束一下，理想终态应该是什么样的呢」; and at 02:11:24, to the
     end state the holder had stated: 「我基本上同意你的收束」. The owner agreed in the main; the wording is the
     holder's.
   - Considered: the queue alone, as until now; an end state kept in a design and not in the contract.
   - Chosen because: four times in three weeks the work turned away from the figures after material that showed
     the way, each time following the latest remark. An item read against a stated end can be judged; a design is
     archived with its Change and the contract stays.
   - Applies to: the contract's Evolution section. Each line of the end state is reached by an item's own Change
     and binds nothing before it.
3. Three open items are worded against the end state.
   - Rests on: `docs/research/figure-language.md`, "The dimensions, with what exists" and "What was compared". The
     owner, 2026-11-17 01:43:24, to four questions the holder had put with a recommendation on each:
     「先按你建议的方式」. The recommendations were the holder's wording: a kind's icon stands by its label on the
     card, a plate's key keeps the strip and the lines, and one page teaches the kinds; the compositions are tiers,
     a matrix, a spine and a radial one, and the hanging composition of 2026-11-11 is not built; rules and what a
     work writes join the carriers, with an author's notes and a figure of what a work covers; the owner's own
     style stands as rules on the figure and not as four boxes of text.
   - Considered: leaving the items' wording and keeping these choices in each item's design.
   - Chosen because: the queue is what a Change is held to, and an item that does not name the overview, the key
     or the words made from facts would be finished without them.
   - Applies to: `composable-parts`, `compositions` and `carriers`. The order of the queue does not change, and
     nothing moves back.
4. A Change of a queue item names a research page.
   - Rests on: `docs/research/figure-language.md`, "The research home": none of the figures' material was
     tracked, and the items named none of it.
   - Considered: a rule in the contract's prose alone; a required section in each proposal.
   - Chosen because: the retrospectives of 2026-11-14 and 2026-11-16 found that a rule kept in prose was broken
     within hours and one kept in a test held. The design is where a decision already says what it rests on.
   - Applies to: active Changes that name a queue item. A maintenance Change may rest on none.

## Risks / Trade-offs

- [The end state was agreed in the main, and one of its lines may not be the owner's] → It stands in one section
  of the contract, and one commit rewords a line.
- [A Change could name a research page it does not use] → The test holds the reference, not its use; a reviewer
  reads the design's "Rests on".
- [Twenty-six pictures add about 3 MB to the repository] → They are the record of prototypes that exist nowhere
  else; `docs/` is not in the package.
- [The pages recast sources without reading them anew] → Each page says so in its record, and keeps every mark of
  second-hand and unverified.
