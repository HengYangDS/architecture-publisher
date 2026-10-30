# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning]. Versions below `1.0.0`
remain pre-release contracts and may contain incompatible changes.

## [Unreleased]

## [0.4.0] - 2026-10-27

### Added

- A model may name its language: English, the default, Simplified or Traditional Chinese, Spanish or Korean. The
  words the publisher writes itself, its note headings, legend, derived details and summaries, and how it punctuates
  a list or a sentence, follow it, and the page and its diagrams speak it. `archpub import likec4 --locale` sets it.
- Lines break where the text's writing system allows: at spaces, and between Han and Kana characters, with closing
  marks kept at the end of a line and opening marks at the start of the next. A no-break space keeps the words beside
  it on one line, on the posters and the page.
- Noto Sans 2.015 follows Noto Sans CJK SC for the Latin, Greek and Cyrillic letters the CJK face lacks. Text in a
  right-to-left or shaped script is refused with `script_unsupported` rather than drawn unjoined.
- `archpub build` and `check` take `--media` to deliver the posters, the page or both, `--png` for the poster PNG
  widths, from 1 to 6000 px, and `--quality standard` to deliver the closest pages as drafts. `archpub --help` and
  `--version` print the usage and the version.
- Architecture Publisher is released under the MIT License.

### Changed

- **Breaking:** Architecture Publisher is now a general model-to-media publisher. One Architecture Model, a JSON file
  written by a person or an agent or imported from LikeC4, becomes posters of its views, one interactive page and a
  manifest through `archpub check`, `build`, `import likec4`, `accept` and `publish`. A model declares at most
  four views. The Source Bundle, Claim
  Model, Edition, Candidate, Provider, Qualification and publication-plan inputs and commands are removed; earlier
  releases keep them.
- **Breaking:** A grid-first layout replaces the ELK composition. Cards sit on shared row lines of one column
  lattice, each poster card as wide as its text and the cards of one column one width; placement is exact, relations
  run as buses, corridors, lanes and straight arrows through the channels between rows, and a layout with a diagonal,
  a shared segment, a wire through a card or a touching label is never drawn: a view that no layout draws is refused.
  A refusal names every view it refuses. Rows that a view does not declare minimize the rows their relations skip.
- **Breaking:** Posters are 16:9 pages of 2400 × 1350 px with no text below 14 px, delivered as `page-<n>.svg` and as
  PNG at 2400 px or the widths a build names. A page holds one to three views as plates under a masthead, beside a rail
  of text, or with its text set in the corners its figure leaves free. Cards are as large as their text, a sparse view
  is set at a larger type step of up to 1.8 times, tier labels stand in one column before the figure, or before the edge
  each tier starts at when no page with one column balances, a tier that wraps has its label level with its first row
  beside a bracket over its rows, and the edition is grouped into the fewest crossings and route defects, then the fewest
  pages that miss the balance gates for the largest empty area, blank bands, holes and centre of mass, each page
  preferring the composition with the fewest crossings and route defects. A page whose figures already stand at the
  largest type step, or at the largest step they fit at with only its largest blank area or a blank band over the gate,
  is delivered as sparse, since its model has too little to fill it; a build at standard quality delivers any other
  closest page as a draft; otherwise a view no passing page holds is refused with `poster_unbalanced` and its closest
  page's measures. The manifest records every page's admission and misses, and per-relation evidence moves to it.
- **Breaking:** The interactive medium is one vendored, unmodified Archify 3.2.0 explainer page that answers the model's
  question view by view: its conclusion beside a list of its panels, then one panel per view with its native
  architecture diagram, named by the view, which opens Archify's full viewer, and steps that light each component and
  cite its first source at the pinned revision. Each diagram is chosen on Archify's own routes from three widths and
  three row wrappings, with the grid's connection sides and with Archify's own side planning. It never takes routes a
  reader reads as one, side by side, lined up end to end or two cards' routes into one point, or a route along a card's
  or the boundary's edge, while another passes without; then it takes the fewest crossings, the fewest labels a reader
  takes for another route's, a card's or another label's, one of which comes nearer than 8 px or than one and a half
  times the label's own route, then a preview beside its steps, routes doubled into one line, routes over two bends,
  crowded labels and crowded route ends. The connections involved take other sides while that improves the diagram,
  and a label still misplaced, or on another route's line past its corner, is pinned on or beside its own route in up
  to three rounds, by an offset from where Archify anchors it, which keeps the route's ends spread.
  A card shows a detail whole or not at all, and the steps carry every detail. The diagram passes Archify's checks at
  the build's quality profile, showcase unless the build asks for standard, or the build is refused with a `page_*`
  code and Archify's findings.
  Sources Archify will not cite, such as files under a secrets directory, are withheld and recorded in the manifest.
