## Context

See proposal.md for why the limit goes and the reports arrive. Source binding
reads each cited source at the model's revision through `git cat-file`, in an
environment that never fetches, prompts or takes optional locks. The plan admits
each view through the poster composer and, without declared views, falls back
from one complete view to an overview and one view per group. The page holds
one Archify panel per planned view.

## Goals / Non-Goals

**Goals:**

- Any number of declared or planned views, with nothing else changed for a
  model that has at most four.
- A coverage and currency report that is a set of counts, read from Git at
  exact revisions, identical across runs and leaving the repository unchanged.

**Non-Goals:**

- Directory sources, inferring architecture from code, and a score or a floor
  that refuses a model.
- Coverage figures on posters or the page.
- Separating page planning from poster composition, or splitting the page.

## Decisions

- **No replacement limit.** A count would need a reason a reader accepts, and
  none exists: the poster composer pages any number of views, and Archify's
  explainer admits up to 500 panels and otherwise checks byte budgets; a model
  beyond that is refused with Archify's own diagnostic. A page with many views
  is long; the author owns that choice, and splitting the page is a separate
  change.
- **The panel list stops at four.** The list beside the conclusion is the
  explainer's reasons, whose schema holds four. A page of more views lists none
  and keeps its numbered panels, since a partial list would misstate the page
  and a fifth reason is refused; the supply stays unmodified. The bound names
  Archify's own limit and refuses nothing.
- **The scope is declared in the model.** What a work claims to describe is
  part of the work and is reviewed with it, so every run on one model measures
  the same scope. A `--scope` option was rejected because the result would
  depend on the caller.
- **Files and bytes, not lines.** `git ls-tree -r -l` reports every tracked
  file's size without reading it; counting lines would read every blob for a
  figure that bytes approximate.
- **The largest uncovered directories are maximal subtrees.** Every directory
  that holds an uncovered file and no cited file is a candidate. The largest by
  bytes are listed, skipping any inside or around one already listed, so the
  list names whole parts the model leaves out rather than their pieces.
- **Currency uses Git's own rename detection.** `git diff-tree -r -M` between
  the pin and the named revision tells unchanged, modified, moved and deleted,
  and `git rev-list --first-parent --count` gives the commits since. A pin that
  is not an ancestor of the named revision is reported, not refused.
- **Counts never refuse.** Only unreadable inputs refuse: an unknown revision,
  a failed Git read, or `--against` without a model revision. Whether a model
  cites enough stays the author's and the reviewer's judgement.
- **One Git reader.** Binding and measurement share one reader with one
  environment, so the read-only requirement holds for both by construction.

## Risks / Trade-offs

- A rename with large edits may fall below Git's similarity threshold and be
  reported as a deletion. The report states Git's own reading; an author can
  check the commit.
- A page with many views grows by one panel and one viewer each. The corpus is
  unaffected; heavier pages are the author's choice until the page is split.

## Migration Plan

Existing models and deliveries are unaffected, and a model with more than four
views now validates. Consumers that match the removed refusal codes or the
import warning drop those matches.
