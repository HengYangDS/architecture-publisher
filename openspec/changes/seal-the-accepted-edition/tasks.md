## 1. Record and mark

- [x] 1.1 Write `acceptance.json` as an in-toto Statement v1 of `manifest.json` and `colophon.pdf` with the acceptance predicate, and with `--sign` an SSH signature of its exact bytes in `acceptance.sig`; done when acceptance tests read every field back, ssh-keygen verifies `acceptance.sig` over `acceptance.json`, and accept refuses a missing reviewer, an existing record, page or signature, and a key `ssh-keygen` cannot use; `tests/acceptance.test.mjs` passes.
- [x] 1.2 Set the colophon page with a clean round mark and the acceptance slip in the edition's language; done when colophon tests set Latin, Han, Hangul, Cyrillic and long names inside the band in English and Chinese editions, wrap a name before shrinking it, refuse a name no house face draws or too long for the band, and read the slip's labels, scope sentence and published files back; `tests/colophon.test.mjs` passes.

## 2. Verify and publish

- [x] 2.1 Add `archpub verify <delivery> [--allowed-signers <file>]`; done when tests show it passing an accepted delivery and refusing a changed artifact, a changed colophon page, an earlier record, a record edited after signing, a signature the record does not name and a signature from an unlisted key; `tests/acceptance.test.mjs` and `tests/cli-commands.test.mjs` pass.
- [x] 2.2 Publish the colophon page and any signature with the delivery and refuse an unverified one; done when publication tests copy both byte for byte and refuse a mismatched page; `tests/acceptance.test.mjs` and `tests/delivery.test.mjs` pass.

## 3. Documents

- [x] 3.1 Update the operations reference, the Skill, CHANGELOG and the command help; done when every new option, refusal and file is named and `tests/agent-skill.test.mjs` passes.

## 4. Verification

- [x] 4.1 Run `npm run check` and the full test suite; done when both pass; its static, coverage and package steps exited 0 with 254 of 256 tests passing and the 2 browser tests skipped.
