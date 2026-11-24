## Context

See [proposal.md](proposal.md). The findings and their answers are kept with the reviews in the checkout's ignored
`build/runtime/work/review-20261124/`; the kit that applies this Change lies in `build/runtime/work/review-code/`.

## Goals / Non-Goals

**Goals:**

- Each finding answered in code, with a test that fails on the code before and passes after.

**Non-Goals:**

- Whether a page the publisher generates turns off Archify 3.3.0's footer panel: the queue item `page`'s to decide.

## Decisions

1. Archify's limit is a timer of the module's own, with a grace.
   - Rests on: `docs/research/build-and-suite-time.md` (the page run beside the plates); `execFile`'s `timeout`
     starts when the child starts; the plates' layout holds the event loop, so the
     timer can fire while a finished run's output waits unread (the reviewer's Node probe).
   - Considered: a longer `timeout`, which moves the cliff and keeps it.
   - Chosen because: a grace on a free loop lets every finished run be read, and a run that hangs still ends.
   - Applies to: `runArchify`.
2. One `AsyncLocalStorage` tells a page's work as each of its runs begins.
   - Rests on: every run of Archify starts in `runArchify`; a candidate's run starts there too.
   - Considered: passing `started` through the chooser and every measure.
   - Chosen because: one place hears every run, and the pages' signatures lose their `started`.
   - Applies to: `telling`, `runArchify`, the build's page.
3. A page the build no longer needs is stopped, and a refusal waits for its work to end.
   - Rests on: the page's work removes its own directories when it ends; every run starts in `runArchify`, which
     reads the signal from the same store as `started`. A stopped run ends Archify's own process and throws
     `archify_stopped`, never an answer: the chooser's answers of the process keep no question that ended without
     one, and other work does not read a question of stopped work: it asks again.
   - Considered: waiting without stopping, which makes a refusal wait for every remaining run of the page, many
     after one another; starting the page once the strips are settled, which loses its overlap with the layout.
   - Chosen because: a stopped run ends at once, so a refusal comes soon and leaves nothing behind, and a page a
     plan replaced stops costing work.
   - Applies to: `telling`, `prepare`, `buildDelivery`, the plan's page.
4. A kept page is keyed by the digest of `explainer.mjs` as well.
   - Rests on: that module forms the verdict, the receipt the delivery keeps and Archify's fixed arguments.
   - Considered: the publisher's version, which misses on every release and keeps a stale answer between them.
   - Chosen because: the key changes when the module that reads the page does; a change in what it calls from
     other modules does not change it.
   - Applies to: `pageParts`, `holdDelivery`.
5. A line back gives way: the element's words, else the overview's word, else none.
   - Rests on: `docs/research/edition-map.md` (the line back); the head keeps one line for its question; a question that long is read on its own.
   - Considered: wrapping or shrinking the question, which changes every head's measure.
   - Chosen because: no model built before changes, and none is refused.
   - Applies to: `src/overview/house.typ`.
6. The search keeps or rejects by one comparison, `wins`, on one score, `scored`.
   - Rests on: the early stop is correct only while it uses the comparison the search makes.
   - Considered: a second copy of the comparison, as before, which a later edit could part.
   - Chosen because: the stop is derived from the comparison, and the test counts one by one beside it.
   - Applies to: `losing`, the search's walk.

## Risks / Trade-offs

- The candidates' runs now overlap the plates' layout; a layout that holds the loop delays the next candidate's
  start, and the limit's grace keeps every answer. The build's time with the earlier start is not measured.
- Every delivered byte is unchanged by reasoning: the choice reads each candidate's answer, not when it came; the
  suite's delivery tests hold it in the proof.
- A kept page misses once after any edit of `explainer.mjs`, a comment included.
- No fixture plans a build twice for shorter strips. Stopping a replaced page is held by the test of a refusal,
  which runs the same stop, and by a test that stops a page amid its candidates and has the next page measure them.
- A plan made again measures again what the stopped page had not finished; its time is not measured.
- A refusal waits for the stopped runs to end, a kill each; what they had written is dropped.
- A stop, like Archify's limit before it, ends Archify's own process only: a child Archify started (a stage of
  `finalize`, its render check, `git`) ends on its own afterwards, and may write into a work directory the page
  has removed.
- A test holds the search's early stop against a count made one by one, not the search's own call of it, which
  passes the stop unchanged.
