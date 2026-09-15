## 1. Integration boundary

- [x] 1.1 Add rejecting tests for offline source binding and explicit importer trust inputs.
- [x] 1.2 Implement safe closed-bundle writing, offline ETHOS consumption and opt-in exporter replay.
- [x] 1.3 Verify installed CLI separation and unchanged generic input behavior.

## 2. Real accepted input

- [x] 2.1 Import source 8f2e829 and prove whole-projection equivalence to both accepted media inputs.
- [x] 2.2 Verify the real bundle offline on macOS and Linux with source tooling unavailable.
- [x] 2.3 Preserve/download the exact input and evidence.
- [x] 2.4 Prove, integrate and publish the source change through ETHOS.

This task list owns only this integration slice. Full renderer migration and
Workline A completion remain in the existing project execution record.

Evidence: GitLab project 1323, package 123, `ethos-architecture-source`, version
`58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0`.
The downloaded archive restored all 22 members and matched both accepted
projections in full. `assurance-manifest.json` binds the source and observations;
its SHA-256 is `251027df26521b2672576ea2350b281923b6d36b0d4e6b18b99680743b542cc2`.
Implementation commit `67e2db9ad2ee25a9c9013916e090912c1e9002a2` passed
exact-HEAD proof, native candidate/accepted integration and receipt-bound dev
publication. A fresh remote clone passed strict fsck, all 35 tracked file
hashes/modes, 69 tests and syntax checks. This does not close Workline A.
