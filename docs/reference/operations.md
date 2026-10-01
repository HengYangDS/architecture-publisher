<!-- markdownlint-disable MD013 -->

# Architecture Publisher operational reference

This document describes the 0.3 CLI surface. A development checkout is not a
release, and a Publisher release is not adopter acceptance. Exact release facts
are named separately below. The OpenSpec task ledger owns implementation status;
this reference does not.

## Release identity

The root `package.json` is the sole release-version authority for this npm
workspace. The core package, self-Edition package, dependency projection, and
lockfile must carry the same strict Semantic Versioning 2.0.0 identity.

The root [`CHANGELOG.md`](../../CHANGELOG.md) is the human-facing release
history. It follows Keep a Changelog, but it is not evidence that a tag, package,
Forge release, hosted pipeline, or installation exists. Those projections are
verified independently. Published bytes are immutable; any change requires a
new version.

The development and CI projections pin Node.js 26.10.0; the Core runtime
contract remains `node >=22`. Node.js 22 is in Maintenance LTS through
2027-04-30 and is still declared by the ETHOS source-owned integration. Its
support is a runtime compatibility promise, not a requirement to develop with
Node.js 22. The pinned `npm@11.19.1` is the version bundled by official Node.js
26.10.0. Moving to independently released npm 12 would require an explicit
bootstrap and separate toolchain qualification; changing only `packageManager`
would misstate the CI toolchain.

The LikeC4 parser supply is rebuilt from the npm lockfile. Chevrotain 11.0.3
declares the older `lodash-es` version exactly, so the workspace uses one npm
`overrides` entry to select patched `lodash-es` 4.18.1 until upstream removes
that constraint. `tools/supply/likec4.mjs --check` and the installed parser
checks bind the selected bytes; an npm audit result covers the resolved npm
tree, not every possible security property of generated code.

Release tags belong to the protected `v*` family. Publication binds a signed,
annotated `v<version>` tag directly to the selected release commit; the tag name,
workspace version, package versions, and first dated Changelog section must
agree.

Before pushing a new tag, create it locally and run the full repository gate
with that exact tag present. Compare its tagger calendar date with the dated
Changelog section; a passing untagged branch pipeline is not this check.

### Last verified asset release (2026-10-01): alpha.6

The [alpha.6 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.6)
selects signed source `04a0511ece552efd8cbda64a6eae94cb2f5e05db` and one
Generic Package version with eleven payloads totaling 8.11 MiB. The exact
6000px PNG and eight-view standalone HTML passed requester review.

The signed annotated tag was created locally and the exact tag-context full
gate passed **before** tag push. Source CI 9061 passed Linux/macOS. Every
selected asset was independently downloaded and hashed, including the
separately bound `SHA256SUMS`; downloaded packages rebuilt five workloads and
thirty Candidate files after relocation with empty PATH.

The full current [readback receipt](../../conformance/evidence/release-alpha6-readback.json)
is the evidence owner. Tag-context pipeline 9067 passed both native gates.
Its original macOS job failed one CoreText compiler invocation; an isolated
same-source native test and one exact failed-job retry passed without quality,
timeout or source changes. The original failure is retained, not erased.
Generic policy verification binds nineteen submitted records and reports
`admitted: false`; explicit owner acceptance, source endorsement and delivery
effects are separate. No ETHOS/AIGW adoption, final native Windows or
independent off-host recovery is implied.

### Historical reader release (2026-09-29): alpha.5

At the 2026-09-29 release readback, the signed `v0.3.0-alpha.5` tag,
protected `main`, and accepted `dev` selected
`67ade23f20414dc76a3ca2f65d398396c525a05d`. The [alpha.5
Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.5) links ten selected assets from one
GitLab Generic Package version, not a second project-upload copy. Its Core
archive has SHA-256
`4ce1793efecb32a8f9bbabcf5a2761ab1b587eda2ddf27ef73122b767df5d7cd`.
The reviewed 6000px PNG and standalone HTML have SHA-256 `debb4579...` and
`44dab0ba...` respectively; use the full digests in the Release manifest.

At the 2026-09-29 readback, `glab release download` 1.119.0 fetched all ten
linked assets through the supported package-API route. Nine payload assets
matched `SHA256SUMS`; the checksum file itself matched the selected local bytes
and its separate digest in the readback receipt. A signed Git tag does not sign
Release assets. Four additional GitLab-generated source archives are not part
of the selected asset set. A fresh offline install of the downloaded
Core and self-Edition rebuilt the independent-editor six-member Candidate
byte-for-byte. The exact receipt is
[`release-alpha5-readback.json`](../../conformance/evidence/release-alpha5-readback.json).
This establishes primary-forge custody at readback time, not off-host recovery,
ETHOS or AIGW adoption, or generic Candidate v2 qualification.

