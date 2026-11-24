## Why

The independent reviews of 2026-11-24 read eight Changes archived without one. Nothing blocks a release, but some of
what 0.18.0 ships is no longer true: the Skill tells a model's author that an unreached view only warns; the
operations table names `overview_view_unreached` without a word of its own; `archpub check` and the operations
reference say a plate leaves its reading out, where the edition now sets it in the plate's head; the reference for
kept answers names candidates only; the overview's spec still asks for a build line its masthead no longer sets; and
the changelog does not name the refusals of models an earlier release accepted.

## What Changes

- The Skill says an edition refuses a view nothing on the overview names.
- `archpub check` says a plate sets its reading in its head; the operations reference and the specs say so, with its
  limit of three lines.
- The operations table describes `overview_view_unreached`; the command-line reference names a kept page.
- The overview's spec states the revision once, in the foot, without a build line in the masthead.
- The changelog's 0.18.0 section names the three refusals of models an earlier release accepted.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: the edition's overview states its revision once, in its foot.
- `edition-delivery`: check names a plate whose reading stands in its head, in at most three lines.
- `poster-composition`: a view whose figure keeps the full width sets its reading in the plate's head.

## Impact

Changed: `skills/architecture-publisher/SKILL.md`, `src/cli/report.mjs`, `docs/reference/operations.md`,
`docs/reference/command-line.md` and `CHANGELOG.md`. No delivered byte; `archpub check`'s text for one case.

Queue: `maintenance`.
