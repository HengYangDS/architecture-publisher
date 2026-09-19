## ADDED Requirements

### Requirement: Non-cooperative renderer termination

The rasterizer SHALL enforce its execution deadline even when its owned renderer
handles the default termination signal. It SHALL leave no live owned renderer,
successful PNG or incomplete scratch directory after the timeout is returned.

#### Scenario: Renderer handles the default termination signal

- **WHEN** an input-consuming renderer handles SIGTERM and exceeds its deadline
- **THEN** the parent forcibly terminates that renderer and returns the timeout error
- **AND** the requested output remains absent and temporary execution state is removed

#### Scenario: Renderer succeeds within the deadline

- **WHEN** the real renderer consumes valid selected input and exits successfully
- **THEN** the existing source, supply, pixel and non-overwrite checks still apply
- **AND** no implicit retry or weaker acceptance is introduced
