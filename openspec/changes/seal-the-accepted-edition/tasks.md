## 1. Record and mark

- [ ] 1.1 Write acceptance record version 2 (`accepted_at`, optional `seal_name`, optional signature and fingerprint) with `--seal-name` and `--sign`; done when delivery tests read every field back and refuse a missing reviewer, an existing record and a key `ssh-keygen` cannot use.
- [ ] 1.2 Set the colophon page with the round mark and the record's facts in the edition's language; done when the page compiles for English, Chinese, Arabic, Hindi and a long name, and the mark's wear differs between two manifests.

## 2. Verify and publish

- [ ] 2.1 Add `archpub verify <delivery> [--allowed-signers <file>]`; done when tests show it passing an accepted delivery, refusing a changed artifact, a changed colophon page, a version 1 record and a signature from an unlisted key.
- [ ] 2.2 Publish the colophon page with the delivery and refuse an unverified one; done when publication tests copy it and refuse a mismatched page.

## 3. Documents

- [ ] 3.1 Update the operations reference, the Skill, CHANGELOG and the command help; done when every new option, refusal and file is named.

## 4. Verification

- [ ] 4.1 Run `npm run check` and the full test suite; done when both pass.
