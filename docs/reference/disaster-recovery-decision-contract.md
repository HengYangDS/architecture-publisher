---
subject: architecture-publisher:off-host-recovery
role: reference
state: active
relations:
  governed_by: ../product-contract.md
---

# Off-host disaster-recovery decision contract

Independent off-host recovery is **unproved**. This contract names the operator
choices, protected inventory, failure model and clean-host acceptance required
before any stronger claim. It selects no destination, tool, key, credential or
retention period and authorizes no backup or restore effect.

## Authority and scope

Architecture Publisher owns the recovery requirement for its source, package,
self-Edition and releases for which it is the actual custodian. This does not
make Publisher the fact, acceptance or custody owner of ETHOS, AIGW or another
adopter's live Provider, Edition or product release. Historical adopter-themed
assets already held in a Publisher release remain in that release's protected
inventory until an exact custody transfer and retention decision is verified.
Physical co-location is not a transfer of product authority.

ETHOS may offer a managed-repository recovery template; an adopter selects its
own protected set and custodian. The operator selects the independent failure
domain and credentials. Publisher's local file-plan recovery protects one
authorized installation operation; it is not an off-host backup.

## Required operator decisions

| Decision                       | Required operator value                                                                                         | Admission question                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Recovery tier                  | Reader-only media access, or complete product rebuild and local-effect recovery                                 | Does the protected set and rehearsal prove only the selected tier, without calling a reader copy a complete backup?        |
| Failure domain and destination | Named store, location, account/control-plane independence and correlated-failure assumptions                    | Does loss or compromise of the workstation **and** primary forge leave the selected bytes and restore authority available? |
| Custodian                      | Named accountable owner, backup operator, restore operator and deletion authority                               | Who can prove custody, authorize restore and retire old copies?                                                            |
| Recovery objectives            | Maximum accepted data loss, restore time and required point-in-time consistency                                 | Which exact source and release state must be recovered, and by when?                                                       |
| Retention                      | Versions, duration, expiry, legal holds, withdrawal and deletion conditions                                     | Can the last proven-good snapshot survive corruption, accidental deletion and delayed detection?                           |
| Encryption and keys            | At-rest/in-transit method, key owner, clean-host access, escrow, rotation and loss procedure                    | Can the custodian restore without the lost host or an unrecorded personal secret?                                          |
| Bounded credentials            | Separate selected writer/reader identities or a justified shared identity, scopes, expiry, revocation and audit | Can unattended transfer and clean-host readback terminate without prompts or privilege widening?                           |
| Restore environment            | Supported clean host, bootstrap runtime, offline supplies, trust roots and permitted network dependencies       | Can restoration succeed without the primary workstation or an adjacent checkout?                                           |
| Inventory and acceptance       | Exact protected/excluded set, manifest format, verification predicates and responsible accepter                 | What evidence distinguishes a complete restore from a successful upload?                                                   |
| Cost and operations            | Storage growth bound, transfer cadence, monitoring, ownership handoff and tool exit path                        | Is the selected scheme maintainable without a second product authority?                                                    |

The operator must select and record these values before implementation. A
destination with a different URL but the same deletion credential or failure
domain is not automatically independent. GitLab, package storage, CI,
Documents and same-disk copies may each be useful delivery or convenience
surfaces; none alone proves independent recovery.

## Required protected set

The selected tier fixes the inventory. Reader-only recovery requires exact
standalone HTML and static media, a release identity, member sizes and SHA-256
hashes, applicable human-acceptance evidence and independent verification
anchors. It establishes access to accepted reader artifacts, not source
reconstitution, package installation or local-effect recovery.

Complete recovery includes that reader set and must additionally enumerate,
rather than infer:

1. Publisher's complete required Git object closure, selected protected refs,
   signed annotated tags and exact repository metadata needed to reconstruct
   the accepted and release states.
