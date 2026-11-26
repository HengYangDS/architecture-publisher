## Why

The model's schema states its categories, and the fields Change of 2026-11-26 had the loader read every object of
the model from it. Outside the loader the categories are still written again: three tables of how a category looks
(its icon, Archify's type, its hue) and two sets of those outside the system (in `src/kinds.mjs` and a test fixture),
each keyed by the eight categories with no test against the schema; the default category, `backend`, in four places
and not in the schema; the LikeC4 importer's categories and its rule for an id's characters and length; and the two
earlier versions `archpub migrate` converts, in the loader, the migrator, the command's help and a refusal's meaning.
The queue item `derived-references` asks that each be stated once.

Queue: `derived-references`.

## What Changes

- How each category looks (its default icon, Archify's type, whether it lies outside the described system, whether
  it takes the palette's accent role) stands in one table in `src/kinds.mjs`; its presentation, the map, the poster
  and the layout tests' fixture read it, and a test holds its keys to the schema's categories in their order. A
  group's look (its icon and the category it takes the look of) stands beside it.
- The schema states the default category; the model's normalizing and the LikeC4 importer read it, and the test holds
  the drawing units' category for a part with no kind to it.
- The LikeC4 importer's categories are held to the schema's at import, and every id the import makes (a component's
  from its element's full name, a group's, a relation's from its two ends, a view's) takes its characters and its
  longest length from the model's id pattern: a text past 120 characters now keeps up to 128, its suffix included.
- The earlier versions `archpub migrate` converts are written once, in the loader; the migrator reads them and gives
  the command's help its versions, and the refusal registry's meaning names no number.

Out of scope: the reference documents that restate the categories, the statuses, the versions and a refusal
(`model.md`, `operations.md`, `command-line.md`), a later Change of the queue item.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the categories' looks, the default category, the LikeC4 importer's ids and categories, and
  the earlier versions each stated once in the publisher's code.

## Impact

`src/kinds.mjs`, `src/icons.mjs`, `src/map/archify.mjs`, `src/poster/tokens.mjs`, `src/model/` (the schema, the
vocabulary, the loader, the normalizing), `src/importers/` (LikeC4 and the migrator), `src/cli/run.mjs`,
`src/refusal.json` and its reference table, and three tests. An id the LikeC4 import makes from a text longer than 120
characters is longer; the published schema gains the default category as an annotation, which changes no model's
validity; the help of `migrate` reads as before.
