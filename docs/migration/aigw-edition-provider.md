---
subject: aigw:edition-provider-migration
role: handoff
state: proposed-not-authorized
relations:
  uses: ../reference/edition-provider.md
---

# AIGW Edition Provider migration

This packet proposes a source-owned **declarative** Provider for AIGW. It is an
implementation input to a separate AIGW Change; it does not authorize mutation,
acceptance, publication, or removal in that repository.

## Intended boundary

The recommended product-owned root is `architecture/edition-provider`. It owns:

- one closed `provider.json`;
- the four mutable values currently represented by `README.md`,
  `claim-model.json`, `edition.json`, and `evolution.json`; and
- the two immutable history values under `history/`.

The four mutable values become the live source-owned inputs. The two immutable
history values remain evidence and must not be rewritten as current intent.
Architecture Publisher retains only a compact immutable conformance receipt
after parity.

## Migration sequence

1. Open one AIGW-owned Change and Work Lane; its task ledger remains in AIGW.
2. Freeze the current six file digests and current Candidate identities.
3. Move the four mutable values and two immutable history values into the
   product-owned root without semantic edits.
4. Add a declarative `architecture.edition-provider/v1` manifest selecting the
   exact Source Bundle, Claim Model, Edition, and evolution identities.
5. Build through `archpub edition build`, run common Provider conformance, and
   reproduce the frozen semantic, scene, artifact, and Candidate identities in
   an isolated directory with empty configuration and no adjacent checkout.
6. Require parity before removal. Only then delete the old mutable
   `docs/architecture/client-projection` owner while preserving the two history
   values and an explicit rollback ref.
7. Let AIGW accept and publish through its own repository lifecycle.

## Ownership

- `subject`: AIGW.
- `producer`: the exact selected Architecture Publisher release.
- `authorizationOwner`: AIGW.
- `custodian`: the AIGW-selected release and publication targets.

AIGW owns acceptance and publication. Publisher conformance cannot approve an
AIGW change, advance an AIGW ref, or turn a generated artifact into source truth.

## Required evidence

- before/after digests for all six existing values;
- Provider manifest and materialization receipt identities;
- identical inner semantic, Edition, scene, artifact, and Candidate identities;
- relocated offline execution with empty user configuration;
- exact rollback ref and successful restore rehearsal; and
- AIGW-owned acceptance, remote publication, and readback results.

Any semantic change is a successor Edition, not migration parity. Any failed
predicate keeps the incumbent mutable owner and rollback material intact.
