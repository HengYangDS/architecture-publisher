---
subject: architecture-publisher:source-inputs
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Source-input mechanism research

## Structurizr native-model and export boundary (2026-09-24)

GitHub API readback identified the active Apache-2.0
[Structurizr monorepo at stable `v2026.09.19`](https://github.com/structurizr/structurizr/tree/v2026.09.19)
(`f828a297dc693e08115b7e5b51dba4a83d8148c2`, Java 21). The older
`structurizr/cli` repository is archived; evaluating only that old CLI would
misidentify the maintained product. This is a source-level audit, not an
installed-run or reader-quality result.

The active source contains concrete DSL parser, model/view, custom and dynamic
view, export, autolayout, and application modules. The DSL parser
[stores declared element and optional relationship identifiers as model-item
properties](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-dsl/src/main/java/com/structurizr/dsl/StructurizrDslParser.java#L1609-L1619).
That is a useful trace carrier, but it does not by itself prove stable
cross-revision identity or exact source-file/line provenance for every exported
relation. A Publisher adapter would still need typed qualifier and loss checks.

The inspected
[static-site exporter](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-application/src/main/java/com/structurizr/command/StaticSiteExporter.java#L24-L65)
writes an `index.html` plus separate JavaScript, CSS, image, and `workspace.js`
files; it explicitly removes workspace and element documentation because that
static site does not support it. This route is therefore neither a proven
single-file HTML Atlas nor a complete documentation publication. The inspected
[`export png|svg` command](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-application/src/main/java/com/structurizr/command/ExportCommand.java#L123-L175)
constructs that static site and calls the
[Playwright-backed viewer exporter](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-application/src/main/java/com/structurizr/command/PlaywrightExporterImpl.java#L26-L74).
That path derives static images from the browser viewer and cannot directly
satisfy Publisher's independently composed static-medium invariant.

**Disposition:** Structurizr is a serious candidate for native C4 source
ingestion, model/view computation, and authoring conventions where the subject
fits C4. Its direct export is not currently established as Publisher's
standalone dual-medium publication backend. Defer any adoption decision until
the exact released toolchain is run offline on self, ETHOS, full AIGW plus its
Client Projection, and native di-effect with visible semantic carriers,
documentation, output identity, accessibility, and maintenance cost measured.
Do not make either its C4 vocabulary or browser-derived image route a universal
architecture ontology or a substitute for the Edition editor.

## Native LikeC4 identity and editing counterexample (2026-09-24)

At di-effect `8a168b6b9c6933c30ab2ea25e60cac8a54212566`, three authored
files in `tools/likec4/models/` total 102 lines. Their SHA-256 values are
`45d81011acbf12ad35ce2daef4b27773d66b9fa73f3aac084f252c29aa9bfbcd`
(`di_effect_core_layers.c4`),
`683df86d00ed3467a21942c00f79f2252871b8159a5957e1c196fd90eb3886a3`
(`di_effect_packages.c4`), and
`b601586c58810816b5489a95be0e4e5830c6e6b5237bc179d1c88a0ef194ef5e`
(`di_effect_runtime_path.c4`). The unrelated dirty `.serena/project.yml` was
not changed or used.

Read-only source copies in isolated `/tmp` directories were processed with
installed LikeC4 `1.59.4`: `likec4 validate --json <copy>` passed for all three
files, and `likec4 export json --skip-layout -o <copy>/model.json <copy>`
produced 25 elements, 35 relations, and four views. The generated index and
all three authored `include *` views each contained 25 nodes and 35 edges;
each view edge referenced valid model relation IDs. This demonstrates usable
native ingestion and within-build relation trace, **not** reader-specific
composition or actual visible semantic fidelity. The inspected export carried
no per-relation `sourcePath` field. That limits JSON-only consumption, not
LikeC4's public language-service source locations.

A follow-up on 2026-09-24 used the same exact three files with LikeC4 1.59.4's
public [`fromSources`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/language-services/src/node/index.ts)
API. It parsed selected in-memory strings with its language service's
`useFileSystem` option set to false; `documentPaths()` returned exactly the
three selected virtual files. This is document-set evidence, not observation
of every possible ambient read. The public
[`languageServices.locate`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/language-server/src/LikeC4LanguageServices.ts)
returned a file URI and LSP range for a native element, relation, and view.
The relation range was a point location, not a full source span. The model
again contained 25 elements, 35 relations, and four views. These locations
must be translated to selected logical paths and byte digests; virtual or
temporary absolute paths are not durable source identities.

An unlocated view is not necessarily generated. Upstream
[`locateView`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/language-server/src/model/model-locator.ts)
returns `null` when it cannot find the AST view; the typed
[`sourcePath`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/core/src/types/view-common.ts)
contract identifies auto-generated views by an absent source path. Therefore a
missing locator for an authored view is an import failure, not permission to
omit that view. Source line bounds can be indexed once per selected file rather
than rescanned for every imported item.

A cold standalone install of `@likec4/language-services@1.59.4` failed at
module import because `@likec4/config`'s Node entry imports
`bundle-require`, which its [package](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/config/package.json)
declares as an optional peer. Installing that declared peer and `esbuild`
explicitly made the in-memory probe pass; the temporary dependency tree was
about 91 MB. The working Homebrew `likec4` installation occupied about
130 MB. This is a measured supply/DX cost, not grounds to handwrite a DSL
parser. A qualified LikeC4 adapter can be optional to generic Publisher
installation; no parser dependency is yet admitted into the release.

### Single-file parser-supply probe (2026-09-25)

On macOS Node `v26.9.0`, esbuild `0.28.2` bundled the installed
`@likec4/language-services@1.59.4` Node entry from 1,365 input modules into
one 5,182,490-byte ESM file. Two same-host builds with the same inputs had
SHA-256 `c0231e4b559dc8d12d4b1bc80b4c5f86643d59a5b1ee9bdc877f60a8e40bf516`.
The naive ESM bundle failed at import because bundled esbuild code used a
dynamic `require('fs')`; a scoped `createRequire(import.meta.url)` banner made
the exercised parser path run. The metafile still declared one non-Node
external, `pnpapi`, from esbuild's optional Yarn-zip branch. A passing parser
path does not establish that every reachable bundle path is ambient-free.

A second banner allowed dynamic `require` only for Node built-ins; a test-only
export rejected `pnpapi` while permitting `fs`, and a two-element parser case
still passed. Without that test-only export, the guarded bundle was 5,182,823
bytes with SHA-256
`e43c4e484d30e259faebb6c1c579fdc19d3b4f7e1ac7660f555aa35a3c2e18a2`;
two same-host builds matched. This constrains dynamic package resolution in
the bundle, not access to ambient files through permitted Node built-ins.

The corrected bundle was copied into a disposable directory with no
`node_modules`, empty `PATH` and `NODE_PATH`, and a fresh `HOME`; the directory
was removed after the probe. Fed the three unchanged di-effect file bytes and
the explicit no-filesystem options, it matched the direct upstream
`fromSources` summary: three selected virtual documents, 25 elements, 35
relations, and four views (three authored, one generated), with no parser
errors. This is a same-host selected-path parity and relocation result, not
cross-platform package acceptance, complete dependency observation, bounded
execution, a license inventory, or visible semantic coverage.

The guarded bundle also parsed the same hash-checked three-file input inside
local Linux ARM64 image
`sha256:cb328da7d1c342b3f542dc65fbd377cf5a4823d5df01f47ea3bd888f57618b4b`
(Node `26.9.0`) with no network, a read-only root and input mount, dropped
capabilities, 512 MB memory limit, and empty `PATH`/`NODE_PATH`. Its three
virtual documents, 25 elements, 35 relations, and three authored plus one
generated view matched the upstream summary. An initial container invocation
failed before Node started because empty `PATH` hid the image's relative
entrypoint; selecting `/usr/local/bin/node` as the absolute entrypoint fixed
that harness error. Both owned probe directories and containers were removed.
This is a selected-path Linux observation, not native Windows conformance,
complete parser behavior, package/license qualification, or a filesystem
sandbox claim.

The esbuild metafile spans 65 installed package roots: 53 declare MIT, six
Apache-2.0, two ISC, two BlueOak-1.0.0, one BSD-3-Clause, and one declares no
license field. The undeclared package is `khroma@2.1.0`; its shipped `license`
file is MIT text (SHA-256
`66b333b0f66759a0b710459e03f7029abe17f4358114a128d2c972e642961b49`).
`remeda@2.50.0` declares MIT but its npm payload has no license file. Through
the read-only GitHub CLI route on 2026-09-25, the exact upstream
[`v2.50.0` commit](https://github.com/remeda/remeda/tree/b9ec4b0ac5ba86f2f687bae6e92d318db02eea24)
provided [LICENSE](https://github.com/remeda/remeda/blob/b9ec4b0ac5ba86f2f687bae6e92d318db02eea24/LICENSE)
with SHA-256 `acf30083045d768ce20640237313ee31a45d548d66ef76df5bb5fb0745479535`.
These observations identify notice sources; they are not a generated license
inventory, legal clearance, or proof that the packed Publisher includes the
required texts. A bundle cannot be admitted until its exact input packages
and complete notices are reproducibly bound to the shipped bytes.

The single-file route is a serious alternative to the previously observed
roughly 91 MB cold dependency tree, not an admitted release supply. Compare it
with an optional installed peer on exact input, install/repair cost, complete
license notices, non-Node external rejection, offline relocation, Linux and
Windows behavior, and bounded execution. Do not add a second package or
command plane merely to avoid this comparison; do not ship a bundle based on
the two-node smoke test or one successful di-effect parse alone.

### Native parser confinement probe (2026-09-25)

Read-only GitHub CLI retrieval of the official Node
[v22.13.0 Permission Model contract](https://github.com/nodejs/node/blob/v22.13.0/doc/api/permissions.md)
and [v26.9.0 contract](https://github.com/nodejs/node/blob/v26.9.0/doc/api/permissions.md)
found the API stable at v22.13.0. Both versions restrict `node:fs` reads,
child processes, and worker threads unless granted; the v22.13.0 contract does
not list network confinement, while the v26.9.0 contract does. Neither is an
OS sandbox: existing descriptors bypass filesystem checks, worker permissions
are not inherited, granted symlinks can escape, and v26 documents a
same-user cross-process inspector limitation. These are upstream statements,
not observations of Publisher's installed product.

A disposable macOS Node `v26.9.0` child ran the exact checked-in LikeC4
bundle (SHA-256
`44d22b467b523e894b8e97f56b33c7f2051fd68077c2edc56cef3497d4c6258f`)
with `--permission`, one exact `--allow-fs-read` bundle-file grant, an inline
module, empty `HOME`/`PATH`/`NODE_OPTIONS`, and no child, worker, write, or
network grants. The selected no-filesystem two-element/one-relation parse
succeeded; separate attempts to read `/etc/passwd` and spawn Node failed with
`ERR_ACCESS_DENIED`. This demonstrates one bounded macOS path, not read closure
for every LikeC4 feature, Windows/Linux installed behavior, network denial on
Node 22, a hard execution deadline, or resistance to a malicious same-user
process. The scratch code was not retained as a release test.

An unguarded wrapper exporting only `fromSources` measured 5,180,349 bytes
versus 5,182,490 bytes for the unguarded package entry, but still retained
`child_process`, `worker_threads`, and `net` imports. This is not a material
supply simplification. Prefer the pinned public upstream entry. Use Node
permissions, if admitted by exact platform tests, only as defense in depth
around a private verified-byte copy and one bounded
process-tree owner. Do not raise the general Node runtime floor, claim a
portable no-network sandbox, or call the parser supply formally admitted on
the basis of this probe.

### Bundled geometry reuse probe (2026-09-25)

The tracked `tests/native-supply.test.mjs` runs the same checked-in LikeC4
parser bytes (SHA-256
`44d22b467b523e894b8e97f56b33c7f2051fd68077c2edc56cef3497d4c6258f`)
in two separate macOS Node `v26.10.0` children. Each has an empty `PATH`, a
fresh temporary `HOME`, empty `NODE_OPTIONS`, Node Permission Model enabled,
and only the parser file's canonical path granted for reading. With
`useFileSystem: false`, manual layouts and watching disabled, and Graphviz Wasm
selected, the public
`layoutedModel()` API returned positive bounds, two positioned nodes, and one
routed edge; the two projections agreed without comparing generated edge IDs.
Canonicalizing the temporary parent path is necessary on this host because
`/var` resolves to `/private/var` before ESM permission checks.

This establishes a reusable, already-supplied geometry candidate for a native
LikeC4 Edition. It does not prove a finished static or interactive work,
source-bound visible edge coverage, aesthetically acceptable composition,
complete read closure, Windows/Linux parity, or general architecture-format
support. Geometry stays a replaceable projection below the Edition and cannot
become source or acceptance authority merely because the layout is repeatable.

### Cross-build identity and output limits

To test cross-build identity, the same three byte-identical DSL files were
exported from two different workspace paths. All 35 semantic relation pairs
were present, but none retained its generated relation ID. In one fixed
workspace, two exports of unchanged files kept all 35 IDs; prepending a
comment kept all 35; inserting `layer_result -> layer_dependency` after the
existing `layer_result -> layer_effect` relation added one relation and changed
three pre-existing generated IDs. The comparison matched relations by source
element, target element, and title; these particular pairs were unique. It is
therefore unsound to use generated LikeC4 relation IDs alone as persistent
cross-workspace or cross-revision Edition references. This is a scoped probe of
the installed version, not a claim that LikeC4 has no other source-map or
explicit-ID capability.

The same copied inputs were built twice from one source directory using
`likec4 build <copy> --output <site> --output-single-file --use-hash-history`
with only the output directory changed. Both builds succeeded and emitted
standalone `index.html` files of 3,320,226 and 3,320,180 bytes (SHA-256
`19bd832ecd5f99d427983a3708f778c336953ac4facedfa308fd4e9981d944af` and
`886734ce3c30f1fd62fbba8abafcd76aae13dca11a5cba8ff8afe73a19bde413`).
Their top-level asset references were inline data URIs. In this two-run probe,
replacing the four embedded Draw.io edit URLs made the remaining HTML bytes
identical. Decoding those URLs showed that their underlying XML differed only
in the `mxfile modified` timestamp. At the inspected LikeC4 1.59.4 source,
[`generate-drawio.ts`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/generators/src/drawio/generate-drawio.ts)
accepts an explicit `modified` value but defaults to current time, while the
[`Vite virtual module`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/vite-plugin/src/virtuals/drawio.ts)
calls `generateDrawio(view)` without that value. The probe establishes an
exact-byte reproducibility gap in the direct HTML build, not a failure of
LikeC4 model/view computation or browser-offline behavior. A qualified
Publisher backend must disable, deterministically configure, or safely
normalize this ancillary edit URL before claiming repeated artifact identity.

A second, fairer direct-use probe kept the same 25-element/35-relation native
model and replaced only the three `include *` view filters with 25 explicit
element selections. This added 22 net source lines, from 102 to 124; it did not
copy or re-author model facts. LikeC4 validated the edited sources and exported
the following view memberships and static PNGs:

| View            | Nodes / edges | PNG dimensions | Repeated PNG bytes |
| --------------- | ------------: | -------------: | :----------------: |
| Generated index |       25 / 35 |   12988 × 2872 |       equal        |
| `five_layers`   |         5 / 4 |     752 × 2872 |       equal        |
| `packages`      |       14 / 26 |    9742 × 2872 |       equal        |
| `runtime_flow`  |         6 / 5 |    2472 × 1672 |       equal        |

The generated index still shows the full model, while the three authored views
are genuinely scoped. `likec4 build --output-single-file --use-hash-history`
also produced a roughly 3.2 MB HTML file. Copied alone into a different
directory, it opened from `file:` with HTTP(S) requests blocked; the overview
and a direct `runtime_flow` route rendered with no page errors or outbound
requests. The [1440 × 900 overview observation](evidence/di-effect-likec4-targeted-overview.png)
shows all four view cards but also extensive unused lower canvas, generic
labels, and no reader-question descriptions. It is an observation of this
unedited presentation, not a claim that LikeC4 cannot be styled.

Two edited-view builds from the same source and output path still produced
different HTML bytes (SHA-256
`5c49aef2718ca6350bc2e8b1a856e732a2fdd030506f965c64280ceefae1db7a`
and `f6bd8ba2d58d3adfdfbaac2fcea91d2709c255105e4e167d4373744d8d33e26e`),
consistent with the Draw.io timestamp mechanism above. PNG export initially
failed because the installed CLI's Playwright browser revisions were absent;
after supplying its exact browser revisions, export succeeded. This is an
installed/offline toolchain-closure cost, not a model/view correctness failure.
Accessibility was not evaluated in this probe.

**Design consequence:** admit native LikeC4 without a duplicate editable Claim
Model, reuse its model/view machinery, but distinguish source-defined stable
references from revision-scoped generated IDs. A source change or relocation
may require explicit lineage/review. Direct LikeC4 with edited native views is
a genuine low-cost alternative for this small adopter; Publisher should
interpose only where it demonstrably improves reader editing, medium quality,
trace/evidence, or update cost beyond that direct path, without forcing a
second full diagram model.

## Additional source-level comparators (2026-09-24)

The following stable-tag sources were inspected through the GitHub CLI and
read-only local clones on 2026-09-24. This is a targeted implementation review,
not a claim that every execution path or hosted integration was tested. It adds
comparators to the decisions above; it does not replace the canonical ETHOS,
Publisher, or AIGW contracts.

| System    | Exact source                                                                                                                                                                              | Observed implemented center                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| SpecDD    | [framework 1.5](https://github.com/specdd/specdd/tree/f5440dc93f4fc75c42f2fbbdfc304bd7ef0e5451); [CLI 1.1.1](https://github.com/specdd/cli/tree/fe2ffc946935e1b36c662dadf4c6ce899c304b97) | Path-local specification resolution and linting.                                                  |
| AgentSpec | [0.1.43](https://github.com/yimwoo/agent-spec/tree/9fc86d5576d7866fc31c6a4bb56739812bb8389f)                                                                                              | Repo-local task/run control, writer-session records, source drift, and evidence.                  |
| SpecRoute | [0.4.0](https://github.com/Enovatr-Labs/SpecRoute/tree/abc4c482da117c654b414517e68074ad643a950e)                                                                                          | Cross-agent templates, guidance, and hook scripts; explicitly content rather than an application. |

**SpecDD.** The CLI's
[resolver](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/src/services/spec-resolver/spec-resolver.ts)
selects a target's local and ancestor specifications, follows typed `Owns`,
`Can modify`, `References`, and other links with a bounded depth and cycle
protection, and returns `target`, `parent`, or `link` reasons for inclusion. Its
[linter](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/src/services/spec-linter/spec-linter.ts)
reports path and ambiguity diagnostics. **Adopt the principle** of explainable,
revision-bound intent-context selection; **reject** another `.sdd` source of
truth or path adjacency as sufficient authority. Resolution and linting do not
by themselves prove Work Lane effects, Git CAS, or independent verification.

**AgentSpec.** The
[session implementation](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/session.py)
records branch/worktree writer leases and permitted task paths;
[source checks](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/source_registry.py)
compare current content hashes with accepted snapshots and may stage a changed
candidate. Those are concrete mechanisms, not just README language. The
[runner](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/agentspec/runner.py)
terminates the direct child on timeout, not an observed process tree; the
inspected session and runner contracts did not demonstrate object-scoped Git
compare-and-swap or an ETHOS-style Attestation. The tagged source contains
25,278 product-Python lines and 21,108 test-Python lines by tracked-file `wc`
(603 test methods); these mechanical counts are not a quality score. **Borrow
only** accepted-source drift and bounded handoff evidence where a real ETHOS
consumer needs them; **reject** a copied task ledger, run-state store, or second
command plane.

**SpecRoute.** Its [README](https://github.com/Enovatr-Labs/SpecRoute/blob/abc4c482da117c654b414517e68074ad643a950e/README.md)
explicitly describes a content repository. Requirement IDs, design `Satisfies`
links, and task/test back-references can make traceability readable, but its
[Codex post-edit hook](https://github.com/Enovatr-Labs/SpecRoute/blob/abc4c482da117c654b414517e68074ad643a950e/hooks/codex/scripts/post-edit-frontmatter.sh)
states that it warns and never blocks. **Adopt** the compact back-reference
notation only where it improves existing ETHOS intent-to-proof navigation;
**reject** a copied vendor-template workflow as a governance or quality gate.

Implementation quality cannot be ranked by repository size. The inspected
[SpecDD CLI package](https://github.com/specdd/cli/blob/fe2ffc946935e1b36c662dadf4c6ce899c304b97/package.json)
has TypeScript typecheck and co-located resolver/linter tests;
[AgentSpec release CI](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/.github/workflows/release.yml)
runs pytest, mypy, and pylint, while its
[Pylint policy](https://github.com/yimwoo/agent-spec/blob/9fc86d5576d7866fc31c6a4bb56739812bb8389f/pyproject.toml)
disables several complexity rules. The inspected SpecRoute workflows validate
links and wiki parity, not the behavioral truth of copied vendor guidance. No
upstream test suite was executed in this review, so these are source-quality
signals and limitations, not a comparative pass rate or security verdict.

### COMET and ETHOS implementation-quality evidence (2026-09-24)

At exact COMET `0.4.1` source commit `9c6a89857f8ce33c12b9abcc1230bd1076de8068`,
the [package scripts](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/package.json)
declare build, generated-runtime freshness, format, lint, coverage, package
installation, and benchmark commands; [TypeScript is strict](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/tsconfig.json).
The [CI workflow](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/.github/workflows/ci.yml)
declares Linux, macOS, and Windows runtime and package-install journeys;
[security](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/.github/workflows/security.yml)
and evaluation workflows are separate. These are real implemented gates, not
README-only claims. The [Vitest policy](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/vitest.config.ts)
sets branch coverage to 75% and lines, statements, and functions to 80% over
selected TypeScript sources, excluding generated classic-runtime behavior from
that coverage set; the [ESLint scope](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/eslint.config.js)
excludes scripts and dashboard web. Its [project-specific architecture checker](https://github.com/rpamis/comet/blob/9c6a89857f8ce33c12b9abcc1230bd1076de8068/scripts/lint/architecture.mjs)
is a substantial maintenance surface, not by itself a defect.

At ETHOS source commit `e534b5a9c7906ea865bf2b82b378eea90059c200`,
the [coverage policy](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/.config/checks/coverage/policy.toml)
requires a 95% hard floor with branch coverage for `src/ethos`, and the
[GitHub CI source](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/.github/workflows/ci.yml)
declares native host conformance on Linux, macOS, and Windows across Python
3.12-3.14. Its [independent-receipt admission](https://github.com/HengYangDS/ethos/blob/e534b5a9c7906ea865bf2b82b378eea90059c200/src/ethos/adapters/admission/evidence/external.py)
and governed Git effects address different trust predicates from COMET's agent
runtime and evaluation loops. A higher numerical coverage floor does not prove
that every ETHOS behavior or user journey is superior.

No complete upstream COMET suite, ETHOS full suite, or hosted run was executed
for this comparison. The sources establish declared checks and selected
implementations, not comparative pass rates, security certification, or a
unit-code semantic-density ranking. For ETHOS's repository-governance purpose,
retain exact proof, CAS, and Attestation ownership; borrow COMET's observed
checkpoint, recovery, and evaluation ideas only through a named failing
consumer and the existing owner. Neither product globally subsumes the other.

The shared invariant is not a file format: accepted meaning must be selected
with reasons and provenance, execution must remain under one source owner, and
observations must not promote themselves to authorization. Revisit these choices
only after a named greenfield, brownfield, cooperative or competing Work Lane,
reasoned drop, or feedback-to-intent consumer produces a failing counterexample.

## Concurrent path mutation and capability-bound reading (2026-09-25)

The current Publisher file reader checks path components for symlinks and then
opens a selected member by pathname. An independently reproduced replacement
of a checked parent with a symlink can therefore make it read an outside file
before the member digest is compared. A matching digest does not prove that
the read stayed inside the selected directory. More `lstat` or `realpath`
checks before or after `open` cannot make the separate operations atomic.
The probe established an unproved path-confinement boundary, not a qualified
path-confinement claim. Whether that stronger property blocks a release is an
acceptance-policy decision, not a consequence of the byte-lock requirement.

The pinned upstream [cap-std 4.0.3 source](https://github.com/bytecodealliance/cap-std/tree/b7acf8e8807fe3fab991884d2208b7e03d35a409)
describes handle-relative `Dir::open` and support for Linux, macOS and Windows.
Its [directory API](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-std/src/fs/dir.rs)
opens relative to an already-open directory handle. The companion
[follow option](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-fs-ext/src/open_options_follow_ext.rs)
rejects a symlink at the last opened component;
[default open options](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/fs/open_options.rs)
otherwise follow symlinks. The
[directory opening on Windows](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-fs-ext/src/open_options_maybe_dir_ext.rs)
needs an explicit option. These are source-level capabilities, not proof that
Publisher has integrated or shipped them.

A fixed-revision source inspection via GitHub CLI on 2026-09-24 UTC narrows
but does not close the platform risk. On
[Linux](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/rustix/linux/fs/open_impl.rs),
cap-std uses `openat2` with `RESOLVE_BENEATH | RESOLVE_NO_MAGICLINKS`
when available and falls back to manual handle-relative resolution otherwise;
its [open flags](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/rustix/fs/oflags.rs)
set `O_NOFOLLOW` for the selected option. The
[option's contract](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/fs/follow_symlinks.rs)
covers only the final component, so the proposed reader must open each
component separately. On
[Windows](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/windows/fs/oflags.rs),
cap-std's no-follow path opens with `FILE_FLAG_OPEN_REPARSE_POINT`; its
[open-result check](https://github.com/bytecodealliance/cap-std/blob/b7acf8e8807fe3fab991884d2208b7e03d35a409/cap-primitives/src/windows/fs/open_unchecked.rs)
rejects a handle whose file type is a symlink. Rust
[1.98.1's file-type implementation](https://github.com/rust-lang/rust/blob/1.98.1/library/std/src/sys/fs/windows.rs)
classifies name-surrogate reparse points as symlinks; the
[mount-point tag](https://github.com/rust-lang/rust/blob/1.98.1/library/std/src/sys/pal/windows/c/windows_sys.rs)
has that bit. This supports a junction-rejection hypothesis, **not** a
native Windows result or proof for every reparse tag and race. A platform
counterexample and packaged offline test would be prerequisites for a future
claim of race-resistant path confinement.

A disposable macOS probe built exactly `cap-std = 4.0.3` and
`cap-fs-ext = 4.0.3` into a 472 KiB release executable. It started at the
physical filesystem root, opened every path component relative to the
previous handle with no symlink following, and required the final handle to
be a regular file. A normal file read succeeded; static final and ancestor
symlinks failed. During 500 concurrent replacements of a selected parent
with an outside symlink, 143 reads returned the inside bytes, 357 rejected,
and none returned outside bytes. This is a bounded macOS feasibility probe,
not a proof for every interleaving, Linux, Windows, package installation, or
file-content mutation. Its scratch source, lockfile, build command and output
were not retained as a repository artifact, so these figures are a
non-admitting observation, not independently reproducible acceptance evidence
or a basis to select native supply. The crate resolution contained 40
packages; a native supply and multi-platform release matrix have real
ownership cost.

Three candidate boundaries remain for a reviewed decision:

1. Use one narrow, capability-bound native read operation for selected files,
   shipped with checked platform binaries. It must start from a trusted
   volume-root handle and open **every** path component with no-follow, rather
   than using `Dir::open_dir` defaults or anchoring at a raceable selected
   directory pathname. The caller must not silently fall back to pathname
   reads when the helper or supply is unavailable. Verify final and ancestor
   symlink races, Windows junction/reparse points, regular-file and size
   limits, exact byte pins, offline installation, binary identity, and native
   macOS/Linux/Windows behavior. This is the narrower semantic change, but
   adds a platform supply owner.
2. Replace path-based declarative members with one self-contained exact-byte
   carrier and parse members without extracting or opening their relative
   paths. This only removes the **member** race: opening the carrier pathname
   still races unless its bytes arrive through an already-trusted handle or
   stream, or it too is capability-opened. It changes source-side preparation,
   direct mode, packaging, and adopter DX. It is preferable only if measured
   total ownership cost is lower without creating an editable duplicate of
   source truth or weakening the existing escaping-member requirement.
3. Accept already-open bytes or handles from the caller. This avoids a native
   reader in Publisher but transfers path selection, custody, and provenance
   obligations to that caller and changes the public API. It cannot inherit
   Publisher's current escaping-member claim without an explicit new trust
   contract and source-side counterexamples. A hand-written platform-syscall
   helper might have fewer dependencies than cap-std but would make Publisher
   own more security-critical platform code; prefer the maintained capability
   library unless measured integration evidence reverses that trade-off.

None of the candidates is admitted. On 2026-09-26 the active design deferred
the native reader: no named consumer or approved requirement presently needs
race-resistant confinement from a hostile same-user mutator. The existing
readers bind consumed bytes and disclose the concurrent-mutation limit; they
cannot support a release claim of concurrent path confinement. A selected
acceptance policy may still reject that limit. Reopen this evaluation only
with a named consumer, explicit predicate, and cross-platform counterexamples.
