## Context

This is the first implementation slice of the approved independent publisher.
The prior project-level design remains in the original Archify repository at
commit c23dd4cfad4feb8f1e16d10b0a0fd62653228ca1. This Change owns only source intake;
it is not a replacement execution ledger for the whole migration.

## Goals and non-goals

Deliver an installed, data-only source verification command with rejecting
counterexamples. Do not design the entire renderer interface now, re-export
ETHOS, or claim integrity checks establish semantic truth or official replay.

## Contract

`architecture source verify <manifest-path> --sha256 <64-lowercase-hex>` emits
one JSON result. Successful verification exits 0; bad usage exits 2; failed
input verification exits 1. No implicit current directory file or environment
source selector is supported. Relative members resolve from the manifest's
parent directory. An explicit CLI path may be relative to the caller cwd.

The small file envelope is `architecture.source-bundle/v1` with exactly:
`schema`, `source` and `files`. `source` has nonempty `id`, optional opaque
`revision`, and no executable behavior. `files` is a nonempty array of
`{path, bytes, sha256}`. Member paths are canonical relative POSIX paths.
The manifest is not one of its own members. All regular files beneath its
parent are either declared members or the manifest; undeclared files reject.
The caller-supplied manifest hash selects the bytes; the manifest does not
pretend to authorize its own trustworthiness.

`src/source/manifest.mjs` validates decoded values and owns path rules.
`src/source/bundle.mjs` reads and hashes bytes, rejects symlinks and non-regular
files, checks exact membership, and returns verified in-memory member bytes.
`src/cli/main.mjs` parses arguments, renders structured results and exit codes.
Only bundle.mjs owns file effects (read-only). No process or network calls are
allowed in production source. No provider, ETHOS or Git package is imported.

Public result names the source, manifest digest, member content identity and
scope `source-file-integrity`. `officialReplay` and `semanticAcceptance` remain
`not-performed`. Local absolute locations are not part of content identity.
Reject duplicate paths (including portable case/Unicode aliases), absolute,
parent/dot, drive, backslash, device-name and NUL paths; missing, extra or wrong
bytes; symlink files/directories and unsupported types. Bound manifest/member
size to declared limits and reject above them before loading bytes. This is
an immutable-input reader, not a protection claim against a hostile concurrent
writer with equal OS privileges; actual verified bytes, not reread filenames,
are passed to downstream consumers.

## Implementation sequence

1. Write Node built-in tests and a stub that rejects verification; observe the
   positive contract fail for the intended missing behavior. Add all negative
   cases before implementation. No dependencies needed.
2. Implement pure manifest checks, bounded filesystem reading and the thin CLI.
3. Test npm-pack installation into a fresh directory with no Git metadata,
   empty HOME and PATH that cannot find Git/Python/ETHOS. Invoke Node by the
   explicit test-runner executable. Verify input relocation and non-Git revision.
4. Exercise a malicious extra-file/symlink/changed-byte case through the installed
   CLI. Keep fixtures visibly synthetic and never submit them as diagram proof.
5. Declare actual test and static gates in the repository's native profile,
   verify current lane authority, commit and run exact-HEAD ETHOS proof.

## Validation

`npm test` runs semantic-free manifest, filesystem and installed-CLI behavior.
`npm run check` syntax-checks all production modules. Tests use node:test,
node:assert and node:fs; generated material is created only under the ignored
build tree and cleared only after exact test ownership is known.

Source-tarball membership and no-runtime-dependencies are checked; neither an
installed source reader nor its green suite qualifies the full architecture
publication product. macOS is observed in this slice; Linux remains an explicit
unclosed product acceptance requirement until run there.
