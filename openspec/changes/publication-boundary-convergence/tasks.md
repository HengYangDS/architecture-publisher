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
- [x] 2.4 Bind selected source, Edition, resources and upstream adapter identity
      in the generated input lock. Bind checked parser, backend, font, renderer
      and Publisher implementation supplies in each Candidate after consumption.
      Keep observed reads, checked-declared supplies, declared-only, unresolved
      and ambient inputs distinct; no Provider declaration proves hermeticity.
      Ruling: actual native and independent-media consumers now exist and are
      checked. Input binding no longer depends on Task 5.2's reader/form
      acceptance or Task 5.5's human judgment; those cannot strengthen a read
      observation and remain separate prerequisites for final publication.
      At signed source `b9ea164`, 44 input, native-parser, implementation and
      static-supply regressions passed without skips. A current audit verified
      all five selected request/lock identities, read methods, resource pins,
      checked supplies and 30 offline-installed Candidate members. Selected
      drift fails; ambient neighboring content and package-only changes cannot
      masquerade as selected source. The same source passed Linux/macOS CI 9053.
      See `conformance/evidence/neutral-reading-composition-probe.json`.
      Retain selected-inputs/roots-only, native-dependency, concurrent path-mutation,
      unchecked authored meaning, unobserved Provider dependencies and original-
      builder provenance limits. Complete packages remain execution evidence,
      not Candidate input or independent builder attestation.
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

- [x] 3.1 Extend `packages/publisher/src/provider/` with
      `architecture.edition-provider/v2` and the existing build route so direct,
      declarative, and executable selections yield one checked
      native/authored/derived input envelope before compilation. The exact
      contract rejects ambiguous delivery, missing ancestry, unselected bytes,
      later-stage claims, and duplicate cross-Provider identities; invocation
      metadata does not change selected meaning. The packed offline executable
      journey, historical v1 replay, common conformance, and module boundaries
      pass (41 focused tests on `5d56b0b`; full Mac/Chrome gate and hosted
      Pipeline 8810 also pass). The materializer reports unobserved Provider
      dependencies and the concurrent pathname-mutation limit explicitly; it
      claims neither path confinement nor a sandbox. Final frozen-package
      qualification and source-owner adoption remain Tasks 7.5 and 8.1–8.2.
- [x] 3.2 Reuse the bounded process-tree supervisor for one exact selected
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
      Final source `1e4746f` ran five Provider and owned-process test files
      on native Windows ARM64: 71 cases, 64 pass, seven platform-inapplicable
      skips, zero fail. All five guest log digests matched host readback. A
      separate offline install of the exact Core archive rebuilt the self
      Candidate with six byte-identical members; 19 Provider/runtime members
      in that archive match the signed source tested on Windows. Both guest
      scratch roots from the source tests are independently absent, no owned
      Node process remains, and VM isolation is restored. The installed
      Provider tests repacked the
      same source rather than executing from the selected archive; no
      original-builder provenance or hermetic preparation is inferred. Exact
      identities and limits are in
      `conformance/evidence/successor-supply-installed-probe.json`.
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

- [x] 4.1 Add an admitted LikeC4 native adapter under
      `packages/publisher/src/semantics/` and test exact selected bytes and
      includes, supported constructs, source references, typed relation fields,
      and explicit losses. The verified bundled parser receives only selected
      virtual `.c4` files with `useFileSystem:false` in a bounded worker. The
      importer checks its document set, source locations, selected `include *`
      membership, and output identity. Its disposable index retains elements,
      relations with endpoints/kind/direction/origin, and authored structural
      views without minting a duplicate editable Claim Model. Dynamic views and
      domain metadata remain source-bound but opaque; unsupported references
      and free-form queries fail rather than acquire invented meaning. The
      worker's expiry and restricted reads are defense in depth, not a sandbox
      or complete-read proof. The index declares `parsed-document-set-only`
      closure and semantic limits. Current native import, execution, identity,
      layout, and supply tests pass 62/62, including installed parser-byte
      substitution.
      Read closure and supply classification remain with 2.4; visible media
      coverage with 5.1–5.4; current Linux/Windows acceptance with 7.5–7.6.
      Upstream-computed membership is explicitly unqualified; complete LikeC4
      include semantics are not claimed, and free-form Edition queries fail.
