## Context

The lock names the Node.js runtime for development, CI and the release archives, which
`tools/release/archive.mjs` assembles from the lock's official downloads. The repository binds
ETHOS through the Git-common runtime selection but declares no ETHOS release in its Mise
configuration; architecture-publications declares the 0.2.0-beta.9 release declaration there.

## Goals / Non-Goals

**Goals:**

- Run and ship Node.js 26.13.1 everywhere the lock reaches.
- Run ETHOS 0.2.0-beta.9 through a declared, locked release.

**Non-Goals:**

- Retiring repository gates that ETHOS composes, and the common CI template; each follows in its
  own Change after a proof preview.
- Moving the CI's Mise version.

## Decisions

### Lock with native Mise

`mise lock` writes the new entries; the move is accepted only when the lock's version stays 3 and
the only entries that change are Node.js's and the added ETHOS ones.

### Declare ETHOS as the release publishes it

The configuration takes the 0.2.0-beta.9 release declaration unchanged, as
architecture-publications does, so both repositories select one runtime by one declaration.

### One patch release

Both moves change no behaviour, so they ship together as 0.13.1 instead of in two releases.

## Risks / Trade-offs

- [A gate of 0.2.0-beta.9 finds a gap 0.2.0-beta.6 did not] → the proof reports it and this
  Change repairs it before landing.
- [A runtime defect in Node.js 26.13.1] → the full suite runs on all five CI platforms before
  landing; rollback is 0.13.0 and the 0.2.0-beta.6 binding ETHOS keeps.

## Migration Plan

None for users: install 0.13.1 as any release.

## Open Questions

None.
