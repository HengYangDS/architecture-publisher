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
Node.js 22. The private development workspace selects npm 12.2.0, independently
released from the npm 11.19.1 bundled with Node.js 26.10.0. Native `devEngines`
admission rejects a different development Node/npm before installation or
scripts. Every native CI job uses the locked `.config/mise.ci.toml` tool selection
in its own ignored tool cache, including the independently selected npm. Mise
owns installation and execution; shell Runners retain their existing Mise
installation owner. This does not raise the installed Core runtime floor.
The private workspace also locks that same npm as a development tool. Native
packaging subprocesses prepend workspace bins and the Node directory, so an
external PATH selection alone can fall back to Node's bundled npm. The local
dependency closes that real execution gap without a wrapper or runtime dependency.

The common CI job installs the locked Chromium through Playwright, downloads the
manifest-selected Raster source archive through the caller's `CI_API_V4_URL`,
verifies its hash and executes the frozen native Raster journey before
`npm run check`. Curl imports the native job token from its environment; it is
not embedded in a command argument or copied into repository configuration.
Missing browser or Raster supply fails required execution. Linux uses a non-root
job principal and retains Chromium's sandbox; actual native job results, not
installation or YAML inspection, qualify each platform.

The 2026-10-01 official npm runtime-tree advisory check found known vulnerable
bundled dependency versions in npm 11.19.1, 11.21.0 and 12.2.0. Selecting the
latest stable npm does not remediate those findings. The operator approved an
exact bounded exception for project 1323 CI: independent identities and tool
directories, verified source, disabled installer lifecycle scripts, and no
expansion to other projects or production. New native guest installation outside
that scope still requires an explicit risk decision or a verified corrected
upstream package; no dependency surgery, ignored warning, shared identity, or
production authorization follows from this selection.

The development workspace pins OpenSpec 1.14.0. Its official apply instructions
return each task's concrete `sourcePath` and one-based `line`; the repository
checks those against a relocated, isolated task fixture. This is task-location
evidence, not implementation completion or permission to mark a checkbox.
Strict native validation and archive rehearsal remain separate checks.

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

### Last verified software release (2026-10-03): alpha.14

The [alpha.14 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.14)
provides Core and Self software packages with exact source, native CI and
installed-use evidence. The [release receipt](../../tests/conformance/evidence/release-alpha14-readback.json)
binds the signed source and tag, all nine native jobs, seven selected downloads,
single-copy storage, six-file offline replay and preserved historical records.
Every configured aggregate coverage dimension remains at least 95%.

The software Release remains unchanged. Exact human approval now covers the new
eight-page self HTML; its standalone reader publication is separate below.
ETHOS and AIGW retain their own source, Edition, acceptance and custody decisions.

Qualification uses Node's existing two-file concurrency. All test files and
native offline cases remain, with unchanged child deadlines and coverage scope.
The CoreText snapshot test no longer requires a duplicate cold compilation;
actual native snapshot, glyph and installed-use checks remain. The earlier
compiler and npm timeouts are preserved; their historical causes are unproved.
The passing successor establishes current acceptance, not a causal explanation.

### Last verified self-architecture publication (2026-10-03): alpha.14

The [self-architecture package](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/packages/263)
contains the independently approved eight-page HTML, the unchanged approved
6000px PNG and SVG, selected replay inputs, publication manifest and checksums.
Seven files occupy 2,840,303 bytes. Each file was downloaded through native
`glab api`; every size and SHA-256 matches its frozen inventory and native
package metadata. Media occur once each: the replay archive excludes them and
selects those same files by digest. The assembled Candidate reproduces all six
files through the exact downloaded installed Core.

Nineteen submitted qualifications pass; `admitted:false` remains correct.
Explicit acceptance and effect authorization then install the local paired
publication, and recovery returns `ALREADY_INSTALLED`. All eleven delivered
files and both Documents copies were read back. The standalone HTML and
highest-resolution PNG are available at these local paths:

- `~/Documents/architecture-publisher-0.3.0-alpha.14.html`
- `~/Documents/architecture-publisher-0.3.0-alpha.14-6000.png`

