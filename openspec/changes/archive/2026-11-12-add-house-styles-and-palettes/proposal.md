## Why

Every print edition looks the same and its plates say nothing the model does
not already say in words, though the files each part owns, their sizes and how
recently they changed are read at the pinned commit. An expert committee found
the first strip drawing misleading: a strip's length followed its label, so a
239 KB part could look smaller than a 25 KB one. This Change draws parts from
their code, truthfully, and lets a model choose its palette.

## What Changes

- A model may name its edition's marks (`strip` or `card`) and palette in a new
  optional `edition` object.
- **Strips**, the new default: a part's strip is as long as its code on one
  scale for the edition, one segment per owned file sized by its share and dyed
  by its age band; every strip has one thickness. Each relation carries one tick
  per file it cites. The relations into a view's hub are drawn in the oldest
  dye. The key shows the age bands with the pin's date, a scale bar and the
  ticks.
- Age bands are the same for every edition: changed within a week, within three
  months, and earlier, counted back from the pin.
- Four built-in palettes, 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot` and 铜绿
  `patina`, and a model's own palette, refused with `model_palette_rejected`
  at the colour that fails contrast, chroma, lightness or hue rules.
- A build without file facts draws cards and warns `marks_fallback`; a model
  that asks for strips without files is refused with `marks_need_files`.
- **BREAKING**: the manifest moves to version 7, with each cited file's size and
  last change date and the edition's marks, palette and age bands. Every
  default plate changes. On strip plates relation labels are set in the regular
  weight.
- The overview's house class takes its colours from the chosen palette.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the `edition` object and the custom palette rules.
- `poster-composition`: strips, age bands, citation ticks and the hub.
- `edition-delivery`: manifest version 7, the defaults and the strip key.
- `overview-page`: the house class reads the chosen palette.

## Impact

`src/model/` (the `edition` object, palettes), `src/house.json`, `src/style.mjs`,
`src/sources/` (sizes, dates, bands), `src/poster/` (drawing, metrics, keys),
`src/locale.mjs`, `src/edition/` and `src/overview/` (palette and key marks),
the manifest, the reference documentation, the Skill and the tests. Pages
(HTML) are unchanged. Out of scope, each in its own Change: page styles and the
register (part numbers, file schedule, title block), the revision and notes
layers, Chinese serif titles, other arrangements (经纬 first) and the acceptance
mark.
