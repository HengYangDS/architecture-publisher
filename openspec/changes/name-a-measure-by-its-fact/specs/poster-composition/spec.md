## RENAMED Requirements

- FROM: `### Requirement: Strips sized by their code`
- TO: `### Requirement: Strips sized by their files`

## MODIFIED Requirements

### Requirement: Strips sized by their files

With `strip` marks, each part SHALL be drawn as its label, a strip and a
caption. The strip's length SHALL be proportional to the bytes of the files the
part owns, of any type, on one scale for the whole edition, at least 2 px for a
part with any bytes; every strip has one thickness. The strip's segments follow
the part's files in path order, each as wide as its file's share of the strip,
in the dye of its age band; a file too narrow to be drawn apart is drawn as one
segment with a neighbour of its band. A part that owns no files SHALL be a
short dashed outline. The key SHALL show a scale bar and say that the strip's
length is the size of the part's files.

#### Scenario: Shares of a strip

- **WHEN** a part owns two files of 3 KB and 1 KB
- **THEN** its strip has two segments of three quarters and one quarter of its
  length

#### Scenario: One scale

- **WHEN** one part owns 200 KB and another 20 KB in the same edition
- **THEN** the first strip is ten times as long as the second, on every plate

#### Scenario: Files of any type

- **WHEN** a part owns one Markdown file of 4 KB and another part one program
  file of 4 KB
- **THEN** their strips are equally long

#### Scenario: A file too narrow to draw apart

- **WHEN** a part owns a file whose share of the strip is narrower than a seam,
  beside a file of the same age band
- **THEN** the two are drawn as one segment, as wide as both shares