- A failure that is not a refusal or usage error exits with status 3 and an `internal_error` JSON body. Git and
  Archify run with only the caller's path, home and temporary-directory variables, and `SystemRoot` on Windows.
- Deliveries are staged and byte-reproducible on one platform. The manifest keeps each poster page's measures, each diagram's route
  measures and the details, statuses and sources of every component and relation. `archpub accept` records a reviewer against the manifest digest, and
  `archpub publish` copies only an accepted delivery and never replaces a different published one.
- `VERSION` is the only maintained product version. Required package versions and internal pins are generated from
  it; qualification rejects stale projections without changing package or lock bytes.
- Refresh the locked development and CI supply: Node 26.12.1, npm 12.2.1, OpenSpec 1.15.0, Knip 6.43.0, Pixi 0.83.0
  and Mise 2026.10.19. The remaining development-tool advisories keep their explicit trusted-input,
  isolated-execution and disabled-install-script acceptance.
- Admit the observed macOS, Linux and Windows ARM64 Raster witnesses for Rust 1.99.1 and `wasm-bindgen` 0.2.129 after
  two relocated frozen builds and canonical behavior comparison. Packaged renderer bytes remain unchanged.

### Removed

- The ELK, Dagre, libavoid and SVG pan-and-zoom supplies, the custom interactive renderer, JetBrains Mono, the
  generated validators and the research-only composition tooling.

### Fixed

- Posters render on Windows: the raster renderer and the typefaces load through file URLs.
- LikeC4 errors name their file relative to the workspace on Windows too.
- The page chooser measures each candidate diagram once per process, and CI admits the browser by opening one
  standalone page instead of building the browser test's pages twice, which hosted Windows runs had spent their
  time limit on.
- A poster wire no longer turns just beside a card it does not connect when a channel can take another label row
  instead, so it does not read as that card's; such turns, and two wires within 40 px of each other for more than
  96 px, are counted as route defects.
- The raster rebuild journey renders a poster the current publisher composes and extracts the frozen source where
  Windows tar can.
- Locked CI Rust installation reconciles the required `cargo`, `rustc` and host standard library components in
  retained tool caches.
- Native CI retains only each job's verified tool cache across checkout, confines Mise's package store to the job,
  enables Git long paths on Windows through job-scoped configuration and selects a registry-verified non-root
  Playwright image on Linux.
- Native CI admits locked rootless Linux compiler and xz prerequisites through Pixi and discovers the Windows Visual
  Studio tools before frozen Raster rebuilding.
- Raster source verification uses a platform-native, read-only Node entry; native Cargo and `wasm-bindgen` own
  compilation, and frozen renderer bytes and historical release artifacts remain unchanged.

## [0.3.0-alpha.15] - 2026-10-04

### Added

- Bounded independent interactive appearance with native style and light/dark choices, preserving selected source
  meaning, typography and authored geometry.
- Native exploration over checked logical relations and scene occurrences, with neutral Inspect identity retained where
  grouping or repetition limits queries.

### Fixed

- Query sharing remains selected when the reader opens Export. Copied native reading links address the standalone
  publication and its exact page.
- Back, Forward, reload and rapid page changes restore the native addressed selection without hidden iframe history
  entries or automatic playback.
- Every physical relationship carrier remains inspectable even when a shared logical route has already supplied its
  label.
- Static view classification follows its own selected assertions, not unrelated sibling selections. Pure claim text uses
  bounded content-dependent flow.
- Static line breaks preserve source whitespace; fragment bounds exclude notes that are independently composed and
  checked by the complete figure.
- Native relationship captions use readable text paint across offered styles without changing source geometry or the
  native reader's control ownership.
- Clipboard actions respect the document's effective permissions policy; opaque readers use native text-copy fallback
  without invoking a forbidden API.
