---
subject: ethos:edition-provider-migration
role: handoff
state: proposed-not-authorized
relations:
  uses: ../reference/edition-provider.md
---

# ETHOS Edition Provider migration

This packet proposes a minimal source-owned **executable** Provider for ETHOS.
It is an input to a separate ETHOS Change and Work Lane. It neither authorizes
that change nor replaces ETHOS governance.

## Intended boundary

The recommended root is `integrations/architecture-publisher/provider`. The
narrow Provider package retains only:

- source adaptation from selected ETHOS facts;
- Claim Model authorship; and
- standard Edition authorship.

A separate ETHOS-owned Edition capability may retain the source-specific static
and interactive composition required for the reviewed 6000-pixel flagship and
13-page Atlas. That is authored product content, not generic Publisher runtime.
It must consume exact selected authoring bytes and expose no ETHOS governance
operation or second CLI.

The Provider returns portable Source Bundle, Claim Model, Edition, and optional
evolution values through `architecture.edition-provider-reply/v1`. It does not
return Candidate, qualification, acceptance, publication, or repository state.

Generic renderer, raster, browser-observation, qualification, and recoverable
publication mechanics belong to Publisher or replaceable backends, not to the
ETHOS Provider. ETHOS retains its scene authoring, subject-specific browser
obligations, human acceptance, and repository governance. Shared transport and
effects may be removed from the incumbent only after an installed successor
proves the same exact obligations and rollback has been rehearsed. Git and
forge effects stay with ETHOS governance, not the Provider.
Parity before removal applies independently to standard output and flagship
media.

At the 2026-09-24 review of ETHOS `9b81c72f13a344160674c82b28bd25e7f56c754c`,
its Provider selection groups entities by type, routes relations straight from
right to left, and records `authoredInputSha256` without feeding those authoring
bytes to the released generic compiler. Its synthetic conformance test therefore
does not demonstrate visual equivalence to the accepted ETHOS art.
Publisher's own self-Edition uses a separate source-owned flagship composition
and public Publisher primitives; ETHOS may follow that boundary without
extending Provider v1 or downgrading its artwork.

## Current incumbent inventory and disposition

At the later read-only ETHOS `709347f0ce0965e6a338aa5128c60c4d3f4044a8`
checkpoint, `integrations/architecture-publisher/` has 78 tracked files: five
adapter modules (538 lines), two Provider/runtime modules (100 lines), 31
Edition modules (9,841 lines), 37 non-code Edition files (20,049 lines), and
three package/metadata files (107 lines). These mechanical counts indicate
migration surface, not quality or necessary retained size. The two
`static/natural-*` modules alone contain 3,588 lines; their ETHOS-specific
abstraction and visual decisions must not simply be transplanted into a
generic Publisher kernel.

The package currently exports `provider`, `adapter`, `edition`, and `runtime`
and includes all of `src/` in its packed supply. The terminal Provider export
is already only `materializeEditionProvider`, but the other public exports
remain live in ETHOS's installed integration tests; Publisher's operations
guide names them. A tracked-reference search found no Publisher production
import of those three exports. This does not prove absence of external
consumers, and removing export names alone would not remove their packed code.

Retain ETHOS projection interpretation, source-specific claims, reader
questions, omissions, and accepted flagship art direction as ETHOS-owned
inputs. Retire or replace source-side packing, derived identity maintenance,
generic rendering, browser execution, qualification admission, standalone
packaging, and local publication effects only after Publisher's installed
public path proves the same exact obligations. A source-specific verifier or
composition rule may remain with ETHOS, but it must be identified as such
rather than moved wholesale into Publisher or hidden behind a compatibility
facade. This inventory is not a per-file deletion authorization.

## Migration sequence

1. Open one ETHOS-owned Change and one owned Work Lane; use ETHOS prewrite,
   proof, exact Git CAS, and Attestation contracts throughout.
2. Freeze the accepted incumbent Provider package, Source Bundle, Claim Model,
   Edition, scenes, artifacts, Candidate, qualification, and publication
   identities.
3. Create one package with one selected public export named
   `materializeEditionProvider`; bind the package manifest, complete package
   content, public export, and input identities.
4. Run the common Provider profile in a bounded child process with empty user
   configuration, no adjacent checkout, and no inherited credential.
5. Build the standard Candidate with `archpub edition build`; verify its
   semantic, source, Edition, and structural-media obligations. Do not call it
   the reviewed flagship merely because its Provider or scene digest passes.
6. Independently build the ETHOS flagship Candidate from exact source-owned
   authoring through Publisher public primitives. Prove static and interactive
   semantic, scene, artifact, and reader parity with the selected incumbent, or
   obtain explicit review and acceptance of a precisely described successor.
7. Re-run ETHOS source, governance, lane, proof, CAS, browser, accessibility,
   human review, recovery, and release acceptance for the exact candidate.
   Neither Provider conformance nor the structural Candidate substitutes.
8. Exercise rollback, then remove only superseded generic mechanics and public
   migration exports. Preserve ETHOS-authored composition and immutable receipts.

## Ownership

- `subject`: ETHOS.
- `producer`: the exact selected Architecture Publisher release.
- `authorizationOwner`: ETHOS.
- `custodian`: the ETHOS-selected release and publication targets.

ETHOS owns lanes, proof, CAS, acceptance, and publication. Architecture
Publisher owns generic compilation, rendering, qualification contracts, and
recoverable publication mechanics. Skills remain replaceable methods under both
products; they do not acquire lifecycle authority.

## Required evidence

- exact incumbent and replacement package identities;
- common Provider conformance with per-predicate evidence;
- separate standard and flagship Candidate identities, each bound to its own
  consumed authoring inputs, semantic coverage, scenes, and artifacts;
- flagship media parity or an explicitly reviewed successor delta, never an
  inference from `authoredInputSha256` alone;
- installed offline build with no source checkout;
- browser, accessibility, raster, and human review for the selected artifacts;
- publication replacement and interruption-recovery rehearsal; and
- ETHOS-owned proof, acceptance, protected-ref publication, and readback.

If parity, rollback, or source-owned acceptance fails, preserve the incumbent and
report the exact gap. Do not add a compatibility facade, copied task ledger, or
second command plane.
