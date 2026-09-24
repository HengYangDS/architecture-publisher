---
subject: architecture-publisher:primary-forge-release-custody
role: dated-observation
observed_at: 2026-09-24T08:06:27Z
---

# Primary-forge release custody readback

This is a dated observation, not a release ledger, retention decision, deletion
authorization, or off-host recovery proof. The selected private GitLab project
is [Architecture Publisher, project 1323](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher).
The signed `v0.1.0-alpha.0` Git tag was verified locally; a valid tag does not
establish availability of its linked assets.

## Method and result

Using the existing authenticated `glab` CLI in a GitLab-remote repository,
`GLAB_NO_PROMPT=1`, closed stdin, and caller-owned process-group deadlines, the
readback fetched [project statistics](http://192.168.64.101:18086/api/v4/projects/1323?statistics=true),
[package versions](http://192.168.64.101:18086/api/v4/projects/1323/packages?per_page=100),
[release records](http://192.168.64.101:18086/api/v4/projects/1323/releases?per_page=100),
and package-file metadata. It then sent `HEAD` to every Release asset URL,
preserving URL encoding. The observed HTTP status checks current reachability,
not byte identity or installed usability.

| Observation                                   |                      Result |
| --------------------------------------------- | --------------------------: |
| Release records                               |                          10 |
| Release asset links / unique linked endpoints |                     84 / 80 |
| Asset links returning HTTP 200                |                          72 |
| Asset links returning HTTP 404                | 12, all in `v0.1.0-alpha.0` |
| Current package versions / package files      |                     10 / 72 |
| GitLab-reported package storage               |           878,531,229 bytes |

The twelve broken links refer to three package versions absent from the current
listing under project 1323 `packages/generic/`:

- `ethos-architecture`, version `2026.09.16`: 3 reader links (PNG, HTML,
  checksums).
- `ethos-architecture-qualification`, version
  `d1c07163f3bd8042f8321914a02d407ce1dde48f2825d4246009002971a43308`:
  6 recovery links (archive, verifier, observation, manifest, instructions,
  checksums).
- `architecture-raster-resvg-source`, version `0.48.1-76f1a4a8e1d2`: 3
  renderer-source links (archive, manifest, instructions).

Every other Release link, including all ten `v0.3.0-alpha.3` links, returned
HTTP 200. This audit did not download and rehash those 72 linked files. Three
still-linked historical recovery archives alone total 825,355,600 bytes, or
93.95% of reported package storage; package size is therefore not evidence
that these archives are disposable. Four files in the current
`architecture-raster-resvg-source/0.48.1-9c1219f8e903/` package have no link
from these ten Release records, but other consumers and retention obligations
have not been excluded. No package or Release was changed or deleted.

## Follow-up recovery search (2026-09-24 09:31 UTC)

A fresh bounded, no-prompt GitLab API read still listed ten current package
versions and none of the three missing historical versions above. The signed
`v0.1.0-alpha.0` tag resolves locally to commit
`3963abbf931484b170996e538dce58d945981e8e`; a project-1323 pipeline
query for that exact commit returned no pipeline. This does not rule out jobs
under another commit, old project, or retained external backup.

The available `0.1.0-alpha.1` and `0.1.0-alpha.3` recovery manifests contain
994 and 1,001 declared files respectively. Neither manifest names the missing
package versions or the old renderer-source version. Their HTML has SHA-256
`804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa`;
their PNGs differ. The local Documents HTML matches that later HTML, and its
PNG matches `0.1.0-alpha.3`. Without an independently bound original
`v0.1.0-alpha.0` asset identity, none of these later bytes may be substituted
for a broken historical link. This search narrowed candidate custody paths;
it recovered no original asset and made no upload, deletion, or rewrite.

## Consequence and repair bar

The `v0.1.0-alpha.0` Release record and signed tag exist, but its twelve linked
assets are currently unavailable at their published URLs. The primary forge
cannot presently prove complete historical-release readback, and it cannot be
treated as a complete recovery source. Targeted local filename and Git-object
path searches did not identify the three missing package versions; this is
**not** proof that no original backup or compressed copy exists elsewhere.

Do not silently repoint a historical link or upload a visually equivalent
reconstruction. A repair requires the original asset bytes and independent
identity evidence, exact path and size inventory, a no-overwrite upload plan,
then authenticated remote `GET` plus SHA-256 readback of every restored file and
all twelve Release links. If original byte identity cannot be proved, retain
the historical record and state the availability gap explicitly. Independent
off-host disaster recovery remains governed by the separate
[decision contract](../reference/disaster-recovery-decision-contract.md) and
is still unproved.
