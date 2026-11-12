## Context

The engine draws every part as a card in colours read once from
`src/house.json`; the house class reads the same file. Source binding already
reads every claimed file's blob at the pinned commit, so its size is known, and
its last change is one Git history read away. The owner chose a drawing made
from the code itself, asked for more choices held to the same gates, and later
convened an expert committee (information design, typography, product,
practice, design systems, naming), whose reviews are kept with the build work
of this lane. This Change carries the part of their recommendation that the
default plate needs to be truthful; the rest follows in its own Changes.

## Goals / Non-Goals

**Goals:**

- Every mark of a strip plate states a fact read at the pin, on one scale for
  the edition, and the key says how to read it.
- The palette is the edition's choice, recorded in the manifest.
- A custom palette is either printable or refused with a measure.

**Non-Goals:**

- Page styles, the register (part numbers, file schedule, title block), the
  revision and notes layers, Chinese serif titles and other arrangements.
- Keeping the 0.12 plates: the default changes, and cards remain as the
  drawing for builds without file facts.

## Decisions

### Length carries size

A strip's length is `max × bytes / most`, `most` being the largest part of the
edition and `max` one length for every plate, at least 2 px for a part with any
bytes; the box is as wide as the larger of its text and its strip, so placement
and every gate still run on boxes. Thickness is one constant: size has one
encoding, the one a reader compares best. Alternative rejected: length from the
label and thickness from √bytes, which the committee measured at a lie factor
of about 0.15.

### Ticks carry citations

Line weight between 2 and 3 px could not be read in print. Each relation gets
one tick across its line near the source per cited file, up to five, with the
count beside more; every line has one weight. The word on the key is "cites":
binding checks that the files exist, not that they prove the relation.

### Fixed age bands

Bands chosen per edition from a ladder made two editions incomparable and
changed the key from book to book. Every edition now uses a week and three
months, counted back from the pin's commit, and the key prints that date.

### Palettes

A palette has five roles an author can name: `ground`, `ink`, three `dye` steps
from new to old, and `accent`; every other token is derived by mixing ink into
ground in OKLab at shares calibrated on the 0.12 house. The class keeps its
names: `green` is the oldest dye and `ochre` the accent. Rules, in OKLCH and
WCAG 2 contrast against the ground: ground L ≥ 0.92, C ≤ 0.02; ink contrast ≥ 7,
C ≤ 0.05; dye steps each at least 0.12 darker, the newest at least 0.07 below the
ground, the oldest at contrast ≥ 4.5, each C ≤ 0.08, turning through at most 60°
of hue; accent contrast ≥ 4.5, C ≤ 0.12; nothing within 0.06 (OKLab) of the
seal's cinnabar. Four built-ins with Chinese names from real dyes and pigments
and one-word English ids: 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot`, 铜绿
`patina`. Other researched palettes are documented as custom examples.

### Defaults and fallback

The defaults are `strip` and `indigo`. Strips need file facts: without a bound
checkout or claimed files, a model that names no marks is drawn in cards and
warned `marks_fallback`; one that names `strip` is refused with
`marks_need_files`.

### Manifest version 7

Each cited file record gains `bytes` and `changed` (UTC date of its last change
at the pin); the manifest gains the edition's marks, the palette's name or
`custom`, its resolved roles, the age band spans and the pin's date.

## Risks / Trade-offs

- [Every default plate changes] → the owner reviews every plate before release.
- [Tiny parts become hard to see] → the 2 px floor and the caption's exact size
  keep them legible; the scale bar makes the ratio readable.
- [A shallow clone lacks history] → the age read refuses
  `source_history_unavailable` instead of guessing.

## Migration Plan

Models need no change; a model that wants cards sets `"edition": {"marks":
"card"}`. Rollback is the 0.12 release.

## Open Questions

None.
