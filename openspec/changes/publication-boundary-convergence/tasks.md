# Tasks

This is the sole progress ledger. The six written delta specifications were
approved on 2026-09-24; the plan below was approved on 2026-09-24 for
single-writer execution. Preserve historical signed releases byte-for-byte and
valid v1 protocol meanings. One owned Publisher Work Lane and one writer execute
this plan. ETHOS and AIGW retain separate source-side authority.

Each implementation task starts with a failing focused contract test, then the
smallest owner-level change and focused GREEN. Audit sibling consumers, run the
applicable static, package, and full behavior checks, inspect the exact diff,
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
      transformations, media, and visual policy; reject unknown fields and
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
- [ ] 2.4 Bind exact includes, resources, selected Edition bytes, backend and
      adapter versions, fonts, rendering supplies, and toolchain configuration.
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
      hermetic evidence. The focused 20/20 tests, static and package checks
      passed; the full check passed 697 tests, skipped 2, and failed only branch
      coverage at 92.93%. Resume complete closure at its actual consumers, then
      close this task before Candidate qualification and protected publication.
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

## 3. Provider convergence

- [ ] 3.1 Extend `packages/publisher/src/provider/` with
      `architecture.edition-provider/v2` and the existing build route so direct,
      declarative, and executable selection yield one closed
      native/authored/derived input envelope before compilation. Tests in
      `tests/edition-provider-contract.test.mjs` reject ambiguous mode/root,
      missing `derivedFrom`, unselected input, and Candidate/acceptance/publication
      claims; multi-source claimants remain distinct. Partial evidence: a
      separate v2 manifest validator admits one exact mode, distinct native and
      derived claimants, selected ancestry, optional authored Edition, and
      transport-independent expected bytes; executable native/Edition items
      must map to exact selected input bytes. It rejects extra later-stage
      claims and portable path aliases. A declarative-file reader verifies
      exact selected bytes, expands native ancestry, and keeps unverified
      adapter code outside selected content identity. Successor Provider,
      Build Request, and Edition Project readers reject duplicate JSON keys
      without changing v1 parsing or rejecting formatted JSON. A single
      internal lock sealer now canonicalizes native namespaces, derived
      ancestry, Edition resource references, selected media, and object-key
      order. It rejects duplicate native namespaces and complete derived
      semantic tuples while ignoring Provider-local IDs. It rejects missing or
      legacy Edition resource fields rather than silently sealing false
      equivalence. The direct result binds read methods to the exact lock
      outside semantic identity. The Build Request join now binds direct,
      declarative, and executable selected contributions into the same lock,
      rejects conflicting Edition owners and unselected Provider Edition
      resources, and keeps invocation receipts outside content identity. The
      executable path checks an exact installed package, selected inputs, and
      expected derived reply bytes through the existing process-tree supervisor;
      mixed-mode and direct/Provider Edition cases preserve selected identity.
      Selected Edition resources now use one logical reference and exact bytes
      through direct, declarative, or executable delivery; altered resource
      bytes change the lock rather than being read ambiently.
      Focused Provider, supervisor, and module-boundary tests passed; static
      and package checks passed. The full behavior run passed 745 tests,
      skipped 2, with no test failures; branch coverage is 93.06% against the
      95% release gate, so `npm run check` remains red.
      An independently reproduced ancestor-symlink race leaves confinement
      under concurrent mutation unproved and explicitly limited; this is a
      release-blocking spec gap, not proof of escaping-input rejection. A
      bounded cap-std 4.0.3 macOS probe and alternative transport analysis are
      recorded in `docs/research/mechanism-evaluation.md`; cross-platform
      supply and a reviewed choice remain open.
      Installed executable conformance, complete dependency closure, and CLI
      dispatch remain open. The package and Provider modes have not passed all
      Task 3.2–3.3 or final workload gates. No integration or publication is
      admitted.
      Ruling: Provider-mode Edition selection names only the selected Provider,
      whose v2 manifest has at most one Edition item; direct mode alone names
      filesystem root and manifest. This removes transport-specific duplicate
      locators before global joining. If wrong, the unreleased Build Request
      shape changes; historical v1 Provider meanings remain untouched. The
      join rejects a missing or second Provider Edition, including byte-identical
      duplicates, and an Edition resource not bound by exact selected bytes.
      Cross-mode identity must include those resource bytes; no ambient Provider
      directory may supply them.
      Ruling: the unreleased v2 Edition descriptor requires a finite resource
      list; declarative files and executable selected inputs map each logical
      reference to exact bytes. Direct and Provider resource limits share the
      Edition authoring owner. No compatibility alias or fallback environmental
      read is added for the earlier incomplete draft shape.
      Ruling: external schema IDs and historical data fixtures remain explicitly
      versioned; source-code filenames name semantic responsibilities, not wire
      generations. All current version-suffixed code filenames were renamed,
      including the development migration tool. Internal mode readers are not
      new public package exports. Historical v1 paths remain until Task 7.2
      replacement parity permits their retirement; they are not a permanent
      parallel input authority. The module-boundary gate rejects new
      first-party version-suffixed source module filenames; a versioned data
      fixture remains historical contract evidence, not executable source.
      Ruling: package selection and execution ceilings have neutral owners
      consumed by both protocols; the process supervisor requires its caller
      to select the reply validator. Selected Provider modules may not import
      historical Provider implementations, as the existing module-boundary
      gate now verifies. This removes a hidden old-protocol default without a
      compatibility facade or a second supervision mechanism.
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
      bytes remain identical. This is macOS installed-input evidence, not a
      Candidate build, complete dependency observation, or native Linux/Windows
      conformance.
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
- [ ] 3.4 Test owner-routed non-authorizing findings and Provider retirement in
      `tests/edition-provider-conformance.test.mjs`: an assertion, editorial,
      adapter, or protocol gap goes to that owner; a mutable predecessor retires
      only after exact consumer parity and owner approval, while historical
      receipts remain immutable.

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
- [ ] 4.3 Extend `packages/publisher/src/semantics/change.mjs` and
      `packages/publisher/src/edition/evolution.mjs`;
      `tests/native-evolution.test.mjs` must detect
      changed qualifiers without cardinality change, selector membership, indirect
      claim dependencies, unknown read sets, and packaging-only changes. Report
      rebuild, semantic, media, human, acceptance, and publication obligations
      separately; do not transfer old approval automatically.

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
      Uninterpreted transformations fail rather than minting stronger claims;
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
- [ ] 5.2 Using the selected foundation from Task 1, provide an explainable
      neutral first build and bounded local refinement without author-written
      renderer code, duplicate facts, or pixel geometry. In
      `tests/neutral-authoring.test.mjs`, unsupported required font, layout,
      dimension, or semantic distinction fails with a named diagnostic rather
      than a substitute diagram or parallel generated-intent store.
      Partial feasibility: a tracked, permission-restricted, empty-PATH probe
      shows the existing verified LikeC4 supply yields repeatable WASM node and
      route geometry for one native view. The same private verified parser and
      bounded process-tree owner now serve a distinct source-bound layout
      request. The parent rejects missing/forged nodes, relations, invalid
      geometry, and dynamic views; an installed public consumer reproduces the
      layout after relocation. The layout alone is not a finished medium.
      The view choice is snapshotted before asynchronous supply reads and
      namespace-ambiguous native IDs fail closed. Nine focused layout tests,
      59 selected native/installed tests, static checks, package check, and
      strict OpenSpec validation pass. A first neutral static Scene now joins
      the exact medium assertion set to that layout, rejects forged/missing
      members, partial aggregates, and unsupported policy, and crops bounds to
      retained carriers. Its nine focused tests pass with 100% local branch
      coverage; a packed public consumer reproduces the selected Scene after
      relocation. The full behavior run passes 850 tests and skips 2; global
      branch coverage is 93.08% against the unchanged 95% release gate. No
      static SVG/PNG, interactive Scene/HTML, landing, or publication is claimed.
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
      toolchain rejection. Packed installation reproduces both media after
      relocation without the source repository. Exact built HTML passes Chrome
      offline, responsive, and axe WCAG 2/2.1 A/AA checks; legacy self-hosted
      golden identity was regenerated against selected installed bytes. Static,
      package, and strict OpenSpec checks pass. The latest full run passes 900
      tests, skips 2, and fails only the global branch-coverage floor
      (93.38% < 95%).
      Visible semantic coverage, human visual review, qualification binding,
      full platform evidence, and release remain open.
