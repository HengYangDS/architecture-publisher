## Why

The Chinese editions of the six published works, built with 0.10.0 on 8 November, show two faults the publisher
causes and no work can fix:

- The overview's masthead prints its build line in English, "As built at abf0585 · 2026-11-05", though the edition
  already holds that line in the model's language and sets it so on the contents page.
- A Chinese title wider than its column on the title page breaks where the line fills, leaving one character alone:
  "AIGW 客户端投 / 影", "数据部门工作指 / 南".

## What Changes

- In the print edition the masthead sets the edition's own build line, in the model's language. A check of the
  overview alone keeps the English line it measures today. An overview of a model that pins no revision no longer
  prints a bare "As built at".
- A cover title that holds Han, Kana or Hangul text and is wider than its column breaks at the space that leaves the
  most balanced lines that each fit; without such a space, into lines of balanced width. A title in other scripts
  breaks at its spaces as before, so English editions are typeset as in 0.10.0.
- The release is 0.10.1.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: the overview's masthead in the print edition is in the model's language.
- `edition-delivery`: a CJK cover title breaks into balanced lines.

## Impact

`src/overview/house.typ`, its tests, `CHANGELOG.md`, `VERSION` and `package.json`. Editions of an English model
that pins its revision are typeset as in 0.10.0; editions in other languages change only on their overview's masthead and, for a CJK title
wider than its column, on the title page.
