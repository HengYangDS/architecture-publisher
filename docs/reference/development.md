---
subject: architecture-publisher:development
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Development and verification

Use the repository-pinned Node/npm line and lockfile:

```sh
mise run bootstrap
mise run check
```

`npm run check` is the repository's fail-closed quality entry. It composes
Prettier, zero-warning ESLint, checked JavaScript contracts, module-direction
and dead-code analysis, Markdown and strict OpenSpec validation, measured test
coverage, and packed-package validation. Vendored Archify, font, and raster
supply remain outside first-party rewrite and dead-code ownership; their pinned
bytes are verified through supply-chain and behavior tests.

## Toolchain and supply

Development and CI
use the exact Node.js and independently selected npm versions owned by
`.config/mise/config.toml` and its lockfile, not Node's bundled npm. Runtime
compatibility is checked against the installed package; it is not an ETHOS
integration prerequisite or permission to run development tools with another
Node version. Native `devEngines`
admission rejects a different development Node/npm before installation or
scripts. Every native CI job uses the locked `.config/mise/config.toml` tool selection
in its own ignored tool cache, including the independently selected npm. Mise
owns installation and execution; shell Runners retain their existing Mise
installation owner. This does not raise the installed Core runtime floor.
Knip excludes the external `mise` bootstrap binary from npm dependency lookup;
the native CI environment regression executes that installed owner directly.
Linux uses native download, checksum verification and installation of the pinned
official executable before any Mise command. This job-local bootstrap changes
neither the non-root image contract nor the host's installation owner.
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

The 2026-10-22 npm audit reports eight affected development-package entries:
five high and three low, with no moderate or critical findings. These are package
entries, not independent advisories. Markdownlint's glob and math dependencies
retain nested-pattern stack exhaustion and a KaTeX trust bypass requiring existing
prototype pollution. The proposed Markdownlint CLI2 0.0.4 downgrade is not an
accepted repair; do not add vendor overrides.

Removing the unused LikeC4 graphical reader and React/style closure removed
215 lock entries and the Panda findings without changing retained versions.
Native LikeC4 parsing remains; other vulnerabilities are not fixed. Exact audit:
`build/evidence/guided-architecture-reading/stable-supply-20261021/full-native-quality-2115/source-claim-binding-20261022/continuation-20261022-0510/retired-reader-npm-audit.json`.

Existing approval covers trusted local input, pinned supply, isolated jobs,
disabled installer scripts and bounded execution only. It does not approve new
findings, release or untrusted repository, glob, Markdown, TOML or network input.
This audit neither proves affected code ships nor excludes it from generated
artifacts. The supply owner must obtain an official compatible fix or exact
successor disposition before promotion. Reassess changed upstream or consumer
scope and at the 2026-10-31 terminal review. Earlier approved findings remain in
`build/evidence/guided-architecture-reading/stable-supply-20261006/` receipts.

The development workspace selects OpenSpec through its npm manifest and lockfile.
Its official apply instructions
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

## Native raster source rebuild

Development bootstrap is `mise run bootstrap`. It installs the locked npm
inputs with lifecycle scripts disabled, restores the exact canonical prebuilt
Raster pair through the native `raster-supply` task, then runs `npm run generate`.
Validators and the LikeC4 parser are reproduced offline from locked inputs;
the Raster pair is checked against `source.json` before preparation. The four runtime
outputs have exact ignore rules and remain included by the package's native `files` selection.
Generation is explicit: there is no `pretest` or `posttest` hook.

`ARCHPUB_RESVG_PREBUILT` may select a caller-owned directory containing the exact
`index.mjs` and `index_bg.wasm` pair. Both must pass their recorded size and digest
before either is prepared. Without that selection, generation checks the pair
already prepared by bootstrap. The native Git task retains one immutable source
revision; it never fetches a missing object or changes the index. Source custody
on a remote Forge remains separately unproved until its exact full-history clone
has completed bootstrap.

The installed raster renderer uses packaged Wasm; ordinary users need neither
Rust nor a platform shell. Source rebuilding uses native archive extraction,
Cargo and `wasm-bindgen`, with the exact toolchain and digests selected
by `packages/publisher/renderers/resvg/supply/resvg/source.json`.

In a caller-owned disposable directory:

1. Download the selected source archive through its native registry consumer.
2. Run `node tools/raster/resvg/verify.mjs --archive <archive>` before extraction.
3. Extract the verified archive with the platform's native archive tool. Keep
   the original extracted Cargo manifest and vendored dependencies unchanged.
