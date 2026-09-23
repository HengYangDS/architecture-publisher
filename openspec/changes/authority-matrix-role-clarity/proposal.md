# Proposal

## Why

The Authority Matrix currently joins source-owned claim content and the generic
Claim Model schema in one owner cell. A source-product review found that this
could assign schema authority to an adopter or, conversely, imply Publisher
authority over accepted source meaning.

## What Changes

- Clarify the first Authority Matrix row in the canonical product contract:
  source products own accepted meaning and source-bound claim content; Publisher
  owns and validates the generic Claim Model schema.
- Preserve the source adapter's provenance and declared-loss obligation without
  changing any runtime contract, command, or release identity.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This corrects wording in the current contract; no specification-level
behavior changes.

## Impact

Only `docs/product-contract.md` and this Change are affected. Historical
proposals, packages, APIs, artifacts, and signed releases remain unchanged.
