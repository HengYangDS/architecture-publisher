# Spec Delta

## ADDED Requirements

### Requirement: Successor executable materialization requires an invoker choice

An executable Provider named by a successor Build Request SHALL NOT run until
the invoker separately selects the exact Provider ID and manifest digest for
that invocation. The request and Provider manifest cannot authorize their own
code execution. Missing, extra, or changed choices SHALL fail before Provider
code runs. Direct and declarative inputs SHALL work with an empty choice.
This requirement does not reinterpret historical released v1 input semantics.

#### Scenario: A selected manifest cannot execute itself

- **WHEN** a successor Build Request names an executable Provider but the
  invoker supplies no separate exact execution choice
- **THEN** build and materialization fail before Provider code runs
- **AND** a fresh Candidate is not emitted

#### Scenario: The invoker selects the exact executable set

- **WHEN** the invoker supplies every selected executable Provider as one
  exact `id@manifestSha256` pair, with no missing or extra pair
- **THEN** the existing bounded Provider path may execute
- **AND** the choice grants no source truth, filesystem sandbox, Candidate
  qualification, or publication authority

#### Scenario: Declarative materialization remains inert

- **WHEN** a request selects only direct or declarative inputs and the invoker
  supplies no executable choice
- **THEN** the ordinary build succeeds without executing adopter code

## MODIFIED Requirements

### Requirement: Provider feedback and retirement preserve role authority

Publisher MAY return input, coverage, ambiguity, or output findings. Each
finding SHALL bind its exact selected subject, predicate, responsible role,
and known owner; unknown ownership SHALL be explicit. Findings are local and
non-authorizing. Publisher SHALL NOT infer recipients from paths, dispatch,
create issues, edit source, or own feedback. The invoker controls handoff;
only the affected owner controls adoption. Provider retirement requires
explicit incumbent-owner approval.

#### Scenario: Publisher finds an uncovered claim

- **WHEN** input preparation or Edition validation finds missing or ambiguous
  source-bound meaning
- **THEN** any feedback finding returned to the invoker names the exact selected
  source assertion and predicate, plus its claimant or responsible adapter
  owner where declared
- **AND** unresolved ownership is stated rather than inferred from a path
- **AND** Publisher neither dispatches the finding nor edits or accepts a
  replacement for that owner

#### Scenario: Provider migration reaches parity

- **WHEN** a replacement Provider passes common conformance and every selected
  consumer journey yields either identical Candidate digests or an explicitly
  reviewed semantic successor
- **AND** the incumbent owner explicitly approves the exact successor under
  its selected acceptance policy
- **THEN** the incumbent mutable form may be retired by its owner, never by
  Publisher conformance itself
- **AND** historical receipts remain immutable under selected custody rather
  than becoming a second live input authority

#### Scenario: An Edition has no source-repository editor

- **WHEN** an independent editor selects valid source claims but an omission or
  visual choice is ambiguous
- **THEN** any finding is returned to the invoker with the named Edition editor
  identified as the responsible role for an optional invoker-controlled handoff
- **AND** the source owner is not made responsible for the editor's decision
