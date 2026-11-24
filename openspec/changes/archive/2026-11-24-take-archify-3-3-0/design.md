## Context

See [proposal.md](proposal.md). The supply holds part of Archify's release archive: the renderers, schemas and
runtime the publisher calls (`validate architecture`, `validate explainer`, `finalize explainer`). The kit that takes it
lies in the checkout's ignored `build/runtime/work/archify-3-3-0/`.

## Goals / Non-Goals

**Goals:**

- The supply is 3.3.0's own files, as the release archive holds them.
- What each published work's page changes is read before the Change lands.

**Non-Goals:**

- The reviews' code findings of 2026-11-24, in a Change after this one.

## Decisions

1. The supply's files are found from 3.2.0's by their static imports, followed to the end.
   - Rests on: run on 3.2.0's archive, the same rule gives exactly 3.2.0's 120 files.
   - Considered: the whole archive, which adds the code analysis, story, PR and website modules the publisher never
     calls.
   - Chosen because: it keeps the supply's scope as written and needs no judgement per file.
   - Applies to: `renderers/archify/supply/`.
2. Six modules that are only loaded by `import()` stay out.
   - Rests on: `finalize` loads a code-analysis module only for an `architecture` diagram, inside a `try`; the others
     serve `start`, `story`, `pr` and `export-svg`, which the publisher does not run.
   - Considered: holding them, which adds code analysis to the package.
   - Chosen because: the publisher calls `finalize` for an explainer only.
   - Applies to: `renderers/archify/supply/`.
3. The publisher's license stays MIT; Archify's Apache-2.0 travels with its files.
   - Rests on: Apache-2.0 § 4 asks a redistributor to keep its license and NOTICE, and to mark changed files; no file
     is changed.
   - Considered: naming the package `MIT AND Apache-2.0`.
   - Chosen because: the package's license field names the publisher's own code, as it did with MIT Archify and the
     other supplies, and each supply states its own.
   - Applies to: `renderers/archify/supply/`, `package.json` (unchanged).

## Risks / Trade-offs

- Every page gains Archify's footer panel: a GitHub star prompt and a feedback menu that sends a reader's report to
  Archify's maintainer, about a page whose content is the work's. A draft's `@meta feedback_links=false` turns it off,
  and 3.2.0 refuses that argument, so the publications set it when they move to the release that bundles 3.3.0; no
  published page shows the panel. Whether a page the publisher generates sets it is the queue item `page`'s to decide.
- Beyond the panel, a page differs as 3.3.0 draws it: its diagrams are redrawn (larger smallest text), and reader
  styles and a software-notices block are added; its visible text loses nothing, read on all twelve works.
- A test held a fact of 3.2.0's routes: every candidate of Big Bank's tiered view misread, and the view took one
  that misread once. 3.3.0 routes a candidate that reads clean; the test now holds that the view takes it, and no
  fixture of the suite now has every candidate misread.
- A very large diagram that 3.2.0 ranked may now be refused for its crossing check's budget, and a new refusal
  guards a page's inputs; none of the twelve works meets either.
