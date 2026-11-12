## Context

The engine draws every part as a card: an icon, a coloured bar, the label and
its details, in colours read once from `src/house.json`. The house class reads
the same file for the edition and overview pages. Source binding already reads
every claimed file's blob at the pinned commit, so its size is known; its last
change is one Git history read away. The owner chose the woven-strip direction
(反物) from prototypes on the archpub and ETHOS views, three dyes from Japanese
textile colours, and asked for more style and palette choices, each held to the
same gates.

## Goals / Non-Goals

**Goals:**

- Style and palette are independent choices of the edition, recorded in the
  manifest.
- A `bolts` plate shows what the model claims at the pin: files, their sizes
  and how recently each changed.
- `cards` with `forest` reproduces the 0.12 plates byte for byte.
- A custom palette is either accepted as printable or refused with a measure.

**Non-Goals:**

- Other compositions of a view (loom, hanging cloths, ledger).
- The acceptance mark, its colophon page and acceptance record version 2.
- Palettes for the page (HTML), which keeps Archify's themes.

## Decisions

### One palette, many tokens

A palette has five roles an author can name: `ground`, `ink`, three `dye`
steps from new to old, and `accent`. Every other token the engine and the class
use (line, muted text, rule, card, boundary and the rest) is either given by a
built-in palette or derived by mixing ink into ground in OKLab at a fixed share
calibrated on the 0.12 house. `forest` lists all of the 0.12 tokens, so it
derives nothing. The class keeps its names: `green` is the palette's oldest dye
and `ochre` its accent, so existing overview compositions keep working.

Alternative: a free token map. Rejected: an author would have to pass a dozen
colours, and nothing would hold their relations.

### Rules for a custom palette

Measured in OKLCH and WCAG 2 contrast against the ground: ground L ≥ 0.92 and
C ≤ 0.02; ink contrast ≥ 7 and C ≤ 0.05; dye steps lighter to darker by at
least 0.12 in L, the newest at least 0.07 below the ground, the oldest at
contrast ≥ 4.5, each C ≤ 0.08; accent contrast ≥ 4.5 and C ≤ 0.12; no colour
within 0.06 (OKLab) of the seal's cinnabar `#A93D31`. The steps' lightness
alone tells ages apart, so a photocopy keeps them. The four built-ins pass.

### Weaving a strip

A part's strip is as long as its box is wide. Each owned file is one segment,
in path order, as wide as its share of the part's bytes, with a hairline of
ground between segments; a segment narrower than one pixel merges into its
neighbour of the same band. Its thickness is `4 + 16 · √(bytes / most)` px, the
most being the largest part of the work, so every plate of an edition shares one
scale. A part that owns no files is a dashed outline of the thinnest strip and
reads "owns no files". The box sets the label above the strip and, under it,
the part's kind on the left and its file count and size on the right, then its
leading detail. The box keeps its rectangle, so placement, routing and every
gate stay the same engine.

### Age bands

Each file's age is the pin's commit time minus the time of the last commit at
or before the pin that changed it (`git log --no-renames` over the claimed
paths, one read). The edition chooses two boundaries from the ladder 1 day,
3 days, 1 week, 1 month, 3 months, 1 year, 3 years so that its three bands
hold the files closest to thirds, ties to the shorter span. Bands map to the
dye steps from new to old, and the key names them by their spans in the model's
language. One scale holds for every plate of the edition.

### Lines

A relation's line is 1.2, 1.8 or 2.4 px for one, two, or three or more citing
files. The part with the most incoming relations in a view, when it has at
least three and strictly more than any other, is that view's hub: the
relations into it take the oldest dye, and the key names it. A relation that
cites no files keeps the thinnest line.

### Defaults and fallback

The defaults are `bolts` and `indigo`. Strips need file facts: without a bound
checkout or without claimed files, a model that does not name a style is set in
`cards` and the result warns `style_fallback`; one that names `bolts` is refused
with `style_needs_files`.

### Manifest version 7

Each cited file record gains `bytes` and `changed` (UTC date of its last
change); the manifest gains `style`: the style, the palette's name or `custom`,
the resolved roles and the age bands' spans. Version 6 consumers break by design.

## Risks / Trade-offs

- [Every default plate changes] → `cards` + `forest` keeps the 0.12 look;
  the owner reviews every plate before the release.
- [Thin strips on dense views] → the strip's minimum is 4 px, under the type
  floor's influence on box height, and the balance gate measures strips as mass.
- [A shallow clone lacks history] → the age read fails into
  `source_history_unavailable` instead of guessing.

## Migration Plan

Models need no change. A work that wants its 0.12 look adds
`"edition": {"style": "cards", "palette": "forest"}`. Rollback is the 0.12
release.

## Open Questions

None.
