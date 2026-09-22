# Tasks

## 1. Provider contract

- [x] 1.1 Add RED contract tests for the exact provider manifest tagged union,
      subject/provider identity, contract versions, expected identities, resource
      ceilings, hostile JSON, and ambiguous delivery modes; implement the public
      validator/digest owner and verify focused tests plus exported API checks pass.
- [x] 1.2 Add RED protocol tests for closed executable request, reply, and
      materialization receipt values; implement byte-safe canonical validation that
      rejects later-stage claims, unknown fields, duplicate inputs, invalid base64,
      oversize values, and identity mismatch, then verify focused tests pass.

## 2. Materialization

- [x] 2.1 Add RED declarative-provider tests for closed relative files, exact
      Source Bundle and Edition identities, optional evolution, relocation,
      symlinks, escaping paths, extra files, and changed bytes; implement
      declarative materialization and verify the complete focused suite passes.
- [x] 2.2 Add RED executable-provider tests for exact installed package identity,
      public export selection, empty user configuration, bounded stdin/stdout/time,
      deterministic reply, ambient-checkout immunity, forbidden later-stage output,
      interruption, and cleanup; implement the child-process runner and verify no
      provider code executes in the long-lived Publisher process.
- [x] 2.3 Add one provider-neutral conformance journey that runs the same closure,
      identity, determinism, portability, dependency, resource, and non-authority
      predicates for declarative and executable fixtures; verify failures identify
      the exact violated predicate.

## 3. Edition build integration

- [x] 3.1 Add RED build-plan union tests preserving the direct plan while
      admitting one provider selection through `archpub edition build`; implement
      provider materialization before the existing compiler without adding a
      command root, registry, discovery, or product branch, and verify CLI help and
      direct-plan behavior remain stable.
- [x] 3.2 Add RED provenance tests proving provider delivery metadata does not
      alter Claim Model, Edition, scene, or Candidate digests; emit a bound provider
      materialization receipt in the outer candidate bundle and verify exact
      subject, producer, authorization-owner, and custody fields survive package and
      publication journeys.
- [x] 3.3 Extend module, package, import, dead-code, and product-identity gates to
      reject concrete renderer, browser, qualification, publication, Git, forge,
      repository-governance, adjacent-checkout, and named-adopter dependencies in
      providers or the generic materializer; verify deliberately invalid fixtures
      fail closed.

## 4. Self-hosted adoption

- [x] 4.1 Replace the self-host journey's direct build-plan handoff with a
      source-owned declarative provider manifest over the same authored Source
      Bundle and Edition values; verify semantic, Edition, static, interactive, and
      Candidate digests remain unchanged while only the outer provider provenance
      changes.
- [x] 4.2 Pack and relocate the core plus self Edition into an isolated offline
      directory with empty user configuration and no adjacent checkout; verify the
      public CLI builds, qualifies, publishes, replaces, and recovers the same
      selected candidate and exact provider receipt.

## 5. Ecosystem migration contract

- [ ] 5.1 Replace legacy first-party handoff fixtures with compact immutable
      provider-conformance receipts and source-owned migration packets for AIGW and
      ETHOS; verify the Publisher repository contains no second mutable AIGW or
      ETHOS Provider, Edition, acceptance decision, or release authority.
- [ ] 5.2 Document the destructive AIGW declarative migration and ETHOS
      executable slimming sequence, including parity, rollback, incumbent deletion,
      feedback, artifact ownership, and source-owned acceptance; verify guidance
      contains no checkout path, workstation identity, compatibility facade, or
      parallel progress ledger.

## 6. Qualification and release

- [ ] 6.1 Run focused tests, format, zero-warning lint, checked JavaScript
      contracts, import direction, dead code, documentation, strict OpenSpec,
      measured coverage, package validity, installed-use, browser/accessibility,
      publication replacement, interruption recovery, and exact self parity at one
      frozen candidate HEAD; preserve raw evidence and list every unproved limit.
- [ ] 6.2 Update package and product identity to the `0.3.0-alpha.0` successor,
      build reproducible archives, sign the candidate, and verify archive identity,
      portable tar-content identity, manifests, provenance, and installed behavior
      without modifying any `0.2.0-alpha.0` or historical alpha.7 byte.
- [ ] 6.3 Land through the governed candidate and accepted branches, archive this
      Change, publish signed tag `v0.3.0-alpha.0` and exact release/package assets,
      pass hosted CI and remote readback, then verify all owned Work Lane, proposal,
      temporary-process, scratch, and disposable-build residue is closed.

## 7. Cross-product continuation and recovery boundary

- [ ] 7.1 Publish exact source-owned adoption inputs for separate AIGW and ETHOS
      Changes, including package/content identities, conformance predicates,
      parity baselines, removal criteria, and acceptance owners; verify neither
      migration depends on an Architecture Publisher checkout or central mutation
      authority.
- [ ] 7.2 Deliver the off-host disaster-recovery decision contract naming the
      still-required destination, custody owner, retention, encryption, credential,
      restore environment, and acceptance evidence; verify no same-disk copy,
      GitLab source, package storage, or CI result is described as independent
      recovery before those operator selections exist.
