## Purpose

Write deterministic deliveries with a manifest, record one acceptance and
publish accepted deliveries as immutable versions.

## ADDED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet
exist: an SVG and PNGs at 2400 and 6000 px for each poster page, the explainer page
`index.html` and `manifest.json`. It SHALL stage the delivery and move it into place only after
every artifact succeeds, so a refused or failed build leaves no output.

#### Scenario: An existing output directory

- **WHEN** the output directory already exists
- **THEN** the build refuses without changing it

#### Scenario: A failure during rendering

- **WHEN** the page fails after the posters were written to the staging area
- **THEN** the build refuses and neither the output directory nor the staging
  area remains

### Requirement: Deterministic manifest

The manifest SHALL record the model digest, the publisher version, the digests
of the bundled fonts and the layout, raster and Archify supplies, the plan, the
digest of every artifact and every source record with its verification state.
It SHALL contain no timestamps, host paths or user names, so the same model
built with the same version yields the same manifest.

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version
- **THEN** both manifests are byte-identical

### Requirement: Measures and evidence in the manifest

The manifest SHALL record each poster's composition and gate measurements,
each view diagram's Archify metrics, the sources the page withholds and the
details, statuses and sources of every component and relation.

#### Scenario: Evidence kept off the drawing

- **WHEN** a component has details and sources
- **THEN** the manifest's evidence lists them under the component's id

### Requirement: Check without output

`archpub check` SHALL run validation, source binding, planning, frame
admission and the page's Archify checks and SHALL report the result without
writing a delivery; what Archify measures is written to a temporary directory
and removed.

#### Scenario: Checking an oversized model

- **WHEN** a model with an oversized view is checked
- **THEN** the result reports the refusal for that view
- **AND** no file is written

### Requirement: Machine-readable results

Every command SHALL accept `--json` and then print exactly one JSON object with
`ok` and either its outputs or its diagnostics. The exit status SHALL be 0 on
success, 1 for a refused input and 2 for a usage error.

#### Scenario: A refused build with JSON output

- **WHEN** a build with `--json` refuses an invalid model
- **THEN** standard output holds one JSON object with `ok: false` and the
  diagnostics
- **AND** the exit status is 1

### Requirement: One acceptance record

`archpub accept` SHALL verify every artifact of a delivery against its manifest
and SHALL write `acceptance.json` with the reviewer, an optional note and the
manifest digest. It SHALL refuse when any artifact differs from the manifest.

#### Scenario: An artifact changed after the build

- **WHEN** a poster was edited after the build
- **THEN** acceptance refuses and names the changed artifact

### Requirement: Immutable versioned publication

`archpub publish` SHALL require a valid acceptance record, copy the delivery to
`<root>/<model id>/<version>/`, verify every copied digest, refuse to replace an
existing version with different content and leave every other version
untouched. The default version SHALL be the first twelve hexadecimal digits of
the manifest digest.

#### Scenario: Publishing twice

- **WHEN** the same accepted delivery is published twice to the same root
- **THEN** the second publication reports the existing identical version and
  changes nothing

#### Scenario: A conflicting version

- **WHEN** a different delivery is published under an existing version name
- **THEN** publication refuses and the existing version is unchanged

#### Scenario: An unaccepted delivery

- **WHEN** a delivery without an acceptance record is published
- **THEN** publication refuses and copies nothing
