## Why

The previous source readers execute Git/Python/ETHOS during ordinary consumption
and require synthetic Git identities even for other projects. A portable product
needs a data-only, explicitly selected source boundary before either renderer
can be migrated without carrying those assumptions forward.

## What Changes

- Add a small source-bundle reader and CLI that verify an externally selected
  manifest digest, safe relative member paths, exact membership and file bytes.
- Preserve source identity as data; a Git revision is not mandatory.
- Return scoped integrity evidence, never an official-source replay or semantic
  acceptance claim. Do not execute input files or follow symlinks.
- Package this slice with no product runtime dependencies. Test the installed
  package in a clean temporary project without Git, ETHOS or the old checkouts.
- Retain the accepted ETHOS artifacts and existing source exporters unchanged.

## Capabilities

### New Capabilities

- `source-intake`: verify an explicit, closed, content-bound source bundle without
  implicit source execution, project-specific identities or machine assumptions.

### Modified Capabilities

None. This establishes the successor's first boundary; it does not claim that
renderers, browser qualification, recovery installation or A as a whole exist.

## Impact

New files are confined to `src/source/`, `src/cli/`, `tests/`, `package.json`,
`package-lock.json` and minimal contributor guidance in this owned Work Lane.
No old repository, artwork, ETHOS product code, source schema or upstream reader
is modified by this change. The generic envelope describes files, not a new
universal architecture semantics system.