- [x] 4.2 Prove native identity and disagreement without inferred meaning in
      `tests/native-identity.test.mjs`, `tests/native-evolution.test.mjs`,
      `tests/semantic-compilation.test.mjs`, and
      `tests/claim-model-selection.test.mjs`. Current tests distinguish equal
      labels by namespace, generated relation IDs from source locators, and
      duplicate endpoint relations; opaque or unsupported references fail or
      retain explicit limits. Claim Model contradictions fail within one
      applicable source assertion set, while different source claimants and
      intended/implemented planes remain separately attributed. Public HTML
      checks confirm two readable, non-overlapping disagreement cards; SVG
      checks confirm both plane/validity texts without text collisions at the
      selected desktop viewport. A moved LikeC4 relation locator remains
      `relation-lineage-unproved` and renews semantic verification, both media
      reviews, acceptance, and publication rather than inheriting approval.
      Bare relations or graphic carriers cannot prove transitive, universal,
      causal, or authority claims.
      The successor intentionally admits no positive LikeC4 relation-lineage
      witness: its explicit `unproved` state and complete renewal satisfy the
      current fail-closed correspondence boundary, not precise moved-relation
      matching. The observed AIGW and ETHOS inputs use Claim Model v2; the
      di-effect LikeC4 source has no Publisher Edition or lineage witness.
      A positive public protocol requires an adopter's exact evidence case and
      a new version. Full reader-quality and PNG visibility remain with 5.4.
- [x] 4.3 Extend `packages/publisher/src/semantics/change.mjs` and
      `packages/publisher/src/edition/evolution.mjs`;
      `tests/native-evolution.test.mjs` and
      `tests/claim-model-selection.test.mjs` must detect
      changed qualifiers without cardinality change, selector membership, indirect
      claim dependencies, unknown read sets, and packaging-only changes. Report
      rebuild, semantic, media, human, acceptance, and publication obligations
      separately; do not transfer old approval automatically.
      Earlier partial slice: the existing `archpub evolution plan` route preserves Claim Model
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
      readiness, not final frozen-package or adopter acceptance. At that
      checkpoint, full-model dependency precision, installed-platform parity,
      and Task 7.5 release acceptance were open.
      The unreleased v3 now names changed Candidate inputs as
      `edition-candidate` and its single HTML output as
      `interactive-document`. A Provider package-only replacement with
      byte-identical selected lock, Candidate, and media requires no rebuild;
      semantic verification, acceptance, and publication still renew.
      Historical v1 target names are unchanged. The 78 related tests and full
      `npm run check` pass, including all four unchanged 95% coverage gates.
      Final package and adopter acceptance remain open.
      Current Claim Model selections bind declared dependency values from the
      exact normalized model. A changed relation reaches its dependent claim
      even if not selected separately, without implicating an unrelated claim;
      malformed bindings fail and changed ownership cannot borrow exact
      correspondence. Focused RED/GREEN and the local full gate pass:
      1,309/1,312 tests, three skips, zero failures, 95.12% branch coverage.
      The offline packed public CLI reproduces the dependency impact after
      relocation under an empty HOME and PATH. Task 4.3 closes change planning,
      not native read closure (2.4/4.1), frozen cross-platform parity (7.5),
      or adopter acceptance (8.1/8.2); older exact-byte human media approval
      does not transfer.

## 5. Editorial composition and independent media

