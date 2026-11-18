## Context

The exact search of one channel (`src/layout/channel-solver/search.mjs`) tries a choice for each wire and asks
`compatible` whether it fits the wires already chosen. `compatible` walked every label row of the channel for every
chosen wire, and for each row asked `rowsPassed` for the list of rows each vertical passes, to look one row up in
it. A channel has at most three label rows, so each list is short, and the search asks hundreds of millions of
times. The Change `solve-a-channel-once` made the solver remember a result for an equal input; what a channel costs
the first time was left as it was.

A build with a page asks the vendored Archify twice: `validate explainer` when the page is prepared, so that a bad
page ends the build before the edition is typeset, and `finalize explainer` when the delivery is written, whose
first gate validates again. A generated page first chooses each view's diagram (`src/map/choice.mjs`): Archify
measures every candidate document, a verdict for each and a layout for each that passes, each run a process that
starts the renderer in another. The choice remembers a document it has measured, in its own process. A test file
is a process, and the suite's files build the same fixtures.

## Goals / Non-Goals

**Goals:**

- A build's time in the channel solver falls to what the search itself needs.
- A build asks Archify for its page once.
- A run of the suite asks Archify once for a candidate document, whichever of its files meets it.
- Every delivered byte is what it was, and every refusal says what it said.
- The time of a build and of the suite has a place in the queue and a record that is read.

**Non-Goals:**

- No change to what the search finds, to its budget or to the order in which it tries choices; no change to which
  candidate diagrams are measured or to how they are ranked.
- No answer is kept unless the caller names a directory: a default place for kept answers is a decision of its
  own, with what removes them.
- What one run of Archify costs is Archify's: a run that answers many documents, or gives the layout with the
  verdict, is proposed there and not built here.
- The suite's width and the pipelines that repeat on one commit: each is a further cause in the record and is
  measured on its own before a Change takes it.

## Decisions

### 1. The check looks at the two rows two choices stand on

Rests on: `docs/research/build-and-suite-time.md` (the profile of a build, and the same build after the change) and
`docs/research/channel-search-cost.md` (which named `rowsPassed` on 2026-11-17).

Considered: remembering `rowsPassed`'s lists by vertical and row; computing each choice's rows once when the search
makes the choice; asking whether a vertical passes one row, without a list, and looking only at the rows on which
two choices can meet.

Chosen because: a label and a jog stand on their own choice's row, so two choices meet only on the row of one of
them: on a row neither stands on, no rule of the check can refuse. The third way needs no store and no change to
the search, and it is the definition read the other way round: a vertical from the top passes the rows above its
turn, one from the bottom those below. The definition stated row by row stays in the tests as the answer the check
is held to.

Applies to: `src/layout/channel-solver/conflicts.mjs` (`compatible`, `rowCrossings`).

### 2. `performance` stands first among the open items, with an end

