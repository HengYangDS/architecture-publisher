## Why

ETHOS and AIGW now exercise the same source, semantic, renderer and file-effect
owners, but two publication adapters still duplicate field and authorization
checks. The product also lacks one minimal repository skill and CI projection
that invoke the public contracts without becoming another workflow authority.

## What Changes

- Consolidate only exact-field and plan-bound authorization checks shared by the
  generic file publisher and the ETHOS qualified publisher.
- Record the demonstrated common pipeline and the boundaries that remain
  adopter-specific.
- Add one small, portable Skill that selects immutable inputs and invokes the
  existing `architecture` CLI.
- Add one GitLab CI projection that installs locked dependencies and runs the
  repository's existing syntax and behavior gates.
- Record a bounded implementation-level mechanism comparison with explicit
  adopt, reject and defer decisions.

## Capabilities

### New Capabilities

- `publication-contract`: shared validation and thin automation over the public
  architecture publication contract.

### Modified Capabilities

None.

## Impact

This closure adds no service, graph database, workflow engine, editor, new state
store or project-specific branch in generic code. OpenSpec remains intent, Git
remains source history, ETHOS remains the repository-governance authority, and
Skills/CI remain replaceable callers.
