## Why

A model names its overview composition by a path relative to the model. When no
file is at that path, `archpub check` and `archpub build` stage the
composition's directory anyway and run Typst on an entry that is not there. The
refusal is `overview_typst_error` with Typst's "input file not found", naming a
path in a temporary directory, and a missing directory fails with a bare
`ENOENT` instead of a refusal. Neither names the model's `overview` value or
where the publisher looked. A model copied without the `overview.typ` beside it
met this on 2026-11-04.

## What Changes

- When the overview is built, the publisher checks that the model's composition
  is a file before it stages anything or runs Typst. When it is not,
  `archpub check` and `archpub build` refuse with
  `overview_composition_missing`, naming the model's `overview` value and the
  path looked at, and the build writes nothing.
- The operations reference lists the case under `overview_composition_missing`,
  and the changelog records the fix.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: a named composition that is not there is refused by name.

## Impact

Overview preparation in the build, its tests, the operations reference and the
changelog. Models, manifests and deliveries do not change.
