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
delivery: static posters of its views on fixed 16:9 pages, one interactive page
that answers the model's question view by view, and a manifest that binds every
artifact to its inputs and keeps the evidence the drawings leave out.

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
3. **Plan views**: the declared views, at most four, or one view of every
   component when it fits, or an overview of the groups and one view per group.
4. **Lay out** each view as rows of equal cards on one column lattice, with an
   exact placement and routing that refuses any overlap.
5. **Compose** the views onto 2400 × 1350 px poster pages and rasterize them;
   **explain** the model on one page of the vendored Archify with one native
   diagram per view.
6. **Deliver** the artifacts and the manifest into a new directory, staged and
   renamed into place only when complete.

The same model, sources and publisher version always produce the same bytes.

## Outputs

A delivery holds each poster page as SVG and as PNG at 2400 and 6000 px; the
interactive page as one standalone `index.html`; and `manifest.json`. The
[operations reference](reference/operations.md#the-delivery) lists the manifest
fields.

A poster page holds one to three views. It shows the title, the question and
summary, each view's figure with each component's icon and details and each
relation's label and details, one legend of the kinds, boundary and statuses
present, and notes with the scope, limits, attribution, repository revision and
source verification state. It prints no digests, claim records or tables.

The page heads with the model's question and its summary as the conclusion.
Each view is a panel with its native Archify diagram, which opens Archify's
full interactive viewer, and one step per component with its first detail and,
when the model names its repository, its first source at the pinned revision.
The manifest keeps every detail, status, source path, digest and verification
state.

## Quality floor

- Every poster page is 2400 × 1350 px, and no text is smaller than 14 px. A
  page is composed so that its figure fills it: its largest empty area, fill
  and centre of mass are measured, and a page that no composition balances is
  printed with each gate it misses recorded in the manifest. A view that no page
  can lay out is refused; text is never shrunk and nothing is cropped.
- Cards in a view have one width, cards of a row one height, and all sit on
  shared row lines. Wires are
  horizontal and vertical only; no segment is shared by two relations, no wire
  crosses a card and no label touches a card, a label or another wire. A view
  that cannot meet this is refused with the relations concerned. Crossings the
  relations force are allowed and counted.
- Archify delivers the page at its showcase quality profile, and every view
  diagram passes Archify's showcase checks, or the build is refused with
  Archify's findings. In a 1440 × 900 window every preview fits its panel,
  primary labels render at no less than 13.25 CSS px in the previews and 14 CSS
  px in the full viewer. Each diagram draws every component and relation of its
  view, and the manifest records its route measures.
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
- One model has at most four views, the diagrams one Archify page holds.
- The media are the posters and the page. Slides, PDF and mobile layouts are
  not produced.
- A build needs no network, account or credential. Publication copies files
  locally; uploading to a Forge or a website is the caller's own step.

## Evolution

The model format is versioned (`format` and `version`), and an unsupported
version is refused rather than reinterpreted. A change that refuses a model
another release accepted, or that changes the bytes of an existing delivery, is
a breaking release. Earlier releases and their deliveries stay as they were.
The [research pages](research/README.md) record how earlier releases were
designed; they are history, not this contract.
