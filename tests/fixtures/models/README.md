# Model corpus

The tests use these copies of real models to check that layout, posters and
the page hold for systems other than the ones the examples describe. Each file
is a frozen copy: it is not kept in step with its origin, and a test that
needs a newer copy replaces the file in its own change. Each was converted to
model version 2 with `archpub migrate`, which kept a file that several
components cited with the first of them.

| File                          | Origin                                                                                                                                          | Added                           | Why it is here                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `aigw.json`                   | The AIGW client projection model of `aigw-cli`, pinned at `68876f06`.                                                                           | `919360a`                       | A real control plane with numbered tiers and a one-to-many relation.             |
| `architecture-publisher.json` | This repository's own model from `editions/self/` at `009e84c`, pinned at `3bf75fd`.                                                            | `align-layout-with-positioning` | The publisher described by itself: long relations and three views.               |
| `browser-use.json`            | A model of `browser-use/browser-use` read from its source, pinned at `2cc71890`.                                                                | `3acddd3`                       | A repository unrelated to this one, authored outside it.                         |
| `context-mode.json`           | A model of `mksglu/context-mode` read from its source, pinned at `84357027`.                                                                    | `3acddd3`                       | A second unrelated repository, with dense label rows.                            |
| `ethos.json`                  | The ETHOS publication's model as it was published, without its sources.                                                                         | `2a742d9`                       | Its proof plane wires cleanly only on a page of its own.                         |
| `ethos-proof-plane.json`      | The overview and proof views of the ETHOS work at architecture-publications `19f8dac`, with their components and relations and without sources. | `publish-a-print-edition`       | Its proof plane prints only alone and sparse; narrower faces must not refuse it. |

The authoritative ETHOS, AIGW and Architecture Publisher models are works in
the architecture-publications repository; the copies here only feed the tests.