- Inspect cards retain readable title and detail colors in idle, hover, selected and keyboard-focus states across every
  offered style and light/dark theme.

## [0.3.0-alpha.14] - 2026-10-03

### Changed

- Native qualification uses two concurrent test files through Node's existing runner. All test files, offline
  installation checks, child deadlines and four coverage floors remain; no runtime scheduler or persistent cache is
  added.
- The CoreText asynchronous font-binding counterexample rejects an originally mismatched digest before compilation.
  Actual native font, request and output snapshot checks remain in the existing measurement case.

## [0.3.0-alpha.13] - 2026-10-03

### Fixed

- Raster third-party source notices identify the selected source archive and Cargo.lock instead of stale predecessor
  bindings. Required license text and renderer runtime bytes are preserved; supply checks reject mismatched headers.

## [0.3.0-alpha.12] - 2026-10-03

### Fixed

- Static qualification respects explicitly unarrowed segments: short junction bridges retain their actual shaft, without
  an invented arrowhead or arrow terminal minimum. Arrowed and historical default-arrow checks, attachment, source-route
  direction and glyph clearance remain enforced.

## [0.3.0-alpha.11] - 2026-10-03

### Fixed

- Authored static and interactive labels can declare their scene-local node owner. Exact structural membership and
  measured containment are checked; unrelated nodes, internal primitive boundaries, text, routes and arrowheads remain
  obstacles. Ownerless scenes retain their existing behavior.

## [0.3.0-alpha.10] - 2026-10-02

### Fixed

- Native verification preserves setup timeout errors, signals and diagnostics instead of reporting a missing exit status
  without its cause. Disposable offline supply installation avoids unnecessary manifest and lock writes without changing
  sequential installation, runtime deadlines or coverage.

### Changed

- Canonical specifications carry the complete authored qualification and single-parent stage-deadline contracts. General
  SDD research resides with the ETHOS topic owners; publication keeps its own custody decisions.
- Closeout separates completed archive prerequisites from later native lifecycle effects, without declaring an
  unexecuted archive or retirement.

## [0.3.0-alpha.9] - 2026-10-02

### Added

- Explicit authored Claim and editorial statement text in both independent media. Opaque original statements need no
  fabricated document box; typed Claims retain exact structural owners. Required text cannot silently fall back to a
  shared subject label, and existing valid anchored v1 inputs retain their meanings and limits.
- Measured standalone statement text in the Archify adapter, with exact bundled font bytes, native desktop readability
  and geometry checks, page-local runtime receipts, and source/Edition-separated keyboard inspection. Wording remains
  unverified rather than pretending identity coverage proves a paraphrase.
- Finite circle, rectangle, line and polyline painting in authored media. Derived ink bounds remain separate from
  semantic ports; checked geometry-only adornments add no source coverage or inspection. Cancelling filled contours,
  false envelopes, mixed legacy painting and excessive path budgets are refused.
- Exact ordered relation and Edition-owned editorial routes over shared literal segments. Physical junctions remain
  geometry, each source reference retains independent inspection, and every route checks actual contacts, terminal
  direction, selected stroke and arrow paint without transitive source claims.
- Exact authored font resources across direct, declarative and executable inputs. Selected static TTF faces, weights and
  distribution references bind native shaped ink, exported fonts and independent SVG/PNG/HTML painting; absent glyphs,
  changed pins and unsupported text fail without ambient fallback.

### Fixed

- CoreText stages use one parent-owned execution deadline and native tree reclamation, without a competing Worker
  timeout. Diagnostic-read failures remain separate from the primary timeout; stage ceilings and fail-closed cleanup are
  unchanged.
- Authored static and interactive diagrams retain every graphic occurrence of one selected semantic member without
  cloning source entities or relations. Claim anchors remain bound at each site; inspection rejects conflicting facts
  and duplicate reference/graphic pairs.
- Static typed Claims retain both visible text and every exact structural owner; neither proof replaces the other. A
  missing relation or subject owner is refused without substituting another anchor.
- Aggregate connectors reject reversed or ambiguous source relations even when another member points forward. Internal
  context remains bound to its owning node rather than borrowing the connector's arrow direction.
- Browser test resources release dependants before HTTP servers through native async disposal. The repository uses its
  existing process-isolated Node test workers, without another scheduler or relaxed coverage floor.
