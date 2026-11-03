## Context

See proposal.md for why. `archpub check` lists the files at the model's
revision with `git ls-tree` and assigns each to the scope with a prefix or
exact comparison. A declared path that matches no file is reported, and the
largest directories holding uncovered files are listed only inside an included
directory.

## Goals / Non-Goals

**Goals:**

- One glob syntax in `include` and `exclude`, matched identically on Linux,
  macOS and Windows.

**Non-Goals:**

- Negation, alternation or brace expansion.
- Globs in a source's path, which names one file.

## Decisions

- **Git owns the matching.** Each glob path is asked of Git as a top-anchored
  glob pathspec, `:(top,glob)<path>`, diffed from the empty tree to the
  revision, and the files it names are the files it matches. This keeps the
  semantics of `*`, `**`, `?` and `[…]` with one owner whose behaviour is
  documented and stable, reads only the object store, and does not depend on
  the host: `core.ignorecase` does not affect pathspec matching against a
  tree, so a case-insensitive host matches as Linux does. Node's
  `path.matchesGlob` was rejected because it folds case on macOS and Windows,
  and a matcher of the publisher's own was rejected as a second owner of a
  syntax Git already defines.
- **A glob is recognised by its characters.** A path holding `*`, `?` or `[`
  is a glob; any other keeps its directory or file meaning, so every existing
  scope reports exactly what it did. A repository file whose name holds one of
  those characters is still matched by the glob that spells it, since `[1]`
  matches the character `1` only when it is a class; such a file is named
  without a glob by its directory.
- **Directory listing follows an include's fixed prefix.** The largest
  uncovered directories are listed inside an included directory; for an
  included glob, inside the directories before its first glob character.

## Risks / Trade-offs

- [A glob matches nothing because it was spelt for another case] → It is
  reported among the declared paths that match no file, as any path is.
- [Many globs make many Git reads] → One `diff-tree` per glob path, bounded by
  the model's own declarations; a scope declares a handful.