- [ ] 5.4 `tests/visible-coverage.test.mjs` rejects missing endpoints, changed
      plane/condition, hidden-only IDs or metadata, incomplete interactive
      overviews, backend badges, and non-disclosed private inputs. Bind actually
      consumed authoring bytes, selected visual policy, renderer, font supply,
      dimensions, and final artifacts independently per medium. Infeasible layout
      returns for editorial regrouping rather than silently dropping meaning.
      Partial: neutral static SVG now emits only opaque graphic IDs; its
      source-to-graphic map remains private and its digest is bound into
      Candidate v2 separately from the interactive map. The exact built SVG
      and HTML are checked in Chrome for visible carriers and source-namespace
      non-disclosure. Static assertion carriers now retain source-qualified
      node and relation references; a same-ID cross-namespace counterexample
      no longer collapses them. This proves those tested carrier observations, not full
      view/question coverage or reader acceptance.
- [ ] 5.5 Migrate `editions/self/` to the same public Build Request, Edition,
      and dual-medium compiler used by unrelated adopters. Preserve self-owned
      source meaning and selected flagship art direction, but remove hidden
      self-only compilation paths after exact semantic, static, interactive,
      installed, and visual parity. Exercise `tests/self-edition.test.mjs`,
      `tests/self-static-flagship.test.mjs`, and
      `tests/self-interactive-atlas.test.mjs` on the packaged public path.

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
- [ ] 6.2 Keep `packages/publisher/src/publication/` an optional local filesystem
      effect. In
      `tests/publication-contract.test.mjs` and
      `tests/pair-replacement.test.mjs`, require exact Candidate, qualifications,
      acceptance policy, named accepter, custody target, prestate, file-plan digest,
      and authorization; mismatch fails before effects and preserves prior output.
      Preview/export needs no custodian. Do not claim Git/Forge, hosted availability,
      or off-host DR from a local receipt.

