## Context

See [proposal.md](proposal.md). 0.19.0 was recorded by a lane of its own (`record-0-19-0`, 2026-11-25); the release
chain reads the head this lane publishes on `dev`.

## Goals / Non-Goals

**Goals:**

- `dev` states the version the release publishes, and the changelog dates it.

**Non-Goals:**

- The release itself: it runs after this lane, on the owner's word.

## Decisions

1. A lane of its own, after `index-each-part-as-a-paragraph`, the last of the batch the owner chose to release
   together.
   - Rests on: the owner's answer of 2026-11-26 03:45 to release once the batch has landed, one release for its
     breaking changes.
   - Considered: a release now and a second after the batch (two releases, two moves of the works).
   - Chosen because: the owner chose it, and readers meet the breaking changes once.
   - Applies to: this Change.
2. 0.20.0, a minor version.
   - Rests on: the contract's Evolution makes a change of an existing delivery's bytes a breaking release; under
     1.0.0 a breaking release raises the minor version.
   - Considered: none other.
   - Chosen because: the version scheme states it.
   - Applies to: `VERSION`.

## Risks / Trade-offs

- A version recorded on `dev` and not yet released states what no channel holds until the release runs; the
  release starts as soon as this lane's `dev` is green.
