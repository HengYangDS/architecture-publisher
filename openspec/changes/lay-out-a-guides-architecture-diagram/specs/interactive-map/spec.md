## ADDED Requirements

### Requirement: A guide's architecture diagram laid out by the publisher

A guide's architecture file that sets no layout, places no part and routes no
connection SHALL be laid out by the publisher at the build's quality: Archify's
own layouts, ranked, repaired and pinned as the generated page's diagrams are.
The page SHALL draw the chosen layout with the file's sources; the manifest
SHALL record the author's file. A file that places anything SHALL be drawn as
written.

#### Scenario: An architecture file without places

- **WHEN** a guide's architecture file states parts and connections and no position, size, row, column or layout
- **THEN** the page is built with the diagram the publisher chose, and the manifest records the author's file

#### Scenario: An architecture file that places its parts

- **WHEN** a guide's architecture file gives each part a position and a size
- **THEN** the page draws the file as written
