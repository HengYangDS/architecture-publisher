## Context

The HTML edition is accepted. The static migration must retain the original
publication and remove accidental dependence on a developer workstation.
Fresh CoreText measurements already reconstructed the complete original scene,
SVG and 6000-pixel PNG byte-exactly. That proves the legacy path, not portability.
The original typefaces are not bundled with this product.

## Separate reconstruction from rasterization

The generic rasterizer consumes a closed source bundle, not ETHOS concepts or an
HTML reader. Its explicit plan selects the manifest digest, one SVG member,
font members, target width and a new output file. Paths resolve from the plan.
The bundle reader remains the sole filesystem/member-integrity owner. Font
selection is explicit; absent fonts or unsupported SVG features fail rather
than borrowing installed fonts. Outline-only SVG requires no font bytes.

Use an unchanged pinned resvg WASM runtime for pixel generation, a strict SAX
parser for SVG ingress, and an OpenType reader only for explicit font identity
and glyph coverage. Keep original licenses, source revisions and per-file
hashes. No package-global installation, browser, network capture or sidecar
service is required. The renderer executes in a bounded child process with an
empty HOME/PATH, a time limit and explicit byte/pixel limits.

The SVG input profile supports declarative shapes, paths, gradients, clips,
markers, internal references and explicitly font-bound text. It rejects scripts,
event attributes, external references, stylesheets, animations, embedded HTML,
images, DTDs and foreign namespaces. Unsupported input is rejected, not erased.
Text must resolve to a supplied font family/weight with supported glyphs. This
profile is narrower than all SVG; native SVG semantics and limitations remain
documented. The parser is not an independent semantic verifier.

Font validation follows each rendered reference context, including nested
`use` instances. The referenced root inherits from the `use` host, not its
original definition ancestors; explicit declarations in its subtree still win.
Memoization includes the effective family, weight and style, so one passing
instance cannot approve another with a different font. Reference cycles,
longest reference paths and the number of distinct font contexts are bounded.
Unused definitions need not declare fonts. This is font binding, not general
CSS computation or proof of SVG visual fidelity.

Internal references must resolve to an appropriate target type, not merely an
existing ID. Within this profile, fill/stroke and gradient templates select
gradients, clip-path selects clipPath, and marker properties select marker.
Linear and radial gradients may template one another; use remains governed by
the supported SVG namespace rather than a new narrower target whitelist. Invalid
types fail before rendering instead of inheriting the renderer's fallback or
silent omission. These rules follow SVG 2, Linking, Valid URL targets; this
strict profile rejects invalid references even where a browser defines fallback.

The earlier proposed blanket rejection of instanced text was not justified by
its fixture: that fixture set the font on the referenced group explicitly.
The actual reproduced defect used an inherited weight on a definition ancestor
and a different weight on its `use` host. Regressions cover both the valid
explicit override and the previously missed instance-dependent selection.

Validate everything before reserving output. Require a physical existing parent
and absent target; exclusively create the final PNG only after actual render
dimensions and returned bytes are checked. On renderer failure no final output
is published. Never delete an occupied or concurrently arriving target. Later
pair installation and crash recovery stay outside this renderer.

The parent admits the worker's closed response shape, bounded counts, canonical
Base64 and PNG header/dimensions before publication. Signaled children, malformed
responses, unsuccessful exits, output-buffer exhaustion and the actual deadline
produce distinct failures and leave no final output. The installed test consumes
stdin before injecting a reply; an EPIPE before consumption is not evidence of
reply validation. Fault cases use separate output directories, so an erroneously
accepted earlier case cannot mask later failures. These are transport checks,
not an independent pixel decoder or semantic approval.

## ETHOS static edition

Move the useful original composition/geometry functions, with provenance, into
the ETHOS edition and explicit geometry modules. Keep source semantics, view
design, font measurement and rasterization separate. Preserve original authored
labels, positions, relationships and accepted bytes. A licensed-font macOS
adapter may reproduce the historic scene; it is not the default portable path.
Portable measurements and outputs must be qualified against source obligations,
not declared equivalent merely because their hashes are stable.

