## Context

See proposal.md for why. The renderer is built offline and frozen from a source
closure that `source.json` pins by registry version and digest. Bootstrap
restores the canonical pair from a Git custody revision, and each native host
is admitted by a witness: two agreeing relocated builds whose renderer matches
the canonical one.

## Goals / Non-Goals

**Goals:**

- The raster crate's lock at the newest releases its pins allow, through the
  closure, custody and witness procedure of 0.7.0.

**Non-Goals:**

- Moving resvg or `wasm-bindgen`, which are at their latest releases.
- Changing any rendered output.

## Decisions

- **Relock outside the vendored-source replacement.** With the closure's
  replacement in place Cargo resolves only against the vendored crates, so the
  crate is relocked with `cargo update` from a copy without it, vendored again
  with `cargo vendor --locked`, and the replacement is restored unchanged.
- **Pack the closure as the current one was.** bsdtar writes a POSIX ustar
  archive from a sorted mtree, owner 0:0 without names and time 0, compressed
  with XZ level 9. Repacking the current closure this way reproduces its
  digest, so the new closure differs from it only in the relocked crates.
- **Keep the 0.7.0 witness procedure.** macOS is witnessed locally. The
  proposal's CI reports the Linux and Windows builds, and a later commit admits
  a host only when both Forges report the same bytes for it.

## Risks / Trade-offs

- [unicode-script's tables change how resvg splits text into scripts] → The
  native journeys compare PNG bytes and text measurement with the canonical
  renderer, and the corpus builds compare every poster and page with 0.7.0.
- [The closure is published before the Change lands] → The manifest selects a
  closure by version and digest, so an unlanded closure is never used.
