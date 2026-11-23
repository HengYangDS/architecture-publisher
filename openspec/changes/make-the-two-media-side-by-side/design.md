## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "The two
media of a build (2026-11-23)".

## Goals / Non-Goals

**Goals:**

- The page's Archify run and the edition's typesetting overlap in a build.

**Non-Goals:**

- Starting the page before the plates are laid out: the page needs the final views, which the plates' strip length
  settles.

## Decisions

1. The page is a promise from prepare to write.
   - Rests on: the build reads the page only to write it and its manifest.
   - Chosen because: no other order of work changes, and a refusal still ends the build before it is moved into place.
2. The test holds the order, not a time.
   - Chosen because: a bound in seconds fails for the host's reasons; "the edition began before the page's delivery
     ended" is false whenever the two run one after the other.

## Risks / Trade-offs

- A refused page is found after the edition is typeset, a few seconds later than before.
- Two children run at once for those seconds.
