## Context

The publisher measures every fact a plate draws in one layer, `src/facts`, whose catalogue names each property with
its unit. The words a plate sets of those facts are entries of `src/locale.mjs`, written freely in five languages.
Two of them say more than the fact: `owned-bytes` is called the code a part owns, and `cited-files` the source
files a relation cites. `docs/research/figure-language.md` records the measurement: in one published work 92.4 % of
the owned bytes are Markdown.

## Goals / Non-Goals

**Goals:**

- A word the edition sets of a measure is true of what the publisher measures, in every language.
- A new word of a measure cannot be added without naming the fact it speaks of.

**Non-Goals:**

- No measure, figure or layout changes; only the key's text.
- The words a card's caption sets (the kind, the count of files and their size) are true as they stand and keep
  their wording.
- The words of the page and of the reader file.

## Decisions

1. The words of a measure are kept under the fact's property.
   - Rests on: `docs/research/figure-language.md`, "Measured on 2026-11-16": the strip's length is the fact
     `owned-bytes`, and the product's words for it name code in five languages since 2026-11-13. The owner,
     2026-11-16 22:53:03: 「那个代码量 20 KB 真的只是代码量么？ markdown 是怎么计量的？是否符合：信、达、雅」.
   - Considered: correcting the two sentences and nothing else; a list of words a key may not use.
   - Chosen because: the fault is that nothing ties a word to its fact, and a corrected sentence can drift again.
     Under its property a word is read beside the catalogue's unit, and a test can hold it there. A list of
     forbidden words would name one mistake and miss the next.
   - Applies to: the words a plate's key sets of a measured fact: the bands of a file's age, the pin's date, the
     strip's length, the count beside a relation and the hub's line.
2. A fact counted in bytes is called a size, and one counted in files is called files.
   - Rests on: the catalogue's units (`owned-bytes` in bytes, `cited-files` in files).
   - Considered: "volume", "weight" or "amount" for bytes; naming the file types a work holds.
   - Chosen because: a size in kilobytes is what the key's sample already prints beside the words, and a reader
     of any repository understands it; the types of a part's files are not a fact the layer measures.
   - Applies to: the five languages.
3. The requirements on strips say what a strip measures and how narrow files are drawn.
   - Rests on: `src/poster/strip.mjs`: a file narrower than a seam is drawn as one segment with a neighbour of its
     band, which the requirement did not say.
   - Considered: leaving the requirement's sentence "each owned file is one segment".
   - Chosen because: the reading page that `composable-parts` adds teaches from this requirement, and a reader of
     another origin found the shorter sentence untrue of a built plate.
   - Applies to: the requirement, renamed "Strips sized by their files", and a new one, "Narrow files of a strip".

## Risks / Trade-offs

- [Every delivered key changes, a breaking release] → It is one sentence a language; the works are rebuilt with
  the release that carries it.
- [The Spanish, Korean and Traditional Chinese words are written without a native reader] → They follow the same
  construction as the two built languages, and the test holds their nouns; a native reader's correction is a
  maintenance Change.
