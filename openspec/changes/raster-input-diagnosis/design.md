## Initial facts

The accepted worker reads JSON synchronously from stdin after static module
imports. The parent supplies a potentially large base64 payload through spawnSync.
A duplicate-font test, malformed-output fixtures and installed examples have
intermittently reached the deadline. Isolated reruns passed. At investigation entry, the timeout was not
yet attributable to font validation, startup, input transport or exit.

The prior hostile-worker regression proves only forced deadline enforcement.
Do not use its intentionally idle stack as evidence for the intermittent stall.

## Bounded investigation

Capture stage markers using an explicitly selected disposable diagnostic worker
in owned test space. Preserve the actual stdin bytes, worker identity and process
state on failure; do not log credentials or environment values. First exercise
the real duplicate-font case and size/fragmentation boundaries. Limit a probe
batch to a finite number of samples and one wall-clock deadline.

If an exact stage is identified, build a deterministic regression and repair the
existing owner. If not, preserve the uncertainty and improve stage observability
without claiming root cause. Different input transports or asynchronous execution
are alternatives to test, not predetermined fixes.

## Observed transport boundary

On 2026-09-19, the 730734-byte duplicate-font input timed out after module import
but before synchronous stdin consumption completed. The first bounded probe
failed on sample 53. A separate comparison reproduced three pipe timeouts in
123 samples, each at the same input boundary; 200 regular-descriptor samples
completed. These establish the local synchronous-pipe stall, not its underlying
Node/libuv/OS defect or a guarantee about every earlier timeout.

Complete a mode-0600 request in the existing private scratch directory and
inherit a read-only descriptor as stdin. Keep the worker protocol, supply checks,
30-second forced deadline and all artifact identities. No retry, worker argument,
new transport mode, dependency or fallback is added. Close the descriptor before
removing scratch, including failure paths. The installed regression checks that
stdin is regular, consumes the actual forwarded width, and observes EOF.

The old transport fails the deterministic descriptor regression; the repair
passes 77 installed/raster checks, including resistant-child termination and
malformed output. The regular-file comparison is diagnostic evidence, not a
replacement for product-level tests. The disposable diagnostic worker imports
the actual validator but not the complete production import/render graph. The
full product suite passed 483 tests with nine opt-in skips in 86.6 seconds;
syntax checks passed. The read-only independent review found no blocking defect;
it did not independently execute tests. Request permission/read-only assertions
are optional deferred test hardening, not independently observed guarantees.

Diagnostic files in `build/diagnosis/` bind the selected input, diagnostic worker,
executable and result hashes through `identity.json`. Identity capture followed
the probes; the owned inputs were unchanged. Pipe failures reached the two-second
probe limit three times in 123 samples; the 200 regular-file probes had no failure.
This finite comparison does not quantify a general production speedup.

## Campaign continuation

P0 also removes redundant evidence and repeated work only where dependencies are
complete. P1 demonstrates one real structural change family. P2 tests one actual
non-ETHOS adopter. P3 consolidates the demonstrated contracts; P4 adds only minimal
Skills/CI consumers of those contracts. A preserves reader/history authority,
C coordinates with the existing ETHOS owner, and D supplies bounded primary-source
mechanism evidence. No new editor, marketplace, resident service or universal
semantic/layout claim is in scope.

Keep source proof, installed behavior, independent review, reader acceptance,
remote publication and disaster recovery separate. GitLab physical host/storage
identity remains unknown; verify an independent restore before claiming disaster
recovery, and advance independent implementation while awaiting that fact.
