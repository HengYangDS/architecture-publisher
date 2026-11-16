## Why

The review jobs of this lane's proposal failed on Windows on both forges (GitHub run 43787621389, `windows` and
`windows-x64`; GitLab pipeline 15891, `verify:windows:review`), on one test of 514:
`a file whose name holds a line break is refused before any read`. The test builds its repository by giving Git's
index an entry whose path holds a line break, and Git for Windows refuses such an entry before the publisher is
asked anything: `error: Invalid path 'src/main.mjs\nextra'`. The refusal under test is the publisher's, and it
matters on Windows as elsewhere: a checkout can hold a commit made on another system whose tree has such a name,
and the publisher reads the commit's objects, not a working tree.

## What Changes

- The test builds that commit from Git objects (a tree written with `git hash-object -t tree`, a commit written
  with `git commit-tree`), so that no index and no working tree has to hold the name. Nothing of the product
  changes, and the test asserts what it asserted.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`tests/source-binding.test.mjs`. No source, no document and no delivered byte.

Queue: `reader-and-data`.
