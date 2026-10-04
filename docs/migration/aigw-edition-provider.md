---
subject: aigw:edition-provider-migration
role: handoff
state: source-provider-migrated-publication-unverified
relations:
  uses: ../reference/edition-provider.md
---

# AIGW Edition Provider boundary

AIGW's source-owned Client Projection uses declarative Provider v2 in the
existing `architecture/edition-provider/` directory. The compiler selection is
Publisher `0.3.0-alpha.7`; this packet neither changes that selection nor grants
AIGW authorization, acceptance or publication. Publisher implementation or
release does not authorize AIGW migration; no AIGW source change is authorized
by this packet.

The source observation is dated 2026-10-04 and bound to AIGW
`f43d304efd942a21400e5c6741503a7f3d09eaa3`. Its complete Provider inputs match
the exercised source `86cd24fe4d27a3bb91c6cf7b580106278d1548e7`; later task-only
commits do not change those bytes. The named AIGW source files and its existing
task 8.6 own the source-adoption result. They do not establish final release,
source-specific artwork acceptance or hosted publication.

## Source inputs and output

The authored scope is **AIGW Client Projection**, not the whole AIGW product.
A whole-product Edition requires its own reader questions and source selection,
not a renamed chapter.

| Source carrier            | Responsibility                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| `claim-model.json`        | AIGW-authored entities, typed relations, claims and provenance    |
| `edition.json`            | Four reader questions, scope, narrative and independent media     |
| `provider.json`           | Declarative v2 selection of the exact Claim Model and Edition     |
| `build-request.json`      | One public build input selecting that Provider and both media     |
| `selection.json`          | Exact published compiler package and Git-bound rollback selection |
| `test/source.test.mjs`    | Live source provenance, selected identity and rollback checks     |
| `test/installed.test.mjs` | Offline compiler installation, relocation and refusal checks      |

Claim Model `source/` locators refer to live repository-relative provenance;
they are not captured source copies. Its selected revision is content-derived;
it is not a Git commit. Byte consistency does not certify implementation truth.
The compiler records that provenance limit rather than promoting an authored
assertion into independent evidence.

The normal public build emits an unqualified Candidate. Generated locks,
Candidate manifests and media belong in owned untracked output, not beside the
source inputs as another authority. Equal selected contents or media do not
transfer approval between direct and declarative Candidate identities.

## Responsibility boundary

The [Authority Matrix](../product-contract.md#authority-matrix) governs the
generic boundary. AIGW owns its native facts and any source-specific adaptation;
the named Edition editor owns questions, omission and presentation. Publisher
owns the versioned input contract, compilation, renderer integration,
browser/accessibility observation and qualification mechanism. AIGW alone
decides its source-product acceptance, protected refs, release and custody.

The v2 source has no materialization controller, duplicate captured-source tree
or tracked generated Candidate identity. Necessary source-member and Provider
hashes still bind authored inputs; they are not copies of Publisher's derived
lock. There is no AIGW Provider command or neighboring Publisher source import.

## Finish source-owned delivery

1. Keep the selected compiler or explicitly select another published package
   by exact digest. The [release reference](../reference/operations.md#release-identity)
   describes Publisher delivery, not an automatic AIGW upgrade.
2. Follow the AIGW Provider README's locked source and installed journeys. The
   latter requires its exact archive and Release manifest; missing inputs reject
   the run. Source-only checks cannot replace installed acceptance.
3. Review selected meaning and complete figures separately for static and
   interactive media. A whole-product experiment or neutral visual baseline
   does not approve Client Projection or AIGW release.
4. Verify the signed Git-bound predecessor and required rollback input closure.
   Preserve immutable history; do not restore displaced v1 copies as live owners.
5. Apply AIGW's own acceptance and publication policy. Read back its exact
   package, diagrams, target paths and remote refs before declaring delivery.

Provider conformance establishes transport consistency, not AIGW implementation
truth. The Publisher-side direct/declarative and relocated probes remain scoped
evidence; they cannot approve an AIGW Change or complete its release.

## Historical analysis

The complete earlier v1 inventory and conditional migration analysis remains in
this [published predecessor document](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/blob/9f607e98a634819d92a508da96ac00da5d8c67e2/docs/migration/aigw-edition-provider.md).
Its September observations describe that source revision, not the current
canonical v2 owner. Required original inputs and rollback evidence retain their
native owners; this concise handoff introduces no second progress ledger.
