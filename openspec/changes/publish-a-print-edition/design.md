## Context

See proposal.md, Why. Today the publisher has two typesetters for print. The overview class
(`src/overview/house.typ`) sets the overview in Typst. The poster engine (`src/poster/`) composes pages
of one to three views from three page archetypes, draws heads, legends and notes, outlines all text with
opentype.js and rasterizes through resvg, which is built from Rust. The interactive page's diagrams use the
publisher's own grid layout (`src/layout/`) and are rendered by Archify, which has no static export.

## Goals / Non-Goals

**Goals:**

- Each tool owns one thing: the publisher lays out, Typst sets and prints, and Archify serves the screen.
- One print edition per delivery, typeset once, with live, linked, accessible text.
- One typographic system: one grid, one type scale, one palette, prose that reads evenly.

**Non-Goals:**

- The interactive page, its Archify style and its browser checks.
- A page size other than the house grid: the edition is set for screens and A3 landscape.
- Typesetting the figures' geometry in Typst. The engine keeps its layout, routing and card sizing.

## Decisions

1. **Three owners.** The publisher derives what no tool can: the model, citations, and the layout of
   cards, wires and labels. Typst sets every printed word and renders the PDF and the PNGs. Archify
   renders the page. Keeping posters as a second print path was rejected: two typesetters cannot share
   one type system, and every page would have been composed twice.
2. **One view per plate, laid out for the body.** The body field is 1504 by 714 points, or 2256 by
   1071 poster pixels at two thirds of a point each. The engine composes each view alone in that field.
   It tries every wrapping, type step, centring, uncentred included, and tier-label arrangement, and takes the fewest crossings, then the fewest route defects, then the largest step, then the widest wrapping, then layered rows before flat ones, then the least area in holes and blank rectangles.
   - No current delivery shares a page between views. Measured on 59 views, this order gave no smaller
     type and no more crossings than today.
   - Balance is measured and recorded. It no longer refuses or drafts a page, because its thresholds
     were calibrated for pages with text around the figure. A view that no wrapping fits at the smallest
     step is refused.
3. **Figures fill their plates.** Each plate takes the largest of the five type steps it fits after the
   fewest wiring faults, so the figure fills the body, as the owner asked on 7 November:
   「尽量利用好排版空间，别留大块空白」. A card label stays smaller than the plate's 34-point title. At
   the larger steps a detail is larger than the page's 12.5-point text, a deliberate trade. A cap at the
   third step was measured and dropped, because it left more paper around sparse figures.
4. **Live figure text.** The engine returns each plate's shapes as one SVG without text and its text
   as runs: text, position, size, weight, colour and the width it measured. The house class sets each
   run in the house faces at that position.
   - The engine measures with the same faces Typst uses, so widths agree. A run that Typst sets wider
     than the engine measured is refused (`edition_text_wider`) rather than drawn over its card.
   - The shapes are a PDF artifact, and the plate is one figure with alt text. Legend marks are
     artifacts too, so assistive technology reads each label once.
5. **Links to sources.** With `repository.browse`, a URL template with `{revision}` and `{path}`, a
   card title links to the first file the manifest records for its component at the pinned revision.
   A forge-specific URL scheme inferred from the host was rejected as hidden policy.
6. **Typography.**
   - Prose is justified on optimized lines, hyphenated in the model's language. Word spaces are held to
     80–125 percent and letters tracked by −0.012 to +0.025 em. Prose here means the summary, scope,
     limits and the reading note.
   - A prose line holds at most 32 em, about 75 characters. Today's notes measure 116.
   - Figure text keeps the engine's lines, ragged, so card heights hold. Measured on filmkit's cards,
     justifying them opened word spaces to 1.6 times their natural width, and their rag averaged under
     8 percent.
   - Titles, questions and labels are never justified. Han text is justified, the convention for
     Chinese print.
7. **Composition.** Every page uses its space; no column leaves its paper in one block. Measured as the
   largest blank rectangle in the live area, filmkit's pages are: the overview 4 percent, the contents
   10 percent, the plates 8–19 percent (the blank inside the figures) and the title page 32 percent, in
   two strips above and below its centred columns.
   - The title page gives the work's name at 120 points and its question on the left, its summary as a
     standfirst on the right, both centred in their band, and a byline across the foot.
   - The contents page sets the edition's facts, the scope, what the edition leaves out and a reading
     note in its left column, spaced over the whole body, and the rows in its right column, sharing
     the body equally. A work of eleven views needs twelve rows of 59.5 points; rows below 44 points
     continue on a second page.
   - A separate colophon was dropped: it left 29 percent of its page blank, and its facts fit the
     contents page.
   - Every page after the title page has the overview's head: a label at the margin, a display title at
     124 points and a lead line at baseline 84.
   - A plate's key, its kinds, boundary and statuses, is one line at baseline 848, above the foot.
     Measured over 41 views, the widest key is 1124 points, so it always fits; in the head, 8 keys did
     not.
   - The foot is a rule at 866 points, the work's title, release, revision and date linked to the
     contents, and the folio.
