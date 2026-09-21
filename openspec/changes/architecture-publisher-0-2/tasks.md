# Tasks

## 1. Baseline and product identity

- [x] 1.1 Record alpha.7 source, tag, release, package, static, HTML, repository-path, and remote-project identities in an immutable migration baseline; verify every selected local byte and current remote object by digest or provider readback.
- [x] 1.2 Add failing identity tests covering `Architecture Publisher`, package `architecture-publisher`, sole CLI `archpub`, subordinate Edition names, and absence of a runtime `architecture` alias; then implement the identity change and pass focused plus full tests.
- [x] 1.3 Replace the canonical product contract, README, Skill, profile, CI, release, and package descriptions with one consistent identity and boundary; verify a repository-wide semantic scan reports no current product use of `ethos-architecture` or old CLI guidance outside explicitly historical evidence.

## 2. Claim Model and Edition contracts

- [x] 2.1 Add failing tests for the v2 Claim Model covering all five planes, condition, scope, maturity, provenance, validity, unknown coverage, cross-plane distinction, contradiction, limits, canonicalization, and hostile JSON; implement one strict validator and digest owner and pass the full semantic suite.
- [x] 2.2 Implement and test the one-shot v1-to-v2 fixture migration; prove current runtime readers reject v1 and no compatibility parser, alias, fallback, or dual schema remains.
- [x] 2.3 Add failing tests for the Edition contract covering audience, questions, required claims, omissions, narrative order, visual grammar, independent scenes, qualification obligations, complete overview, and complete mechanism views; implement validation and digest ownership.
- [x] 2.4 Extend semantic change compilation with claim and Edition dependencies; verify plane-only, condition-only, source-only, omission, unknown, rename, split, merge, addition, removal, and contradiction cases yield separate rebuild, verification, human-review, acceptance, and publication obligations.

## 3. Semantic and physical convergence

- [x] 3.1 Move ETHOS source integration behind `adapters/ethos`, renderer implementations behind `renderers`, scene ownership below `src/scene`, and Edition-owned behavior below `editions`; update imports under one prewrite admission and verify module-boundary tests reject every reverse dependency.
- [x] 3.2 Remove ambiguous or superseded implementation owners and current compatibility identities rather than retaining wrappers; verify source and test scans contain one owner for each public invariant and no `core`, `common`, `shared`, `utils`, `legacy`, or `compat` catch-all introduced by the migration.
- [x] 3.3 Refactor the public CLI into a generic composition root over source, semantic, Edition, rendering, qualification, and publication contracts; verify one declarative command/help owner, concise layered help, actionable errors, sole `archpub` identity, offline installed operation, and no Edition, adopter, repository, schema, or renderer-vendor logic in the CLI.
- [x] 3.4 Make the root `architecture-publisher` distribution domain-neutral and isolate concrete source adapters and Editions behind independently installable migration package boundaries; verify a packed core excludes concrete domain code, remains fully functional without those packages, and every extension depends inward through exported public contracts only.
- [x] 3.5 Converge the migration topology: move the source-owned self-Edition to `editions/self`, place renderer supply below its owner, move installed self-use to `conformance/journeys`, place temporary adopter copies under explicit `migration` ownership, and reject `packages/extensions`, generic asset ownership, adjacent-checkout runtime dependencies, and compatibility paths. Tasks 6.1 and 6.2 remove the adopter staging copies after source-owned parity.
- [x] 3.6 Replace the ad hoc syntax check with one fail-closed repository quality graph covering format, zero-warning lint, checked JavaScript contracts, import direction, dead code, documentation, strict OpenSpec validation, behavior, measured coverage, and packed-package validity; pin the stable toolchain, exclude only export-only indexes from coverage, reject wildcard public exports, and preserve both primary and cleanup failures. Treat the measured `89/86/95` statement-or-line/branch/function floor as an enforced starting point rather than the terminal quality target.

## 4. First-party Architecture Publisher Edition

