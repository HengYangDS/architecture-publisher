# Tasks

This is the sole progress ledger. The six written delta specifications were
approved on 2026-09-24; the plan below was approved on 2026-09-24 for
single-writer execution. Preserve historical signed releases byte-for-byte and
valid v1 protocol meanings. One owned Publisher Work Lane and one writer execute
this plan. ETHOS and AIGW retain separate source-side authority.

Each implementation task starts with a failing focused contract test, then the
smallest owner-level change and focused GREEN. Audit sibling consumers and run
applicable static and package checks per coherent slice; run the full behavior
and coverage gate at bounded integration milestones, after a contradictory
finding, and on the final frozen candidate rather than repeating an already
known branch-floor failure after every partial step. Inspect the exact diff,
make a signed commit, and verify a clean tree. The operator approved doing the
replacement inside this isolated Lane before converging the already-expanded
coverage gate. An interim coverage failure remains red, is recorded rather than
waived, and forbids integration or publication. Before the final candidate is
frozen, `npm run check` must pass with statements, lines, branches, and functions
each at least 95% across owned runtime code, including Publisher renderers and
`editions/self/src/`, not only `packages/publisher/src/`. Explicitly exclude
third-party or generated supply rather than moving owned code outside coverage.

## 0. Admission

- [x] 0.1 Review the proposal, design, and six delta specifications; user
      approval admits planning only.
- [x] 0.2 Repair the stale Provider-guidance test without restoring obsolete
      AIGW wording. Signed source `5b5dba5` passed the focused 5/5 test and full
      `npm run check` (615 pass, 2 skip; configured `src/` coverage
      96.47/96.47/95.10/99.44%).
- [x] 0.3 Obtain review of this written implementation plan before product
      implementation; execution remains single-writer as already selected.

## 1. Mechanism selection

- [x] 1.1 Freeze exact source revisions, reader questions, declared limits,
      current accepted media, and hashes for Publisher self, ETHOS terminal, full
      AIGW and its separate Client Projection, and native di-effect LikeC4. Treat
      a whole-AIGW Edition as a proposed editorial workload, not an existing
      accepted publication. Keep adopter inputs read-only; record the inventory in
      `docs/research/mechanism-evaluation.md`.
- [x] 1.2 Run bounded feasibility probes, not four complete competing product
      builds, for direct mature-tool use, a thin evidence wrapper, and the
      Publisher workbench. Freeze inputs, reader questions, candidate versions,
      stop conditions, and measured versus estimated effort. Exercise LikeC4,
      Structurizr, D2, Archify, and layout/raster/browser tools only at their
      actual boundary; stop a candidate on a decisive hard mismatch. Select one
      owner per mechanism using semantic loss, source/edition effort, offline
      viability, accessibility, license, upgrade, and exit cost. Full four-workload
      product acceptance remains Task 7.1 and 7.5. If direct use passes all hard
      gates at lower cost, revise this plan and shrink Publisher first.
- [x] 1.3 Lock the expanded `test:coverage` scope before product changes:
      at baseline, `packages/publisher/src/` had 50 tracked modules, Publisher
      renderers 17 first-party modules, and `editions/self/src/` 13 modules.
      Task 2.1 adds two handwritten Publisher modules to coverage and one
      reproducible generated validator exclusion. The other exclusion remains
      28 third-party/generated renderer supply modules. The package script,
      `tests/quality-contract.test.mjs`, and `docs/reference/operations.md`
      record and police this inventory. The
      four-dimensional 95% convergence remains a hard Task 7.5 prerequisite,
      not an achieved result of this task.

## 2. Versioned authoring and input

- [x] 2.1 Add strict `architecture.build-request/v1` and
      `architecture.edition-project/v1` schemas under
      `packages/publisher/src/edition/`, with RED/GREEN tests in
      `tests/build-request-contract.test.mjs` and
      `tests/edition-project-contract.test.mjs`. Select exactly one Edition root,
      named roles, namespaces, revision evidence, questions, omissions,
      media, and visual policy; reject unknown fields and
      conflicting editorial roots. Keep `archpub edition build` as the one entry.
      The reviewed schemas and self-contained generated validators have focused
      RED/GREEN, package, cold offline installation, and static evidence. This
      task does not claim that the old CLI yet consumes the new request;
      materialization and joining follow in Tasks 2.2–3.1. Exact selected-media
      coverage remains Task 5.1, not a property of standalone validation.
      The closing full run passed 676 tests, skipped 2, and failed only the
      unchanged 95% branch gate at 93.27%; the Lane remains ineligible to land.
- [x] 2.2 Implement content-bound materialization and a generated
      `architecture.materialized-input-lock/v1`
      under `packages/publisher/src/source/`. In
      `tests/source-materialization.test.mjs`, prove mutable locator changes create
      new identity without carrying acceptance, pins fail on changed bytes,
      exact inputs relocate offline, and an unresolved selected VCS ref never
      falls back to HEAD. Ruling: this task seals selected roots and does not
      invent change-specific obligations before the native and Edition
      dependency graph exists; Task 4.3 derives those obligations and Task 6.1
      binds them to exact Candidates. The materialization result reports
      `selected-roots-only` and names unchecked dependencies rather than claiming
      full closure in the semantic lock, which remains Task 2.4. Focused tests passed 32/32 across
      authoring, self-hosted compatibility, and materialization. Static and
      package checks passed. This slice's full check passed 691 tests, skipped 2,
      and failed only the branch coverage gate at 92.84%; integration and
      publication remain forbidden.
- [x] 2.3 Test typed content/VCS/opaque revisions and separate byte digests in
      `tests/source-revision.test.mjs`. Verify content revisions from declared
      canonical inputs, VCS only when claimed, and unverified VCS provenance as an
      explicit limit on independently pinned bytes; never treat a hash-shaped
      content revision as a Git commit. The selected-root revision evidence now
      records explicit recomputation, checked Git commit/blob, or attributed-only
      status separately from the raw-byte SHA-256. `publisher-json/v1` requires
      canonical UTF-8 JSON with at most one terminal LF; the default
      `raw-bytes/v1` keeps earlier valid Build Requests valid. This does not
      assert native dependency closure or source endorsement. Independent
      read-only review found no confirmed P1/P2 defect. Focused tests passed
      24/24; static and package checks passed. This slice's full check passed 694
      tests, skipped 2, and failed only the branch coverage gate at 92.91%; no
      integration or publication is admitted.
- [ ] 2.4 Bind selected source, Edition, resource, and upstream adapter identity
      in the input lock; bind checked parser, backend, font, renderer, and
      Publisher implementation supplies in the Candidate after consumption.
      `tests/input-closure.test.mjs` distinguishes observed, checked-declared,
      merely declared, unresolved, and ambient dependencies. Do not equate a
      Provider declaration with hermetic preparation. Ruling: this task cannot
      truthfully close before the native adapter, qualified toolchain, and
      selected renderers exist in Tasks 4.1 and 5.2–5.4. The current partial
      slice binds the explicit Edition visual-policy override as materializer-
      observed bytes, including relocation and missing/symlink rejection. Its
      logical resource reference and digest are in the semantic lock;
      a lock-bound read-evidence record names the actual file-read method.
      `selected-roots-only`, the concurrent path-mutation limit, and named
      dependency limits remain outside that identity. Do not promote a
      toolchain profile slug or Provider declaration into observed backend or
      hermetic evidence. A native capability-bound reader is deferred absent a
      named hostile-mutator consumer and acceptance predicate; it is not a
      prerequisite for this task. The focused 20/20 tests, static and package
      checks passed; the full check passed 697 tests, skipped 2, and failed only
      branch coverage at 92.93%. Resume complete closure at its actual consumers,
      then close this task before Candidate qualification and protected publication.
      The later reviewed slice corrected the lock/Candidate stage boundary and
      added a generated, selected media-stage Publisher file-set identity with
      an installed manifest pin and byte checks. README and unselected-medium
      changes do not alter that identity; selected-file drift or a missing
      manifest member fails. The next slice also binds an independent semantic
      compiler file set and typed evidence basis/method for selected supplies.
      The complete installed package tree is build/replay execution evidence,
      not Candidate identity or original-builder attestation. The v2
      qualification report excludes it: publication admission must rederive
      exact report fields without trusting a self-reported package claim.
      Relocation, package-only change, and during-build drift counterexamples
      are covered.
      A packed offline-installed package test compares the npm member
      inventory with the current package tree and verifies identity after
      relocation.
      Keep this task open until the native adapter and media tasks complete
      their acceptance; archive selection and builder provenance belong to
      the designated accepter's publication policy.
