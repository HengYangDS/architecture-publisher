---
subject: architecture-publisher:primary-forge-release-custody
role: evidence
state: active
observed_at: 2026-09-24T08:06:27Z
relations:
  governed_by: ../product-contract.md
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
`v0.1.0-alpha.0` reader-media identity, none of these later bytes may be substituted
for a broken historical link. This search narrowed candidate custody paths;
it recovered no original asset and made no upload, deletion, or rewrite.

## Exact alpha.3 readback (2026-09-24 09:50 UTC)

For `v0.3.0-alpha.3`, a bounded authenticated `GET` followed **each of the ten
Release link paths**, preserving the encoded project and filenames, with
`GLAB_NO_PROMPT=1`, closed stdin, and an owned process deadline. All ten
responses matched the corresponding numeric-project package endpoint and the
local release-staging bytes. The nine non-checksum assets matched all nine
entries in the remotely fetched `SHA256SUMS`; that checksum file has SHA-256
`c3ff452d36f54455db693aab777a9f7cfe026adb1282e609c92a9844d87c5018`
and itself matched the local release-staging copy. The Release manifest has
SHA-256 `90bf0e42b28a5839b16fe32b3f36af5a00c1bddbb0bc2849a1f53c24ce0abc66`.
The local annotated tag signature verified, and `git ls-remote` returned the
same tag object `9acd432e614f39b1a4ed12fe1fe94bae6ba9f0ad` and peeled
commit `b01dafa5ab1f34cdb026afde90821c66b09179da` as the local ref.

This alpha.3-only pass proved the ten selected link bytes were reachable and
mutually consistent at readback time. The later pass below extends readback to
other reachable Releases; neither pass turns an unsigned external checksum
file into a signature over assets, repairs the alpha.0 links, or establishes
independent off-host recovery.

## Reachable historical release readback (2026-09-24 09:55 UTC)

A second read-only pass streamed every Release-linked asset other than the
already unavailable `v0.1.0-alpha.0` links, without retaining downloaded
archives. Each selected encoded Release link path received a bounded,
no-prompt authenticated `GET` with closed stdin and owned process cleanup.
Assets were checked against the `SHA256SUMS` in their actual package/version
group, using the URL filename rather than the human-facing link label. The
`v0.1.0-alpha.6` and `alpha.7` Releases deliberately link their reader media
from the `alpha.5` package; those bytes were checked against that package's
checksums instead of falsely comparing them to the newer package file list.

| Release          | Linked files | Matching file identities | Linked asset bytes |
| ---------------- | -----------: | -----------------------: | -----------------: |
| `v0.1.0-alpha.1` |            8 |                        8 |        215,666,873 |
| `v0.1.0-alpha.3` |            8 |                        8 |        334,955,657 |
| `v0.1.0-alpha.4` |            3 |                        3 |          2,299,622 |
| `v0.1.0-alpha.5` |            6 |                        6 |        296,760,518 |
| `v0.1.0-alpha.6` |            5 |                        5 |          7,214,103 |
| `v0.1.0-alpha.7` |            5 |                        5 |          7,232,078 |
| `v0.2.0-alpha.0` |           10 |                       10 |          6,463,746 |
| `v0.3.0-alpha.1` |           17 |                       17 |          6,518,401 |
| `v0.3.0-alpha.3` |           10 |                       10 |          7,935,206 |
| **Total**        |       **72** |                   **72** |    **885,046,204** |

All nine local annotated tag signatures verified. For each, the current remote
tag object and peeled commit matched its local ref. These checks establish
current link reachability, byte agreement with the selected remote package
checksums, and Git tag identity. The checksum files are external package
content, not signatures over assets; this is not an independent archival trust
root, a guarantee of future availability, or a clean-host recovery test. The
twelve `v0.1.0-alpha.0` links remain outside the passing set and unresolved.

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
decision contract `docs/reference/disaster-recovery-decision-contract.md` (removed in 0.4.0; last present at commit 919360a) and
is still unproved.

## Targeted repeat readback (2026-09-24 10:31 UTC)

The existing authenticated `glab` route read project 1323's exact
`v0.1.0-alpha.0` Release record again. Its twelve asset links still name the
same three historical generic-package versions. A fresh package listing had ten
versions and still contained none of those three. Each of the twelve linked
package endpoints returned HTTP **404** to `HEAD`; a current
`v0.3.0-alpha.3` checksum endpoint returned HTTP **200** as a route control.
The check used `GLAB_NO_PROMPT=1`, closed stdin, a per-process deadline, and
owned process-group cleanup. `glab api --method HEAD --include --silent` exits
nonzero on a missing asset after exposing its HTTP status; the status, not its
empty-body JSON diagnostic, is the reachability evidence.

This repeat check confirms that the known alpha.0 availability gap persists at
the observed time. It does not recheck the other 72 historical asset bytes,
identify the original missing bytes, or authorize reconstruction, link
replacement, upload, deletion, or an off-host recovery claim. No remote or
local release resource was changed.

## Signed renderer-archive identity refinement (2026-09-24 10:34 UTC)

