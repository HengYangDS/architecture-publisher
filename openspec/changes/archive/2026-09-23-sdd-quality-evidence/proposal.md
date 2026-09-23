# Proposal

## Why

The canonical mechanism evaluation pins framework source and code-like line
counts, but its implementation-quality comparison is still too narrow to
support a defensible COMET-versus-ETHOS decision. Size and advertised features
cannot substitute for observed gate scope, product behavior, or failure limits.

## What Changes

- Add a concise, exact-revision comparison of COMET and ETHOS implementation
  quality signals to the existing mechanism evaluation.
- Distinguish source-declared gates from executed results and product-specific
  trust properties; retain the bounded adopt/reject decisions already recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is research evidence, not a product behavior change.

## Impact

Only `docs/research/mechanism-evaluation.md` and this Change are affected. No
runtime, dependency, public API, release asset, or historical signed tag changes.
