## Why

Acceptance is a JSON file beside the delivery. A reader of the edition never
sees that a named person accepted it, the record holds no date, and nothing but
the file's own word says who accepted. The owner asked for an acceptance mark
that suits every language and script, since a square Han seal does not, and for
a record that attestation tools can read and a reviewer can sign.

## What Changes

- `archpub accept` also writes a colophon page, `colophon.pdf`, set by the house
  class: a round acceptance mark in cinnabar with the publisher's word for
  accepted in the edition's language and the ISO date on its rim and the
  reviewer's name across a band, shaped like any text in any script; and beside
  it an acceptance slip naming the reviewer, the time, the subject, the commit,
  the manifest digest and the signing key or "Unsigned", with one sentence on
  what acceptance does not certify. The edition's own bytes never change.
- **BREAKING**: `acceptance.json` becomes an in-toto Statement v1 whose
  subjects are `manifest.json` and `colophon.pdf` by digest and whose predicate,
  `https://github.com/HengYangDS/architecture-publisher/acceptance/v2`, names
  the reviewer, the optional seal name and note, the time of acceptance, the
  model and the optional signing key.
- `archpub accept --sign <key>` signs the exact bytes of `acceptance.json` with
  SSH in the namespace `archpub-acceptance` into a detached `acceptance.sig`.
- `archpub verify <delivery> [--allowed-signers <file>]` checks every artifact
  against the manifest, the record against the manifest and the colophon page,
  and, with allowed signers, the signature.
- `archpub publish` copies the colophon page and signature with the delivery and
  refuses an earlier record or a colophon page that does not match the record.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the acceptance Statement and its signature, the colophon
  page, verification and publication of an accepted delivery.

## Impact

`src/delivery.mjs`, a colophon module and page beside the edition, the edition
words, `src/cli/run.mjs`, the Skill, the operations reference, CHANGELOG and
tests. Builds are unchanged, except that the edition's Chinese and Korean foot
name the commit as a commit. Out of scope: other compositions and the house
styles, which have their own Changes.
