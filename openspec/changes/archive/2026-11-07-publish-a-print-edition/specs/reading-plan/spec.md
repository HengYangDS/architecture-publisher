## MODIFIED Requirements

### Requirement: Automatic single view

Without declared views, the publisher SHALL derive the plan deterministically
and SHALL use one flow view of all components when that view is admitted.

#### Scenario: A small model

- **WHEN** a model without views has eight components that fit one plate
- **THEN** the plan has one view containing all of them

### Requirement: Named view refusals

A view whose admission is refused SHALL be refused with its id, and the
refusal's problems SHALL be listed under that view's path. Admission SHALL
report every view it refuses, under the code of the first.

#### Scenario: Two refused views

- **WHEN** the second and third of three declared views cannot be laid out in
  the edition's body
- **THEN** the refusal has the code `plate_unfittable` and names the second
  view
- **AND** its problems list each view's `plate_unfittable` problem once, under
  `/views/<id>`

## REMOVED Requirements

### Requirement: Poster admission

**Reason**: Views are admitted as plates of the print edition, not as poster
pages.

**Migration**: See Plate admission.

## ADDED Requirements

### Requirement: Plate admission

A view SHALL be admitted when some candidate composition lays it out alone in
the print edition's body field with no text smaller than 14 px. Admission SHALL
try the finite candidate compositions and no other parameters. A view no
candidate lays out SHALL be refused with `plate_unfittable` and its id. The
publisher SHALL NOT shrink text, crop or change the format.

#### Scenario: An oversized view

- **WHEN** a declared view's cards cannot be laid out at 14 px in any candidate
  composition
- **THEN** the build refuses with `plate_unfittable` and that view's id

#### Scenario: A deterministic plan

- **WHEN** the same model is checked twice with the same publisher version
- **THEN** both results report identical views and compositions
