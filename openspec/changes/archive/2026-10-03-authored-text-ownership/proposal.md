# Preserve owned text in authored architecture scenes

## Why

The released Publisher rejects a measured label inside its own node as a
collision. The authored text contract cannot name its owner, so a source must
move labels outside nodes or retain private renderer patches. Both outcomes
defeat the minimal source-owned Provider migration.

## What Changes

- Add one optional node owner to the existing authored text contract.
- Validate owner identity, geometric containment and source-reference locality.
- Permit declared interior text while preserving every non-owner collision,
  route clearance, exact-font, scope and independent-media obligation.
- Exercise the installed public build with valid and adversarial scenes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `flagship-qualification`: declared interior text has a checked owner instead
  of an implicit collision exemption.

## Impact

The generic Publisher owns the schema and painting checks. ETHOS and AIGW
remain source/editor owners. Existing ownerless inputs and immutable releases
retain their byte identities. This Change adds no command, discovery root,
compatibility facade, mobile work or source-repository mutation.
