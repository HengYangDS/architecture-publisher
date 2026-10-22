# `ethos-input` Specification

## Purpose

Provide an explicitly replayed, byte-bound ETHOS architecture source that can
subsequently be consumed without executing product source or requiring its checkout.

## Requirements

### Requirement: Explicit source replay

The importer SHALL require the exact Git commit, expected projection digest,
exporter digest, policy-owner digest and explicit Git/Python executables before
executing selected source code. It SHALL never substitute current checkout files.

#### Scenario: Selected exporter bytes do not match

- **WHEN** either selected code blob differs from its requested digest
- **THEN** import fails before running Python or creating the output bundle

#### Scenario: Import output already exists

- **WHEN** the explicit output path is already occupied
- **THEN** existing contents remain unchanged and import fails

### Requirement: Offline byte-bound source consumption

The offline consumer SHALL verify the selected source bundle and projection
identities, preserve all source entities, relations and qualifiers, and match
all referenced and embedded documents without executing any source code.

#### Scenario: The real accepted projection is relocated

- **WHEN** a valid bundle is moved to a host with no source repository or Git/Python executable lookup
- **THEN** the full selected projection and source documents remain available
- **AND** the read reports integrity but not a newly performed official replay or semantic acceptance

#### Scenario: A source-bound member changes

- **WHEN** a referenced document, embedded view/copy/quality value or projection binding differs
- **THEN** consumption fails rather than accepting partial or self-consistent substituted meaning
