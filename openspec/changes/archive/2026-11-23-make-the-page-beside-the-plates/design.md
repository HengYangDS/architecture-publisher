## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its sections "The page
beside the plates (2026-11-23)" and "How the item ended (2026-11-23)". The plates' layout is synchronous: while it
runs, the publisher's process serves no other work, so a page started just before it stands still until it ends,
unless its run of Archify has already begun.

## Goals / Non-Goals

**Goals:**

- A build's page runs Archify while the plates are laid out.
- Every delivered byte of the twelve published works is the same.
- The queue item `performance` ends by its own words, with the profile that ends it.

**Non-Goals:**

- Archify's own time: reported to Archify as tt-a1i/archify#1468.
- A check's order of work: it awaits its page where it did, after the overview.

## Decisions

1. The build waits for the start of Archify's process, not for the page.
   - Rests on: the page's work before Archify runs takes about half a second; the layout after it about twenty.
   - Considered: starting the page and laying out the plates at once, which leaves the page's run waiting for the
     layout; laying out the plates in a worker thread.
   - Chosen because: one callback told by `runArchify` is the smallest change that lets the two run together, and
     the layout stays where it is.
   - Applies to: `src/map/archify.mjs`, `src/map/explainer.mjs`, `src/map/guide.mjs`, `src/build.mjs`.
2. Where shorter strips plan the views again, a generated page starts again with them; the first run is left to end.
   - Rests on: `withStripLength` tries a shorter strip only when a plate does not fit, and the page must be the one
     its delivered views make.
   - Considered: comparing the two plans and keeping the first page when they agree.
   - Chosen because: the retry is rare, and starting again is right whatever the plans hold.
   - Applies to: `src/build.mjs`.
3. `performance` ends with this Change: the largest cause left in a build is Archify's run, reported upstream, and
   in the suite no cause of the publisher's own holds a tenth of its time.
   - Rests on: the profile of the build and of the suite at the commit before this one, and this Change's
     measurement of the build.
   - Considered: a cause read as a source file's self time, under which the channel search's file holds 14.5 %.
   - Chosen because: the item removes work and waiting a build does not need; the search is the work a build
     needs, and its largest function holds 6.5 %.
   - Applies to: `docs/product-contract.md`, `docs/research/build-and-suite-time.md`.

## Risks / Trade-offs

- A build that a plate refuses after its page has started ends with the plate's refusal, as before; Archify's run
  goes on to its end beside it, at most the page's time.
