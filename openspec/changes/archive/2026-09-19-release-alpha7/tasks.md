# Tasks

## 1. Release identity

- [x] 1.1 Set `0.1.0-alpha.7` in package and lock projections and verify the release identity test passes.
- [x] 1.2 Append only `v0.1.0-alpha.7` to the protected-tag policy and verify prior tag entries remain unchanged.
- [x] 1.3 Update publication guidance to name alpha.7 publisher behavior while preserving the alpha.5 reader identity.

## 2. Acceptance

- [x] 2.1 Canonicalize the self-host output directory and verify installed replay succeeds through a filesystem alias while the generic writer remains strict.
- [x] 2.2 Run syntax, behavior, installed self-host/AIGW, package dry-run and pinned Linux checks on frozen release inputs.
- [x] 2.3 Complete signed exact-commit proof and candidate review with the release identity intact.
