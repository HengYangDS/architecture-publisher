## Context

See [proposal.md](proposal.md). The move follows ETHOS's successor-first adopter cutover: bind the
release in the lane, prove, publish the proposal from the lane, then land and publish from the
canonical root. Between 0.2.0-beta.10 and 0.2.0-beta.11 four Breaking rules start to block: Markdown
list spacing, the canonical text owner, package docstrings and README index roles; ETHOS's own Node
moves to 26.13.1. The copies run of 18 and 19 November 2026 proved this tree's `dev` of that day on
the released head e4d9d04d3. Its pipelines come from its own `.config/ci/pipeline.cue`, not from
ETHOS's projection, so the release's 14-day artifact retention does not reach them.

## Goals / Non-Goals

**Goals:**

- Run every gate and lifecycle command of the family, locally and in hosted jobs, on 0.2.0-beta.11.
- Keep the 0.2.0-beta.10 runtime as the rollback until the landing is accepted.

**Non-Goals:**

- Changing any gate, check, renderer, supply file or runner declaration.
- Changing the pipelines or their artifact retention, which the repository's own generator owns.
- Moving the hosted jobs' Mise or any other supply: a supply move is its own lane.
- Turning on `[peer_identity] mode = "required"`.

## Decisions

- Copy the release's own declaration unchanged and lock it with native `mise lock`, after checking
  each platform checksum against the release's `SHA256SUMS` and the published asset digests; the
  lock stays at version 3 because locking an existing lock again keeps its version.
- Keep the repository's own release age as `hold-third-party-supply-24-hours` declared it
  (Mise's `minimum_release_age = "24h"`, npm's `min-release-age=1` in `.config/npm/npmrc`); this
  move changes neither.
- Keep the gate providers under their legacy `ethos.<module>:<callable>` names in
  `.ethos/profile.toml` while 0.2.0-beta.10 is the rollback: 0.2.0-beta.11 notes
  `gate_provider_legacy_name` with the catalog ID to declare, and 0.2.0-beta.10 refuses an ID.
- Launch every local proof as the hosted jobs do, under `mise exec --locked --` in the work
  tree, so that a declared command gate finds the tools the repository declares (a known open
  defect of the release's entry).

## Risks / Trade-offs

- [A gate that passed under 0.2.0-beta.10 fails under 0.2.0-beta.11] → The lane runs the gates after
  the bind, and the full proof runs at the archived head before landing. A failure is repaired at
  its owner, or the family restores the 0.2.0-beta.10 declaration in a new Change and binds the
  retained runtime.
- [A rollback after the declaration change is not qualified by 0.2.0-beta.11's journey] → A rollback
  restores the 0.2.0-beta.10 declaration and lock in a new Change and runs the full proof before it
  lands, so this repository proves its own rollback instead of assuming it.

## Migration Plan

Copy the declaration, lock it, install the locked supply, bind the runtime, run the gates, prove the
archived head and qualify it on GitHub and GitLab. To roll back, restore the 0.2.0-beta.10
declaration and lock in a new Change, then bind the retained runtime with the current console's
`hook install --runtime <0.2.0-beta.10 runtime>`.
