## Why

The final profile of the queue item `performance` on 2026-11-23, a build of ETHOS's Chinese edition (36.2 s): the
publisher's process planned and laid out the plates from 0 to 22.4 s, and the page's one run of Archify went from
23.7 to 35.3 s, beside the edition's typesetting from 23.7 to 28.6 s. The page needs the planned views and not the
plates, yet it started after them, so the build's last 6.7 s waited for it. The rest of the profile, of the build
and of the suite, shows no cause of the publisher's own above a tenth of its time.

## What Changes

- Archify tells its caller when its process has begun; the generated page and the guide pass that on.
- A build starts its page as soon as its views are planned and waits only until Archify's process has begun: the
  plates' layout, which holds the publisher's process, then runs beside Archify's run. A generated page starts
  again where shorter strips plan the views again; a guide needs no view and starts once.
- A test holds the order: a build's page starts its run of Archify before the plates are laid out.
- The performance record and the changelog say so.
- A second commit closes the queue item `performance`: the contract ticks it, and the record says how it ended,
  with the final profile and Archify's issue.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: every delivered byte is the same; only when the page's work starts changes.

## Impact

Changed: `src/map/archify.mjs`, `src/map/explainer.mjs`, `src/map/guide.mjs`, `src/build.mjs`,
`tests/media-side-by-side.test.mjs`, `docs/research/build-and-suite-time.md` and `CHANGELOG.md`; in the second
commit `docs/product-contract.md`, `docs/research/build-and-suite-time.md`, `docs/research/README.md` and
`CHANGELOG.md`.

Queue: `performance`.
