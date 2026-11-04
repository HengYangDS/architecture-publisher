## Why

Re-pinning a work moves `repository.revision` to a later commit and builds it.
The build resolves every claim there and refuses a claim left empty or a
relation file that is gone, and `archpub check --against <revision>` counts
the cited files that changed. Neither says whose files changed, which new files
a claim would take in, which relations rest on changed evidence or which guide
citations moved. Archify checks only that a cited line range exists at the
revision, so after a re-pin a citation whose lines moved cites other text
without a warning. Thirty-eight commits after the ETHOS work's pin, three of its
guide's 117 citations point at moved lines and two cite text that changed.

## What Changes

- With `--against <revision>`, `archpub check` reports a re-pin worklist beside
  the currency counts. Per component it lists the owned files modified, moved
  with the component their new path falls to, and deleted, and the files its
  claims take in at the named revision. Per relation it lists the cited files
  that changed. It names the claims that would own no file and the relation
  files absent at the named revision, and the files of the scope there that
  newly fall under no claim.
- For a model that names a guide, the worklist classifies each line range that
  the draft's sources and its diagrams' node sources cite: the same, shifted
  with its range at the named revision, moved with its new path, touched when a
  change falls within its lines, or gone.
- The JSON result carries the worklist under `coverage.currency.worklist`, and
  the text names each component, relation and citation that needs the author.
- The worklist is a report: the check still passes, and Git is only read.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `source-binding`: the currency report gains the re-pin worklist and the fate
  of a guide's citations at the named revision.

## Impact

Source binding and coverage, a new worklist module, the guide reader, the check
result and its text, the tests and their fixture repositories, the operations
reference, the product skill and the changelog. Models, manifests and
deliveries do not change.
