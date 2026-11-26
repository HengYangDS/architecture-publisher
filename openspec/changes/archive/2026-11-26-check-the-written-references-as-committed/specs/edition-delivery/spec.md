## ADDED Requirements

### Requirement: Generation writes no committed file

The repository's generation SHALL write only files the repository does not commit, so that every check of generated
inputs, a pipeline's and the proof's included, reads the committed reference tables and supply files as committed.

#### Scenario: A written file that differs from its source

- **WHEN** a commit holds a reference table or a LikeC4 supply manifest that differs from what its command writes
  from the committed source, and a pipeline generates and then checks
- **THEN** the generation or the check of generated inputs fails and names the file