- One native Markdownlint configuration covers maintained Markdown, rejects extra simple-list spacing, and preserves
  embedded-language, raw HTML, historical archive and supplier bytes.
- Native measurement reply admission has one private protocol owner with direct portable counterexamples.
  Invalid-response fixtures preserve a finite live Worker for reclamation; actual premature exit remains cleanup
  uncertainty. Coverage scope and all four 95-percent thresholds remain unchanged.

## [0.3.0-alpha.8] - 2026-10-02

### Changed

- Development and CI select Node.js 26.10.0 and npm 12.2.0 through native `devEngines` admission. The installed Core
  still supports Node.js 22 and later; known npm bundled-dependency advisories remain subject to the scoped CI
  exception.
- The repository coverage gate uses one native c8 configuration and emits a fresh JSON summary for all four 95-percent
  thresholds.
- The development workspace uses OpenSpec 1.14.0. A relocated task fixture verifies the official apply instruction's
  source path and one-based checkbox line. This development-tool upgrade leaves the released product unchanged.

### Fixed

- CoreText workers retain a finite live lifetime after their reply so parent group reclamation cannot race natural
  worker exit. Coverage is flushed before forced termination; stage ceilings and strict cleanup failures remain
  unchanged.
- Installed-use tests invoke the selected native npm CLI instead of a Windows command shim. Post-execution identity
  tests retain the existing Provider bound rather than an accidental two-second fixture limit; timeout tests remain
  bounded.
- Repository checkout preserves generated and supplier bytes independently of host CRLF settings. Native Windows CI
  clones rather than retaining a previous fetch checkout with transformed files; generation comparisons remain exact.
- ELK layout workers retain a bounded live root after both success and error replies and flush enabled coverage before
  native reclamation. Root loss still rejects cleanup; layout geometry, stage ceilings and static media are unchanged.
- File publication flushes owner, payload and metadata files through writable handles instead of reopening the owner
  file read-only. Effect results declare unsupported Windows directory flush and unqualified power-loss recovery;
  required flush errors still reject installation.
- Native-platform tests distinguish filesystem paths, import URLs, npm command shims and interruption exit observations.
  Historical Windows repacks verify complete source file sets and bytes without claiming POSIX TAR-header equality.
- Raster execution classifies a nonzero exit without reply bytes as process failure, preserving malformed-reply and
  explicit worker-error diagnostics.

### Added

- Native Windows ARM64 CI shares the complete repository gate. Linux, macOS and Windows review/protected projections
  select distinct Runner trust roles.

## [0.3.0-alpha.7] - 2026-10-01

### Fixed

- CoreText compilation and measurement use separately bounded owned process groups. The parent reclaims each group
  before the next stage or scratch removal, retains bounded primary diagnostics and cleanup uncertainty, and preserves
  exact tool selection and the existing 120-second/30-second limits.
- Native macOS CI uses one project-local GitLab resource group while retaining separate review and protected Runner
  identities. This removes job overlap, not every possible compiler stall; original failing jobs remain evidence.

## [0.3.0-alpha.6] - 2026-10-01

### Added

- Native macOS ARM64 CI runs the existing repository gate, including CoreText tests, with separate review and protected
  Runners selected by GitLab ref protection. CI jobs use a reproducible artifact permission mask for historical
  npm-package replay.
- A finite static responsibility form composes editor-attributed roles and handoffs with exact source relations, linked
  Claims, qualifiers, and limits through its own SVG/PNG Scene. Unsupported forms fail before Candidate output; traffic
  is not reinterpreted as authority or source endorsement.

### Changed

- Current Edition guidance starts with the selected-input Project and a concrete field-to-reader-choice map, separating
  retained historical v1 input from new authoring. Package guidance explains inputs, the build command, output records,
  and the limits of question coverage; export research is not advertised as implemented PDF or PowerPoint support.
- Neutral interactive graph pages carry measured, wrapped relation wording directly on their routes. Compact source
  Claims retain visible applicability; full records move to Inspect without duplicating primary graphic identities. The
  existing font measurer is reused and its selected supply is recorded.
