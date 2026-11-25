## Context

See [proposal.md](proposal.md). The research is `docs/research/reader-file.md`; the kit in the checkout's ignored
`build/runtime/work/reader-file/` (`copy/`, `committee/`, `sample/`).

## Goals / Non-Goals

**Goals:**

- A reader at a Markdown viewer reads the reader file as one document in the model's language, and an agent finds
  each statement, fact and source in it and in the data.

**Non-Goals:**

- A figure's content as text: a later Change of the item (the committee, all three).
- Front matter: the item's words ask for the fields in the model's language.

## Decisions

1. The data is the one machine source; the reader file is written from it and read back for its items' ids alone.
   - Rests on: `docs/research/reader-file.md`, the committee's three answers; the three parses of the file each
     compared it with what the data already holds.
   - Considered: each language's words parsed back (five formats); keys kept as a shared code (misses the item).
   - Chosen because: one source and one format; the ids are still checked, by the words of the language.
   - Applies to: `readerFile`, `readerIds`, `requireReaderIds`, `requireProjections`, `pinnedEdition`.
2. The guide as Archify reads it.
   - Rests on: Archify's `parseExplainer` returns the draft's answer, panels, typed blocks and sources; the
     publisher already runs a vendored parser this way (`src/importers/likec4.mjs`).
   - Considered: a parse of the draft's syntax by the publisher (a second reading of Archify's format); the draft
     as it is (the item refuses its syntax).
   - Chosen because: one reading of the guide, Archify's, with no vendor file changed.
   - Applies to: `guide-parse.mjs`, `guide-parse-worker.mjs`, `guide-text.mjs`, `guideOf`.
3. Citations as footnotes, the pin named once; a figure by its title and file; steps numbered for a flow alone; a
   comparison's verdict after its text; a checklist with its boxes; two lists in a row with two markers.
   - Rests on: the second reader's findings on the sample (`docs/research/reader-file.md`), and the Change's second
     review, which found a viewer joining facts and a checklist into one list.
   - Considered: numbered references listed under a heading (not linked; unsorted at one place); an HTML comment
     between two lists (a mark of another language).
   - Chosen because: GitHub renders footnotes as links with a way back, and a viewer without them still reads them.
   - Applies to: `guideText`.
4. A draft Archify refuses is refused in every build.
   - Rests on: every delivery holds a reader file, and its guide part is Archify's parse.
   - Considered: a reader file without the guide when the parse fails (a silent loss).
   - Chosen because: a guide the page cannot be built from is a defect of the input, which an edition-only build
     would otherwise carry unseen. Three test fixtures whose drafts Archify refused were given a panel.
   - Applies to: `parsedGuide`.

## Risks / Trade-offs

- Breaking for a reader of the delivery's format: the reader file's words differ in each language, and its guide
  part is no longer the draft. The data holds every key a program reads; the format moves to 9.
- The guide's figures are named, not shown, until the item's next Change; the text may point at a figure the file
  does not draw. The reader file says that a guide's diagram documents are not carried.
- A Spanish and a Korean reader read no sample; their words follow the existing reader words of those languages.
