## Context

See [proposal.md](proposal.md). 0.2.0-beta.6 and 0.2.0-beta.5 each refuse the
other's publication declaration, so the move follows ETHOS's successor-first
adopter cutover: bind the release from the lane, repair the declaration there,
prove, publish the proposal from the lane, then land and publish from the
canonical root. Architecture Publications made the same move on 7 November with
the same console.

## Goals / Non-Goals

**Goals:**

- Run every gate and lifecycle command of the family, locally and in the hosted
  jobs, on 0.2.0-beta.6.
- Keep the 0.2.0-beta.5 runtime as the rollback until the landing is accepted.

**Non-Goals:**

- Changing a gate, a check, the product, the CI projection or the development
  supply, or publishing `main`, which moves only with a release.

## Decisions

- Bind with the 0.2.0-beta.6 console installed from the release's own mise
  declaration, whose checksums equal the release's `SHA256SUMS`. The bound
  runtime is the one Architecture Publications runs, by digest.
- Remove the retired fields only through `ethos lane repair-paradigm --apply`,
  so the repair is the paradigm's own.
- Record GitHub's public web repository in the local
  `remote.github.forgeRepository`, the key review observation reads for an SSH
  remote; it stays untracked.

## Risks / Trade-offs

- [A gate that passed under 0.2.0-beta.5 fails under 0.2.0-beta.6] → The lane
  runs status after the bind and the repair, and the full proof runs at the
  archived head before landing. A failure is repaired at its owner, or the
  family restores the 0.2.0-beta.5 declaration in a new Change and binds the
  retained runtime.
- [A rollback after the repair] → ETHOS refuses it until a lane restores the
  predecessor's declaration.

## Migration Plan

Bind the runtime, repair the declaration, record the local key, check status,
prove the archived head and qualify it on GitHub and GitLab. To roll back,
restore the three fields in a new Change, then bind the retained runtime with
`hook install --runtime <0.2.0-beta.5 runtime>`.