Rests on: `docs/research/build-and-suite-time.md` (what one Change costs the host, and where a build's and the
suite's time goes).

Considered: `Queue: maintenance` for every change of this kind; an item at the end of the queue; an item first in
line.

Chosen because: the queue's own rule refuses a maintenance Change that touches the layout's source, and the causes
found so far lie there. Every Change of every later item pays the suite seven times, so the item is cheapest first.
An item with no end would hold the queue, so it ends by a rule: when the largest cause a profile of a build and of
the suite still shows holds under a tenth of the time, or belongs to another product and is reported there.

Applies to: `docs/product-contract.md` (Queue).

### 3. What keeps the cost from returning

Rests on: `docs/research/build-and-suite-time.md` (Not established: no time budget holds on a loaded guest).

Considered: a test that bounds a build's seconds; a test that counts the check's work; the record alone.

Chosen because: a guest under load runs the same test five times slower, so a bound in seconds fails for the host's
reasons and is then loosened. The work the check does is countable and the same on every machine: the test reads how
often the check looks at a choice's verticals and requires the same count for a channel of one label row and of
three. The times themselves stand in the research page and are read again at every landing of this item.

The same holds for the two other costs: a test counts the runs of Archify a build and a check start for a page,
and a test counts the runs a question starts with an answer kept and with none.

Applies to: `tests/channel-conflicts.test.mjs`, `tests/page-single-run.test.mjs`, `tests/archify-answers.test.mjs`.

### 4. A build's page is prepared with its delivery

Rests on: `docs/research/build-and-suite-time.md` (finding 5: the separate validation is 17 s of a 40 s build, and
the delivery without it is the same 13 files).

Considered: leaving the validation out and letting the delivery refuse; reading the findings of a refused
delivery from the receipts Archify writes beside it; delivering when the page is prepared and holding what was
written.

Chosen because: the delivery stands after the edition is typeset, so the first way would refuse a bad page
minutes later than today, and a delivery's answer names eight findings where a validation names all, which the
loop that withholds a file Archify will not cite reads. The second way reads files whose names and form are
Archify's own. The third asks once: Archify validates, writes and checks the page into a directory of its own
when the page is prepared, the page holds those bytes, and the build writes them where it delivered before. Only
a page Archify refuses is then validated on its own, for the whole of its findings, so a refusal costs the two
runs every build cost before. A check delivers nothing and keeps its one validation.

A guide is cloned once, where it was cloned for its validation and again for its delivery, and nothing but a
prepared page is delivered: `deliverGuide` leaves, and the test that held its clone asks `guidePage`.

Applies to: `src/map/explainer.mjs` (`explainerPage`, `holdDelivery`, `writeDelivery`), `src/map/guide.mjs`
(`guidePage`), `src/build.mjs` (`prepare`, `buildDelivery`).

### 5. Archify's answers are kept by what they answer, where the caller names a directory

Rests on: `docs/research/build-and-suite-time.md` (finding 2: one test file starts 2116 Archify processes; the
suite before and after).

Considered: one build shared by the tests of a file; a default place for kept answers under the user's cache
directory; running Archify's command inside the publisher's process or in a thread of it; a directory the caller
names, with answers kept by content.

Chosen because: tests that share a build share its state, and each would no longer build what it asserts.
A default place is state nobody asked for, with nothing that removes it. Archify offers its command line and no
module to import, and its renderer is a process of its own either way. The choice already holds that the verified
Archify answers one document one way and remembers its answers in the process; a directory extends that to the
processes of one run and to a caller who wants it, such as an author who builds a work again. An answer is kept by
the supply's digest, the Node.js and platform that ran Archify, the kind of answer, the quality and the document:
what is asked, and not the arguments or the file it was asked through. Only a whole answer is kept or read, a
verdict Archify reached or a layout it drew, so a refusal, a renderer that died once and a file that is no answer
are asked again; of the 4089 answers one run of the suite kept, 57 were refusals, so little is given up. A path
that cannot be made a directory refuses the build before Archify is asked, since the caller named it. A single
answer that cannot be written afterwards is not kept and fails nothing: a full disk, a directory removed
meanwhile or, on Windows, a file another program holds at that instant would otherwise refuse a build whose
answer is in hand. Without the variable the product does what it did.

Applies to: `src/map/archify.mjs` (`candidateAnswer`), `src/map/choice.mjs` (`measure`, `layoutOf`),
`tests/fixtures/archify-answers.mjs`, `tests/installed-cli.test.mjs`.

### 6. Three changes, each measured alone, in one Change

Rests on: `docs/research/build-and-suite-time.md` (what one Change costs the host: the suite seven times, and each
pipeline the host's slot for the length of its Windows job).

Considered: a Change for each; one Change with a commit and a test for each.

Chosen because: each was written in a copy of the source of its own and measured there against the same base, so
each gain is known apart from the others. A landing costs two pipelines of about forty-five minutes of the host's
one slot, which is the cost this item exists to reduce. One landing carries the three as separate commits, each
with the test that fails before it.

Applies to: this Change's commits and `tasks.md`.

## Risks / Trade-offs

- [The rewritten check differs from the old one on some input the tests do not ask] → 40,000 seeded questions with
  both answers in the thousands, each asked with one to five wires chosen; the old definition is kept as the
  oracle; and the published works are built before and after and compared byte for byte.
- [The count of reads ties the test to how the check is written] → it states the one property that matters, that
  the cost does not grow with the rows, and nothing else about the code.
- [A page delivered when it is prepared differs from one delivered at the end] → Archify records where the draft
  lay relative to the page, so the delivery is made in a directory laid out as the delivery's own; the published
  works with guides are built before and after and compared byte for byte, and the tests of pages and guides pass
  unchanged.
- [A page that validates and whose delivery Archify refuses, in a build that would fail later as well] → it is
  refused when the page is prepared, so that refusal now comes first, the output's parent directory is not made
  and the last step named is the page's preparation. The refusal itself is the same.
- [A kept answer outlives what it answered] → it is kept by the supply's digest, Node.js and platform, so another
  Archify or runtime reads none of it; the suite's directory is made for one run and removed with it, and a run
  ended by a signal leaves one that a later run removes after a day.
- [The directory grows, and a directory that cannot be written is silent] → archpub never prunes what the caller
  named and says so in the reference; a directory that exists and takes no file keeps nothing and costs the time it
  was meant to save, which a caller sees in the directory staying empty. A word on standard error for it would be
  a new kind of output and is left out.
- [Any file under the right name that reads as a whole answer is taken for Archify's] → the directory is the
  caller's to guard, as the checkout is; the reference says so.
- [The suite's tests of another installation read this checkout's answers] → the test of the installed package
  names no directory to it, so it measures every candidate itself.
- [A directory someone else can write] → it is trusted as the checkout and the installed package are; the
  reference says so.
- [Kept answers hide a fault of Archify within a run] → each document is still asked once a run, and the tests of
  the choice assert on what was chosen, as before.
