## Why

Two prior full-suite raster invocations exceeded their execution limit at
different operations. Scoped repeats passed; a captured slow worker belonged
to an intentionally hanging installed-test fixture and does not establish the
cause of either real timeout. The execution boundary must nevertheless enforce
its deadline even when a child handles the default termination signal.

## What Changes

- Reproduce and close the signal-resistant child deadline gap at the raster owner.
- Preserve real timeout evidence separately from intentional fault injection.
- Make current versus historical qualification input requirements explicit.
- Retain the existing deadline, output protections, installed portability and
  renderer bytes; do not assert an unproved cause for intermittent timeouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-publishing`: a renderer cannot defeat its execution deadline by handling
  the default termination signal; failure leaves no output or running owned child.

## Impact

Changes are confined to raster process admission, execution tests and existing
qualification guidance. No software upgrade, accepted-artwork change, hidden
retry, environment hardcoding or ETHOS source mutation. This is workline B of
the approved tranche; C feedback, D mechanism research and E1 real non-refresh
dual-medium evolution remain required subsequent work, not completed by this fix.
