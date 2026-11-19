## 1. The contents

- [x] 1.1 The record states the overview's entry and a row a plate, and no facts beside the contents; the class sets the entry and the three notes in the left half under rules on the rows' lines, and refuses a left half taller than the page. Done when `tests/edition-contents.test.mjs` passes. `edition-contents` passes.
- [x] 1.2 A half takes at most `edition.contentsRows` rows, shared out evenly; a further page sets both halves, has its foot and names its plates. Done when the same test file reads eleven, twelve and twenty-eight plates. It reads eleven plates on one page, twelve as four, four and four, and twenty-eight as ten, ten and eight.
- [x] 1.3 The edition's words in five locales name the last page in the reading note and the page by one word. Done when `tests/locale.test.mjs` and the reading note's test pass. Both pass.

## 2. The index

- [x] 2.1 Names are ordered word by word, Latin first. Done when `tests/edition-index-order.test.mjs` passes. `edition-index-order` passes.
- [x] 2.2 The class sets every part once with its plates' numbers as links, further numbers in lines of equal length, in two columns or four, on further pages past 26 points a line, and refuses a part no page holds. Done when `tests/edition-index.test.mjs` passes. `edition-index` passes.
- [x] 2.3 Four facts stand under the index, and the page count of an edition includes the index. Done when the same test file and `tests/edition-class.test.mjs` pass. Both pass.

## 3. Documents

- [x] 3.1 The reference pages, the glossary, the tutorial, the contract and the changelog say what the contents and the last page hold. Done when `npm run check:static` passes. `npm run check:static` passes.
- [x] 3.2 `docs/research/contents-and-index.md` enters the repository with its row in the research index. Done when the queue test reads the design's page. `evolution-queue` passes.

## 4. The works

- [x] 4.1 The six published works are built in both languages with the Change. Done when none is refused and the research page states each edition's pages of contents and of index. None is refused; the research page's finding 8 states them.
- [x] 4.2 A reader other than the holder reads the contents and the index of the twelve editions. Done when the reader finds every row and every number in its place and no text cut or overlapping. The reader's words stand in finding 8.
