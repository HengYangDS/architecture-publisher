---
subject: architecture-publisher:research-edition-map
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# The edition read as one map: how the item ended

A research page. It records the census of the twelve published editions at the end of the queue item `edition-map`,
and which Change and test hold each of its clauses. It decides nothing; the decisions are in the designs of the
item's Changes, the first of them `set-the-contents-and-the-index`.

## Question

Does each clause of `edition-map` hold on every published edition, and what holds it for a work not yet written?

## Short answer

Yes, on all twelve: every one of their 82 plates links back to the overview and prints its answer, and every view is
reached from its overview. Each clause is held for every work by a test of the product, and clause 6 also by a
refusal.

## What was measured

The twelve published works built from the publications' `dev` with the lane's publisher under one ticket
(`build/runtime/work/lane-kit/build-twelve.zsh`), each edition read from its PDF with `pdftotext`: a plate's page
found by its number and title on its first line, its line back by the arrow that opens it, its answer by its view's
summary (`lane-kit/census.py`), the views by the model's statement, and the room under the overview's last row from
its image. The scripts lie in the checkout's ignored `build/runtime/work/edition-map/` and `lane-kit/`.

| Edition                     | Plates | Line back | Answer printed | Views unreached | Room under the overview, pt |
| --------------------------- | ------ | --------- | -------------- | --------------- | --------------------------- |
| `aigw-client-en`            | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `aigw-client-zh`            | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `architecture-publisher-en` | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `architecture-publisher-zh` | 6      | 6 of 6    | 6 of 6         | none            | -1                          |
| `ddwg-en`                   | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `ddwg-zh`                   | 6      | 6 of 6    | 6 of 6         | none            | -2                          |
| `ethos-en`                  | 11     | 11 of 11  | 11 of 11       | none            | -3                          |
| `ethos-zh`                  | 11     | 11 of 11  | 11 of 11       | none            | -3                          |
| `filmkit-en`                | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `filmkit-zh`                | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `openai-responses-proxy-en` | 6      | 6 of 6    | 6 of 6         | none            | -3                          |
| `openai-responses-proxy-zh` | 6      | 6 of 6    | 6 of 6         | none            | -2                          |

## The clauses and what holds each

| Clause                                                                                          | Held by                                                                                             | Test                                |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| A plate's header names the part of the overview it enlarges, as a link back                     | `link-each-plate-back-to-the-overview`                                                              | `tests/plate-link-back.test.mjs`    |
| Every plate prints the answer to its question in one place                                      | `print-every-plate-its-answer`                                                                      | `tests/plate-answer.test.mjs`       |
| The overview in three sizes with fixed roles                                                    | `set-the-overview-in-three-sizes`                                                                   | `tests/overview-drawn.test.mjs`     |
| The contents apart from the plates' rows, further pages, rows of one height                     | `set-the-contents-and-the-index`                                                                    | `tests/edition-contents.test.mjs`   |
| The last page an index of the parts by name, with what the edition was built from               | `set-the-contents-and-the-index`                                                                    | `tests/edition-index.test.mjs`      |
| Every view reached from the overview                                                            | the publications' `reach-every-view-from-the-overview`; `refuse-a-view-the-overview-does-not-reach` | `tests/overview-plates.test.mjs`    |
| A fact stated once a page                                                                       | `state-each-fact-once-a-page`                                                                       | `tests/page-facts-once.test.mjs`    |
| A note in a narrow column breaks between the words of its script; no justified line spread wide | `justify-a-narrow-note-to-its-own-measure` and the overview's line breaking                         | `tests/overview-justified.test.mjs` |

## Not established

- Whether a reader finds the edition a map: the census reads what the pages print, not how they are read; the
  owner's reading is the acceptance.
- The room under the overview is read from its image against a limit the census assumes (850 pt): a few points
  below zero are the last row ending within the foot that the product's own check holds.

## Record

2026-11-24, the holder of the lane. The census's output lies in the lane's work directory,
`build/runtime/work/edition-f/run/`.
