## MODIFIED Requirements

### Requirement: Figure containment

No card, wire, relation label, tier label, boundary or boundary name SHALL be drawn outside its plate: its field
and, for a figure with tier labels, the label column beside it. A long relation SHALL run in a corridor or lane
inside the figure's content width; a candidate in which it has none is not composed.

#### Scenario: A corridor past the last column

- **WHEN** the only free gap for a long relation lies past the figure's last
  used column, outside its field
- **THEN** that candidate is rejected and the relation never runs off the page

#### Scenario: A boundary moved with its figure

- **WHEN** moving a figure to centre its ink would take its boundary past the plate's edge
- **THEN** the figure moves only as far as its boundary, out to the outer edge
  of its stroke, stays inside the plate
