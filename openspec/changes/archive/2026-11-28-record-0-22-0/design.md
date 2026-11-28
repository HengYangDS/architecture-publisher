## Context

See [proposal.md](proposal.md). 0.21.0 was recorded by a lane of its own (`record-0-21-0`, 2026-11-27); the release
chain reads the head this lane publishes on `dev`.

## Goals / Non-Goals

**Goals:**

- `dev` states the version the release publishes, and the changelog dates it.

**Non-Goals:**

- The release itself: it runs after this lane, on the owner's word.
- The fill levers that measure a plate's blank further, which land after this release.

## Decisions

1. A release once the spine has landed, before the item `compositions` closes.
   - Rests on: the owner's answer of 2026-11-28 to the maintainer's recommendation to release after the spine.
   - Considered: one release when `compositions` closes, with the further fill levers; no release now.
   - Chosen because: the owner chose it; the four compositions reach readers without waiting on the levers'
     measures and review.
   - Applies to: this Change.
2. 0.22.0, a minor version.
   - Rests on: the contract's Evolution makes a change of an existing delivery's bytes a breaking release; under
     1.0.0 a breaking release raises the minor version, and the notes hold breaking entries.
   - Considered: none other.
   - Chosen because: the version scheme states it.
   - Applies to: `VERSION`.

## Risks / Trade-offs

- A version recorded on `dev` and not yet released states what no channel holds until the release runs; the
  release starts as soon as this lane's `dev` is green.
