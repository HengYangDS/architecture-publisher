## 1. Plate reading

- [ ] 1.1 Write failing tests: a narrowed plate whose summary fits but whose summary and paths do not sets the same image as the plate whose components claim no paths, and a summary alone taller than the body is refused; verify they fail on 0.10.1's class.
- [ ] 1.2 Set the summary alone in the house class when the whole reading is taller than the body; verify the new tests and the edition, front and overview suites pass.

## 2. Release

- [ ] 2.1 Record 0.10.2 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; verify the changed files pass Prettier, ESLint, TypeScript, markdownlint, Vale and OpenSpec strict validation, and the full check runs in the proof.
- [ ] 2.2 Build the twelve editions of the six published works with the lane's publisher; verify every plate and overview image matches its 0.10.1 build, and that with the drafted view summaries every plate of every edition is set.