4. Run `node tools/raster/resvg/verify.mjs --inputs <absolute-source-root>`.
5. Select the manifest's already installed Rust toolchain/target and matching
   `wasm-bindgen` without replacing another installation owner. From the extracted
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
   The source manifest selects the exact pre-admitted native Wasm witness;
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
different Wasm bytes. Native CI supplies the execution deadline. A successful
integrity test does not prove a full source rebuild or an untested architecture.
Native witnesses do not claim cross-host Wasm byte identity or universal behavioral
equivalence. New witnesses require independent clean-build evidence and review;
the source manifest remains their sole owner, not a runtime hash-acceptance list.
The evaluated `wasm-pack` wrapper is not selected: its metadata discovery rewrites
the original lockfile before applying its later offline/frozen build options.

Prettier is the sole Markdown spacing owner. `npm run format` fixes maintained
files; `npm run check:format` verifies the same inputs without changing them.
Wrapped prose, compound list items and quote structure retain their meaning.
Markdownlint owns structural and semantic lint, not a second spacing grammar.
Captured fixtures, vendor supply, generated examples and archived specifications
retain their recorded bytes.

Native tool policy lives under `.config/checks/<tool>/`. Each npm script passes
its exact carrier; there is no ambient configuration reference in the root
manifest. See [configuration ownership](configuration.md) for tools, lockfiles
and ignored outputs.

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

The npm test environment sets `umask 022` within its own POSIX process and owned
children before package reproduction, without changing the Runner service or
the user's session. Native Runner selection owns operating system, architecture
and trust identity; duplicate inline assertions are not a second admission rule.
The Linux job downloads the official release's Linux ARM64 executable into its
private tool cache, verifies the pinned SHA-256, then uses native `install` to
make it executable. Each operation is a separate fail-closed CI command; no
custom installer or new container release is required. The CUE source owns
version selection; `.config/ci/linux/mise.sha256` owns asset identity. Actual
non-root Linux execution and damaged-byte refusal qualify this bootstrap,
not the complete hosted pipeline.
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
including mixed-line-ending notices and binary fonts. Native CI uses GitLab's
fetch strategy and default cleaning, excluding only
`build/runtime/tool-cache/`. A completed browser can retain a mapped DLL that
prevents recursive workspace replacement on Windows; on Linux and macOS, deleting
the same verified cache also needlessly repeats large upstream downloads.
Windows additionally runs `git checkout-index --all --force` to refresh every
tracked carrier before tool execution, including attribute-only changes and
stat-clean CRLF files. Previous coverage and other generated output are cleaned;
required evidence belongs outside that disposable job state. Retained tools
remain subject to their locked supply checks. Each Runner and trust role retains
only its own workspace cache; no shared GitLab cache or cross-role store is used.
Linux selects `/ms-playwright` from its pinned official Playwright image instead
of downloading a second browser copy into the workspace. The image and locked
Playwright package must select the same native browser revision. Mise preserves
the explicit invoker-owned browser root; without one, it uses the existing
project-local cache. Native browser launch and the complete quality graph still
qualify the selected bytes, not just their presence in the image.
Native checkout logs and byte checks must confirm the effective strategy. This
does not modify global Git configuration or prove that a previous process was
reclaimed.
The two Publisher Linux Docker Runner owners select the verified official
Playwright seccomp profile, which permits user-namespace creation without
privileged execution or disabling Chromium's sandbox. Only their Docker
`security_opt` fields change; credentials, other Runner blocks, ownership and
VM sharing remain unchanged. Original configuration bytes stay with their
native owners until the corresponding full native job releases rollback
custody. A successful sandboxed browser probe does not qualify the full CI
matrix. Evidence: `build/evidence/guided-architecture-reading/stable-supply-20261006/linux-runner-seccomp-readback.log`
and `linux-native-sandboxed-browser.log`. The protected image download remains
unqualified after its bounded timeout; the protected job must verify its own
selected image and browser.
Mise's locked Rust declaration includes `cargo`, `rustc` and the host `rust-std`.
Its native installation repairs missing selected components in the retained
tool-cache; a minimal profile alone does not reconcile an already installed
toolchain. The separate Wasm target does not replace the host standard library
needed to compile build scripts.
The native bootstrap invokes `mise exec -- rustup component add rust-std`
after locked installation. Rustup resolves the host from the selected toolchain;
this is idempotent component reconciliation, not a second version declaration
or installer. Mise's generic component predicate can otherwise count a Wasm
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
before `npm run check` to execute its browser tests. The external AIGW
conformance test separately requires absolute `AIGW_EDITION_ROOT` and
`AIGW_SOURCE_ROOT` selections: editorial preparation and read-only source
material remain separate. These are Publisher test inputs, not AIGW configuration
or CI requirements. The historical paired-file migration rehearsal
requires both absolute `PAIR_PRIOR_NATIVE` and `PAIR_PRIOR_ATLAS` paths; it
copies those deliveries into temporary test state before effects. None of
these selectors grants source acceptance or a release decision.

Never edit immutable release plans or substitute a similarly named newer
generation. Evidence is applicable only to its exact bytes and declared scope.
