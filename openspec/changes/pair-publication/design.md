## Context

The current producer emits manifest.json, 13 HTMLs and two license files. The
legacy publisher expects atlas-manifest.json, publication/, authoring sidecars
and review paths. Those are different envelopes, not different product meaning.
The existing approved design owner is the retained Archify repository's
`docs/architecture-product-design.md`; workline-A status stays in the native
repository's existing execution record. This Change owns only its task state.

## Goals / Non-Goals

Goals: directly consume current exact artifacts, retain explicit evidence scope,
reuse existing installation/recovery, preserve delivered art and unrelated files.
Non-goals: replace the browser gate, infer review approval, rebuild ETHOS, redesign
artwork, implement a general workflow framework or rewrite historical receipts.

## Decisions

1. One generic bounded file-envelope reader owns safe member paths, regular-file
   reads, complete membership and hashes. Source envelopes retain their original
   schema and behavior; the atlas adapter validates its own metadata and reuses
   the same file boundary. Never serialize a fake source/legacy manifest.
2. The edition owns source/edition/output agreement and exact page/license
   identities. A read result says file integrity, not semantic/browser approval.
   Reuse existing source and edition selection; do not rerender as a read effect.
3. The existing pair qualifier consumes frozen reviews plus explicit narrow
   continuity, independently derived runtime obligations and real observations.
   Stale quality or browser evidence is refused, not silently transferred.
4. The existing file installer remains the single switch/recovery owner. Migrate
   useful implementation with provenance; no separate service or state machine.
   Generic installed usage has no personal paths, agent auth or neighbor imports.

### Review input and applicability

Retain the existing reader-review verifier's historical checks, but make its
file reads consume explicitly digest-selected evidence bundles, not a live
legacy checkout. The reader report, its prompt/log, owner visual record,
predecessor applicability and diagram comparisons keep their original bytes
and original paths inside those bundles. Stored scripts are evidence bytes,
never executable inputs. Partition historical snapshots into bounded bundles
instead of raising the shared file-reader limit or tracking generated artwork.

The current adapter separately compares old and new source identities, every
page and authoring specification/binding. Unchanged pages must be byte-identical.
An explicitly selected editorial item may only remove a surplus subtitle suffix
so that the subtitle equals the source-owned maturity notice. It must leave all
other specification fields/bindings unchanged and reproduce exactly the two
whole-subtitle replacements in HTML. Bind the selected old/new hashes and the
accepted correction's source documents; arbitrary substitutions are rejected.
This observes applicability within retained review limits, not a new independent
review or browser approval. Current browser observations remain mandatory.

### Qualified pair composition

The existing file installer moves to src/publication/files.mjs unchanged first,
with all interruption/recovery tests. Its explicit two media roots become a
bounded list of source roots, so evidence inputs need not be hidden under a
personal common ancestor. The media remain static/native and atlas; no ETHOS
semantic state enters the generic engine. Existing lock namespace remains for
cooperating-writer exclusion during migration, not as an ETHOS dependency.

The edition publisher composes current atlas identity, frozen-review continuity,
static artifact/reproduction/visual-subject binding and current browser report
coverage. It generates the same exact-target file plan only after those checks.
Apply requires exact plan owner acceptance and recomputes qualification plus
file identities; recovery uses the persisted file plan even if old source moved.
A parsed report does not authenticate its execution. Accepted observed-run
provenance remains an operator qualification requirement; do not label synthetic
boundary tests as production success. Absent browser reports must stop before
any Documents or recovery write.

## Risks / Trade-offs

A digest supplied by the same caller is identity selection, not independent
trust. Exact-byte validation cannot prove readability. File checks return
observed bytes; publication must revalidate effect-time inputs. Multi-directory
installation is recoverable, not globally atomic. Portable raster appearance
remains the separate static-publishing Change's responsibility.

## Migration Plan

First extend the existing file-envelope boundary and add a current-atlas reader,
with negative tests and the real 13-page payload. Then migrate review, runtime
observation and existing publisher/installer consumers. Remove active legacy
entry duplication only after replacement qualifies; preserve historical code
in Git and prior evidence unchanged. No accepted ref moves until native gates.

## Validation Strategy

Cover missing/unknown/duplicate members, hash/size/license/source/edition drift,
escape/symlink paths and unchanged source/artifacts. Exercise installed code with
explicit relocated inputs and no original checkout. Missing, synthetic or stale
browser evidence must reject before installation. Qualified publication needs
actual current runtime observations plus original-target installation, payload
hashes, preserved files and recoverable interruption evidence.

### Reader payload and evidence retention

The file plan installs only reader-facing static HTML/SVG/PNG and the atlas's
complete HTML/license payload. Qualification manifests, source construction
records, screenshots and exports remain effect-time dependencies, but are not
copied into Documents or reader packages. The installed manifest describes the
actual payload rather than advertising excluded input members.

The remote reader package contains the selected standalone HTML, high-resolution
PNG and checksums. Source refs, qualified-release metadata and recovery inputs
have separate acceptance duties. Routine diagnostic iterations are local work,
not new remote packages. Retiring intermediate packages requires exact retained
dependencies and restoration evidence; the predecessor histories remain local
by the owner's decision. No new archive project or storage service is introduced.

### Evolution boundary

Frozen-edition replay does not implement semantic updates. Future work must
compile changed source entities, relations and obligations into an explicitly
selected candidate edition, then invalidate only evidence whose subjects changed.
It must preserve unchanged acceptance identities without transferring approval
to changed HTML or pixels. Title-only examples do not prove this capability.

First installation and stored-plan replay do not implement safe edition upgrade.
A replacement must bind the previous managed receipt and file preimages,
preserve unknown or locally modified content and reuse interruption recovery.
The current collision rejection remains intact until that contract is implemented
and tested. These future capabilities are not claimed by this Change's delivery
closure and do not justify redesigning already accepted artwork.
