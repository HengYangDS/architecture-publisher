# Design

## Context

See [proposal.md](proposal.md). Architecture Publisher 0.2 already enforces a
generic semantic kernel and source-owned Editions, but adopter delivery remains
implicit. ETHOS uses a broad executable package below its source repository;
AIGW uses declarative files below `docs/`. The current values can cross the
product boundary portably, yet no single contract identifies both forms,
enforces the same dependency restrictions, or separates subject ownership,
transformation, release authority, and artifact custody in one place.

The immutable 0.2 release and historical alpha.7 releases are inputs to this
change, not mutation targets.

## Observed Current Divergence

The migration scope is based on the following read-only inventory observed on
September 22, 2026. These are current implementation facts, not target-state
claims:

- Architecture Publisher has no public Edition Provider export. Its existing
  task surface accepts a closed build request through `archpub edition build`.
- ETHOS contains 37 JavaScript modules below
  `integrations/architecture-publisher`; 16 name Architecture Publisher
  directly. The five modules `src/edition/atlas-output.mjs`,
  `src/edition/atlas.mjs`, `src/edition/outline.mjs`,
  `src/edition/poster.mjs`, and `src/edition/publication.mjs` directly combine
  source-owned Edition work with generic renderer, font, SVG, raster,
  qualification, or publication mechanics. They are primary slimming
  candidates, not a pre-authorized deletion list.
- AIGW stores four current provider files and two immutable historical values
  below `docs/architecture/client-projection`. Their data-only form is already
  close to a declarative provider, but the mutable provider values lack an
  explicit product-owned runtime location and provider envelope.

The inventory deliberately distinguishes implementation observation from
ownership judgment. Migration decisions remain subject to each source
repository's own Change, Work Lane, parity evidence, and acceptance authority.

## Goals / Non-Goals

**Goals:**

- Define one small Provider boundary above the existing Source Bundle, Claim
  Model, and Edition contracts.
- Preserve source-product ownership while supporting declarative and executable
  materialization.
- Prevent provider code from absorbing generic rendering, browser,
  qualification, publication, or repository-governance responsibilities.
- Make self, ETHOS, and AIGW satisfy one conformance profile.
- Establish a migration sequence that deletes incumbent duplication.

**Non-Goals:**

- Add a provider registry, daemon, graph database, plugin marketplace, or second
  CLI root.
- Make Architecture Publisher an ETHOS or AIGW lifecycle controller.
- Make source products depend on renderer implementations.
- Rewrite immutable 0.2 or alpha.7 releases.
- Implement independent off-host disaster recovery without an operator-selected
  destination and custody policy.

## Authority Matrix

| Concern                                         | Authoritative owner                                                  | Provider role                      | Publisher role                         | Artifact store role                       |
| ----------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- | ----------------------------------------- |
| Product intent and accepted meaning             | Source product                                                       | Select exact source facts          | None                                   | None                                      |
| Claim Model and Edition authorship              | Source product                                                       | Materialize portable values        | Validate public contracts              | None                                      |
| Scene compilation and rendering                 | Architecture Publisher                                               | Supply authored Edition input only | Compile and render                     | Hold bytes                                |
| Qualification predicates                        | Architecture Publisher contract plus explicit human/source decisions | Supply selected subject inputs     | Evaluate exact candidate evidence      | Hold records                              |
| Repository transition and release authorization | Source product governance                                            | None                               | Return bounded publication plan/effect | Execute only authorized custody operation |
| Generated artifact ownership                    | Described source product                                             | Bind subject identity              | Record producer identity               | Preserve exact bytes and manifest         |
| Feedback                                        | Source product                                                       | Receive source-bound proposal      | Emit finding without mutation          | Preserve receipt if published             |

## Selected Architecture

### Provider envelope

One `architecture.edition-provider/v1` envelope selects:

- provider identity and revision;
- subject-product identity;
- contract versions;
- delivery mode;
- exact declarative files or installed package identity;
- expected materialized value identities;
- optional evolution input;
- declared resource limits.

The envelope is selection input, not semantic authority. Claim Model and Edition
values retain their existing identities and schemas.

### Delivery modes

