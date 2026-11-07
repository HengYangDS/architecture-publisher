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
   It tries every wrapping, type step and centring, uncentred included, and takes the fewest crossings,
   then the fewest route defects, then the largest step, then the widest wrapping, then the fewest
   bends, then the least area in holes and blank rectangles.
   - No current delivery shares a page between views. Measured on 59 views, this order gave no smaller
     type and no more crossings than today.
   - Balance is measured and recorded. It no longer refuses or drafts a page, because its thresholds
     were calibrated for pages with text around the figure. A view that no wrapping fits at the smallest
     step is refused.
3. **Three type steps.** These are 18/14/14, 20/16/16 and 24/18/18 px for card names, details and
   relation labels, or card names of 12 to 16 points and details of 9.3 to 12. A card name then stays smaller than the page's
   18-point heads, and a detail no larger than its 12.5-point text.
   - Steps four and five set 18 of 41 views' text larger than the page's own, an inverted hierarchy.
   - Capping filmkit at step two kept both affected figures at 96 percent of the body's width.
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
     limits, the reading note and the colophon.
   - A prose line holds at most 32 em, about 75 characters. Today's notes measure 116.
   - Figure text keeps the engine's lines, ragged, so card heights hold. Measured on filmkit's cards,
     justifying them opened word spaces to 1.6 times their natural width, and their rag averaged under
     8 percent.
   - Titles, questions and labels are never justified. Han text is justified, the convention for
     Chinese print.
7. **Composition.**
   - Every page after the title page has the overview's head: a label at the margin, a display title at
     124 points and a lead line at baseline 84.
   - A plate's key, its kinds, boundary and statuses, is one line at baseline 848, above the foot.
     Measured over 41 views, the widest key is 1124 points, so it always fits; in the head, 8 keys did
     not.
   - The foot is a rule at 866 points, the work's title, release, revision and date linked to the
     contents, and the folio.
   - Contents rows share the body at no more than 90 points each, so a work of 11 views fits at 56. Rows
     that would fall below 44 points continue on a second page.
   - The title page is paper and type, with one green rule.
8. **One token source; one fewer toolchain.** The palette, faces and sizes live in the house supply,
   read by the class with `toml()` and by the engine. Text is measured with the house faces and Noto
   Sans CJK SC; Noto Sans leaves the font supply. resvg, its Rust build, the raster journey and the
   `--png` path through it are retired, and Typst renders every PNG. opentype.js moves to a supply of
   its own at the same version and digest.
9. **Model version 3.** `editors` is a non-empty list of names, each with an optional URL, and
   `license` is an SPDX expression. `attribution` is refused.
   - `archpub migrate` converts version 2 and refuses with `attribution_not_migrated` until editors are
     declared, rather than guessing them from prose.
   - `repository.browse` is optional.
10. **Names and media.**
    - `--media` takes `edition`, the PDF with its PNGs, and `page`.
    - The overview's and plates' pages are delivered as `00-overview.png` and `NN-<view>.png` at each
      `--png` width. A PNG is its PDF page, foot included.
    - Manifest version 6 records the edition, its pages and plates, and the house and measuring
      supplies.
11. **Standards.** Typst compiles with `--pdf-standard a-3a,ua-1`, with system fonts ignored and the
    revision's commit time as the creation date. Title, authors, subject, keywords and language come
    from the model, and the model is attached with the relationship `source`.

## Risks / Trade-offs

- [Without balance gates, a sparse view leaves paper beside its figure] → Each plate records its
  measures. The three-step cap keeps type consistent. The owner reviews every edition's pages before
  the publications rebuild lands.
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
