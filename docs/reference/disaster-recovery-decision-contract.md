---
subject: architecture-publisher:off-host-recovery
role: decision-contract
state: unproved
relations:
  governed_by: ../product-contract.md
---

# Off-host disaster-recovery decision contract

Independent off-host recovery is **unproved**. This document defines the choices
and evidence required before any stronger claim can be made; it does not select
infrastructure or authorize credentials.

## Required operator decisions

| Decision                | Required value                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| Independent destination | A failure domain independent of the workstation and primary forge    |
| Custody owner           | Named person or service accountable for storage and deletion         |
| Retention               | Version count, duration, expiry, and legal or operational exceptions |
| Encryption              | Algorithm, key owner, recovery escrow, and rotation procedure        |
| Bounded credential      | Exact writer/reader identity, scope, expiry, revocation, and audit   |
| Restore environment     | Clean host/runtime assumptions and bootstrap dependencies            |
| Restore acceptance      | Exact artifacts, histories, signatures, checks, and readback gates   |

Until all seven values are selected and exercised, the state remains
`unproved`. GitLab, package storage, CI, Documents, and same-disk copies may each
be useful custody or delivery surfaces; none alone is an independent recovery
domain.

## Required protected set

The selected policy must enumerate, rather than infer:

- canonical Git objects, protected refs, signed tags, and release metadata;
- package archives and portable uncompressed-content identities;
- source-owned Provider and Edition inputs;
- accepted Candidate, Qualification, Publication, and recovery receipts;
- public keys, trust policy, and non-secret credential metadata; and
- explicit exclusions, including caches, reproducible build output, and local
  transient state.

Secrets remain in their authoritative store. A backup inventory records only
non-secret identity and scope metadata.

## Restore acceptance

A rehearsal must start from the declared clean restore environment and prove:

1. encrypted material can be fetched with the bounded credential;
2. hashes, signatures, object types, refs, and package content identities match;
3. the repository and package can be reconstructed without the primary host;
4. installed public journeys run offline from restored inputs;
5. source-product acceptance and publication remain with their declared owners;
6. revoked, expired, missing, or over-broad credentials fail closed; and
7. the rehearsal leaves an immutable receipt and no unowned secret or process.

Successful local backup, forge push, package upload, or CI execution is not a
substitute for this restore rehearsal.
