---
subject: architecture-publisher:configuration
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Repository configuration

Native tools own policy and parsing. Configuration lives in `.config`; the
root npm scripts in `package.json` select the exact native carriers, each
check naming the file it reads with `--config` or `--project`. ETHOS selects
governance roles, not a duplicate quality or formatting implementation. Besides
the CI carriers below, five carriers no script names have their own readers:
Prettier reads `.editorconfig` for the character set and line endings of what
it formats; `node tools/supply/icons.mjs --check` reads
`.config/release/icons/policy.toml`; Mise selects and locks the tools from
`.config/mise/config.toml` and `mise.lock`; npm under Mise reads
`.config/npm/npmrc`, the least age of a release that a resolution takes; and
`.config/checks/format-selection/policy.toml` is ETHOS's format selection's,
read by the installed ETHOS, not by this repository's code. Knip reads the
TypeScript project that `knip.toml` names.

The size ceilings are the ETHOS repository paradigm's: 500 effective lines for
each code file and 500 nonblank lines for each authored Markdown document,
which `ethos status` measures in every governed repository; no binding here
restates them. Third-party supply is held 24 hours: Mise reads the age from its
configuration and npm from `.config/npm/npmrc`, which the Mise environment names
as npm's user configuration, so npm run outside Mise reads no age here. Neither owns Markdown spacing: the original Prettier formatter
does.

Policy moves must qualify their actual consumers. Knip, c8 and Markdownlint
file selection remains repository-relative. Prettier ignore paths are relative
to its ignore carrier, so relocation updates them without widening input
selection.
No forwarding file, private parser or host-specific path is needed.

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

`src/refusal.json` is the sole source of the codes the publisher raises or
reports, each once with its meaning; the type check holds every raise to it.
`src/cli/outcomes.json` is the sole source of how a command ends: each
outcome's exit status and the keys of the JSON object it prints, which the
command line reads. `src/environment.json` is the sole source of the variables
a child process receives from the publisher's caller, and
`tools/release/archive/members.json` of a release archive's members. The
release's platforms are those `mise.lock` pins both Node.js and Typst for.
`src/pinned/data.schema.json` is the sole statement of a delivery's data: its
members and the keys of each entry, in their order, with their types and
descriptions. The publisher writes the data in the shape it states, and the
tests hold every data file they build to it.

## Written reference tables

A table, list or sentence of a document that restates the source stands on its
own lines between two comment lines that name its source; besides the
references, the README, the how-to guides and the bug report's form carry the
release's platforms the same way. The model's schema
states the categories, the palettes and the languages as the tables that own them do:
`src/categories.json`, `src/house.json` and `src/locales.json`. The writer
reads declared files, and imports a module of the tree only for what that module
states and no table holds: the ids a model may not take (`src/names.mjs`), the
lengths a strip is drawn at (`src/poster/strip.mjs`), the age bands
(`src/facts/ages.mjs`) and the widths the line trials measured at
(`tests/fixtures/line-tables.mjs`). After changing
a source, run `node tools/docs/references.mjs --write`, which writes them
and those enumerations of the schema; it writes the whole schema in one
layout, so a hand edit's own layout is written out again. `npm run
check:generated` refuses a document or a schema that differs from what the
writer writes and names it:
locally, in the proof and in a pipeline, since generation writes no committed
file.

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

Taplo is selected through Mise's official GitHub backend at the unchanged
release tag `.config/mise/config.toml` names. Each platform uses the official release asset and an
explicit SHA-256 checksum. The release API does not supply digests; native Mise
verifies the authored checksum during installation rather than reporting absent
lock metadata as provenance. Platform-specific options produce separate lock
entries. No source modification or duplicate host installation is required.

Node selection comes from the native Mise tools declaration. The selected npm,
Typst and CUE versions serve native execution, not an alternative quality gate.
CI retains only the locked tool-cache through GitLab's native fetch and clean
settings; previous coverage and other job output are not retained.
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
the job-local executable path. The download is staged under the release's own
name in the tool cache, which a job's clean spares: Curl resumes a partial
file and fetches nothing where the runner already holds the release. CUE owns
the release version and command order; the checksum carrier names and pins
the exact release asset. The downloaded file is not
executed before verification, and a failed step blocks all later steps. This
needs no repository installer, new image publication or host installation.
The superseded generated installer and generator record are retired. The
multi-stage image experiment remains failed evidence, not active CI supply.
