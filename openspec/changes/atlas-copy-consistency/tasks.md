- [x] 1. Verify the thirteen-page subtitle inconsistency and retained Runtime semantics.
- [x] 2. Add a failing source-owned subtitle regression; correct the authoring bundle and exact expected identities.
- [x] 3. Rebuild all pages; prove only the two Runtime suffix occurrences changed.
- [x] 4. Preserve the standalone original, update its embedded Runtime page, and reverify every page/hash and unchanged static PNG.
- [ ] 5. Complete tests, exact-HEAD proof, scoped source publication and recovery; leave broader Workline A qualification open.

Evidence: `build/evidence/subtitle-red.txt`, `subtitle-green.txt`,
`subtitle-atlas-result.json`, `subtitle-correction-selection.json` and
`standalone-correction-result.json`. All thirteen regenerated pages passed their
native checks and matched the explicitly selected identities. Runtime changed
only its subtitle and matching SVG description; the other twelve pages and
standalone shared blocks/navigation stayed byte-identical.

The explicit Documents standalone changed from SHA-256
`78770a39dc4a6f4f513e3722309139ae5999427781625524feabe6e229c1df5c`
to `e37b834d44f20cbf30f769f9baf4f3139b9eb6b0f524a1e7e0187ca0798d4a70`.
The original is preserved under the workstation backup root's
`runtime-subtitle-correction/ETHOS-architecture.before.html`, with a recovery
record. All thirteen embedded pages were re-read and compared with generated
outputs. The 6000 PNG retained
`efb8cb02a80bbed3a244921abebde98ce43fd3b25151e2d24453c83d955ec839`.
No new browser execution or full paired installation is claimed.
