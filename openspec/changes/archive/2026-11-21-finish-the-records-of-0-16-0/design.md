## Context

See [proposal.md](proposal.md). The released texts are read from the tags: `git show v0.15.0:CHANGELOG.md` and the
versions in `package.json`, the icon supply and the Mise configuration at `v0.15.0` and `v0.16.0`.

## Goals / Non-Goals

**Goals:**

- Each released section of the changelog says what its release holds.
- The README's plate is the one the latest release builds.

**Non-Goals:**

- Older sections that differ from their tags: the alpha sections were reworded when the 0.3.0 line was summed up,
  as their own Changes recorded.
- The plate's width: the README keeps the 2400 px image it has shown since 0.13.1, which 0.16.0 builds with
  `--png 2400`.

## Decisions

1. Restore the released section rather than amend it.
   - Rests on: the 0.15.0 section at the tag `v0.15.0`, and the three moves present first at `v0.16.0`.
   - Considered: a note in 0.15.0 that the moves belong to 0.16.0; the released text is the record of the release.
   - Chosen because: a reader of a release's section reads what that release holds, and the tag already says it.
   - Applies to: the 0.15.0 and 0.16.0 sections of `CHANGELOG.md`.
2. Keep released sections from being edited again by mistake.
   - Rests on: the maintainer's lane tools, whose quick refusals now refuse a lane that changes a released section
     unless its configuration names the version it corrects.
   - Chosen because: the fault came from a lane's script, so the refusal stands where lanes are run; this Change
     names 0.15.0 and 0.16.0.
   - Applies to: every lane of the maintainer's tools.

## Risks / Trade-offs

- [The plate changes the README's image bytes] → It is the delivery's own image, compared by bytes after the copy.
