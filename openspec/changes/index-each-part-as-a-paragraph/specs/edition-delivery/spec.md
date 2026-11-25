## MODIFIED Requirements

### Requirement: Index

The edition SHALL end with an index: every component once, in the order of the names, as a short paragraph. Its
first line SHALL hold the name, the kind and the numbers of the plates that draw it, each a link to its plate and
set as a plate's number is set in the contents, in lines of equal length where more stand than beside the name.
Under it SHALL stand the details the model states, the relations each way with the other part's name a link to its
paragraph, and the paths the component claims.

#### Scenario: A part and its plates

- **WHEN** a component is drawn on plates 02 and 05 of an edition
- **THEN** the index holds its name once, followed by 02 and 05, each a link to that plate

#### Scenario: A part on many plates

- **WHEN** a component is drawn on seventeen plates and six numbers stand beside its name
- **THEN** its numbers stand in three lines of six, six and five

#### Scenario: A part's paragraph

- **WHEN** a component of a kind states two details, calls another component and claims a folder and a file
- **THEN** its paragraph holds the kind, both details, the call with the other's name a link to the other's
  paragraph, and both paths

### Requirement: Index pages

The index SHALL set its paragraphs in two columns, one in each half of the page, each whole in one column. A
longer index SHALL take a further page with its title and foot. A paragraph taller than a page's body SHALL be
refused with `edition_index_too_long`; a component's paths past the house's `indexPaths` SHALL be counted, not
listed.

#### Scenario: An index of two pages

- **WHEN** an edition's index holds forty-two parts with nothing but their names and plates
- **THEN** forty stand on its first page and two at the top of the left column of a second page, which has its
  title and foot
- **AND** the page count includes both

### Requirement: Index pitch

A part with nothing but its name and plates SHALL take one line, a twentieth of the body high in every edition;
the further lines of a paragraph SHALL stand at the text's pitch. The paragraphs SHALL stand in order from the top
of the left column, and none SHALL be opened up to fill a column or a page. A rule SHALL close each column, under
its last paragraph.

#### Scenario: Twenty-six parts

- **WHEN** an edition's index holds twenty-six parts with nothing but their names and plates
- **THEN** twenty stand in the left column and six at the top of the right, all at one pitch, with a rule under
  the last of each column

### Requirement: Links to cited files

Each card title on a plate SHALL link to its component's paragraph in the index. When the model's repository has a
browse template, declared or implied by its address, each path in a paragraph SHALL link to that template filled
with the pinned revision and the path. Without one, no path SHALL link.

#### Scenario: A browsable repository

- **WHEN** a model declares
  `browse: "https://github.com/o/r/blob/{revision}/{path}"` and a component owns
  `src/a.mjs`
- **THEN** that component's card title links to its paragraph in the index, and the path there links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`

#### Scenario: A GitHub address without a template

- **WHEN** a model declares `url: "https://github.com/o/r.git"` and no `browse`,
  and a component owns `src/a.mjs`
- **THEN** the path in its paragraph links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`