- [x] 2.5 Replay exact Source Bundle v1, Claim Model v2, Edition v1,
      Provider v1, Candidate v1, and Qualification Set v1 meanings in source
      tests and a packed, offline-installed work-lane package. The frozen hash
      sets in `tests/fixtures/historical-release.mjs` serve both journeys.
      The installed consumer uses only public package exports, empty user
      configuration and a PATH with no commands. It retains the selected
      historical digests and rejects a tampered Candidate binding. The
      separate installed v1 executable Provider journey also remains green.
      Legacy `authoredInputSha256` changes identity without establishing
      authoring-byte consumption; Task 6.1 must bind actual successor media
      inputs separately. The alpha.3 evidence asset is not independently
      signed, though its release manifest names the verified signed tag.
      Focused migration and installed tests passed 9/9; static, package and
      strict OpenSpec checks passed. The full run passed 747 tests, skipped 2,
      but branch coverage remains 93.06% against 95%; no landing or release
      is admitted by this task alone.

- [x] 2.6 Remove duplicate source-assertion and reading-order authorship from
      the unreleased Edition Project without a compatibility facade. Derive
      same-ID source assertions from selected questions; context-only remains
      an editorial dependency, not false coverage. Focused regressions cover omission
      liveness, two-question scope, ID collision, retargeted-basis review,
      author-input immutability and both public media's editorial attribution.
      Packed offline relocation and immutable historical v1 replay passed in
      the 1,033-test run (1,028 pass, five skips); static, strict OpenSpec and
      package gates passed. AIGW's four-question/five-group authoring probe
      removes 22 duplicate records, not its mixed-media limitation. Branch
      coverage is 92.95% < 95%; Tasks 5.2, 5.4 and 7.5 still block release.

- [x] 2.7 Remove the unreleased Edition Project's query and transformation
      authoring fields until executable, versioned consumers exist. Reject
      them at validation; retain exact references and attributed editorial
      assertions without a compatibility facade. Medium-local presentation
      intent is optional rather than mandatory inert authoring; when present,
      evolution still detects its change. The optionality test failed before
      the schema change and passed afterward; a paired-media build succeeds
      without either note. The full 1,048-test run has 1,043 passes, five
      skips and no behavior failures; static, strict OpenSpec and package
      checks pass. Branch coverage is 92.89% < 95%, so release remains held.

## 3. Provider convergence

- [ ] 3.1 Extend `packages/publisher/src/provider/` with
      `architecture.edition-provider/v2` and the existing build route so direct,
      declarative, and executable selections yield one closed
      native/authored/derived input envelope before compilation.
      `tests/edition-provider-contract.test.mjs` rejects ambiguous mode/root,
      missing ancestry, unselected bytes, and later-stage authority claims;
      multi-source claimants remain distinct. Partial: the v2 contract, strict
      selected-byte readers, one manifest verification per join, shared lock
      sealer, executable supervision, Edition resource binding, and globally
      distinct native/derived namespaces are implemented. Provider-local IDs
      and invocation receipts do not alter selected semantic identity. The
      module-boundary gate excludes a second command plane and version-suffixed
      implementation filenames. Historical v1 inputs retain their meaning
      until Task 7.2 proves replacement parity. Open: the reproduced
      concurrent-ancestor-mutation race leaves path confinement unproved; it
      remains an explicit limit, not a hidden native-reader prerequisite.
      Complete dependency closure, installed successor conformance, and the
      unchanged 95% coverage gate remain release blockers. Exact race evidence
      and alternatives belong to `docs/research/mechanism-evaluation.md`, not a
      copied progress history here.
- [ ] 3.2 Reuse the bounded process-tree supervisor for one exact selected
      executable entry. `tests/edition-provider-executable.test.mjs` and
      `tests/edition-provider-installed.test.mjs` cover complete package-content
      digest, sanitized configuration, size/path limits, relocation, offline use,
      ambient-checkout noninterference, and allowed public imports. State clearly
      that supervision is not a filesystem/network/credential sandbox. Partial
      successor evidence: `tests/provider-installed-selection.test.mjs` packs
      Publisher and an executable Provider, installs both offline in an isolated
      consumer, imports Publisher's declared public semantic contract, and
      materializes the selected lock with empty user configuration and a PATH
      containing no commands.
      Adjacent decoy directories do not change it; after copying the installed
      product and deleting the original temporary tree, the selected lock and
      bytes remain identical. At signed source `3fa59e2`, the executable,
      worker-lifetime, installed-selection and installed-replay suites pass
      50/50 on macOS arm64 Node 26.10 and on isolated, offline Linux arm64
      Node 26.9 and 24.19. The Linux harness uses an init process to reap
      exited descendants; without it, the PID-liveness assertion failed, so
      that failure is not silently dismissed as a product defect or proof.
      A current macOS offline-installed Core and executable Provider now build
      one complete static/interactive Candidate through the public CLI with
      empty user configuration and a PATH containing no commands; its exact
      input lock and three artifact members are checked. This remains
      source-lane, not released-package evidence. Provisional native Windows
      ARM64 runs from signed Lane commits pass historical-v1 installed replay
      2/2, successor-v2 selected input 1/1, and a full installed executable-
      Provider static/interactive Candidate 1/1. All runs select the same
      Publisher package source tree; exact archive and read-back log digests
      are in `conformance/evidence/windows-provider-installed-probe.json`.
      At signed `4a91a79`, six Provider and process-tree test files ran from
      one SHA-256-checked source archive on native Windows ARM64: 54 pass, nine
      platform-inapplicable skips, zero fail. Every guest log hash matched its
      host readback; guest scratch was removed and VM isolation restored.
      The provisional receipt is `build/test-work/windows-native-4a91a79/probe-receipt.json`.
      Pipeline `8550` passed on the same source. Complete dependency observation,
      final frozen-package Windows qualification, and release acceptance remain open.
      Pipeline `8551` on signed `153b0d0` exposed one Linux failure: a Worker
      posted its reply before its asynchronous stderr reached the supervising
      process, so a Provider diagnostic could be missed. A controlled delayed
      stderr test failed before repair and passes after the Worker waits for
      exit and stderr-stream end before replying. The canonical Provider fixture
      remains byte-identical; the adversarial package is created only in test
      scratch. The affected 41 conformance and installed tests pass, as do 100
      Linux Node 26.9 coverage-mode repetitions of the stderr cases. The local
      full check passes 1,263 tests with eight declared skips, no failures, and
      97.96/95.07/99.53/97.96% statements/branches/functions/lines. Pipeline
      `8556` on signed `e6be1af` passed 1,254 tests, 17 declared skips, zero
      failures, and Linux coverage 97.28/95.11/99.19/97.28% in the same order.
      Two affected files then ran from a SHA-256-checked archive of that exact
      commit on native Windows ARM64: 43 pass, seven platform-inapplicable
      skips, zero fail; both guest log hashes matched host readback. The guest
      scratch was removed, VM isolation restored to its original value, and
      the VM remained running. The provisional receipt is
      `build/test-work/windows-native-e6be1af/probe-receipt.json`. Final frozen-
      package and full-platform release qualification remain open.
- [x] 3.3 Prove identical selected-input lock identity and distinct invocation
      receipts across direct, declarative, executable, and mixed selections in
      `tests/provider-join.test.mjs`, the sole successor cross-mode fixture.
      Keep `tests/edition-provider-conformance.test.mjs` for the historical v1
      profile rather than duplicating that fixture. The module-boundary gate
      rejects Provider imports of renderer, browser, qualification,
      publication, or governance code and rejects case-insensitive adopter
      literals in generic source without treating comments as dependencies.
      The focused cross-mode and boundary suite passed 23/23. Static checks,
      OpenSpec validation, and package validation passed; the full behavior
      run passed 746 tests, skipped 2, but branch coverage remains 93.06%
      against 95%. This task proves selected-input equivalence only, not
      installed successor qualification or permission to integrate or publish.
      `tests/provider-candidate-equivalence.test.mjs` additionally proves that
      equal selected locks and semantic digests do not authorize Candidate
      equivalence: direct/declarative fixture media match, while executable
      dependency limits change the scene identities disclosed in its Candidate.
- [x] 3.4 Exercise local, non-authorizing diagnostics at the successor v2
      selected-input and Edition boundaries. Any returned finding binds its
      exact selected subject, predicate, responsible role, and declared owner
      or explicitly unresolved ownership. Distinguish source assertion,
      editorial choice, adapter, and protocol gaps in the relevant v2 tests;
      return findings to the invoker without dispatch, issue creation, source
      writes, or inferred recipients. The invoker controls handoff and the
      affected owner controls adoption. Prove conformance cannot retire a
      predecessor: retirement requires exact consumer parity or a reviewed
      semantic successor, explicit incumbent-owner approval, and preserved
      historical receipts. Keep `tests/edition-provider-conformance.test.mjs`
      on the historical v1 profile; do not add a feedback store, registry,
      command plane, or source-governance adapter. Public v2 tests now bind
      protocol, native-claimant, derived-projection, and Edition-editor findings
      to exact selected subjects and return them without a Candidate or source
      mutation. Passing materialization preserves an incumbent and grants no
      retirement authority; source-owned retirement remains Task 8.1/8.2.
      `npm run check` passed 1,262/1,265 tests with three declared skips,
      95.06% branch coverage, and 17/17 strict OpenSpec validation. Exact-HEAD
      proof and hosted CI refresh follow the signed commit, not this checkbox.

