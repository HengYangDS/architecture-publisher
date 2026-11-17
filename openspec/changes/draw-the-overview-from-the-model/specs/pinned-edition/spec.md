## MODIFIED Requirements

### Requirement: A plate's record

For each plate the data SHALL hold its number, its views, its images with their widths, the frame of its figure on
its page in points with the scale of the figure's drawing space in pixels per point, each scale a property is
drawn on, and its face. It SHALL hold the plate's page in the print edition, counted from 1, only when the edition
was typeset. For an overview the data SHALL hold its statement's SHA-256 and its images and SHALL hold no face.

#### Scenario: A box on an image

- **WHEN** a reader scales a face's box by the frame and by an image's width over the page's width of 1600 points
- **THEN** the rectangle lies on that part in the image

#### Scenario: A check

- **WHEN** `archpub check` composes a plate without typesetting the edition
- **THEN** the plate's face is compared as in a build, and no page is reported for it

#### Scenario: The overview's page

- **WHEN** a model states an overview and its edition is built
- **THEN** the data holds the statement's SHA-256 and the overview's images, and no face for it
