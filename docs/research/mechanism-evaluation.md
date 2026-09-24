# Mechanism evaluation

Framework sources were observed on 2026-09-19. Repository-wiring tools were
observed on 2026-09-20. Versioned source and executable behavior, not product
claims, are the evidence basis. Line counts are mechanical counts of tracked
code-like files; they measure surface area, not quality or semantic density.

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

| System                 | Evaluated source                                                             | Tracked code-like lines | Implemented center of gravity                                                             |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------: | ----------------------------------------------------------------------------------------- |
| COMET                  | `0.4.1`, `9c6a89857f8ce33c12b9abcc1230bd1076de8068`                          |                 464,994 | Native/classic workflow runtimes, checkpoints, trajectory recovery, Skills and evaluation |
| OpenSpec               | `v1.13.1`, `634c557bd0470eec37861b46172c3f503d283c1b`                        |                 129,377 | Change artifacts, schema validation, status and archive/sync lifecycle                    |
| Spec Kit               | `v1.0.8`, `0cc9a6a1159471a3108b9bad718ba17006dd6039`                         |                 184,138 | Constitution, templates and agent-oriented specification workflow                         |
| SpecD                  | `0c1053f635b7a206aaa7c66ff86720aa2224c1b7`; core `0.2.0`, code graph `0.3.0` |                 217,160 | Context compilation, lifecycle and SQLite-backed multi-language code/spec graph           |
| ETHOS                  | `75d997cadcb306077f77ad710080363a9f65c69f`                                   |                 117,362 | Repository authority, owned lanes, proof, controlled effects and attestation              |
| Architecture Publisher | `2009af0e0398403d610873e2286823873b4c8097` baseline                          |                  81,041 | Source-bound semantics, composition, rendering, observation and recoverable publication   |

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
- <https://github.com/sverweij/dependency-cruiser/tree/v18.4.0>
- <https://github.com/webpro-nl/knip/tree/knip%406.37.0>
- <https://github.com/publint/publint/tree/v0.3.24>
- <https://github.com/javierbrea/eslint-plugin-boundaries/tree/v7.2.0>

## Adopt, reject and defer

