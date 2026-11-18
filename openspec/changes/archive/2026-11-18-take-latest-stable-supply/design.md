## Context

See [proposal.md](proposal.md). The development dependencies are pinned exactly in `package.json`; the npm lock holds
their transitive closure. The pinned npm is declared in `.config/mise/config.toml` and `devEngines`. The CI pipeline is
declared in `.config/ci/pipeline.cue` and projected into `.github/workflows/verify.yml` and `.gitlab-ci.yml` by
`tools/ci/projection.mjs`. The same moves were made on 2026-11-10 by the archived Change
`catch-up-supply-to-stable`, which this one follows.

## Goals / Non-Goals

**Goals:**

- Every development dependency, the pinned npm and the CI's mise at the newest stable release at the 0-hour floor.

**Non-Goals:**

- Moving `@likec4/language-services` against the repository's supply guard. On 2026-11-15 the guard refused 1.61.0
  (its `pnpapi` external gone, the parser 53 percent larger, 12 new packages); Archpub held it. Those are properties
  of 1.61.0 itself; neither 1.61.0, still the registry's latest, nor `tools/supply/likec4.mjs` has changed since, so
  the lane keeps 1.60.0 without running the guard again.
- Changing a published figure beyond an icon that Lucide 1.74.0 redraws.

## Decisions

- **Move the lock with the repository's own npm at the floor.** `npm install --package-lock-only` and `npm update`
  with `--before` at the floor, run by the declared npm, move exactly the pins and their measured transitive moves.
  OSV is read for every moved version.
- **`mute-stream` 4.0.0 follows the OpenSpec move.** The owner decided on 2026-11-15 that it stays aside until the
  next OpenSpec supply move; OpenSpec 2.1.0 is that move.
- **npm moves before the lock.** The lane first moves the pinned npm to 12.2.3 and its Mise lock, so that the npm lock
  is written by the npm the repository will run.
- **Regenerate the workflows, never edit them.** The projection writes both files from the declaration. The Linux
  jobs download the mise binary themselves, so `.config/ci/linux/mise.sha256` moves to the digest that mise's
  `SHASUMS256.txt` and the release asset both name for `mise-v2026.11.9-linux-arm64`.
- **Pin mise-action by its release commit.** v5.2.9 is commit `236a21c3b91f`.
- **Bind remeda's vendored licence to 2.62.1.** The lock moves remeda, which LikeC4's language services bring, from
  2.58.0 to 2.62.1. Its package still ships no licence file, so `tools/supply/notices.mjs` keeps the vendored text and
  binds it to exactly one version. Upstream's `LICENSE` at tag `v2.58.0` and at tag `v2.62.1` both hash `acf30083045d…`
  (SHA-256 `acf30083045d768ce20640237313ee31a45d548d66ef76df5bb5fb0745479535`, read on 2026-11-18), equal to the
  vendored file, so the binding moves to 2.62.1 and stays one exact version: the next move stops here and is read
  again. `tools/supply/likec4.mjs --write` regenerates the LikeC4 supply; nothing in it is edited by hand. No test
  covers this path; the bootstrap that refused `likec4_supply_license_missing:remeda` before the change passes after
  it. Archpub chose this over holding remeda back with an override.
- **Regenerate the icon supply with Lucide.** `tools/supply/icons.mjs` rewrites the artwork and its manifest; the
  icon policy moves with the lock.

## Measured

- The three works (`examples/big-bank`, the LikeC4 shop and the publisher's own Chinese work) were built from `dev`
  f1fcebe2 and from this lane with one `SOURCE_DATE_EPOCH` on 2026-11-18. `archpub compare` finds no plate that
  differs; each work's `manifest.json` differs only in `.supplies.icons`, the digest of the icon supply. Lucide 1.74.0
  changes no icon that these works draw, as Lucide 1.73.0 did not on 2026-11-15.
- The repository's own OpenSpec check runs the 2.1.0 CLI and passes 14 of 14 items. ETHOS keeps its bundled 2.0.0, and
  the lane runs neither `openspec update` nor `openspec init` of 2.1.0, whose output ETHOS's reader has not seen.

## Risks / Trade-offs

- [OpenSpec 2.1.0 reads a Change differently] → the repository's OpenSpec gate runs on every active and archived
  Change before the proof.
- [Lucide 1.74.0 redraws a used icon] → the three works are built before and after and their plates compared; a
  changed plate is shown to Archpub before the lane commits.
- [mise 2026.11.9 in CI installs tools differently] → the workstation's mise is 2026.11.9 already, and the lane's
  bootstrap and proof run with it.

## Migration Plan

Move npm, then the pins and the lock, then the icon supply and the CI declaration; bootstrap, compare the works, run
the checks and the proof; propose; Archpub lands after the beta.11 copies run has read the publisher. To roll back,
revert the lane's commits in a new Change.