The required local tag-context full gate was run after, not before, the tag
push. The tag's hosted CI and the post-push local gate passed before Release
assets were created. This sequencing deviation is recorded, not treated as a
precedent or concealed by rewriting the tag.

### Historical selected-input baseline: alpha.4

The signed `v0.3.0-alpha.4` tag selects commit
`5ad344a2938e3f381d2b49e0ffba223b6d84c8bf`. On 2026-09-28, the primary
GitLab Release's 11 linked assets were fetched back and checked against their
SHA-256 manifest. The core archive's SHA-256 is
`2e0d23233e5a200d20c148983844911cfb58ebde1d94b5f01d55d540b551b716`.
Its offline-installed Core reproduced the independent-editor Candidate's exact
bytes. The Release binds separately reviewed static and interactive self-media;
neither review transfers to changed bytes or to an adopter Edition.

Use the [alpha.4 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.4), its manifest and
checksum file for exact asset selection. This is primary-forge readback, not
independent off-host recovery. ETHOS and AIGW still own their own source facts,
Edition selection, acceptance, custody and publication.

At the 2026-09-28 readback, selected alpha.4 project-upload bytes remained
available through GitLab's authenticated uploads API. On this workstation,
`glab release download` 1.119.0 returned 404 for a linked web-upload URL;
its zero-byte failed output did not establish asset loss. Machine consumers
must use a verified authenticated route and compare SHA-256. The normal CLI
download route is not yet accepted for this release.

For subsequent releases, select one Forge storage copy per asset in the GitLab
Generic Package Registry and point each Release link at its same-host package
API URL. Alpha.5 demonstrated this route with the installed `glab` CLI; that
precedent does not approve a later asset. Do not also upload
the same asset as a Markdown project upload. After creating the exact Release
links, download every selected asset through `glab release download` with
noninteractive authentication, a bounded process deadline, and an isolated
destination. Compare every payload with `SHA256SUMS` and compare that checksum
file with its separately selected digest. API-only readback, a valid link
record, or one successful asset cannot substitute for the complete consumer
check. A failure stops release acceptance without an automatic second storage
route or a claim that existing bytes were lost.

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

The core package has no runtime npm dependencies. Source repositories own their
concrete adapter and Edition packages and depend inward on an exact compatible
core. Installed journeys accept caller-selected files and can run with an empty
HOME and no adjacent checkout discovery.

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
Neutral runs that medium's ordinary compiler; it does not borrow its sibling's
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

Historical v1 plans retain their selected output field and original meaning.
They select a Source Bundle, Claim Model member, and exact
`architecture.edition/v1` file, then emit an
`architecture.edition-candidate/v1` bundle. The v1 request binds
`editionSha256`; do not pass `--output` to a v1 plan.

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
view/question. The Qualification Set cannot choose its own policy. The result
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

## Public JavaScript contracts

The core exports narrow owners:

```text
architecture-publisher/file-input
architecture-publisher/source
architecture-publisher/semantics
architecture-publisher/edition
architecture-publisher/scene
architecture-publisher/compiler
architecture-publisher/rendering
architecture-publisher/qualification
architecture-publisher/publication
architecture-publisher/runtime
architecture-publisher/renderers/archify
architecture-publisher/renderers/fonts
architecture-publisher/renderers/resvg
architecture-publisher/renderers/svg
```

`file-input` exposes `readBoundedFile` and `parseStrictJson` for independent
editors. The reader rejects observed symlinks, nonregular files, byte-limit
violations, and changes detected during the read; it does not certify a digest,
atomic ancestor confinement, source meaning, or acceptance. The `source`
subpath exposes complete Source Bundle operations, not those generic helpers.

`rendering` owns the public raster command's closed Source Bundle selection and
the measurement command's Source Bundle output. Its backends expose
`rasterizeBytes` and `measureCoreTextBytes`: they receive selected bytes or
explicit measurement inputs, not Source Bundle authority. The compiler passes
its already-selected SVG and font bytes directly to Resvg; it does not create
a temporary Source Bundle merely to call the backend.

The font-supply export owns verified font and license bytes used by the static
and neutral interactive media paths. The selected Archify 3.0.1 runtime embeds its own
licensed, self-contained font bytes in its pinned template; its interactive
path does not claim the separate `font-supply` identity. The adapter records
the original input digest, binds Archify's required `meta.output` only to a
private candidate file, and publishes solely to the caller's explicit output
path. The native update check is disabled for offline rendering.

