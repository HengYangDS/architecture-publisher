## MODIFIED Requirements

### Requirement: The pinned edition as data

Every delivery SHALL hold `<model id>.json` at its top, the pinned edition as data, with the members the data
reference states, in its order: `guide` only when the model names one and `overview` only when the build sets one.
The data reference's table of members SHALL be the format's statement of them, which the tests hold the data to. Its
`delivery` SHALL state the format and version the manifest states, and its `model` the file, digest, size, format
and version of the delivered model.

#### Scenario: The members

- **WHEN** a model with a guide and an overview is built with its checkout
- **THEN** the data holds every member the data reference states, in that order

#### Scenario: A build of the page alone

- **WHEN** a model is built with `--media page`
- **THEN** the data holds every statement, fact and row of evidence, an empty list of plates and no overview

#### Scenario: A member the data writes otherwise

- **WHEN** the data writes its members in an order or a set the data reference does not state
- **THEN** the test suite fails

### Requirement: A row of evidence

A row of the evidence table SHALL hold the keys the data reference states for it, in its order: the path; its
state, `verified` when the build read the path at the pin, else `unverified`; when verified, its SHA-256, size in
bytes and the UTC date of its last change at the pin; its owning component, if any; the ids of the relations that
cite it; and each range the guide cites in it, first and last line or none for a whole file, with the citation's
place. The table SHALL refuse nothing.

#### Scenario: A file owned and cited

- **WHEN** a component owns `src/model/load.mjs`, one relation cites it, and the guide cites its lines 10 to 20
- **THEN** the table holds that path once, with its digest, size, last change, the component as its owner, the
  relation's id and one range of lines 10 to 20 with the place of the guide's citation

#### Scenario: A build without a checkout

- **WHEN** a model is built without `--repo`
- **THEN** every row's state is `unverified` and no row holds a digest, a size or a date