- [x] 5.1 Materialize finite required assertions for each reader question and
      medium before layout. Join the Build Request and Edition Project: a
      promised question or required assertion present only in an unrequested
      medium cannot count as selected-media coverage.
      `tests/edition-selection.test.mjs` covers explicit
      exclusions, limits, editorial propositions, allowed/forbidden aggregates,
      `some-member` versus `all-member`, and conflict views. An unclassified
      selected-source omission or mechanically established typed contradiction
      fails; free editorial wording remains attributed and unverified. Finite
      coverage means every selected assertion for the declared question is
      represented or limited, not that arbitrary prose answers the question
      or that the raw graph was exhaustively copied.
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
      preparation, not installed Candidate acceptance. The public build now
      emits source-bound sibling media. A focused member-flow counterexample
      keeps source-affirmed `some-member` and source-refuted `all-member`
      distinct, while a stronger editorial proposition remains visibly
      unverified in both media. Its RED/GREEN exposed and repaired missing
      editorial evidence on a claim-only HTML page. Source truth, free authored
      prose equivalence, source-owned allowed/forbidden aggregate rules, reader
      adequacy, and Task 7.5 installed/human acceptance remain open.
      A further counterexample changes a source-bound authored static label to
      an unsupported universal statement without changing its source IDs. The
      Candidate now explicitly retains the unverified authored-text limit;
      this does not certify or reject arbitrary prose and does not close the
      source-owned aggregation or human semantic-acceptance obligations.
      Ordered views now accept editor-declared forbidden group pairs. Exact
      selected membership admits separated pairs and rejects a same-group,
      unselected, or duplicate unordered pair before layout. This is a finite
      visual-composition constraint, not a claim that the editor supplied all
      source-owned prohibitions; Task 5.1 remains open for that boundary.
      Free titles and summaries now receive visible editor attribution and a
      source-endorsement evidence limit in both successor media, including
      neutral and authored paths. An independent-editor counterexample builds
      official-sounding prose without granting it source authority. This does
      not validate arbitrary natural-language claims or replace human review.
      Closure ruling: the product-owned finite selection and attribution
      contract is complete, not source truth or reader acceptance. The active
      Edition specification now distinguishes mechanically checkable identity,
      typed-claim and declared-group contradictions from free wording that the
      compiler cannot understand. The latter stays visibly editor-attributed
      and unqualified rather than causing a fictitious compile-time verdict.
      A current focused run of Edition selection, meaning, Claim Model, and
      visible-coverage tests passed 96/96 with no skips; the preceding
      Chrome-enabled full gate passed 1,310/1,313 with three declared skips
      and 95.11% branch coverage. Source-owner aggregate rules, actual answer
      adequacy, and visual acceptance remain explicit external obligations
      under Tasks 7.5, 8.1, and 8.2, never implied by this checkbox.
- [x] 5.2 Deliver an explainable neutral source-to-media composition without
      duplicate editable facts, authored pixels or a second layout engine.
      Preserve exact selected references, reader questions, group membership,
      typed qualifiers, conditions, source identity and visible limits in both
      media. An infeasible or unsupported selected form must fail with the
      exact view/question rather than silently narrow meaning or invent roles.
      Keep one pinned ELK route owner for neutral interactive geometry and
      viewport-only navigation. Static composition stays independent. A native
      topology cannot become responsibility authority; explicit source/editor
      role and handoff bases are required for that selected form.
      Current mechanical evidence at signed `b9ea164`: complete glyph/frame/
      route/arrow paint witnesses for ten AIGW graphs have zero contact and
      two-pixel clearance; twenty desktop observations at 1600/1920 have no
      errors, network requests, overflow or Axe A/AA findings. The heading-track
      RED/GREEN and 28 sibling tests preserve all meaning, geometry and static
      bytes. Five relocated installed builds match all 30 Candidate members.
      Local and Linux/macOS gates pass with every coverage dimension >=95%.
      See `conformance/evidence/neutral-reading-composition-probe.json` and
      `docs/research/mechanism-evaluation.md` for exact identities, counterexamples,
      superseded tool choices and observation limits; earlier task history is
      preserved in signed `b9ea164`, not copied into current progress.
      On 2026-10-01 the requester accepted both exact AIGW HTML works as
      neutral visual baselines and the current self media for faithfulness,
      intelligibility and restraint. This closes the generic reader/form
      contract within its explicit scope. AIGW's responsibility question and
      unapproved role trial remain source/editor decisions under Task 8.1,
      not adopted truth or a prerequisite for generic Publisher release.
      Human decisions are bound in the same receipt. Independent code/paint
      review and visual approval cannot certify source truth or arbitrary prose.
      No mobile, narrow-screen, random pixel fallback or extra layout owner.

