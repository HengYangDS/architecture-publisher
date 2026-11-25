## Why

The queue item `page-figures`: the page's diagrams are laid out by the publisher. With the item's earlier Changes the
publisher lays out a guide's architecture, entity-relationship, class and workflow files, but a file that places
anything is still drawn as its author placed it, and every published file states its repository by hand
(`docs/research/page-figures.md`). So an author may still place a diagram, and the repository is written twice.

## What Changes

- **Breaking:** a guide whose diagram files state a field the publisher sets is refused when it is read, by a
  check as by a build (`page_diagram_publisher_field`), every field of every file a problem: a position, size,
  cell, column, layout, width or gap, the course of a line, a workflow's phases or groups, or a repository. One table
  by kind, read from Archify 3.3.0's schemas, names them; a dataflow's rows and a sequence's message heights, which
  Archify requires, stay the author's.
- With a checkout, every diagram file names the model's repository URL and revision, and the Forge and link mode the
  draft's `repo_provider` and `repo_link_mode` name.
- `archpub scaffold guide` writes its diagrams without those fields, so a scaffolded guide builds.
- The model and operations references say so; the research page records what the published files state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a guide's diagram files leave placing and the repository to the publisher.

## Impact

Changed: `src/map/guide-figures.mjs`, `src/map/guide.mjs`, `src/build.mjs`, `tests/guide-figures.test.mjs`,
`tests/guide-grid.test.mjs`, `tests/guide-workflow.test.mjs`, `tests/guide.test.mjs`, `tests/fixtures/guide-work.mjs`,
`docs/reference/model.md`, `docs/reference/operations.md`, `docs/research/page-figures.md` and `CHANGELOG.md`. A
model built before builds the same bytes unless its guide's files state such a field; the published works do, and
drop them when they take the release (they stay on 0.18.0 until then).

Queue: `page-figures`.
