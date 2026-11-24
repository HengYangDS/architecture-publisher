## MODIFIED Requirements

### Requirement: Plates named on the overview

A step, a station, a branch, a spur or a block of the statement MAY name, in
`view`, the view that enlarges it; a view the model does not declare SHALL be
refused with `model_reference_unknown` at its path. The page SHALL set that
view's plate number after the name, and in the edition as a link to the
plate's page. An edition that sets a stated overview SHALL refuse with
`overview_view_unreached`, before it plans the views, naming the path of every
view that nothing on the overview names.

#### Scenario: A block names its view

- **WHEN** a block names a view that the edition sets on plate 05
- **THEN** `05` follows the block's title, and in the edition links to that page

#### Scenario: A view the overview does not reach

- **WHEN** a model declares a view that no point or block of its overview names, and the edition is checked or built
- **THEN** the work is refused with `overview_view_unreached`, naming that view's path

#### Scenario: The page alone

- **WHEN** the same model is checked for the page alone
- **THEN** nothing is refused for the view the overview does not reach