- [x] 5.3 Compile static SVG/selected-width PNG and standalone interactive
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
      A current AIGW reader counterexample exposed neutral source controls
      that selected an `aria-hidden` graph element without exposing its state.
      The alpha.6 successor projects graph selection through `aria-pressed` and
      one per-page `role=status` region while retaining keyboard focus.
      Real-Chrome RED/GREEN keyboard and axe tests pass; actual screen-reader
      behavior and the authored static SVG text alternative remain separate
      accessibility obligations.
      The static SVG carrier now accepts an editor-authored description apart
      from its visible subtitle and exposes it via `aria-describedby`. The
      self-Edition authors a target-flow description; without a selected
      description the subtitle remains only a renderable fallback, not proof
      that a complex adopter Edition is accessible. AIGW-owned text and exact
      reader acceptance remain outside Publisher's source authority.
      Closure ruling: the dual-medium compiler and standalone artifact
      contract are complete within Publisher's authority. A current focused
      run passed 22/22 contract, installed, independent-editor, HTML and
      static-browser tests; a separate real-Chrome dual-medium/Cytoscape run
      passed 3/3 without skips. The last full runtime gate passed 1,310/1,313
      with three declared skips and all coverage dimensions above 95%.
      Actual visible adequacy remains Task 5.4; neutral AIGW composition
      remains Task 5.2; exact frozen-package, adopter and human acceptance
      remain Tasks 7.5–8.2. This checkbox grants none of those outcomes.
- [x] 5.4 Bind each selected source assertion, reader question, Scene carrier,
      and emitted graphic independently in both media. Native regressions
      reject endpoint/plane/condition substitutions, borrowed or hidden-only
      carriers, missing question limits, unselected data, and unsafe private
      input disclosure. Infeasible composition returns the exact view and
      question for editor-owned regrouping.
      Closure is finite mechanical coverage within Publisher's authority,
      not arbitrary prose adequacy, source endorsement, or aesthetic approval.
      On signed `a0aeeac`, an actual-consumer rederivation matched five input
      locks, independent Scene/carrier digests, and the exact neutral HTML;
      Chrome checked all 20 selected pages and every self Inspect record.
      AIGW qualifiers, Claim applicability, source status, and limits remain
      visible. All 30 offline-installed Candidate members were hash-rechecked.
      The existing painted-layer observer witnessed every selected glyph,
      frame, route, and arrow in all ten AIGW graphs with zero contact, including
      a two-pixel dilation. The focused coverage/input/supply gate passed
      37/37 without warnings or skips. Exact identities, methods, native
      coverage, observer failure, and limits are in
      `conformance/evidence/actual-media-coverage-probe.json`.
      Reader-level composition and AIGW editorial form/long-route concerns
      remain Task 5.2; final frozen packages and renewed self HTML review
      remain Task 7.5; source-owner acceptance remains Tasks 8.1–8.2.
- [x] 5.5 Keep the first-party self Edition on the same public Build Request,
      Edition Project, data-only refinement and dual-medium compiler as other
      adopters. Preserve its source-owned meaning and flagship art direction;
      selected-meaning coverage, installed relocation, independent media,
      browser/accessibility and current exact-byte human review pass.
      On 2026-10-01 the requester accepted the current static PNG
      `85745f5087d61c6a8b85fb9c4de1f1b08c20adffc23024d2a49b22cccab42712`
      and standalone eight-page HTML
      `eb8e4a5cd76ac52a3dc8a50e6bb93417c8f20da5a59b0e1a16b81ec920d579c6`
      for faithfulness, intelligibility and restraint. This new decision,
      not predecessor approval or screenshot equivalence, closes the previously
      reopened media gate. See the neutral-reading receipt. Source endorsement,
      Candidate policy admission, protected publication and release remain
      separate under Tasks 7.5–7.6; future changed bytes renew applicable review.

