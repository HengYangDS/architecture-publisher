## RENAMED Requirements

- FROM: `### Requirement: Strips sized by their code`
- TO: `### Requirement: Strips sized by their files`

## MODIFIED Requirements

### Requirement: Strips sized by their files

With `strip` marks, each part SHALL be drawn as its label, a strip and a
caption. The strip's length SHALL be proportional to the bytes of the files the
part owns, of any type, on one scale for the whole edition, at least 2 px for a
part with any bytes; every strip has one thickness. Each owned file is a
segment in path order, as wide as its share of the strip, in the dye of its age
band. A part that owns no files SHALL be a short dashed outline. The key SHALL
show a scale bar.

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

## ADDED Requirements

### Requirement: Narrow files of a strip

A file whose segment would be narrower than a seam SHALL be drawn as one
segment with a neighbouring file of its age band, as wide as both shares, so
that a strip's segments follow its part's files and a segment may stand for
more than one.

#### Scenario: A sliver beside a file of its band

- **WHEN** a part owns a file of 9 KB and one of 10 bytes in the same age band
- **THEN** its strip draws the two as one segment
