## ADDED Requirements

### Requirement: Colophon page

`archpub accept` SHALL typeset `colophon.pdf` beside the delivery in the
edition's language: a round mark in cinnabar whose rim carries the publisher's
word for accepted and the ISO date of acceptance and whose band carries the
reviewer's name or the seal name, and nothing else; and beside it an acceptance
slip. Accepting SHALL leave every artifact of the manifest unchanged.

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

#### Scenario: The mark states no digest

- **WHEN** one reviewer accepts two deliveries with different manifests on the
  same day
- **THEN** the two marks are the same and the two slips name different manifest
  digests

### Requirement: Name inside the band

The mark SHALL set the name at the largest size between 7% and 13% of its width
at which the name's ink fits inside the band on one line, or else on two lines at
that size before any smaller size is tried, breaking two lines where they are
most nearly even. Acceptance SHALL refuse with `acceptance_name_too_long` a name
that fits neither way at 7%.

#### Scenario: A short name

- **WHEN** `Yang HENG` accepts a delivery
- **THEN** the name is set on one line at 13% of the mark's width

#### Scenario: A name wraps before it shrinks

- **WHEN** `Александр Пушкин`, which fits one line above 7% of the mark's width,
  accepts a delivery
- **THEN** the name is set on the two lines `Александр` and `Пушкин`, and the ink
  of both lies inside the band

#### Scenario: A name too long for the band

- **WHEN** a reviewer's name of 55 letters without a space or hyphen accepts a
  delivery
- **THEN** acceptance refuses with `acceptance_name_too_long`, names the name and
  suggests `--seal-name`

### Requirement: Acceptance slip

The slip SHALL label, in the edition's language, the reviewer, the UTC time of
acceptance, the subject (title and release), the commit when the model pins one,
the manifest SHA-256, the signing key's fingerprint or Unsigned, and the note
when given. It SHALL state that acceptance records who accepted which bytes and
when and does not certify that the architecture is correct, and SHALL name the
published files that hold the record.

#### Scenario: A signed Chinese acceptance

- **WHEN** a Chinese edition is accepted with `--sign`
- **THEN** the slip's labels read 验收人, 验收时间, 对象, 提交, 清单 SHA-256 and
  签名密钥, the key's value is its `SHA256:` fingerprint, and the page names
  `acceptance.json` and `acceptance.sig`

#### Scenario: An unsigned English acceptance

- **WHEN** an English edition of a model that pins no revision is accepted
  without `--sign`
- **THEN** the slip has no Commit row, its Signing key reads Unsigned, and the
  page names `acceptance.json` alone

### Requirement: Verification

`archpub verify` SHALL check every artifact against the manifest, the record's
subjects against the manifest and the colophon page, and that `acceptance.sig`
is present exactly when the record names a signer; given `--allowed-signers`, it
SHALL check that `acceptance.sig` verifies the exact bytes of `acceptance.json`
for the reviewer in the namespace `archpub-acceptance`, made by the key the
record names. It SHALL refuse naming the first link that fails.

#### Scenario: A changed colophon page

- **WHEN** the colophon page is edited after acceptance
- **THEN** verification refuses and names `colophon.pdf`

#### Scenario: An unlisted signer

- **WHEN** the record is signed by a key the allowed signers do not list for the
  reviewer
- **THEN** verification refuses with `acceptance_signature_invalid`

#### Scenario: A record edited after signing

- **WHEN** the note in a signed `acceptance.json` is changed
- **THEN** verification with the allowed signers refuses with
  `acceptance_signature_invalid`

#### Scenario: A signature the record does not name

- **WHEN** `acceptance.sig` lies beside a record that names no signer
- **THEN** verification refuses with `acceptance_signature_invalid` without
  allowed signers

#### Scenario: An earlier record

- **WHEN** a delivery holds an acceptance record written by version 0.12
- **THEN** verification and publication refuse with
  `acceptance_version_unsupported`

## MODIFIED Requirements

### Requirement: One acceptance record

`archpub accept` SHALL verify every artifact of a delivery against its manifest
and SHALL write `acceptance.json` as an in-toto Statement v1 whose subjects are
`manifest.json` and `colophon.pdf` by SHA-256 and whose predicate names the
reviewer, the optional seal name and note, the UTC time, the model and, when
signed, the signing key; `--sign` SHALL write `acceptance.sig`, an SSH signature
of the record's bytes. It SHALL refuse when any artifact differs from the
manifest.

#### Scenario: An artifact changed after the build

- **WHEN** a poster was edited after the build
- **THEN** acceptance refuses and names the changed artifact

#### Scenario: A signed acceptance

- **WHEN** a reviewer accepts with `--sign` and an SSH key
- **THEN** the record names the key's SHA-256 fingerprint, `ssh-keygen -Y verify`
  accepts `acceptance.sig` over the bytes of `acceptance.json` for the reviewer,
  and `archpub verify --allowed-signers` with that key passes

#### Scenario: A key ssh-keygen cannot use

- **WHEN** `--sign` names a file that is not a key, or a public key whose private
  half is neither beside it nor held by ssh-agent
- **THEN** acceptance refuses with `acceptance_sign_failed` and writes nothing

### Requirement: Immutable versioned publication

`archpub publish` SHALL require a delivery that verifies, copy it with its
colophon page, acceptance record and any signature to
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

#### Scenario: A signed delivery

- **WHEN** a signed delivery is published
- **THEN** the published version holds `colophon.pdf`, `acceptance.json` and
  `acceptance.sig` byte for byte