## 4. Native semantics and conservative change

- [ ] 4.1 Add an admitted LikeC4 native adapter under
      `packages/publisher/src/semantics/` and test exact source/include binding,
      supported constructs, source references, typed relation fields, and explicit
      loss in `tests/native-import.test.mjs`. The derived index is disposable, not
      an editable duplicate Claim Model. Partial: locked bytes, parsed document
      set, source locations, cross-source references, and selected `include *`
      membership are checked; dynamic views and metadata remain source-bound
      but opaque. The reproducible optional parser supply binds generated bytes,
      locked package identities, and notices. Public import verifies installed
      inventory, copies the exact verified parser bytes privately, and passes
      selected source bytes to a bounded worker through an inherited descriptor.
      A neutral process-tree lifecycle serves Provider and native parsing without
      sharing their protocols. The worker has a self-expiry timer and restricted
      Node file reads as defense in depth; neither is a sandbox or complete-read
      proof. The parent validates the returned index shape, selected identities,
      essential uncertainty limits, unique view membership, and consumed supply
      digest. The installed macOS package test demonstrates
      that replacing the original parser after verification cannot change the
      private copy's result. Focused native and boundary tests pass 56/56;
      static, strict OpenSpec, and package checks pass. Full behavior passes
      811 tests, skips 2; branch coverage remains 93.00% against the 95% gate.
      A networkless, read-only Linux Node 26.9 container installed the packed
      package offline and parsed a two-element fixture through its public export;
      the same path also passed in Linux Node 24.19. These are installed smoke
      tests, not the full Linux conformance matrix or current-HEAD final release
      evidence.
      The public importer also parsed frozen di-effect commit `8a168b6b` into
      25 elements, 35 relations, three authored views, and one generated view
      from the three hash-checked native files. Open: complete read closure,
      full include/query semantics, Linux full conformance and Windows native
      installation, visible semantic coverage, formal supply admission, and
      the final coverage gate. The di-effect and supply probes and limits are in
      `docs/research/mechanism-evaluation.md`. No Adapter package or second
      command plane was introduced.
- [ ] 4.2 In `tests/native-identity.test.mjs` and
      `tests/native-semantics.test.mjs`, cover same-label distinct namespaces,
      relocation/generated-ID drift, duplicate relations, explicit lineage,
      opaque constructs, self-contradictions, and visibly distinct target/current
      disagreement. No transitive, universal, causal, or authority inference from
      weaker relations or graphic appearance. Partial: a LikeC4-specific,
      source-bound reference resolver distinguishes `element`, `relation`, and
      authored structural `view` references; equal labels remain distinct, selected
      relations use one-based source locations rather than volatile parser IDs,
      retain typed fields and only their endpoints, and computed view membership
      retains its qualification limit. Missing visible endpoints and
      unknown/generated/dynamic/query references fail closed. Focused RED/GREEN,
      parser-run drift, duplicate-relation, and endpoint-counterexample tests
      passed 7/7. Static, strict OpenSpec, and package checks pass. Full
      behavior passes 818 tests, skips 2; branch coverage remains 92.88%
      against the 95% gate. Lineage, contradictions, and target/current
      presentation remain open.
      The compiler now consumes the locked Edition bytes and selected LikeC4
      sources through the admitted parser, resolves every declared source-bound
      reference, and derives native semantic identity from normalized selections,
      not parser-run relation IDs or the whole Edition/toolchain lock. Narrative,
      visual-policy, and toolchain-only changes retain that native digest while
      changing the input lock.
      It rejects even unreferenced unsupported input formats rather than
      silently dropping part of the selected scope. It reports parser supply
      and incomplete closure separately. Five focused tests pass; the new
      compiler module has 96.29% branch coverage, while the full 825-pass,
      two-skip run remains below the global branch gate at 92.90%. Static and
      package checks pass. This is not yet the CLI Candidate path:
      source-backed assertion coverage, media, and qualification remain open.
      Additional native-boundary counterexamples reject malformed parser replies,
      supplies, selections, and source-qualified references. Relation locator
      bounds are checked before converting one-based positions, preventing an
      overflowed decimal from rounding into an apparently safe zero-based index.
      Two public-build counterexamples now retain intended-versus-implemented
      disagreement and equal native claim IDs from distinct source claimants
      as separate, attributed claims in both emitted media. This establishes
      structural and rendered-text preservation, not source truth, human
      adequacy, explicit lineage, or full conflict presentation.
- [ ] 4.3 Extend `packages/publisher/src/semantics/change.mjs` and
      `packages/publisher/src/edition/evolution.mjs`;
      `tests/native-evolution.test.mjs` must detect
      changed qualifiers without cardinality change, selector membership, indirect
      claim dependencies, unknown read sets, and packaging-only changes. Report
      rebuild, semantic, media, human, acceptance, and publication obligations
      separately; do not transfer old approval automatically.
      Partial: the existing `archpub evolution plan` route preserves Claim Model
      v2 comparison and accepts exact native Build Request pairs. Change facts
      separate source bytes, attribution, selected meaning, supply, and unknowns;
      Edition impact separates six non-authorizing obligation classes. Ruling:
      source-location relation IDs do not prove cross-revision correspondence;
      locator and same-lock native-output drift remain explicit unknowns. Media
      addition/removal and page withdrawal avoid repainting unaffected media;
      four independently found question-scope and same-lock-media counterexamples
      have RED/GREEN regressions. Digest-pinned declarative Providers now compare
      through the same owner; executable delivery is rejected before execution.
      A parser-supply-only replacement with unchanged source meaning still
      renews media and acceptance; Provider package-only evidence remains open.
      A provisional npm-offline macOS package reproduces relocated direct and
      declarative comparison and rejects changed pins, but is not frozen release
      or Linux/Windows proof. Claim Model native and derived selections now
      enter the same delta owner. Typed claim, entity, relation, and predicate
      changes trigger existing obligations; changed derived bytes or bindings
      and incomplete dependencies remain explicit uncertainty. New adversarial
      tests reject ambiguous source/selection identity and distinguish source,
      projection, supply, output, and dependency-closure changes without
      inventing approval. The 44 focused tests and static/spec checks pass;
      isolated `semantics/change.mjs` branch coverage is 178/185 (96.21%),
      not the global gate in Task 7.5. The successor comparison now accepts
      caller-owned, exact executable Provider choices separately for before and
      after; the comparison plan cannot grant them. Both sides' selected
      requests, direct/declarative bytes, Provider manifests, executable
      packages, and declared inputs are prepared before either Provider runs.
      RED/GREEN rejects an absent after-side choice and a changed after-side
      input without executing the before-side Provider; a public CLI test
      compares two selected executable sides. The affected 85 focused tests
      pass. `npm run check` passes with 97.95% statements/lines, 95.05%
      branches, and 99.53% functions; strict OpenSpec validates 17/17 and
      publint passes. This is source-Lane evidence, not a frozen package,
      exact-HEAD proof, hosted CI, or Provider sandbox. A further RED/GREEN
      now distinguishes checked executable Provider package-content changes
      from an unchanged source lock and native meaning. It reports exact
      before/after package identities under `delta.execution`, renews all
      selected-question semantic verification and acceptance/publication
      obligations, but creates no media redraw or human visual review from
      package bytes alone. Relocation with unchanged package bytes remains a
      no-op; malformed or duplicate execution evidence fails. The packed,
      offline-installed public CLI reproduces the package-only classification
      after relocation. The local full check passes 1,266 tests, eight declared
      skips and zero failures, with 97.97/95.04/99.53/97.97% statements,
      branches, functions and lines. Signed `2439d7e` passed exact-HEAD ETHOS
      proof under Attestation
      `a63501a728ef15f4bf39e31eb7a0917576217963513bef94d02508d0e4602288`;
      Pipeline `8557` passed on the same source with 1,257 tests, 17 declared
      skips, zero failures and Linux
      coverage 97.29/95.07/99.19/97.29% in that order. Local `candidate/dev`
      and the sole remote proposal now select that commit. These are source
      readiness, not final frozen-package or adopter acceptance. Full-model
      dependency precision, final installed-platform parity and Task 7.5
      release acceptance remain open.
      The unreleased v3 now names changed Candidate inputs as
      `edition-candidate` and its single HTML output as
      `interactive-document`. A Provider package-only replacement with
      byte-identical selected lock, Candidate, and media requires no rebuild;
      semantic verification, acceptance, and publication still renew.
      Historical v1 target names are unchanged. The 78 related tests and full
      `npm run check` pass, including all four unchanged 95% coverage gates.
      Final package and adopter acceptance remain open.

