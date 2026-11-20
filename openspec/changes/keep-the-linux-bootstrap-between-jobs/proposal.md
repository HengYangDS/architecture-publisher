## Why

A Linux job of the GitLab pipeline begins by downloading the Mise release for its platform, 157 MB, and gives the
download 180 seconds. It does so in every job, although the job's clean spares the tool cache the file is staged
in. On 2026-11-20 the Linux guest's network gave about 0.2 MB/s: two jobs of a proven lane's proposal failed at
that step, with 30 and 39 MB received, before any test ran, while the same file came to the host at 9 MB/s. In
the green pipeline of that morning the download took 132 seconds, most of the cap and two minutes of the job.

A download bounded by wall-clock time inside a shared guest fails by the guest's load and not by a fault of the
tree.

## What Changes

- A Linux job fetches the staged Mise release only where its checksum does not hold yet. It resumes a partial
  file, fetches the file whole where a resumed file is still wrong, and allows a download fifteen minutes.
- The checksum is checked after the fetch, as before, and the job fails where it does not hold.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behaviour of the product changes.

## Impact

`.config/ci/pipeline.cue`, the `.gitlab-ci.yml` it projects, `tests/ci-projection.test.mjs` and the Changelog. A
runner whose tool cache holds the release skips the download; the macOS, Windows and GitHub jobs are unchanged.

Queue: `maintenance`.
