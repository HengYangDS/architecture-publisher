## Context

See [proposal.md](proposal.md). 0.20.0 was recorded by a lane of its own (`record-0-20-0`, 2026-11-26); the release
chain reads the head this lane publishes on `dev`.

## Goals / Non-Goals

**Goals:**

- `dev` states the version the release publishes, and the changelog dates it.

**Non-Goals:**

- The release itself: it runs after this lane, on the owner's word.
- The matrix, the second Change of `compositions`, which lands after this release.

## Decisions

1. A release now, before the matrix.
   - Rests on: the owner's answer of 2026-11-27 to the maintainer's recommendation to release what `dev` holds now.
   - Considered: one release with the matrix, the first Change of `compositions` that draws a plate anew.
   - Chosen because: the owner chose it; the references and the one weight a mark reach readers without waiting on
     the matrix's review and lane.
   - Applies to: this Change.
2. 0.21.0, a minor version.
   - Rests on: the contract's Evolution makes a change of an existing delivery's bytes a breaking release; under
     1.0.0 a breaking release raises the minor version, and the notes hold two breaking entries.
   - Considered: none other.
   - Chosen because: the version scheme states it.
   - Applies to: `VERSION`.

## Risks / Trade-offs

- A version recorded on `dev` and not yet released states what no channel holds until the release runs; the
  release starts as soon as this lane's `dev` is green.