## 5. Editorial composition and independent media

- [ ] 5.1 Materialize finite required assertions for each reader question and
      medium before layout. Join the Build Request and Edition Project: a
      promised question or required assertion present only in an unrequested
      medium cannot count as selected-media coverage.
      `tests/edition-selection.test.mjs` covers explicit
      exclusions, limits, editorial propositions, allowed/forbidden aggregates,
      `some-member` versus `all-member`, and conflict views. Unclassified omission
      or source-contradictory wording fails; complete means complete for the
      declared question, not an exhaustive raw graph.
      Partial: ordered, medium-local views are the sole authored question
      inventory; omissions must resolve to a declared source view and, for
      covered-elsewhere, a non-omitting same-medium target asking that question.
      The selected Edition derives frozen per-view question, assertion, and
      explicit-limit IDs, then unions these for each requested medium without
      transferring an omission across views or media. Unrequested-only and
      unanswered view questions fail. Focused, static, and package checks pass.
      An additional RED/GREEN preserves exact scope- and omission-limit reasons
      at each view/question, without transferring a limit between media. The
      seven focused tests pass. A single Edition meaning projection now joins
      locked source selections to source-attributed and explicitly unverified
      editorial assertions, with medium-local question and limit obligations.
      Unadmitted authored transformations fail at input rather than minting stronger claims;
      editorial assertions in one medium do not impose a global limit on the
      other. Its five focused tests pass and the new module has 100% branch
      coverage. The native selection stage remains internal; the package exposes
      one Edition meaning entry rather than two public compiler phases. Static
      and package checks pass. A packed, offline-installed public consumer
      reproduced the same Edition meaning after relocation and rejected changed
      pinned bytes under an empty user environment; this is installed semantic
      preparation, not installed Candidate acceptance. The full run passes 831
      tests, skips 2, but global branch coverage remains 92.93% against 95%. No
      Candidate, visible carrier, or acceptance is claimed. Native view
      membership qualification, aggregation, contradictions, and reader
      adequacy remain open.
- [ ] 5.2 Deliver an explainable neutral source-to-media composition without
      duplicate editable facts, authored pixels, or a second layout engine.
      Exact selected references, reader questions, group membership, typed
      qualifiers, source identity and visible limits must survive both media;
      infeasible composition fails instead of silently narrowing meaning.
      Partial: the public build compiles selected LikeC4 and Claim Model inputs
      into sibling media. The grouped compositor carries source-bound relations,
      relation-dependent and scalar claims, claimant-declared validity, and
      private graphic bindings. Focused tests reject lost or forged carriers;
      browser regression restores graph geometry after viewport round trips.
      A RED/GREEN now prevents a source claim from shrinking an unchanged graph.
      Ruling: on exact AIGW source at `bd3c09d5`, the old interactive
      breadth-first route painted Boundary at 3.78 CSS pixels and Client
      Projection Overview at 8.46 CSS pixels at 1280×720. Compact spacing alone
      caused node overlap, so the Work Lane now computes neutral geometry from
      exact selected public page data with pinned Dagre 3.1.1; Cytoscape owns
      interaction only. Edge ordinals lead to complete adjacent source-relation
      text, and CSS reserves each page's geometry-bounded height before graph
      startup. Verified UMD bytes run in a bounded Node VM as a loader, not a
      security sandbox. This replaces the prior special-chain layout without
      changing source meaning
      or static geometry; if cross-workload qualification reverses the choice,
      only the renderer geometry and affected media review must change.
      A generic 7-node/6-relation browser test failed at 3.78px before the
      repair and passes above 12px without node overlap; cycle and parallel-edge
      geometry remains stable. The current AIGW
      source-adjacent whole-product pages paint at 14.34–16px and its Client
      Projection pages at 16px at 1280×720, with zero node-body overlaps or
      horizontal overflow; both static SVGs remain byte-identical. The packed
      offline installed renderer relocates and rejects altered Dagre or
      Cytoscape bytes. The grouped interactive slice now carries only its own
      Edition-authored partition through Scene, neutral geometry, visible
      compound nodes, and private graphic bindings. The final coverage join
      rejects lost, relabeled, or forged grouping. A public dual-medium
      counterexample now builds one static overview beside a separately selected
      interactive chapter with grouped and upstream static geometry. The sole
      context view still works; competing or unattributed source views still
      fail rather than being chosen silently. The 72 runnable focused tests,
      static/spec/package checks, and the earlier Chrome regression pass.
      Task 7.5 owns the still-failing global 95% branch gate. AIGW has not
      authored interactive groups; static groups are not inferred.
      The selected data-only refinement now names every requested medium and
      permits an explicit neutral sibling without silent fallback. An authored
      Scene now binds only its own medium decision, not a sibling's data. A
      measured mixed-static compositor selects the shorter feasible claim
      placement without collapsing a dense two-column card. The exact locally
      packed source at signed `e97e87c` (archive SHA-256
      `f6281e2ff40fcca7b2be4e1a05af6f22a028075dbc4a0615038cd8485e5222bd`)
      rebuilt both copied AIGW-derived trials after offline installation and
      relocation: all six Candidate members matched direct public CLI bytes.
      On unchanged AIGW-derived trial inputs, the horizontal 3600px static
      image shortened from 1704 to 1292px and the two-row alternative from 2178
      to 2065px; source locks and interactive HTML remained byte-identical.
      Focused counterexamples
      preserve the old short-note layout and reject an infeasible candidate
      without losing a valid one. This is a mechanism probe, not AIGW source
      adoption or qualification. These trials reduce blank canvas, but reader
      text and overall art direction remain below flagship quality; AIGW
      editorial approval and final media review remain open.
      Publisher self, ETHOS and di-effect successor media, selected-media
      coverage, source/editor acceptance, final visual review, and predicate
      qualification remain open.
      Partial: ordered static views now compile into one source-bound figure
      from graph, relation, claim and limit parts, with separate carrier maps
      and common method notes factored once. A same-row route-through-node and
      group-heading/edge collision were reproduced and repaired. A subsequent
      visual review found four edge-segment contacts missed by the earlier
      text-only browser audit; that audit was not a whole-page collision
      verdict. The neutral grouped owner now separates inter-group corridors,
      rejects infeasible edge crossings, and retains room for on-graph labels.
      Fill-only groups, content-dependent geometry, and per-gap spacing reduce
      empty frames without widening unrelated gaps. On unchanged AIGW external
      trial input (`bfb1b6c6`), the direct Candidate at
      `build/review/aigw-two-view-trial/candidate-claim-ledger` has a
      3600×2357 PNG, down from 3600×2513; its SVG has zero edge-segment
      contacts versus four, preserves 64 visible text items, and has no
      measured text collision in Chrome 154. The interactive medium now flows
      unequal claim details in source order rather than stretching shorter
      cards to the longest card's height. Chrome 154 checked all six trial
      pages: no horizontal overflow, external request, script error or
      WCAG 2.1 A/AA violation. Direct and offline installed Candidates match
      all six members byte-for-byte. The full check passes 1217 tests with
      7 skips and 95.05% branch coverage; evidence is
      `build/review/aigw-two-view-trial/full-check-claim-ledger.log`,
      `claim-ledger-browser.json`, and `visual-audit-repair.json` for the
      byte-identical static media. This is not AIGW adoption, human approval
      or full qualification.
      Remaining: extend the measured Scene audit to the complete neutral page,
      rank feasible whole-page candidates and review visual mass/readability
      on the final selected media before Task 7.5 freeze.
      On the same locked AIGW two-view input, generic source relation verbs now
      sit beside their edges; only qualifier-bearing relations retain notes.
      Intrinsic group widths prevent a one-member group from inheriting an
      unrelated wide frame. The exact Candidate at
      `build/review/aigw-two-view-trial/candidate-intrinsic-current` replays;
      its 3600×2174 PNG retains the prior input-lock and interactive HTML bytes.
      Chrome 154 measured 62 SVG text elements, no text overlap and no sampled
      path/text contact within four SVG units; evidence is
      `build/review/aigw-two-view-trial/intrinsic-browser-audit.json`. This is
      not whole-page aesthetic acceptance. The full check passed 1232 tests,
      skipped 2 input-dependent tests, and reached 95.07% branch coverage.
      The separate `candidate-authored-overview` still fails human visual
      review; do not transplant its pixels into AIGW. Product-owned whole-page
      composition and final-media review remain open.
      Current neutral-static slice: the signed AIGW source `bdb77d55` adds a
      source-backed control-to-transaction relation. Publisher's compact Dagre
      placement now uses an exact-member reading key instead of floating group
      headings that visually reassigned members. Public CLI trials for Product
      and Client Projection are under
      `build/review/aigw-static-group-key-provisional-20260928/`, bound to request
      SHA-256 `ee7cf3c9` and `79fafbd8` respectively. Chrome 154 measured 67
      SVG text elements per figure, zero text overlaps, sampled path/text
      contacts, or text overflow at 1280 CSS pixels. Full tests pass 1,250
      with seven skips; branch coverage is 95.03%, and static/strict OpenSpec
      checks pass. The exact Product and Client HTML pass a ten-page Chrome
      structural/axe check at 1280×800 with no page errors, external requests,
      horizontal overflow, or WCAG A/AA findings; the provisional receipt is
      `build/review/aigw-static-group-key-provisional-20260928/interactive-browser-audit.json`.
      These observations are not final human visual approval or AIGW acceptance;
      Task 5.2 remains open. The reader subsequently rejected both AIGW static
      compositions, not only Product: the Product PNG at SHA-256
      `28e77aa47b610705a7e9843ecd04064559503f87a77e2c4630f5a08fda129a6a`
      and Client Projection PNG at SHA-256
      `965f5a81ca2974edafbf1fcd8f7f22da4b9f39e952a1238f0edd7597644db9d8`
      (built from AIGW `b1f4d212`) both have reported overlap, excessive blank
      area, and weak whole-page composition. Passing sampled collision checks
      does not override this visual failure. Rework the shared neutral figure
      composition and source-owned static art direction as distinct
      responsibilities. The neutral width and side-rail probes did not solve
      whole-page hierarchy; use the selected whole-medium authored scene
      contract where neutral geometry cannot meet the reader question. Do not
      accept or publish either AIGW static Candidate or treat the current AIGW
      Edition as visually accepted. Publisher's public build now accepts one
      data-only authored static canvas across ordered views, retains per-view
      assertion attribution, and derives exact selected relation endpoints without
      duplicate entity selections. The unrelated Claim Model public-build and
      negative-boundary test pass; `npm run check` passed 1,250 tests with seven
      skips and 95.05% branch coverage (all four dimensions above 95%). This
      is a generic contract and does not change the rejected AIGW media or
      substitute for AIGW-authored static art and exact-byte visual acceptance.