- Replaced the unreleased neutral interactive Cytoscape path with pinned ELK geometry, exact SVG painting, and
  viewport-only pan/zoom. Parallel relations, cycles, self-loops, group containment, full arrow bounds, and cached-page
  restoration have explicit regressions. Eligible long causal graphs can use ELK wrapping; static geometry remains
  independent. The unreleased library export is now `renderers/interactive`, with no compatibility facade.
- Interactive responsibility pages now present roles, selected source nodes and relations, editorial handoffs, and
  linked Claims in one bounded visual map. A selected predicate keeps its spelling; an unlabeled source relation gains
  no invented predicate caption. Page-local SVG identifiers keep titles, descriptions, and arrow markers distinct across
  pages.
- Current product documentation separates Candidate construction from qualification, named acceptance, and local effect
  authorization; historical release references use absolute Forge tag URLs rather than invalid local filesystem-relative
  paths.
- Interactive responsibility pages now use a higher-contrast source-relation metadata tone. A source-preserving
  four-role trial exposed a WCAG AA failure in the former tone; the corrected neutral renderer changes interactive bytes
  only and does not transfer prior media approval.
- Successor builds no longer execute a Provider solely because its manifest is named by an input file. Executable
  materialization now requires the invoker's separate exact `--execute-providers` selection; direct and declarative
  builds need no such option. Historical released v1 input behavior is unchanged.
- The first-party self Edition now authors one Edition Project directly. Its static overview selects structural
  assertions, while the eight interactive views select the exact Claim facts. Preparation no longer emits an editable
  legacy Edition or a self-only publication plan; signed historical releases retain their original files and meanings.
- Corrected the current self-model's authoring schema and direct Build Request selection. The generated Source Bundle
  remains audit evidence, not a second selected build input; a formerly asserted Bundle-to-Build edge is removed.
- Kept dated ETHOS and AIGW handoffs as historical conformance fixtures, not live authorities for the self-Edition. Its
  successor adopter relations now describe targets requiring source-owner acceptance; removed the obsolete `0.2-pending`
  publication condition. The changed packages use a new `0.3.0-alpha.6` identity without altering the signed alpha.5
  release.
- Neutral interactive source controls now project the diagram's selected node or relation through `aria-pressed` and a
  per-page `role=status` live region without moving keyboard focus. This does not qualify a source Edition's static text
  alternative or prove a particular screen reader's behavior.
- Neutral interactive pages with typed source claims but no graph now retain editor-attributed assertions in Page
  evidence instead of hiding them. Source quantifiers and stronger editorial propositions remain visibly distinct; this
  does not validate either proposition's underlying truth.
- Authored static Scenes may select a description distinct from the visible subtitle. SVG exposes name and description
  separately; the self-Edition now authors a target-flow alternative. Missing adopter-specific descriptions remain an
  accessibility acceptance limit, not inferred Publisher content.
- An Edition view may declare reasoned source-qualified member pairs that must not appear in one visual group. The
  compiler rejects a conflicting group before layout instead of presenting a misleading aggregation.
- An authored static canvas now records visible free wording as unverified even when its source-to-graphic bindings
  pass; exact geometry is not a judgment about the wording's meaning.
- Static and interactive media now visibly attribute free title and summary text to the Edition editor and state that
  source endorsement is not evidenced by the diagram. The wording still requires semantic and human review.
- Neutral static SVG/PNG retains reader-question limits and source status but no longer prints compiler method-limit
  codes as figure copy. Each exact method limitation remains in the Candidate and interactive disclosure; neither medium
  gains acceptance from this presentation change.
- Claim Model entity and relation views may omit editorial visual groups. The selected Dagre supply renders their flat
  structure without inventing group membership; claim-only views retain their separate claim-card composition.
- A sole neutral raw entity/relation view now uses the same question-led figure composition as multiple views, rather
  than placing its question and source notes in a separate side rail. An upstream authored view retains its own selected
  layout. This changes affected static media bytes.
- Neutral structural nodes now share one measured, 32-unit-grid box size per view. Dagre prefers regular-row alignment
  and falls back to balanced placement only when a relation caption cannot clear the regular routes. Longer labels still
  require sufficient space rather than smaller text.

## [0.3.0-alpha.5] - 2026-09-29

### Changed

- Updated the pinned development image to Node.js 26.10.0 and the direct `@types/node` and Prettier dependencies to
  their latest stable releases. The Core package still supports Node.js 22 at runtime.