## 6. Qualification and bounded publication

- [x] 6.1 Bind the Candidate to the exact input lock, Edition, scenes, media,
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
      At the signed alpha.5 release, final renderer/toolchain closure, native
      Windows containment, exact self-media review, and all four unchanged 95%
      coverage gates were verified under Tasks 7.5–7.6. The generic v2 result
      intentionally remains `records-bound` and `admitted: false`: verifier
      authentication and adopter acceptance belong to their named owners, not
      to this binding mechanism. This closes Publisher-owned qualification
      input and policy-fit behavior, not universal certification.
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

- [x] 7.1 Use a provisional exact package archive, not source-adjacent imports,
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
      frozen di-effect sidecar also built from the untagged alpha.4 Core
      archive made at signed Publisher `79c1be9`: an offline install, repeat,
      and relocated installed run produced the same six Candidate members.
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
      acceptance. The archive selected at signed Publisher `0e391e7`
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
      The untagged `alpha.4` Core archive from that trial also built the
      independent-editor example after offline installation outside the checkout.
      Moving the installed consumer preserved all six Candidate members byte-for-byte
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
      At signed Publisher `1f59246`, the patched alpha.5 Core archive built
      five frozen workloads through the previously offline-installed public
      CLI: self, independent editor, AIGW Product, AIGW Client Projection,
      and a researcher-authored di-effect sidecar. Each six-member Candidate
      from the four non-self workloads matches a direct build byte-for-byte;
      self and the independent editor match after selected-input relocation.
      Exact requests, package,
      media, and limits are in
      `conformance/evidence/successor-supply-installed-probe.json`. This is
      not adopter acceptance, final qualification, or protected release.
      At signed `1e4746f`, one fresh offline-installed Core and self-Edition
      pair reproduced all five frozen six-member Candidates with empty PATH
      during builds. Installed native evolution, v1 replay, and qualified
      local recovery tests pass in the full gate. The frozen ETHOS integration
      snapshot selected Core alpha.1; forcing that snapshot onto alpha.5
      exposes removed low-level helper imports. Its source-owned migration
      remains Task 8.2, not a Core v1 protocol replay failure. These exact
      frozen AIGW media and di-effect sidecar have no owner acceptance in
      this evidence. This closes Publisher-owned installed parity and external
      counterexample probing; it does not close any adopter's migration.
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
- [x] 7.3 Update `docs/product-contract.md`, `README.md`,
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
      The operational reference now owns current Publisher release selection;
      migration handoffs name historical probes without selecting adopter
      acceptance. `tests/ecosystem-projections.test.mjs` and
      `tests/product-identity.test.mjs` pass at the accepted alpha.5 successor.
      ETHOS and AIGW installed adoption and acceptance remain their own tasks,
      not a reason to keep Publisher documentation incomplete.
      A 2026-09-30 documentation drift audit removed four unimplemented ETHOS
      test selectors from the operational reference, named the actual browser
      and external-input selectors, dated local adopter snapshots, and replaced
      the misleading linear processing arrow with one two-authority,
      two-medium diagram. The diagram was rendered and inspected; current
      Markdown formatting and lint checks passed. Historical evidence images
      and archived Changes remain dated records, not mutable current guidance.