- [ ] 5.3 Compile static SVG/selected-width PNG and standalone interactive
      HTML from separate scene owners. `tests/dual-medium-contract.test.mjs`
      proves shared selected claim identities but independent geometry, DOM,
      artifact identity, and review. A 6000px ETHOS choice is honored without an
      adopter-name default; another Edition may choose a different bounded width.
      If either required medium has a hard compile or render failure, no complete
      paired Candidate is emitted. Ruling: the successor Build Request selects
      meaning and media, while the same `archpub edition build` invocation
      requires `--output` for its fresh Candidate directory; historical v1 plans
      retain their authored output field and cannot be silently overridden.
      This avoids making a local effect location part of the semantic lock or
      adding a second build command. If wrong, only the unreleased successor
      invocation shape changes; no accepted v1 meaning is rewritten.
      Partial: the one build command now dispatches the successor Build Request
      to an unqualified Candidate v2 without changing historical v1 plans.
      Independent static and interactive Scenes produce source-bound SVG,
      Edition-selected-width PNG, and offline standalone HTML; source IDs stay
      outside HTML. Tests cover 6000px and 1800px choices, identical Candidate
      identity across fresh output locations, one-medium selection, later-medium
      failure without a complete output, immutable pins, and unsupported
      toolchain rejection. The existing packed-offline journey now exercises
      both LikeC4 and mixed Claim Model inputs through relocated sibling media
      and exact Candidate replay without a source repository or a second pack
      harness. The source-adjacent mixed Chrome check is Task 5.2, not packed-
      browser acceptance. The earlier neutral browser case passed offline and
      axe checks; final installed bytes still require Task 7.5.
      At signed source `3fa59e2`, the packed dual-medium journey passes 1/1
      on macOS arm64 Node 26.10 and offline Linux arm64 Node 26.9 and 24.19.
      Each run installs locally packed bytes, relocates without a source repo,
      builds LikeC4 and mixed Claim Model media, matches exact Candidate replay,
      and refuses admission under an incomplete named policy. This is not a
      released-package or final-adopter qualification.
      An installed public CLI regression now rejects missing selected input,
      removed Archify supply, and unselected extra supply with named diagnostics
      and no final HTML. A source renderer regression also rejects a missing
      output parent by name; this is failure attribution, not final renderer or
      browser qualification. Focused renderer and boundary tests, static,
      package and strict OpenSpec checks pass; the branch coverage
      deficit remains the Task 7.5 gate.
      Visible semantic coverage, human visual review, qualification binding,
      full platform evidence, and release remain open. The editor withdrew the
      device-specific reading target on 2026-09-29. Its alternate graph layout,
      automatic camera, active tests, and proposed requirement are removed;
      historical research observations do not become acceptance gates.
      A later reader counterexample found that `Source references` offered no
      source code, clipped its placeholder and covered the diagram. The single
      `Inspect` reading state now indexes selected subjects and records, labels
      source identity without a false code link, and returns keyboard focus;
      final exact-byte review remains Task 7.5.
      Page-level counterexamples showed that the compositor accepted external
      resource attributes, including image inputs and legacy backgrounds, and
      CSS image sets. Focused RED/GREEN rejects these declarations before
      Candidate emission while retaining supported inline data assets. The
      standalone shell adds a restrictive Content Security Policy as a browser
      backstop; blocked resource errors and rendered completeness remain
      separate browser qualifications.
- [ ] 5.4 `tests/visible-coverage.test.mjs` rejects missing endpoints, changed
      plane/condition, hidden-only IDs or metadata, incomplete interactive
      overviews, backend badges, and non-disclosed private inputs. Bind actually
      consumed authoring bytes, selected visual policy, renderer, font supply,
      dimensions, and final artifacts independently per medium. Infeasible layout
      returns for editorial regrouping rather than silently dropping meaning.
      Partial: static SVG exposes only opaque graphic IDs. Its private carrier
      map now binds each source-qualified node/relation and assertion to visible
      graphic IDs; the Candidate binds that map separately from interactive.
      Renderer-level RED/GREEN rejects hidden-only questions and limits in both
      media and unclaimed static graphics; static relation notes preserve
      bidirectional meaning. A compiler-level join now checks each selected
      assertion against its declared reader question, its Scene carrier, and
      renderer-private graphic binding for both media. RED/GREEN tests reject
      invented or swapped assertions, partial graphic binding, omitted editorial
      assertions, and a carrier map assigned to the wrong page; a covered-elsewhere
      view with an explicit limit remains valid. Independent review found no
      confirmed public-path defect or duplicated omission authority. This is a
      structural visibility check, not independent semantic qualification.
      A packed, offline, relocated mixed-model test keeps an unselected entity
      label and unselected claim value out of Candidate, SVG and HTML bytes;
      this is a selected-canary check, not general disclosure proof.
      On editorial-only pages, each visible limit now stays with its reader
      question instead of being flattened into an unattributed stage list.
      Mixed scalar counterexamples reject a missing subject link, a forged
      subject dependency, and claim-card structures that would otherwise raise
      an untyped exception. Compiler coverage reuses the one source-link
      derivation rather than maintaining a rival relation rule. New adversarial
      joins reject ambiguous question and graphic identities, borrowed claim
      cards, missing claim links, and invented relation-only claim links. The
      two focused files pass 62 tests with one declared browser skip; isolated
      `compiler/coverage.mjs` branch coverage is 192/198 (96.96%), not a global
      gate. The public authored-canvas build now rejects measured text/edge
      collisions, forged glyph boxes, and emitted path drift using the selected
      bundled fonts. A Chrome-enabled full check passes 1226 tests with 2 skips;
      all four coverage gates pass, including 95.07% branches. This does not
      qualify generic multi-view composition or final art. An isolated AIGW
      16-entity/14-relation overview remains an unadopted trial; source-owner
      and human visual acceptance remain open.
