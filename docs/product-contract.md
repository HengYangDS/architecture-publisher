---
subject: architecture-publisher:product-contract
role: policy
state: canonical
relations:
  canonical_for: product meaning, inputs, outputs and quality boundaries
---

# Architecture Publisher product contract

## Product

Architecture Publisher draws the architecture of any repository from an
explicit model. The `archpub` command turns one Architecture Model into a
delivery: a static poster for each view, one interactive map of the whole model
and a manifest that binds every artifact to its inputs.

The model says what the architecture is: components, relations, their details
and the repository files that support them. Architecture Publisher owns how that
meaning becomes a clear figure: rows, placement, routing, typography and the
reading floor. It does not infer architecture from code, judge whether the model
is true or decide whether a figure is good enough to publish. The model's author
owns its meaning, and a named reviewer owns acceptance.

The product is general. Nothing in it is specific to one repository, language
or framework; the same rules apply to every model.

## Inputs

- One [Architecture Model](reference/model.md): a JSON file written by a person
  or an agent, or imported from a LikeC4 workspace with `archpub import likec4`.
- Optionally, a checkout of the described repository. With `--repo`, every
  declared source is read at the model's pinned revision through Git, without
  fetching, prompting or changing the checkout, and its digest is recorded.

The repository being described gains no files, dependencies or configuration.
A model may live anywhere, including in a separate publications repository.

## Processing

1. **Validate** the model against its schema and report every problem with its
   JSON path in one pass.
2. **Bind sources** at the pinned revision when a checkout is given.
3. **Plan views**: the declared views, or one view of every component when it
   fits, or an overview of the groups and one view per group.
4. **Lay out** each view as rows of equal cards on one column lattice, with an
   exact placement and routing that refuses any overlap.
5. **Compose** each poster and rasterize it; **map** the whole model through the
   vendored Archify.
6. **Deliver** the artifacts and the manifest into a new directory, staged and
   renamed into place only when complete.

The same model, sources and publisher version always produce the same bytes.

## Outputs

A delivery holds, for each view, the poster as SVG and as PNG at 1800 and 6000
px; the interactive map as one standalone `index.html`; and `manifest.json`. The
[operations reference](reference/operations.md#the-delivery) lists the manifest
fields.

The poster shows the title, the question and summary, the figure with each
component's icon and details and each relation's label and details, a one-line
legend and a footnote with the scope, limits, attribution and source revision.
The map shows every component and relation, one guided view per poster and
evidence cards with every detail, status, source path, digest and verification
state.

## Quality floor

- Posters are 1800 px wide and at most 1350 px high, and no text is smaller
  than 14 px. A view that does not fit is refused with its measured size; text
  is never shrunk and nothing is cropped.
- Cards in a view have one size and sit on shared row lines. Wires are
  horizontal and vertical only; no segment is shared by two relations, no wire
  crosses a card and no label touches a card, a label or another wire. A view
  that cannot meet this is refused with the relations concerned. Crossings the
  relations force are allowed and counted.
- The map's primary labels render at no less than 14 CSS px in a 1440 × 900
  window. Archify delivers the map at its showcase quality profile, or at
  standard quality when routes must cross or share a corridor and those are its
  only findings; the manifest records which, with the counts. The map draws
  every component and relation: a model whose map rows cannot be wired without
  an overlap is refused with the relations concerned.
- Archify, the fonts, the icons, the raster renderer and the LikeC4 parser are
  bundled unmodified with recorded digests.

## Acceptance and publication

A build establishes only that the delivery was produced from its inputs. A
reviewer accepts an unchanged delivery with `archpub accept`, which records the
reviewer and the manifest digest. `archpub publish` copies only an accepted
delivery to `<root>/<model id>/<version>/` and never replaces a different
published delivery. Tests and checks never stand in for that acceptance.

## Boundaries

- The publisher draws what the model states; it does not discover components,
  rank evidence or fill gaps.
- One model has at most five views, matching Archify's guided-view limit.
- The media are the poster and the map. Slides, PDF and mobile layouts are not
  produced.
- A build needs no network, account or credential. Publication copies files
  locally; uploading to a Forge or a website is the caller's own step.

## Evolution

The model format is versioned (`format` and `version`), and an unsupported
version is refused rather than reinterpreted. A change that refuses a model
another release accepted, or that changes the bytes of an existing delivery, is
a breaking release. Earlier releases and their deliveries stay as they were.
The [research pages](research/README.md) record how earlier releases were
designed; they are history, not this contract.
