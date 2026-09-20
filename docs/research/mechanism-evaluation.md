# Mechanism evaluation

Observed on 2026-09-19. Versioned source checkouts, not product claims, are the
evidence basis. Line counts are mechanical counts of tracked code-like files;
they measure surface area, not quality or semantic density.

## Decision invariants

The product compiles selected source bytes and explicit product meaning into
recoverable architecture publications. It must not become a second intent
store, repository lifecycle, workflow state machine, code-graph authority,
editor, marketplace or resident service.

The evaluation therefore asks five questions:

1. What concrete implementation exists?
2. Which named consumer in this product needs it?
3. Is the derived state rebuildable from authoritative inputs?
4. Does it preserve source, intent, observation, proof and authorization as
   distinct concepts?
5. Is its total ownership cost lower than the narrower existing mechanism?

## Source baseline

| System | Evaluated source | Tracked code-like lines | Implemented center of gravity |
| --- | --- | ---: | --- |
| COMET | `0.4.1`, `9c6a89857f8ce33c12b9abcc1230bd1076de8068` | 464,994 | Native/classic workflow runtimes, checkpoints, trajectory recovery, Skills and evaluation |
| OpenSpec | `v1.13.1`, `634c557bd0470eec37861b46172c3f503d283c1b` | 129,377 | Change artifacts, schema validation, status and archive/sync lifecycle |
| Spec Kit | `v1.0.8`, `0cc9a6a1159471a3108b9bad718ba17006dd6039` | 184,138 | Constitution, templates and agent-oriented specification workflow |
| SpecD | `0c1053f635b7a206aaa7c66ff86720aa2224c1b7`; core `0.2.0`, code graph `0.3.0` | 217,160 | Context compilation, lifecycle and SQLite-backed multi-language code/spec graph |
| ETHOS | `75d997cadcb306077f77ad710080363a9f65c69f` | 117,362 | Repository authority, owned lanes, proof, controlled effects and attestation |
| Architecture Publisher | `2009af0e0398403d610873e2286823873b4c8097` baseline | 81,041 | Source-bound semantics, composition, rendering, observation and recoverable publication |

The COMET, OpenSpec and Spec Kit repositories had later default-branch commits
when checked, but their latest stable releases remained `0.4.1`, `v1.13.1` and
`v1.0.8`. SpecD published no GitHub release, so the observed commit and package
versions are named explicitly.

Primary source locations:

- <https://github.com/rpamis/comet/tree/0.4.1>
- <https://github.com/Fission-AI/OpenSpec/tree/v1.13.1>
- <https://github.com/github/spec-kit/tree/v1.0.8>
- <https://github.com/specd-sdd/SpecD/tree/0c1053f635b7a206aaa7c66ff86720aa2224c1b7>
- <https://github.com/salsa-rs/salsa>
- <https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/>
- <https://www.w3.org/TR/shacl/>
- <https://egraphs-good.github.io/>
- <https://constraints.cs.washington.edu/cassowary/>
- <https://slsa.dev/spec/v1.2/provenance>
- <https://in-toto.io/>

## Adopt, reject and defer

