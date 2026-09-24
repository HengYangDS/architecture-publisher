---
subject: aigw:edition-provider-migration
role: handoff
state: v1-location-observed-successor-spec-reviewed
relations:
  uses: ../reference/edition-provider.md
---

# AIGW Edition Provider boundary

This packet separates an observed AIGW v1 adoption from a proposed successor
migration. It is not AIGW authorization, acceptance, or publication. The
successor specification is reviewed, but its implementation and release are
pending; no AIGW source change is authorized by this packet.

## Observed v1 state

At AIGW `ea9b600b957f53737eb605772825e43de2d01ac5` on 2026-09-24,
`architecture/edition-provider/` already exists as the AIGW-owned declarative
Provider root. It contains `architecture.edition-provider/v1` in
`provider.json`, Source Bundle v1 and Claim Model v2 under `_source/`, Edition
v1, evolution inputs, immutable history, source and installed tests, and
`materialize.mjs`. The previous `docs/architecture/client-projection` owner is
not tracked at this revision. Its `selection.json` pins the published
Architecture Publisher `0.3.0-alpha.1` package and exact package identities.

The authored scope is **AIGW Client Projection**, not the whole AIGW product.
The Provider's 64-hex subject revision is computed by SHA-256 over
Publisher-canonical semantic JSON after removing `context.revision`; it is not
a Git commit. `materialize.mjs` selects live source files, rewrites derived
revision and digest fields, packs a Source Bundle, validates an Edition, runs
both direct and Provider builds, and atomically updates tracked values. This
observation establishes the current physical location and v1 input mechanism,
not the successor contract's acceptance, media quality, or hosted availability.

## Reviewed successor boundary

Do **not** move the directory again merely to satisfy this packet. AIGW shall
retain authority over its native facts, Client Projection scope, editorial
choices when it is the named editor, acceptance, and product release. Publisher
shall own the generic versioned input protocol, derived lock and Candidate,
rendering, browser/accessibility qualification, and optional bounded local file
effect. Source location and provider mode do not confer editorial or release
authority in the universal product.

Under a reviewed successor, AIGW may keep declarative selection of exact native
source and Edition authoring while Publisher generates content identities and
seals. The content-derived revision needs an explicit kind, canonicalization,
input set, and verifier; it must never be sent to Git as a guessed commit. AIGW
should not have to maintain duplicate Publisher hashes, packed source snapshots,
or generic build effects merely to express a 12-entity/11-relation chapter. Its
existing `_source` tree is still a selected v1 provenance carrier, not proved
disposable residue. Retire or relocate only the portions replaced by an
accepted, reproducible successor; preserve exact historical identities and a
rollback route. A whole-product AIGW Edition is a separate editorial scope and
cannot be asserted by relabeling the Client Projection.

## Conditional migration sequence

1. In the AIGW-owned work process, freeze its current Provider, Source Bundle,
   Claim Model, Edition, package archive, source-member hashes, and resulting
   Candidate and media identities. Record the existing v1 acceptance and
   publication state rather than inferring it from this packet.
2. Wait for the Publisher successor's **reviewed specification**, implementation,
   installed conformance, release, and exact artifact identities. Do not migrate
   against an unapproved design or a neighboring Publisher checkout.
3. Choose AIGW's exact source claimant, Edition editor, accepter, custodian,
   revision kind, and selected native inputs. Keep historical v1 bytes intact;
   introduce a versioned successor selection rather than reinterpreting v1.
4. Verify direct and declarative input preparation reach the same normalized
   selected contents; run common conformance, relocated offline build, exact
   semantic and visible-carrier checks, independent static/interactive media,
   browser/accessibility tests, and source-specific reader review. A semantic
   change needs an explicitly reviewed successor Edition, not a parity label.
5. Only after AIGW's own admission and rollback rehearsal, remove the
   displaced materialization, duplicate digest-maintenance, or captured-source
   owners. Retain native source meaning, authored Edition intent, immutable
   history, and any proven necessary source snapshot. AIGW alone decides its
   protected-ref, release, custody, and remote-readback effects.

## Handoff evidence and limits

The next AIGW writer needs exact before/after identities for selected native
sources, revision computation, Provider reply, Edition project, Candidate,
static and interactive media, qualification, and release. It must distinguish
an installed Publisher build from AIGW acceptance. Publisher conformance cannot
approve an AIGW Change, advance its refs, or make generated media source truth.
This packet has not executed that successor journey and does not claim that the
v1 installed tests qualify the future protocol.
