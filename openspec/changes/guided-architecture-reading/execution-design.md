# Cross-platform execution design

## Cross-platform execution boundary

The supported execution targets are native macOS, Linux and Windows. The
public build, qualification, installation and recovery contract is identical
on those targets; passing through Git Bash or checking Shell/PowerShell syntax
does not establish that contract. Keep npm, Cargo and `wasm-bindgen` responsible
for their native operations. Do not translate a Shell controller into another
language, add a second task authority, or require source repositories to carry
platform-specific publication scripts.

The complete npm quality graph checks frozen raster input/output integrity;
native Rust/Wasm source rebuilding is a separate acceptance obligation.
Historical Git-shell refusal checks do not establish Windows rebuild support.
Preserve the selected source archive and runtime output bytes.

Use native archive extraction, Cargo and `wasm-bindgen` for the frozen rebuild.
Cargo remains offline and frozen; binding uses the existing explicit flags.
Pass the resolved absolute source root to Cargo's path remapping; mapping `.`
is not equivalent. Keep the original Cargo manifest and lockfile unchanged.
The tested `wasm-pack` wrapper produces the selected output bytes but rewrites
the original lockfile during metadata discovery, so it does not qualify.

The authored build helper is `tools/raster/resvg/verify.mjs`. It checks the
selected archive digest, extracted input bytes and output bytes without starting
subprocesses or installing tools. Check modes are read-only; explicit `--stage`
prepares only the canonical output pair before runtime generation. Both source
members pass their recorded size and digest before either destination is written;
matching destination bytes remain unchanged. The helper cannot authorize its
own integrity. Packaging retains the immutable pair from `source.json.outputs`,
selecting the verified binding as `index.mjs` without rewriting its contents.
The helper remains a private development entry, not a public command or another
orchestration plane.

Frozen native rebuilding and canonical package integrity are separate
guarantees. Current macOS and Linux builds produce identical binding bytes
but different Wasm bytes. Cargo's host-dependent recursive dependency metadata
supports this diagnosis; removing custom sections did not restore identity.
That evidence neither proves every difference has this cause nor authorizes
changing canonical output hashes to the last build's result.

The existing source manifest owns pre-admitted native witnesses. Each witness
binds the full compiler host triple, exact Rust and Cargo releases and commits,
the selected `wasm-bindgen` version and the expected native Wasm digest/size.
The JavaScript binding remains bound to the canonical digest. Witnesses are
admitted only after two independent, clean extractions and builds agree, and
an independent review accepts the resulting evidence. Unknown or altered
tool identities fail closed; execution never learns a hash or chooses a fallback.

`verify.mjs --outputs <output-root>` checks canonical output. Supplying an
additional tool-identity JSON file selects the exact pre-admitted native
witness. That file is a caller-owned observation, not execution proof: the
native journey obtains Rust/Cargo verbose versions and `wasm-bindgen`'s version
from the actual selected executables. The helper only checks that observation
against the manifest and verifies output bytes.

The native journey independently extracts the verified archive twice into
relocated roots containing spaces and Unicode, with separate empty Cargo
targets. It checks the selected inputs before and after each offline/frozen
build, verifies both outputs against the selected witness, and compares their
digests. Rebuilt and canonical modules must also agree on imports/exports,
exact representative PNG bytes, all selected packaged fonts, text measurement,
declared errors and an actual authored static workload. These are finite
behavioral witnesses, not universal equivalence or cross-host Wasm byte identity.

Native CI owns job deadlines and disposable build roots. Actual macOS, Linux
and Windows evidence remains mandatory. Retire the historical POSIX controller
and its active consumers together only after those native rebuilds and installed
renderer acceptance pass. No Bash fallback or PowerShell controller qualifies
as that replacement.

