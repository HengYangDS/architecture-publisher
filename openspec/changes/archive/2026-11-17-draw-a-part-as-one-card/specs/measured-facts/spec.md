## MODIFIED Requirements

### Requirement: Projections read the layer

The plates, the edition's record and the page SHALL take every measured fact they show from the layer and SHALL
measure none: a plate drawn from a layer whose values differ from the model and the binding SHALL show the layer's
values. No module under `src/poster`, `src/edition`, `src/map` or `src/overview` SHALL import `src/sources` or
`src/facts`, or define or call a measure the catalogue names.

#### Scenario: A false hub

- **WHEN** a plate is drawn from a layer that names as the view's hub a part only two relations end at
- **THEN** those two lines are drawn as lines into the hub, and the key names that part

#### Scenario: A false count

- **WHEN** a plate is drawn from a layer that holds 9 cited files for a relation whose model names none
- **THEN** that relation's line carries the number 9

#### Scenario: A false size

- **WHEN** a plate is drawn from a layer that holds 1000 bytes for a part whose files hold 100000
- **THEN** the part's strip and caption show 1000 bytes on the edition's scale

#### Scenario: A drawing module that measures

- **WHEN** a module under `src/poster` defines a function with the name of a measure in the catalogue, or imports
  a module of `src/sources`
- **THEN** the boundary test fails and names the module

#### Scenario: The page's first file

- **WHEN** the page is built with a checkout and a component owns files
- **THEN** the file the page cites for the component is the first owned file the layer holds for it
