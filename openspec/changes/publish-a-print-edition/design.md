## Context

See proposal.md, Why. Today two typesetters set a delivery's static media. The
overview class (`src/overview/house.typ`) holds the house palette, faces and
four sizes, and the posters are set by `src/poster/` with their own tokens and
the font supply's Noto faces. On each poster the engine sets the head, the
legend and the notes beside the figure. The renderer outlines text, so a poster
carries no live text.

## Goals / Non-Goals

**Goals:**

- One typesetter sets every word outside a figure, and one token source
  supplies the palette and faces.
- One print edition per delivery: navigable, tagged, deterministic, with the
  model inside it.
- Authorship and licence are declared, not inferred from prose.

**Non-Goals:**

- The interactive page, its Archify style and its browser checks.
- A physical page size other than the house grid: the edition is set for
  screens and A3 landscape.
- Live text inside figures. Figures stay outlined until a later Change
  typesets them in Typst.

## Decisions

1. **Typst sets the edition, and the engine supplies figures.** The edition is
   a Typst document, typeset by the house class's edition function. The class
   reads the manifest, the model and an edition record of the plates, each with
   its figure SVG, size and legend. A poster engine that also set the booklet's
   pages would have needed a second text system, links, tags and metadata of
   its own; Typst provides all four natively.
2. **Edition plates are composed for the body field.** The engine composes a
   page's views for a field the size of the edition's body, 1504 by 734 points
   at two thirds of a point per poster pixel, with no head, legend or notes. It
   keeps the same candidates, balance gate and admission. Scaling whole posters
   was rejected: the prototype had to scale them by 0.61 to fit, and labels fell
   to 8.5 points.
3. **One token source.** The palette, faces and sizes live in the house supply,
   with one TOML file read by the Typst class through `toml()` and by the
   engine. The engine's typeface chains become Source Sans 3 and then Noto Sans
   CJK SC for text, and Source Serif 4 Subhead and then Noto Sans CJK SC for
   titles. Noto Sans leaves the font supply.
4. **The ETHOS `proof` view must compose before the faces change lands.** With
   narrower faces the view fails sparse admission: emptyShare 0.144 and holes
   0.462. The faces change is not merged until that view composes, whether as a
   balanced, sparse or edition plate. A frozen copy of the published ETHOS overview and proof views in the test corpus guards it: today it prints the proof plane alone and sparse, and with the spike's house faces it is refused.
5. **Model version 3.** `editors` is a non-empty list of names, each with an
   optional URL. `license` is an SPDX expression. `attribution` is not
   accepted. `archpub migrate` converts version 2 to version 3. It does not
   guess editors from prose: it carries every other field and refuses with
   `attribution_not_migrated`, naming the text, until the author declares
   `editors`.
6. **Names, and the PDF as the vector form.** `00-overview.png` names the
   overview, and `NN-<views>.png` names a poster page by its number and its
   view ids joined by `+`. The PDF holds the vectors, so SVG files are not
   delivered. The manifest moves to version 6, records the house supply digest
   and lists the edition.
7. **Standards and metadata.** Typst compiles the edition with
   `--pdf-standard a-3a,ua-1`, system fonts ignored and the creation timestamp
   of the revision's commit. Title, author, subject, keywords and language come
   from the model. Legend marks are artifacts, so assistive technology reads
   each label once.

## Risks / Trade-offs

- [The house faces change admissions in other works] → The spike measured six
  works, big-bank and five fixtures; only ETHOS `proof` failed. Decision 4 gates
  the change on it.
- [Edition plates and posters can choose different compositions for one view]
  → Both use the same candidates and gates. Only the field differs, and the
  manifest records each composition.
- [A breaking model version] → Migration is mechanical except for editors,
  which it refuses to guess. Architecture Publications migrates its six works in
  its own Change.
- [PDF/UA conformance claimed by Typst only] → Typst's own checks are the
  standard's acceptance here; no second validator is bundled.

## Migration Plan

Release as 0.10.0. Architecture Publications then migrates each model to
version 3 with `editors: [{ name: "Yang HENG" }]` and `license: "MIT"`, renames
first views that the overview's `00` would shadow, and rebuilds every work.
Rollback is the 0.9.0 release, which reads version 2 models.