- Updated the selected offline Archify renderer from 2.16.0 to 3.0.1. The adapter binds Archify's required `meta.output`
  to a private candidate slot while preserving the caller's input digest and explicit destination. It disables Archify's
  update check during rendering and uses the release's self-contained, licensed font bytes instead of injecting a second
  font set. Interactive artifact bytes change and require new exact-byte acceptance.
- Replaced the interactive reader's dead-end source-code placeholder and page-wide fact dump with one reversible
  `Inspect` state. It indexes visible subjects, preserves every selected record, distinguishes source identity from
  source content, and returns keyboard focus to the invoking graphic or control.
- Reconciled current Provider v2 and source-adopter migration guidance with the signed `v0.3.0-alpha.4` release, without
  treating Publisher release as source acceptance or independent off-host recovery.
- Moved the recorded typography reader from the SVG renderer surface to the Scene authoring surface as
  `createRecordedMetricReader`. Existing signed releases retain their original API and bytes.
- Moved Build Request joining to private compiler input coordination and removed its low-level Provider export. The
  public `archpub edition build` operation remains the complete consumer path.
- Moved authored Scene pre-render geometry rules to the Scene owner and emitted SVG-path inspection to Qualification.
  The compiler coordinates both without defining either predicate.
- Separated bounded file input and strict protocol values from Source Bundle meaning. Independent editors receive two
  file-input operations; the Source subpath no longer exports generic file and validator primitives.
- Moved raster Source Bundle selection and CoreText result packaging to the rendering owner. Resvg and CoreText backends
  now expose byte-level operations without Source Bundle authority; the compiler no longer creates a temporary bundle to
  rasterize its already-selected SVG. The existing CLI command contracts remain, and representative raster and
  measurement outputs passed exact-byte comparison against the previous work-lane HEAD. The old direct backend function
  names are removed from this unreleased successor surface.

### Fixed

- Overrode Chevrotain's exact vulnerable `lodash-es` transitive pin with the patched 4.18.1 release and regenerated the
  selected LikeC4 parser supply and notices from the lockfile. The selected parser's executable code is unchanged; its
  provenance comment and supply identity are renewed.
- Standalone interactive composition rejects declared external page assets, including URL-bearing resource attributes
  and CSS imports or URLs, before emitting a Candidate; unsupported CSS image sets also fail. A restrictive browser
  Content Security Policy blocks undeclared network effects; browser observation still checks blocked assets, incomplete
  rendering, and executable behavior.

### Removed

- The redundant Archify-specific font injector; the verified shared font supply remains in use by the other media
  renderers.
- The unselected alternate interactive layout and its automatic camera behavior. The standalone reader keeps one
  complete graph, source lists, pan, zoom, and explicit Fit.

## [0.3.0-alpha.4] - 2026-09-28

### Added

- Added exact-subject, non-authorizing diagnostics for invalid selected Claim Model applicability and unanswered Edition
  view questions.
- Added one versioned Build Request and Edition Project path for direct, declarative-Provider, and executable-Provider
  input selection through the existing `archpub edition build` command. Selected bytes, source claimants, derivations,
  and unresolved dependencies remain distinguishable.
- Added a bounded LikeC4 importer for supported native constructs. Unsupported or opaque meaning is rejected or
  disclosed; generated parser identities do not become source or editorial authority.
- Added independently composed static SVG/selected-width PNG and standalone interactive HTML from one selected Edition,
  including source-owned, data-only visual refinement and a first-party installed self-Edition. One authored static
  canvas can cover all ordered static views; a selected relation supplies its exact endpoint members without duplicate
  selections.
- Added Candidate v2 binding for the exact input lock, selected semantic and medium-specific supplies, scenes, and
  artifacts. Candidate replay and the v2 Qualification Set bind submitted observations without authenticating a
  claimant, verifier, or accepter.
- Added an optional qualified local publication path with separately named acceptance and effect authorization, exact
  prestate checks, replacement, and recovery. It does not publish Git or Forge refs or establish off-host custody.

### Changed

- The first-party self-Edition now authors portable inputs for the generic compiler rather than owning a parallel build
  engine. Source products retain their own claims, Edition choices, acceptance, and release decisions.
- Neutral interactive geometry uses pinned Dagre layout and Cytoscape interaction, with selected-source and
  visible-carrier checks; static and interactive media do not share geometry or approval.