- [x] 7.4 Promote the reviewed role-based deltas into active specs before release
      freeze; the later official archive must add no new normative behavior.
      Prove historical v1 input meanings, a zero-source-change independent
      Edition, optional co-located routes, multi-source endorsement separation,
      fail-closed selected bytes, and owner-approved retirement. Replace the
      physical-placement assertion in `tests/product-identity.test.mjs`; align
      README, Edition guidance, and operations without imposing a source-product
      CI gate. Validate all 16 specs with no issues, including advisory INFO.
      The earlier `--skip-specs` archive rehearsal proved only that updates
      were skipped; it did not prove normative closure. A 2026-09-30 ordinary
      archive rehearsal exposed four still-changing base specs and one stale
      removed-requirement warning. The exact merged deltas were promoted to
      their base owners, the already-satisfied removal directive was deleted,
      and two long requirements were compressed without dropping their
      scenarios. A second ordinary archive changed zero of 16 base spec files
      and emitted no warning. Strict base and active-Change validation passed
      16/16 and 17/17 respectively without INFO. The 41 focused contract
      tests and standalone relocated independent-editor build remain the
      separate behavior evidence; none establishes adopter acceptance.
- [x] 7.5 Freeze one `0.3.0-alpha.6` successor after final exact-media review,
      role-only protection and Changelog sibling closure. Signed `04a0511`
      passed exact-HEAD ETHOS proof and source CI 9061; local full and
      pre-push tag-context gates passed 1408/1411, three declared skips,
      zero failures/warnings, and 97.79/95.20/99.58/97.79% coverage.
      Exact offline Core/self archives rebuilt five relocated workloads and
      all 30 Candidate members with empty PATH. Current selected supplies,
      recovery, independent media, native paint, eight self desktop pages,
      keyboard/axe/no-network and direct exact human approval are bound in
      `conformance/evidence/release-alpha6-readback.json` and the neutral-reading
      receipt. The final qualification policy has 19 implementation-bound,
      attributed records; generic `submittedVerdict: PASS` remains
      `admitted: false`, not authenticated source truth. Explicit self
      target-design acceptance preserves Candidate limits. Native Windows,
      source-owned AIGW/ETHOS adoption and off-host recovery are not implied.
      Evidence-only closeout commits renew exact-HEAD governance without
      changing the frozen signed release or unchanged package/media bytes.

- [x] 7.6 Release only the frozen Task 7.5 identity. Require exact-HEAD ETHOS
      proof, installed conformance, hosted CI success, the designated release
      decision, and a local full gate with the exact annotated tag present
      before pushing that tag. Advance only admitted protected refs; publish
      one selected GitLab Generic Package copy per asset and link the release
      to those bytes. Download every selected asset through the supported
      noninteractive `glab release download` route, verify all payloads against
      `SHA256SUMS`, verify the checksum file's separately selected digest, and
      replay the downloaded packages offline. Preserve signed historical
      releases byte-for-byte. Report source-owner adoption, Candidate policy
      qualification, and independent off-host recovery separately; none follows
      from Publisher release readback. `v0.3.0-alpha.5` was previously released
      at `67ade23`; its exact historical result and sequencing deviation live
      in `conformance/evidence/release-alpha5-readback.json`, not in this
      current-task status.
      Current release and eleven single-copy Generic Package payloads exist;
      all were downloaded and SHA-256 checked, including the separate checksum
      digest. The downloaded packages rebuilt all 30 relocated members.
      Documents received the exact 6000px PNG and single HTML. Source CI 9061
      and protected tag CI 9067 passed every coverage floor. Original macOS
      job 46672 failed one native CoreText compiler invocation; the selected
      same-source native test passed, then one exact failed-job retry 46678
      passed without source, timeout, test or coverage changes. The failure
      and its incomplete historical root cause remain in the readback receipt.

## 8. Source handoff and closeout

- [ ] 8.1 Send AIGW's single writer exact successor protocol/package evidence,
      Client Projection versus whole-product limits, declarative journey, media
      identities, and rollback criteria. AIGW separately admits its own migration,
      acceptance, release, and retirement of displaced materialization.
      Reobserve AIGW source, Provider and Edition inputs at handoff; a dated
      source snapshot or an assumed single native format is not an admission.
      Migration must select a truthful AIGW-owned architecture source or
      attributed projection path, not merely relocate copied snapshots.
      Exact alpha.6 Core/manifest/checksum identities and both unchanged neutral
      HTML approvals were delivered after a read-only source/Provider/Edition
      refresh. Role readback identifies that existing task as an independent
      verifier, not the source writer; its established authorized forwarding
      route was requested. The single-writer handoff, receiver byte verification
      and source-owned adoption remain unestablished. Current selection pins
      alpha.1. The existing release readback owns these dated input facts.
