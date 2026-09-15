## 1. Portable source boundary

- [x] 1.1 Add failing contract tests for a sealed, non-Git source bundle and unsafe/missing/extra/drifted input.
- [x] 1.2 Implement pure manifest checks, data-only member reading and structured CLI results without external runtime dependencies.
- [x] 1.3 Verify the packed installation under a relocated path, clean HOME and no Git/Python/ETHOS executable lookup.
- [x] 1.4 Declare native behavior/static gates; run local tests, syntax checks and exact-HEAD governed proof.

## 2. Integration handoff

- [x] 2.1 Document actual slice scope and limitations; preserve original repositories and accepted outputs.
- [x] 2.2 Project the successor source to the approved private GitLab namespace and verify a fresh clone of the selected source.

The full migration, dual renderers, real browser qualification, platform matrix,
installation recovery and final Workline A closure remain in the existing
cross-repository execution record. This Change must not claim those completed.

Observed implementation: 3ec9d8a7333b2cb2f8feee76e459d087ca7a2d57. All 39 tests and syntax checks passed on macOS Node 26.8.2 and isolated Linux Node 24.19.0. Exact-HEAD ETHOS proof, candidate/accepted integration, native publication to private GitLab project 1323 dev, and fresh-clone tests with all 18 tracked file hashes matched. These observations cover only this source-intake slice.
