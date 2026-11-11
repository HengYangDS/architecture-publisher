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

| Owner                                                        | Native consumer                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `.config/checks/eslint/eslint.config.mjs`                    | `npm run check:lint`                                                 |
| `.config/checks/typescript/tsconfig.json`                    | `npm run check:types`; Knip's native TypeScript project              |
| `.config/checks/c8/.c8rc.json`                               | `npm run test:coverage`                                              |
| `.config/checks/knip/knip.toml`                              | `npm run check:dead-code`                                            |
| `.config/checks/markdownlint-cli2/.markdownlint-cli2.yaml`   | `npm run check:docs`                                                 |
| `.config/checks/prettier/prettier.toml` and `prettierignore` | `npm run format` and `npm run check:format`                          |
| `.config/checks/taplo/taplo.toml`                            | Native TOML formatting in the same fix and check commands            |
| `.config/checks/format-selection/policy.toml`                | Native ETHOS carrier selection for three immutable research captures |
| `.config/release/icons/policy.toml`                          | `node tools/supply/icons.mjs --check`                                |
| `.config/mise/config.toml` and `mise.lock`                   | Native Mise tool selection and locked execution                      |

The size ceilings are the ETHOS repository paradigm's: 500 effective lines for
each code file and 500 nonblank lines for each authored Markdown document,
which `ethos status` measures in every governed repository; no binding here
restates them. Neither owns Markdown spacing: the original Prettier formatter
does.

Policy moves must qualify their actual consumers. Knip, c8 and Markdownlint
file selection remains repository-relative. Prettier ignore paths are relative
to its ignore carrier, so relocation updates them without widening input
selection.
No forwarding file, private parser or host-specific path is needed.

The format-selection policy declares three dated research SVG captures under
`docs/research/evidence/` as immutable carriers that no formatter rewrites. They
are history, not product fixtures. No wildcard excludes future figures.

Knip's native Markdownlint plugin selects the same relocated configuration. Its
default analysis covers development tools; strict production analysis starts
from the package's `bin` command.
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
gates. Sax and OpenType retain their authentic member paths. A declaration is an obligation, not proof:
accepted-source verification must observe the committed profile, lock and member
bytes together.

Archify's complete original release ZIP is retained under
`tools/supply/archives/`. Its native received-archive contract is enabled only
with an installed ETHOS runtime that supports the ZIP reference. Independent
working-tree verification does not replace that runtime transition or committed
source acceptance. Never relabel the release as an npm package or modify its
members to fit an older verifier.

`mise run bootstrap` installs the locked npm inputs and runs `npm run
generate`, which reproduces the LikeC4 parser from locked inputs. An exact ignore
rule separates that output from authored source, and npm's package `files`
declaration still includes it when present at pack time.

`VERSION` is the sole version source, not tool configuration. The release
projection at `tools/release/version.mjs` reads it, derives required npm package
versions and internal pins, and checks their lockfile identities without
resolving dependencies. The private root workspace has no version. Use
`node tools/release/version.mjs --write` after a version change; the existing
generated-input gate runs its non-mutating `--check` mode before qualification.

## Job-local native tools

`.config/ci/pipeline.cue` owns one shared execution graph and native-platform selection.
Its peer adapter owns only events, runner trust roles and runner bindings.
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

Node selection comes from the native Mise tools declaration. The selected npm,
Typst and CUE versions serve native execution, not an alternative quality gate.
Windows CI retains only the locked tool-cache through GitLab's native fetch and
clean settings. Forced index checkout refreshes tracked bytes before any tools;
previous coverage and other job output are not retained.
Playwright owns Chromium installation; the npm test preload requires the exact
selected executable in CI. GitHub's hosted runners use pinned official
checkout and Mise actions; each quality command retains the executor's failure
boundary. Every platform runs the same shared acceptance commands after the
same preparation.

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
