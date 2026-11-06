## MODIFIED Requirements

### Requirement: Header, legend and notes

Each poster SHALL lead with a title and question: the model's on the first
page; on a later page of one view, that view's, under the model's title when
the view has its own; on a later page of several views, the model's title
alone, each plate asking its own question. Each poster SHALL show one legend
of the kinds, the system boundary and the statuses present, and notes with the
scope, limits, repository and revision and editors, and SHALL NOT state
whether its files were verified.

#### Scenario: Evidence stays off the poster

- **WHEN** a build verifies the digest of every file the model cites
- **THEN** the poster's notes name the repository and its revision
- **AND** the poster prints no digest and no verification state

#### Scenario: A later page of one view

- **WHEN** the second page holds one view with its own title and question
- **THEN** it leads with them under the model's title

### Requirement: The publisher's words

The words the publisher sets itself, the notes' headings, the boundary and
status entries and the source and editor phrases, SHALL be in the model's
language, punctuated as that language punctuates details, lists and sentences.

#### Scenario: Notes in the model's language

- **WHEN** a model written in Simplified Chinese declares a scope and limits
- **THEN** its notes are headed 范围, 局限 and 来源
- **AND** their sentences end with the ideographic full stop

### Requirement: Portable deterministic output

Each poster SHALL be rendered as SVG whose text is converted to glyph outlines
and whose icons are inline paths, and delivered as PNG at 2400 px wide, or at
each width the build names up to 6000 px, rendered from that SVG by the vendored
renderer. The publisher SHALL NOT discover host fonts. Building the same model
with the same publisher version on one platform SHALL reproduce identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster is rendered on a machine without the bundled fonts
- **THEN** it renders the same glyphs because its SVG contains no font
  references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories on one platform
- **THEN** every PNG and the print edition in one equal the corresponding files
  in the other

### Requirement: Bundled faces

Text SHALL be set in the house faces, each text in the first face of its
role's chain that draws it whole: Source Sans 3, then Noto Sans CJK SC, for
text; Source Serif 4 Subhead, then Noto Sans CJK SC, for page and plate titles.
Colours SHALL be the house palette. A text in a right-to-left or shaped script,
or with a character no face draws, SHALL be refused.

#### Scenario: Letters the CJK face lacks

- **WHEN** a component label is `Łódź 数据`
- **THEN** `Łódź` is set in Source Sans 3, `数据` in Noto Sans CJK SC, and the
  build is not refused

#### Scenario: A title in the display face

- **WHEN** a poster sets a view's title
- **THEN** the title is set in Source Serif 4 Subhead

#### Scenario: An Arabic title

- **WHEN** a model's title is written in Arabic
- **THEN** the build refuses with `glyphs_missing` and the problem
  `script_unsupported` at `/title`

## ADDED Requirements

### Requirement: Edition plates

For the print edition, the engine SHALL compose each poster page's views for
the edition's body field, 2256 by 1101 poster pixels, with the same candidates,
gates and admission as a poster, and draw the figures alone: no title,
question, legend, notes or paper. It SHALL report each plate's size and the
legend entries of the kinds, boundary and statuses its figures show.

#### Scenario: A plate fits the body

- **WHEN** a model's edition plates are composed
- **THEN** each plate is at most 2256 px wide and 1101 px high
- **AND** its SVG draws no text of the page's title, question or notes

#### Scenario: The plate's legend

- **WHEN** a plate's figures show components of the kinds command and check
  inside the system boundary
- **THEN** its legend lists command, check and the boundary entry, and no kind
  it does not show
