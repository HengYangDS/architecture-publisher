## Why

The minimum independent-product contract includes explicit local installation
and recovery, but the public CLI currently exposes only ETHOS-qualified
publication. The generic file installer already exists. Remote source readers
also lack the complete current product design because its reference is local.

## What Changes

- Expose the existing file-pair planner, installer and recovery through a thin
  public CLI adapter, with explicit inputs and exact-plan authorization.
- Keep raw file installation distinct from ETHOS semantic qualification.
- Establish one current product-design document in this successor repository;
  preserve predecessor documents as historical rationale, not active authority.
- Verify installed non-ETHOS use, relocation, preservation and rejected inputs.

## Capabilities

### New Capabilities

- `file-publication`: explicit paired-file installation and recovery without
  an ETHOS runtime, edition, source adapter or credentials.

### Modified Capabilities

None. ETHOS-qualified publication continues to use the same file installer.

## Impact

Changes are limited to `src/cli/main.mjs`, `src/publication/input.mjs`,
`tests/file-publication-cli.test.mjs`, `tests/installed-cli.test.mjs`, `README.md`, `docs/product-design.md`,
`package.json` and the official artifacts for this change. No artwork, installer
algorithm, branch policy, release version or dependency is changed.
