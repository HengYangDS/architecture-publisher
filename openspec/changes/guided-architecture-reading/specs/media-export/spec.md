## ADDED Requirements

### Requirement: Independent vector document and presentation media

Publisher SHALL admit PDF and PPTX through the existing build and Candidate
boundary. Each medium SHALL preserve selected semantic identities and own its
page composition and qualification. HTML screenshots SHALL NOT define static
art direction or substitute for vector document delivery.

#### Scenario: An editor requests document and presentation output

- **WHEN** the same source-bound Edition requests PDF and PPTX
- **THEN** each page or slide contains a complete figure answering its question
- **AND** both media retain explicit attribution, omissions and source identity
- **AND** neither output requires a new source-repository runtime or command plane

### Requirement: Portable vector and editability evidence

PDF qualification SHALL observe vector text or paths rather than a raster-only
container. PPTX qualification SHALL distinguish a valid deck from editable
diagram objects and claim only demonstrated editability. Fonts or verified
outlines SHALL remain portable under installed offline execution.

#### Scenario: A purported vector PDF contains only a PNG

- **WHEN** a delivered PDF embeds a raster image without diagram vector objects
- **THEN** vector qualification fails even if the file opens successfully

#### Scenario: A slide contains both editable objects and an image

- **WHEN** a deck qualifies only some diagram objects as editable
- **THEN** its evidence identifies that exact scope without claiming full editability
- **AND** installed native opening and page readability are independently observed

### Requirement: Common installed multipage conformance

The same installed public build SHALL produce a complete multipage self-Edition
and an unrelated conformance Edition in PDF and PPTX. Qualification SHALL bind
exact inputs, output hashes, page coverage and medium-specific observations;
export success alone SHALL NOT establish semantic or aesthetic acceptance.

#### Scenario: Unrelated source inputs are relocated offline

- **WHEN** the selected inputs and installed package move to a clean offline root
- **THEN** PDF and PPTX generation requires no Agent, adjacent source checkout or local hardcoding
- **AND** all selected questions retain complete figures and exact source binding
