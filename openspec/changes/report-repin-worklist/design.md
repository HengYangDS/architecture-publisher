## Context

`check --against` reads Git's diff from the model's revision to a named one and
reports each cited file as unchanged, modified, moved or deleted, with counts.
The binding gives each file in the scope to its most specific claim at the
model's revision and refuses a claim that owns nothing and a relation file
absent there. A guide's draft cites repository line ranges in `@source`
directives, and its diagrams cite them in their nodes' `sources`; Archify
checks that each cited range exists at the revision, not that it holds the same
text.

## Goals / Non-Goals

**Goals:**

- Before building a work at a later revision, its author sees what changes for
  each component, relation and guide citation.
- Every class comes from Git's history between the two revisions, and nothing
  new is stored.

**Non-Goals:**

- Writing the re-pinned model or moving its citations; a later command may.
- Recording cited text or its digest in the manifest.
- Judging whether a relation or a claim still holds; the worklist names the
  evidence that changed.

## Decisions

- **One ownership resolution for both revisions.** The binding's claim
  resolution becomes a function that returns each file's winning claim and the
  problems a build would refuse, at any commit. The build refuses those
  problems at the model's revision; the worklist reports them at the named one.
  A second resolver inside the worklist was rejected: two readings of the most
  specific claim could drift apart.
- **Renames come from Git.** The worklist reads the same rename-detecting diff
  as the currency report, so a moved file and its new owner follow Git's
  reading. A file moved into another component's claim is listed as moved by
  the first and taken in by the second.
- **Newly uncovered, not all uncovered.** The worklist lists the files in the
  scope at the named revision that no claim takes and that were not uncovered
  at the model's revision. The coverage report of the re-pinned model counts
  all of them.
- **Citation fates come from Git's zero-context hunks.** A citation is touched
  when a hunk's old lines overlap its range or an insertion falls inside it,
  and otherwise shifted by the lines the hunks above it add or remove. Its file
  being renamed makes it moved, classified within the renamed file, and its
  file being deleted makes it gone. Comparing the cited text was rejected: it
  needs that text recorded at the pin, which the revision already determines.
- **The guide is parsed where it is read.** The guide reader lists the draft's
  `@source` citations that name a path and lines and its diagrams' node sources
  that name a line, and the build passes them to the coverage measure. The
  sources unit reads no guide.
- **A report, not a gate.** The check passes whatever the worklist holds, so a
  re-pin can be planned from it; the build at the named revision still refuses
  what it refuses today.

## Risks / Trade-offs

- [Git misses a rename with heavy edits] → The file is listed as deleted under
  its owner and its successor as taken in or newly uncovered, so the author
  sees both.
- [A citation without lines] → It is the same when its file is unchanged and
  touched when the file changed.
- [A hunk above a range that also removes lines within it] → It overlaps the
  range, which is touched, never shifted.