2. Every release record and asset for which Publisher currently holds custody,
   including historical signed release bytes; package archives, their
   uncompressed-content identities, checksums and dependency/supply closure
   required for the selected installed journeys.
3. Publisher's self-Edition authored inputs and exact source selections, plus
   accepted Candidate, Qualification, publication, replacement and recovery
   receipts not reconstructible from the Git/release inventory.
4. Public verification keys, trust policy and non-secret credential identity,
   scope and revocation metadata. Private signing and decryption material has
   its own authoritative custody decision and is never bundled with the
   artifact archive or copied into its manifest.
5. Explicit exclusions: reproducible caches, temporary worktrees, build
   scratch, unaccepted candidates, foreign/unknown state and adopter-owned
   source or release data not under Publisher custody.

An exact snapshot manifest binds source ref object IDs, release asset hashes,
package content identities, evidence subjects and the time/sequence of the
selected state. It must detect a partially captured or internally inconsistent
set before that set is promoted as restorable. Issues, merge requests, CI logs
and other forge metadata are included only if the operator selects and
inventory-binds them; Git objects alone do not reconstruct those services.
The manifest distinguishes source bytes, reader media, evidence and restore
instructions rather than flattening them into one public download.

Secrets stay in their authoritative stores. Inventory and logs contain only
non-secret metadata, never token values, private keys or secret hashes.

## Backup and retention acceptance

After the operator's decisions, an implementation may select a maintained
backup/transport tool at the narrow transfer boundary. It must capture one
consistent inventory, encrypt and transfer the exact selected bytes, read them
back from the independent destination, verify the manifest and record a
bounded receipt. Upload success, an unverified listing or primary-forge
availability is insufficient. A failed or partial transfer cannot replace the
last verified recoverable point. Expiry and deletion occur only under the
selected retention policy and after preserving legal holds and the last
required proven-good point.

## Restore acceptance

A bounded rehearsal starts on the selected clean host with only documented
bootstrap and restore authority. It restores into an isolated target, never
overwrites a live accepted repository as its first action, and proves:

1. Encrypted material is fetched and decrypted with the selected bounded
   credential and key route, independently of the lost host and primary forge.
2. Manifest member sizes and SHA-256 hashes, release records and selected asset
   bytes agree at one declared recovery point; missing, altered, extra or
   expired members fail before promotion. For complete recovery, signed objects
   and tags, object types, refs and package identities also agree with
   independent trust anchors; the backup's own assertions cannot be their sole
   verification authority.
3. Both reader media open independently and retain the applicable acceptance
   evidence. For complete recovery, the Publisher repository, package,
   self-Edition and Publisher-custodied releases can be reconstructed without
   an adjacent checkout. Exact packages install offline; one selected Edition
   rebuilds to the recorded Candidate and media digests; local publication
   recovery is rehearsed in an isolated destination containing foreign files.
4. The restored state meets the selected recovery-point and recovery-time
   objectives. The receipt names the source point, oldest recoverable accepted
   revision, actual elapsed time, preserved foreign content, credential scope,
   omitted/excluded material and any unresolved limitation.
5. Source-product acceptance and release authority remain with their declared
   owners. A restored Candidate or receipt does not mint new acceptance.
6. Missing, expired, revoked, over-broad or incorrectly scoped credentials
   fail closed without prompt loops, scope widening or silent fallback.
7. The rehearsal leaves an immutable, exact-subject receipt, verified readback
   and no unowned secret, process, temporary artifact or live-state mutation.

The selected custodian and accepter review the receipt before any operational
cutover. Successful local backup, forge push, package upload, CI run or file
existence is not a substitute for this clean-host restore proof. Until the
operator has selected the missing values **and** the exact rehearsal passes,
independent off-host recovery remains `unproved`.

An invalid hash, unavailable key, implicit network fetch, host-specific path
or missing selected source input fails the applicable recovery tier. Retain the
exact report and repeat the rehearsal after a change to the package, backup
format, trust anchor, destination or credential policy.
