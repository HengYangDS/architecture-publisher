## Evidence and decision

The alpha.4 closeout retains two real raster_execution_timeout failures: an
installed example raster and a duplicate-font negative. Isolated reruns and a
later full native gate passed without changing bytes. The sampled installed
worker ran an intentional setInterval fixture from static-installed.test.mjs;
its idle event loop is not evidence of a production hang.

The concrete deadline gap is independent: spawnSync uses a termination signal
and waits for exit. A child handling that signal can keep the parent waiting.
Use a forced termination signal at this private, single-process raster boundary.
The worker contract has no child-process capability or graceful-shutdown state.
Do not change the 30-second limit, add retries or disable supply validation.

The Node child-process contract documents that spawnSync waits for full exit
after sending its timeout signal and that a handler can keep the child alive
(`https://nodejs.org/api/child_process.html`, read 2026-09-19). The installed
reproducer exceeded the 37-second caller bound before the change; the repaired
owner returned its timeout at approximately 30 seconds. This confirms the
signal-resistance defect, not the cause of the earlier intermittent stalls.

An initial combined regression subsequently timed out in an empty-stdout
fault-injection case. A bounded observed rerun passed all 77 installed/raster
checks, capturing worker identity and bytes before sampling. Its only slow worker
was the deliberately signal-resistant fixture. This bounds the confirmed repair
and leaves the intermittent startup/input/exit stall unresolved; neither successful
rerun nor an intentional fixture stack is presented as a root-cause diagnosis.

Read-only backup inspection on 2026-09-19 found no configured Time Machine
destination. The forge endpoint is reached through a tunnel, while the observed
local OrbStack VM uses a different address. This does not identify the forge's
physical host or backup medium. Independent disaster recovery therefore remains
unproved until the operator supplies the deployment/storage owner and a selected
off-host restore target. No backup destination or credential was changed.

## Verification

The installed fault-injection test first reads actual forwarded input, writes
its process identity into the test-owned output directory, handles SIGTERM, and
stays alive. A caller-owned test deadline and process-group cleanup bound RED
without leaking a hostile child. GREEN requires the original raster deadline,
the raster_execution_timeout classification, no PNG and no live child. Existing
valid rendering, malformed input/output, memory limits and portability tests
must remain intact.

## Qualification input ownership

Current alpha.3 source/atlas/static/browser bundles and older historical review
and 18-member static bundles serve different contracts. Explicitly select a
qualification profile before executing those tests. Missing optional material
is a reported coverage boundary, never a passed check or a reason to modify an
immutable release. The current release and historical preservation promises are
separate. No new progress ledger or competing artifact authority is introduced.

## Tranche continuation

After this independent repair, inspect the actual backup failure domain and
retain unresolved operator requirements. Continue source/constraint mechanism
research and a real ETHOS architecture change beyond refresh through authored
static/interactive views and recoverable candidate publication. Second adopter,
arbitrary layout, editor and ecosystem expansion remain later bounded stages.
