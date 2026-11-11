---
subject: architecture-publisher:glossary
role: reference
state: canonical
relations:
  governed_by: product-contract.md
---

# Glossary

The words Architecture Publisher uses, each with the reference that defines it.

| Term                 | Meaning                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceptance           | A named reviewer's record, `acceptance.json`, that one unchanged delivery is accepted. Only an accepted delivery is published. [Operations](reference/operations.md#acceptance-and-publication) |
| Architecture Model   | The JSON file that states a system's components, relations, views and the files that support them. The publisher draws only what it states. [Model](reference/model.md)                         |
| Balance gate         | One of four measures of a plate's blank space and centre of mass. A plate that misses one is recorded with its values, not refused. [Operations](reference/operations.md#layout-and-media)      |
| Claim                | A path in a component's `files`: a directory ending in `/` or one file. Each file belongs to its most specific claim. [Model](reference/model.md#files-and-the-repository)                      |
| Citation             | A file in a relation's `files` that evidences the relation, or a line range a guide cites at the model's revision. [Model](reference/model.md#files-and-the-repository)                         |
| Component            | One part of the system, with an id, a label, a kind, details and the files it claims. [Model](reference/model.md#components-and-relations)                                                      |
| Coverage             | The part of the repository the model describes, and how much of it the model's claims own. [Model](reference/model.md#coverage)                                                                 |
| Delivery             | The directory one build writes: the print edition, its images, the page and the manifest. [Operations](reference/operations.md#the-delivery)                                                    |
| Guide                | An Archify explainer draft the author writes for a work; the page delivers it in place of the generated page. [Model](reference/model.md#guide)                                                 |
| House class          | The Typst class that owns the edition's pages, faces, type sizes and palette; an overview composition places its text and figures with it. [Model](reference/model.md#overview)                 |
| Manifest             | `manifest.json`, the build record that binds the model, every cited file, every supply and every artifact by digest. [Operations](reference/operations.md#the-delivery)                         |
| Overview composition | A Typst file beside the model, named by `overview`, that sets one page of the edition after its contents. [Model](reference/model.md#overview)                                                  |
| Page                 | `<model id>.html`, the standalone interactive explainer: the guide, or one panel per view. [Operations](reference/operations.md#commands)                                                       |
| Plate                | One view drawn as one page of the print edition: its figure and its reading. [Operations](reference/operations.md#layout-and-media)                                                             |
| Print edition        | `<model id>.pdf`: a title page, contents, the overview and one plate per view, typeset by Typst. [Operations](reference/operations.md#layout-and-media)                                         |
| Publication root     | Any directory the reviewer names; `archpub publish` copies an accepted delivery to `<root>/<model id>/<version>/`. [Operations](reference/operations.md#acceptance-and-publication)             |
| Reading              | What a plate sets beside or above its figure: the view's summary and where each of its components lives. [Operations](reference/operations.md#layout-and-media)                                 |
| Re-pin               | Moving a model's `repository.revision` to a later commit after working through the check's re-pin worklist. [Model](reference/model.md#re-pinning)                                              |
| Relation             | A labelled, directed connection from one component to another, with the files that evidence it. [Model](reference/model.md#components-and-relations)                                            |
| Revision             | The full commit the model pins; the publisher reads and verifies every claimed and cited file there. [Model](reference/model.md#files-and-the-repository)                                       |
| Supply               | A bundled input, such as the fonts, the icons, Archify or the LikeC4 parser, verified by its digest before a build uses it. [Operations](reference/operations.md#installation)                  |
| Tier                 | A labelled row of a view, in reading order; a view of tiers draws its components band by band. [Model](reference/model.md#views)                                                                |
| View                 | One question about the system, answered by a chosen set of components; it becomes one plate and one panel of the page. [Model](reference/model.md#views)                                        |
| Work                 | One published architecture: a model, its overview and guide, and the deliveries built from it. [README](../README.md)                                                                           |
