## 1. A gap in a line, and no plate of the ground

- [x] 1.1 Draw the boundary's edge, the wires and their arrowheads in one group clipped by a path that holds everything and, as holes of the even-odd rule, the box of each relation's label and of the boundary's name; remove the two rectangles of the page's colour. Done when a plate's SVG draws no rectangle of the paper's colour inside its figure, and a test renders a wire through a label's box and reads it transparent there and broken on both sides. Tests `figures-alone` and `pinned-face` read the gaps and the transparent box.
- [ ] 1.2 Hold the edition's pages to what they showed: the six published works are built with the Change, and each page's image above its key is compared with the released 0.15.0's at 3840 px. Done when the research page states, a work, the most pixels that differ on one of its pages, and the digests the tests pin are drawn anew with what changed in them.

## 2. The figure and its key alone

- [x] 2.1 A plate's record states the box its figure draws in. Done when the page built from a record draws to that box, and a test reads it from a plate drawn at two widths. `figures-alone` reads the box from a plate's record.
- [x] 2.2 The house class sets each plate alone, on no ground, cut to that box with a pad, its key under it at the edition's size and at least as wide as its widest entry. Done when the page compiles for the six works' plates and a test reads one page a plate's size, its transparent ground and its key's line. `figures-alone` reads the lone figure's size, ground and key.
- [x] 2.3 A delivery holds `figures/NN-<view>.png` and `.svg`, one each to a plate, at the density of the widest page image; the SVG is one document of shapes with its text as outlined glyphs and no data URI. Done when a test builds a work, reads both files of each plate, an alpha channel on the PNG and no `<image>` or `<text>` in the SVG, and the delivery's manifest lists them. `figures-alone` and `delivery-data` read both files of a plate.
- [x] 2.4 The manifest and the data record a plate's `figures` beside its images, the reader file names them on the view's line, and `archpub verify` and `archpub compare` hold a figure file as they hold a page's image. Done when tests read the two files from a manifest, the data and the reader file, and `verify` refuses a delivery whose figure file is changed, missing or unlisted. `manifest`, `pinned-data`, `pinned-reader` and `delivery-figures` read them and the refusals.

## 3. The key's words, and the width of a page's image

- [x] 3.1 The key's entries are a bound and a unit in every locale, the date a band is dated from leads the bands, and what a size and a count say names a size and files. Done when the words of one figure's key run under 60 per cent of its width in the English and the Chinese trial, and `measured-words` passes for every locale. `locale`, `measured-words` and `poster-palette-key` state the words; the trial measured 53 and 52 per cent.
- [x] 3.2 A plate's page states its commit's date in its foot alone: its key reads what the bands count from and no date; a figure set alone keeps the date in its key. Done when a test reads one date on a plate's page and the date in the lone figure's key. `edition-key-line` reads the page's one date and the lone figure's.
- [x] 3.3 A page's image is 3840 px wide unless the caller names its widths. Done when the default is read from the command's help and a build without `--png` writes 3840. `cli-usage`, `manifest` and `overview` read 3840.

## 4. The works, and what the item rests on

- [x] 4.1 `docs/research/figures-alone.md` enters the repository with this Change, and the design's decisions name it. Done when the queue test reads the design's "Rests on" page. `evolution-queue` reads the page.
- [ ] 4.2 The six works' deliveries are rebuilt and read: each lone figure drawn over a pale ground and a dark one, and its key's first entry. Done when a reader other than the holder reads the twelve figures and finds no unbroken gap and no unreadable entry.
- [x] 4.3 The contract's queue sets `edition-map` after `figures-alone` with a paragraph that says what it moves back, and the item says what the owner ruled on 2026-11-19 of the contents and the last page. Done when `tests/evolution-queue.test.mjs` passes and reads the order. `evolution-queue` passes.
