## ADDED Requirements

### Requirement: Edition style and palette

A model MAY name its print edition's house style and palette in an optional
`edition` object. `style` SHALL be `bolts` or `cards`. `palette` SHALL be one of
`indigo`, `persimmon`, `ink` and `forest`, or an object of `ground`, `ink`, a
`dye` of three colours from new to old and an optional `accent`, each a
`#rrggbb` colour. The publisher SHALL refuse any other value or field and name
the nearest valid field.

#### Scenario: A named style and palette

- **WHEN** a model sets `"edition": {"style": "cards", "palette": "persimmon"}`
- **THEN** its print edition is set in cards with the persimmon palette

#### Scenario: An unknown field

- **WHEN** a model's `edition` names `pallete`
- **THEN** the check refuses the model at `/edition/pallete` and suggests `palette`

### Requirement: Custom palette contrast

The publisher SHALL refuse a custom palette with `model_palette_rejected`, naming the
role, its measure and the bound, unless the ground has OKLCH lightness at least
0.92 and chroma at most 0.02, the ink has WCAG contrast at least 7 against the
ground and chroma at most 0.05, and the accent has contrast at least 4.5 and
chroma at most 0.12.

#### Scenario: A grey ink

- **WHEN** a custom palette's ink is `#8a8a8a` on a white ground
- **THEN** the check refuses it with `model_palette_rejected` at `/edition/palette/ink`
  and reports its contrast and the bound 7

#### Scenario: The built-in palettes

- **WHEN** each built-in palette is checked by the custom palette rules
- **THEN** all four pass

### Requirement: Custom palette dyes

The publisher SHALL refuse a custom palette with `model_palette_rejected` unless each
dye step is at least 0.12 darker in OKLCH lightness than the one before, the
newest at least 0.07 below the ground and the oldest at WCAG contrast at least
4.5 against it, each step has chroma at most 0.08, and no colour of the palette
lies within 0.06 of the seal's cinnabar `#A93D31` in OKLab.

#### Scenario: A loud dye

- **WHEN** a custom palette's oldest dye is `#c00000`
- **THEN** the check refuses it with `model_palette_rejected` at `/edition/palette/dye/2`
  and reports its chroma and the bound 0.08
