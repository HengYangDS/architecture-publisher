## 1. CI, lock and release

- [ ] 1.1 Remove Windows from the CI declaration, the Mise lock and configuration, and the release tools. Done when `npm run check:ci` passes, `mise lock --check` holds three platforms, and the release archive tests pass with three.

## 2. Tests and references

- [ ] 2.1 Remove the Windows branches from the tests and the references, and say so in `CHANGELOG.md`. Done when `npm run check:static` passes.
