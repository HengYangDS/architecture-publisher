# Design

## Decision and intent

Keep one source-bound publication compiler. Reuse each selected renderer's
existing reader rather than hiding it and rebuilding a parallel reader.
Separate source meaning, per-medium composition, native exploration and
appearance. A generic product must accommodate distinct systems and several
qualified visual choices without weakening any shared acceptance predicate.

The requester explicitly identifies Play Story as an example, not a required
feature. The target is a better source-bound explanation with lower reader,
authoring and maintenance cost. Preserve required architectural meaning and
reading outcomes; do not automatically inherit legacy interaction. A deliberate
removal is valid when those outcomes remain complete and the designated source
owner accepts the replacement. Historical acceptance alone does not require
reproducing a button, animation, page count or layout.
The single writer makes and verifies the implementation decisions under the
requester's standing authorization. Self-review is not independent endorsement.

## Complete delivery scope

The current goal includes eight finite outcomes. The human withdrew PDF and
PPTX support on 2026-10-05; independently composed PNG and desktop HTML remain
the selected media. This scope revision supersedes earlier media commitments,
including the original goal wording. The table maps outcomes to native owners
and task acceptance, not a second progress store. Checked predecessor tasks
retain their original evidence scope.

| Outcome                       | Existing responsibility                       | Remaining task acceptance |
| ----------------------------- | --------------------------------------------- | ------------------------- |
| Inputs, authority and DX      | Source/Provider intake and Edition authoring  | 4.1-4.2                   |
| General publication and media | Composition, renderers and qualification      | 5.1-5.2                   |
| AIGW adoption                 | Source-owned Client and Product Editions      | 6.1-6.2                   |
| Minimal ETHOS flagship        | Source export/selection and Edition migration | 7.1                       |
| ETHOS north-star feedback     | Existing source research and evolution owners | 7.2                       |
| Broad research settlement     | Current ETHOS research owner                  | 8.1                       |
| Artifact custody and recovery | Designated release and local delivery owners  | 9.1-9.2                   |
| Native quality and closeout   | Native toolchain, installed ETHOS and GitLab  | 10.1-10.3                 |

Sources own repository-specific versioned meanings. Publisher owns only generic
input, composition and publication contracts. The editor owns audience,
questions, selected scope and explanatory choices; the designated accepter and
target policy own acceptance and publication respectively. Co-location, matching
names, source bytes and passing builds do not transfer those authorities.

The first active day maps all outcomes into this Change's design, specs and
tasks. Estimated execution is three to five active working days. At
2026-10-10 18:00 Asia/Shanghai, stop mutation and report exact remaining gaps.
That cutoff is not completion, deletion or a waiver of mandatory acceptance.
Unavailable source approval or an unqualified installed ETHOS proof successor
remains open unless the requester explicitly accepts its disposition.
Advance independent tasks while preserving the dependent gap.

## Outcome-first selection

The hard constraints are exact selected meaning, complete declared reader
questions, usable complete figures, and shared quality rules. Presentation
mechanisms are replaceable means. Evaluate the same source and reader tasks
before choosing any additional mechanism:

| Outcome                 | Evidence                                                                                         | Decision boundary                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Faithful meaning        | Checked selected assertions, conditions and visible carriers                                     | No invented relation, hidden qualification or false runtime claim     |
| Clear explanation       | Readers can follow the selected structure, responsibility and mechanism without a mandatory tour | Preserve complete figures and manual control                          |
| Restrained presentation | Actual page, label, connector, contrast and clearance inspection                                 | Animation cannot compensate for poor composition                      |
| Product leverage        | Equivalent public inputs across unrelated sources; authoring and lifecycle cost                  | No source-product branch, forced repository edits or redundant reader |

Test complete figures with existing page navigation first. Add source-bound
manual focus only for a concrete question that benefits from it. Timed playback
is optional and needs an additional demonstrated benefit over manual focus;
the existence of the historical example is not that evidence. Runtime execution
and editorial reading order remain different meanings. No total score can
compensate for a failed semantic or reading constraint.

## Verified baseline

- Publisher alpha.14 is released. Its exact source is retained; this Change
  does not rewrite that release or reopen its completed gates.
- The accepted historical ETHOS standalone work retains thirteen pages and
  chapter-based playback. Its exact SHA-256 is
  `804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa`.
  A background Chrome probe exercised progression, pause and final replay.
- The selected Archify 3.0.1 supply deliberately removed guided/story views.
  Its current template still has style, camera, focus and motion controls.
  The generic adapter fixes `editorial`; its shell fixes `light` and hides the
  native toolbar. Switching a dependency therefore cannot restore the story.
