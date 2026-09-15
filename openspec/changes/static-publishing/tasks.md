## 1. Explicit portable rasterization

- [ ] 1.1 Establish rejecting tests for closed input, SVG features, font resolution, limits and output preservation.
- [ ] 1.2 Package pinned renderer/parser/font-reader supply with exact identities and licenses.
- [x] 1.3 Implement bounded offline raster execution and a public plan-file CLI.
- [x] 1.4 Qualify installed real rendering and negative cases on macOS and isolated Linux.

Observed evidence: `build/evidence/raster-instance-context-red.txt` records
three genuine failures of instance-context font resolution; the repaired suite
is `raster-instance-context-green.txt`. Complete syntax and 165-test executions
are in `static-raster-macos.txt` and `static-raster-linux-qualified.txt`.
The latter includes installed static execution with no interactive/ETHOS code,
empty HOME/PATH, rejected supply drift and preserved concurrent output. The
isolated Linux suite uses Node 24.19.0 and reported no PID/memory-limit events.
The earlier Linux attempt hit the harness's 128 PID/thread ceiling, not the
raster heap limit; `static-linux-resource-failure.txt` preserves that failure.

1.1 stays open for stricter attribute-value support and actual execution-limit
stress coverage. 1.2 stays open for the transitive WASM license/source inventory;
the missing bundled tiny-inflate notice has been restored from exact upstream
source. Neither a green suite nor pinned bytes closes those remaining audits.

## 2. Static edition reconstruction

- [ ] 2.1 Migrate authored composition and geometry with provenance and source-bound tests.
- [ ] 2.2 Implement explicit measurement adapters and reproduce the complete original scene and accepted artifacts.
- [ ] 2.3 Qualify the portable static path and both non-ETHOS example journeys without implicit host dependencies.

## 3. Acceptance and preservation

- [ ] 3.1 Publish scoped reconstruction evidence without transferring acceptance to different pixels.
- [ ] 3.2 Complete native proof, accepted integration, publication and remote recovery.

The existing Workline A record owns browser qualification, pair installation,
crash recovery and full-project housekeeping. This Change does not replace that
owner or narrow those remaining requirements.
