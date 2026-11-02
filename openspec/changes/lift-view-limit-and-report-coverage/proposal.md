## Why

A model cannot say all of its system, and nothing tells its author what it
leaves out.

- A model holds at most four views, because one Archify explainer page was
  taken to hold at most four diagrams. Archify's explainer admits up to 500
  panels, so the limit cuts what a model can say without a reason a reader
  would accept. An automatic plan of an overview and four or more groups is
  refused for the same reason. Archify does cap the conclusion's reasons at
  four, and the page lists its panels as those reasons, so that list alone
  needs a bound.
- `archpub check` verifies that each cited source exists at the pinned
  revision, but not how much of the repository the model cites, which parts it
  leaves out, or how far the repository has moved since the pin. The published
  works cite from 5 to 73 percent of their declared scope, and two are about
  200 commits behind their repositories; no command shows it.

## What Changes

- **BREAKING** The four-view limit is removed from the model, its schema, the
  automatic plan and the LikeC4 import. A model declares any number of views,
  and an automatic overview with any number of group views is planned when each
  view is admitted. The refusals `model_views_exceeded` and
  `plan_views_exceeded` and the import warning `likec4_view_limit` no longer
  occur.
- The page lists its panels beside the conclusion only while Archify's four
  reasons hold them; a page of more views has its numbered panels alone.
- A model may declare `coverage`: the repository paths it describes and the
  paths it leaves out, each with a reason.
- `archpub check` lists the components and relations no planned view draws and
  those that cite no source.
- With `--repo`, `archpub check` reports coverage at the pinned revision: the
  files and bytes in scope, cited, uncovered and excluded, the scope paths that
  match no file, and the largest directories that hold no cited file. With `--against <revision>`, it reports
  currency: the commits since the pin and whether each cited source is
  unchanged, modified, moved or deleted. Both are counts read from Git; neither
  scores nor refuses a model.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reading-plan`: views without a count limit, and the statements no view
  draws.
- `architecture-model`: the optional coverage declaration.
- `interactive-map`: the panel list holds for up to four views.
- `source-binding`: the coverage and currency reports, read-only like binding.

## Impact

Model validation and schema, the automatic plan, the LikeC4 import, the page
draft, a coverage reader beside source binding, the check result and its
`--against` option, their tests, the model and operations references, the
product contract, the README, the product skill and the changelog. The corpus models declare at most four views, so
their posters and pages build byte-identical.

Out of scope: directory sources, a coverage figure on posters or the page,
separating page planning from poster composition, which moves with the
replacement of the poster engine, splitting the page into several pages, and
the LikeC4 import's report of the element tags, links and metadata it does not
carry.
