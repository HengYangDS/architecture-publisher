## Context

See [proposal.md](proposal.md). The research is `docs/research/reader-file.md`, whose section "The figures as text"
this Change adds. The kit is in the checkout's ignored `build/runtime/work/reader-file-2/` (`copy/`, `sample/`: the
twelve published guides as the reader file writes them).

## Goals / Non-Goals

**Goals:**

- A reader of the reader file reads what each of the guide's figures says, without the page.

**Non-Goals:**

- The figures of the edition's plates: the reader file writes the model's statements already.
- A data chart's values: its file is named; its columns are the page's to draw.

## Decisions

1. A figure's text is written from its document, one writer a kind, in one module.
   - Rests on: the twelve published guides hold eleven kinds of figure, nine as files and three inline; each
     kind's items, lines and fields were read (`sample/`).
   - Considered: Archify's own text of a figure (it has none for a reader file); Mermaid text (another syntax the
     reader would have to read).
   - Chosen because: the kinds are few and their documents are the author's; each writer is small and tested.
   - Applies to: `figureText`, `guideText`, `guideDiagrams`.
2. Steps that walk a figure stand with its items.
   - Rests on: the guides' steps name the item they explain (`target.node`); written apart, every walked item
     stood twice, once as the figure's and once as the step's.
   - Considered: both lists (the reader reads each name twice); the figure's list alone (the author's words lost).
   - Chosen because: each item once, in the order the author walks it, with the figure's and the author's words.
     A step's name that differs from the drawn label stays as an aside. Steps that name an item the figure lacks,
     and those of a sequence or a tree, stay the guide's own list.
   - Applies to: `walks`, `figureText`, `walksOf`.
3. The words of a figure's text are the reader file's, in each language; a list is parted by the edition's mark.
   - Rests on: `READER_WORDS` already holds the reader file's words in five languages; the edition's words hold
     the mark between a list's items.
   - Considered: a mark of a list among the shared marks (a second source of the edition's).
   - Chosen because: one source for each word and mark. A date heading a column takes a capital from the word.
     Where the first review and the Chinese reader differed (「零或一对一」), the Chinese reader's reading holds: the
     words are for a Chinese reader.
   - Applies to: `locale.mjs`, `guideText`.
4. What the text leaves out is the drawing's alone.
   - Rests on: the independent review of the Change, which read each kind's fields against the twelve guides.
   - Considered: every field of a document (the reader would read places, sizes and colours as content).
   - Chosen because: the text carries what the figure says; a subtitle, a relation's kind, an alert and an
     entity's tag say something, and are carried. Places, sizes, a line's variant, an icon, a state's or a
     component's type (its colour) and the sources of a sequence's participants (not listed) are left out.
   - Applies to: `figureText`.
5. A document the writers cannot read leaves the figure's line alone.
   - Rests on: the guide's files reach the reader file before Archify judges them for the page.
   - Considered: refusing the build here (a second judge of Archify's format).
   - Chosen because: Archify refuses what it cannot draw when the page is built; the reader file reads its lists
     as far as they go, and an item whose id repeats, or a line from an item no list names, is not lost silently.
   - Applies to: `figureText`, `normalized`.

## Risks / Trade-offs

- The reader file grows: the twelve published guides' text from 3710 lines to 5796 and from 1330 footnotes to 2012.
  A reader reads more, and reads every figure; the page keeps the drawings.
- A figure's text follows the fields Archify's kinds hold today. A kind this module does not know, or a document it
  cannot read, leaves the figure's line alone rather than writing a wrong text; a new field of a known kind is not
  written until its writer names it.
- Steps that walk a figure stand with its items, so a guide whose steps name one figure's items but mean a list of
  their own loses that list's shape; the steps' words stay, in their order.
