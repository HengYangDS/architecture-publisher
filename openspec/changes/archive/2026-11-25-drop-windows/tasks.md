## 1. CI, lock and release

- [x] 1.1 Remove Windows from the CI declaration, the Mise lock and configuration, and the release tools. Done when `npm run check:ci` passes, `mise lock --check` holds three platforms, and the release archive tests pass with three. `npm run check:ci` passes on the projections without Windows; `mise lock --check` passes on three platforms; tests/release-archive.test.mjs and tests/ci-projection.test.mjs pass.

## 2. Tests and references

- [x] 2.1 Remove the Windows branches from the tests and the references, and say so in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes; no test, reference or template names a Windows platform.