| Domain | Observed mechanism | Decision | Concrete consumer and boundary |
| --- | --- | --- | --- |
| Intent and specification | OpenSpec 1.13.1 prevents normalized duplicate requirements, validates malformed task markers and hardens archive/sync ordering. Spec Kit supplies constitution and template discipline. | **Adopt current carrier; borrow editorial discipline.** | OpenSpec remains the repository's explicit change-intent carrier. Constitution-style invariants may improve authored guidance, but Spec Kit's workflow must not become another lifecycle owner. |
| Resumable agent work | COMET implements checkpoint journals, trajectory recovery, native next actions, pending operations, immutable snapshots and evaluation scaffolds. | **Adopt concepts; reject runtime import.** | ETHOS can strengthen immutable Skill-input snapshots, pending-effect/outcome binding, resumable next action, child readiness and rubric-based evaluation. Do not import `.comet` run state, trajectories or a parallel command plane. |
| Context compilation | SpecD compiles relevant specifications and lifecycle instructions and records workspace-aware dependencies. | **Adopt bounded relevance metadata.** | A future intent compiler may select relevant accepted intent and disclose omitted/lossy context. Selection remains a reproducible projection, never authority over the source documents. |
| Code semantics | SpecD implements multi-language symbols, dependency/impact queries, stale latches and a SQLite graph store. CodeQL separates syntax, control flow, data flow and taint semantics. | **Adopt typed relation and freshness boundaries; reject graph authority.** | Source-bound architecture inputs must name relation kind, evidence revision, analysis boundary, freshness and loss. A graph may be rebuilt as observation; it cannot replace accepted product intent. Do not add SQLite until a real consumer needs persisted queries. |
| Incremental computation | Salsa tracks query inputs and invalidates dependent derived results by revision and durability. | **Defer.** | Two adopters do not yet show that selective recomputation would repay a new runtime and cache-coherency contract. Current complete bounded compilation remains simpler and auditable. |
| Semantic validation | SHACL validates typed graph shapes independently of a particular storage engine. | **Defer.** | The current finite JSON semantic vocabulary already fails closed. Reconsider shape languages only when third-party extensions require an open vocabulary that cannot remain a closed schema. |
| Equivalence | E-graphs compactly represent explicit rewrite equivalences and support equality saturation. | **Reject for inferred intent; defer for exact transformations.** | They may later optimize declared diagram rewrites. They must never infer that two natural-language intents or product commitments are equivalent. |
| Constraint layout | Cassowary separates required constraints from weighted preferences and updates layouts incrementally. | **Defer.** | The current finite compositor has deterministic explicit groups, order, ports and routes. Introduce a solver only after a third real adopter demonstrates an otherwise irreducible layout family and a bounded unsatisfiable-core contract. |
| Assurance | SLSA provenance separates subject, builder and resolved dependencies; in-toto records signed step materials and products. | **Adopt field boundaries, not the full frameworks.** | Publication evidence should keep artifact subject, builder/verifier identity, selected dependencies, observations and byproducts distinct. Existing exact digests and attestations remain the product contract. |
| Verification | Independent verification is often treated as a separate service. | **Adopt a smaller rule.** | A verifier is a pure, predicate-specific executor over exact immutable inputs. Use a distinct trust domain only where risk or policy requires it; do not create a resident verifier service or duplicate the workflow state. |
| Recovery | COMET checkpoints and in-toto/SLSA provenance improve resumability and traceability; this product already journals prestates and exact plans. | **Keep current owner; borrow explicit pending/outcome vocabulary.** | File publication retains exact plan binding, prestates, journaled effects and rollback. A status projection may distinguish pending action from observed outcome without becoming a new ledger. |

## Consequences for ETHOS

ETHOS is best treated as the hard trust skeleton for an agentic-native
repository, not as an SDD front end, Skill runtime or semantic database. Its
terminal chain should remain:

```text
problem or research
-> open interpretation
-> accepted intent
-> typed, source-bound semantics
-> commitment plus fresh facts
-> capability selection
-> owned lanes and worktrees
-> proof
-> CAS-controlled effect
-> post-effect observation
-> attestation
-> real-use outcome
-> feedback to accepted intent
```

Greenfield scaffolding and brownfield adoption are both first-class. Lanes may
cooperate on separate concerns, compete on the same concern, or explore without
landing; all candidates may be dropped. Skills supply methods but no authority.
Code and semantic graphs supply observations but no intent. OpenSpec and Git are
the current concrete carriers because their contracts fit ETHOS; they are not
claimed to be losslessly replaceable by arbitrary SDD and VCS systems.

The architecture publisher remains downstream. It turns explicitly selected
facts and meaning into human-readable static and interactive projections, then
binds observation and file effects. It must not absorb ETHOS governance, infer
product intent from code, or promote a rendering result into acceptance.

## Revisit triggers

Reconsider a deferred mechanism only when a named adopter supplies a failing
case, measurable current cost and acceptance test. In particular:

- add incremental invalidation only after repeated complete builds dominate a
  real workflow;
- add an open shape system only after the closed vocabulary blocks a required
  extension;
- add a constraint solver only after explicit finite composition cannot express
  a required layout;
- persist a code graph only after rebuildable observations prove insufficient;
- add stronger independent execution only where the relevant policy requires a
  separate trust domain.

This preserves a small semantic kernel while leaving deliberate extension seams.
