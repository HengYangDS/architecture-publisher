---
subject: architecture-publisher:operations
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Architecture Publisher operational reference

This document describes the 0.3 CLI surface. A development checkout is not a
release, and a Publisher release is not adopter acceptance. Retained release observations
are indexed separately below. The OpenSpec task ledger owns implementation status;
this reference does not.

## Release identity

`VERSION` is the sole manually maintained product-version source. The existing
release projection derives npm package versions, internal dependency pins and
lock identities from its strict Semantic Versioning 2.0.0 value. The private
root manifest has no product version. `node tools/release/version.mjs --check`
refuses drift without changing files; `--write` updates those owned projections.
Installed packages read their projected manifest version without a source checkout.

The root [`CHANGELOG.md`](../../CHANGELOG.md) is the human-facing release
history. It follows Keep a Changelog, but it is not evidence that a tag, package,
Forge release, hosted pipeline, or installation exists. Those projections are
verified independently. Published bytes are immutable; any change requires a
new version.

The installed Core runtime contract remains `node >=22`. Development tool selection,
CI prerequisites and remaining dependency risks belong to
[Development and verification](development.md#toolchain-and-supply).

Release tags belong to the protected `v*` family. Publication binds a signed,
annotated `v<version>` tag directly to the selected release commit; the tag name,
workspace version, package versions, and first dated Changelog section must
agree.

Before pushing a new tag, create it locally and run the full repository gate
with that exact tag present. Compare its tagger calendar date with the dated
Changelog section; a passing untagged branch pipeline is not this check.

Store each release asset once in the selected Forge package registry, then link
the Release to that same-host package API URL. Do not duplicate the payload as
a project upload. Before accepting custody, download every selected asset with
noninteractive authentication, a bounded deadline and an isolated destination.
Compare every size and SHA-256 with its frozen manifest and compare the checksum
file with its independently selected digest. A link record, API-only readback
or one successful download does not prove the complete consumer journey.
Failure preserves the receipt without an automatic alternate storage route.

## Release evidence

The table indexes retained observations, not current product policy or live
availability. Each receipt owns its source, qualification, acceptance and
custody limits; later source or reader bytes do not inherit them.

The [alpha.14 receipt](../../tests/conformance/evidence/release-alpha14-readback.json)
binds the software and self-reader independently. Its selected custody is the
[software Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.14)
and [self-reader package](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/packages/263).

Earlier readbacks retain their exact downloads, installed replay and limits:
[alpha.11](../../tests/conformance/evidence/release-alpha11-readback.json),
[alpha.10](../../tests/conformance/evidence/release-alpha10-readback.json),
[alpha.8](../../tests/conformance/evidence/release-alpha8-readback.json),
[alpha.7](../../tests/conformance/evidence/release-alpha7-readback.json),
[alpha.6](../../tests/conformance/evidence/release-alpha6-readback.json), and
[alpha.5](../../tests/conformance/evidence/release-alpha5-readback.json).
The [alpha.5 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.5)
and [alpha.4 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.4)
retain their selected manifest/checksum identities. Alpha.4's earlier
authenticated-upload limitation belongs to the historical snapshot.

The complete earlier release narratives remain in the
[immutable operations snapshot](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/blob/f0774ca579deb62c4b7438cbc7da4ab9c8107f4b/docs/reference/operations.md).
Its bytes preserve historical failures, deviations, recovery and custody
observations; they are not instructions to replay an obsolete release.

## Authority and state model

Architecture Publisher consumes selected values. It does not discover a
repository, infer intent from code, execute an SDD lifecycle, or synthesize
acceptance.

The Build Request selects two independent inputs: source-owned facts and an
editor-authored Edition. Direct reads or selected Providers materialize those
bytes into one checked input lock. Publisher validates source-bound meaning,
resolves Edition coverage, composes separate media, and emits an unaccepted
Candidate. External predicate evidence and policy assessment remain distinct
from source/editor acceptance. An explicitly authorized local Publication
Plan may then produce effect and recovery receipts.

A successful command reports only its named operation. In particular:

```text
rendered or built != qualified
qualified != authorized
applied != hosted-observed or released
```

## Installation

The repository root is a private workspace. Pack the generic core independently:

```sh
npm pack --ignore-scripts --workspace architecture-publisher \
  --pack-destination build/packages
```

The core package has no runtime npm dependencies. External editors own any
source-specific preparation and Edition packages; source repositories remain
read-only and gain no drawing files, dependencies or obligations. Installed
journeys accept caller-selected files and can run with an empty HOME and no
adjacent checkout discovery.

## Public CLI

```text
archpub source pack|verify
archpub edition build
archpub evolution plan
archpub render interactive|raster|measure
archpub qualify verify
archpub publish plan|apply|recover
```

`archpub --help` and scoped help are generated from the same declarative command
catalog that owns dispatch. Errors are JSON with a stable `error.code`; usage
errors also identify the appropriate scoped help command.

### Source Bundle

Package explicit selected files:

```sh
archpub source pack <request.json> --sha256 <request-digest>
```

The request schema is `architecture.pack-input/v1` and contains:

```json
{
  "schema": "architecture.pack-input/v1",
  "source": { "id": "system", "revision": "selected-revision" },
  "files": [
    {
      "input": "./selected/model.json",
      "path": "model.json",
      "bytes": 123,
      "sha256": "<64 lowercase hex>"
    }
  ],
  "output": "./bundle"
}
```

Verify a closed bundle without exposing member bytes:

```sh
archpub source verify <bundle/manifest.json> --sha256 <manifest-digest>
```

Selection, packaging, and verification establish byte identity only. They do not
establish semantic acceptance or publication authority.

### Edition Candidate

For new authoring, select an exact `architecture.build-request/v1` and an absent
Candidate directory:

```sh
archpub edition build <request.json> --sha256 <request-digest> --output <candidate-directory>
```

If and only if the successor request selects executable Providers, the
invoker separately adds `--execute-providers <id@manifest-sha256,...>` for
the exact selected set. Omission, an extra ID, or a changed digest fails
before executing Provider code. This option is not required for direct or
declarative inputs and does not grant source truth or publication authority.

The Build Request selects direct native source bytes and optional exact
`architecture.edition-provider/v2` manifests, one authored
`architecture.edition-project/v1`, requested media, and a toolchain profile.
Providers may be declarative or executable and may contribute distinct
namespaces; an executable Provider executes selected package code under bounded
process supervision, not a filesystem or network sandbox. The build emits an
`architecture.edition-candidate/v2` bundle with a canonical `input-lock.json`,
independent static and interactive media, their supplies, and disclosed limits.
The input lock binds selected meaning; it does not by itself establish native
dependency closure, source endorsement, or Candidate acceptance.
Successor supply records state their evidence basis and method. A checked
semantic or media-stage file set identifies installed bytes, not observed code
execution or complete common-compiler closure; remaining limits stay explicit.

An Edition may select a versioned, data-only `visualPolicy.override`. Its
`architecture.scene-refinement/v1` resource must name every requested medium:
each selects authored composition or the exact `{ "kind": "neutral" }` choice.
Neutral runs that medium's automatic compiler; it does not borrow its sibling's
geometry or approval. Missing or extra media, unsupported choices, and an
all-neutral no-op resource fail rather than silently falling back. The whole
resource is bound to the input lock. A medium Scene records only the digest of
its own authored decision; a sibling-only edit cannot change that Scene's
identity or visible artifact bytes.

Authored static canvas validation uses measured glyph boxes in the scene's
`referenceWidth` units. It requires font size at least 10, an 8-unit inset for
text inside its owning node, 5 units of clearance between text and other text
or painted marks, and a 14-unit terminal route. These are technical lower
bounds, not an art direction or human visual approval; the editor must still
judge hierarchy, density, and balanced use of space on the exact rendered PNG.
The reusable scene audit keeps text-to-non-owner geometry clearance
(`textClearance`) separate from optional text-to-text spacing
(`textToTextClearance`). An omitted text-pair value preserves the historical
overlap-only rule; it does not borrow a source contract's geometry distance.
The successor authored canvas explicitly selects the five-unit floor for both.

An authored text record may declare `owner: "node-id"`. The identifier names
exactly one source-bearing node in that medium, never a source entity or trust
owner. Its entity and relation references must already belong to that node;
Claim and editorial wording retains separate statement obligations. Measured
glyphs must fit the node's semantic port allocation. Containing paint does not
waive internal primitive boundaries, other text or geometry, routes or arrowheads.
Only the first primitive fill enclosing the semantic allocation may surround owned text; later fills
retain clearance. Native components already paint their labels and receive no
blanket owner exemption. Use explicit primitive composition for interior labels.
An omitted owner receives no inferred exemption. Static and interactive each
validate their own allocation and geometry; neither inherits sibling approval.

An authored node may select `primitives` instead of its historical component
painting: circles, rectangles, stroked lines and explicitly open/closed
polylines. Coordinates are node-local offsets from the unchanged static `box`
or interactive `position`. The compiler derives `paintBox`; an optional supplied
box must match it. Labels remain separate measured text occurrences, not fields
silently dropped with the replaced component.

Use `adornment: true` with empty `semanticIds` for geometry-only marks. They
consume painting budgets and collision checks but supply no source coverage,
inspection, group membership or source-relation endpoint. Source marks cannot
paint only the resolved background. Cancelling, zero-area or numerically
uncertain filled contours fail; lines and open paths need a visible stroke.
The final primitive must end with non-background stroke, or fill when no stroke
is selected. Final background-only overpainting is conservatively unsupported.
These checks prove bounded geometry, not perceptual visibility or art quality
at every delivery size. Limits are 32 primitives per node, 64 points per
polyline, 4096 primitives and 32768 line/vertex/closing points per canvas.

An optional `routes` array binds source relationships or editorial explanations
to existing physical segments. Each route contains `id`, one canonical
`reference`, source/target occurrence IDs, and ordered `{ edge, direction }`
traversals. Directions are `forward` or `reverse`; they do not reverse painted
arrows. An editorial route additionally binds the exact `editionSha256` and
retains its own visible statement and selected basis. It cannot become a
source relationship or make an inferred transitive edge.

Literal segments use `adornment: true`, empty `semanticIds`, explicit ordered
points and stroke/arrow geometry. They paint once; routes supply the separate
inspection records. Junction identity alone cannot bridge contacts on opposite
sides of its box. Use an explicit segment, which paints after its filled
junction. Each route needs a forward terminal arrow; opposing routes may share
unarrowed geometry but not contrary arrow evidence. Existing valid legacy
carriers need no migration merely because another route is added.

The same admitted points, stroke widths and arrow wings drive collision,
containment and emitted-paint validation in both media. Per canvas/page, limits
are 2048 routes, 2048 traversals per route, 8192 traversal references, 8192
expanded reference/graphic pairs and 32768 literal points. Repetitions count
before deduplication; repeated segments within one route are unsupported.
These finite geometric checks do not certify source truth, editorial wording
or subjective visual quality.

The retained Claim-backed plan format keeps its selected output field.
They select a Source Bundle, Claim Model member, and exact
class-free `architecture.edition/v2` file, then emit an
`architecture.edition-candidate/v1` bundle. The v1 request binds
`editionSha256`; do not pass `--output` to a v1 plan.
Edition v1 recovery uses its original versioned executor; the current runtime
does not reinterpret its quality classes or historical approval.

The result is `status: built` with `qualification: not-performed` and
`publication: not-performed`. Generated files are never authoring inputs.

### Evolution

```sh
archpub evolution plan <request.json> --sha256 <request-digest> \
  [--execute-before-providers <id@manifest-digest,...>] \
  [--execute-after-providers <id@manifest-digest,...>]
```

For native successor inputs, `architecture.semantic-compare-input/v3` selects
exact before/after Build Requests. Each executable Provider requires an
independent caller-supplied selection on its own side; the comparison plan
cannot authorize execution. Both sides' selected requests, direct inputs,
Provider manifests, packages, and declared Provider inputs are checked before
either executable runs. Process supervision does not sandbox a Provider, and
concurrent mutation or undeclared reads remain explicit limits.
The historical `architecture.semantic-compare-input/v2` selects exact
before/after Claim Models, Edition sets, and explicit correspondences. The
impact compiler returns separate obligations for:

- rebuild;
- semantic verification;
- medium verification;
- human review;
- acceptance;
- publication or withdrawal.

It performs none of those obligations, although a separately selected
executable Provider runs during input preparation. In v3,
`delta.execution.providerPackages` distinguishes added, removed, and changed
verified Provider package contents from source and native meaning changes. A
package-only change renews all selected-question semantic verification and
acceptance/publication planning without itself requiring a media redraw or
human visual review. It does not prove hermetic Provider execution. Unknown or
unrepresented meaning broadens work. Rename, split, and merge evidence
preserves lineage but never transfers approval.

### Rendering

Interactive rendering:

```sh
archpub render interactive <type> <input.json> \
  --sha256 <input-digest> --output <artifact.html>
```

The renderer consumes an explicit renderer-neutral scene or admitted native
input. It cannot discover source meaning or grant Edition acceptance.

Raster rendering:

```sh
archpub render raster <request.json>
```

The request selects a closed SVG/font bundle, its digest, the SVG member,
explicit font members and weights, target width, and absent PNG output. The
bundled Resvg supply is pinned and verified before use.

Typography measurement:

```sh
archpub render measure <request.json>
```

The request explicitly selects the native compiler, SDK, font files, and output.
This operation records measurement; it does not infer fonts from the host.
The compiler and measurement use separate private process groups with unchanged
120-second and 30-second deadlines. Each group must be reclaimed before the next
stage or scratch removal. Failure retains the bounded process diagnostics;
an unavailable checkpoint is a separate observation, never a replacement cause.
Unproved cleanup retains scratch and reports both causes. This is process
lifetime containment, not a sandbox, full SDK closure, or proof that every
historical compiler stall had one cause.

### Qualification

Predicate executors produce exact records outside the generic verification
command. Admit a selected set against its exact authorities with:

```sh
archpub qualify verify <request.json> --sha256 <digest>
```

The portable `architecture.qualification-input/v1` request selects the exact
Claim Model, Edition, Edition Candidate, and Qualification Set by relative path
and raw SHA-256. The Candidate must bind those Claim Model and Edition bytes;
the Qualification Set must bind that Candidate.

`architecture.qualification-set/v1` binds:

- candidate, Edition, source, and semantic digests;
- one or more predicate-specific records;
- exact subject identity;
- verifier identity and implementation digest;
- scope and optional environment;
- observations, verdict, and limitations.

Verification rederives scenes and obligations from the selected Claim Model and
Edition, validates record identities and uniqueness, and computes the
non-compensating conjunction of `PASS`, `FAIL`, and `UNKNOWN`. It does not run a
verifier, turn self-declaration into evidence, grant authorization, or publish.

The selected-input v2, first released in `v0.3.0-alpha.4`, uses the same
command with exact Build Request, Candidate container, and Qualification Set
selectors. An invoker may separately select an exact policy:

```sh
archpub qualify verify <request.json> --sha256 <digest> --policy <policy.json> --policy-sha256 <digest>
```

If replay selects executable Providers, the invoker must separately pass
`--execute-providers <id@manifest-digest,...>` before any policy options. Replay
rebuilds Candidate bytes from pinned inputs and runs those selected Providers
again; the Candidate or submitted evidence cannot grant execution permission.
The canonical input lock embedded in the Candidate permits later attribution
without rerunning a Provider, but it is not a full byte replay by itself.

Successor build and replay report the current installed Publisher package tree
separately from Candidate identity. The v2 `qualify verify` report deliberately
omits that tree: for a policy-backed report, publication admission rederives
its exact fields from the Candidate, Qualification Set, and selected Policy
without authenticating the replay package. The separate replay result retains
current-package evidence.
The tree covers declared package content,
including the manifest, README, runtime, renderers, and supplies. A README-only
change changes this execution evidence but not an otherwise identical Candidate.
Member paths use UTF-8 byte order, not host collation, for the tree digest.
The tree digest is neither the packed archive digest nor proof of which package
built an earlier Candidate. An accepter requiring original-builder provenance
must select and verify it independently; a replay match alone cannot supply it.

`architecture.qualification-policy/v1` names the claimed accepter, exact
Candidate digest (which binds the input lock), accepted Candidate limits, and
finite required predicate/scope/verifier/method tuples with permitted record
limitations. It must require a question-scoped predicate for each selected
view/question and all three human visual predicates (`faithful`, `intelligible`,
`aesthetic`) for every selected PNG and HTML. Each full physical or viewport
scope declares the intended display width and height, not necessarily the PNG's
raster dimensions. Every declared display scope needs all three predicates;
evidence at another size or for a sibling artifact cannot satisfy it. Artifact-only
diagnostic records cannot replace display-scoped review. The Qualification Set
cannot choose its own policy. Review uses the product contract's substantive
aesthetic duty, not restraint alone; machine geometry and pixel checks cannot
supply that judgment. The result
distinguishes missing, non-PASS, unselected, and unaccepted-limit submissions.
It remains `records-bound` and `admitted: false`: neither verifier nor accepter
identity is authenticated by this generic command. The source product owns
trust, acceptance, release, and custody decisions.

### Recoverable publication

Plan a bounded paired-file effect:

```sh
archpub publish plan <request.json>
```

The raw-pair request explicitly selects source roots, `native` and `atlas`
file-plan destinations, recovery root, payload entries, dependencies, and
optional prior replacement. It establishes file integrity only.

A qualified Edition request instead uses
`architecture.qualified-file-publication/v1`: `candidate` selects the exact
dual-media Candidate container manifest and digest; `qualifications` selects
the exact Qualification Set, selected policy, and prior `qualify verify` report
as `{file, sha256}` values. It names `roles.releaseOwner` (nullable),
`roles.custodian`, and `roles.effectAuthorizer`. `options.destinations` names
`static` and `interactive` directories plus a `recoveryRoot`; `entries` gives
each medium its `index.html` and `README.md`. Candidate and evidence paths are
portable paths relative to this request. Local delivery and recovery targets
may instead be explicit absolute paths; the plan binds their canonical resolved
locations and rejects overlap with selected sources. The plan derives its three
artifact payloads and source roles from
the selected Candidate and input lock; callers cannot supply arbitrary payload
rows in this mode. Both forms produce a dry plan without changing a delivery
target. The qualified plan, journal, and receipt retain `static` and
`interactive` media keys; `native` and `atlas` remain confined to the raw
file-integrity pair, including prior inputs. Both forms use the same local
file-effect owner.

After a source product or operator supplies an exact authorization bound to the
plan digest:

```sh
archpub publish apply <plan.json> <authorization.json>
archpub publish recover <plan.json> <authorization.json>
```

Raw authorization is `{ "decision": "AUTHORIZED", "planSha256": "<digest>" }`.
Qualified authorization uses `architecture.qualified-file-authorization/v1`
with the exact `planSha256`, an `acceptance` clause naming the selected policy's
accepter and exact Candidate, Qualification Set, and policy digests, and a
separate `effect` clause naming the local authorizer. `ACCEPTED` and
`AUTHORIZED` are distinct decisions; neither is inferred from a submitted
`PASS` report. The selected report is rechecked for Candidate-declared policy
fit, not authenticated as a verifier or source replay. The qualified receipt
records these attributed roles and decisions.

The same file engine preserves foreign content, checks destination prestate,
records its journal before delivery mutation, and supports bounded recovery
without the original Candidate or Provider. The commands establish local
filesystem effects only; they do not claim hosted availability, source-product
release, independent verification, or off-host retention.

New owner, journal, payload and metadata files are flushed through writable
handles before their write completes. Every effect result reports `durability`:
required file flushing, required directory flushing on POSIX or unsupported
directory flushing on Windows, and `powerLossRecovery: "not-qualified"`.
Required flush errors remain failures. Interrupted-process recovery verifies
retained on-disk state; it is not qualified machine-power-loss recovery.

See [Compiler API and independent media](compiler-api.md) and
[Development and verification](development.md) for their owning references.

## First-party conformance consumers

Source-product publication preparation is external. The locations below
distinguish current generic conformance from retained historical handoffs;
neither creates a source-product drawing dependency or CI gate.

- `tests/conformance/journeys/self-host/` is a bounded self-use protocol journey
  through the public generic contracts. Its Candidate declares the same strict
  review duties; successful generation is not artwork acceptance.
- `editions/self/` is the source-owned Architecture Publisher self-Edition.
- `tests/conformance/fixtures/ethos-source-owned-handoff.json` records the immutable
  historical ETHOS package, parity, semantic-successor and acceptance boundary.
  It does not declare a current integration API or require continued source-side
  drawing code. Current preparation reads pinned existing ETHOS material outside
  ETHOS, while retained works keep their exact prior identities.
- `tests/conformance/fixtures/aigw-source-owned-handoff.json` records the exact AIGW
  historical source owner, semantic values, reproduced candidate and governance
  limits. Current mutable preparation belongs to the external editor, not AIGW.
  The opt-in conformance journey selects explicit external Edition and read-only
  source roots; ordinary runtime never discovers an adjacent checkout.
- The first-party contract matrix preserves the exact 0.2.0-alpha.0
  interoperability baseline and binds the published v0.3.0-alpha.1 successor to
  its signed release, package identities, qualification set, and human review.
  A pass-shared-kernel result means the consumer crosses the same
  identity-free qualification or publication implementation already exercised
  against exact consumer bytes. The matrix does not establish source endorsement,
  designated artifact acceptance or custodian-authorized publication.

## Historical alpha.7 identity

The private GitLab predecessor project is
`dig/research/human-agent-stewardship/ethos-architecture`. Release
`v0.1.0-alpha.7` selects package `architecture-publishing/0.1.0-alpha.7` and
links the immutable alpha.5 reader release. These facts describe historical
objects and do not define the current command surface.

| Role                           | Canonical entry                                                                                    | Historical status                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Published reader               | GitLab release `v0.1.0-alpha.5` assets `ETHOS-architecture.html` and `ETHOS-architecture-6000.png` | Immutable published bytes; alpha.7 links them by URL and SHA-256 |
| Candidate viewing copy         | Local delivery `ETHOS-architecture-viewing/README.md`                                              | `VIEWING_COPY_NOT_QUALIFIED_RELEASE`; not promoted               |
| Documents convenience delivery | Local `ETHOS-architecture.html` and `ETHOS-architecture-6000.png`                                  | Preserved local bytes; not promoted by alpha.7                   |
| Complete recovery              | GitLab release `v0.1.0-alpha.3` asset `ETHOS-architecture-recovery.tar.xz`                         | Selected complete reader and publisher recovery closure          |

The preserved local convenience digests are:

```text
HTML 804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa
PNG  5f4ea104b95112d84635881600d2c75ae3eae65a45b4b61a4fe5936df3ee3cda
```

The signed alpha.8 and predecessor tags and all released bytes remain unchanged. No
predecessor repository archive is required in the successor registry.

## Off-host recovery

Independent off-host recovery remains unproved. The
[off-host recovery decision contract](disaster-recovery-decision-contract.md)
is the sole owner of tier selection, protected inventory, custody, retention,
credential boundaries, and clean-host acceptance. This operational reference
adds no alternate backup or restore policy. A local file recovery or Forge
release does not satisfy that contract.
