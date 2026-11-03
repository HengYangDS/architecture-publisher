## MODIFIED Requirements

### Requirement: Native Archify explainer

The interactive delivery SHALL be one standalone HTML page produced by the
vendored, unmodified Archify from an explainer draft: the work's guide when its
model names one, otherwise a draft and one architecture document per view that
the publisher writes. The publisher SHALL NOT patch Archify, replace its fonts,
routing or reader, or post-process its output.

#### Scenario: An unmodified renderer

- **WHEN** a page is delivered
- **THEN** the Archify supply's digest matches its recorded release archive

## ADDED Requirements

### Requirement: The guide as the page

When a model names a guide, the page SHALL be the guide: its draft and the files
its `@diagram source=`, `@chart data=` and `@image path=` arguments name, staged
from the draft's directory. A named file that is a link, lies outside that
directory or is missing SHALL be refused, and so SHALL a draft whose `@meta`
names a repository or revision other than the model's. Archify's writing checks
SHALL be strict at the showcase quality and warnings at the standard quality.

#### Scenario: A guide with a sequence

- **WHEN** a model names a guide whose draft draws a sequence and cites a
  repository file
- **THEN** the page is that guide, delivered as `index.html`

#### Scenario: A draft for another revision

- **WHEN** a guide's `@meta` names a revision other than the model's
- **THEN** the build refuses with `guide_repository_mismatch` and writes nothing

### Requirement: Guide sources at the revision

With a repository checkout, the publisher SHALL hand Archify a temporary clone
that shares the checkout's objects, whose `origin` is the model's repository
URL and whose `HEAD` is the model's revision, so that Archify verifies every
repository source and line range the guide cites and pins its code excerpts.
The checkout SHALL NOT change. Without a checkout the guide's sources SHALL be
recorded as declared.

#### Scenario: A cited line range

- **WHEN** a guide cites lines of a file at the model's revision and the build is
  given a checkout
- **THEN** the page shows those lines from that commit and the checkout is
  unchanged

### Requirement: Guide scaffold

`archpub scaffold guide <model.json> --out <directory>` SHALL write the page the
publisher generates for the model as a guide, its draft and one architecture
document per view, into a new directory. An existing directory SHALL be
refused.

#### Scenario: A scaffold that builds

- **WHEN** a model whose prose passes Archify's writing checks names its scaffold
  as its guide
- **THEN** the guide builds, and the page is that draft
