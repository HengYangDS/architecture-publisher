## Context

The accepted and release branches both select commit
`f6328c9efc4de18cc619f83b06ce76b543703318`. Package version
`0.1.0-alpha.5` and tag `v0.1.0-alpha.5` already identify immutable earlier
bytes. The current source adds the generic semantic adopter, shared publication
contract, packaged Skill and GitLab CI projection. The accepted ETHOS reader
HTML and 6000-pixel PNG have not changed.

## Goals / Non-Goals

**Goals:**

- Give the new publisher bytes one unambiguous version and signed tag.
- Rebuild and verify the npm archive from the exact release commit.
- Preserve the accepted reader bytes and prior releases unchanged.
- Publish source, package and concise qualification evidence to the existing
  private GitLab project.

**Non-Goals:**

- Redraw or requalify unchanged ETHOS reader artwork.
- Claim the GitLab source projection is an independent disaster-recovery site.
- Make hosted CI success a substitute for local exact-HEAD proof.

## Decisions

- `package.json` remains the sole authored version. `package-lock.json` is its
  required projection; no `VERSION` file is added.
- Append only `v0.1.0-alpha.6` to the exact protected-tag allowlist. Do not use a
  wildcard or alter prior tag entries.
- The alpha.6 package contains the newly accepted publisher, Skill and research
  document. The release links unchanged alpha.5 reader HTML/PNG by their exact
  existing URLs and hashes rather than uploading duplicate multi-megabyte files.
- CI uses the digest-pinned official Node 26.9.0 Bookworm image because the
  repository tests require Git and Python; the smaller image omits both tools.
- Qualification for alpha.6 records exact local tests, package installation,
  source/tag identities, reused reader identities and honest hosted-CI and
  disaster-recovery limits.

## Risks / Trade-offs

- **Hosted runner remains unavailable** -> retain its pipeline as pending and do
  not claim hosted CI; local exact-HEAD proof remains independently identified.
- **Linked old reader assets can be deleted externally** -> retain their alpha.5
  immutable package location and verify the downloaded bytes during release.
- **Release metadata can drift from package bytes** -> generate checksums after
  the release commit and download every alpha.6 package member for byte comparison.
