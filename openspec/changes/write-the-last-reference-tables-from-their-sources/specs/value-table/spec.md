## MODIFIED Requirements

### Requirement: One table of line values

The product SHALL hold the weights, patterns and marks of a plate's lines in one table inside the product, keyed by
what each row means. A row SHALL state its meaning, its value in the plate's drawing space, from which its channel
follows, the figure-reading question it answers, whether a work has tested it, and what the page does for it. The
figure and the key SHALL take every such value from the table, and a model SHALL NOT name, add or change a row.

#### Scenario: A value changed in the table

- **WHEN** the table gives the system boundary another gap
- **THEN** a plate's boundary and the key's sample of it are drawn with that gap
- **AND** the check of generated inputs fails until the documents' reference table is written again

#### Scenario: A model names a line value

- **WHEN** a model's `edition` names a line weight or pattern
- **THEN** the check refuses the model at that field

#### Scenario: A row the page cannot express

- **WHEN** the table's row for emphasis says the page has no expression of it
- **THEN** the reference table says so, and no check refuses a model or a build for it

### Requirement: Rows admitted by trial

The table SHALL hold these rows and no other: a relation, a continuous line of one weight; emphasis, twice that
weight with an arrowhead 1.45 times as large, for a relation into the view's hub; the system boundary, dashed as the
trial measured it; the number of files a relation cites; and the patterns of a planned and of a retired part or
relation, each marked as not yet tested by a work. A command SHALL write the documents' reference table from the
table, with every row and that mark.

#### Scenario: The reference table

- **WHEN** the documents' reference table of lines differs from what the command writes from the table
- **THEN** the check of generated inputs fails and names the document

#### Scenario: A row no work has tested

- **WHEN** the reference table lists the pattern of a planned relation
- **THEN** the line says that no work has tested it