- [x] 8.2 Send ETHOS's single writer a retained-versus-displaced integration
      map and exact executable journey. Preserve ETHOS-native claims, Lane
      cooperation/competition/experiment/all-drop meaning, repository-quality
      SSOT, governance, independent-verification predicates, and flagship art
      direction; ETHOS separately admits semantic/media/rollback acceptance.
      A preliminary non-authorizing exact package-pin counterexample was sent
      to the ETHOS owner task on 2026-09-27; the final released-package journey
      handoff is now delivered with downloaded release hashes. The pin-only
      migration test failed on retired private imports; a finite AST audit
      found 32 named-import/public-export mismatches. Both failures are
      retained and sent to the existing ETHOS owner, not masked by restoring
      compatibility exports. The source owner independently verified the
      exact downloaded Core archive, release manifest and checksum, and
      acknowledged existing Tasks 9.9.4/12.6. This closes handoff only;
      source-owned successor implementation, installed semantics/art/rollback
      and acceptance remain goal obligations at ETHOS, not Publisher proof.
- [ ] 8.3 Hand the completed SDD/DR, COMET, SpecD, semantic-graph, intent,
      and independent-verification research to the existing ETHOS knowledge
      owner with source citations and adopt/reject/defer boundaries. Keep only
      Publisher-relevant publication mechanism decisions here; verify receipt,
      not presumed adoption or an editable duplicate authority.
      The existing ETHOS proof-throughput Task 12.6 independently verified
      the signed Lane study and DR contract, then all three exact refresh
      packet hashes on 2026-10-01. Its topic owners and source boundaries are
      in `conformance/evidence/research-owner-intake.json`. Receipt is proven;
      the expanded receiver receipt now also binds all four exact adjacent
      Spec Kit/BMAD/GSD packet members. Its current bytes were independently
      read back and preserved at an immutable local snapshot. Five-topic source
      additions remain a proposed transplant, not adopted or silently applied.
      Substantive topic absorption and retiring general research here remain
      open. Preserve unique broader findings until that migration is verified;
      no upstream suite, source acceptance or off-host DR effect is claimed.
- [ ] 8.4 After release readback, use `openspec archive --skip-specs` only after
      verifying that the active base specs already carry
      its exact normative delta; the archive must not change released behavior.
      Close the owned Lane, verify protected refs and remote readback, and classify
      durable evidence, active, foreign, and disposable state. Off-host DR remains
      excluded until destination, custody, retention, encryption, bounded
      credential, and clean-host restore acceptance are selected.
      The decision-ready tier, inventory, operator-choice, and clean-host
      acceptance contract is recorded once in
      `docs/reference/disaster-recovery-decision-contract.md`;
      no destination, credential, backup effect, or off-host proof is selected.
      Official OpenSpec pre-write validation found four long requirement INFO
      diagnostics in the merged base projection. The authoring and verification
      boundary was semantically separated; all original 46 scenario identities
      remain, and one explicit non-authorizing acceptance scenario was added.
      The official locked merge applied five additions and two modifications
      across two base specs; reapplication has zero operations or warnings.
      Strict validation now reports seventeen valid items and zero issues.
      Normative convergence is not source adoption, archive or Lane retirement.

- [ ] 8.4.1 Remove demonstrated same-project native macOS job overlap using
      GitLab's existing resource-group carrier. Add a failing actual-YAML
      contract test, preserve review/protected trust selectors and Linux
      independence, then run pinned local quality and exact hosted checks.
      Keep original failures, accepted alpha.6 bytes and all source-owned
      adoption obligations. No host service, credential or time-limit change.
