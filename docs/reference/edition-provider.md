---
subject: architecture-publisher:edition-provider
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Edition Provider

An **Edition Provider** is a narrow, source-owned boundary that materializes the
portable values consumed by Architecture Publisher. It is transport and
adaptation, not a second compiler, registry, workflow engine, or authority.

```text
source-owned facts and authored intent
                |
        Edition Provider
                |
 Source Bundle + Claim Model + Edition + optional evolution
                |
       archpub edition build
                |
         Edition Candidate
```

The only build command remains `archpub edition build`. There is no `archpub
provider` command tree and no ambient provider discovery.

## Identities and owners

| Field                | Meaning                                                        |
| -------------------- | -------------------------------------------------------------- |
| `subject`            | Product whose architecture is described                        |
| `producer`           | Exact Architecture Publisher package that emitted the output   |
| `authorizationOwner` | Source-product authority allowed to approve the effect         |
| `custodian`          | Selected release, package, filesystem, or artifact destination |

These identities are intentionally separate. A successful Provider run records
how bytes crossed the boundary; it does not grant acceptance, authorize a
repository transition, or prove publication.

## Manifest

`architecture.edition-provider/v1` is a closed tagged union. Every manifest
binds:

- provider and subject identity;
- supported Source Bundle, Claim Model, Edition, and evolution contracts;
- one delivery mode;
- expected standard-value identities; and
- requested input, output, and elapsed-time ceilings below Publisher maxima.

The selected manifest itself is supplied with an exact SHA-256 digest. Host
paths are supplied by the build request and never enter the portable manifest.

## Declarative delivery

A declarative Provider selects relative paths and exact digests for a Source
Bundle, its semantic member, an Edition, and optional evolution. It executes no
source-product code. It is the preferred mode when a source owner can emit the
standard values directly.

## Executable delivery

An executable Provider selects one exact independently installed package and
one public export. Architecture Publisher starts a bounded child process with a
closed JSON request, empty user configuration, no inherited credentials, and no
ambient repository discovery. The reply may contain only the standard values.

Use this mode only when adaptation cannot be expressed as portable data. The
Provider package may depend inward on public source, semantics, Edition, and
renderer-neutral Scene contracts. It must not own renderers, browser execution,
rasterization, qualification, publication, Git or forge effects, or repository
governance.

## Conformance

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

The source repository owns its live Provider and Edition. Architecture Publisher
may retain compact immutable fixtures and receipts, never a second mutable copy.
Provider findings are non-authorizing proposals addressed to the source owner.
The source owner decides whether to change intent, implementation, acceptance,
or publication.
