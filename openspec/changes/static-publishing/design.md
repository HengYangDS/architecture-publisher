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

## ETHOS static edition

Move the useful original composition/geometry functions, with provenance, into
the ETHOS edition and explicit geometry modules. Keep source semantics, view
design, font measurement and rasterization separate. Preserve original authored
labels, positions, relationships and accepted bytes. A licensed-font macOS
adapter may reproduce the historic scene; it is not the default portable path.
Portable measurements and outputs must be qualified against source obligations,
not declared equivalent merely because their hashes are stable.

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
