## Why

The repository declares and runs ETHOS 0.2.0-beta.9. The owner asked that every governed repository
run the latest ETHOS release. 0.2.0-beta.10 publishes its own Mise declaration, whose platform
checksums equal the release's `SHA256SUMS` and the published asset digests.

Its adopter-facing changes since 0.2.0-beta.9 are these:

- **Breaking: Markdown lists follow one blank-line rule** in the Markdown format, its check, the
  Markdown gate and `pre-commit`: a list item with one paragraph is followed directly by the next
  item. A file that breaks it fails `markdown_list_spacing:<path>:<line>` until
  `ethos lane format --apply` repairs it in a Work Lane.
- **Breaking: the canonical text files have an acting owner.** INI and `.cfg` files, the Vale
  vocabularies, `LICENSE`, `VERSION`, `.editorconfig`, `.gitattributes`, `.gitignore`, `.gitkeep`,
  `.shellcheckrc` and the CI supply's `Dockerfile` and `.dockerignore` take no blank line at the
  start or the end, at most one in a row and one final newline; the source-format gate reports
  `source_format_drift:<path>`.
- **Breaking: every authored `__init__.py` opens with a docstring** that names its package's
  purpose, or the paradigm reports `repository_paradigm_package_docstring:<path>`.
- **Breaking: every README that the docs registry admits declares `role: index`** and holds at most
  100 lines that are not blank; docs health reports `docs_readme_not_index:<path>` and
  `docs_index_too_long:<path>:<lines>>100`.
- A paradigm refusal that `ethos lane repair-paradigm` can repair names its preview as the next
  action, and `.config/mise/mise.lock` is required only when `.config/mise/config.toml` selects a
  tool.
- Its Node.js supply moves to 26.13.1, a security release with nine High-severity fixes under seven
  CVE identifiers.
- It upgrades directly from 0.2.0-beta.9 and keeps result schema 3. A rollback after the declaration
  repair is not qualified. Among its known open defects, npm 12.2.2 still bundles `glob` 13.0.6 and
  `minimatch` 10.2.5 (GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249), and Go's GO-2026-6859 still affects
  the bundled `cue`, `vale` and `shfmt`, which ETHOS runs only as local commands over repository
  files without starting an HTTP server.

Under 0.2.0-beta.10 the canonical text owner also selects two received font licenses,
`renderers/house/supply/source-sans-3/LICENSE` and `renderers/house/supply/source-serif-4/LICENSE`,
although the repository marks its supply trees `linguist-vendored`: the format selection does not
yet subtract received paths, which ETHOS repairs in 0.2.0-beta.11. Their bytes are upstream's and
must not change. The repository already verifies them: `verifySupply("house")` refuses the supply
when a listed file's length or SHA-256 differs from `renderers/house/supply/supply.json`, and the
`node-behavior` gate runs it.

## What Changes

- Replace the 0.2.0-beta.9 declaration in `.config/mise/config.toml` with the declaration published
  with 0.2.0-beta.10, unchanged, and lock it again with native `mise lock`; the lock stays at
  version 3.
- Bind the repository family to the 0.2.0-beta.10 runtime through the locked console's
  `hook install`, keeping the 0.2.0-beta.9 runtime as the rollback.
- Declare the two received licenses as immutable carriers in
  `.config/checks/format-selection/policy.toml`, with `node-behavior` as the gate that validates
  their bytes, so the format selection leaves them as they are.
- Record the move and the carrier row under Changed in the Changelog's Unreleased section.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The publisher, its checks and its releases behave as before, so `.openspec.yaml` sets
`skip_specs: true`.

## Impact

`.config/mise/config.toml`, `.config/mise/mise.lock`, `.config/checks/format-selection/policy.toml`,
`CHANGELOG.md` and the repository-common runtime selection. The supply, the pipelines, the Mise
version of the hosted jobs and the declared peers stay as they are. `tasks.md` is the sole progress
ledger.
