## Context

See [proposal.md](proposal.md). 0.17.0 was recorded by the last lane of its train (`derive-a-file-s-address-from-the-forge`,
2026-11-22); the release chain reads the head this lane publishes on `dev`.

## Goals / Non-Goals

**Goals:**

- `dev` states the version the release publishes, and the changelog dates it.

**Non-Goals:**

- The release itself: it runs after this lane, on the owner's word.

## Decisions

1. A lane of its own, after `close-edition-map`, started only once the owner has said yes to the release.
   - Rests on: a version recorded on `dev` and never released would state what no channel holds.
   - Considered: a second commit in `close-edition-map`, as 0.17.0 was recorded.
   - Chosen because: the item's close does not wait for the owner's answer, and the record does.
   - Applies to: this Change.
2. 0.18.0, a minor version.
   - Rests on: the contract's Evolution makes a refusal of a model another release accepted a breaking release; under
     1.0.0 a breaking release raises the minor version.
   - Considered: none.
   - Chosen because: the version scheme states it.
   - Applies to: `VERSION`.

## Risks / Trade-offs

- None beyond the release's own.
