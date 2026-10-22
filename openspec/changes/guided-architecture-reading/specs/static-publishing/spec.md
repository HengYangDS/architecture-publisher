## ADDED Requirements

### Requirement: Canonical Raster bytes and native rebuilding have explicit guarantees

The packaged Raster output SHALL retain one canonical digest pair. Native
rebuilding SHALL use a pre-admitted witness in the existing source manifest,
bound to the exact Rust/Cargo identities, compiler host and `wasm-bindgen` version.
Unknown identities SHALL fail closed; execution SHALL NOT learn expected hashes.

#### Scenario: A qualified host rebuilds frozen source

- **WHEN** two independently extracted, relocated offline/frozen builds finish
- **THEN** original inputs remain unchanged and both outputs match the selected witness
- **AND** canonical and rebuilt imports/exports, selected-font measurement, declared errors and representative authored PNG bytes agree
- **AND** the evidence claims neither cross-host Wasm byte identity nor universal equivalence

#### Scenario: A host has no admitted native witness

- **WHEN** the observed compiler or binding-tool identity has no exact manifest match
- **THEN** native rebuild verification fails without changing expected bytes
- **AND** canonical package integrity remains a separate requirement