A declarative provider selects closed portable JSON values. An executable
provider selects one independently installed package export. The generic
materializer starts a bounded child process with empty user configuration,
imports only that selected export, passes one versioned JSON request, and accepts
one bounded JSON reply containing the same closed values. Executable
materialization runs before compilation and cannot return Candidate,
qualification, publication, or source-governance state. Provider code never
runs inside the long-lived Publisher process.

The executable boundary initially permits only public source, semantic, Edition,
and renderer-neutral Scene contracts. Import and package tests reject concrete
renderer, browser, qualification, publication, forge, Git, and source-product
lifecycle ownership. If later evidence demonstrates a legitimate shared
authoring helper, that helper must be admitted through the narrow provider
surface rather than a direct deep import.

### Composition root

The existing `archpub edition build` flow remains the public task surface. A
build plan may contain exact standard values directly or select one provider
envelope whose materialized outputs become those same inputs. No `archpub
provider` command root is introduced.

### Artifact custody

Candidate and publication manifests distinguish:

- `subject`: the described product and semantic owner;
- `producer`: exact Architecture Publisher package and renderer identities;
- `authorizationOwner`: the source-product release authority;
- `custodian`: the selected release, package, filesystem, or artifact target.

A Documents copy is a delivery projection. It is never the semantic or release
authority.

## Alternatives Considered

### Keep implicit heterogeneous integrations

Rejected. It preserves accidental asymmetry, prevents one conformance contract,
and allows source repositories to accumulate Publisher mechanics without a
clear failure boundary.

### Centralize ETHOS and AIGW implementations in Architecture Publisher

Rejected. It creates a second mutable owner of source-product meaning and lets a
publication product drift from accepted source intent.

### Require every adopter to publish executable code

Rejected. AIGW demonstrates that declarative values are sufficient for many
products; mandatory code increases supply-chain and maintenance burden without
adding semantic value.

### Require every adopter to be data-only

Rejected. Some products require bounded source-specific computation to select or
normalize their accepted facts. That computation remains source-owned but must
terminate at portable values.

## Migration Plan

1. Implement the provider envelope, validator, materializer, package boundary,
   and common conformance journey in Architecture Publisher without changing the
   0.2 release.
2. Migrate Architecture Publisher self-use to the declarative path and prove no
   candidate or artifact identity changes unless the selected semantic input
   intentionally changes.
3. Migrate AIGW files from the documentation tree to one explicit source-owned
   provider root; prove installed, relocated, offline parity and AIGW-owned
   acceptance before removing the old path.
4. Reduce the ETHOS executable provider to source adaptation and Edition
   authorship; move or delete generic renderer, browser, qualification, review,
   and publication mechanics after exact replacement coverage exists.
5. Run the same provider conformance, Edition build, evolution, qualification,
   publication, recovery, and release checks for self, AIGW, and ETHOS.
6. Remove superseded paths, fixtures, package names, and compatibility surfaces
   only after every current consumer and immutable receipt points to the new
   contract.

Each repository performs its migration in its own OpenSpec Change and Work Lane.
No repository imports another checkout, and no central migration ledger is
created.

## Risks / Trade-offs

- **The Provider abstraction duplicates Edition** -> The Provider owns only
  selection and materialization; Edition continues to own audience and authored
  presentation meaning.
- **Executable providers grow into plugin platforms** -> Permit one package
  entry point, closed inputs and outputs, strict imports, bounded work, and no
  persistent registry.
- **A common contract erases legitimate adopter differences** -> Unify output
  semantics and conformance while retaining source-owned implementation and
  delivery mode.
- **Migration creates temporary dual authority** -> Use explicit parity windows,
  prohibit dual mutation, and delete the incumbent in the same repository
  Change that admits the replacement.
- **Artifact ownership is confused with storage** -> Bind subject, producer,
  authorization owner, custodian, and exact bytes independently in manifests.
- **Historical receipts become current instructions** -> Treat them as immutable
  evidence only; current behavior comes from canonical specs and source-owned
  provider inputs.

## Disaster-Recovery Decision Contract

Off-host recovery requires an operator-selected destination, independent
credentials, custody owner, retention period, encryption policy, and restore
acceptance environment. Until those values exist, the product SHALL report the
boundary as unproved and SHALL NOT treat GitLab source, package storage, CI, or a
same-disk copy as an independent recovery domain.
