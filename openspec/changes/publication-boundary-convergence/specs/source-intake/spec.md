# Spec Delta

## MODIFIED Requirements

### Requirement: Compiler closure does not inherit declared dependencies

Selected upstream dependencies SHALL enter the lock with exact identities;
read methods remain evidence. Selected downstream compiler and renderer
supplies enter the Candidate only after consumer checks. Unobserved
dependencies remain limits. Unresolved or ambient compiler inputs SHALL fail
or make replay explicitly unqualified. Provider declarations alone do not
prove a complete read set or hermetic preparation. The generated lock is not
source-author-maintained truth.

#### Scenario: A Provider declares dependencies without observation

- **WHEN** an executable Provider returns a list that Publisher does not
  independently observe or confine
- **THEN** the receipt states that limitation
- **AND** reproducibility from the checked materialized output is not conflated
  with hermetic reproducibility of Provider preparation

### Requirement: Materialized dependency evidence is not overstated

The lock SHALL bind selected native, derived and Edition bytes, includes,
resources, adapter identity, media and toolchain profile, not later
consumption. Candidate SHALL bind checked, selected parser, backend, font,
renderer and Publisher implementation file sets. Package identity is execution
evidence, not Candidate input. Evidence SHALL
distinguish observed, checked-declared, declared-only, unresolved and ambient
facts; none proves hermetic Provider preparation or original-builder provenance.

#### Scenario: A native model imports another file

- **WHEN** the selected format's semantics depend on an included native file
- **THEN** the adapter resolves and binds that exact file or reports the
  unresolved dependency before a qualified Candidate
- **AND** the visible model is not called replayable from only its top-level
  file digest
