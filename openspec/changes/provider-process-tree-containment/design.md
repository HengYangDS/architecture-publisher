# Provider Process-Tree Containment Design

## Context

See [the proposal](proposal.md) for motivation. The current selected Provider
worker runs through `spawnSync` with `timeout` and `SIGKILL`. The direct worker
terminates, but a descendant can survive. The same runtime is present in the
immutable `v0.3.0-alpha.1` package. First-party ETHOS executes a source-owned
Provider; AIGW currently uses declarative delivery and does not execute one.

The Provider is exact-content selected and source-owned, not arbitrary hostile
code. Its child boundary is failure containment and portability, not an
adversarial operating-system sandbox. The correction must keep that distinction
visible rather than promising containment of deliberate process-group escape,
supervisor loss, or processes outside the selected worker tree.

## Goals / Non-Goals

### Goals

- One bounded owner supervises the selected worker through response and
  cleanup; no valid result is admitted before cleanup finishes.
- Ordinary descendants are reclaimed on success, failure, invalid output,
  output overflow, and timeout without touching an unrelated process.
- The existing Provider reply schema, semantic identities, and public command
  surface remain unchanged.
- Platform-specific behavior is tested on the actual supported host rather
  than inferred from a Linux run or a mock command.

### Non-Goals

- No OS sandbox, Job Object framework, daemon, background reaper, or second
  command plane.
- No automatic change to renderer processes or source-product governance.
- No claim that deliberately detached or reparented adversarial processes are
  contained after they leave the native worker group or tree.

## Decisions

### Keep the worker alive until its owner reclaims it

Replace the synchronous launch with a bounded asynchronous supervisor. The
worker emits one size-limited, newline-terminated internal envelope and stays
alive until the parent reclaims its process tree. The parent validates the
envelope only after cleanup, and accepts it only when both reply and cleanup
succeed. The public `architecture.edition-provider-reply/v1` remains unchanged.
An absolute reply deadline and a separate bounded cleanup deadline prevent
waiting indefinitely for either phase. The supervisor remains inside the
existing executable Provider owner. The worker also has a self-expiring
watchdog derived from those limits, so loss of the supervisor cannot leave the
tethered worker alive indefinitely. The watchdog does not prove descendant
cleanup after supervisor loss.

**Rejected:** keep `spawnSync` and call a tree walker after it times out. The
root is already dead, so descendants can be reparented before enumeration.
Node's proposed cross-platform `killTree` API remains open as of 2026-09-23
([nodejs/node#64406](https://github.com/nodejs/node/issues/64406)).

### Use native containment, not a broad process dependency

On macOS and Linux, launch the worker as a new process-group leader and signal
only that owned group. On Windows, keep the worker alive through reply handling
and invoke the platform's process-tree termination while the root identity is
still present. Resolve the system tool from the host's system directory rather
than the Provider's empty `PATH`; impose a separate deadline and observe its
exit. If native containment cannot be established, reject execution before
starting Provider code. If cleanup cannot be confirmed, report a failure, never
a passing materialization.

**Rejected:** adopt `tree-kill` 1.2.2 as the owner. Its Darwin/Linux strategy
walks `pgrep`/`ps` after the fact, which does not close the root-exit race; its
last observed source push was in 2020. The selected native operations are a
small adapter rather than an independent workflow or policy engine. Windows
`taskkill /T` has also been used in a merged pnpm repair
([pnpm/pnpm#12925](https://github.com/pnpm/pnpm/pull/12925)); that precedent
does not by itself prove this product's cleanup contract.

### Preserve precise admission and evidence

The existing output limit, empty user configuration, exact package digest,
input identity, deterministic materialization, and later-stage claim rejection
remain mandatory. The supervisor records the selected worker PID, platform
strategy, reply outcome, cleanup outcome, and elapsed bounds in its internal
diagnostic path. It does not place host PIDs or cleanup timing in Claim Model,
Edition, Scene, or Candidate identity. A cleanup failure is distinct from a
Provider reply failure; both prevent an accepted materialization receipt.

## Risks / Trade-offs

- **Windows root exits unexpectedly before cleanup:** a native tree walk may
  lose reparented descendants. The normal Worker protocol retains the root
  until reclamation; an unexpected root loss is reported as an unproved cleanup
  failure, not a passing result. Native regression tests must exercise this
  limit without claiming an OS sandbox.
- **A Provider deliberately escapes the worker group/tree:** out of scope for
  this source-owned, non-adversarial contract. Document the limit and fail
  closed when the observed owned tree cannot be reclaimed.
- **The supervisor disappears:** the worker's own deadline bounds its lifetime;
  orphaned descendants remain an explicit unproved limit rather than an
  implied recovery guarantee.
- **Cleanup command fails or hangs:** bound its own deadline, attempt only
  exact owned PID/group cleanup, preserve diagnostics, and reject success.
- **Additional runtime complexity:** retain one internal supervisor and no
  dependency or public protocol expansion. Remove the old synchronous path
  rather than keeping two execution engines.

## Verification and Release

First, add failing native tests that launch an actual descendant and an
unrelated sentinel. Cover valid reply, timeout, explicit error, malformed or
oversized output, unavailable cleanup, supervisor loss, and interruption. Assert descendants
are absent before a result returns, the sentinel survives, scratch is cleaned,
and original identity/output guards still fail correctly. Run focused tests,
the full quality graph, a packed offline installed Provider, and the common
conformance journey. macOS and Linux observations do not prove Windows: the
Windows case requires an actual Windows host or remains explicitly unqualified.

Freeze the accepted fix only after native platform evidence and human review.
If released, publish a new SemVer prerelease with exact package and remote
readback; do not rewrite `v0.3.0-alpha.1`. ETHOS and AIGW may select the new
package only through their own source-owned Changes, installed conformance,
and acceptance. Historical 0.2 and alpha releases remain byte-for-byte intact.
