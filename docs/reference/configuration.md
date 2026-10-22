---
subject: architecture-publisher:configuration
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Repository configuration

Native tools own policy and parsing. Configuration lives in `.config`; the
root npm scripts select the exact native carriers. ETHOS selects governance
roles, not a duplicate quality or formatting implementation.

| Owner                                                        | Native consumer                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `.config/checks/eslint/eslint.config.mjs`                    | `npm run check:lint`                                                                |
| `.config/checks/typescript/tsconfig.json`                    | `npm run check:types`; Knip's native TypeScript project                             |
| `.config/checks/c8/.c8rc.json`                               | `npm run test:coverage`                                                             |
| `.config/checks/knip/knip.toml`                              | `npm run check:dead-code`                                                           |
| `.config/checks/markdownlint-cli2/.markdownlint-cli2.yaml`   | `npm run check:docs`                                                                |
| `.config/checks/prettier/prettier.toml` and `prettierignore` | `npm run format` and `npm run check:format`                                         |
| `.config/checks/taplo/taplo.toml`                            | Native TOML formatting in the same fix and check commands                           |
| `.config/checks/file-budget/policy.toml`                     | Native lint and the owned Markdown budget rule                                      |
| `.config/checks/format-selection/policy.toml`                | Native ETHOS carrier selection; `npm run test:coverage` verifies captured SVG bytes |
| `.config/release/icons/policy.toml`                          | `node tools/supply/icons.mjs --check`                                               |
| `.config/mise/config.toml` and `mise.lock`                   | Native Mise tool selection and locked execution                                     |

The file budget is 512 counted lines. ESLint excludes blank and comment-only
lines; the existing Markdown budget rule counts nonempty physical lines.
Neither rule owns Markdown spacing: the original Prettier formatter does.

Policy moves must qualify their actual consumers. Knip, c8 and Markdownlint
file selection remains repository-relative. Markdownlint loads its owned rule
relative to its configuration file. Prettier ignore paths are relative to its
ignore carrier, so relocation updates them without widening input selection.
No forwarding file, private parser or host-specific path is needed.

The format-selection increment preserves seven exact SVG inputs: dated research
captures and the original/updated standalone examples. They are byte-bound
inputs, not unformatted drafts. The native behavior gate verifies their recorded
hashes; Raster and installed example journeys consume them unchanged. No wildcard
excludes future figures or replaces upstream-source provenance.

Knip's native Markdownlint plugin selects the same relocated configuration and
resolves its custom rule. Its default analysis covers development tools; strict
production analysis selects the shipped workspaces, not the private root workspace.
Non-npm binaries listed by Knip are selected and checked through the native Mise
toolchain. Module-direction checks inventory configuration separately as resources:
check tools may read check policy, while production modules cannot acquire it.

Sax and OpenType are direct, exact development locks for authentic received-source
custody, not runtime imports. Knip's native `ignoreDependencies` declares that
non-import use. Their supplied files remain byte-identical to the selected npm
archive members; the source-integrity provider, not the ignore setting, proves
that relationship.

The profile's `source-integrity` gate uses the installed ETHOS provider to check
the exact npm lock members before runtime generation and all dependent quality
gates. Libavoid, Dagre, ELK, SVG pan/zoom, Sax, OpenType and the schema generator's license
retain their authentic member paths. A declaration is an obligation, not proof:
accepted-source verification must observe the committed profile, lock and member
bytes together. Libavoid's source custody does not qualify the retained routing
experiment or select it as the composition solution.

Archify's complete original release ZIP is retained under
`tools/supply/archives/`. Its native received-archive contract is enabled only
with an installed ETHOS runtime that supports the ZIP reference. Independent
working-tree verification does not replace that runtime transition or committed
source acceptance. Never relabel the release as an npm package or modify its
members to fit an older verifier.

`mise run bootstrap` prepares generated runtime before verification. Its native
`raster-supply` task restores the canonical prebuilt pair from one immutable Git
revision without changing the index or contacting a Forge; `npm run generate`
verifies that pair and reproduces the parser and validators from locked inputs.
Exact ignore rules separate those four outputs from authored source. Npm's
package `files` declaration still includes them when present at pack time.
Git untracking and committed-source proof remain a separate migration step;
ignore rules alone do not remove a file from the index.

The canonical Raster pair and a fresh native rebuild are distinct objects.
The current compiler can produce a qualified native witness with different Wasm
bytes; bootstrap restores the immutable canonical pair and verifies its recorded
`outputs` instead of treating that witness as a byte-identical replacement.
Full-history recovery of the selected Git object remains a separate custody
requirement. A shallow clone without that object must not learn new hashes or
silently select another pair.