- The current ETHOS successor rehearsal retains selected source references but
  has no Play Story control. It is an unaccepted migration work, not a substitute.

Primary removal evidence is the upstream
[3.0.1 changelog](https://github.com/tt-a1i/archify/blob/v3.0.1/CHANGELOG.md),
read on 2026-10-03. Its 3.0.0 upgrade entry explicitly preserves already
generated HTML but removes guided/story views from new generation.

## Alternatives and selection

| Approach                                                            | Useful property                                                                | Cost or failure                                                                                                                | Decision                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Keep the whole old renderer and player active                       | Immediate historical experience                                                | Two active readers, pinned removed API, source-specific patches and duplicated maintenance                                     | Preserve only immutable historical evidence |
| Replace the reader wholesale with Reveal.js                         | Mature slide timing and transitions                                            | Owns slides rather than this reader's exact graph, introduces duplicate DOM and camera obligations without a demonstrated need | Not selected for the graph reader           |
| Complete figures with existing navigation and optional manual focus | Smallest reader surface; architecture remains understandable without animation | Focus is justified only for a concrete reader question                                                                         | Preferred baseline                          |
| Optional timed reading over existing camera/focus                   | May help explain a multi-stage mechanism; one sequence owner                   | Adds cadence, cancellation and accessibility obligations; can distract or imply execution                                      | Admit only after a task-based comparison    |

Reveal.js 6.0.2 (MIT) was inspected through its official release and
`js/controllers/autoanimate.js`. Its slide-matching transitions do not supply
this product's source/graphic binding or automatically improve graph reading.
No new dependency is selected merely to supply a timer. Equally, the existing
renderer is not privileged: a mature replacement is admissible if it improves
the whole explanation and ownership model, not just one animation effect.

## Ownership and one-version rule

| Responsibility                                              | Owner                                 |
| ----------------------------------------------------------- | ------------------------------------- |
| Facts, conditions, domain relations and source acceptance   | Designated source product             |
| Questions, selections, composition and reading order        | Edition editor                        |
| Input grammar, checked carrier binding and diagnostic shape | Existing Publisher compiler           |
| Qualified styles, playback lifecycle and reader controls    | Shared Publisher reader               |
| Camera, focus, actual route and paint                       | Selected existing renderer adapter    |
| Promotion, custody and source lifecycle                     | Explicit designated adopter/custodian |

No product name determines a renderer, an appearance, a reading mode or a
permission. Providers remain optional input materializers. No source checkout
is changed just to use the product. There is one active input grammar, not
version-suffixed source modules or a parallel compatibility facade.

## Input and compilation

Add optional `appearance` to `presentation.interactive` in the
existing `architecture.edition-project/v1` grammar. Versioned meanings live
in schema values; source filenames are not versioned. Existing inputs without
these fields retain their source meaning and remain buildable.

`appearance` selects `{ "style": "editorial", "theme": "light" }`.
The bounded initial style set is `editorial`, `blueprint`, `classic`,
`signal-flow`; themes are
`light`, `dark`. These are appearance choices, not diagram types or domain roles.
The product owns the qualified catalogue; the editor selects its initial state.
Reader changes are session-local and never rewrite input, approval or source.

Do not add a chapter grammar or new playback controller. Archify already has
source-bound focus, direct relationship inspection, directed Route Probe,
manual route steps and bounded route journeys. Prefer those native mechanisms
when they answer the actual selected question. A future narrative grammar
requires a demonstrated reading task they cannot represent.

Derive native interaction bindings at the existing checked composition owner.
Node labels and kinds come from selected source members, not primitive IDs or
paint classes. A routed relation retains its exact endpoints and identity even
when several relations share physical segments. Drawing junctions, editorial
links and decorative segments are never promoted into source entities or edges.
The adapter supplies one nonpainting whole-route carrier per logical relation;
the actual physical stroke is still painted once.

The self-use Edition gives ordinary nodes neutral paint. Its Edition-wide
figure-kind catalogue owns type icons; color does not declare another type or
ownership hierarchy. Native selection, Lens and directed-path emphasis remain
distinct reading states. This editorial choice does not recolor other Editions
or the independently authored static sibling.

Exact traversal is enabled only when source-to-graphic membership preserves
logical endpoints. Aggregation or repeated occurrences cannot silently merge
entities and create a path that does not exist in the source. Such a figure
keeps complete artwork, camera and searchable precise Inspect. Native Finder,
focus, Radar and Lens may index distinct graphic occurrences independently of
relationship traversal. Homogeneous aggregates retain their source kind; mixed
aggregates are explicitly figure aggregates, not a new source type.
Unavailable queries therefore cannot report that source members are unreachable.

## Reader mechanism

Complete figures and existing page navigation remain independently usable.
Native Guide, Finder, Passport, camera, Radar, presentation and exports remain
operable. Their supplied implementation owns layout stability and interaction
state. Publisher owns page navigation, exact provenance Inspect and the small
parent/member bridge; it does not install another camera, layout or search owner.
Admit capabilities through the renderer's explicit artifact-bound contract,
not by finding a JavaScript string in HTML.

Use the existing native reader; do not add a chapter grammar, timer, camera or
query controller. Native finite Route journeys remain native-owned when offered.
Manual figures, page navigation and precise Inspect do not require playback.
No load-time autoplay or ambient-motion promise is introduced.

The checked composition derives source membership and query availability once.
Paint identity describes geometry; checked Inspect identity describes a selected
source or Edition occurrence; native node identity indexes that occurrence.
The derived capability limit, not the existence of a focusable node, controls
exact relationship queries. Decoration never gains coverage merely
by carrying a paint ID. The composition keeps an exact equality between semantic
carrier identities and their declared source/Edition bindings, not a subset test. The publication bridge normalizes existing
native graphic carriers under equality checks; it does not reinterpret source
meaning or keep another semantic table. Preserve paint attributes and children.

### Node type encoding

The selected official references at Archify commit
`2ab3cae7ac2c2a55d7386ca789d03c4fcd31816c` are the
[authoring contract](https://github.com/tt-a1i/archify/blob/2ab3cae7ac2c2a55d7386ca789d03c4fcd31816c/archify/references/authoring-contract.md),
[shared schema](https://github.com/tt-a1i/archify/blob/2ab3cae7ac2c2a55d7386ca789d03c4fcd31816c/archify/schemas/common.schema.json)
and [viewer runtime](https://github.com/tt-a1i/archify/blob/2ab3cae7ac2c2a55d7386ca789d03c4fcd31816c/archify/references/viewer-runtime.md).
The schemas define native kinds; icons are decorative, not another semantic
authority. A generic source kind is not silently reclassified as a native kind.

Archify's default corner icon follows native `type`; an explicit `icon` is
decorative and does not change type, color or Legend grouping. Publisher's
`visualRole` selects paint only. Do not let a paint role impersonate source
meaning, and do not suppress icons merely because they are decorative.

An ordinary authored node may declare `figureKind`. The Edition's single
`visualPolicy.figureTypes` catalog owns its glyph, not each occurrence.
`figureKind` describes that figure's architecture role for the reader; it does
not replace any bound entity's source kind. Its default is the checked source
kind for a homogeneous figure and `aggregate` for a mixed figure. Source kinds
and exact membership remain separately available through Inspect. Thus a
mixed Source figure can honestly group source entities of several kinds without
showing `aggregate` repeatedly in the main diagram.

Resolve effective kinds across all selected pages before any selected medium
renders. Require a catalog for ordinary type-bearing figures, coverage of
later-page kinds, and distinct resolved artwork for distinct kinds. A name
alias is not a distinct glyph. Missing entries never become neutral defaults;
source kinds are never collapsed to fit a small artwork vocabulary. Neutral
composition preserves the same catalog independently of its geometry profile.
Per-occurrence icon authoring is removed; checked scene icons are derived IR.
Unused catalog entries remain valid as selected pages change. An external
Edition Project can own this policy without modifying its source repository.

Reuse pinned offline Lucide artwork rather than hand-drawing extra icons.
`lucide-static@1.52.0` is a development-only supply input with no transitive
packages or install scripts; the public package ships a compact finite SVG catalog and
the full ISC/Feather MIT notice, not the 51 MB development package. Exact npm
advisory lookup returned no advisory for this version on 2026-10-05. Normalize
its 24-unit artwork into Archify's 16-unit icon rail, preserve measured footprint,
and include supply hashes through the existing renderer receipts. No network
icon loader, arbitrary editable SVG, parallel renderer or taxonomy is added.
Authored primitives remain unchanged and require no automatic glyph catalog.

Reuse native Legend resolution, footprint, collision checks and Lens bridge.
Each entry places exactly one catalog glyph before its effective figure-kind
label. The shared glyph resolver owns both node and Legend symbols; paint
never determines kind grouping. Count badges are absent. Internal
occurrence membership remains available to Lens, not displayed as architecture
meaning. Native layout must diagnose insufficient space; neither hiding an
unfit Legend nor shrinking meaningful text qualifies it. The native footprint
reserves the actual icon rail; hit bounds map transformed glyphs into the entry's
coordinate space. Pointer and keyboard activation reuse the native selection
toggle; closing Lens preserves selection.
The self-Edition's measured missing Legend bands are 17px for Overview, 16px
for Adoption and 6px for Evolution. Its source-owned canvas heights reserve
20px, 20px and 10px respectively; node placement and all meaning remain unchanged.
The generic renderer retains strict authored-canvas bounds instead of hiding
the Legend or resizing an adopter's supplied viewport.
Reader wording belongs in the one copied native catalogue used by both template
localization and runtime messages. Authored relationships are not runtime traffic.

Export belongs to the selected query interaction, not an outside dismissal.
The existing native menu exports the resolved Route or Reach; no parallel export
mechanism is installed. Canonical output removes temporary reading state.

A native reading link combines the independent publication URL, selected page
and opaque native query hash. The bridge seeds that hash before native startup;
Archify retains parsing and selection. Same-page addressed changes and browser
history reload the frame when needed, without granting autoplay. No new query
grammar, credential access, network service or same-origin permission is added.
Prepare each successor iframe completely before attaching it. Its initial native
address uses replacement, not a separate child history entry. Removing the old
frame disposes its deferred work; page and opaque native hash form the only
rebuild identity. Set the selected title synchronously without another lifecycle
counter. Back, Forward, reload and cross-document return rehydrate the parent
address through the native parser.
Parent/member messages retain exact sender and page checks.

## Styles and quality

The host bounds the member aperture; native camera-normalized stage and measured
control reserve remain authoritative. The browser contract separately verifies
unclipped chrome, artwork and the unchanged 14-percent overview whitespace limit.
The renderer places its query-limit note inside native normal flow; the host does
not move semantic notices or hide them during presentation.

One style selection reaches the shell and selected renderer consistently.
For Archify pages the native preset and theme controls own the change; the
shell reflects their measured paint tokens and has no duplicated menu. Native
initialization cannot overwrite the declared appearance or leave its accessible
button state inconsistent. Other supported forms retain the shared bounded
palette without replacing the native palette.
Runtime style changes are geometry-neutral: palette, surface and emphasis may
change, but selected labels, fonts, stroke envelopes, coordinates and routes
do not. Font/geometry changes remain authored composition requiring rebuilding
and new qualification. Unsupported selected styles fail, not silently fall back.

Every offered style and theme needs measured text and graphical contrast,
focus visibility, unchanged content, correct legends and actual desktop checks.
No template badges, artificial version labels or decorative scan lines enter
the work. Typed distinctions remain readable without relying on colour alone.
The source may choose separate static art; an interactive appearance does not
rewrite its sibling or borrow its approval.

## Verification and superior replacement

The initial matrix covers native LikeC4 topology, typed Claim Model/mixed
content, supported responsibility form and authored geometry. One generic
fixture and the ETHOS rehearsal exercise the same public Build Request; no
ETHOS/AIGW branch is admitted. If a selected form cannot meet a target, improve
the adapter or fail precisely rather than conceal the guide.

Counterexamples include absent/omitted assertions, wrong view, duplicate IDs,
ambiguous occurrences, unconnected groups, changed source bytes, invalid style,
late completion after pause, immediate pause/resume, page replacement, hidden
document, reduced motion and unrelated/stale iframe messages.

Focused RED/GREEN, serialized classic-script checks, static/module gates and
all four coverage dimensions at least 95 percent precede the complete native
suite. Offline installed builds use explicit inputs, empty user configuration
and no adjacent checkout. Real background Chrome observes native selection,
exact Route/Reach, Lens, Radar, sharing, canonical export, every page,
style/theme switching, addressed reading, Inspect, history and cleanup. Geometry audits and actual painted screenshots remain
separate from human faithfulness, intelligibility and restraint judgments.

A successor may change art direction or omit legacy interaction when exact
source meaning and required reader outcomes remain intact or improve. Compare
complete-figure navigation and native exploration on the same selected
questions; only useful mechanisms enter the implementation and qualification
matrix. A new button, matching ID inventory, library upgrade or lower line count
is not sufficient evidence of superiority.
Retirement needs source-owned acceptance and verified rollback; until then the
historical reader remains intact and labelled with its original source time.

## Delivery boundary

Publish one coherent SemVer successor with Keep a Changelog and exact package,
installed, native CI and remote-readback evidence. Hand its contract and limits
to the existing ETHOS migration task; do not seize the source writer's lane.
AIGW retains its accepted package selection until its owner chooses an upgrade.
This repair cannot block unrelated source safety/runtime delivery.

Select pipelines through GitLab native `workflow:rules`. An open merge
request receives one review pipeline rather than a duplicate push pipeline.
Unprotected branches without a merge request remain testable; protected branch
and tag pipelines retain their complete native gates and trust roles. Schedules
and other branch-triggered pipelines are not silently removed. Existing running
pipelines finish before the new selection is published. No custom condition
interpreter, cancellation controller or second CI authority is introduced.

Converge movable quality policy under `.config/checks/`, not tool-default root
filenames. Preserve native npm, Git, runtime, editor and Forge discovery where
those consumers require their current entry. Each policy has one owner and each
native command selects it directly; no root forwarding facade, copied rule or
custom configuration loader is introduced. Qualify relative globs, actual
formatter discovery, the documentation rule module, package boundaries and
unchanged coverage scope before committing. The workspace layout separates
generic runtime, the independently packaged self-Edition, specs/governance,
verification, development supply and retained evidence by responsibility.
Conformance belongs under `tests/conformance/`, preserving its package-only
imports, fixture-relative bindings and immutable evidence bytes. Update current
readers and native file selection in the same change; historical references
inside retained receipts describe their original source, not active paths.

Use the installed ETHOS quality provider for the existing `node-behavior`
gate; it compiles the canonical npm test and c8 recipe into one bound attempt.
The existing static command keeps its full native quality graph and adds the
installed static-verification provider. The package gate remains independent.
Provider availability is not quality proof: subject applicability, all four
95 percent floors, exact input custody and bounded execution still require
their actual installed observations. Source, installed runtime, media
qualification and hosted release are separate acceptance boundaries.

Declare carrier responsibilities once through Git-native `ethos-role`
attributes: authored runtime is code, verification is test, development supply
is tooling, native settings are config, generated validators are generated,
and frozen third-party bytes are snapshots. Roles describe responsibility;
they do not confer provenance or waive behavior, integrity or license checks.
The exact native coverage selection must equal the authored code set and keep
all four 95 percent floors. Generated runtime inputs and frozen supply retain
their existing native generation, source-manifest and installed-use checks.
Development tooling keeps its complete static and native execution contract.
Unobserved applicability remains a gap rather than an inferred exemption.

## Cross-platform execution boundary

The supported execution targets are native macOS, Linux and Windows. The
public build, qualification, installation and recovery contract is identical
on those targets; passing through Git Bash or checking Shell/PowerShell syntax
does not establish that contract. Keep npm, Cargo and wasm-bindgen responsible
for their native operations. Do not translate a Shell controller into another
language, add a second task authority, or require source repositories to carry
platform-specific publication scripts.

The complete npm quality graph checks frozen raster input/output integrity;
native Rust/WASM source rebuilding is a separate acceptance obligation.
Historical Git-shell refusal checks do not establish Windows rebuild support.
Preserve the selected source archive and runtime output bytes.

Use native archive extraction, Cargo and wasm-bindgen for the frozen rebuild.
Cargo remains offline and frozen; binding uses the existing explicit flags.
Pass the resolved absolute source root to Cargo's path remapping; mapping `.`
is not equivalent. Keep the original Cargo manifest and lockfile unchanged.
The tested wasm-pack wrapper produces the selected output bytes but rewrites
the original lockfile during metadata discovery, so it does not qualify.

The only authored build helper is `tools/raster/resvg/verify.mjs`. It checks
the selected archive digest, extracted input bytes and output bytes; it starts
no subprocess, installs nothing and writes no files. It is not a build input
and cannot authorize its own integrity. Packaging retains one immutable
canonical output pair from `source.json.outputs`, selecting the verified
binding as `index.mjs` without rewriting its contents. The helper is an
explicit development entry, not a public command or another orchestration plane.

Frozen native rebuilding and canonical package integrity are separate
guarantees. Current macOS and Linux builds produce identical binding bytes
but different WASM bytes. Cargo's host-dependent recursive dependency metadata
supports this diagnosis; removing custom sections did not restore identity.
That evidence neither proves every difference has this cause nor authorizes
changing canonical output hashes to the last build's result.

The existing source manifest owns pre-admitted native witnesses. Each witness
binds the full compiler host triple, exact Rust and Cargo releases and commits,
the selected wasm-bindgen version and the expected native WASM digest/size.
The JavaScript binding remains bound to the canonical digest. Witnesses are
admitted only after two independent, clean extractions and builds agree, and
an independent review accepts the resulting evidence. Unknown or altered
tool identities fail closed; execution never learns a hash or chooses a fallback.

`verify.mjs --outputs <output-root>` checks canonical output. Supplying an
additional tool-identity JSON file selects the exact pre-admitted native
witness. That file is a caller-owned observation, not execution proof: the
native journey obtains Rust/Cargo verbose versions and wasm-bindgen's version
from the actual selected executables. The helper only checks that observation
against the manifest and verifies output bytes.

The native journey independently extracts the verified archive twice into
relocated roots containing spaces and Unicode, with separate empty Cargo
targets. It checks the selected inputs before and after each offline/frozen
build, verifies both outputs against the selected witness, and compares their
digests. Rebuilt and canonical modules must also agree on imports/exports,
exact representative PNG bytes, all selected packaged fonts, text measurement,
declared errors and an actual authored static workload. These are finite
behavioral witnesses, not universal equivalence or cross-host WASM byte identity.

Native CI owns job deadlines and disposable build roots. Actual macOS, Linux
and Windows evidence remains mandatory. Retire the historical POSIX controller
and its active consumers together only after those native rebuilds and installed
renderer acceptance pass. No Bash fallback or PowerShell controller qualifies
as that replacement.

Platform acceptance must cover actual native execution, relocated paths with
spaces and Unicode, executable discovery, cold offline installation, bounded
process-tree reclamation, publication/recovery effects and exact selected font
rendering. OS-specific process and filesystem facilities remain small explicit
capability boundaries, not emulated promises: Windows directory flushing is
reported as unsupported, and optional CoreText measurement is macOS-only.
The portable raster path must not depend on CoreText, Bash or PowerShell.
Passing one platform, ARM64 runners, or a rejection fixture does not imply
other architectures or a full cross-platform source rebuild.

Test harness deadlines include cold native startup and teardown, independently
of a product worker's execution deadline. Direct layout-worker probes retain
their one-second self-expiry and use a finite ten-second parent observation
budget; assert process errors before interpreting replies. The geometry-only
reading test selects the existing 25-second layout ceiling. Installed Provider
setup uses native offline, scripts-disabled npm with no saved manifest or
lockfile and a finite 120-second installation budget. Product defaults,
coverage scope and all assertions remain unchanged. Pipeline 9507 failures
and the unchanged 25-case macOS guest replay establish the affected boundary,
not a proved hardware, parser or filesystem root cause. A complete successor
matrix must still pass before publication.

### Native Linux orphan reaping

Linux Docker verification selects the Runner's native
`FF_USE_INIT_WITH_DOCKER_EXECUTOR` feature flag. The Docker executor then starts
the build container with `--init`; its PID 1 reaps orphaned children after
Publisher's existing invocation-scoped process-group termination. No additional
process controller, host configuration change or assertion relaxation is needed.

The same exact snapshot and twelve installed Provider and qualification tests
fail without init and pass unchanged with init. The failing descendants are
PID-1-owned zombies; the passing process table contains none. This isolates the
container precondition without declaring hosted or full-release acceptance.
The official Runner feature declaration and Docker executor wiring, fixed blobs
`9bcb2c3b4dbc9bd4b6376f11cb3dfeb970042fc6` and
`ba0b63e53ba7e5a087b32d18bf201559eb6cb4bf`, are preserved alongside the exact
RED/GREEN logs under the current Lane's Linux prerequisite evidence. Native
hosted execution still has to prove this setting on its actual Runner.

### Native Windows tool discovery

Locked Rust owns MSVC linker and SDK discovery for the actual target. Its
upstream `get_linker` delegates to `find_msvc_tools::find_tool` and applies the
selected tool environment. Windows CI therefore only binds the native platform
and executor; it does not assume Visual Studio's installation path or launch
a developer-shell controller. The unchanged Cargo journey must perform real
host compilation and WASM rebuilding before quality checks. Missing tools
remain a native compilation failure, not a bypassed prerequisite. This design
changes no Guest isolation, execution policy, credentials or Rust target.

### Required native CI execution

Windows uses native GitLab fetch and cleaning, excluding only the job-local
`build/runtime/tool-cache/`. Forced index checkout renews every tracked carrier
before tools run, preserving exact LF and frozen supplier bytes after attribute
changes without recursively deleting a mapped browser cache. All other prior
job output is cleaned. Retained tools still undergo locked supply validation;
this checkout policy does not claim process reclamation or hosted acceptance.

The native Linux job uses the pinned official Playwright filesystem with
`pwuser` as the image's default user. The two-instruction Dockerfile changes
only image configuration: `FROM` an immutable upstream digest, then `USER pwuser`.
It copies no repository material, installs nothing and adds no process owner.
Runner 19.4.1 checks the image default when deciding whether to repair checkout
ownership; a job-level user override does not satisfy that prerequisite.
CI must select a registry-verified immutable derivative digest and preserve
the native ownership flag, rather than using root or manual checkout repair.
Actual hosted preparation must prove both project and temporary-directory
ownership before the existing product gate can establish platform acceptance.

Mise selects official Pixi only for Linux ARM64; its native lock binds the
binary. A separate native Pixi lock supplies conda-forge C compilation and xz.
Copy the selected manifest, lock and configuration into ignored job-local
`build/` state on the Runner's native filesystem. Pixi owns installation and
generated shell activation; no handwritten installer, root package manager,
registry-policy bypass or parallel quality controller is added. The activated
compiler is the explicit Cargo native-target linker. Actual compilation and
execution, frozen Raster rebuilding and the whole quality gate qualify this
boundary; a zero installer exit alone is insufficient if diagnostics show an
incomplete environment. Preserve prior failed receipts.

The locked Playwright installer owns the CI browser supply under each job's
`build/runtime/tool-cache/playwright/`. The existing npm test preload binds its
native Chromium executable only when CI has not selected an explicit browser.
CI requires an absolute, accessible executable and refuses missing supply before
tests can silently skip. Explicit caller selections remain unchanged. Local
focused tests may remain browser-optional; browser launch, sandbox and actual
rendering are separate runtime acceptance, not inferred from a path check.

Every native platform job must execute the selected browser journey with the
Chromium sandbox enabled. Linux execution requires a qualified non-root job
principal; installing a browser or changing a flag is not sandbox acceptance.
The existing frozen Raster journey uses the manifest-selected Rust, WASM target,
wasm-bindgen and source archive through native tool supply and execution. Keep
job-owned caches separate from host installation owners. Missing prerequisites
fail the required journey rather than waive it; retain platform-specific raw
results and all four coverage floors. Retire the POSIX Raster controller only
after its actual consumers migrate and the native target-platform journey passes.

Native npm and Publint subprocess resolution must retain the selected npm version,
not fall back to Node's bundled npm when a subprocess prepends its executable
directory. The private workspace declares the already selected npm as a locked
development tool; native dependency bins, not a custom script or vendor patch,
own that binding. The installed Core package gains no npm runtime dependency.

New generated output belongs under the repository's ignored `build/`, according
to the projects-family contract. Existing records remain exact retained inputs
until their named consumers release them; do not create another records root.
Designated Forge records preserve required durable release evidence. Documents
contains reader deliveries, not source or a second mutable Edition.
Verify exact custody before disposing of owned temporary outputs. Historical
signed releases, original reader bytes, foreign work and user windows remain
unchanged. Source acceptance, research settlement and lifecycle closure are
separate remaining obligations.

## Editorial input and independent media

The public input is selected system material plus an editorial brief: audience,
questions, scope, limits and independent media choices. The existing
schema-validated Edition Project remains the machine carrier. Improve its
example, diagnostics and documented happy path before inventing another grammar.
Native LikeC4 sources need no duplicate Claim Model; optional declarative
Providers and separately owned editorial roots converge before compilation.
Questions are human-readable choices, not executable queries. Deterministic
rebuilds require no Agent, ambient checkout or source-specific runtime.

The human withdrew PDF and PPTX support on 2026-10-05. This Change and the
remaining goal deliver independently composed PNG and desktop HTML only, with
SVG as a vector carrier. Document/deck requirements, admission experiments and
future implementation work are withdrawn, not completed capabilities. Historical
accepted artifacts and dated research keep their original identity.

Mature mechanisms are reusable implementations, not competitors to Publisher.
Select parsing, geometry, native reading, SVG and raster mechanisms by measured
semantic preservation, offline operation, portability and total ownership cost.
Reuse verified Archify controls rather than create a parallel reader. A library
upgrade alone is not superiority evidence.

### Medium purposes and editorial authority

Each medium serves a distinct reader activity. Format conversion is an
implementation detail, never the product definition or acceptance boundary.

| Medium       | Reader activity                                            | Composition responsibility                                                                            |
| ------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| PNG          | Understand the architecture at a glance.                   | A deliberately composed overview or flagship poster with clear hierarchy and readable relationships.  |
| Desktop HTML | Explore the overview and understand individual mechanisms. | Complete overview and mechanism diagrams, native navigation, focus, Inspect and qualified appearance. |

The existing Edition Project owns shared audiences, questions, selections,
limits, attribution and editorial assertions. Its existing `presentation`
owner declares independent static composition and desktop navigation plans.
Plans reference existing selection, question and view identities; they do not
create duplicate facts or require two semantic models. Defaults may supply
style and typography, not source assertions, omissions or approval.

Narrative and reading order do not create runtime dependencies, execution order
or causal edges. Unknown references and unsupported source assertions fail at
the existing selection owner. Publisher checks identity, declared coverage and
attribution; source and editorial judgment retain their own reviewers.

The two media share selected semantic identities, not compulsory coordinates,
layout or approval. HTML screenshots do not establish static composition, and
an HTML wrapper around a poster does not establish interactive exploration.
Every HTML page contains a complete, readable architecture or mechanism diagram;
partial tables cannot replace an overview. Mobile and narrow-screen work remain
excluded.

### Integrated composition and measurable acceptance

Keep the existing Build Request, selection, Candidate, qualification,
publication and recovery owners. Dispatch the two supported media explicitly;
unsupported media must not fall through to HTML. The existing scene, route,
primitive, marker and font owners supply each receiving composition without a
second scene model, semantic exporter or command plane.

Qualification binds exact source selections and output bytes to complete
figures, directed routes, readable glyphs, alignment, contrast and painted
clearance. A successful command, file validity, semantic coverage, native
interaction and artwork quality establish different predicates. Exact font
resources and actual consumer paint remain required; silent fallback or valid
SVG syntax does not prove appearance.

Source meaning, editorial judgment, artwork acceptance, independent review and
publication authorization remain distinct. Maintainer self-review is allowed
when policy permits it, but cannot be reported as independent review. Artwork
approval does not approve later byte changes or source-product publication.

### Mature mechanism reuse

Use existing pinned suppliers and native executors before adding custom code.
Admission checks actual selected paths, complete notices and resources,
resolved advisories, offline relocation and target-platform behavior. Replace
an existing implementation only when the alternative preserves required
meaning and reduces measured authoring or maintenance cost. These checks do
not add document/deck dependencies or revive withdrawn media work.

Pixel rules derive from one measured geometry owner. Test actual painted
glyphs, paths, arrowheads, box clearance, alignment and reader controls;
DOM bounds alone cannot prove separation. Deliberate containment and exact
semantic junctions are distinguished from accidental overlap. Offered styles
must preserve readable Inspect selection, keyboard behavior and semantic
distinctions. Aesthetic acceptance uses declared reader tasks and the approved
flagship baseline, not fabricated universal whitespace percentages.

## Source settlement and recovery

AIGW Client Projection already selects declarative Provider v2 at the observed
source revision. Verify that exact interface and its installed execution;
do not repeat a superseded v1 migration. Product Edition is a distinct source
scope with its own source-owned meaning and acceptance. Neutral visual approval
does not settle either source meaning or publication authority.

The ETHOS adapter starts from its current authoritative export and selection.
No second semantic exporter, repository-specific Publisher schema, compulsory
runtime dependency or publication controller enters the source. The target
explanation includes greenfield and brownfield formation, intent and constraints,
Skills boundaries, parallel cooperation, competitive zero-or-one selection,
experimental/all-drop outcomes, per-ref serial CAS, assurance, effect recovery,
publication and outcome feedback. A required predecessor remains preserved
until its designated successor is accepted.

ETHOS north-star delivery is a finite decision packet, source-owner disposition
and one falsifying feedback journey. It preserves the complete agentic-native
repository and ecosystem ambition but does not require implementing the entire
future ETHOS roadmap in this Change. SDD, DR and semantic/formal research settles
with current ETHOS owners; Publisher retains only findings used by publication.
Compare substantive OpenSpec releases, COMET, SpecD versus SpecDD, Spec Kit,
BMAD/GSD, adjacent coordination, symbolic binding, semantic graphs and formal
methods at fixed implementations. Separate authored source, tests, generated
and vendor size; compare guarantees, failure behavior and maintenance cost,
not promotional claims or unsupported semantic-density rankings.
Each selected mechanism has adopt/reuse/replace/defer/reject disposition,
rationale, evidence, owner and revisit trigger.

Selected GitLab recovery covers repository source plus the actually designated
release inputs/assets and records. It is not a promise to recover credentials
or all Forge metadata from Git. Prove recovery in an isolated local-loss
rehearsal without changing production state, then download selected outputs
and verify their manifests and bytes. No unselected disk, Time Machine or
second-site service is introduced.

Keep one writer and the existing `tasks.md`. Repair message/authentication
failures at their actual consumer/transport owner, with bounded noninteractive
operations and exact process cleanup; preserve sessions, model metadata and
credentials. Maintainer self-review is valid where the actual policy permits it.
Freeze product inputs before the full matrix, reuse applicable immutable
evidence and refresh exact-current governance separately. No deadline or
unsuccessful reviewer substitutes for required proof or acceptance.
