## ADDED Requirements

### Requirement: Edition palette

A model MAY name the palette of its print edition in an optional `edition`
object. `palette` SHALL be one of `indigo`, `persimmon`, `soot` and `patina`,
or an object of `ground`, `ink`, a `dye` of three colours from new to old and
an optional `accent`, each a `#rrggbb` colour. The publisher SHALL refuse any
other value or field and name the nearest valid field. It SHALL refuse the
retired field `marks` with `model_field_retired` and say that it is to be
removed.

#### Scenario: A named palette

- **WHEN** a model sets `"edition": {"palette": "persimmon"}`
- **THEN** its print edition is drawn in the persimmon palette

#### Scenario: An unknown field

- **WHEN** a model's `edition` names `palettes`
- **THEN** the check refuses the model at `/edition/palettes` and suggests `palette`

#### Scenario: The retired field

- **WHEN** a model's `edition` names `marks`, with any value
- **THEN** the check refuses the model at `/edition/marks` with `model_field_retired` and says that every part is
  drawn as one card

## REMOVED Requirements

### Requirement: Edition marks and palette

**Reason**: A part is one card, so a model chooses no marks; the requirement "Edition palette" keeps what it said of
the palette.

**Migration**: Remove `edition.marks` from a model; `edition.palette` is unchanged.
