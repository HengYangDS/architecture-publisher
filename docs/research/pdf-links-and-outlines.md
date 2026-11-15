---
subject: architecture-publisher:research-pdf-links
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Links and outlines in the PDFs Typst writes

A research page. It records what was measured of the links Typst writes into a PDF and what is not proved. It
decides nothing; the decision that rests on it is named under "What follows".

## Question

On 2026-11-15, having chosen two PDF forms of the edition from one source, the owner said:

> 「而且 pdf 版应该做好跳转链接吧」

Gloss, made for this page: "And the PDF edition should have its jump links done properly."

What does Typst, the typesetter the edition is set with, write into a PDF for a link inside one file, for the
headings' outline, for a link to another PDF and for a link to the web; and which of these can an edition rely on?

## Short answer

- A link to a label in the same file is a GoTo action with a destination; headings become an outline. Both measured.
- A link to the web is a URI action. Measured.
- A link to another PDF becomes a URI action with the relative file name; a viewer following it is **not proved**.
- Until a test on named viewers passes, cross-file pointers are printed as page numbers and ids.

## What was measured

One measurement, on 2026-11-15, with Typst 0.15.1, the version the edition is set with. Fixture files were compiled
and the objects of the resulting PDFs counted. The working note gives the counts and does not say with which tool
they were read; the fixtures lay in a temporary directory outside the repository.

| Written in Typst             | Written into the PDF as                     | Proved                                                           |
| ---------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `#link(<label>)` in one file | A GoTo action with a `/Dest`                | Yes: 7 `/Dest` in a two-link file                                |
| Heading outline              | `/Outlines`                                 | Yes: 2 outlines                                                  |
| `#link("other.pdf#page=3")`  | A `/URI` action with the relative file name | Compiles; no `/GoToR`; whether a viewer follows it is not proved |
| `#link("https://…")`         | A `/URI` action                             | Yes                                                              |

No viewer was used. The working note cites no documentation of Typst and no PDF specification.

## Findings

- Links inside one file and the outline are ordinary PDF features, written as the format's own destinations and
  outline entries.
- The form tried for a link into another PDF, a string with the relative file name and a fragment, is written as a
  URI action, the same kind of action as a web address. The working note reports no other form.
- What a viewer does with a URI action that names a relative file was not observed on any viewer.

## What was compared

| Way for one PDF to point into another                                  | For                                              | Against                  |
| ---------------------------------------------------------------------- | ------------------------------------------------ | ------------------------ |
| A link with the relative file name (what Typst writes as a URI action) | Compiles with Typst 0.15.1                       | Not proved on any viewer |
| The target printed in words and numbers (page number, statement id)    | Depends on no viewer                             | Nothing recorded         |
| Both: a link that also prints its target                               | The ruling's choice: nothing depends on a viewer | Nothing recorded         |

The committee's ruling R9 takes the third: a link across files also prints its target in words and number, so that
nothing depends on a viewer. One seat adds that projected pages have no links.

Decision D4 of the same day first added that Acrobat and most desktop viewers follow a relative-file URI and that
browser viewers often block it. That was the chair's expectation, tested on no viewer, and it was withdrawn as a
statement of fact on 2026-11-16. What stands in both records is that the link is not proved on any viewer.

## What follows, and where it applies

Decision D4, taken by the chair on 2026-11-15 and kept in `build/runtime/work/style-research/round-5/DECISIONS.md`
(ignored, local) until it enters a Change's design, rests on this measurement. It takes, as a property the build
checks, for every edition: an outline whose entries are the book's parts and each page's claim; a contents page with
a link to every page; every internal cross-reference a link; every statement id a destination, so that the booklet
and the presentation can point at the same id; and the external links (the repository's files at the pin) as
absolute URLs where the viewer can reach them. It goes to the queue item `blocks-by-question` (the page classes and
their pointers), to a maintenance item for the interactive page's cross-links, and to the build's own check for the
outline and the destinations.

It applies to the two PDF forms of the edition. Until the viewer test passes, cross-file pointers are printed as
page numbers and ids.

The test still to make, on named viewers (Acrobat, Preview, Chrome, Firefox, an e-reader app): a link from the
landscape edition to the portrait booklet, back, and to the interactive page; the outline's entries; a statement id
as a destination reached from both files.

## Not established

- Whether any viewer follows a link from one PDF into another as Typst writes it. The second proof's review of
  2026-11-16 repeats it: no viewer has followed a link from one file into the other.
- Any version of Typst other than 0.15.1: only that one was measured.
- PDF reading order and accessibility, which the dissent to the committee's draft lists as unsettled together with
  internal against cross-file destinations.
- How the counts were read from the PDFs.

## Record

Measured 2026-11-15 by the queue's holder. Working material: `build/runtime/work/tidy/pdf-links-test.md` and decision
D4 in `build/runtime/work/style-research/round-5/DECISIONS.md`, both ignored and local to one checkout. Written up
for this directory on 2026-11-16 by the author of the documents lane, and brought in line the same day with decision
D4 as amended.
