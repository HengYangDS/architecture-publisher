## ADDED Requirements

### Requirement: Required native CI execution

Each native CI job SHALL use locked, job-local tools and execute browser-backed
checks and the frozen Raster rebuild before the whole quality gate. Missing
supply SHALL fail required execution. The Raster manifest owns source identity;
CI uses its caller-provided Forge API and native job-token authentication.
Each platform retains separate evidence and all four coverage floors at 95
percent or higher.

#### Scenario: Required browser supply is missing

- **WHEN** CI has no accessible selected Chromium executable
- **THEN** the npm test preload refuses execution instead of skipping browser checks
- **AND** an explicit caller-selected executable is not silently replaced

#### Scenario: A native CI job qualifies rendering

- **WHEN** locked installation and source verification succeed
- **THEN** the job executes sandbox-enabled browser checks and the frozen Raster journey
- **AND** no privilege increase or skipped prerequisite counts as platform acceptance

### Requirement: Complete native-reader lifecycle evidence

Browser evidence SHALL bind exact HTML and observe selected native exploration,
page navigation, addressed reading, appearance and disposal. Native mechanisms
own their query, camera and finite-journey state. Missing observations SHALL
remain unproved; historical playback or Node results do not qualify a reader.

#### Scenario: An Edition offers complete figures

- **WHEN** no timed mechanism is selected
- **THEN** every page remains a complete manually navigable figure
- **AND** no legacy player obligation or load-time autoplay is inferred

#### Scenario: Native reading is superseded

- **WHEN** page navigation, history, Inspect or disposal supersedes active reading
- **THEN** the old frame cannot resume deferred work or grant destination autoplay
- **AND** selected source geometry remains unchanged

#### Scenario: An unrelated iframe message arrives

- **WHEN** a message has the wrong sender or page
- **THEN** it cannot navigate, inspect or change the selected reading state

### Requirement: Portable addressed reading

Native copy-link actions SHALL address the independent publication and its exact
page. The publication bridge SHALL restore native query state through the native
parser, without same-origin permission, a second query grammar or playback.

#### Scenario: A reader copies and opens a resolved Route

- **WHEN** the copied link opens the standalone HTML in a new window
- **THEN** the selected page and checked native Route are restored
- **AND** no `about:srcdoc` link or autoplay consent is delivered

#### Scenario: Browser navigation restores addressed reading

- **WHEN** a non-overview native query survives page navigation, Back, Forward,
  reload or cross-document return
- **THEN** the parent page and opaque query restore through the native parser
- **AND** each page switch contributes only one browser history entry
- **AND** rapid supersession cannot revive a disposed frame or grant autoplay

#### Scenario: Export is part of the selected query interaction

- **WHEN** a reader opens Export for a current Route or Reach query
- **THEN** the query remains selected and its native share action stays operable
- **AND** canonical export remains free of temporary reader state

#### Scenario: Clipboard policy denies an opaque reader

- **WHEN** the document's effective policy denies Clipboard API access
- **THEN** text links use the native fallback without calling the denied API
- **AND** image copying is unavailable without widening document permissions
- **AND** no permission-policy error is suppressed or treated as acceptance

### Requirement: Appearance and reading preserve visual acceptance

Every offered appearance SHALL retain semantic content, measured contrast,
keyboard focus and diagram/caption separation. Real desktop checks are separate
from source metadata and human judgment. Unobserved predicates stay unproved.

#### Scenario: Each qualified style and theme is exercised

- **WHEN** the exact reader is inspected across its offered appearances
- **THEN** labels, conditions, controls and selected content remain readable
- **AND** style changes preserve measured geometry

#### Scenario: Native controls consume reserved publication space

- **WHEN** native reader chrome reserves space inside a bounded desktop member
- **THEN** the complete canvas and controls remain inside its viewport
- **AND** native measured clearance prevents controls from covering artwork
- **AND** artwork whitespace excludes that declared control reservation
- **AND** camera and geometry remain owned by the native renderer

#### Scenario: Only an automated check passes

- **WHEN** geometry or structure passes without the required reading or visual review
- **THEN** the exact work remains unaccepted for those unobserved predicates
