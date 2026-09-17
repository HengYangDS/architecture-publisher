## ADDED Requirements

### Requirement: Exact artifact admission
The publisher SHALL consume caller-selected source, edition and output identities,
validate the complete actual payload and preserve the producer's schema without
fabricating legacy receipt files. File integrity SHALL NOT imply semantic,
visual, browser or publication acceptance.

#### Scenario: Current output without legacy sidecars
- **WHEN** a selected current atlas has its exact 13 HTML pages and required licenses
- **THEN** the reader returns verified payload identities without requiring a legacy publication directory or build receipts
- **AND** no artifact is modified and no acceptance is inferred

#### Scenario: Payload or identity drift
- **WHEN** a required member, source, edition, license or digest disagrees with selected inputs, or an undeclared/unsafe member is present
- **THEN** artifact admission fails before any installation effect

### Requirement: Qualification scope is preserved
The publisher SHALL require applicable semantic review and actual current browser
observations for every required page and state before qualified publication.
Historical review subjects SHALL remain unchanged; editorial continuity SHALL be
explicit and SHALL NOT transfer unrelated quality or browser approval.

#### Scenario: Missing or fabricated browser evidence
- **WHEN** current browser observations are absent, synthetic, stale or incomplete
- **THEN** qualified publication is rejected and delivery targets remain unchanged

### Requirement: Recoverable exact-target installation
The publisher SHALL reuse one file installer, install only the authorized payload
at explicit targets, preserve unrelated content and expose recoverable partial
completion without claiming cross-directory atomicity.

#### Scenario: Interrupted installation
- **WHEN** a process stops after one target has switched
- **THEN** recovery checks the retained plan and actual disk inventories and restores exact prestates or refuses an unknown state

### Requirement: Portable installed use
The installed publisher SHALL consume explicit input paths without developer-local
checkouts, implicit agent credentials or ETHOS as a generic runtime dependency.

#### Scenario: Relocated deployment
- **WHEN** selected source, edition and artifact inputs are relocated outside the original checkout
- **THEN** installed admission works with explicit inputs and retains the same rejection boundaries
