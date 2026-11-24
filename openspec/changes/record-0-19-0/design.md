## Context

See [proposal.md](proposal.md). 0.18.0 was recorded by a lane of its own (`record-0-18-0`, 2026-11-24); the release
chain reads the head this lane publishes on `dev`.

## Goals / Non-Goals

**Goals:**

- `dev` states the version the release publishes, and the changelog dates it.

**Non-Goals:**

- The release itself: it runs after this lane, on the owner's word.

## Decisions

1. A lane of its own, after `answer-the-reviews-in-the-code`, started only once the owner has said yes to the release.
   - Rests on: a version recorded on `dev` and never released would state what no channel holds.
   - Considered: a second commit in the last code Change.
   - Chosen because: the code's landing does not wait for the owner's answer, and the record does.
   - Applies to: this Change.
2. 0.19.0, a minor version.
   - Rests on: the contract's Evolution makes a change of an existing delivery's bytes a breaking release; Archify
     3.3.0 redraws every page; under 1.0.0 a breaking release raises the minor version.
   - Considered: 0.18.1, which the holder had named before reading the Evolution again.
   - Chosen because: the version scheme states it.
   - Applies to: `VERSION`.

## Risks / Trade-offs

- None beyond the release's own.
