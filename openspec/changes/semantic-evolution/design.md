## Context

`docs/product-design.md` remains the product-design authority. This Change owns
one implementation increment, not another roadmap. The baseline release is
`v0.1.0-alpha.0` at `3963abbf931484b170996e538dce58d945981e8e`.
The selected ETHOS input is commit
`351f21c2dc320c422722f4205fc436975155f810`, tree
`2dc1fd102dc726fe1252b3cbca5266e97d4cf8e4`. Its terminal graph changes the
meaning of `candidate_base_stale`; source-document identity changes also require
review. Neither source reachability nor successful rendering proves deployment.

## Goals / Non-Goals

Deliver one source-backed semantic change through both media and safe replacement
of an actual prior installed pair. Keep old recovery exact, source meaning with
ETHOS, composition with the edition, filesystem effects with the installer, and
approval scopes explicit. Do not promise arbitrary semantic inference, automatic
layout optimization, incremental execution, cross-directory global atomicity or
independence from every native rendering prerequisite.

## Decisions

### Candidate identity and semantic coverage

New candidate inputs have an explicit schema distinct from frozen replay inputs.
They bind new source and authored bytes but do not pretend to know accepted output
hashes before rendering. The same renderer and checks serve both paths; replay
still enforces its historical output locks. No boolean bypass of input validation.

Compare stable semantic identities and complete assertion attributes, not counts
or display labels. Cover changed conditions, direction, quantifiers, scope and
maturity. Removed/unknown identities and unrepresented meaning block the affected
candidate. Source-document changes conservatively require broader review unless
their dependencies are explicitly known. Rebuild, recheck and acceptance remain
separate decisions. A coverage report is evidence, never source authority.

Authored coverage selects visible source-bound carriers. The overview remains
complete; mechanism pages are complete views rather than disconnected excerpts.
The real change must explain replay versus history-preserving merge and precise
continuation or preserved rollback, not merely replace a title. New HTML and PNG
need fresh checks. Static and interactive share meaning, not coordinates.

### Managed replacement

Extend `src/publication/files.mjs`, not a second installation engine. An optional
replacement input selects a previous complete file plan and its authorization.
Verify their digests and derive the exact prior managed set from previous payload
and entry identities. A previous receipt's inventory includes preserved foreign
files: it must never be treated as ownership of those files.

Observe current destinations; reject changed/missing managed preimages, unknown
collisions, symlinks and stale plans before effects. Preserve foreign contents
and prior history. Remove only unchanged previously owned payload no longer in
the new edition, from the staged copy only. Prior directories remain available
in the existing recovery operation. Reuse the existing pair writer, journal,
per-target rename boundaries and compensation; never claim cross-target atomicity.
Replaying the exact successful replacement is a no-op, not another upgrade.

### Qualification and delivery

Use current native semantic/geometry checks and an independent background browser
with no personal profile. Check every page, navigation, story/reset, resize,
exports and standalone packaging. Check actual glyph and path bounds, not only
declared boxes. The source quality contract owns thresholds. No old approval is
relabelled for new bytes. Publish a separately versioned release and preserve the
old release. Documents changes occur only after exact-target planning and checks.

## Execution Order

| Step | Owner and implementation | Verification |
| --- | --- | --- |
| Source and candidates | `editions/ethos/atlas.mjs`, `poster.mjs`, explicit evolution binding owner, CLI, authored inputs | Failing same-count semantic drift tests; exact old replay; changed/unsupported input refusal; full candidate generation |
| Managed replacement | `src/publication/files.mjs`, `input.mjs`, edition publication adapter | Test prior owned versus foreign files, changed preimages, removed files, interruption at each target, recovery and no-op |
| Real edition | Existing static composition and native atlas authoring | Source-bound refresh carriers; fresh metrics; complete overview and mechanism pages; both media |
| Qualification | Existing semantic, geometry, browser and review owners | Actual new bytes, all required viewports and interactions; installed package and isolated portable consumers |
| Delivery | Native ETHOS lifecycle, existing Release and Documents targets | Signed new source, actual downloaded hashes, installed readback, retired owned lane, disposable cleanup |

Write tests before behavior changes. Run focused regressions before the full
gate. Keep independent file-installation work moving if a renderer boundary is
blocked. Record edited inputs, manual layout moves, checked views and elapsed
time in the generated acceptance evidence, not a new progress ledger.

## Risks / Trade-offs

Historical replay must remain executable; preserving its schema is a reproducible
release contract, not a second mutable product authority. Conservative invalidation
can recheck unchanged pages; this is preferable to optimistic acceptance reuse.
Replacement retains bounded rollback material instead of deleting prior contents
for apparent storage savings. New glyphs may require explicit native measurement;
measured input and font supply must remain selected, not inferred from this host.
