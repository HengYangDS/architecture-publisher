## 1. CI supply

- [x] 1.1 Move Mise and mise-action in `.config/ci/pipeline.cue`, the Linux checksum, and generate the pipelines;
      done when `npm run check:ci` passes and `tests/ci-projection.test.mjs` passes. The pipeline's source names Mise 2026.11.14 and mise-action v5.3.0; `npm run check:ci` and `tests/ci-projection.test.mjs` pass.
- [x] 1.2 Record the move in the Changelog's Unreleased section; done when `npm run check:static` passes. The Unreleased section's Changed list records the move; `npm run check:static` passes.
