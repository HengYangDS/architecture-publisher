---
subject: ethos:edition-provider-migration
role: handoff
state: incumbent-observed-successor-spec-reviewed
relations:
  uses: ../reference/edition-provider.md
---

# ETHOS Architecture Publisher boundary

This packet separates the observed ETHOS v1 integration from a conditional
successor migration. It is an input to ETHOS's own single writer, Change, and
Work Lane. It does not authorize edits to ETHOS, acceptance of new artwork, or
publication. The linked Provider reference describes the released v1 protocol;
the successor specification is reviewed, but implementation and release are pending.

## Observed incumbent

At read-only ETHOS `709347f0ce0965e6a338aa5128c60c4d3f4044a8` on
2026-09-24, `integrations/architecture-publisher/` has 78 tracked files: five
adapter modules (538 lines), two Provider/runtime modules (100 lines), 31
Edition modules (9,841 lines), 37 non-code Edition files (20,049 lines), and
three package/metadata files (107 lines). These mechanical counts describe a
migration surface, not code quality or the correct retained size. The two
`static/natural-*` modules alone contain 3,588 lines of ETHOS-specific
abstraction and visual decisions; they must not be transplanted wholesale into
a generic Publisher kernel or deleted merely because they are large.

The package exports `provider`, `adapter`, `edition`, and `runtime`, includes all
of `src/` in its packed supply, and depends on Architecture Publisher
`0.3.0-alpha.1`. Its Provider export is already only
`materializeEditionProvider`. Other exports remain referenced by ETHOS
installed integration tests; removing export names alone would not remove
packed code. A tracked-reference search found no Publisher production import
of the other exports, but that does not prove absence of external consumers.
This inventory is not per-file deletion authorization.

At an earlier reviewed ETHOS source, the v1 Provider's structural selection
grouped entities by type, routed relations straight from right to left, and
used `authoredInputSha256` as an identity without the generic compiler consuming
those authored bytes. That structural Candidate does not prove visual
faithfulness to the accepted 6000-pixel poster and 13-page Atlas. The dated
finding is a contract counterexample, not a claim that the current accepted
artwork is defective.

## Successor role boundary

ETHOS owns its native facts, projection interpretation, domain claims,
repository governance, Work Lanes, proof, CAS effects, and source-product
acceptance. The named Edition editor owns audience, questions, scope,
omissions, transformations, narrative, and art direction; ETHOS may fill that
role for its own flagship, but repository co-location is not a universal rule.
Publisher owns the versioned input protocol, derived lock, generic compilation,
renderer integration, browser/accessibility observation, qualification
contracts, and optional bounded local file effect. The designated ETHOS
release owner and custodian retain protected-ref, Forge, retention, and
readback decisions. Skills supply replaceable methods, never authority.

An ETHOS executable Provider may adapt selected native facts into the one
successor input envelope, with exact native ancestors, claimant, adapter,
revision kind, and loss boundary. It need not author a duplicate Claim Model
solely because Publisher's v1 internal path required one. It must not return
scenes, rendered media, qualification, acceptance, publication, or repository
state. Its package location is an ETHOS ownership decision, not a prescribed
`provider/` subdirectory. Selecting executable adaptation is a code-execution
trust decision; process-tree cleanup is not an adversarial sandbox.

Preserve ETHOS-specific reader questions, approved aggregates and forbidden
simplifications, Lane cooperation/competition/experimentation/all-drop
semantics, target-versus-observed notices, and flagship art direction in
ETHOS-owned authoring or source-specific checks. Do not move generic packing,
derived hash maintenance, candidate assembly, browser execution, raster
conversion, qualification admission, standalone packaging, or local file
effects into ETHOS merely to retain the old integration shape. A source-specific
composition or verifier can remain only with an explicit distinct predicate.
Static and interactive media share selected meaning but not geometry or
approval. Provider conformance alone is never flagship review.

## Conditional migration sequence

1. In ETHOS's governed work process, freeze exact incumbent package, native
   sources, Provider reply, Claim Model v2 and Edition v1, selected authoring,
   scenes, static/interactive artifacts, qualifications, acceptance, and
   rollback identities. Establish the actual current external-consumer set.
2. Wait for the Publisher successor's reviewed specification, implementation,
   installed package, and release. Do not build against an adjacent source
   checkout or an unapproved protocol draft.
3. Select ETHOS's source claimant, Edition editor, accepter and custodian in
   the versioned Build Request. Use one exact executable Provider entry point
   only where native facts require adaptation; preserve derived-from links and
   unsupported/unknown meaning. Historical v1 bytes remain immutable.
4. Compare the successor's structural and flagship outputs with the incumbent
   at their actual promises. Require visible semantic coverage, independent
   static and interactive composition, exact consumed authoring, 6000-pixel
   raster when selected, all complete Atlas pages, browser/accessibility
   evidence, and human visual review bound to final bytes. Parity or an
   explicitly reviewed successor delta is required; a digest mapping alone
   does not suffice.
5. Re-run ETHOS-specific repository, Lane, proof, CAS, acceptance, recovery,
   release and remote-readback gates on exact selected subjects. Rehearse
   rollback. Only then remove the displaced generic mechanics and unused public
   exports, while retaining ETHOS-specific meaning, artwork, necessary
   adapters, and immutable history. A source or visual mismatch preserves the
   incumbent until an authorized successor is accepted.

## Handoff evidence and limits

The ETHOS writer needs a per-path responsibility map and tested consumer
closure, not a target line count. Evidence must distinguish native-source
integrity, Provider materialization, structural Candidate, flagship media,
qualification, human decision, repository effect, and hosted publication.
Publisher may report findings but cannot approve an ETHOS Change, advance its
refs, or treat a generated drawing as source truth. This packet has not
executed the successor journey and grants no migration approval.
