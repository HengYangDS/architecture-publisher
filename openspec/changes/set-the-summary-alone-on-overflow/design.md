## Context

See [proposal.md](proposal.md). The house class sets a plate's reading in one column beside a narrowed figure: the
view's summary, 40 points, the heading for where each part lives, and each shown component's label over its claimed
paths. It measures that column and refuses it when it is taller than the body less 24 points. The owner chose, on
9 November, to set the summary alone when the whole reading does not fit.

## Goals / Non-Goals

**Goals:**

- Every plate whose summary fits beside its figure sets that summary.
- No text is shrunk, abbreviated or moved to another page.

**Non-Goals:**

- Shortening paths to their directories: the refused plates would still list 11 to 26 directories.
- Setting part of the paths: a list cut where the column ends would read as complete.
- Reporting in `archpub check` which plates set their summary alone: the check plans plates without typesetting them.

## Decisions

- **Two columns, measured in order.** The class builds the whole reading and the summary alone, and sets the first
  whose height fits the body less 24 points. A view without a summary has no shorter reading, so it is refused as
  before when its paths do not fit.
- **The fallback drops the heading with the paths.** A heading over nothing would promise a list the plate does not
  set.

## Risks / Trade-offs

- [A plate that sets its summary alone no longer says where its parts live] → The page's components still link to
  the files they were read from, and the work's page lists every claim; the contents and the page are unchanged.
- [An author is not told which plates set their summary alone] → The plate shows it, with no heading for where each
  part lives; reporting it in `archpub check` would need the check to typeset every plate.
