## ADDED Requirements

### Requirement: Colophon page

`archpub accept` SHALL typeset `colophon.pdf` beside the delivery: a round mark
in cinnabar with the publisher's word for accepted in the edition's language
and the ISO date on its rim and the reviewer's name, or the seal name, across a
band, its wear derived from the manifest digest; and the reviewer, date,
manifest digest and signature fingerprint or "unsigned". Accepting SHALL leave
every artifact of the manifest unchanged.

#### Scenario: Accepting keeps the edition

- **WHEN** a delivery is accepted
- **THEN** every artifact still matches the manifest and the delivery holds a
  colophon page whose digest the acceptance record names

#### Scenario: A name in another script

- **WHEN** a reviewer named `김민준` accepts an English edition
- **THEN** the mark's rim reads ACCEPTED and the date, and the name is set across
  the band in Hangul

#### Scenario: A name no face can set

- **WHEN** a reviewer's name holds a character no house face draws
- **THEN** acceptance refuses with `acceptance_name_unset`, names the characters
  and suggests `--seal-name`

### Requirement: Verification

`archpub verify` SHALL check every artifact against the manifest, the acceptance
record's manifest and colophon digests, and, given `--allowed-signers`, the
record's SSH signature in the namespace `archpub-acceptance` for the reviewer,
and SHALL refuse naming the first link that fails.

#### Scenario: A changed colophon page

- **WHEN** the colophon page is edited after acceptance
- **THEN** verification refuses and names `colophon.pdf`

#### Scenario: An unlisted signer

- **WHEN** the record is signed by a key the allowed signers do not list for the
  reviewer
- **THEN** verification refuses with `acceptance_signature_invalid`

## MODIFIED Requirements

### Requirement: One acceptance record

`archpub accept` SHALL verify every artifact of a delivery against its manifest
and SHALL write `acceptance.json` version 2 with the reviewer, an optional seal
name and note, the UTC time of acceptance, the manifest digest, the colophon
page's digest and, when signed, the SSH signature of the manifest digest and the
signer's fingerprint. It SHALL refuse when any artifact differs from the
manifest.

#### Scenario: An artifact changed after the build

- **WHEN** a poster was edited after the build
- **THEN** acceptance refuses and names the changed artifact

#### Scenario: A signed acceptance

- **WHEN** a reviewer accepts with `--sign` and an SSH key
- **THEN** the record holds the signature and the key's SHA-256 fingerprint, and
  `archpub verify --allowed-signers` with that key passes

### Requirement: Immutable versioned publication

`archpub publish` SHALL require a delivery that verifies, copy it with its
colophon page to `<root>/<model id>/<version>/`, verify every copied digest,
refuse to replace an existing version with different content and leave every
other version untouched. The default version SHALL be the first twelve
hexadecimal digits of the manifest digest.

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
