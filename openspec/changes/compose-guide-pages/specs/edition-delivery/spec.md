## ADDED Requirements

### Requirement: Guide inputs in the manifest

When the page is a guide, the manifest SHALL record the draft's path and
digest, each staged file's name and digest, the writing level and whether the
guide's sources were verified at the revision.

#### Scenario: The guide's inputs

- **WHEN** a model with a guide is built with a checkout
- **THEN** its manifest records the draft's path and digest, each staged file,
  the writing level `strict` and the guide's sources as verified