Platform acceptance must cover actual native execution, relocated paths with
spaces and Unicode, executable discovery, cold offline installation, bounded
process-tree reclamation, publication/recovery effects and exact selected font
rendering. OS-specific process and filesystem facilities remain small explicit
capability boundaries, not emulated promises: Windows directory flushing is
reported as unsupported, and optional CoreText measurement is macOS-only.
The portable raster path must not depend on CoreText, Bash or PowerShell.
Passing one platform, ARM64 runners, or a rejection fixture does not imply
other architectures or a full cross-platform source rebuild.

Test harness deadlines include cold native startup and teardown, independently
of a product worker's execution deadline. Direct layout-worker probes retain
their one-second self-expiry and use a finite ten-second parent observation
budget; assert process errors before interpreting replies. The geometry-only
reading test selects the existing 25-second layout ceiling. Installed Provider
setup uses native offline, scripts-disabled npm with no saved manifest or
lockfile and a finite 120-second installation budget. Product defaults,
coverage scope and all assertions remain unchanged. Pipeline 9507 failures
and the unchanged 25-case macOS guest replay establish the affected boundary,
not a proved hardware, parser or filesystem root cause. A complete successor
matrix must still pass before publication.

### Native Linux orphan reaping

Linux Docker verification selects the Runner's native
`FF_USE_INIT_WITH_DOCKER_EXECUTOR` feature flag. The Docker executor then starts
the build container with `--init`; its PID 1 reaps orphaned children after
Publisher's existing invocation-scoped process-group termination. No additional
process controller, host configuration change or assertion relaxation is needed.

The same exact snapshot and twelve installed Provider and qualification tests
fail without init and pass unchanged with init. The failing descendants are
PID-1-owned zombies; the passing process table contains none. This isolates the
container precondition without declaring hosted or full-release acceptance.
The official Runner feature declaration and Docker executor wiring, fixed blobs
`9bcb2c3b4dbc9bd4b6376f11cb3dfeb970042fc6` and
`ba0b63e53ba7e5a087b32d18bf201559eb6cb4bf`, are preserved alongside the exact
RED/GREEN logs under the current Lane's Linux prerequisite evidence. Native
hosted execution still has to prove this setting on its actual Runner.

### Native Windows tool discovery

Locked Rust owns MSVC linker and SDK discovery for the actual target. Its
upstream `get_linker` delegates to `find_msvc_tools::find_tool` and applies the
selected tool environment. Windows CI therefore only binds the native platform
and executor; it does not assume Visual Studio's installation path or launch
a developer-shell controller. The unchanged Cargo journey must perform real
host compilation and Wasm rebuilding before quality checks. Missing tools
remain a native compilation failure, not a bypassed prerequisite. This design
changes no Guest isolation, execution policy, credentials or Rust target.

### Required native CI execution

Windows uses native GitLab fetch and cleaning, excluding only the job-local
`build/runtime/tool-cache/`. Forced index checkout renews every tracked carrier
before tools run, preserving exact LF and frozen supplier bytes after attribute
changes without recursively deleting a mapped browser cache. All other prior
job output is cleaned. Retained tools still undergo locked supply validation;
this checkout policy does not claim process reclamation or hosted acceptance.
The locked Rust declaration selects `cargo`, `rustc` and host `rust-std`
explicitly. Mise passes these requirements to native rustup toolchain
installation, which reconciles missing selected components in a retained
cache. Wasm target selection does not cover the host library used by build
scripts. The minimal profile, target and version remain unchanged; no
secondary installer or retry controller is introduced.
The native bootstrap reconciles host `rust-std` with a single
`mise exec -- rustup component add rust-std` command. The selected Mise
toolchain still owns version and homes; rustup chooses its host without a
copied platform table. This compensates for Mise's component predicate accepting
any target-qualified library, including Wasm, as an unqualified component.

The native Linux job uses the pinned official Playwright filesystem with
`pwuser` as the image's default user. The two-instruction Dockerfile changes
only image configuration: `FROM` an immutable upstream digest, then `USER pwuser`.
It copies no repository material, installs nothing and adds no process owner.
Runner 19.4.1 checks the image default when deciding whether to repair checkout
ownership; a job-level user override does not satisfy that prerequisite.
CI must select a registry-verified immutable derivative digest and preserve
the native ownership flag, rather than using root or manual checkout repair.
Actual hosted preparation must prove both project and temporary-directory
ownership before the existing product gate can establish platform acceptance.

