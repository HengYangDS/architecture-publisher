## Context

See proposal.md for why. `VERSION` is the only maintained product version.
`tools/release/version.mjs --write` projects it into the npm manifest and its
lock, and the generated-input gate checks that projection. `ethos land
--release` refuses a tag that differs from `VERSION` with
`release_tag_version_mismatch`.

## Goals / Non-Goals

**Goals:**

- Release what `dev` holds as 0.8.0 on both Forges.

**Non-Goals:**

- Publishing editions of the works or recording their acceptance; that stays
  with the owner.
- Changing code, supplies or models.

## Decisions

- **A minor version.** Below 1.0.0 the minor version carries incompatible
  changes, as the changelog says, and model version 2 and the removed view
  limit are incompatible.
- **The release notes are the changelog's section.** As for 0.4.0 to 0.7.0,
  each Forge's Release body is the dated section, so the changelog and the two
  Releases never disagree.

## Risks / Trade-offs

- [A Forge's Release fails after `main` and the tag are published] → The tag is
  the release; the Release is created again from the same tag and the same
  assets, which are read back by digest.
