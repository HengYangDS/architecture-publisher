## Context

See proposal.md for why. Every development dependency is pinned exactly, and
the overrides pin transitive packages past their advisories, so the lock moves
only where a declared range allows a newer release. The LikeC4 parser supply
is bundled from the installed `@likec4/language-services` and the packages it
imports, and `check:generated` fails when it no longer matches them. The Linux
CI image is the official Playwright image with `pwuser` as its default user,
and CI selects it by registry digest.

## Goals / Non-Goals

**Goals:**

- Every development and CI supply at its latest stable release, with
  `npm audit` reporting no advisory.

**Non-Goals:**

- Changing any rendered output or the published package's dependencies.

## Decisions

- **Refresh the lock within its ranges.** `npm update --package-lock-only`
  moves only packages a declared range lets move and keeps every exact pin and
  override; `npm ci` then installs exactly that lock, as CI does. Resolving a
  new lock from nothing was rejected: it re-decides every placement in the tree
  with no newer release behind the change.
- **Keep an override only while it keeps an advisory out.** Each override was
  removed in turn from a scratch copy of the refreshed manifest. Without any of
  `glob`, `katex`, `minimatch` or the `re2js` pin under `markdownlint`,
  `npm audit` reports an advisory, so they stay at their latest releases.
  Without `lodash-es` the lock is unchanged, so that override is retired.
- **The parser supply follows the lock.** The existing
  `tools/supply/likec4.mjs --write` regenerates the bundle, its notices and its
  manifest from the installed packages, so the supply never records a package
  the lock does not hold. Remeda's npm package ships no licence file, so the
  notice builder reads a vendored copy bound to one version and its digest.
  The binding moves to a new version only when the LICENSE at the commit npm
  records for that release is byte-identical to the copy; a binding to any
  version was rejected because it would carry the notice past a licence
  change unseen.
- **Rebuild the CI image instead of pinning the official image.** Runner reads
  the default user from the image configuration when it inspects the checkout's
  ownership, so the one-line recipe stays. The rebuilt image is pushed under
  its existing tag, and the pipeline pins the digest read back from the
  registry.

## Risks / Trade-offs

- [A refreshed package changes what the parser or a check does] → The full
  check, including the LikeC4 import tests, and the corpus builds compared with
  the 0.7.0 deliveries.
- [The base image's operating-system updates break a hosted job] → The
  proposal ref runs the hosted CI of both Forges before dev is published.