8. **One token source; one fewer toolchain.** The palette, faces, sizes and figure colours live in one file, `src/house.json`, staged beside the class, which reads it with `json()`, and read by the engine. JSON rather than TOML: both readers parse it natively, so no parser is added. Text is measured with the house faces and Noto
   Sans CJK SC; Noto Sans leaves the font supply. resvg, its Rust build, the raster journey and the
   `--png` path through it are retired, with Pixi's Linux compiler and xz that only the Rust build
   needed, and Typst renders every PNG. opentype.js moves to a supply of
   its own at the same version and digest.
9. **Model version 3.** `editors` is a non-empty list of names, each with an optional URL, and
   `license` is an SPDX expression. `attribution` is refused.
   - `archpub migrate` converts version 2 and refuses with `attribution_not_migrated` until editors are
     declared, rather than guessing them from prose.
   - `repository.browse` is optional.
10. **Names, structure and media.** A delivery is named for its work, by the owner's choice of 7 November:
    - `<model id>.pdf`, the print edition, and `<model id>.html`, the interactive page, at the top: one stem, the
      medium in the extension. `index.html` is retired; a web link names the file.
    - `images/` holds the overview's and plates' pages as `00-overview.png` and `NN-<view>.png` at each `--png`
      width, numbered as the plates are. A PNG is its PDF page, foot included.
    - `manifest.json`, the machine record, keeps its conventional name. Nothing else is written at the top.
    - A tarball was declined: a Forge cannot preview it, Git cannot compare it, and readers must unpack it.
    - Two languages, in a later release, add the locale before the extension and an `images/<locale>/` folder.
    - `--media` takes `edition`, the PDF with its images, and `page`. Manifest version 6 records the edition, its
      pages and plates, and the house and measuring supplies.
11. **Standards.** Typst compiles with `--pdf-standard a-3a,ua-1`, with system fonts ignored and the
    revision's commit time as the creation date. Without the checkout, the date is `SOURCE_DATE_EPOCH`
    when the caller sets it, as reproducible builds do, and otherwise the time of typesetting; the
    manifest records which. Title, authors, subject, keywords and language come from the model, and
    the model is attached with the relationship `source`.

12. **A plate is its figure and its view's reading.** The owner's review of 7 November found blank
    plates; measurement located the cause. Every figure already reaches the body's edge in one dimension,
    so neither scaling it nor a larger type step fills the body. Two plates in twelve are narrower than
    the body, the rest hold blank inside the figure that their relations' structure leaves, and no
    composition with as few wiring faults removes it without losing type.
    - A figure takes the narrowest of 100, 80 and 65 percent of the body's width that keeps its full-width
      crossings and route defects. A view with a summary gives up at least a fifth of the width: its
      figure takes 80 percent, at the step that width allows, or 65 percent when that keeps its
      80-percent step, so a summary costs at most the type that 80 percent takes from the figure. A view
      without one narrows only when one of its components claims files, to a share its full-width figure
      already leaves, at its step, so a figure is never narrowed for a list alone or for nothing.
    - Beside the figure, 40 points from its field, the plate sets the view's summary and then where each
      shown component lives: its claimed paths, as the model declares them. The summary is justified when
      its column holds at least 24 em at 17 points, and flush left otherwise.
    - When 80 percent would add crossings or route defects, the figure keeps the full width and the
      manifest records the reading it left out.
    - Blank the figure's structure leaves stays visible. `archpub check` reports each plate's width, its
      missed gates and a reading left out; reshaping a view is its author's decision.
    - Scaling the whole plate and placing the key in the largest blank rectangle were measured and
      declined: the first gained 2 to 7 percent, and the owner declined the second.

## Risks / Trade-offs

- [Without balance gates, a sparse view leaves paper beside its figure] → Each plate records its
  measures, a narrow figure gives its width to the view's reading, and `archpub check` reports the
  rest to the work's author. The owner reviews every edition's pages before the publications
  rebuild lands.
- [A summary costs a view's largest type step] → At most one or two steps, measured on twelve plates,
  and only for a view whose author wrote a summary.
- [Typst becomes required for print] → It is already pinned and shipped in the self-contained command;
  the page alone still builds without it.
- [A run set wider in Typst than measured] → Both use the same font files. The build refuses, and a
  test sets every corpus model's runs.
- [The detail floor stays 14 px, 9.3 points] → Unchanged from today's posters; legible on screens and
  on A3 landscape.
- [One large breaking release] → Model migration is mechanical except for editors. Architecture
  Publications migrates its six works in its own Change, and 0.9.0 remains the rollback.

## Migration Plan

Release as 0.10.0. Architecture Publications then migrates each model to version 3 with
`editors: [{ "name": "Yang HENG" }]`, `license: "MIT"` and a browse template, renames the first views
that `00-overview` would shadow, and rebuilds every work with `--media edition,page`. Rollback is the
0.9.0 release.
