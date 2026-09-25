# Tasks

## 1. Explicit CI routing

- [x] 1.1 Verify GitLab CI lint reports `verify` with an empty tag list and live runner #82 is the project's sole locked runner with `ci-linux-arm64-docker`.
- [x] 1.2 Add the capability tag to `verify` and verify GitLab CI lint reports exactly that tag with no errors or warnings.

## 2. Source acceptance

- [x] 2.1 Run strict OpenSpec validation and the repository's `npm run check`, verifying both pass without product or dependency changes.
