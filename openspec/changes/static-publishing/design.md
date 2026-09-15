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

An outlined publication is a derived delivery artifact, not an editable source
or a replacement semantic graph. Keep a text alternative and source identities.
Do not commit system font bytes. Renderer antialiasing changes are recorded and
reviewed; old approval does not silently transfer to new pixels.

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
