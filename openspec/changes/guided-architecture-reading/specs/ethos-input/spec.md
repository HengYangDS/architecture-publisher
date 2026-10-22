## REMOVED Requirements

### Requirement: Explicit source replay

**Reason**: Source products are read-only material, not drawing integrations.
Source-specific preparation belongs to an external editor, while Publisher
accepts exact portable inputs through its generic intake contracts.

**Migration**: Supply pinned existing source files through `source-intake`, or
explicitly select an external editor's Provider through `edition-provider`.
Retain source and replay attribution outside ETHOS; add no drawing exporter,
files, dependency, configuration, tests or CI obligations to that source product.

### Requirement: Offline byte-bound source consumption

**Reason**: Exact portable source consumption already belongs to `source-intake`.
Keeping a source-named duplicate would create competing contract authority.

**Migration**: Use the generic source verifier and Edition build. Preserve exact
member identity, content bounds and the distinction between file integrity,
official source replay and semantic acceptance.
