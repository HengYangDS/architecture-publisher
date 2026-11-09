## 1. Plate reading

- [x] 1.1 Write failing tests: a narrowed plate whose summary fits but whose summary and paths do not sets the same image as the plate whose components claim no paths, and a summary alone taller than the body is refused; verify they fail on 0.10.1's class. `tests/edition-class.test.mjs` failed on 0.10.1's class: the plate whose summary fits and whose paths do not was refused with `edition_reading_too_long` at `house.typ:280`.
- [x] 1.2 Set the summary alone in the house class when the whole reading is taller than the body; verify the new tests and the edition, front and overview suites pass. At `a6cb5400` the edition-class, edition-front, overview and locale suites pass 32 of 32.

## 2. Release

- [x] 2.1 Record 0.10.2 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; verify the changed files pass Prettier, ESLint, TypeScript, markdownlint, Vale and OpenSpec strict validation, and the full check runs in the proof. At `c20f2704` `npm run check:static` passes 10 of 10, and Vale reports nothing in the changelog and the Change.
- [x] 2.2 Build the twelve editions of the six published works with the lane's publisher; verify every plate and overview image matches its 0.10.1 build, and that with the drafted view summaries every plate of every edition is set. With the lane's publisher the twelve editions of publications at `aa3b013` build, and their 94 plate and overview images match the 0.10.1 delivery byte for byte; with the 41 drafted summaries in English and Chinese all twelve build, every one of their 82 plates set.