- [ ] 5.5 Keep the first-party self Edition on the same public Build Request,
      Edition Project, data-only refinement, and dual-medium compiler as other
      adopters. Preserve its source-owned meaning and flagship art direction;
      prove selected-meaning coverage, installed relocation, independent media,
      browser accessibility, and final-byte human visual acceptance. The signed
      pre-retirement commit `8742c49` and
      `conformance/evidence/self-migration-baseline.json` preserve exact old and
      public-build comparison hashes, not semantic or visual equivalence.
      Current: the self-only Candidate, Atlas, static flagship, and SVG builders
      and their displaced tests are deleted; current self claims now name the
      generic authored SVG renderer and interactive compositor. The installed
      self package authors portable inputs; packed Core builds both media after
      that package is removed. Its earlier eight-page Chrome and axe journey
      and self evolution test pass. The current self-Edition file passes 14
      runnable tests with one declared browser skip, including installed
      relocation and rejection of ambiguous selected input, core-package, and
      typography JSON before output. Static, package, and strict OpenSpec
      checks pass. The Core's old live Atlas composer has been
      replaced by the single interactive HTML contract under Task 7.2.
      The static evolution fork now connects affected views separately to
      rebuild/verification and review/acceptance/publication; the unsupported
      rebuild-to-review edge, orphan label, and compensating scope brace are
      absent. Exact relation bindings, analytic geometry, emitted SVG paths,
      installed dual-media build, eight-page Chrome/axe, and provisional 6000px
      PNG inspection pass. The 1280×720 installed-browser regression now checks
      that all eight pages keep visible text and nodes inside the stage; it does
      not certify typography or editorial quality. This is not final-byte human
      approval.
      At signed Publisher `78b65f9`, a fresh offline-installed self preview
      has the same static SVG and 6000px PNG bytes as the earlier visually
      approved `79c1be9` trial. Its HTML differs only in bound source/lock
      identities; all eight 1440×1000 Chrome screenshots are byte-identical to
      that trial. The new HTML SHA-256 is
      `39ca287a813282c4aa8f2b30f05ca2152112ea47179fd39cf082f447e18b71a8`.
      All eight pages pass Chrome/axe with no console error, external request,
      horizontal overflow, or WCAG A/AA finding. Evidence is under
      `build/review/self-alpha4-current-78b65f9/`. These are provisional
      bytes: the changed HTML still needs exact-byte human review, and the
      final Candidate needs semantic, installed and release acceptance.

## 6. Qualification and bounded publication

- [ ] 6.1 Bind the Candidate to the exact input lock, Edition, scenes, media,
      and renderer supply. In `tests/qualification-set.test.mjs`, rederive
      obligations from those inputs and reject forged/copied subject authority;
      records identify verifier, method, scope, result, and limits. Geometry,
      accessibility, visual judgment, domain truth, and independent verification
      remain distinct; same-person review is allowed only by named policy. A
      complete Candidate remains inspectable when browser, accessibility, or
      human post-build qualification fails; only applicable qualification and
      publication are withheld. A selected new renderer or toolchain may create
      a new Candidate without an unrelated Edition authoring change.
      Partial: exact v2 Candidate replay binds the input lock and rederived
      Edition question scopes by rebuilding from pinned inputs. An executable
      Provider runs again only with the invoker's separate exact choice, as
      `tests/selected-candidate-replay.test.mjs` demonstrates. Submitted records
      cannot invent subjects, medium-local scopes, or verifier authority. The
      invoker separately chooses executable Providers and, optionally, exact
      `architecture.qualification-policy/v1` bytes. The latter assesses finite
      required predicate/scope/verifier/method tuples and explicit limits but
      remains `invoker-selected-unverified`, `records-bound`, and non-admitted
      even for submitted PASS. Historical v1 semantics remain unchanged.
      One independently supervised invocation owns registered nested workers;
      POSIX counterexamples cover timeout, early reply, blocked event loop,
      cleanup and an unrelated sentinel. A relocated offline package now
      exercises the v2 policy path. The three-selector v2 input and provisional
      120-second invocation deadline do not grant policy or evidence authority.
      Focused and relocated installed policy checks pass; Task 7.5 owns the
      current global coverage gate. The Candidate bundle now carries canonical
      `input-lock.json` bytes for later claimant/editor attribution without a
      Provider rerun; this does not authenticate a claimant or admit evidence.
      Still open: final renderer/toolchain closure, predicate-specific trusted
      evidence and adopter acceptance, native Windows containment, exact final
      Candidate review, and the unchanged 95% coverage gate. Task 6.1 is not
      complete.
- [x] 6.2 Keep `packages/publisher/src/publication/` an optional local filesystem
      effect. In
      `tests/publication-contract.test.mjs` and
      `tests/pair-replacement.test.mjs`, require exact Candidate, qualifications,
      acceptance policy, named accepter, custody target, prestate, file-plan digest,
      and authorization; mismatch fails before delivery effects and preserves prior output.
      Preview/export needs no custodian. Do not claim Git/Forge, hosted availability,
      or off-host DR from a local receipt.
      The same public CLI derives a dual-media plan from an exact
      Candidate bundle, input lock, Qualification Set, policy, and report. It
      re-assesses submitted policy fit without a Provider or source replay,
      records distinct actor roles, requires separate accepter adoption and
      local effect authorization, and recovers without original input files.
      Source and offline-installed counterexamples reject forged PASS, changed
      evidence, mismatched authorization, altered prestates, and a user-edited
      prior managed file. Qualified replacement preserves foreign content and
      replays exact installed bytes. Existing raw-file behavior remains covered.
      A post-plan missing, linked, or non-directory destination parent now fails
      before writer-lock preparation without creating recovery state.
      The shared file-effect owner now keeps `static`/`interactive` in a
      qualified plan, journal, and receipt while preserving the raw pair's
      `native`/`atlas` input meanings; cross-borrowed slots fail closed.
      The receipt attributes but cannot authenticate actors or grant release
      authority; trusted evidence, final human acceptance, and the 95% global
      gate remain with Tasks 6.1 and 7.5–7.6, not this local-effect mechanism.

## 7. Installed acceptance and release