- Updated the official OpenSpec development validator to `1.13.2`; this tooling update does not change compiled runtime
  or historical release bytes.
- An installed build proves only its selected inputs and effects, not complete upstream read closure, source-domain
  truth, adopter acceptance, hosted release, or independent off-host recovery.

### Removed

- Removed the displaced self-only build engines and live Atlas composer from the successor path. Historical signed
  artifacts and valid v1 input meanings remain unchanged.

### Fixed

- Qualified Edition file plans, journals, and receipts retain `static` and `interactive` media keys; the raw
  file-integrity pair retains `native` and `atlas` without sharing media slots.
- Kept source-selected text-to-geometry clearance distinct from text-to-text spacing. Historical scene audits retain
  their overlap-only text-pair rule; successor authored canvases still enforce an explicit five-unit floor.
- CoreText request preflight can be exercised without macOS host tools; unsupported hosts still reject actual
  measurement.
- The first source-list jump now centers its selected graph element after zooming from a fitted overview.
- Standalone interactive HTML now declares an inline empty favicon so a local reader does not make an implicit
  `/favicon.ico` request.
- Authored static canvases now reject near-contact text as well as strict glyph overlap. The compiler applies a
  technical font, owner-inset, text-to-paint, and terminal-route floor; passing it does not imply visual acceptance.
- Current installed-package content is reported as separate build/replay execution evidence, not Candidate identity or
  original-builder provenance. Policy-backed qualification reports remain exactly derivable from their selected
  Candidate, Qualification Set, and Policy.
- Missing selected renderer inputs, Archify supply members, or output parents now fail with scoped diagnostics before
  any final HTML is created.
- A destination parent removed or replaced after publication planning now fails before writer-lock preparation, without
  recreating it or touching foreign bytes.

### Security

- Executable Provider process-tree supervision bounds ordinary descendants but is not an operating-system, filesystem,
  network, or credential sandbox.

## [0.3.0-alpha.3] - 2026-09-24

### Fixed

- Corrected the release-date mismatch caught by the signed-tag CI gate for `0.3.0-alpha.2` without changing that
  immutable tag or its source bytes.

## [0.3.0-alpha.2] - 2026-09-24

### Changed

- Signed candidate tag only. The tag pipeline rejected a mismatch between its September 24 tagger date and the
  Changelog's former September 23 date. No GitLab Release or package assets were published; this candidate is superseded
  by `0.3.0-alpha.3`.

- The self-Edition binds its product version to the explicitly selected core package source instead of a hard-coded
  release string.

### Fixed

- Executable Provider conformance now relocates the exact Publisher package required by allowed public-contract imports,
  while rejecting undeclared or ambient dependency resolution.
- Executable Provider execution now supervises the selected worker and ordinary descendants through reply validation and
  bounded cleanup. Failed cleanup prevents a passing receipt without claiming containment of deliberate escapes.

### Security

- Bounded worker cleanup preserves unrelated processes and treats an unobserved owned process tree as an unsuccessful
  materialization.

## [0.3.0-alpha.1] - 2026-09-22

### Fixed

- Source reconstruction now treats each compressed npm archive digest as an exact asset observation while comparing
  portable package identity through the uncompressed tar-content digest.
- Hosted Linux verification no longer assumes that different gzip implementations reproduce macOS archive bytes.

## [0.3.0-alpha.0] - 2026-09-22

### Added

- Added the versioned Edition Provider contract with declarative and executable delivery modes that materialize the same
  Source Bundle, Claim Model, Edition, and optional evolution values.
- Added provider-neutral conformance journeys for exact identity, relocation, determinism, dependency direction,
  resource bounds, and rejection of downstream authority claims.
- Added source-owned migration contracts for ETHOS and AIGW. These are migration inputs only; neither source repository
  migration is claimed by this release.

### Changed

- Signed candidate tag only. No GitLab Release or package assets were published; hosted cross-platform verification
  failed and this candidate is superseded by `0.3.0-alpha.1`.
- The self-Edition now crosses the declarative Provider boundary and exercises the same public materialization path
  expected of other source products.
- Workspace, core package, and self-Edition versions advance together to `0.3.0-alpha.0` under Semantic Versioning
  2.0.0.