The first-party self-Edition exports:

```text
@architecture-publisher/self-edition
@architecture-publisher/self-edition/edition
@architecture-publisher/self-edition/runtime
```

Its public Edition surface prepares explicit source-bound inputs: a Claim
Model, one Edition Project, a data-only visual refinement, and a Build Request.
Its separate generated Source Bundle supports provenance audit; it is not
selected again by the direct Build Request. The package does not emit a second
editable `architecture.edition/v1` or a self-only publication plan. The
generic Core builds both media through that Build
Request and returns an unqualified Candidate. The self Project selects a
structural static overview and eight interactive mechanism questions. Its
static view does not select the Claim facts carried by the interactive views;
the diagram's structural carriers therefore do not assert complete static
Claim coverage. Qualification, acceptance, and publication remain separate
decisions bound to exact Candidate bytes.

The current source-owned ETHOS integration package exports:

```text
@architecture-publisher/ethos/provider
@architecture-publisher/ethos/adapter
@architecture-publisher/ethos/edition
@architecture-publisher/ethos/runtime
```

`./provider` is the selected standard-value materializer. The other three
exports are migration incumbents, not the terminal Provider surface. Their
input adapters still support source import/verification, atlas, poster, review,
and publication journeys; retirement requires exact installed semantic and
flagship-media parity or a reviewed successor. The package is not a second CLI
and cannot compile ETHOS Commitments, control Work Lanes, mint proof, execute
CAS effects, or accept ETHOS state. This
repository retains only the exact digest-bound source-ownership handoff under
`conformance/fixtures/ethos-source-owned-handoff.json`. Each package identity
includes its repository, commit, repository-relative package path, Git tree
object, archive name, exact archive digest, and portable uncompressed-tar
content digest. The archive digest identifies one selected `.tgz` asset; the
content digest verifies equivalent package content across gzip implementations.
A tree object is never presented as a repository root or commit. Testing
reconstructs the packed core from that exact subtree and compares every packaged
file byte-for-byte.

## Media independence

Static and interactive scenes share semantic identities, selected coverage, and
portable design tokens. They do not share required coordinates, DOM structure,
artifact bytes, or approval.

- Static output targets single-frame comprehension and exact SVG/PNG geometry.
- Interactive output targets a complete first-screen overview plus complete
  mechanism pages, navigation, focus, trace, and contextual inspection.

The interactive `Inspect` state makes selected meaning and source identity
readable without covering part of the diagram. It does not embed source files or
invent a code link. Use the Candidate manifest and input lock for exact audit.

Neutral graph pages put exact selected relation wording on the diagram, with
font-measured wrapping and layout space; an ordinal is not a substitute for a
relation's meaning. Linked source Claims keep their plane, predicate, subject,
object, condition, scope, maturity, and declared validity in the reading view.
Full source records and method limits remain available in Inspect. Moving a
record there does not remove a selected meaning or qualify its truth.

This compositor reuses the existing bundled OpenType measurer, currently owned
by `renderers/resvg/measurement.mjs`; it does not run the raster worker to build
HTML. The selected measurement implementation is recorded separately from font
bytes. Pinned ELK receives that explicit measurer and owns complete geometry;
the SVG painter preserves its routes, labels, and node bounds. A pinned camera
supplier owns viewport interaction only. Shared paint dimensions bind audits
to emitted strokes and arrowheads; browser glyph checks remain separate.
Flat groups retain exact membership and containment. Long acyclic graphs may
use the same ELK owner's finite wrapping candidate, never an edited fallback.
Static Dagre geometry and authored Archify geometry remain independent.