`VERSION` is the sole version source, not tool configuration. The release
projection at `tools/release/version.mjs` reads it, derives required npm package
versions and internal pins, and checks their lockfile identities without
resolving dependencies. The private root workspace has no version. Use
`node tools/release/version.mjs --write` after a version change; the existing
generated-input gate runs its non-mutating `--check` mode before qualification.

## Job-local native tools

`.config/ci/pipeline.cue` owns one shared execution graph and native-platform selection.
Its peer adapter owns only events, runner trust roles and source-asset transport.
`node tools/ci/projection.mjs --write` generates configured YAML. `npm run check:ci`
verifies exact projections without writing, both locally and before each peer's
whole quality gate. GitLab and GitHub are configured as equal optional peers;
local checking contacts neither Forge and requires no credentials. Selecting
another peer requires its real runner and transport contract, not another copy
of the common script. Remote existence and generated configuration do not prove
source publication, hosted checks or asset recovery.

Mise discovers `.config/mise/config.toml` and its adjacent native `mise.lock`.
The same selection applies to local and CI execution; `MISE_ENV=ci` introduces no
second toolchain.
The Forge projection requires locked installation and keeps tool supply under
the job's ignored `build/runtime/tool-cache/`, separate from host installations.
The generated `mise/locks/` files belong to Mise's npm lock closure; they are not
another package manifest or product interface.

Taplo is selected through Mise's official GitHub backend at its unchanged
`0.10.0` release tag. Each platform uses the official release asset and an
explicit SHA-256 checksum. The release API does not supply digests; native Mise
verifies the authored checksum during installation rather than reporting absent
lock metadata as provenance. Platform-specific options produce separate lock
entries. No source modification or duplicate host installation is required.

Node selection comes from the native Mise tools declaration. The selected npm, Rust target and
`wasm-bindgen` versions serve native execution, not an alternative quality gate.
The Rust declaration explicitly selects `cargo` and `rustc`; native Mise
installation reconciles these components even when the tool-cache survives.
Mise exposes each selected tool as either a map or an array. Both environment
templates resolve the native shape before selecting its installation path.
Windows CI retains only the locked tool-cache through GitLab's native fetch and
clean settings. Forced index checkout refreshes tracked bytes before any tools;
previous coverage and other job output are not retained.
Linux ARM64 additionally selects official Pixi through Mise's lock. The native
`ci/linux/` manifest and lock provide C compilation and xz without root package
installation. CI invokes native `pixi run --locked` with the exact manifest and
configuration carriers. Pixi activates the environment for each acceptance
command; no copied manifest, generated shell hook or sourced script is required.
Its cache stays in `build/runtime/tool-cache/pixi/` on the Runner's native
filesystem; `.config/ci/linux/.pixi/` is ignored native environment state, not
another configuration owner. These prerequisites do not change the public product's runtime.
The Pixi-generated lock retains native bytes as a Git snapshot and is excluded
from editorial formatting; authored manifest and configuration remain config.

Playwright owns Chromium installation; the npm test preload requires the exact
selected executable in CI. The Raster source manifest owns archive identity and
registry coordinates; `tools/raster/resvg/verify.mjs` derives its retrieval URL
from the caller's Forge API base and verifies bytes before the frozen journey.
GitHub retrieves the same manifest-selected source closure from its own private
release custody through native `gh`, using only that job's read-only token.
Its hosted ARM64 runners use pinned official checkout and Mise actions; each
quality command retains the executor's failure boundary. The source closure
must be mirrored and downloaded with a matching hash before hosted qualification.

`.config/ci/linux/Dockerfile` changes only the immutable official Playwright image's
default to `pwuser`. Runner's native checkout ownership inspection uses that
image configuration, not the job's late user override. The recipe introduces
no filesystem layer, package installer, repository content or runtime command.
CI may select its immutable digest only after registry readback; actual hosted
ownership and sandboxed browser execution remain separate acceptance predicates.

Linux bootstrap uses three native commands: Curl downloads the exact official
Mise Linux ARM64 executable, `sha256sum` checks
`.config/ci/linux/mise.sha256`, and `install` promotes only verified bytes into
the job-local executable path. CUE owns the release version and command order;
the checksum carrier pins the exact release asset. The downloaded file is not
executed before verification, and a failed step blocks all later steps. This
needs no repository installer, new image publication or host installation.
The superseded generated installer and generator record are retired. The
multi-stage image experiment remains failed evidence, not active CI supply.