The first reconstruction entry is `architecture poster ethos <plan.json>`.
It consumes the same explicit source selection as the atlas plus a selected
poster edition bundle. That bundle contains the historic measurement table and
expected scene/SVG identities, not executable adapter paths. The ordinary build
loads no CoreText, legacy checkout or system font. It recomposes the document,
compiles every label, runs source-binding/scene/separation/emitted-edge/canvas
checks and writes SVG, scene, text alternative and scoped observations through
the shared closed-bundle writer. Missing measurements fail; they are never
replaced with character-width guesses.

The selected original SVG references Avenir Next and Georgia. Rebuilding its
bytes without those fonts is not portable visual rendering: it does not embed
font bytes or establish the browser's painted result. Fresh measurement and
PNG qualification remain independent, mandatory steps. Recorded measurements
are historical input, never a report that measurement ran again.

The opt-in CoreText measurer receives an explicitly selected Swift compiler,
SDK, font files with digests/PostScript identities, ordered fallback selections,
text requests and a new output directory. It compiles a packaged helper in its
own temporary directory, measures the requests, and checks every resulting font
run against the declared primary/fallback files. It does not discover fonts,
register them globally or ship their bytes. Tool and font identities are checked
before and after execution; this detects observed drift, not a hostile writer.

The original title's Chinese glyphs use PingFangSC-Semibold rather than Avenir
Next. This is an actual CoreText observation, so the legacy reproduction plan
must include that explicit fallback. A caller-provided cascade only expresses
preference to CoreText; checking actual runs prevents undeclared system fallback
from passing. Missing glyphs fail. Fresh execution is recorded separately from
the resulting reusable measurement table; reading that table later is not fresh
measurement. This macOS adapter does not qualify Linux raster parity.

The arrow character in regular-weight copy uses LucidaGrande, also observed in
the complete measurement run. Its file and PostScript identity must be declared
as a fallback independently of the Chinese title font. The public entry is
`architecture measure coretext <plan.json>`; compiler, SDK, font and output paths
resolve from that plan, not the caller's working directory or ambient PATH.

Pure scene and separation checks live in `src/geometry/`; ETHOS-specific copy,
mark vocabulary, source assertions and the fixed authored poster live under
`editions/ethos/static/`. Migration reads exact committed legacy modules, records
their hashes and applies type erasure and formatting without redesign. The
installed test deliberately removes unrelated renderer/font assets from its
own disposable package copy to detect accidental dependency coupling.

The test-only module-boundary owner parses every first-party JavaScript module
with locked Acorn. Its dependency rules follow the source, geometry, publication,
static, interactive, integration, edition and CLI responsibilities. It checks
imports, re-exports, dynamic imports, `import.meta.resolve` and module-relative
resource URLs; unknown owners, computed module dependencies, package escapes and
unadmitted loaders fail. Injected reverse dependencies must fail the same checker
used on real source. Third-party asset internals retain their existing supply
verification, rather than becoming first-party graph nodes. This bounded syntax
check does not prove arbitrary filesystem access, loader aliases, evaluation of
generated code, or the Swift adapter's dependency graph. Installed and relocated
consumer tests retain those distinct responsibilities. Acorn is development-only
and absent from consumer installation; locked development installation is an
explicit fresh-checkout test prerequisite.

An outlined publication is a derived delivery artifact, not an editable source
or a replacement semantic graph. Keep a text alternative and source identities.
Do not commit system font bytes. Renderer antialiasing changes are recorded and
reviewed; old approval does not silently transfer to new pixels.

The opt-in `poster ethos outline` adapter composes the existing poster entry,
explicit rsvg-convert/Fontconfig tool identities, selected original font files
and an exact reference PNG hash. Its private Fontconfig inventory must equal the
selected files, and the recompiled source must reproduce the reference raster
before conversion. The output is a closed bundle of original SVG, original text
alternative, font-free SVG and scoped observation. The existing raster entry
consumes the outlined member; no second rasterizer, geometry compiler or
publication qualification is introduced. Host file identity checks are shared
with the CoreText adapter; neither claims complete native-library isolation.

Outline protocol tests use labeled test-only executables and therefore prove
only admission and preservation. Real installed rsvg-convert execution, exact
reference reproduction, subsequent isolated font-free rasterization and visual
qualification are distinct required evidence. A valid outline containing no
text is not by itself proof that every source assertion remains visually present.

