## 1. The fixture

- [x] 1.1 Build the commit of the line-break test from Git objects in `tests/source-binding.test.mjs`. Done when the test passes locally with its assertions unchanged and the file is within its line limit. Built with `git hash-object -t tree` and `git commit-tree`; the test passes with its assertions unchanged, and against the earlier binding it fails with "Missing expected exception (refused)", so it still tests the refusal.
- [x] 1.2 Run the static checks and the test file. Done when both pass. Lint, types and format pass, and the file's eleven tests pass on macOS; Windows and Linux are shown by the forges' review jobs.