## 7. Installed acceptance and release

- [ ] 7.1 Use a provisional exact package archive, not source-adjacent imports,
      to test replacement parity on frozen
      self, ETHOS, full AIGW, Client Projection, and di-effect inputs. Verify
      relocated offline build, common Provider conformance, source-delta update,
      native comparison, legacy replay, and recovery; record exact input, package,
      Candidate, and media digests in `conformance/`. These provisional bytes
      are not final release or human-review identities.
- [ ] 7.2 After provisional replacement parity, inventory and delete displaced Publisher-owned
      custom engines, redundant exports, dependencies, fixtures, and tests; keep
      only mechanisms with a distinct failing mature alternative. Verify
      consumer closure, `tests/package-boundaries.test.mjs`,
      `tests/module-boundaries.test.mjs`, package contents, and installed use.
      Do not delete source-owned art direction or immutable historical assets.
- [ ] 7.3 Update `docs/product-contract.md`, `README.md`,
      `docs/reference/operations.md`, `skills/architecture-publisher/SKILL.md`,
      examples, and migration handoffs for the actual successor command, schemas,
      limits, and
      ownership. `tests/ecosystem-projections.test.mjs` and
      `tests/product-identity.test.mjs` reject stale or rival command planes.
- [ ] 7.4 Promote the implemented delta requirements and role-based Purpose
      wording into active base specs before release freeze. Strictly validate the
      combined specs and prove valid v1 inputs still retain their historical
      meanings. The later Change archive must add no new normative behavior.
- [ ] 7.5 Select the SemVer successor and update package manifests, lockfile,
      and `CHANGELOG.md`. After Task 7.2 removes displaced runtime code, add
      behavior tests until the complete owned scope reaches at least 95% in
      statements, lines, branches, and functions; require `npm run check` to
      pass without relaxing inclusion or thresholds. Only then freeze final
      product inputs. From that frozen source, repack the exact installed
      product and rebuild final Candidates for all Task 7.1 workloads; rerun
      offline/relocation/recovery checks. Inspect every final static overview
      and HTML page in a real browser; exercise geometry, keyboard,
      accessibility, reduced motion, and no-network behavior. Obtain separate
      human judgments on final static and interactive bytes for faithfulness,
      readability, hierarchy, density, and visual quality. Do not reuse
      provisional Candidate identities or review after any selected input changes.
      Interim toolchain correction: host npm 11.19.1 propagated a personal
      `allow-scripts` setting into nested installed-package tests, producing 16
      `EALLOWSCRIPTS` failures. The test entry now clears inherited npm config
      and selects two distinct tracked empty config files, without editing host
      policy. Focused installed tests pass 9/9; static and package checks pass.
      Full behavior passes 819 tests, skips 2, and still fails only branch
      coverage at 92.89%; no release admission is inferred.
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

## 8. Source handoff and closeout

- [ ] 8.1 Send AIGW's single writer exact successor protocol/package evidence,
      Client Projection versus whole-product limits, declarative journey, media
      identities, and rollback criteria. AIGW separately admits its own migration,
      acceptance, release, and retirement of displaced materialization.
- [ ] 8.2 Send ETHOS's single writer a retained-versus-displaced integration
      map and exact executable journey. Preserve ETHOS-native claims, Lane
      cooperation/competition/experiment/all-drop meaning, repository-quality
      SSOT, governance, independent-verification predicates, and flagship art
      direction; ETHOS separately admits semantic/media/rollback acceptance.
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
