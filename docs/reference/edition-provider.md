---
subject: architecture-publisher:edition-provider
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Edition Provider

This page separates the selected-input Provider v2 contract, first released in
`v0.3.0-alpha.4`, from historical Provider v1 transport. V2 admits native
inputs without requiring a tracked duplicate Claim Model. The Publisher release
does not establish any adopter's source acceptance or migration.

An **Edition Provider** is a narrow boundary that transports exact source or
editor-owned inputs to Architecture Publisher. It is not a second compiler,
registry, workflow engine, or authority.

```text
selected source facts + authored Edition
                |
  direct files or optional Provider(s)
                |
          exact Build Request
                |
       archpub edition build
                |
         Edition Candidate
```

The only generic build command remains `archpub edition build`. There is no
Provider subcommand or ambient provider discovery.

## Selected-input Provider v2

One `architecture.build-request/v1` may select direct native inputs and multiple
`architecture.edition-provider/v2` manifests, provided each selected namespace
is distinct. The Edition is authored once, directly or by one selected Provider;
the compiler does not infer an audience or omission from source structure.
Declarative delivery reads exact portable files. Executable delivery selects
one exact package and entry point, supervises its process tree, and records
unobserved dependencies as limits; supervision is not a sandbox. Both modes
converge on one materialized-input lock before semantic compilation. An equal
lock does not transfer Candidate identity, qualification, or approval across
delivery modes. The successor build requires an explicit `--output` directory
and produces an unqualified `architecture.edition-candidate/v2` bundle.
For an executable Provider, the invoker must additionally pass
`--execute-providers <id@manifest-sha256,...>` with exactly the selected
executable set. Omitting, changing, or adding an ID fails before Provider code
runs. The Build Request and manifest do not grant their own execution consent;
declarative and direct delivery need no such option.

When an exact selected v2 Provider manifest parses but fails structural
validation, the existing CLI error includes a local diagnostic bound to the
Build Request's Provider selection ID and manifest digest. It identifies the
provider-author role but leaves `declaredOwner` null because this manifest
declares no owner. A changed manifest digest is a different failure and does
not blame its author.
Publisher neither dispatches the diagnostic nor edits the selected source;
the invoker decides whether to hand it to a responsible party.

An invalid selected Claim Model condition or scope identifies its exact claim,
source revision, and declared native or derived claimant. A derived finding
names the adapter identity without inferring who owns its code. An unanswered
view question instead identifies the exact Edition, medium, view, omission, and
editor. These local errors do not produce a Candidate or write back to a source.

Equal selected locks or passing Provider conformance do not retire an incumbent.
The incumbent owner must separately approve an exact consumer-parity result or
reviewed semantic successor under its own policy. Publisher preserves historical
receipts as evidence; neither those receipts nor this input protocol become a
second live source authority.

## Shared role boundaries

| Field                | Meaning                                                        |
| -------------------- | -------------------------------------------------------------- |
| `subject`            | Product whose architecture is described                        |
| `producer`           | Exact Architecture Publisher package that emitted the output   |
| `authorizationOwner` | Source-product authority allowed to approve the effect         |
| `custodian`          | Selected release, package, filesystem, or artifact destination |

These identities are intentionally separate. A successful Provider run records
how bytes crossed the boundary; it does not grant acceptance, authorize a
repository transition, or prove publication.

## Historical Provider v1

### Build scope and authored media

Provider v1 transports a Source Bundle, Claim Model, Edition, and optional
evolution values. It selects no source-owned renderer and returns no SVG, PNG,
HTML, browser verdict, or human
approval. The generic `archpub edition build` compiler uses its finite scene
composition; Provider conformance proves materialization, not visual parity with
a separately authored flagship Edition.

`authoredInputSha256` is a scene dependency identity. In the generic build it
changes scene and Candidate identities but does not make the compiler read the
corresponding authoring bytes. An adopter must separately verify that its
source-owned media composition consumed exact selected authoring inputs and
that the resulting static and interactive artifacts satisfy their own semantics,
browser, accessibility, and human-review obligations. A digest alone is not a
rendering or acceptance proof.

### Manifest

`architecture.edition-provider/v1` is a closed tagged union. Every manifest
binds:

- provider and subject identity;
- supported Source Bundle, Claim Model, Edition, and evolution contracts;
- one delivery mode;
- expected standard-value identities; and
- requested input, output, and elapsed-time ceilings below Publisher maxima.

The selected manifest itself is supplied with an exact SHA-256 digest. Host
paths are supplied by the build request and never enter the portable manifest.

### Declarative delivery

A declarative Provider selects relative paths and exact digests for a Source
Bundle, its semantic member, an Edition, and optional evolution. It executes no
source-product code. It is the preferred mode when a source owner can emit the
standard values directly.

### Executable delivery

An executable Provider selects one exact independently installed package, its
package-manifest digest, a canonical digest over every regular package file, and
one public export. Architecture Publisher verifies both digests before and after
execution, then starts a bounded child process with a closed JSON request, empty
user configuration, no inherited credentials, and no ambient repository
discovery. The reply may contain only the standard values.

Use this mode only when adaptation cannot be expressed as portable data. The
Provider package may depend inward on public source, semantics, Edition, and
renderer-neutral Scene contracts. It must not own renderers, browser execution,
rasterization, qualification, publication, Git or forge effects, or repository
governance.

### Conformance

The common profile verifies the same predicates for both modes:

1. closed manifest;
2. exact selected input identity;
3. closed standard-value output;
4. deterministic materialization;
5. isolated relocation;
6. empty configuration;
7. adjacent-checkout immunity;
8. one-way dependency direction;
9. resource ceilings; and
10. rejection of later-stage claims.

Each passing predicate carries invocation-bound evidence. A report with only a
list of optimistic `pass` labels is not conformance evidence. The report always
states that acceptance, publication, and independent verification were not
performed.

## Custody and feedback

The designated Provider owner owns its live transport; the Edition editor owns
its authored choices. Architecture Publisher may retain compact immutable
fixtures and receipts, never a second mutable copy. Findings are
non-authorizing proposals addressed to the owner of the affected source
assertion, editorial choice, adapter, or protocol. That owner decides whether
to change its input or implementation; Publisher cannot accept or publish on
the owner's behalf.
