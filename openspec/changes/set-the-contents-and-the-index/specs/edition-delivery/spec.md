## ADDED Requirements

### Requirement: Contents

The contents SHALL list the plates alone, one row a plate: its number, its title and its question, the whole row a
link to the plate, and no page number. Where the model states an overview, the left half of the first page SHALL
open with the overview's entry, its number, name and claim, a link to the overview's page. Under it SHALL stand the
scope, the limits and a reading note, each under a rule across the half.

#### Scenario: The overview's entry

- **WHEN** a model with an overview statement and six views is built
- **THEN** the contents hold six rows and the overview's entry, and each of the seven links to its page

#### Scenario: A row names no page

- **WHEN** the contents are set
- **THEN** a row holds its plate's number, title and question and no other number

### Requirement: Contents pages

A page of contents SHALL have two halves. The first page SHALL set its rows in the right half, and a further page
in both. A half SHALL take at most eleven rows, and the rows SHALL be shared out evenly over the halves, so that
every row of an edition's contents has one height. Every page of contents SHALL have the edition's foot, and where
the contents take more than one page each SHALL say which plates it lists.

#### Scenario: Eleven plates

- **WHEN** a model with eleven views is built
- **THEN** its contents take one page of eleven rows

#### Scenario: Twenty-eight plates

- **WHEN** a model with twenty-eight views is built
- **THEN** its contents take two pages of ten, ten and eight rows of one height
- **AND** the first page says it lists plates 01 to 10 of 28 and the second plates 11 to 28

### Requirement: A left half too tall

A first page of contents whose overview's entry, scope, limits and reading note are taller than the page's body
SHALL be refused with `edition_front_too_long`, with both heights.

#### Scenario: Limits that outgrow the page

- **WHEN** a model's limits are longer than the left half can hold beside its other blocks
- **THEN** the build refuses with `edition_front_too_long` and writes nothing

### Requirement: Index

The edition SHALL end with an index: every component once, in the order of the names, each followed by the numbers
of the plates that draw it and by nothing else. Every number SHALL be a link to its plate and be set as a plate's
number is set in the contents. A component on more plates than stand beside its name SHALL set them in lines of
equal length.

#### Scenario: A part and its plates

- **WHEN** a component is drawn on plates 02 and 05 of an edition
- **THEN** the index holds its name once, followed by 02 and 05, each a link to that plate

#### Scenario: A part on many plates

- **WHEN** a component is drawn on seventeen plates and six numbers stand beside its name
- **THEN** its numbers stand in three lines of six, six and five

### Requirement: Index order

The index SHALL compare two names word by word: a word in Latin letters or digits before any other, two words of
one script as the model's language sorts them, and a name that begins another before it.

#### Scenario: Latin words first

- **WHEN** an index holds a name of two Latin words and a name of the same first word followed by a Chinese word
- **THEN** the name of two Latin words stands first

### Requirement: Index pages

The index SHALL set its parts in two columns or in four, whichever sets them nearer 60 points apart, each column
taking its even share, and never closer than 26 points. A longer index SHALL take a further page of four columns
with its title and foot. A component whose plates' numbers take more lines than a page holds SHALL be refused with
`edition_index_too_long`.

#### Scenario: An index of two pages

- **WHEN** an edition's index needs more lines than four columns hold at 26 points
- **THEN** the index takes a second page with its title and foot, and the page count includes both

### Requirement: What the edition rests on

Under the last page of the index, on the line where a plate has its key, the edition SHALL state the repository by
the one address the model states, without its scheme and as a link, the number of files read, and the names of
the page and of the data. It SHALL state no acceptance and no digest there.

#### Scenario: Four facts

- **WHEN** an edition is built from a checkout of a model that states a repository's address
- **THEN** the last page states the address, the number of files read, the page and the data on one line

## MODIFIED Requirements

### Requirement: Print edition

The print edition SHALL be typeset by the bundled Typst with the house class: a title page of the work's name,
question and summary over a byline of its release, editors, licence and publisher; the contents; the overview,
when the model states one; one plate per view; and the index.

#### Scenario: The contents link to the plates

- **WHEN** a model with an overview statement and six views is built
- **THEN** its PDF holds ten pages
- **AND** the overview's entry and each of the six contents rows link to their pages

### Requirement: Columns fill their pages

On the title page, each column's blocks SHALL be spaced equally over the band the column occupies, so that no
column leaves its paper in one block. On the contents' first page, each block of the left half SHALL begin on a
line of the rows beside it where the blocks fit so, and share the height that is left equally where they do not.

#### Scenario: The contents' left column

- **WHEN** the contents' first page is set with rows of one height beside it
- **THEN** each block of its left half begins on a rule at the height of a row's rule

## REMOVED Requirements

### Requirement: Contents rows

**Reason**: Rows no longer continue at a fixed least height on a second page that leaves its left half empty; the
requirement "Contents pages" states how many rows a half takes and how the rows are shared.

**Migration**: None for a model. A reader of an edition's page count finds one page more, the index, and a second
page of contents from twelve plates on.
