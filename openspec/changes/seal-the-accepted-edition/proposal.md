## Why

Acceptance is a JSON file beside the delivery. A reader of the edition never
sees that a named person accepted it, the record holds no date, and nothing but
the file's own word says who accepted. The owner asked for an acceptance mark
that suits every language and script, since a square Han seal does not.

## What Changes

- `archpub accept` also writes a colophon page, `colophon.pdf`, set by the house
  class: a round acceptance mark in cinnabar, with the publisher's word for
  accepted in the edition's language and the ISO date on its rim and the
  reviewer's name across a band, shaped like any text in any script, worn by
  marks derived from the manifest digest; beside it the reviewer, the date, the
  manifest digest and, when signed, the signer's key fingerprint. The edition's
  own bytes never change.
- **BREAKING**: the acceptance record moves to version 2. It adds `accepted_at`
  (UTC), the optional `seal_name` set on the mark instead of the reviewer's name,
  and, when the reviewer passes `--sign <key>`, an SSH signature of the manifest
  digest in the namespace `archpub-acceptance` and the signer's fingerprint.
- `archpub verify <delivery> [--allowed-signers <file>]` checks every artifact
  against the manifest, the acceptance record against the manifest and the
  colophon page, and, with allowed signers, the signature.
- `archpub publish` copies the colophon page with the delivery and refuses a
  version 1 record or a colophon page that does not match the record.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: acceptance record version 2, the colophon page,
  verification and publication of an accepted delivery.

## Impact

`src/delivery.mjs`, a new acceptance module beside it, `src/cli/run.mjs`, the
house class and edition words, the Skill, the operations reference, CHANGELOG
and tests. Builds are unchanged. Out of scope: other compositions and the house
styles, which have their own Changes.
