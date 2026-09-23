# Design

## Context

The versioned Edition Provider and first-party conformance matrix were created
before v0.3.0-alpha.1 publication. The release subsequently completed with a
signed annotated tag, successful dev/main/tag pipelines, exact package
identities, an admitted qualification set, and human review. The current matrix
retains the earlier phrase "not yet a published release" and labels ETHOS and
AIGW as proposed-not-authorized; those labels are now stale or owned by another
repository.

## Decision

Advance the matrix schema from v3 to v4. Keep the existing publisher and
consumers sections as the immutable 0.2.0-alpha.0 interoperability baseline.
Make successor the exact published v0.3.0-alpha.1 Publisher result by adding one
compact releaseEvidence value that binds the signed tag object and target,
release manifest, package-identity record, qualification set, and human-review
record.

The Publisher matrix will not mirror mutable ETHOS or AIGW progress. Each
adopter entry retains only the handoff schema, delivery mode,
authorizationOwner, and acceptanceState: not-asserted-by-publisher.
Publisher-owned release completion and source-owned adopter acceptance therefore
remain separate facts.

## Rejected alternatives

- Keeping the stale text is rejected because a current conformance fixture would
  contradict verified release state.
- Copying live ETHOS or AIGW task status is rejected because it creates a second
  progress authority and becomes stale on every external transition.
- Mutating or replacing published package/release bytes is rejected because the
  defect is in current repository evidence, not in the immutable release.

## Verification

The focused matrix test first fails against v3 and the stale successor state,
then passes only when exact release evidence and external adopter authority are
present. Documentation and strict OpenSpec validation must pass, followed by the
repository quality graph under the declared npm toolchain. The final closeout
must preserve the signed v0.3.0-alpha.1 tag and package identities byte for byte.
