## ADDED Requirements

### Requirement: The Skill's categories and palettes written from their sources

The agent Skill SHALL list the categories a kind maps to, by their ids, and the built-in palettes, by their Chinese
names and ids, in blocks a command writes from the model's schema and the house's tokens.

#### Scenario: A Skill that differs from its sources

- **WHEN** the Skill's list of the built-in palettes differs from what the command writes
- **THEN** the check of generated inputs fails and names the Skill