The locally verified signed `v0.1.0-alpha.0` tag contains
`assets/raster/resvg/source.json`. It names the missing
`architecture-raster-resvg-source/0.48.1-76f1a4a8e1d2/source.tar.xz` and
binds the expected archive SHA-256 to
`76f1a4a8e1d2baf726a3b4c5badc2bef32427428c131275a655b4b82aceadd1a`.
The archived static-publishing design in that same signed tree records the
same digest. This is a signed expected-byte identity for **one**
missing asset, correcting any implication above that no missing asset has a
recoverable identity. It does not show that those bytes survive locally, that
the former package upload matched the expectation, or that the other eleven
missing files have independently bound original identities. Targeted searches
of the owned Publisher build trees found no `source.tar.xz` or
`qualification.tar.xz` candidate. A later visually similar archive or reader
file must not be uploaded as historical content without exact identity proof.

## Bounded repeat observation (2026-09-26)

The installed `glab` 1.119.0, using the repository's authenticated GitLab
host with `GLAB_NO_PROMPT=1`, closed stdin and caller-owned process deadlines,
read project 1323 as
`dig/research/human-agent-stewardship/architecture-publisher`. Its package
listing still contained ten versions and none of the three missing versions
named above. The exact `v0.1.0-alpha.0` Release record still had twelve asset
links; `HEAD` to each returned HTTP 404. No asset was downloaded, replaced,
deleted or uploaded.

This reconfirms the **primary-forge availability gap at this observation time**,
not loss of all original copies. The other 72 historical links were not
rehashed in this pass. The local Documents HTML still hashes to the later
`0.1.0-alpha.1`/`alpha.3` HTML identity and cannot substitute for alpha.0.
Time Machine could not mount its destination and listed no local snapshots;
that observation does not prove that no independent backup exists. The repair
bar above remains unchanged: original bytes plus independent identity evidence
before any no-overwrite restoration and exact remote readback.

## Alpha.4 release-consumer counterexample (2026-09-28 14:01 UTC)

On private project 1323, release `v0.3.0-alpha.4` names 11 project-upload
links. Authenticated GitLab uploads-API GET returned the exact approved HTML
(`8e50a4e546fc20fc021f788d4ba0f98c32e9d4bffbd3a94c509d1a17eecc7f4e`,
3,024,996 bytes), PNG
(`debb45799fae57fda50ca874f7d54d2189fa317e5346ae872544d1114281bf5a`,
455,932 bytes), and the 999-byte `human-review.json` recording separate
exact-byte approvals. This proves those selected upload bytes existed at
readback, not that every consumer link works.

With `GLAB_NO_PROMPT=1`, closed stdin, and a 25-second owned-process deadline,
`glab release download v0.3.0-alpha.4 --asset-name human-review.json`
returned 404 and left a zero-byte file; the exact scratch file was removed.
The same installed `glab` 1.119.0 downloaded the 2,052-byte alpha.3
`human-review.json` through its package-API release link. The alpha.4 link
`url` is a web-upload path; the alpha.3 link is an API package path.
[glab 1.119.0 source](https://gitlab.com/gitlab-org/cli/-/raw/v1.119.0/internal/commands/release/download/download.go)
shows that release download requests each link's `url` with its GitLab API
client when host and scheme match. GitLab documents a separate authenticated
[uploads API](https://docs.gitlab.com/api/project_markdown_uploads/) and
[Release-link URL contract](https://docs.gitlab.com/api/releases/links/).
The evidence locates the failure at link/consumer authentication, not missing
asset bytes; it does not prove browser-session behavior or a universal GitLab
bug. Do not mutate the signed release or its linked bytes. Future release
admission must exercise a normal supported CLI consumer path and exact digest
readback before calling linked assets usable.

## Package storage attribution and successor choice (2026-09-28 15:51 UTC)

The authenticated GitLab API reported `packages_size: 878531229` bytes and
`storage_size: 910134766` bytes for project 1323. Ten Generic Package versions
were listed. Three historical recovery or qualification archives account for
825355600 package bytes (93.95%): 208257504 bytes in package 199,
327534676 in package 201, and 289563420 in package 205. Their names are
linked from the corresponding `v0.1.0-alpha.1`, `alpha.3`, and `alpha.5`
Releases. Package deletion would therefore change historical reader links;
these observations do not authorize deletion or prove replacement custody.
Independent off-host recovery remains undecided.

At this observation, all ten alpha.3 Release links used same-host Generic
Package API URLs, while all eleven alpha.4 links used web-upload URLs. The
installed `glab` 1.119.0 source selects its authenticated client when an asset
URL has the configured GitLab scheme and host. GitLab's
[Release links API](https://docs.gitlab.com/api/releases/links/) permits an
HTTP(S) URL, and its [Markdown uploads API](https://docs.gitlab.com/api/project_markdown_uploads/)
provides an authenticated upload endpoint. An API-upload Release link might
avoid Package storage, but its `glab release download` behavior has not been
tested on this instance. The next successor therefore selects the already
observed Generic Package route, uploads each selected asset once without a
duplicate project upload, and makes exact CLI download plus SHA-256 readback
an acceptance condition. This does not remediate the historical 825355600-byte
custody question and does not claim that the next release has occurred.
