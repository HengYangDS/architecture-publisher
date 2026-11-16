## Context

See [proposal.md](proposal.md). The test was written on macOS and passed there and on Linux, in the lane's check, its
full check and its proof; the proof runs on the macOS host only, so Windows first met the test in the forges'
review jobs. `tests/fixtures/repository.mjs` already builds one repository from Git objects for a like reason
(names that differ only in case on a case-insensitive file system).

## Goals / Non-Goals

**Goals:**

- The test runs on Windows, Linux and macOS and asserts the same refusals.

**Non-Goals:**

- Any change of `src/sources/bind.mjs` or of what is refused.
- Skipping the test on Windows.

## Decisions

1. The commit that holds the name is written as objects: the tree of `src/` by `git hash-object -t tree -w --stdin`
   from its raw entries, the root tree and the commit after it, and the branch moved to the commit.
   - Rests on: the failing jobs' log, where `git update-index --add --cacheinfo` ends with status 128 and
     `Invalid path`; Git checks a path when it enters an index and not when a tree object is written.
   - Considered: skipping the test on Windows; passing `core.protectNTFS=false` to the one command that fills the
     index; leaving the case to Linux and macOS.
   - Chosen because: the refusal under test is reachable on Windows through a cloned commit, so the test belongs
     there. Turning the protection off depends on how one Git release orders its checks; objects written directly
     meet no path check on any platform, and the repository's fixtures already work this way.
   - Applies to: this one test. A fixture whose content a file system or Git's index may refuse is built from
     objects.

## Risks / Trade-offs

- [The hand-written tree is malformed] → Git checks a tree's form when it writes the object, and the test then
  reads the commit through the publisher's own listing, which must show the name for the refusal to be reached.
