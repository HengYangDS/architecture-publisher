---
subject: architecture-publisher:glossary
role: reference
state: canonical
relations:
  governed_by: product-contract.md
---

# Glossary

The words Architecture Publisher uses, each with the reference that defines it.

| Term               | Meaning                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceptance         | A named reviewer's record that one unchanged delivery is accepted. Only an accepted delivery is published. [Operations](reference/operations.md#acceptance-and-publication)                                    |
| Architecture Model | The JSON file that states a system's components, relations, views and the files that support them. The publisher draws only what it states. [Model](reference/model.md)                                        |
| Balance gate       | One of the measures of a plate's blank space and centre of mass. A plate that misses one is recorded with its values, not refused. [Operations](reference/operations.md#layout-and-media)                      |
| Claim              | A path in a component's `files`: a directory ending in `/` or one file. Each file belongs to its most specific claim. [Model](reference/model.md#files-and-the-repository)                                     |
| Citation           | A file in a relation's `files` that evidences the relation, or a line range a guide cites at the model's revision. [Model](reference/model.md#files-and-the-repository)                                        |
| Component          | One part of the system, with an id, a label, a kind, details and the files it claims. [Model](reference/model.md#components-and-relations)                                                                     |
| Coverage           | The part of the repository the model describes, and how much of it the model's claims own. [Model](reference/model.md#coverage)                                                                                |
| Data               | The pinned edition written once, as JSON in the format its schema states. [Data](reference/data.md#the-data)                                                                                                   |
| Data face          | What a plate drew, by id: each component, group and relation with its box or its path in the plate's drawing space, as the drawing reports it. [Data](reference/data.md#a-plates-record-and-face)              |
| Delivery           | The directory one build writes; the operations reference lists each of its files with what it holds. [Operations](reference/operations.md#the-delivery)                                                        |
| Evidence table     | The data's one list of every path the model claims or cites and the guide cites, with its state, digest, owner, citing relations and cited ranges. [Data](reference/data.md#the-evidence-table)                |
| Guide              | An Archify explainer draft the author writes for a work; the page delivers it in place of the generated page. [Model](reference/model.md#guide)                                                                |
| House class        | The Typst class that owns the edition's pages, faces, type sizes and palette; the publisher sets the title, contents, overview and index pages with it. [Operations](reference/operations.md#the-overview)     |
| Manifest           | The build record that binds the model, the data, every supply and every artifact by digest; the record of each cited file stands in the data. [Operations](reference/operations.md#the-delivery)               |
| Overview statement | What a model states in `overview`: a claim, a lead, a course of steps and stations, and blocks of facts, with no position; the publisher draws the page from it. [Overview](reference/overview.md)             |
| Page               | The standalone interactive explainer: the guide, or one panel per view. [Operations](reference/operations.md#commands)                                                                                         |
| Part               | A component or a group as a plate draws it: one card of its name, the strip of the files it owns, its kind and count and, where the plate has room, its details. [Model](reference/model.md#parts-and-palette) |
| Pinned edition     | One work at one pin as the build holds it: the model's statements, the facts measured there and the files they rest on. The data writes it once. [Data](reference/data.md)                                     |
| Plate              | One view drawn as one page of the print edition: its figure and its reading. [Operations](reference/operations.md#layout-and-media)                                                                            |
| Print edition      | A title page, contents, the overview, one plate per view and an index of the parts, typeset by Typst. [Operations](reference/operations.md#layout-and-media)                                                   |
| Publication root   | Any directory the reviewer names; `archpub publish` copies an accepted delivery to `<root>/<model id>/<version>/`. [Operations](reference/operations.md#acceptance-and-publication)                            |
| Reading            | What a plate sets beside or above its figure: the view's summary and where each of its components lives. [Operations](reference/operations.md#layout-and-media)                                                |
| Reader file        | The pinned edition as a document in the model's language: one item per statement under its id, then the guide as prose. [Data](reference/data.md#the-reader-file)                                              |
| Re-pin             | Moving a model's `repository.revision` to a later commit after working through the check's re-pin worklist. [Model](reference/model.md#re-pinning)                                                             |
| Relation           | A labelled, directed connection from one component to another, with the files that evidence it. [Model](reference/model.md#components-and-relations)                                                           |
| Revision           | The full commit the model pins; the publisher reads and verifies every claimed and cited file there. [Model](reference/model.md#files-and-the-repository)                                                      |
| Supply             | A bundled input, such as the fonts, the icons, Archify or the LikeC4 parser, verified by its digest before a build uses it. [Operations](reference/operations.md#installation)                                 |
| Tier               | A labelled row of a view, in reading order; a view of tiers draws its components band by band. [Model](reference/model.md#views)                                                                               |
| View               | One question about the system, answered by a chosen set of components; it becomes one plate and one panel of the page. [Model](reference/model.md#views)                                                       |
| Work               | One published architecture: a model, its overview and guide, and the deliveries built from it. [README](../README.md)                                                                                          |
