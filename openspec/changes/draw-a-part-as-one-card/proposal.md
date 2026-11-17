## Why

The edition draws a part in one of two ways that exclude each other: as a strip of the files it owns, with a
caption, or as a card with its kind's icon and its details. A model chooses with `edition.marks`, and a build
without file facts falls back to cards with a warning. So a plate shows either what a part measures or what it
answers for, never both, and every published work shows the first alone. The owner asked on 2026-11-14, on
2026-11-15 and on 2026-11-16 why the two exclude each other, and on 2026-11-17 agreed with an end state in which a
part is one card of regions, each drawn where the part has the fact.

## What Changes

- **BREAKING** A part is one card: its outline on its ground, its name, the strip of the files it owns, a caption
  with its kind's icon before the kind's label and the number and size of its files, and its details. A part that
  owns no file has no strip and no count. Every plate of every edition changes.
- **BREAKING** `edition.marks` leaves the model. A model that names it is refused with `model_field_retired` and
  told to remove it.
- **BREAKING** A build without file facts draws every part without a strip. The warning `marks_fallback` and the
  refusal `marks_need_files` are gone.
- A caption too wide for its card sets the count on a line of its own under the kind, so a narrow card no longer
  costs its plate a type step.
- A plate is composed for its parts' compact cards, and its cards set what their parts state only where the
  composition chosen holds it at the same type step with wiring no worse. A plate's record says whether its
  cards set their details.
- **BREAKING** The edition's longest strip is 320 px, and 208 px on its shorter scale, where bare strips ran 360
  and 240 px: a strip stands within its card's padding, and a row of six parts that held a strip bare holds it
  in its card.
- A plate's key lists no kind: each card names its kind beside the kind's icon. The key keeps what a card cannot
  say where it stands: the strip's scale, bands and date, the count beside a relation, the hub's line, the
  statuses and the ground of a part outside the repository. A neighbour that a group's view shows as context
  stands on the same ground inside the repository, and the key says of it that it lies outside the group; it
  used to say "outside" of both.
- **BREAKING** The manifest's `style` no longer records `marks`. The manifest stays at version 8, which no
  release has shipped yet.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: "Edition marks and palette" is removed and "Edition palette" added.
- `edition-delivery`: "Plate head and key" and "Key samples from the value table" change; "Edition marks in the
  manifest" becomes "Edition palette in the manifest"; "Mark defaults and fallback" is removed; "A part without
  file facts" and "The grounds in a key" are added.
- `poster-composition`: new requirements "One part", "A caption that breaks" and "Details where a plate has the
  room"; "Cards as large as their text",
  "Strips sized by their files" and "Strips keep to their boxes" change; "Runs of details without word spaces"
  becomes "Runs of a part's text without word spaces"; "Marks keep the gates" is removed.

## Impact

`src/poster/` (a new `part.mjs`; `plate.mjs`, `figure.mjs`, `strip.mjs`, `lines.mjs`, `tokens.mjs`,
`compose/plates.mjs`), `src/style.mjs`, `src/model/edition.mjs`, `src/model/schema.json`, `src/build.mjs`,
`src/edition/record.mjs`, the tests of plates, strips, keys and styles, `docs/reference/`,
the Skill and `CHANGELOG.md`. Every delivered plate changes; the six works are rebuilt.

Queue: `composable-parts`.
