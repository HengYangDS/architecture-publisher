---
subject: architecture-publisher:research-page-weight
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# The weight of the page in a browser: what it carries

A research page. It records a measurement taken on 2026-11-21 of the pages in a browser that Architecture Publisher
0.16.0 built for the twelve editions of the six published works: how large each page is and what makes it up. It
decides nothing; the decision that rests on it is in the design of a Change of the queue item `page`.

## What was asked

On 2026-11-21 the owner asked for the opportunities to improve the product from the side of its developers, its
readers and the agents that use it. A page in a browser of 4 to 12 MB was the largest of those found for a reader.

## How it was read

Each delivery's page, `<model id>.html`, was read as text. Its largest script holds the explainer's prepared bundle
as JSON, the form Archify v3.2.0 (`208acba8`, the version the publisher bundles) writes. Within the bundle were
counted: the base64 of every `dependencies` entry of kind `repository` (`contentBase64`), the same counted once for
each distinct `sha256`, and the base64 of every diagram's `htmlGzip`. Archify's own sources were read where it
writes and reads them (`explainer/prepare.mjs`, `check.mjs`, `page-bundle.mjs`, `reader.js`); the three modules of
the explainer are byte for byte those of Archify's `main` at `8509a3d6` on 2026-11-21.

## What was found

| Delivery                  | Page, MB | Citations | Files cited | Files embedded, MB | Each file once, MB | Explore views, MB | Repeats, share of the page |
| ------------------------- | -------- | --------- | ----------- | ------------------ | ------------------ | ----------------- | -------------------------- |
| aigw-client-en            | 9.3      | 112       | 38          | 5.1                | 0.8                | 2.5               | 46%                        |
| aigw-client-zh            | 9.2      | 112       | 38          | 5.1                | 0.8                | 2.5               | 46%                        |
| architecture-publisher-en | 10.6     | 147       | 42          | 5.4                | 0.9                | 3.0               | 42%                        |
| architecture-publisher-zh | 10.5     | 147       | 42          | 5.4                | 0.9                | 3.1               | 43%                        |
| ddwg-en                   | 4.1      | 72        | 31          | 1.2                | 0.4                | 1.7               | 21%                        |
| ddwg-zh                   | 4.1      | 72        | 31          | 1.2                | 0.4                | 1.7               | 21%                        |
| ethos-en                  | 6.8      | 93        | 38          | 2.6                | 0.8                | 2.5               | 26%                        |
| ethos-zh                  | 6.7      | 93        | 38          | 2.6                | 0.8                | 2.5               | 26%                        |
| filmkit-en                | 11.7     | 123       | 61          | 7.5                | 1.4                | 2.2               | 52%                        |
| filmkit-zh                | 11.6     | 123       | 61          | 7.5                | 1.4                | 2.2               | 52%                        |
| openai-responses-proxy-en | 8.2      | 122       | 47          | 3.7                | 0.9                | 2.5               | 35%                        |
| openai-responses-proxy-zh | 8.1      | 122       | 47          | 3.7                | 0.9                | 2.5               | 36%                        |

- The bundle holds one `dependencies` entry for each citation of a repository file, and each entry carries the whole
  file. A file cited many times stands in the page as many times: in Film Kit's page one changelog of 141 KB stands
  once for each history entry that cites it.
- Each file once would take 21% to 52% off each page and change nothing a reader sees: every entry would still be
  verified against the bytes its `sha256` names.
- `htmlGzip` is each diagram's native viewer, compressed, which the page inflates when a reader opens "Explore"
  (`page-bundle.mjs`). It is the feature itself, not a second copy of the page.
- The format belongs to Archify: `check.mjs` verifies each entry's own content, so the publisher cannot share one
  content between entries without changing what Archify writes and reads. The proposal to Archify is its issue 1426
  (tt-a1i/archify), posted 2026-11-21.

## What follows, and where it applies

The page's weight is a fact of the published works that the publisher can measure in every delivery. Until Archify
stores a cited file once, the repeats stay; the rest of the page is what its reader uses.

## What is not established

- The time a reader waits for a page of this size on a given connection; nothing here measures loading.
- Whether Archify takes the proposal, and in what form.
- The pages of the editions built after 0.16.0.
