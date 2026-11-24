## Context

See [proposal.md](proposal.md). The product's words live in `src/edition/words.mjs` (the edition) and
`src/locale.mjs` (the page and the reader file), in five languages. The draft and its reading lie in the checkout's
ignored `build/runtime/work/edition-map/terms/`; the kit that applies this Change in `build/runtime/work/terms-g/`.

## Goals / Non-Goals

**Goals:**

- One place states which word names each concept in English and Chinese, and a test holds the product to it.

**Non-Goals:**

- Every key in a table: a key that names no concept of the table, or names it only in some languages, is not
  listed.

## Decisions

1. The reference page is the table's source, read by a test.
   - Rests on: `docs/research/edition-map.md`, whose cut put the term table last; a tool under `tools/` may not
     import the product source (`tests/module-boundaries.test.mjs`), and
     the words stay where the code reads them.
   - Considered: a declaration in a tool that writes the page, refused by that boundary; a declaration in `src/`,
     which ships a table the product never reads.
   - Chosen because: the page holds only the vocabulary, which no other file states; the product's sentences use
     it, and the test reads both.
   - Applies to: `docs/reference/terms.md`, `tests/terms.test.mjs`.
2. "Components" in the English index.
   - Rests on: the page, the reader file and the other four languages' index all say component.
   - Considered: "part" everywhere in English, the contract's word, which changes more keys and leaves the model's
     field `components`.
   - Chosen because: one key changes, and the product's English then says what its model says.
   - Applies to: `edition.indexLead`.
3. 固定提交 for the pinned commit.
   - Rests on: Chinese wrote 固定提交 before 的检出目录 and 固定的提交 elsewhere; a second reader read both
     (`build/runtime/work/terms-g/reading-zh.md`).
   - Considered: 固定的提交 throughout, which stacks 的 before 检出目录.
   - Chosen because: one form reads in every place the concept stands.
   - Applies to: the reader file's words in Simplified and Traditional Chinese.
4. The key's boundary by its name alone in every language.
   - Rests on: the change of 2026-11-19 (`6f9b6f03`) set the key in the fewest words in five languages, and
     changed English and Simplified Chinese only.
   - Considered: none.
   - Chosen because: the five languages then say the same.
   - Applies to: `page.inside`, `page.context` in Traditional Chinese, Spanish and Korean.

## Risks / Trade-offs

- The table names no Spanish or Korean word: the prose gate's shipped spelling list reads a Spanish word as misspelt
  English, and a repository cannot lift that list. Ledger row 24 promised English and Chinese; the key's boundary and
  context are held in all five languages by their own test.
- The test checks that a listed key holds its word, not that an unlisted key avoids another: a new key naming a
  concept by another word is caught only once it is listed.
- An edition, page or reader file built before reads differently: the next release is breaking by the contract's
  Evolution.
