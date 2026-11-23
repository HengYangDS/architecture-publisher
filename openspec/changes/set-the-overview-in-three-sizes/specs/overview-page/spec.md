## ADDED Requirements

### Requirement: Three sizes with fixed roles

Below its claim, which stands at the title's size as every page's title does,
the overview page SHALL set its text in three sizes with fixed roles, at either
spacing: step names and block titles at the head's size, to read across a room;
names, notes, texts and items at the text's size, to read on a screen; labels,
track names and plate numbers at the small size, to read when zoomed.

#### Scenario: A page set at the closer spacing

- **WHEN** a statement fits its page only at the closer spacing
- **THEN** its notes, texts and items stand at the text's size, and the page sets no size but the title's, the head's, the text's and the small one

## MODIFIED Requirements

### Requirement: An overview too tall for its page

The page SHALL be laid out at the house's spacing, and at a closer one, with
narrower gaps at the same sizes, when the first reaches below the foot. A page
that fits at neither SHALL be refused with `overview_too_tall`, naming the
first block that does not fit.

#### Scenario: Too much for one page

- **WHEN** a statement holds more lists than the page can hold below its course at the closer spacing
- **THEN** the build refuses with `overview_too_tall` and names the first list that does not fit

#### Scenario: A page that fits only closer

- **WHEN** a statement's blocks reach below the foot at the house's spacing and not at the closer one
- **THEN** the page is set at the closer spacing, its items closer together and its sizes unchanged

### Requirement: Texts on one module and one grid of baselines

Every name, note, term, cell and text of the overview SHALL begin a whole
number of 8 point modules from the left margin, and a text justified to its
column SHALL end at one. Under a block's top and under a course's names, every
step down to a baseline SHALL be a whole number of half lines of the text's
pitch, and a name on two lines SHALL keep the pitch of the notes beside it.

#### Scenario: Two left edges that nearly meet

- **WHEN** a list's text and a station's name in another row would begin within three points of each other by their measured widths
- **THEN** both begin on the module: at one edge, or eight points apart or more

#### Scenario: Two headed texts beside a list

- **WHEN** two headed texts stand one under another beside a list of four items
- **THEN** each text's baseline is a baseline of the list's rows, or stands half a line or more off them