| Domain                       | Observed mechanism                                                                                                                                                                      | Decision                                                                   | Concrete consumer and boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent and specification     | OpenSpec 1.13.1 prevents normalized duplicate requirements, validates malformed task markers and hardens archive/sync ordering. Spec Kit supplies constitution and template discipline. | **Adopt current carrier; borrow editorial discipline.**                    | OpenSpec remains the repository's explicit change-intent carrier. Constitution-style invariants may improve authored guidance, but Spec Kit's workflow must not become another lifecycle owner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Resumable agent work         | COMET implements checkpoint journals, trajectory recovery, native next actions, pending operations, immutable snapshots and evaluation scaffolds.                                       | **Adopt concepts; reject runtime import.**                                 | ETHOS can strengthen immutable Skill-input snapshots, pending-effect/outcome binding, resumable next action, child readiness and rubric-based evaluation. Do not import `.comet` run state, trajectories or a parallel command plane.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Context compilation          | SpecD compiles relevant specifications and lifecycle instructions and records workspace-aware dependencies.                                                                             | **Adopt bounded relevance metadata.**                                      | A future intent compiler may select relevant accepted intent and disclose omitted/lossy context. Selection remains a reproducible projection, never authority over the source documents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Code semantics               | SpecD implements multi-language symbols, dependency/impact queries, stale latches and a SQLite graph store. CodeQL separates syntax, control flow, data flow and taint semantics.       | **Adopt typed relation and freshness boundaries; reject graph authority.** | Source-bound architecture inputs must name relation kind, evidence revision, analysis boundary, freshness and loss. A graph may be rebuilt as observation; it cannot replace accepted product intent. Do not add SQLite until a real consumer needs persisted queries.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Incremental computation      | Salsa tracks query inputs and invalidates dependent derived results by revision and durability.                                                                                         | **Defer.**                                                                 | Two adopters do not yet show that selective recomputation would repay a new runtime and cache-coherency contract. Current complete bounded compilation remains simpler and auditable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Semantic validation          | SHACL validates typed graph shapes independently of a particular storage engine.                                                                                                        | **Defer.**                                                                 | The current finite JSON semantic vocabulary already fails closed. Reconsider shape languages only when third-party extensions require an open vocabulary that cannot remain a closed schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Equivalence                  | E-graphs compactly represent explicit rewrite equivalences and support equality saturation.                                                                                             | **Reject for inferred intent; defer for exact transformations.**           | They may later optimize declared diagram rewrites. They must never infer that two natural-language intents or product commitments are equivalent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Constraint layout            | Cassowary separates required constraints from weighted preferences and updates layouts incrementally.                                                                                   | **Defer.**                                                                 | The current finite compositor has deterministic explicit groups, order, ports and routes. Introduce a solver only after a third real adopter demonstrates an otherwise irreducible layout family and a bounded unsatisfiable-core contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Assurance                    | SLSA provenance separates subject, builder and resolved dependencies; in-toto records signed step materials and products.                                                               | **Adopt field boundaries, not the full frameworks.**                       | Publication evidence should keep artifact subject, builder/verifier identity, selected dependencies, observations and byproducts distinct. Existing exact digests and attestations remain the product contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Verification                 | Independent verification is often treated as a separate service.                                                                                                                        | **Adopt a smaller rule.**                                                  | A verifier is a pure, predicate-specific executor over exact immutable inputs. Use a distinct trust domain only where risk or policy requires it; do not create a resident verifier service or duplicate the workflow state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Recovery                     | COMET checkpoints and in-toto/SLSA provenance improve resumability and traceability; this product already journals prestates and exact plans.                                           | **Keep current owner; borrow explicit pending/outcome vocabulary.**        | File publication retains exact plan binding, prestates, journaled effects and rollback. A status projection may distinguish pending action from observed outcome without becoming a new ledger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| JavaScript dependency policy | dependency-cruiser `18.4.0` implements cycle, unresolved, orphan, required-dependency and transitive-reachability rules over the module graph.                                          | **Defer replacement; use as an independent audit.**                        | A scoped run over `src`, `adapters`, `renderers`, `editions`, `conformance/journeys/self-host`, and `tools`, without recursively expanding external packages, observed 88 modules and 318 dependencies: 73 first-party modules, 3 vendored modules, 11 Node built-ins, and one external development dependency, with no unresolved dependency, cycle, orphan module, or rule violation. Keep the smaller Acorn gate because it additionally enforces the repository's semantic owner policy and fails computed imports, package escapes, undeclared externals, and module-relative resource URLs. Replace extraction only when a reproducible missed edge exists and the mature engine can preserve every stricter local invariant. |
| Dead files and exports       | Knip `6.37.0` implements entry-aware unused file, export and dependency analysis.                                                                                                       | **Adopt as an implementation gate; never auto-fix.**                       | An unconfigured run treated intentional executables, qualification tools and bundled renderer supply as unused. After declaring the real CLI, self-host, migration, browser and installed-evolution entries, the default graph closes development/test seams and the strict production graph excludes development-only dependency admission. Local-only exports were narrowed manually. Knip remains an implementation-observation tool; it does not define semantic owners or delete code.                                                                                                                                                                                                                                         |
| Package surface              | publint `0.3.24` validates npm package metadata and packed layout.                                                                                                                      | **Adopt as an independent package predicate inside the repository gate.**  | `npm run check:package` validates the actual packed core after behavior and static checks. Installed public journeys still own offline execution and supply-drift rejection; publint neither replaces those journeys nor grants release acceptance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Boundary linting             | ESLint `10.11.0` supplies broad zero-warning JavaScript correctness rules; eslint-plugin-boundaries `7.2.0` can classify dependencies by element, file category, and origin.            | **Adopt ESLint; retain the smaller semantic boundary checker.**            | ESLint now owns general first-party linting. The repository's Acorn-based gate separately derives package exports from their manifests and enforces semantic owner direction, computed-import rejection, package escape rules, declared externals, and executable composition roots. Do not add a second boundary authority unless a reproduced missed edge cannot be expressed by the existing checker.                                                                                                                                                                                                                                                                                                                            |
| Security and data flow       | CodeQL models syntax, control/data flow and taint across supported languages.                                                                                                           | **Use only for security-specific questions.**                              | It complements but does not replace ownership, packaging, installed/offline, recovery or publication-path verification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Measured terminal decisions

Three independently installed runs per consumer measured the current exact
`architecture-publisher` package. Median complete build versus affected-view
analysis was `4918.980 ms / 27.361 ms` for self, `5517.154 ms / 87.610 ms`
for ETHOS, and `2036.866 ms / 9.788 ms` for source-owned AIGW. Outputs were
deterministic in every run. Analysis therefore consumed at most `1.588%` of a
complete build, while each real measured change still selected the static view
and multiple interactive views for rebuild.

The terminal decision is to defer persistent graph storage, incremental query
runtime, and a general constraint solver. The present bottleneck is required
media work, not semantic dependency traversal. No consumer exhibited a
persistence failure, irreducible query, or unsatisfiable finite composition.
Reopen a decision only with a named failing consumer case and a benchmark that
demonstrates lower total ownership cost. Exact observations and report digests
are bound in `conformance/fixtures/first-party-contract-matrix.json`.

## Mechanism-wiring audit rule

A mechanism is connected only when all five links are present:

