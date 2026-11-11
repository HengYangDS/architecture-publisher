## ADDED Requirements

### Requirement: A checkout with nothing to read

When `--repo` names a checkout but no component claims a file and no relation
cites one, `check` and `build` SHALL warn with the code `repo_unused` that
nothing was read from the checkout, and record the sources as `none`.

#### Scenario: A model without claims checked against a checkout

- **WHEN** `archpub check model.json --repo <checkout>` runs on a model whose
  components claim no file
- **THEN** the result carries a `repo_unused` warning
- **AND** text output prints the warning on its own line
