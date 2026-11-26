## ADDED Requirements

### Requirement: The model's vocabulary stated once

The patterns, enumerations and longest lengths the publisher holds a single model value to SHALL be stated once, in
the model's schema, and its checks SHALL read them from there. The schema SHALL refuse every value those checks
refuse by a rule of that value alone, except that it counts a length in code points where the checks count UTF-16
units. Rules across values are the checks' alone.

#### Scenario: A pattern written again

- **WHEN** a module of the model unit other than the one that reads the schema writes one of the schema's patterns
  or longest lengths
- **THEN** the test suite fails and names the module

#### Scenario: A path the checks refuse

- **WHEN** a component claims `src//a.mjs`
- **THEN** the publisher refuses the model with `model_file_path_invalid`, and the schema refuses it too

#### Scenario: A model's id no file system can hold

- **WHEN** a model's id is `con`
- **THEN** the publisher refuses the model with `model_id_unportable`, and the schema refuses it too
