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
or framework, and nothing in it names where a delivery goes: the caller chooses
the media, their sizes and quality and the directory a delivery is published
to. The same rules apply to every model, in any of the languages its page
speaks: English, Simplified and Traditional Chinese, Spanish and Korean.

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
4. **Lay out** each view as rows of cards on one column lattice, as wide as
   their text on posters, with an exact placement and routing that never draws
   an overlap.
5. **Compose** the views onto 2400 × 1350 px poster pages and rasterize them;
   **explain** the model on one page of the vendored Archify with one native
   diagram per view.
6. **Deliver** the artifacts and the manifest into a new directory, staged and
   renamed into place only when complete.

The same model, sources and publisher version produce the same bytes on one
platform.

## Outputs

A delivery holds each poster page as `page-<n>.svg` and as PNG at 2400 px or
the widths the caller names; the interactive page as one standalone
`index.html`; and `manifest.json`. A build may deliver the posters or the page
alone. The [operations reference](reference/operations.md#the-delivery) lists
the manifest fields.

A poster page holds one to three views. It shows the title, the question and
summary, each view's figure with each component's icon and details and each
relation's label and details, one legend of the kinds, boundary and statuses
present, and notes with the scope, limits, attribution and the repository and
revision. It prints no digests, verification states, claim records or tables.
The words the publisher sets itself are in the model's language.

The page heads with the model's question and its summary as the conclusion,
beside the list of its panels. Each view is a panel with its native Archify
diagram, which opens Archify's full interactive viewer, and one step per
component with every one of its details and, when the model names its
repository URL and revision, its first source that Archify will cite, at that
revision. The manifest keeps every detail, status, source path, digest and
verification state.

## Quality floor

- Every poster page is 2400 × 1350 px, and no text is smaller than 14 px. A
  page passes the balance gates for its largest blank rectangle, blank bands,
  holes and centre of mass, or, when its figures already stand at the largest
  type step, is printed as sparse: the model has too little to fill it. Any
  other view no admitted page holds is refused with its closest page's measures
  and limits, unless the build asks for standard quality, which prints that page
  as a draft. The manifest records every page's admission and misses. A view
  that no page can lay out is refused; text is never shrunk and nothing is
  cropped.
- Text is set in the bundled faces, and lines break where the text's writing
  system allows. Text in a right-to-left or shaped script, or with a character
  no bundled face draws, is refused rather than drawn wrong.
- On posters each card is as wide as its text, the cards of one lattice column
  share one width and the cards of a row one height, and all sit on shared row
  lines; the page's diagram cards share one width. Wires are horizontal and
  vertical only; no segment is shared by two relations, no wire crosses a card
  and no label touches a card, a label, another wire or the system boundary. A
  layout that cannot meet this is never drawn, and a view no layout draws is
  refused. Crossings the relations force are allowed and counted, as are route
  defects, and each poster page prefers the fewest of both.
- Archify delivers the page at the build's quality profile, showcase unless the
  build asks for standard, and every view diagram passes Archify's checks at
  that profile, or the build is refused with Archify's findings. In a 1440 × 900 window every preview fits its panel,
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