- [x] 4.1 Author a source-bound complete self-model covering source authorities, adapters, Claim Model, Edition, independent media, qualification, recoverable publication, self/ETHOS/AIGW consumers, evolution, feedback, unknowns, and authority exclusions; verify all visible claims have exact provenance and required coverage.
- [x] 4.2 Build a dedicated first-party Architecture Publisher Edition owner with separate static and interactive scene sources; verify generic modules do not branch on this Edition identity and the old eight-module self-host portrait remains only as a bounded structural example.
- [x] 4.3 Design and generate the flagship static overview at 6000×3375 with one causal spine, explicit visual hierarchy, restrained palette, measured typography, balanced canvas use, and no template/debug/version residue; verify semantic coverage and painted geometry at delivery resolution.
- [x] 4.4 Design and generate a standalone interactive atlas whose first page is a complete overview and whose mechanism pages independently explain semantics, Edition, composition, qualification, publication/recovery, adoption, and evolution; verify navigation, focus, tracing, source inspection, responsive layout, and no geometry-changing motion.

## 5. Qualification and self-evolution

- [x] 5.1 Implement exact qualification records for semantic, coverage, static geometry, interactive browser, accessibility, installed-use, recovery, and human visual predicates; verify no predicate or weighted score can substitute for another.
- [x] 5.2 Add painted-output checks for glyphs, strokes, arrowheads, endpoints, nodes, labels, viewport overflow, canvas balance, template residue, and console errors; verify failures against deliberately malformed static and interactive fixtures before accepting the flagship.
- [x] 5.3 Exercise a real source-bound self-model change through semantic delta, affected-view computation, candidate regeneration, separate medium checks, and fresh approval requirements; verify generated files are never inputs to authoring and unaffected artifacts retain identity.
- [x] 5.4 Present the exact flagship PNG and standalone HTML for human review against `faithful`, `intelligible`, and `restrained`; bind the user's verdict to exact artifact and Edition digests and keep any rejection open until replacement bytes are approved.

## 6. Ecosystem and installed-product proof

- [x] 6.1 In an ETHOS-owned Work Lane, migrate the ETHOS adapter and live Edition to the ETHOS repository while consuming its existing exact source projection downstream; prove the same immutable candidate digests or explicitly review every semantic difference, remove the migrated central ETHOS package, and verify no ETHOS authority, Commitment compilation, lane control, proof minting, or CAS effect enters Architecture Publisher.
- [x] 6.2 Under AIGW's native repository governance, promote AIGW from a bounded example to a source-owned live Edition with independent static and interactive composition and one real semantic evolution; prove the same immutable candidate digests or explicitly review every semantic difference, remove the migrated central AIGW package or example, and verify it has no dependency on ETHOS-specific Edition or renderer modules.
- [x] 6.3 Run the self, ETHOS, and AIGW contract matrix from exact independently packed packages under relocated offline inputs and empty user configuration, with no adjacent checkout discovery; verify source, semantic, scene, qualification, publication, replacement, interruption recovery, reader journeys, and the same immutable candidate digests selected by each source owner.
- [x] 6.4 Measure complete rebuild and affected-view cost across all three consumers; record defer/adopt decisions for persistent graph storage, incremental queries, and constraint solving against named failing cases rather than anticipated scale.

## 7. Acceptance, migration, and release

- [x] 7.1 Run syntax, full behavior, module-boundary, semantic, geometry, browser, accessibility, packaging, installed-use, replacement, and recovery gates at one exact candidate HEAD; preserve raw scoped evidence and record all unproved limits.
- [ ] 7.2 Prove and land the Work Lane into `candidate/dev`, close accepted source into `dev`, and archive this one OpenSpec Change through ETHOS public transitions; verify exact HEADs, leases, attestations, clean worktrees, and absence of active proposal or Work Lane residue.
- [x] 7.3 Preflight local and GitLab consumers, then rename the same repository object and accepted checkout to `architecture-publisher`; verify preserved commit/tag history, default branch, remote path, clone URL, package metadata, and absence of a second mutable repository. Do not publish predecessor archives or modify immutable alpha.7 assets.
- [ ] 7.4 Create and sign `v0.2.0-alpha.0`, publish exact release assets and package, read back remote bytes, reinstall from the published artifact, and verify the selected static and interactive journeys.
- [ ] 7.5 Install the accepted 6000-pixel PNG and standalone HTML under `/Users/yheng/Documents`, verify their exact digests against the release manifest, classify and remove only disposable build residue, and report independent off-host recovery as unproved and excluded.