The immutable software Release's seven assets, all eighteen existing Release
records and all eighteen prior package identities remain unchanged. Eighteen
prior Documents files are preserved byte-for-byte. Five completed owned
installation, assembled-replay and superseded-staging trees were reclaimed;
43,437,579 logical bytes were removed after exact inventory and retained-evidence
verification. Final media, packages, raw failures and required receipts remain.

This is attributed exact-artifact acceptance and primary-forge custody, not
independent verifier authentication, universal comprehension, power-loss or
off-host recovery. Native Change/Lane closeout is a separate effect; neither
this publication nor Publisher qualification accepts ETHOS/AIGW source state
or completes the full cross-product goal.

### Retained reader release (2026-10-03): alpha.11

The [alpha.11 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.11)
selects signed source `25233468464dde6ed6699cf1d560428082c38f5f` and its
annotated tag object `5fd3d068c9805ec306859ab700c37cd3e92f26f4`.
Eleven selected assets occupy one Generic Package version, 8,546,343 bytes;
each has one storage copy. Native `glab release download` fetched only those
names. Every size and hash agrees with the pre-upload manifest/checksum anchors
and native package metadata. The [release receipt](../../tests/conformance/evidence/release-alpha11-readback.json)
records exact evidence and limits. Historical release records and package
identities were read back unchanged.

The exact local tagged gate passes with explicit desktop Chrome. Dev, main and
tag pipelines 9330, 9331 and 9332 pass Linux, macOS and Windows ARM64. Every
configured aggregate statements, branches, functions and lines floor is at least
95%; explicit platform and input skips remain. The downloaded Core/Self archives
install offline with empty user/global configuration and cache. Empty-PATH,
relocated self and four neutral conformance workloads reproduce thirty selected
Candidate files. Installed Self preparation also reproduces its exact selected
inputs. Nineteen submitted qualifications pass while `admitted:false` remains.

Explicit qualified local publication installs all three media files; recovery
returns `ALREADY_INSTALLED` and preserves foreign parent/static content. Exact
approved media remain in Documents. Fourteen invocation-owned installed, copied
input/output and cache roots were reclaimed after inventory/hash verification;
80,750,190 logical bytes were removed. Source inputs, downloaded assets,
publication/recovery evidence and browser observations remain.

Authored text ownership is a generic scene-local contract, not source authority.
ETHOS and AIGW received exact package evidence without adoption, retirement or
publication approval. Independent static ETHOS migration remains source-owned. Native lifecycle
receipts establish Change/Lane closeout separately; this release does not close
the full cross-product goal. No
independent verifier trust domain, universal comprehension, power-loss or
off-host recovery is established.

### Historical asset release (2026-10-03): alpha.10

The [alpha.10 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.10)
selects signed source `131b401cc93d9f3ba8b405d71c4c175f511cc3ce`.
Its eleven selected assets occupy one Generic Package version, 8,544,600 bytes.
Each has one storage copy. Native `glab release download --asset-name` fetched
only the selected names; every byte matches the separately anchored manifest
and checksum. The [release receipt](../../tests/conformance/evidence/release-alpha10-readback.json)
owns the complete identities, observed effects and remaining limits.

The full local gate with the exact annotated tag present and tag pipeline 9272
pass Linux, macOS and Windows ARM64. Statements, branches, functions and lines
each meet the 95% floor; platform and external-input skips remain explicit.
Original review and main failures are retained, not overwritten by the tag
success. Test/config/document-only source `195a5bf` leaves the frozen
package and media inputs unchanged. Its exact local proof and review 9282,
protected dev 9284 and main 9285 pass all three platforms and all four coverage
floors. The original guest interruption and npm-install timeout remain evidence;
fresh success does not prove their exact historical cause. Current source
qualification is separate from the immutable release source and later
documentary or archive transitions.

The downloaded packages install offline with empty user configuration and
cache, then run from relocated roots with empty PATH. Five frozen workloads
reproduce all thirty Candidate members. Nineteen submitted records pass while
`admitted: false` remains. Explicit qualified local publication installs the
three media files, and recovery returns `ALREADY_INSTALLED` while preserving
unrelated parent content. The invocation-owned consumer, configuration, cache,
copied inputs and outputs were removed after verification; source inputs,
downloaded assets and all operation evidence remain.

