## Context

See [proposal.md](proposal.md). `npm run check:spec` runs `openspec validate --all --strict` with the
development dependency; ETHOS archives Changes with the OpenSpec it bundles, which its own release
moves.

## Goals / Non-Goals

**Goals:**

- Validate the specifications with OpenSpec 2.0.0.

**Non-Goals:**

- Installing OpenSpec skills in `.agents/skills/`, which waits for ETHOS to register them.
- Any change to the publisher, its package or a delivery.

## Decisions

- Move only `@fission-ai/openspec` and the transitive entries npm changes for it, with the npm the
  repository pins, so no other dependency moves with it.
- Run `openspec update --dry-run` to confirm that, with no tool configured, 2.0.0 would write or
  remove nothing in the repository.

## Risks / Trade-offs

- [2.0.0 is younger than the 24-hour cooling period] → The owner approved the exception for this
  package; OSV must report no advisory for it.
