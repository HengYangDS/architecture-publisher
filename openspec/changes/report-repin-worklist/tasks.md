## 1. Binding

- [ ] 1.1 Resolve ownership at any commit in one function that returns each file's winning claim and the problems a build would refuse; verify the binding tests pass unchanged and that the function reports, without refusing, a claim left empty and a relation file gone.

## 2. Worklist

- [ ] 2.1 Report the re-pin worklist with `--against`: per component its modified, moved and deleted files and the files its claims take in, per relation its changed files, the claims and relation files the build at the named revision would refuse, and the newly uncovered files; verify on a fixture repository a move between claims, a new file under a directory claim and under none, a deleted claimed file and a modified relation file.
- [ ] 2.2 Classify a guide's citations at the named revision as same, shifted, moved, touched or gone; verify a range below an insertion, a range a change falls within, a renamed file, a deleted file and a diagram's node source.
- [ ] 2.3 Print the worklist in `archpub check`'s text; verify the command tests.

## 3. Documentation

- [ ] 3.1 Describe the worklist in the operations reference, the product skill and the changelog; verify the documentation checks.

## 4. Verification

- [ ] 4.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 4.2 Check the three published works, as version 2 models, against their repositories at `67ecc87`, `c778fe1` and `5963db1`; verify the worklists: ETHOS 10 components with 11 modified and 3 deleted files, 13 relations and 117 citations with 3 shifted and 2 touched; AIGW 1 component with 1 modified file and 89 citations the same; Architecture Publisher 8 components with 10 modified files, 14 relations and 3 newly uncovered files.