The exact approved 6000px PNG and eight-page standalone HTML are delivered to
Documents. Historical releases and Documents predecessors are unchanged.
This release does not approve ETHOS's minimum Provider/Edition migration,
whole-product AIGW publication, independent verifier authority, power-loss
recovery or off-host disaster recovery. Those owners and limits remain separate.

### Historical asset release (2026-10-02): alpha.8

The [alpha.8 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.8)
selects signed source `92395df633ffb24ec040776ff16999b292e07b54`.
Its eleven selected assets occupy one Generic Package version, 8,506,324 bytes,
with no duplicate project upload. Native `glab release download` fetched every
asset; sizes and hashes match the independently anchored manifest and checksum
file. The verified 6000px PNG and eight-page standalone HTML are delivered to
Documents; the predecessor alpha.7 files remain unchanged.

Review 9178, protected dev 9179, main 9180 and tag 9181 pass all three native
platforms, with every statements/branches/functions/lines threshold at least
95%. Original macOS tag failure 47057 remains evidence; its one unchanged retry
47071 passed without proving a historical scheduling cause repaired. Native
platform and external-input skips remain explicit.

A fresh offline-installed, relocated consumer reproduces the exact six-member
self Candidate with empty PATH and user configuration. Nineteen submitted
records pass while `admitted: false` remains; explicit acceptance and effect
authorization are separate. Public local publication installs the selected
pair, and idempotent recovery preserves foreign parent content. It does not
prove power-loss or off-host recovery. Current acceptance and custody reside
in the [alpha.8 receipt](../../tests/conformance/evidence/release-alpha8-readback.json).

The native CLI also fetched four generated source archives. Those unselected
local copies were removed after exact ownership/hash checks; no remote source
or historical asset was deleted. Future asset selection must use the actual
CLI contract rather than treating release-link count as total download count.
The Fleet owner intentionally enabled normal CI Runners 120/121/122 after
terminal job and no-in-flight readback; artifact housekeeping must not restore
their earlier temporary pauses.

Actual ETHOS Adapter/Edition migration and framework implementation remain
source-owned obligations. Research ownership is recorded in the
[source intake](../../tests/conformance/evidence/research-owner-intake.json), not
another progress statement here. AIGW's accepted alpha.7 Client Projection
adoption is distinct from alpha.8 adoption or whole-product publication. No
Publisher release proves those outcomes.

### Historical asset release (2026-10-01): alpha.7

