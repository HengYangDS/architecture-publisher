## MODIFIED Requirements

### Requirement: The model's vocabulary stated once

The patterns, enumerations and longest lengths a single model value is held to SHALL each be stated once: in the
model's schema, or for an enumeration a table of the source keys its data by, in that table, from which the schema is
written. The checks SHALL read each from that statement. The schema SHALL refuse every value the checks refuse by a
rule of that value alone, counting a length in code points where the checks count UTF-16 units. Rules across values
are the checks' alone.

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

#### Scenario: A track's name the schema refuses

- **WHEN** a stretch of the overview's course names a track with a NUL character
- **THEN** the publisher refuses the model at the stretch's tracks, as the schema does

### Requirement: The categories and ids of the model stated once

The model's categories and its default category SHALL be stated once, in the table of how each category looks, and
the model's schema SHALL be written from that table by a command. The form of the model's ids and the earlier
versions the publisher converts SHALL each be stated once in the publisher's code. The LikeC4 import SHALL make every
id from the model's id pattern, up to its longest length.

#### Scenario: A category without its look

- **WHEN** the schema's categories or default category differ from the table of looks
- **THEN** the check of generated inputs fails and names the schema

#### Scenario: Long LikeC4 names

- **WHEN** ten LikeC4 elements have names that differ only after the model's longest id
- **THEN** the first gets the longest id the pattern accepts, and each later one the same cut short for its suffix

## ADDED Requirements

### Requirement: The palettes and languages of the model stated once

The built-in palettes SHALL be stated once, in the house's tokens, and the languages a model may name with the
default language once, in the table of languages; the model's schema SHALL be written from them by a command. The
default palette SHALL be stated once, in the schema. Every table of words keyed by language SHALL hold exactly the
table's languages, in its order, and the publisher SHALL refuse to load one that does not.

#### Scenario: A schema that differs from the table of languages

- **WHEN** the schema's languages or default language differ from the table of languages
- **THEN** the check of generated inputs fails and names the schema

#### Scenario: Words for a language the table lacks

- **WHEN** a table of words holds a language the table of languages does not list, or lacks one it lists
- **THEN** the publisher refuses to load the table and names what it holds
