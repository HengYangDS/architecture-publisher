## Why

A plate's key says what its marks measure. Since 0.13.0 it says that a strip's length is "the code a part owns",
and that the number beside a relation counts "the source files this relation cites". The publisher measures
neither. A strip's length is the fact `owned-bytes`: the bytes of every file a part owns at the pin, of any type.
The number is the fact `cited-files`: the files a relation cites, of any type. In the published work on a documents
repository 92.4 % of the bytes its parts own are Markdown and none are program source, and its plates say "code".
The owner asked on 2026-11-16 whether the word is true, and it is not. Nothing ties a word the edition sets to the
fact it speaks of: the words are free text beside the catalogue of facts.

## What Changes

- **BREAKING** The words a plate sets of a measure change in all five languages: a strip's length is the size of
  the files a part owns, and the number beside a relation counts the files the relation cites. Every delivered
  plate's key changes.
- The words of a measure are kept under the property of the fact they speak of, and a key's entry takes its words
  by that property. A word for a property the catalogue lacks is refused.
- A test holds each language's words to the catalogue: the same properties in every language, and for a fact
  counted in bytes or in files the language's word for a size or for files.
- The model reference, the Skill and the requirement on strips say what a strip measures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `measured-facts`: a new requirement, "The words of a measure follow its fact".
- `poster-composition`: the requirement "Strips sized by their code" is renamed "Strips sized by their files"
  and says that the files are of any type; a new requirement, "Narrow files of a strip".

## Impact

`src/locale.mjs`, `src/poster/strip.mjs`, `docs/reference/model.md`, `skills/architecture-publisher/SKILL.md`,
`tests/locale.test.mjs`, `tests/poster-palette-key.test.mjs`, a new `tests/measured-words.test.mjs`,
`CHANGELOG.md`. Every plate's key text changes; no figure and no measure changes.

Queue: `composable-parts`.