The current output contracts cover SVG/PNG and standalone HTML. PDF reports and
PowerPoint stories remain [evaluated design options](../research/mechanism-evaluation.md#architecture-explanation-across-media-2026-09-30),
not implemented export commands. Exporting one diagram as a picture slide would
not establish an editable deck or a complete multi-page explanation.

A screenshot of HTML is not the static compiler. An HTML wrapper around a poster
is not the interactive compiler.

## Development and verification

Use the repository-pinned Node/npm line and lockfile:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run check` is the repository's fail-closed quality entry. It composes
Prettier, zero-warning ESLint, checked JavaScript contracts, module-direction
and dead-code analysis, Markdown and strict OpenSpec validation, measured test
coverage, and packed-package validation. Vendored Archify, font, and raster
supply remain outside first-party rewrite and dead-code ownership; their pinned
bytes are verified through supply-chain and behavior tests.

Hosted CI runs this same command on Linux ARM64 and native macOS ARM64. GitLab's
protected-ref flag selects the protected macOS Runner; merge requests and
unprotected branches select the separate review Runner. Both inherit one
project-local GitLab resource group, so Publisher's macOS verification jobs do
not compete with each other for native compiler resources. Their Runner and
trust identities stay separate; Linux and other projects are not serialized.
This scheduling constraint is not a sandbox or a proof that every historical
compiler stall had the same cause. Native macOS executes the CoreText Swift
paths that skip on other platforms. Browser and external input tests still
require their explicit selectors.

Each CI job sets `umask 022` before checkout-derived package reproduction.
Historical `contentTarSha256` identifies the complete uncompressed TAR stream,
including member modes; it is independent of gzip encoding, not of TAR metadata.
The job-local mask reproduces those recorded package modes inside the Runner's
private home. Runner service permissions and historical digests remain separate
from that artifact-build setting.

The JavaScript coverage gate selects all tracked runtime `.mjs` under
`packages/publisher/src/`, first-party
`packages/publisher/renderers/`, and `editions/self/src/`, including
`index.mjs` entrypoints. The selected module inventory is derived by the
coverage command and policed by `tests/quality-contract.test.mjs`; this prose
does not duplicate a revision-specific count. The only exclusions are the
third-party/generated renderer supply and generated authoring validators. The
validator module is reproduced from the versioned JSON Schemas by
`tools/generate-authoring-validators.mjs --check` and carries the generator's
MIT notice; the schemas and handwritten cross-reference validation remain
covered. The installed product has no
runtime npm dependencies. `tests/quality-contract.test.mjs` rejects a tracked
first-party package module moved outside the selected roots. This is a
JavaScript coverage claim, not coverage of the separately compiled CoreText
Swift helper or a substitute for native platform acceptance.

The `npm run check` coverage step executes ordinary offline source, semantic,
Edition, scene, rendering, package, installed-use, publication, replacement,
and recovery behavior. Cases requiring an external source root, historical
delivery, or browser executable skip when not explicitly selected. A skip is
not qualification evidence.

Set `ARCHPUB_BROWSER_EXECUTABLE` to an absolute installed Chrome executable
before `npm run check` to execute its browser tests. The source-owned AIGW
conformance test separately requires absolute `AIGW_EDITION_ROOT` and
`AIGW_SOURCE_ROOT` selections. The historical paired-file migration rehearsal
requires both absolute `PAIR_PRIOR_NATIVE` and `PAIR_PRIOR_ATLAS` paths; it
copies those deliveries into temporary test state before effects. None of
these selectors grants source acceptance or a release decision.

Never edit immutable release plans or substitute a similarly named newer
generation. Evidence is applicable only to its exact bytes and declared scope.

## First-party conformance consumers

First-party co-location is optional. The locations below describe current
selected inputs, not a Publisher requirement or source-product CI gate.

- `conformance/journeys/self-host/` is a bounded structural self-use journey through the
  public generic contracts. It is not the final flagship self-Edition.
- `editions/self/` is the source-owned Architecture Publisher self-Edition.
- `conformance/fixtures/ethos-source-owned-handoff.json` records the immutable
  ETHOS package, parity, semantic-successor, and remaining-acceptance boundary.
  Current mutable ETHOS adapter and Edition files reside in ETHOS; their
  continuation or retirement requires its product owner's decision. Their
  placement grants Publisher no source authority.
- `conformance/fixtures/aigw-source-owned-handoff.json` records the exact AIGW
  source owner, current and historical semantic values, reproduced candidate,
  and remaining governance limits. Current mutable AIGW Edition files reside
  in AIGW; their continuation or retirement requires its product owner's
  decision. Its opt-in conformance journey accepts explicit relocated Edition
  and source roots; ordinary runtime never discovers an adjacent checkout.
- The first-party contract matrix preserves the exact 0.2.0-alpha.0
  interoperability baseline and binds the published v0.3.0-alpha.1 successor to
  its signed release, package identities, qualification set, and human review.
  A pass-shared-kernel result means the consumer crosses the same
  identity-free qualification or publication implementation already exercised
  against exact consumer bytes. ETHOS and AIGW migration, acceptance, and
  publication remain source-owned and are not asserted by this matrix.

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

The signed alpha.7 tag and all earlier release bytes remain unchanged. No
predecessor repository archive is required in the successor registry.

## Off-host recovery

Independent off-host recovery remains unproved. The
[off-host recovery decision contract](disaster-recovery-decision-contract.md)
is the sole owner of tier selection, protected inventory, custody, retention,
credential boundaries, and clean-host acceptance. This operational reference
adds no alternate backup or restore policy. A local file recovery or Forge
release does not satisfy that contract.