Mise selects official Pixi only for Linux ARM64; its native lock binds the
binary. A separate native Pixi lock supplies conda-forge C compilation and xz.
CI selects the original manifest and configuration with native `pixi run --locked`
for each prerequisite and acceptance command. Pixi owns installation and
environment activation; no copied manifest, shell hook, root package manager,
registry-policy bypass or parallel quality controller is added. Its job-owned
cache stays under ignored `build/runtime/tool-cache/pixi/`. The activated compiler
is the explicit Cargo native-target linker. Actual compilation and execution,
frozen Raster rebuilding and the whole quality gate qualify this boundary;
a zero installer exit alone is insufficient if diagnostics show an incomplete
environment. Preserve prior failed receipts.

The locked Playwright installer owns the CI browser supply under each job's
`build/runtime/tool-cache/playwright/`. The existing npm test preload binds its
native Chromium executable only when CI has not selected an explicit browser.
CI requires an absolute, accessible executable and refuses missing supply before
tests can silently skip. Explicit caller selections remain unchanged. Local
focused tests may remain browser-optional; browser launch, sandbox and actual
rendering are separate runtime acceptance, not inferred from a path check.

Every native platform job must execute the selected browser journey with the
Chromium sandbox enabled. Linux execution requires a qualified non-root job
principal; installing a browser or changing a flag is not sandbox acceptance.
The existing frozen Raster journey uses the manifest-selected Rust, Wasm target,
`wasm-bindgen` and source archive through native tool supply and execution. Keep
job-owned caches separate from host installation owners. Missing prerequisites
fail the required journey rather than waive it; retain platform-specific raw
results and all four coverage floors. Retire the POSIX Raster controller only
after its actual consumers migrate and the native target-platform journey passes.

CI binds both Mise installation data and its download/package store beneath
the job-owned tool-cache. The native npm backend links payload files from the
Mise cache, so a system-principal store can leave an otherwise readable install
tree with inaccessible hardlinked files. Rebuild a damaged selected tool through
native locked installation using the job-owned cache; never widen system-store
permissions. A management-principal repair is not Runner acceptance.

Native npm and Publint subprocess resolution must retain the selected npm version,
not fall back to Node's bundled npm when a subprocess prepends its executable
directory. The private workspace declares the already selected npm as a locked
development tool; native dependency bins, not a custom script or vendor patch,
own that binding. The installed Core package gains no npm runtime dependency.

Browser test ownership uses one outer native asynchronous lifetime with two
disposal phases. Completed resources and deferred actions close in reverse
acquisition order first. Pending acquisitions drain afterward; each late
resource receives native disposal without being returned to an expired test.
Register pending ownership before its factory executes, and transfer a
completed resource synchronously before returning it. A parent's closure may
reject or complete its pending dependent; cleanup must not await that dependent
before closing the parent. Acquisition rejections retain their original error,
and disposal failures cannot skip the pending drain. Both phases preserve
exactly-once synchronous/asynchronous disposal and native empty resources.
Deadline-bounded subprocess regressions cover rejected and resolved pending
dependents, throwing parent disposal, normal dependent-first order and test
expiry. They do not increase existing deadlines or weaken reader assertions.

New generated output belongs under the repository's ignored `build/`, according
to the projects-family contract. Existing records remain exact retained inputs
until their named consumers release them; do not create another records root.
Designated Forge records preserve required durable release evidence. Documents
contains reader deliveries, not source or a second mutable Edition.
Verify exact custody before disposing of owned temporary outputs. Historical
signed releases, original reader bytes, foreign work and user windows remain
unchanged. Source acceptance, research settlement and lifecycle closure are
separate remaining obligations.
