## ADDED Requirements

### Requirement: A guide's figures as text

With a guide, the reader file SHALL write what each of the guide's figures says as text under the line that names
it, from the figure's document: its items in bold with what the figure writes beside them, each line between two
items under the one it leaves, an order the figure draws numbered, fields beside their entity or type, and dates
and spans as tables. A citation of a figure's item SHALL be a footnote.

#### Scenario: A figure of parts

- **WHEN** a model with a guide whose panel shows an architecture file of two parts and one connection is built
- **THEN** the reader file lists the two parts under the figure's line, the connection under the part it leaves

### Requirement: Steps that walk a figure stand with its items

Steps of the guide that each name a different item of one figure SHALL stand with those items, in the steps'
order, and SHALL NOT be written again on their own.

#### Scenario: Steps that walk a figure

- **WHEN** a guide's panel shows a figure and then steps, each naming one of its items
- **THEN** each item stands once, in the steps' order, with the step's words
