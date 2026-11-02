## Context

See proposal.md. The three spike pages, `ethos.typ`, `aigw.typ` and
`archpub.typ` with a shared `house.typ`, set every element at absolute points on
a 1600 by 900 page and rebuild byte-identically with Typst 0.15.1 on this host.
The publisher already keeps bundled fonts under supply custody, runs Git and
Archify as child processes with an allow-listed environment, stages a delivery
before renaming it into place and records every artifact in the manifest.

## Goals / Non-Goals

**Goals:**

- Each work's overview is written for that work, with the house class, and
  built, checked and delivered by `archpub build` like the other media.
- Equal composition, model, class, fonts and Typst version give equal bytes.
- What the eye would catch first is refused before delivery: text outside the
  margins, text over text, a component the model lacks, a size or colour outside
  the house style.

**Non-Goals:**

- Laying out a page from the model alone; the rejected generated atlases did
  that.
- Retiring the posters, changing the page's plan, or the interactive atlas.
- Judging whether a page is beautiful; the owner's review does that.

## Decisions

- **A composition per work, in a document class.** The page is a design for one
  system, so its author writes it, as a LaTeX document is written in a class.
  archpub supplies the house style, the modules, the model binding and the
  checks. A layout language inside the model was rejected: it would either
  restrict every work to the forms it knows, which is how one staircase came to
  stand for every repository, or grow into a second typesetter.
- **Typst's own command-line build, pinned.** Typst lays out pages, measures and
  breaks text and writes deterministic SVG and PNG. archpub runs the official
  binary at the pinned version and refuses another version, so equal inputs
  give equal bytes. A WebAssembly build compiled and kept by archpub was
  rejected as a second compiler to maintain; a third-party wrapper, as a
  dependency on one maintainer.
- **A sealed compile.** The build stages the composition's directory, the class
  and the model in one root that Typst may not leave, passes only the bundled
  font directory with system fonts ignored, and refuses package imports, so the
  page depends on nothing the delivery does not record.
- **Checks on the typeset page.** Each text primitive of the class records its
  glyph box as metadata, and the build reads the boxes back from Typst. A source
  check refuses sizes, faces, colours and imports the class does not own. Typst
  draws a character no face holds as an empty box without warning, so the build
  checks every text's characters against the faces itself; any Typst warning is
  also a refusal.
- **The date comes from Git.** The masthead and imprint print the revision's
  commit date when `--repo` names the checkout, and only the revision otherwise,
  so a build never reads the clock.
- **Fonts for the house style.** Source Serif 4 and Source Sans 3 are the faces
  the owner approved; they are added unmodified from Adobe's releases with their
  licences, in a house supply of their own: the posters set text through every
  family of the font supply in turn, so adding the faces there would change their
  fallback. Han text falls back to the bundled Noto Sans CJK SC; no second CJK
  family is added.

## Risks / Trade-offs

- Builds that ask for an overview need Typst 0.15.1 installed. The refusal names
  the version and how to install it; the other media do not need it.
- Typst output on Linux and Windows has not been compared with macOS. CI builds
  the fixture overview on all three platforms and compares its digests.
- Absolute placement leaves composition to the author. The checks catch
  collisions, not weak design; the owner reviews the three overviews.

## Migration Plan

Models without a composition build as before. A model gains an overview by
naming its composition; the three works follow in architecture-publications.
