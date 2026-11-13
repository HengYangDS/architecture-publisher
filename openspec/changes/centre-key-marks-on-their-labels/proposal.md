## Why

A plate's key is one line of marks and their labels, and it is not set on one line. Every mark
stands on an edge 2 points below the text's baseline, so marks of different heights have different
centres, all of them below the text's: on a strip plate the boundary's outline sits 1 point low,
a band 2 points, the ticks 2.6 points and the hub's line 6 points, where it reads as an underline.
The line itself is placed by its top, so its tallest mark decides where its text stands: its
baseline is at 846 points on a strip plate and 849 on a card plate, whose icons are taller, and at
848, the value the reference gives, on neither. And the hub's entry does
not say what its mark shows: `draws on Host tools` names a part beside a short dark stroke, drawn
half again as heavy as the lines it stands for.

The owner read the key on a Chinese plate, asked what the hub's entry meant, why its line sat like
an underline, and whether the text sat high. Each was measured and each was so.

## What Changes

- A plate's key is set by its baseline, at 850 points on every plate, whatever marks it holds.
- Every mark of the key is centred on its label's mid-line, 0.36 em above the baseline, which at
  850 points is the middle of the band between the body's foot and the foot's rule.
- The hub's mark is a sample of what the plate draws: a line of the plate's own weight in the
  oldest dye, ending in the plate's arrowhead.
- The hub's entry says what the mark shows, in each language: `dark lines lead to Host tools`,
  `深色连线：通向主机工具`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a plate's key stands on one baseline and its marks on one mid-line.

## Impact

`src/overview/house.typ` (the key and its marks), `src/house.json` (the key's baseline),
`src/poster/strip.mjs` (the hub entry's line weight and arrow), `src/locale.mjs` (the hub entry's
words), their tests and the operations reference. Every plate's key moves: its text down by 1 to
4 points, its marks to their labels' mid-line.
