## MODIFIED Requirements

### Requirement: Check without output

`archpub check` SHALL run validation, source binding, planning, poster
composition, the page's Archify checks and, for a model that states an
overview, the drawing of the overview and its checks, and SHALL report the
result without writing a delivery; what Archify and Typst measure is written to
a temporary directory and removed.

#### Scenario: Checking an oversized model

- **WHEN** a model with an oversized view is checked
- **THEN** the result reports the refusal for that view
- **AND** no file is written

#### Scenario: Checking an overview

- **WHEN** a model whose overview statement is too tall for the page at both spacings is checked
- **THEN** the result refuses with `overview_too_tall`
- **AND** no file is written

### Requirement: Print edition

The print edition SHALL be typeset by the bundled Typst with the house class: a
title page of the work's name, question and summary over a byline of its
release, editors, licence and publisher; contents whose entries link to their
pages, beside the edition's facts, scope, limits and a reading note; the
overview, when the model states one; and one plate per view. The facts SHALL
name the subject, repository, revision, files read, model digest, editors,
licence, typesetter and standards.

#### Scenario: The contents link to the plates

- **WHEN** a model with an overview statement and six views is built
- **THEN** its PDF holds nine pages
- **AND** each of the seven contents entries links to its page

### Requirement: Overview inputs in the manifest

When a delivery holds the overview, its manifest SHALL record the statement's
digest, the house class's digest, the house supply's digest and the Typst
version.

#### Scenario: The overview's inputs

- **WHEN** a model with an overview statement is built with the overview
- **THEN** its manifest records the statement's digest, the class's and the house supply's digests and Typst
  0.15.1
