## REMOVED Requirements

### Requirement: Explicit source replay

**Reason**: ETHOS owns its exporter and source-specific execution contract.
Publisher has no active ETHOS importer; its generic Provider contract owns
explicit, bounded source execution without requiring a particular language.

**Migration**: Supply exact source files through `source-intake`, or explicitly
select a source-owned Provider through `edition-provider`. Retain source and
replay attribution without introducing a Publisher-owned ETHOS exporter.

### Requirement: Offline byte-bound source consumption

**Reason**: Exact portable source consumption already belongs to `source-intake`.
Keeping a source-named duplicate would create competing contract authority.

**Migration**: Use the generic source verifier and Edition build. Preserve exact
member identity, content bounds and the distinction between file integrity,
official source replay and semantic acceptance.
