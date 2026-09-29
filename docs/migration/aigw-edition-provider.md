---
subject: aigw:edition-provider-migration
role: handoff
state: released-core-source-adoption-unverified
relations:
  uses: ../reference/edition-provider.md
---

# AIGW Edition Provider boundary

This packet separates an observed AIGW v1 adoption from a proposed successor
migration. It is not AIGW authorization, acceptance, or publication. The
[operational release reference](../reference/operations.md) names Publisher's
current verified release; `v0.3.0-alpha.4` was the first historical v2
baseline, not an automatic AIGW selection. The provisional AIGW probes below
do not establish AIGW's selection, acceptance, or release.
Publisher implementation or release does not authorize AIGW migration; no AIGW
source change is authorized by this packet.

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
both direct and Provider builds, then replaces tracked files one by one, with
exception-triggered rollback. This establishes the current physical location
and v1 input mechanism,
not the successor contract's acceptance, media quality, or hosted availability.

### Read-only responsibility map

The existing declarative location is already correct. Migration should change
which responsibilities AIGW must maintain, not move the directory again:

- `internal/**` and the native architecture policy remain AIGW's behavior
  owners. `_source/semantic.json` is a curated, source-bound Client Projection
  with 12 entities, 11 relations, and 11 claims over 14 provenance members.
  Its distinctions and asserted planes are authored meaning, not mechanically
  proved by matching Go-file hashes. Keep or deliberately migrate that meaning;
  do not delete it merely because a native-input adapter becomes available.
  Its source digests and content-derived revision are separately generated
  fields, not extra editorial authority.
- `edition.json` owns the chapter's four explicit reader questions, selected
  claims, scope, narrative, and independent media choices. Those are AIGW or
  its named editor's decisions. `evolution.json` selects comparison inputs and
  any correspondence; `history/**` retains immutable v1 values. A whole-AIGW
  Edition requires a separate editorial scope, not a renamed chapter.
- `_source/manifest.json` and `_source/source/**` are selected v1 replay and
  provenance carriers, not live Go implementation owners. `provider.json`
  carries the declarative v1 selection. Preserve their exact historical
  identities until a successor proves relocated offline input, source
  integrity, and rollback; then retire only the displaced mutable copies.
- `selection.json` mixes AIGW's exact Publisher package choice and explicit
  non-authorizing role declaration with generated Provider, Candidate, and
  migration hashes. `provider-evolution.json` is derived from selected
  `evolution.json`. The successor must let AIGW select its toolchain, native
  inputs, and editorial intent while Publisher derives and checks the locks,
  seals, comparison projection, and Candidate identities.
- `materialize.mjs` currently verifies and installs a selected Publisher
  archive, selects live source paths, computes the content revision, invokes
  `source pack` and both direct/Provider `edition build`, then uses per-file
  atomic replacement with exception-triggered rollback. This is not an atomic
  commit across the file set or a proven crash-recovery guarantee. AIGW retains
  source selection and any deliberate semantic adaptation; generic package
  installation, packing, digest
  rewriting, build comparison, and replacement mechanics should not remain a
  mandatory source-side authoring burden after admitted successor parity.

`test/source.test.mjs` is wired into AIGW's native quality graph and proves
selected byte consistency, not implemented behavior or a final publication.
`test/installed.test.mjs` requires exact package inputs through environment
variables; no tracked invocation of that file was found in the current AIGW
quality graph. Its successor journey must be executed and admitted by AIGW,
not inferred from Publisher conformance. This map is not per-file deletion
authorization or proof that the released successor can replace v1 for AIGW.

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
2. Select one reviewed Publisher release from the operational reference by its
   exact archive digest. Verify its installed conformance and exact artifact
   identities. Do not silently use the historical alpha.4 baseline, migrate
   against a neighboring Publisher checkout, or infer AIGW acceptance from a
   Publisher release.
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
Provisional installed and relocated Client Projection and whole-product builds
at Publisher `0e391e7` and AIGW `bd3c09d5` are recorded in
`conformance/evidence/aigw-client-paired-installed-probe.json` and
`conformance/evidence/aigw-product-installed-probe.json`. Those exact Candidate
bytes are not final released inputs, AIGW acceptance, a source-delta update, or
publication recovery. This packet has not executed AIGW's source-owned
successor migration.
