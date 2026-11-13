## MODIFIED Requirements

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key
SHALL be one line of what its figure shows and no more, its baseline at 850
points on every plate and each mark centred on its label's mid-line: with
cards, the kinds, boundary and statuses; with strips, the age bands and the
pin's date, the scale bar, the citation ticks, the hub, the boundary and the
statuses.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists command, check and the boundary on one line above the
  foot, and no kind it does not show

#### Scenario: A strip plate's key

- **WHEN** a strip plate shows files in all three bands and relations that cite
  files and no hub
- **THEN** its key names the three bands, the pin's date, the scale bar and the
  ticks, and no hub

#### Scenario: Marks of different heights

- **WHEN** a strip plate's key holds a band, a sample strip, ticks, a hub's line
  and a boundary's outline
- **THEN** each is centred on the same line as the labels' text, and the text
  stands where a card plate's key sets its own
