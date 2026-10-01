## ADDED Requirements

### Requirement: Authored static description is separate from the visible subtitle

An authored static SVG SHALL expose the selected title as its accessible name
and an editor-authored description, when present, as its accessible description.
Without a selected description, the visible subtitle MAY remain the rendering
fallback but SHALL NOT alone establish accessibility acceptance for a complex
figure. The Edition editor owns the alternative's semantic adequacy; Publisher
SHALL escape and bind the selected text without inferring source meaning.

#### Scenario: A detailed source-owned static figure is published

- **WHEN** its Edition selects a distinct description of the causal relations and limits
- **THEN** the SVG exposes that text through `aria-describedby` separately from its title
- **AND** qualification still judges the exact artifact and does not infer accessible completeness from field presence

### Requirement: Graphic occurrences do not create semantic identities

An authored medium MAY bind one selected semantic member to several unique
graphic occurrences. Publisher SHALL retain the source-qualified identity,
derive every occurrence's assertion carriers, and check its source and directed
endpoints independently. Semantic completeness SHALL compare selected members,
not graphic counts. Duplicate graphic IDs, local references or conflicting
source facts SHALL fail. Repetition SHALL NOT assert new runtime instances.

#### Scenario: Separate Lane illustrations share one source contract

- **WHEN** two unique graphics reference the same selected Lane concept and relation
- **THEN** both source-bound occurrences are retained without copying the semantic member
- **AND** the result makes no claim about actual Lane instances or concurrency capacity

#### Scenario: A repeated connector reverses its source relation

- **WHEN** one graphic occurrence does not preserve the selected relation's directed endpoints
- **THEN** composition fails despite another valid occurrence of that relation

### Requirement: Static Claims retain visible and structural carriers

A static typed Claim SHALL retain nonempty visible-text carriers and structural
owners from its selected relation or scalar subject. Publisher SHALL preserve all
owning occurrences and reject missing structural ownership without a fallback.
Structural anchors SHALL NOT replace visible text or prove exhaustive Claim
painting. Non-Claim assertions SHALL retain their admitted representation.

#### Scenario: One Claim describes repeated structural occurrences

- **WHEN** several graphic occurrences carry a Claim's selected relation or subject
- **THEN** the Claim retains its visible text and every owning structural occurrence
- **AND** relation Claims bind connectors while scalar Claims bind subject nodes

#### Scenario: Claim text survives without its structural owner

- **WHEN** the Claim's visible text remains but its selected structural owner is absent
- **THEN** composition refuses the unbound Claim instead of using another owner

### Requirement: Aggregate connectors preserve each relation's role

Publisher SHALL classify each connector member as a directed crossing or
context within one endpoint node. Reverse, missing or ambiguous membership
SHALL fail, and a connector SHALL contain a directed crossing. Internal context
facts and Claim anchors SHALL belong to that node, not borrow arrow direction.

#### Scenario: One forward relation hides a reverse relation

- **WHEN** a forward connector binds both a request and its reverse response
- **THEN** both authored media reject the reversed member independently

#### Scenario: A connector carries valid internal context

- **WHEN** a directed crossing also selects relations internal to its endpoint nodes
- **THEN** crossing carriers bind the arrow and internal carriers bind their owning node
- **AND** a connector with only internal context is rejected

### Requirement: Inspection preserves one fact across repeated graphic sites

Interactive inspection SHALL expose the same selected reference at each bound
graphic site and page without creating a competing factual record. Publisher SHALL
reject duplicate reference/graphic pairs and any disagreement in source digest,
title or facts for one reference. Claim facts SHALL remain bound to their
selected subject or relation at every retained occurrence.

#### Scenario: Two graphic sites inspect one source member

- **WHEN** both sites carry one selected reference and identical fact content
- **THEN** each site exposes that fact with the same source identity

#### Scenario: A second site invents different facts

- **WHEN** the second record changes the same reference's digest, title or fact content
- **THEN** the HTML compositor rejects the conflict rather than selecting a primary record
