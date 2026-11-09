## Context

See [proposal.md](proposal.md). The Change `set-the-summary-alone-on-overflow` changed `src/overview/house.typ` and
the `edition-delivery` specification and was released as 0.10.2, but its search for the old behavior did not cover
`docs/`.

## Goals / Non-Goals

**Goals:**

- The operations reference states what the released publisher does, in the specification's terms.

**Non-Goals:**

- Reporting in `check` which plates set their summary alone, which would need the check to typeset every plate.

## Decisions

- **Say where the record differs from the page.** `check` reports and the manifest records a plate's planned
  reading, so a plate whose summary is set alone is recorded as set; the reference says so rather than leaving a
  reader to infer it from the edition.

## Risks / Trade-offs

- [The fix lands on `dev` while `main` and v0.10.2 keep the old text] → The docs are not packaged; the next release
  carries them to `main`.
