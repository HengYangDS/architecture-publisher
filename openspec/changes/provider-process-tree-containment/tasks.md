# Tasks

## 1. Falsify the Current Boundary

- [x] 1.1 Add a selected Provider fixture that starts an ordinary descendant with ignored stdio and a separate test-owned sentinel; verify the current timeout and valid-reply journeys leave the descendant alive while the sentinel remains untouched.
- [x] 1.2 Add failing Provider tests for stderr, malformed or oversized output, nonzero or abrupt worker exit, unavailable cleanup, and supervisor loss; verify each case distinguishes the original failure from cleanup and leaves no false passing receipt.

## 2. Converge One Owned Supervisor

- [x] 2.1 Replace the synchronous Provider execution with one bounded asynchronous worker/reply/cleanup protocol in `packages/publisher/src/provider/`; verify the focused success, timeout, error, output-limit, and self-watchdog regressions pass on the current POSIX host with no descendant or scratch residue.
- [x] 2.2 Admit the native Windows tree-termination path only while the selected worker root is present, with bounded system-tool resolution and fail-closed cleanup; verify the same focused regressions on an actual Windows host and preserve an unrelated sentinel.
- [x] 2.3 Preserve exact manifest, input, package, reply, deterministic-materialization, and Candidate identities; verify the existing Provider and Edition build suites plus the common declarative/executable conformance profile remain green without a second command surface.

## 3. Qualify the Shipped Boundary

- [x] 3.1 Pack the exact Publisher candidate and run the executable Provider from a relocated offline installation with empty configuration and no adjacent checkout; verify package and materialization identities plus native process and scratch cleanup after a rejected run.
- [x] 3.2 Record exact-HEAD native macOS, hosted Linux, and actual Windows observations for timeout, valid reply, rejected output, and unrelated-process preservation; verify raw platform results, restore the selected Windows VM to its prior stopped state, and leave Windows unqualified if that native journey cannot run.
- [x] 3.3 Run format, lint, checked contracts, dependency direction, dead-code, Markdown, strict OpenSpec, coverage, package, and complete repository proof gates on one frozen candidate; verify zero unapproved warnings and distinguish source proof from hosted and installed acceptance.

## 4. Release and Close

- [x] 4.1 Determine the SemVer successor and update the existing Changelog/release owner; verify historical signed tags and asset digests remain unchanged, and admit exact-media human review only for matching bytes or obtain a new review.
- [ ] 4.2 Land the proved Work Lane, publish the signed successor and selected assets, read back protected refs, package bytes, qualification, and installed use, then archive this Change when the native lifecycle admits the complete release evidence.
- [ ] 4.3 Hand off the exact selected package to ETHOS and AIGW without changing their source-owned acceptance; retire only owned disposable Work Lane, process, VM, and scratch state after verifying immutable evidence and foreign resources are preserved.