## Verification and sequence

1. Rejecting tests for selected bytes, safe SVG, font fallback, occupied output,
   dependency drift and resource bounds; observe RED before implementation.
2. Pinned raster supply and public raster plan command. Exercise real rendering
   and installed use on macOS/Linux, with no browser or source checkout.
3. Migrate and test static authoring/geometry and explicit measurement adapters;
   retain exact legacy reconstruction and separately qualify portable outputs.
4. Reproduce both non-ETHOS example journeys without changing generic code.
5. Native proof, acceptance, scoped artifact publication and source recovery.

Full-product browser qualification, paired installation and its crash-recovery
tests remain mandatory in Workline A. No raster milestone closes those tasks.

### Input-boundary verification ownership

| Boundary | Executable evidence owner |
| --- | --- |
| Selected manifest/member bytes, missing/extra files and symlinks | `tests/source-bundle.test.mjs`; public no-output cases in `tests/static-raster.test.mjs` |
| XML feature admission, attribute values and reference identity/type/cycles | `tests/static-svg-values.test.mjs` and `tests/static-raster.test.mjs` |
| Explicit font identity, glyph/style/weight, instance inheritance and byte/count limits | `tests/static-raster.test.mjs` |
| Pixel/element/depth/reference/context bounds and occupied/concurrent output | `tests/static-raster.test.mjs` |
| Installed execution, supply drift, process flags, actual deadline/output exhaustion and malformed replies | `tests/static-installed.test.mjs` |

The worker reply boundary checks structure and selected PNG header dimensions;
it does not independently decode pixels or authenticate a hostile worker. Font
admission does not implement the whole CSS cascade: relative weights and CSS
inheritance keywords without resolved explicit selections are rejected. These
limits must not be promoted into claims of general SVG or visual equivalence.

## Proposed source-closed renderer replacement

Disposition: design recommendation for approval, not implemented or accepted.
Task 1.2 remains open. Preserve the installed renderer, original accepted
artwork and historical observations until the replacement passes its own
acceptance. Packages 180 and 181 in the existing private evidence projection
record the bounded native feasibility experiments; they are not build inputs
or normative authorities for this proposal.

### Decision and rejected alternatives

Retain the existing installed Node-only public raster command and isolated
WASM worker. Replace only the renderer dependency with one reproducibly built,
source-closed WASM module and its narrow generated binding. Use the audited
upstream resvg source with an exact dependency lock, explicit feature set,
compiler/target identity, generated-binding tool identity and source notices.
The accepted build inputs must be selected explicitly; do not depend on the
builder's global Cargo state or resolve a dependency branch at build time.

The native resvg 0.48.1 experiment has a complete selected source archive and
successful offline macOS/Linux builds. Its seven selected PNG outputs match
across those two platforms. That result justifies testing a source-closed
replacement; it does not establish a WASM build, the old binary's provenance,
all-input parity, publication qualification or approval of new artwork.

| Alternative | Retained value | Reason not selected |
| --- | --- | --- |
| Keep guessing the old binary's missing lock | No runtime change | Binary strings establish only a lower bound; they cannot prove complete dependency resolution. |
| Ship the tested native CLI | Upstream command and known source closure | Changes Node-only installation, executable/platform distribution and memory/filesystem restrictions; it is not a drop-in worker replacement. |
| Rebuild a narrow WASM dependency | Current public inputs, process boundary and portable package | Preferred; feasibility and generated binding remain to be proved before adoption. |
| Ship both with automatic fallback | Apparent availability | Creates two semantics and supply authorities; a failed selected runtime must fail closed. |

If the narrow binding is not supportable without disproportionate maintenance,
return that evidence for a design decision. Do not silently switch to the native
CLI, weaken limits or introduce a generic renderer-plugin framework.

### Unchanged responsibility boundaries

The existing source-bundle reader owns explicit input bytes. The existing
SVG/font validator owns the supported feature subset and rejects external or
undeclared resources before rendering. The worker owns one render invocation,
not source meaning, font discovery, output paths, approval or publication.
The existing parent process retains input/output byte and dimension limits,
execution deadline, JavaScript heap and WASM memory caps, response validation,
exclusive final output and occupied/concurrently arriving target preservation.
The paired publisher and browser qualifier remain unchanged owners.