```text
declaration -> implementation owner -> composition or public entry
            -> real consumer -> predicate-specific verifier/evidence
```

A static import graph proves only one part. Repository acceptance also checks
module direction, declared executable entry points, package closure, relocated
offline use, failure and recovery paths, and whether evidence exits through its
existing owner. Derived graphs remain disposable observations. They do not become
a registry, cache authority, lifecycle state, or second task ledger.

The current default and production graphs found no unreachable first-party
JavaScript module from the declared CLI, self-host, migration, browser, and
installed-evolution entry points. The audit narrowed 25 public-looking exports
that had only module-local use or no consumer. The remaining development and
test seams are marked `@internal`; Knip validates them in the default graph and
intentionally excludes them from production export claims. The previously omitted
installed-evolution executable now belongs to the repository syntax gate. The
repository-owned regression rejects imprecise first-party owner paths, unadmitted
dynamic imports, and any authored JavaScript module omitted from that gate.

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

## AIGW direct-framework visual counterexample (2026-09-24)

A direct LikeC4 probe used AIGW `3318c81978917a0d16d6d16073d313ca78ee2736`'s
selected `architecture/edition-provider/_source/semantic.json` (SHA-256
`fc12aeef70916801b5bb25615b7b9db698471abc29bf4998f22b6482cf7b6672`).
The [frozen probe](../../conformance/fixtures/research/aigw-likec4-direct.c4)
maps its 12 entities and 11 directed relations to one overview. It retains
selected IDs and status fields as LikeC4 metadata but intentionally omits parts
of the source Claim Model. It is a visual baseline, **not** an equivalent
Architecture Edition or an AIGW-owned live input.

Installed LikeC4 `1.59.4` validated the probe and built a standalone
`--output-single-file --use-hash-history` HTML (SHA-256
`ff2fa9d931f3f194d9220db31af6be136664a2f1148a8e183dd0d9b68dc500dd`).
Background Chrome opened that file offline at 1600 by 1000 pixels without a
failed request or page error. The published core/layout API preserved 12
entity IDs and 11 relation IDs in the model, but its computed view edges had
generated IDs and no direct metadata field; an exact claim-to-visible-carrier
mapping remains unproved. Native `likec4 export png` failed on this host because
its expected Playwright headless-shell executable was absent; this is a local
installed-use gap, not proof that LikeC4 cannot export PNG elsewhere.

![Direct LikeC4 AIGW overview, rejected as publication-quality composition](evidence/aigw-likec4-direct.png)

The direct default image (SHA-256
`817e125610e1d17b1326fe3bc981a7e9b2f5f609d26f51203339c8855d6c4cae`)
is a uniform blue-box graph with weak differentiation, substantial empty space,
and no editorial treatment of authority, credential supply, guarded effects,
or client projection. The user rejected this visual result. **Decision:** do
not substitute LikeC4's default renderer for a release-quality AIGW Edition.
LikeC4's versioned model, view, and layout mechanisms remain candidates for
reuse behind a product-owned editorial composition and semantic-carrier check;
their fit requires a styled multi-view AIGW, ETHOS, self, and unrelated-domain
counterexample rather than a favorable two-node smoke test.

## Additional source-level comparators (2026-09-24)

The following stable-tag sources were inspected through the GitHub CLI and
read-only local clones on 2026-09-24. This is a targeted implementation review,
not a claim that every execution path or hosted integration was tested. It adds
comparators to the decisions above; it does not replace the canonical ETHOS,
Publisher, or AIGW contracts.

