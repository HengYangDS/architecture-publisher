## 1. Portable backend

- [x] 1.1 Establish pinned upstream runtime closure and rejecting backend tests.
- [x] 1.2 Implement explicit offline render and non-overwriting output behavior.
- [x] 1.3 Add public CLI and non-ETHOS service/lifecycle inputs; exercise native quality rejection.

## 2. Qualification and closure

- [x] 2.1 Verify packed installation on macOS and isolated Linux without developer dependencies.
- [x] 2.2 Preserve scoped evidence, prove and publish a proposal through ETHOS.
- [ ] 2.3 Integrate into accepted dev and verify the exact accepted publication after the predecessor archive-identity defect is fixed.

## 3. Source-bound ETHOS HTML edition

- [x] 3.1 Extract edition adapters and authoring with provenance; reject binding and closure drift.
- [x] 3.2 Add a shared internal rendering seam and explicit atlas CLI without reverse backend-to-ETHOS dependency.
- [x] 3.3 Reproduce all 13 accepted HTML files through installed macOS/Linux packages; preserve rejecting cases.
- [ ] 3.4 Publish source and scoped evidence, then close through native governance.

This Change owns the backend and its directly dependent HTML edition. The
original execution record owns static migration, browser qualification and
installation recovery.

Source: `a0b64c1fee7f6c6f0b8ec4b120b40e9d144ef537`. Exact-HEAD proof passed;
native publication created `proposal/archify-renderer`. A fresh remote clone
passed strict fsck, all 90 tracked file hashes/modes, 87 tests and syntax checks.
GitLab project 1323 package 125 preserves downloaded, byte-verified qualification
and clone evidence. Qualification digest:
`21d8e0f732f9ffe7786c0beb16fc5561acb54b012816f8e565bd2576ada5f0a3`.
Accepted dev remains `67e2db9`; proposal publication is not accepted integration.

Edition qualification: all 131 tests and syntax passed on macOS Node 26.8.2
and isolated Linux Node 24.19.0. The suite runs installed complete 13-page
reconstruction and checks every HTML against its selected accepted hash. It also
rejects rehashed bad bindings, missing details and mid-build artifact drift.
The first Linux source transfer included AppleDouble files and was correctly
rejected; a fresh archive with both `COPYFILE_DISABLE=1` and
`--no-xattrs --no-mac-metadata` passed unchanged source checks. Browser behavior,
full-product completion and accepted integration are not implied.
