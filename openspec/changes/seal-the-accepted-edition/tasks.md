## 1. Record and mark

- [x] 1.1 Write acceptance record version 2 (`accepted_at`, optional `seal_name`, optional signature and fingerprint) with `--seal-name` and `--sign`; done when delivery tests read every field back and refuse a missing reviewer, an existing record and a key `ssh-keygen` cannot use; `tests/delivery.test.mjs` reads every field back and refuses each case.
- [x] 1.2 Set the colophon page with the round mark and the record's facts in the edition's language; done when the page compiles for English and Chinese editions with Latin, Han, Hangul and long names, refuses a name with a character no house face draws, and the mark's wear differs between two manifests. `tests/colophon.test.mjs` covers each case.

## 2. Verify and publish

- [x] 2.1 Add `archpub verify <delivery> [--allowed-signers <file>]`; done when tests show it passing an accepted delivery, refusing a changed artifact, a changed colophon page, a version 1 record and a signature from an unlisted key; `tests/delivery.test.mjs` and `tests/cli-commands.test.mjs` pass.
- [x] 2.2 Publish the colophon page with the delivery and refuse an unverified one; done when publication tests copy it and refuse a mismatched page; `tests/delivery.test.mjs` copies the page and refuses an edited one.

## 3. Documents

- [x] 3.1 Update the operations reference, the Skill, CHANGELOG and the command help; done when every new option, refusal and file is named; `tests/agent-skill.test.mjs` passes and the refusal table lists each new code.

## 4. Verification

- [x] 4.1 Run `npm run check` and the full test suite; done when both pass; `npm run check` exited 0 with 255 of 257 tests passing, the 2 browser tests skipped for want of a local Playwright browser.
