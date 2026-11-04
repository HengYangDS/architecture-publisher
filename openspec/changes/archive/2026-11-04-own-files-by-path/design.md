## Context

The publisher binds a model's declared sources to a revision by path and digest
and measures how much of the repository's scope they cite. A component's
sources are a list of catalog ids, so ownership is whatever the author listed.
The published works' authors listed it from ordered path rules in scripts the
repositories do not hold. A probe that gave each file to its most specific rule
path reproduced the AIGW work's 210 attributions with 30 paths and the ETHOS
work's 455 with 135 paths, except eight package initializers that a script
heuristic had attributed against its own rules.

## Goals / Non-Goals

**Goals:**

- A model states ownership as claims a reviewer can read, and the publisher
  derives the cited files and their digests at the revision.
- Every file in the scope has at most one owner, by construction.
- Version 1 models convert without losing a citation.

**Non-Goals:**

- Globs in claims, ordered rules and a committed lock file.
- Inferring relations or their evidence from imports; relations cite the files
  their author names.
- Migrating the published works; Architecture Publications does that in its
  own Change.

## Decisions

- **The most specific claim wins.** A file claim owns its file; otherwise the
  deepest directory claim that holds the file does. Ordered first-match rules,
  as the scripts used, were rejected: their meaning depends on an order a
  reviewer has to reconstruct. Because each path may be claimed once, the most
  specific claim is unique and needs no tie rule.
- **Claims are paths, not globs.** The specificity of two overlapping globs has
  no natural order. The coverage scope keeps its globs, so tests beside the code
  stay out of every claim.
- **Ownership stays inside the scope.** A claim owns only files in the coverage
  scope, and a claim that owns none is refused, so a typing error, a file the
  scope leaves out, a claim that deeper claims leave empty and a file a re-pin
  removed are found at once.
- **The manifest is the lock.** The revision already pins every byte; each
  build records every cited file's digest and owner, and an edition is accepted
  on that manifest. A committed lock file would duplicate both. It can return
  with the re-pin worklist if reviewers need moved files in a diff.
- **A component's first file is the first file of its first claim**, in Git's
  path order within a directory. Authors keep choosing what a page cites by the
  order of their claims, and a migrated model cites what it cited before.
- **Page sources are numbered.** The generated page names its sources
  `source-1`, `source-2` and onward in citation order, since claims have no ids.
- **The manifest moves to version 5**, because its source records and evidence
  change shape.
- **Migration converts, the author folds.** `archpub migrate` writes each
  component's cited files as file claims and reports a file that two components
  cite, keeping it with the first. Folding files into directory claims changes
  ownership for files no source cited, so it stays the author's decision.

## Risks / Trade-offs

- [A re-pin removes or moves a claimed file] → The build refuses and names the
  component and its claim; the author edits the claim, which a review can read.
- [A directory claim takes a file its author never meant to cite] → `check`
  and the manifest record each cited file with its owner, so a reviewer sees
  ownership, not only claims.
- [Generated pages renumber their sources] → Page bytes change once; posters and
  overviews stay byte-identical, and each component still cites the same file.
