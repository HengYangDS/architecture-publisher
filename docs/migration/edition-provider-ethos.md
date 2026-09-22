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
package retains only:

- source adaptation from selected ETHOS facts;
- Claim Model authorship; and
- Edition authorship.

The Provider returns portable Source Bundle, Claim Model, Edition, and optional
evolution values through `architecture.edition-provider-reply/v1`. It does not
return Candidate, qualification, acceptance, publication, or repository state.

Generic renderer, browser, raster, qualification, review, publication, Git,
forge, and governance mechanics belong outside the ETHOS Provider. They may be
removed from the integration only after parity before removal has been proved
against the selected incumbent output and rollback has been rehearsed.

## Migration sequence

1. Open one ETHOS-owned Change and one owned Work Lane; use ETHOS prewrite,
   proof, exact Git CAS, and Attestation contracts throughout.
2. Freeze the accepted incumbent Provider package, Source Bundle, Claim Model,
   Edition, scenes, artifacts, Candidate, qualification, and publication
   identities.
3. Create one package with one selected public export named
   `materializeEditionProvider`; bind exact package and input identities.
4. Run the common Provider profile in a bounded child process with empty user
   configuration, no adjacent checkout, and no inherited credential.
5. Build with `archpub edition build`; prove either byte-identical parity or an
   explicitly accepted semantic successor.
6. Re-run ETHOS source, governance, lane, proof, CAS, human review, and release
   acceptance. Provider conformance does not satisfy these gates.
7. Exercise rollback, then remove the superseded generic mechanics from the
   integration and retain only immutable receipts.

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
- semantic, scene, artifact, and Candidate parity or approved successor delta;
- installed offline build with no source checkout;
- browser, accessibility, raster, and human review for the selected artifacts;
- publication replacement and interruption-recovery rehearsal; and
- ETHOS-owned proof, acceptance, protected-ref publication, and readback.

If parity, rollback, or source-owned acceptance fails, preserve the incumbent and
report the exact gap. Do not add a compatibility facade, copied task ledger, or
second command plane.
