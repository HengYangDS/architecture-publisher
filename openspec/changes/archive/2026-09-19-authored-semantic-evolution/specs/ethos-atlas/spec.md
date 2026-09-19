## ADDED Requirements

### Requirement: Checked authored semantic edits

Candidate preparation SHALL apply only explicit edits to supported existing
visible sites, binding prior text, replacement text and exact semantic values.
It SHALL preserve the complete page set and accept only an explicit permutation
of the selected page order. It SHALL NOT infer prose equivalence or acceptance.

#### Scenario: A non-refresh condition receives explicit authored carriers

- **WHEN** a supported source condition changes and selected authored sites bind its exact value
- **THEN** candidate preparation retains complete views and emits the changed visible text
- **AND** new semantic and browser review remain required

#### Scenario: Authored input is stale or incomplete

- **WHEN** an edit has an unknown site, stale preimage, duplicate target, missing page or unrepresented semantic change
- **THEN** preparation fails without a successful candidate output manifest

#### Scenario: Meaning is owned by a canonical source document

- **WHEN** an existing imported source binding is selected with its exact document digest, verbatim excerpt and visible carrier IDs
- **THEN** preparation and rendering require matching actual source bytes and the selected excerpt
- **AND** the binding remains an authored interpretation, not a newly inferred graph condition or semantic acceptance