The binding accepts SVG bytes, explicitly selected font bytes and requested
width; it returns bounded rendered dimensions and PNG bytes. Disable upstream
system-font discovery and unneeded file/network capabilities at build time.
Instantiate without filesystem, network or process imports; inspect and test
the module's actual import/export table rather than trusting a build flag.
Prefer the upstream rendering APIs and an established generated binding over
handwritten allocation protocols, a second SVG implementation or a new engine.
Use one private disposable worker lifecycle; a trap, allocation failure,
malformed response or timeout must never create a successful final PNG.

The new dependency must be pinned in the existing raster supply manifest and
verified by its existing installed reader. Preserve direct/parser/font-reader
notices; replace old renderer-specific inventory only after the new closure is
verified. Source archive, lock, build recipe and required notices must accompany
or have exact recoverable references from the distributed candidate. They are
supply evidence, not another progress or approval store.

### Bounded implementation and acceptance order

1. In the existing static work lane, prove one offline locked WASM build and
   exact import/export contract. Review the small binding and all selected
   dependency sources/notices. Keep its experimental bytes outside the shipped
   assets. No passing native build substitutes for this step.
2. Reuse the current public raster fixtures and rejecting tests against a
   disposable installed candidate: explicit fonts and instance inheritance,
   invalid/external SVG, bad supply, dimensions/memory/time/output bounds,
   malformed/trapped worker results and occupied/concurrent targets. Demonstrate
   the old missing-source-closure failure and the candidate closure explicitly.
3. Reproduce the complete outlined ETHOS input at all three existing sizes and
   both non-ETHOS journeys, including updates, under installed macOS and isolated
   Linux execution. Compare decoded RGBA, color metadata and package identities;
   do not invent a tolerance or infer universal equivalence from seven outputs.
4. After design approval and candidate acceptance, replace the incumbent at
   the existing worker/supply owners, remove its active assets and superseded
   notices, update precise documentation and run the native gates. Preserve
   previous source refs, evidence and the human-accepted originals. Do not
   transfer browser or visual acceptance to changed artifacts.

A renderer migration is not a prerequisite for rereading or installing the
already frozen accepted artwork. Exact-artifact browser observations, qualified
paired installation, source integration and remote recovery have their own
evidence and execution owner. Do not repeat completed delivery work to qualify a
new renderer, manufacture browser evidence or use the raw file installer to evade
the qualified publisher. A full generic graphics platform remains outside
Workline A.

### Meaningful example-update acceptance

The non-ETHOS journey must use installed public commands for input preparation
and output packaging as well as rendering and verification. `source pack`
consumes a digest-selected `architecture.pack-input/v1` file plan. Each selected
file names an input, portable output path, byte count and SHA-256. Inputs and the
new output directory resolve relative to the plan; input files need not live in
a preexisting closed directory. The existing bounded reader checks regular files
and symlink ancestry before the existing source-bundle writer copies verified
bytes and writes its manifest last. Neither arbitrary directory discovery nor
execution of input code is introduced. Opaque source/revision identity survives
relocation. Tests build both raster bundles and reader bundles through the
installed CLI, not a repository-internal helper. A package is not a release or
recoverable installation; those remain separate obligations.

The former title-only observations cannot establish semantic-update acceptance.
The current examples retain titles while adding an audit subscriber and removing
a redundant Ready state with revised result/retry conditions. Authors select
explicit versioned JSON/SVG inputs; tests require changed node membership,
directed relationships and visible conditions, then check both installed media
and relocated replay. No generic implementation or generated output is edited
to make a test pass. Invalid source/view pairings and geometric collisions must
fail rather than silently dropping claims.

These authored examples are a bounded portability and update demonstration, not
an automatic shared-semantic compiler. Task 2.3 remains open until complete
portable ETHOS rendering and required example-platform qualification settle.
Automatic view derivation, density adaptation, unsupported-semantics diagnostics
and safe installed-edition upgrades remain distinct product boundaries; neither
example determinism nor a passing label check closes them.