The [alpha.7 Release](http://192.168.64.101:18086/dig/research/human-agent-stewardship/architecture-publisher/-/releases/v0.3.0-alpha.7)
selects signed source `0788d916b96f6868a3380bdb627705a6a1fe037b` and one
Generic Package version with eleven payloads totaling 8.11 MiB. The exact
6000px PNG retains its approved bytes; all eight standalone HTML pages passed
direct requester review. Both downloaded media are delivered to Documents.

The local exact tag-context gate passed before tag push; protected tag
pipeline 9087 passed Linux/macOS. The test/evidence successor `f799ee3` repairs
an invalid finite-fixture deadline without changing product stage ceilings,
package content, media inputs or the immutable tag. Its exact-HEAD proof and
proposal/dev/main pipelines 9100/9102/9103 passed every declared gate and
coverage floor; earlier failures and unproved host-delay causes are retained.

Every selected payload was independently downloaded through native `glab` and
hashed, including the separately bound `SHA256SUMS`. The first download failed
because its caller-owned target directory was absent; creating that exact
empty directory corrected the invocation without changing remote assets.
Downloaded packages rebuilt five relocated workloads and thirty Candidate
files with empty PATH. The
[readback receipt](../../tests/conformance/evidence/release-alpha7-readback.json)
is the current release evidence owner.
Its evidence-only source closure `6112b67` passed proposal/dev/main pipelines
9104/9105/9106. A separate downloaded installed-product journey verified all
nineteen records, applied the qualified local three-file publication and
returned `ALREADY_INSTALLED` from recovery while preserving foreign parent
content. This proves idempotent recovery, not an interrupted-effect test.

The later signed evidence source `d3ee978` passed proposal/dev/main pipelines
9110/9111/9114 with every declared gate and four coverage floors. Historical
installed-test supply was reclaimed only after cold restoration and exact
content/mode verification: thirteen duplicate dependency roots are absent,
while 1,717 retained files, recovery archives and two owner-unknown groups remain
unchanged. These local effects do not establish independent off-host custody.

Generic policy verification binds nineteen submitted PASS records and still
reports `admitted: false`; explicit owner acceptance, source endorsement and
delivery effects are separate. At that historical checkpoint, ETHOS/AIGW adoption, final native Windows and
independent off-host recovery were unproved. Historical alpha.6 facts remain
in its immutable [receipt](../../tests/conformance/evidence/release-alpha6-readback.json).

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
[`release-alpha5-readback.json`](../../tests/conformance/evidence/release-alpha5-readback.json).
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

New owner, journal, payload and metadata files are flushed through writable
handles before their write completes. Every effect result reports `durability`:
required file flushing, required directory flushing on POSIX or unsupported
directory flushing on Windows, and `powerLossRecovery: "not-qualified"`.
Required flush errors remain failures. Interrupted-process recovery verifies
retained on-disk state; it is not qualified machine-power-loss recovery.

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
`tests/conformance/fixtures/ethos-source-owned-handoff.json`. Each package identity
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

This compositor prepares a bounded batch of exact possible label lines through
`renderers/resvg/measurement.mjs` and the existing supervised raster Worker.
The native renderer shapes the selected fonts and returns actual outline ink,
not summed character advances. A synchronous cache supplies ELK; an unprepared
request fails without estimation or starting another process. Font bytes and
the measurement implementation remain separately bound. Pinned ELK owns geometry;
the SVG painter preserves its routes, labels, and node bounds. A pinned camera
supplier owns viewport interaction only. Shared paint dimensions bind audits
to emitted strokes and arrowheads; browser glyph checks remain separate.
Flat groups retain exact membership and containment. Long acyclic graphs may
use the same ELK owner's finite wrapping candidate, never an edited fallback.
Static Dagre geometry and authored Archify geometry remain independent.

Authored font resources select normal static TTF faces at weights 400, 500, 600
or 700. Per-text selection overrides the medium default; absence alone selects
bundled typography. Missing selections, glyphs or pins fail rather than falling
back. Measurement supports single-line horizontal LTR Latin, Greek, Cyrillic,
Common characters and explicitly supplied Han. Combining marks, controls,
joiners, variation selectors and unsupported scripts are refused; no text
normalization occurs. Both authored painters preserve spaces, disable synthetic
faces and request geometric precision. Browser paint remains a separate check.

Each preparation admits at most 4096 queries and 200000 glyphs, including
static-only editorial framing. The existing raster bounds control font bytes,
heap, WASM memory, time, output and owned-process reclamation. Font metadata
and glyph-availability parsing still occur in the parent; native supervision
does not imply sandboxed parsing or protection from a malicious installer.

Authored statement text uses the same bounded text shape in each independent
medium. Select a Claim with `semanticIds: ['["namespace","claim","claim-id"]']`;
select an editorial assertion with
`semanticIds: ['["edition-id","editorial","assertion-id"]']`. Add each direct
reference to that scene's `requiredSemanticIds`. Source facts come only from
selected native bytes; editorial statement, proponent, basis and questions
come only from the selected Edition. Neither is copied into refinement facts.

Every explicitly selected direct statement requires its own visible text.
Opaque Claims need no invented document node or dependency. Typed relational
and scalar Claims still require their selected relation or subject owners.
Previously valid anchored aggregate text retains its existing v1 interpretation
and limits. A direct statement cannot silently fall back to that representation
when its text is missing. A statement-only interactive page may have no nodes.

The Archify adapter validates finite text against the exact selected font bytes
it embeds, native-shaped bounds and the desktop readability/route geometry.
Each page records its exact adapted runtime identity; different page input is
not a conflicting shared runtime. Inspection distinguishes source identity from
Edition identity and returns keyboard focus to the selected text. These checks
establish identity and visible coverage, not paraphrase equivalence or truth;
wording remains unverified until the selected exact-artifact review.

Supported delivery is SVG/PNG and standalone desktop HTML. PDF and PPTX are
not supported and are outside the current work scope.

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

### Native raster source rebuild

The installed raster renderer uses packaged WASM; ordinary users need neither
Rust nor a platform shell. Source rebuilding uses native archive extraction,
Cargo and wasm-bindgen, with the exact toolchain and digests selected
by `packages/publisher/renderers/resvg/supply/resvg/source.json`.

In a caller-owned disposable directory:

1. Download the selected source archive through its native registry consumer.
2. Run `node tools/raster/resvg/verify.mjs --archive <archive>` before extraction.
3. Extract the verified archive with the platform's native archive tool. Keep
   the original extracted Cargo manifest and vendored dependencies unchanged.
4. Run `node tools/raster/resvg/verify.mjs --inputs <absolute-source-root>`.
5. Select the manifest's already installed Rust toolchain/target and matching
   wasm-bindgen without replacing another installation owner. From the extracted
   source root, execute the two native commands:

   ```text
   cargo build --release --target wasm32-unknown-unknown --offline --frozen
     --config 'build.rustflags=["--remap-path-prefix=<absolute-source-root>=/workspace"]'

   wasm-bindgen
     target/wasm32-unknown-unknown/release/architecture_publisher_resvg_wasm.wasm
     --target bundler --out-name index --out-dir native-output
     --no-typescript --omit-default-module-path
   ```

6. Observe `rustc -vV`, `cargo -vV` and `wasm-bindgen --version` from the selected
   executables. The native journey records their exact host, release and commit
   identities in caller-owned JSON; it is evidence, not another configuration owner.
7. Run `node tools/raster/resvg/verify.mjs --outputs <output-root> <tool-identity.json>`.
   The source manifest selects the exact pre-admitted native WASM witness;
   unknown identities fail without a fallback or learned hash. Without the JSON
   argument, `--outputs` checks the canonical packaged bytes. Recheck `--inputs`
   too: successful compilation cannot waive source drift. The binding always
   matches packaged `index.mjs`; native output never replaces canonical supply.
8. Repeat from a second clean extraction, using a different relocated root and
   empty Cargo target. Both builds must match the selected witness. The native
   journey also compares canonical and rebuilt imports/exports, exact PNG bytes,
   selected fonts, text measurement, declared errors and an authored static workload.
9. Preserve command/tool identities, both input/output digests and behavioral
   comparison results, then reclaim only the caller-owned disposable roots.

The command is native on each platform; placeholder resolution and command-line
quoting belong to the caller's executor, not a repository Bash or PowerShell
controller. A resolved absolute source root is required: remapping `.` produces
different WASM bytes. Native CI supplies the execution deadline. A successful
integrity test does not prove a full source rebuild or an untested architecture.
Native witnesses do not claim cross-host WASM byte identity or universal behavioral
equivalence. New witnesses require independent clean-build evidence and review;
the source manifest remains their sole owner, not a runtime hash-acceptance list.
The evaluated wasm-pack wrapper is not selected: its metadata discovery rewrites
the original lockfile before applying its later offline/frozen build options.

`.config/checks/markdownlint-cli2.jsonc` owns maintained Markdown selection and spacing;
`npm run check:docs` consumes it without inline rule overrides. The native
MD012 rule rejects repeated blank lines outside code, and
`.config/checks/markdown.mjs` uses Markdownlint's parsed block structure to keep
single-paragraph list items adjacent. Separate paragraphs and compound list
items retain their structural spacing. Embedded code follows its language's
formatter. Archived specifications, fixtures, and third-party supply retain
their recorded bytes.

Repository quality policy lives in `.config/checks/`; npm scripts select the
native tools and their exact configuration paths. Prettier discovers its one
rule file through the native `package.json` reference. Its root ignore file,
ESLint's root entry and the JavaScript project remain native discovery inputs,
not forwarding wrappers or duplicated policy. See
[configuration ownership](../../.config/README.md) for the retained entries.

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

Linux Docker jobs set GitLab Runner's native
`FF_USE_INIT_WITH_DOCKER_EXECUTOR=true`. Its `--init` process reaps orphaned
children after the existing supervisor kills an invocation's process group.
Without an init, a terminated orphan may retain a zombie PID and fail the
unchanged installed Provider and qualification lifetime assertions. This is a
Runner precondition, not a Publisher process scanner, sandbox exception or
direct-child-only fallback. Local container acceptance uses the same `--init`
boundary; hosted execution must independently qualify its actual Runner.

The standalone Raster rebuild initializes its own repository-local test workspace
before allocating a unique execution directory. It does not depend on the npm
suite having run first or on retained output from a previous checkout. Native
test cleanup removes only that execution directory; the owning parent remains.

Each CI job sets `umask 022` before checkout-derived package reproduction.
Historical `contentTarSha256` identifies the complete uncompressed TAR stream,
including member modes; it is independent of gzip encoding, not of TAR metadata.
The job-local mask reproduces those recorded package modes inside the Runner's
private home on POSIX. Native Windows filesystem metadata does not reproduce
historical POSIX TAR headers: its historical repack tests instead verify the
complete selected file set and every byte against the immutable Git tree. This
is source-byte replay, not equality with the historical archive. Recorded TAR
digests and signed release bytes remain unchanged. Runner service permissions
and historical digests remain separate from that artifact-build setting.

Repository-authored text checks out as LF through `.gitattributes`. Generated
validators and third-party supply use `-text` to preserve recorded bytes,
including mixed-line-ending notices and binary fonts. Windows CI uses GitLab's
native fetch strategy and default cleaning, excluding only
`build/runtime/tool-cache/`. A completed browser can retain a mapped DLL that
prevents recursive workspace replacement. `git checkout-index --all --force`
refreshes every tracked carrier before tool execution, including attribute-only
changes and stat-clean CRLF files. Previous coverage and other generated output
are cleaned; required evidence belongs outside that disposable job state.
Retained tools remain subject to their locked supply checks. Native checkout
logs and byte checks must confirm the effective strategy. This does not modify
global Git configuration or prove that a previous process was reclaimed.
Mise's locked Rust declaration includes `cargo`, `rustc` and the host `rust-std`.
Its native installation repairs missing selected components in the retained
tool-cache; a minimal profile alone does not reconcile an already installed
toolchain. The separate WASM target does not replace the host standard library
needed to compile build scripts.
The native bootstrap invokes `mise exec -- rustup component add rust-std`
after locked installation. Rustup resolves the host from the selected toolchain;
this is idempotent component reconciliation, not a second version declaration
or installer. Mise's generic component predicate can otherwise count a WASM
standard library as satisfying the unqualified host component.

CI selects both `MISE_DATA_DIR` and `MISE_CACHE_DIR` within the job-owned
tool-cache. The native npm backend hardlinks package files from the latter.
Reinstall only a damaged locked tool using that same cache rather than granting
a Runner access to a system-principal store. Verify the resulting files and
version under the actual Runner identity; a management-principal probe alone
does not establish hosted acceptance.

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

- `tests/conformance/journeys/self-host/` is a bounded structural self-use journey through the
  public generic contracts. It is not the final flagship self-Edition.
- `editions/self/` is the source-owned Architecture Publisher self-Edition.
- `tests/conformance/fixtures/ethos-source-owned-handoff.json` records the immutable
  ETHOS package, parity, semantic-successor, and remaining-acceptance boundary.
  Current mutable ETHOS adapter and Edition files reside in ETHOS; their
  continuation or retirement requires its product owner's decision. Their
  placement grants Publisher no source authority.
- `tests/conformance/fixtures/aigw-source-owned-handoff.json` records the exact AIGW
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

The signed alpha.8 and predecessor tags and all released bytes remain unchanged. No
predecessor repository archive is required in the successor registry.

## Off-host recovery

Independent off-host recovery remains unproved. The
[off-host recovery decision contract](disaster-recovery-decision-contract.md)
is the sole owner of tier selection, protected inventory, custody, retention,
credential boundaries, and clean-host acceptance. This operational reference
adds no alternate backup or restore policy. A local file recovery or Forge
release does not satisfy that contract.
