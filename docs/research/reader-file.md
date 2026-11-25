---
subject: architecture-publisher:research-reader-file
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# The reader file read as a document

A research page for the queue item `reader-file`. It records what a reader met in the reader file as 0.19.0 writes
it, what others do with one Markdown file for readers and agents, what Archify's parser gives of a guide, what a
second reader found in a sample, and the committee that chose the form. It decides nothing; the decisions are in the
designs of the item's Changes.

## What the reader file held

Film Kit's Chinese reader file, built by 0.15.0 (740 lines, 76 KB): two first-level headings; 125 lines of the
guide's syntax (`@source`, `@diagram` and the like) shown as paragraphs; 152 empty citation links; 21 marks of the
guide's syntax in running text; and English keys in a Chinese file: `files` 241, `measured` 100, `stated` 97,
`relation` 77, `cited` 61, `component` 50. Across the twelve published guides (read 2026-11-25): 1346 `@source`
lines and 1974 empty citation links. The generated part read as nested lists of keys, and the guide's draft followed
as a second document with its own title.

## What others do

One convention claims one Markdown file for a reader, a model and a parser at once: `llms.txt` (an H1, a summary,
then sections of links). The others separate the readers: `AGENTS.md` beside a README; Mintlify by blocks for one
audience or the other; Vercel and Cloudflare serve agents Markdown with English-keyed front matter and a prose body.
No lint rule finds a link with empty text: markdownlint's MD042 reports an empty destination. A read-only agent's
report of 2026-11-20 collected these from the sources; nothing was rendered for it.

## What Archify's parser gives

`explainer/parse.mjs` in Archify 3.3.0 exports `parseExplainer`, which returns the draft as Archify's explainer
document: an answer, panels with typed blocks (`prose`, `facts`, `steps`, `comparison`, `callout`, `diagram`, `code`,
`list`) and sources with path and lines. On Film Kit's English guide: 10 panels, 123 sources; 12 prose, 8 diagram, 7
steps, 4 callout, 3 facts, 2 comparison and 1 code block. It keeps no title of a diagram; the draft's directives
name it. Run in a child process under Node's Permission Model, reading only the verified Archify supply, as the
publisher already runs the LikeC4 parser, it reads a guide in well under a second.

## A sample, read by a second reader

The guide's part of Film Kit in both languages, written from that parse as plain Markdown: 305 lines each, 30.8 KB
(English) and 16.1 KB (Chinese) against the drafts' 47.0 and 46.6 KB, with no `@` line, no anchor mark and no link
without text. A second reader of the Chinese sample (2026-11-25) found the prose and the citations sound and 17
problems. The largest: every figure was reduced to one line while the text still points at it, and a timeline's 24
events, an entity diagram's entities and relations and a tree's items were lost. Others: tables without a header,
citations not in order (`[39][3][40][41]`), the steps of a diagram of parts numbered as if they were a sequence, a
verdict put before the text it qualifies, and no pin named for the sources' lines. All but the figures' content are
answered in the first Change; the figures' content is a Change of its own.

## The committee

Three members (the product's position, engineering and checks, agents as readers) answered one brief independently
on 2026-11-25. Each chose to give the machine layer to the data file and write the reader file as a document: keys
in each language with a parse per language would make five formats, and keys kept as a shared code miss the item's
words. Each named one risk: the prose drifting from the data, guarded by writing every number from the data and
keeping the check of the items' ids. The agents' member asked for English-keyed front matter; the product's member
held to the item's "names of its fields in the model's language", which the ruling kept: the head states identity,
pin and digest as prose with code, and the data holds them keyed. All three put the figures' content in a later
Change of the same item.

## Limits

The sample was read by one reader, in one language. No Markdown viewer was opened for it; the form is held by a
check of the text, not by a rendering. The agents' member's view is a model's, not a measured agent task.