- Direct Edition builds remain supported. A Provider is an optional, source-owned materialization boundary rather than a
  second command plane.
- This pre-release does not promise compatibility with `0.2.0-alpha.0`; callers must select the exact package and
  Provider contract identities they consume.

### Fixed

- Executable Provider selection now binds every regular package file, rejects undeclared external dependencies, and
  verifies package content immediately before and after execution.
- Direct-build documentation no longer implies that a Provider is mandatory.

### Security

- Executable Providers run in a bounded child process with closed input, explicit output limits, a hard timeout,
  isolated scratch state, and fail-closed identity checks. This boundary contains failures but is not an adversarial
  operating-system sandbox.

## [0.2.0-alpha.0] - 2026-09-22

### Added

- Added Claim Model v2, the first-class Edition contract, semantic evolution, independent static and interactive scenes,
  conjunctive qualification, and recoverable publication.
- Added the `architecture-publisher` package and `archpub` CLI with offline source, build, rendering, qualification,
  publication, and recovery journeys.
- Added self-host, ETHOS, and AIGW conformance evidence across the public product contracts.

### Changed

- Renamed the product, package, command, and repository from the earlier Architecture Publishing identity to
  Architecture Publisher.
- Split the generic core from source-owned Editions and made the Claim Model the sole semantic runtime authority.
- Package archive identity and portable uncompressed content identity are now recorded separately.

### Fixed

- Removed adopter-specific identity from generic renderer supply and tightened source-path, module-boundary, exact-head,
  and clean-clone release checks.
- Corrected self-Edition source inputs, typography, and conformance evidence.

## [0.1.0-alpha.7] - 2026-09-20

### Added

- Composed independent static and interactive artifacts into one semantic publication contract with separate medium
  qualification.

## [0.1.0-alpha.6] - 2026-09-19

### Added

- Consolidated product contracts and added source-bound structural evolution.

### Changed

- Compacted browser evidence without discarding observations.

### Fixed

- Completed raster worker input before synchronous execution.

## [0.1.0-alpha.5] - 2026-09-19

### Added

- Bound source changes to explicit visible carriers.

### Fixed

- Enforced a deadline for signal-resistant raster workers.

## [0.1.0-alpha.4] - 2026-09-19

### Added

- Compiled source-bound changes and view obligations.

## [0.1.0-alpha.3] - 2026-09-19

### Fixed

- Aligned the retirement note while preserving continuous refresh alternatives.

## [0.1.0-alpha.2] - 2026-09-18

### Fixed

- Aligned semantic reading groups and refreshed stable renderer supply.

## [0.1.0-alpha.1] - 2026-09-18

### Added

- Published source-bound candidates with recoverable Edition replacement.

## [0.1.0-alpha.0] - 2026-09-18

### Added

- Established portable, content-bound source intake and the initial source-preserving architecture publication pipeline.
- Added offline interactive and static rendering, explicit installed-file packaging, paired-file installation, recovery,
  and acceptance evidence.

### Fixed

- Closed filename, SVG reference, raster worker, font, renderer notice, and protected-branch integrity boundaries found
  during initial qualification.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
[0.4.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.4.0
[0.3.0-alpha.15]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.15
[0.3.0-alpha.14]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.14
[0.3.0-alpha.13]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.13
[0.3.0-alpha.12]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.12
[0.3.0-alpha.11]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.11
[0.3.0-alpha.10]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.10
[0.3.0-alpha.9]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.9
[0.3.0-alpha.8]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.8
[0.3.0-alpha.7]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.7
[0.3.0-alpha.6]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.6
[0.3.0-alpha.5]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.5
[0.3.0-alpha.4]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.4
[0.3.0-alpha.3]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.3
[0.3.0-alpha.2]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.2
[0.3.0-alpha.1]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.1
[0.3.0-alpha.0]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.3.0-alpha.0
[0.2.0-alpha.0]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.2.0-alpha.0
[0.1.0-alpha.7]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.7
[0.1.0-alpha.6]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.6
[0.1.0-alpha.5]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.5
[0.1.0-alpha.4]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.4
[0.1.0-alpha.3]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.3
[0.1.0-alpha.2]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.2
[0.1.0-alpha.1]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.1
[0.1.0-alpha.0]: http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/tags/v0.1.0-alpha.0