| System    | Exact source                                                                                                                                                                              | Observed implemented center                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| SpecDD    | [framework 1.5](https://github.com/specdd/specdd/tree/f5440dc93f4fc75c42f2fbbdfc304bd7ef0e5451); [CLI 1.1.1](https://github.com/specdd/cli/tree/fe2ffc946935e1b36c662dadf4c6ce899c304b97) | Path-local specification resolution and linting.                                                  |
| AgentSpec | [0.1.43](https://github.com/yimwoo/agent-spec/tree/9fc86d5576d7866fc31c6a4bb56739812bb8389f)                                                                                              | Repo-local task/run control, writer-session records, source drift, and evidence.                  |
| SpecRoute | [0.4.0](https://github.com/Enovatr-Labs/SpecRoute/tree/abc4c482da117c654b414517e68074ad643a950e)                                                                                          | Cross-agent templates, guidance, and hook scripts; explicitly content rather than an application. |

**SpecDD.** The CLI's
[resolver](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/src/services/spec-resolver/spec-resolver.ts)
selects a target's local and ancestor specifications, follows typed `Owns`,
`Can modify`, `References`, and other links with a bounded depth and cycle
protection, and returns `target`, `parent`, or `link` reasons for inclusion. Its
[linter](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/src/services/spec-linter/spec-linter.ts)
reports path and ambiguity diagnostics. **Adopt the principle** of explainable,
revision-bound intent-context selection; **reject** another `.sdd` source of
truth or path adjacency as sufficient authority. Resolution and linting do not
by themselves prove Work Lane effects, Git CAS, or independent verification.

**AgentSpec.** The
[session implementation](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/session.py)
records branch/worktree writer leases and permitted task paths;
[source checks](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/source_registry.py)
compare current content hashes with accepted snapshots and may stage a changed
candidate. Those are concrete mechanisms, not just README language. The
[runner](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/runner.py)
terminates the direct child on timeout, not an observed process tree; the
inspected session and runner contracts did not demonstrate object-scoped Git
compare-and-swap or an ETHOS-style Attestation. The tagged source contains
25,278 product-Python lines and 21,108 test-Python lines by tracked-file `wc`
(603 test methods); these mechanical counts are not a quality score. **Borrow
only** accepted-source drift and bounded handoff evidence where a real ETHOS
consumer needs them; **reject** a copied task ledger, run-state store, or second
command plane.

**SpecRoute.** Its [README](https://github.com/Enovatr-Labs/SpecRoute/blob/abc4c482da117c654b414517e68074ad643a950e/README.md)
explicitly describes a content repository. Requirement IDs, design `Satisfies`
links, and task/test back-references can make traceability readable, but its
[Codex post-edit hook](https://github.com/Enovatr-Labs/SpecRoute/blob/abc4c482da117c654b414517e68074ad643a950e/hooks/codex/scripts/post-edit-frontmatter.sh)
states that it warns and never blocks. **Adopt** the compact back-reference
notation only where it improves existing ETHOS intent-to-proof navigation;
**reject** a copied vendor-template workflow as a governance or quality gate.

Implementation quality cannot be ranked by repository size. The inspected
[SpecDD CLI package](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/package.json)
has TypeScript typecheck and co-located resolver/linter tests;
[AgentSpec release CI](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/.github/workflows/release.yml)
runs pytest, mypy, and pylint, while its
[Pylint policy](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/pyproject.toml)
disables several complexity rules. The inspected SpecRoute workflows validate
links and wiki parity, not the behavioral truth of copied vendor guidance. No
upstream test suite was executed in this review, so these are source-quality
signals and limitations, not a comparative pass rate or security verdict.

### COMET and ETHOS implementation-quality evidence (2026-09-24)

At exact COMET `0.4.1` source commit `9c6a89857f8ce33c12b9abcc1230bd1076de8068`,
the [package scripts](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/package.json)
declare build, generated-runtime freshness, format, lint, coverage, package
installation, and benchmark commands; [TypeScript is strict](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/tsconfig.json).
The [CI workflow](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/.github/workflows/ci.yml)
declares Linux, macOS, and Windows runtime and package-install journeys;
[security](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/.github/workflows/security.yml)
and evaluation workflows are separate. These are real implemented gates, not
README-only claims. The [Vitest policy](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/vitest.config.ts)
sets branch coverage to 75% and lines, statements, and functions to 80% over
selected TypeScript sources, excluding generated classic-runtime behavior from
that coverage set; the [ESLint scope](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/eslint.config.js)
excludes scripts and dashboard web. Its [project-specific architecture checker](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/scripts/lint/architecture.mjs)
is a substantial maintenance surface, not by itself a defect.

At ETHOS source commit `e534b5a9c7906ea865bf2b82b378eea90059c200`,
the [coverage policy](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/.config/checks/coverage/policy.toml)
requires a 95% hard floor with branch coverage for `src/ethos`, and the
[GitHub CI source](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/.github/workflows/ci.yml)
declares native host conformance on Linux, macOS, and Windows across Python
3.12-3.14. Its [independent-receipt admission](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/src/ethos/adapters/admission/evidence/external.py)
and governed Git effects address different trust predicates from COMET's agent
runtime and evaluation loops. A higher numerical coverage floor does not prove
that every ETHOS behavior or user journey is superior.

No complete upstream COMET suite, ETHOS full suite, or hosted run was executed
for this comparison. The sources establish declared checks and selected
implementations, not comparative pass rates, security certification, or a
unit-code semantic-density ranking. For ETHOS's repository-governance purpose,
retain exact proof, CAS, and Attestation ownership; borrow COMET's observed
checkpoint, recovery, and evaluation ideas only through a named failing
consumer and the existing owner. Neither product globally subsumes the other.

The shared invariant is not a file format: accepted meaning must be selected
with reasons and provenance, execution must remain under one source owner, and
observations must not promote themselves to authorization. Revisit these choices
only after a named greenfield, brownfield, cooperative or competing Work Lane,
reasoned drop, or feedback-to-intent consumer produces a failing counterexample.
