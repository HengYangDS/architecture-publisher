## MODIFIED Requirements

### Requirement: Room for a view's summary

A view with a summary SHALL give up at least a fifth of the body's width: its
figure SHALL take 80 percent, at the type step that width allows, or 65 percent
when that keeps its step at 80 percent. When 80 percent adds crossings or route
defects, its figure SHALL keep the full width and its reading SHALL stand in the
plate's head.

#### Scenario: A wide view with a summary

- **WHEN** a view with a summary spans the whole body and keeps its wiring at
  80 percent
- **THEN** its plate's figure takes 80 percent of the body's width

### Requirement: Recorded plates

The manifest SHALL record each plate's number, view, figure width, whether its
reading was set beside it, above it or in its head (the value `omitted`), type
step, wrapping, row shape and centring; its measures: crossings, route defects, bends, empty
share and rectangle, blank band, hole share and centroid; and each balance gate
it misses.

#### Scenario: A plate in the manifest

- **WHEN** an edition is built
- **THEN** its manifest records every plate's composition and measures