- [ ] 7.1 Use a provisional exact package archive, not source-adjacent imports,
      to test generic replacement parity on frozen self and independent-editor
      inputs. Probe frozen ETHOS, whole AIGW, Client Projection, and di-effect
      inputs and attribute each result to the product or source owner. For
      compatible selected inputs, verify relocated offline build, common Provider
      conformance, source-delta update, native comparison, legacy replay, and
      recovery; record exact input, package, Candidate, and media digests in
      `conformance/`. A generic compiler failure on compatible external input
      blocks Publisher release. A source-owned package pin or pending adopter
      approval does not: source migration may require an already published
      Publisher package and remains a separate goal obligation. These
      provisional bytes are not final release or human-review identities.
      Partial: the
      researcher-owned di-effect Edition rebuilt all five Candidate files
      byte-identically from direct, offline-installed, and relocated use of
      one exact package; see `conformance/evidence/di-effect-installed-probe.json`.
      Installed Chrome at two widths found no console/network/overflow or
      axe A/AA defect; this does not establish di-effect owner or human
      acceptance, other workload parity, publication, or recovery. The same
      frozen di-effect sidecar now also builds from the untagged alpha.4 Core
      archive made at signed Publisher `79c1be9`: an offline install, repeat,
      and relocated installed run produce the same six Candidate members.
      Changing a pinned source returns `materialized_pin_mismatch` without
      output. Exact identities and limits are in
      `conformance/evidence/di-effect-successor-installed-probe.json`. The
      static SVG/PNG bytes match the alpha.3 probe. The changed HTML rendered
      in headless Chrome 154 at two desktop widths with no page or network
      errors, horizontal overflow, or axe A/AA violations; canvas containment
      does not prove label readability or visual quality. No human review has
      accepted these bytes. This remains an editor-side pre-release experiment,
      not di-effect source-owner acceptance. The earlier
      alpha.3 archive also rebuilt the AIGW Client Projection chapter
      byte-identically after offline installation and relocation; its 12
      installed browser observations expose unreadable fit-to-canvas graph
      labels despite clean axe results. See
      `conformance/evidence/aigw-client-installed-probe.json`.
      That earlier Client-only probe is not the whole AIGW product or AIGW
      acceptance. The current exact archive from signed Publisher `0e391e7`
      rebuilt AIGW `bd3c09d5` Client Projection and whole-product Editions
      byte-identically through direct, offline-installed, and relocated public
      CLI use; its SHA-256 is
      `a1601d1836a5fdaf33af92e632bb1fda73cb5aee43f58fcda09b3742140f7281`.
      A changed product-model pin again failed without a Candidate. Chrome
      read all ten pages from the installed-equivalent HTML at 1280×720;
      graph labels remained at least 14.34px for the product and 16px for the
      Client chapter, with no runtime/network errors, node-body overlaps,
      horizontal overflow, or axe WCAG A/AA violations. The two small
      receipts in `conformance/evidence/aigw-client-paired-installed-probe.json`
      and `conformance/evidence/aigw-product-installed-probe.json` bind the
      selected inputs and all Candidate member digests. This remains a
      provisional macOS package and desktop browser check, not human visual
      approval, final release, source-delta update, recovery, or AIGW acceptance.
      An earlier isolated offline trial identified ETHOS's first installed
      successor obstacle: the selected source-owned package required Publisher
      `0.3.0-alpha.1`, while that trial's work-lane archive identified itself as
      `0.3.0-alpha.3`. The pair could not install with an empty cache; the signed
      alpha.1 control installed. The dated contrast and limits are in
      `conformance/evidence/ethos-install-pin-probe.json`. This is a source-owned
      dependency selection gap, not evidence of v2 semantics or flagship parity.
      An isolated copy of that same frozen ETHOS integration selected the
      provisional alpha.4 Core; three existing installed v1 Provider and
      explicit-input tests passed offline. The source pin was not changed,
      and v2 migration and flagship acceptance remain open. Exact identities
      and limits are in `conformance/evidence/ethos-provider-compatibility-probe.json`.
      A real accepted-media regression exposed the Core's conflation of
      text-to-geometry clearance with text-pair spacing. The repaired
      provisional Core restores the historical source contract; an explicit
      five-unit text-pair probe still finds 65 ETHOS source-owned near pairs.
      See `conformance/evidence/ethos-real-media-clearance-probe.json`.
      The refreshed self probe at signed Publisher `79c1be9` binds the untagged
      alpha.4 Core and self-Edition archives, 23 relocated selected sources,
      and six exact Candidate members. Linux arm64 Node 26.9 and 24.19 emit the
      same six bytes as macOS Node 26.10; exact HTML passes eight pages at two
      desktop viewports in Chrome without page errors, external requests, axe
      A/AA violations, or text/node overflow. Qualification replay remains
      records-bound and unadmitted; isolated raw file-effect apply/recover
      preserves foreign files without semantic acceptance. Identities and limits
      are in `conformance/evidence/self-installed-probe.json`. The task requester
      reported visual approval of those static and interactive bytes, but review
      size/policy metadata and final release qualification remain open.
      At signed Publisher `31d1566` and provisional AIGW Lane `bd3c09d`, the
      untagged `alpha.4` Core archive builds both AIGW Editions from seven
      copied selected files under empty HOME/PATH, repeats and relocates with
      byte-identical Candidate members, and rejects changed Provider/product
      model bytes without output. Exact identities and unproved limits are in
      `conformance/evidence/aigw-successor-installed-probe.json`; this is not
      AIGW owner acceptance, final visual review, or released-package parity.
      At signed Publisher `9a8f1a1` and AIGW `bdb77d55`, a new `alpha.4`
      preview archive installs offline with isolated HOME/cache. Public CLI
      builds from seven copied selected AIGW files under empty PATH match all
      six direct Candidate members for both Editions before and after package
      relocation. Exact identities and limits are in
      `conformance/evidence/aigw-grouped-static-probe.json`; the source checkout
      remained available, and this is not final released-package or owner
      acceptance.
      The current untagged `alpha.4` Core archive also builds the independent-
      editor example after offline installation outside the checkout. Moving
      the installed consumer preserves all six Candidate members byte-for-byte
      without changing the selected inputs or source fixture; see
      `conformance/evidence/independent-editor-installed-probe.json`. This is
      provisional generic installed-use evidence, not human review or release.
      At `d30bc43`, the pinned di-effect sidecar rebuilt from the offline
      installed and relocated Core with identical media bytes but a renewed
      Candidate identity for three selected implementation file sets; a changed
      source pin failed before output. The exact comparison and limits are in
      `conformance/evidence/di-effect-selected-implementation-renewal.json`.
      At signed Publisher `e900ec66`, the provisional alpha.5 self package pair
      rebuilt the same six Candidate members from an offline-installed public
      CLI on local Windows ARM64 Node 26.9. Exact archives, output, cleanup,
      and limits are in `conformance/evidence/self-windows-native-probe.json`;
      this is not a protected release or off-host recovery.
      At `f177006`, a fresh Core repack matched the selected alpha.5 archive
      byte-for-byte. Its installed public CLI rebuilt the independent-editor
      example after consumer/input relocation with all six Candidate members
      unchanged; a changed pin failed without a Candidate. One desktop Chrome
      page had no external request, console warning, or horizontal overflow.
      See `conformance/evidence/independent-editor-successor-probe.json` for
      exact bytes and limits; this is not source-owner or human acceptance.
- [x] 7.2 After provisional replacement parity, inventory and delete displaced Publisher-owned
      custom engines, redundant exports, dependencies, fixtures, and tests; keep
      only mechanisms with a distinct failing mature alternative. Verify
      consumer closure, `tests/package-boundaries.test.mjs`,
      `tests/module-boundaries.test.mjs`, package contents, and installed use.
      Do not delete source-owned art direction or immutable historical assets.
      The mechanism-subtraction decision in `design.md` distinguishes redundant
      joins and rolling byte-goldens from independent trust checks. The rolling
      self-hosted golden was removed; the frozen first-party release matrix
      remains exact. A single collision-safe exact-field predicate now replaces
      repeated delimiter comparisons and local validators; malformed key names
      failed RED and pass GREEN. The self-only build engines and their tests
      are removed. The old live Atlas composer, dual-mode contract, redundant
      export, and displaced tests are removed in favor of one interactive HTML
      contract; no Composer-only package dependency remained. Consumer-reference
      audit, package and module boundaries, dry-run package contents, installed
      self-use, eight-page Chrome/axe behavior, and the full behavior suite pass.
      The coverage gate and its measured status remain Task 7.5. Reopened on
      2026-09-29: the reviewed module-depth corrections identify remaining mixed
      owners and public helper exports. The explicitly internal
      `compileEditionCandidate` public export was removed with package-boundary
      RED/GREEN evidence. The recorded-metric reader moved from the SVG renderer
      to Scene typography with its former public export deleted. Close with an exact export/consumer
      inventory, owner-correct replacements, deleted incumbents, full first-party
      type-check scope, and relocated installed journeys. The renderer adopter
      tripwire now has a RED/GREEN regression, but that alone does not close the
      semantic boundary. The Build Request join now lives in private
      `compiler/build-input.mjs`; its Provider export and former file are gone.
      ETHOS and AIGW source integrations do not consume the removed symbol.
      The authored Scene now owns its pre-render geometry policy;
      Qualification owns emitted SVG-path observation, and the former Scene
      file is removed. Focused direct/mixed, offline-installed, and Scene
      checks pass, as do static, package, and the full 1,277-pass/3-skip suite
      with 97.96/95.02/99.54/97.96% statement/branch/function/line coverage.
      The file-envelope split now places protocol values and bounded reads
      below Source Bundle identity. The old generic Source exports are removed;
      the independently installed self-Edition uses the two-operation public
      `file-input` contract. Source and installed-use regressions, static and
      package checks, and the full coverage gate pass on this work-tree slice
      (98.00/95.02/99.65/98.00% statements/branches/functions/lines).
      Raster Source selection and CoreText Source output now belong to
      `rendering/`; both media backends accept selected bytes or measurement
      inputs without Source imports, and the compiler no longer mints a
      disposable raster-input bundle. Public backend functions have precise
      byte-level names with no old-name aliases. RED/GREEN tests cover module
      direction, preflight limits, caller mutation before awaits, and retained
      CLI behavior. Against signed HEAD `d879cea`, a representative PNG and
      all three CoreText bundle files match byte-for-byte; the disposable
      comparison directories were removed. The macOS full coverage gate passes
      at 98.00/95.02/99.65/98.00% statements/branches/functions/lines;
      static, package, and strict OpenSpec checks pass. An isolated Linux
      arm64 Node 26.9 full `npm run check` on the same work-tree snapshot
      passes 1,272 tests with 23 platform skips, 97.17/95.08/98.97/97.17%
      statements/branches/functions/lines, and package validation. A first
      clone at `/work` exposed a test that mistook checkout basename for
      product identity; the owner assertion now derives identity from the
      package contract, and a relocated `/work` regression passes on macOS
      and Linux. These are local candidate checks, not Windows, hosted CI,
      source-product adoption, or release acceptance; those obligations
      remain in Tasks 7.5–8.2.
- [ ] 7.3 Update `docs/product-contract.md`, `README.md`,
      `docs/reference/operations.md`, `skills/architecture-publisher/SKILL.md`,
      examples, and migration handoffs for the actual successor command, schemas,
      limits, and
      ownership. `tests/ecosystem-projections.test.mjs` and
      `tests/product-identity.test.mjs` reject stale or rival command planes.
      Partial: A–E program context is non-normative Change design; ETHOS-only
      view and copy constraints are carried to its source-owned editor through
      a non-authorizing migration handoff, not the generic product contract.
      The current CLI help, README, product and operational references, Provider
      reference, and repository Skill now distinguish v2 selected-input builds
      from historical v1, including executable replay effects. A complete
      source-bound example builds the same paired Candidate after relocation.
      Migration handoffs now distinguish AIGW's provisional installed Client
      and whole-product probes from source-owner acceptance, and ETHOS's exact
      package-pin prerequisite from v2 semantic or flagship parity. The README
      identifies the linked Edition v1 contract as historical. The operational
      reference now assigns paired-media compilation to the generic Core, not
      the self-Edition; successor output is not called an Atlas. The signed
      alpha.4 package identity and primary-forge readback are now documented;
      current v2 guidance no longer calls the released contract unreleased.
      ETHOS and AIGW installed adoption, acceptance, and their source-owned
      handoff paths remain unverified here, so this task remains open.
- [ ] 7.4 Promote the reviewed role-based deltas into active specs before release
      freeze; the later official archive must add no new normative behavior.
      Prove historical v1 input meanings, a zero-source-change independent
      Edition, optional co-located routes, multi-source endorsement separation,
      fail-closed selected bytes, and owner-approved retirement. Replace the
      physical-placement assertion in `tests/product-identity.test.mjs`; align
      README, Edition guidance, and operations without imposing a source-product
      CI gate. Validate all 16 specs with no issues, including advisory INFO.
      The four affected base specs are now promoted. An isolated official
      archive rehearsal leaves all 16 base specs byte-identical and validates
      16/16 with `issues: []`; the open Change and base validate 17/17 with no
      issues. Focused contract tests pass 41/41. A standalone independent-editor
      CLI example builds both media after relocation without changing selected
      input files or the source fixture. This proves the generic zero-write
      route, not ETHOS/AIGW adoption, endorsement, or retirement; the task
      remains open.
- [ ] 7.5 Select the SemVer successor and update package manifests, lockfile,
      and `CHANGELOG.md`. After Task 7.2 removes displaced runtime code, add
      behavior tests until the complete owned scope reaches at least 95% in
      statements, lines, branches, and functions; require `npm run check` to
      pass without relaxing inclusion or thresholds. Only then freeze final
      product inputs. From that frozen source, repack the exact installed
      product and rebuild Publisher-owned self and independent-editor Candidates
      plus the Task 7.1 external conformance workloads; rerun their applicable
      offline/relocation/recovery checks. Inspect every Publisher-owned final
      static overview and HTML page in a real browser; exercise geometry,
      keyboard, accessibility, reduced motion, and no-network behavior. Obtain
      separate human judgments on Publisher-owned final static and interactive
      bytes for faithfulness, readability, hierarchy, density, and visual
      quality. A generic compiler defect exposed by an external workload blocks
      Publisher release. ETHOS and AIGW retain their own art, acceptance, and
      publication; neither becomes Publisher proof or a prerequisite for its
      release. Do not reuse provisional Candidate identities or review after
      any selected input changes.
      Historical provisional test and coverage snapshots do not qualify the
      frozen final inputs. Rerun all four unchanged 95% coverage gates and the
      full checks on those exact inputs; no release admission is inferred.
      At signed source `2528794`, `npm run check` passes with 97.94% statements
      and lines, 95.01% branches (8,629/9,082), and 99.63% functions. Strict
      OpenSpec validation has no diagnostics, and the three exact-HEAD ETHOS
      proof gates pass under attestation `a37ffc84`. Local CAS advanced
      `candidate/dev` to that source. This is pre-freeze, not release evidence:
      Task 7.3, final installed workloads, exact-byte visual and human review,
      protected refs, hosted CI, and remote readback remain open. Do not weaken
      coverage or substitute this provisional result for Task 7.6.
      The work Lane now selects untagged `0.3.0-alpha.4` across workspace,
      Core, self-Edition, and lockfile. A focused RED/GREEN rejects changed
      development HEAD bytes reusing the signed `v0.3.0-alpha.3` version; the
      historical tag is unchanged. This assigns a unique provisional package
      identity for cross-product migration trials, not frozen or released
      `alpha.4` bytes. Final release notes, package identities, and acceptance
      remain open in this task.
      A later authored-canvas counterexample showed that strict glyph
      intersection was insufficient: two labels could pass with inadequate
      spacing. Focused RED/GREEN now enforces text clearance in the public
      compiler, and the self-Edition moved one label to satisfy its existing
      conservative geometry check. `npm run check` passes with 97.95% lines and
      statements, 95.05% branches, and 99.53% functions. These are still
      pre-freeze inputs; rebuild, exact-media review, and release
      admission remain open.
      Later signed test commits `0d24921` and `201c0e5` cover changed source
      roots, portable member aliases, nested Provider package identity, and
      non-regular package members. At `201c0e5`, exact-HEAD ETHOS proof passed
      three gates under Attestation `9076a19b`; local `candidate/dev` and the
      sole remote proposal ref match that commit. GitLab Pipeline `8521` passed
      at the same SHA: 1,245 tests passed, 17 were explicitly skipped, none
      failed, and branch coverage was 95.03% without changing the threshold.
      This is hosted source readiness, not package freeze, final-byte review,
      protected-ref publication, or release acceptance.
      At `fc45078`, Pipeline `8538` passed 1,248 tests with 17 skips and no test
      failures, but failed the Linux branch gate at 94.99%. A portable,
      tool-independent CoreText request preflight now covers its input contract
      on Linux without attempting macOS-only measurement. Focused macOS/Linux
      tests and the macOS full check pass. At signed repair `4392e03`, hosted
      Pipeline `8545` passed 1,249 tests with 17 skips and 95.12% Linux branch
      coverage without changing the four 95% gates. This is pre-freeze source
      readiness, not package or release acceptance.
      The prior alpha.5 self HTML visual approval was superseded by the
      reported source-inspection defect; the unchanged static PNG approval does
      not transfer to a revised HTML. Fresh final-byte review is required.
- [ ] 7.6 On the frozen Task 7.5 inputs, run `npm run check`, strict OpenSpec
      validation, installed conformance,
      and exact-HEAD governance proof. Each coverage dimension must meet 95%
      without excluding changed production owners. Land the exact accepted
      commit and require hosted CI
      success for that identity before release publication. Publish only the
      admitted protected ref and exact assets, then read back owned links by
      digest. A changed selected input returns to Task 7.5; a progress-only
      commit refreshes exact-HEAD governance separately. Do not rewrite
      historical tags or assert off-host recovery without the operator DR decision.
      Alpha.4 exposed a release-consumer gap: three selected upload assets
      rehash through the authenticated API, but `glab release download`
      1.119.0 fails with 404, unlike an alpha.3 package-API link. A successor
      release must prove a supported CLI download path and exact byte readback;
      do not rewrite alpha.4 links to conceal this result.

## 8. Source handoff and closeout

- [ ] 8.1 Send AIGW's single writer exact successor protocol/package evidence,
      Client Projection versus whole-product limits, declarative journey, media
      identities, and rollback criteria. AIGW separately admits its own migration,
      acceptance, release, and retirement of displaced materialization.
      Reobserve AIGW source, Provider and Edition inputs at handoff; a dated
      source snapshot or an assumed single native format is not an admission.
      Migration must select a truthful AIGW-owned architecture source or
      attributed projection path, not merely relocate copied snapshots.
- [ ] 8.2 Send ETHOS's single writer a retained-versus-displaced integration
      map and exact executable journey. Preserve ETHOS-native claims, Lane
      cooperation/competition/experiment/all-drop meaning, repository-quality
      SSOT, governance, independent-verification predicates, and flagship art
      direction; ETHOS separately admits semantic/media/rollback acceptance.
      A preliminary non-authorizing exact package-pin counterexample was sent
      to the ETHOS owner task on 2026-09-27; the final released-package journey
      and source-owned acceptance handoff remain open.
- [ ] 8.3 Hand the completed SDD/DR, COMET, SpecD, semantic-graph, intent,
      and independent-verification research to the existing ETHOS knowledge
      owner with source citations and adopt/reject/defer boundaries. Keep only
      Publisher-relevant publication mechanism decisions here; verify receipt,
      not presumed adoption or an editable duplicate authority.
- [ ] 8.4 After release readback, use `openspec archive --skip-specs` only after
      verifying that the active base specs already carry
      its exact normative delta; the archive must not change released behavior.
      Close the owned Lane, verify protected refs and remote readback, and classify
      durable evidence, active, foreign, and disposable state. Off-host DR remains
      excluded until destination, custody, retention, encryption, bounded
      credential, and clean-host restore acceptance are selected.
      The decision-ready tier, inventory, operator-choice, and clean-host
      acceptance contract is recorded once in `docs/reference/operations.md`;
      no destination, credential, backup effect, or off-host proof is selected.
