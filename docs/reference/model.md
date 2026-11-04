---
subject: architecture-publisher:model
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Model reference

An Architecture Model is one JSON file that describes the architecture to
publish: its components, the relations between them, how the reader sees them,
the repository files each component owns and the files that support each
relation. A person or an agent writes
it, or `archpub import likec4` converts a LikeC4 workspace into one. The
publisher never infers architecture from code; the model is the only source of
meaning.

The machine-readable schema is
[`src/model/schema.json`](../../src/model/schema.json).
`archpub check` validates a model, reports every problem with its JSON path in
one pass and builds nothing.

## A minimal model

This is the smallest model the schema accepts. It builds, but three components
cannot fill a 16:9 page, so its poster is a sparse page and the manifest
records the balance gates it misses. The
[Big Bank example](../../examples/big-bank/README.md) is a larger model with
kinds, details and views.

```json
{
  "format": "architecture-publisher.model",
  "version": 2,
  "id": "shop",
  "title": "Shop",
  "question": "How does an order reach the warehouse?",
  "components": [
    { "id": "web", "label": "Web shop", "kind": "frontend" },
    { "id": "orders", "label": "Order service", "kind": "service" },
    { "id": "db", "label": "Order store", "kind": "store" }
  ],
  "relations": [
    { "id": "web-orders", "from": "web", "to": "orders", "label": "places orders" },
    { "id": "orders-db", "from": "orders", "to": "db", "label": "writes" }
  ],
  "kinds": {
    "frontend": { "label": "web application", "category": "frontend" },
    "service": { "label": "service", "icon": "server" },
    "store": { "label": "database", "category": "database" }
  }
}
```

## Top-level fields

| Field         | Required | Meaning                                                                                      |
| ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `format`      | yes      | Always `architecture-publisher.model`.                                                       |
| `version`     | yes      | Always `2`; `archpub migrate` converts a version 1 model.                                    |
| `id`          | yes      | Model id; names the published directory, so a Windows device name or a final `.` is refused. |
| `locale`      | no       | The language the model is written in: `en` (default), `zh-CN`, `zh-TW`, `es`, `ko`.          |
| `title`       | yes      | Poster title, and the title of any view without its own.                                     |
| `question`    | yes      | The question the model answers: under the first poster's title and heading the page.         |
| `summary`     | no       | A short answer printed under the question on the first poster; the page's conclusion.        |
| `scope`       | no       | What the model covers and leaves out; in the poster notes and the page scope.                |
| `limits`      | no       | Known limits of the description, each one text; printed with the scope.                      |
| `attribution` | no       | Who wrote the model; printed with the scope.                                                 |
| `repository`  | no       | The described repository: `name`, optional `url` and the full commit `revision`.             |
| `kinds`       | no       | Kind catalog keyed by kind id.                                                               |
| `components`  | yes      | At least one component.                                                                      |
| `relations`   | yes      | Relations between components; may be empty.                                                  |
| `groups`      | no       | Named sets of components.                                                                    |
| `views`       | no       | Any number of views; without them the publisher plans the views itself.                      |
| `coverage`    | no       | The repository paths the model describes and those it leaves out, for `archpub check`.       |
| `overview`    | no       | The overview composition: a Typst file beside the model that sets its work's overview page.  |
| `guide`       | no       | The guide: an Archify explainer draft beside the model, delivered as the work's page.        |

Ids match `^[a-z0-9][a-z0-9._-]{0,127}$`. Text is non-blank and at most 2000
characters. A model file is at most 4 MiB. Unknown fields are refused, so a
misspelt field never disappears silently.

## Language

`locale` names the language the model's own text is written in. The publisher
sets the few words it writes itself in that language: the headings of a
poster's notes, the legend's boundary and status entries, the details it
derives for an overview, and how it joins details, lists and sentences. The
page declares the language to Archify, whose controls and viewer then speak it.
Text in Latin, Greek, Cyrillic, Han, Kana and Hangul can be set; text in a
right-to-left or shaped script, such as Arabic, Hebrew or Devanagari, is
refused with `script_unsupported`, since the posters outline glyph by glyph
without shaping. Lines break at spaces, and between Han and Kana characters,
with closing punctuation kept on the line before. A no-break space, such as
U+00A0 between `60` and `s`, keeps the words beside it on one line.

## Components and relations

A component has an `id`, a `label` and optionally a `kind`, `details`, a
`status` and `files`. A relation has an `id`, `from` and `to` component ids,
a `label` and the same optional `details`, `status` and `files`. A relation
may not connect a component to itself.

- `details` maps a short name to text or a list of texts, such as
  `{ "technology": "Go", "owns": ["accounts", "tokens"] }`. Names are at most
  64 characters, contain no colon and are not plain numbers. A component's
  details are printed on its poster card; on the page, its diagram card shows
  the first detail it holds whole, or none, and its step lists every detail. A
  relation's details are printed under its label. The manifest's evidence lists
  every detail.
- `status` is `implemented`, `planned` or `retired`. On posters, planned
  components and relations are drawn dashed and retired ones dotted and muted;
  on the page, planned and retired relations are dashed.
- A component's `files` are the repository paths it owns, and a relation's
  `files` are the files that evidence it; see
  [Files and the repository](#files-and-the-repository).

## Kinds

Each kind has an optional `label`, `category` and `icon`. A kind the catalog
does not declare is a `backend` kind labelled with its id, and a component
without a kind is a `backend` component.

| Category     | Drawn as                                              |
| ------------ | ----------------------------------------------------- |
| `person`     | Outside the system boundary; Archify's external type. |
| `external`   | Outside the system boundary.                          |
| `frontend`   | Archify's frontend type.                              |
| `backend`    | Archify's backend type; the default.                  |
| `database`   | Archify's database type.                              |
| `cloud`      | Archify's cloud type.                                 |
| `messagebus` | Archify's message bus type.                           |
| `security`   | Archify's security type.                              |

`icon` names any icon in the bundled Lucide 1.66.0 artwork, such as `server` or
`database`; each category has a default. An unknown icon is refused.

## Files and the repository

A component claims the repository paths it owns in `files`: a path ending in
`/` names a directory and any other path one file. A path is relative, holds no
glob and is claimed by one component only. A component may claim nothing, as a
person or an outside system does.

```json
"components": [
  { "id": "cli", "label": "Command line", "files": ["src/cli/"] },
  { "id": "credentials", "label": "Credential helper", "files": ["src/cli/credential/", "docs/credentials.md"] }
]
```

A file belongs to the component whose claim is most specific: a claim of the
file itself, otherwise the deepest claimed directory that holds it. Above,
`src/cli/credential/read.mjs` belongs to `credentials` and `src/cli/main.mjs`
to `cli`, whatever order the claims are written in. A relation cites, in
`files`, the files that evidence it, such as the modules that import the other
component; each names one file.

With `--repo <checkout>`, `archpub check` and `archpub build` read the files at
`repository.revision` through Git without fetching, prompting or changing the
checkout. Each file in the [coverage scope](#coverage) goes to its owner, and
every owned file and every file a relation cites is recorded in the manifest
with its digest, its owner and the relations that cite it; that record is the
edition's lock. A claim that owns no file in the scope, because the scope leaves
its files out, none exists or deeper claims take them all, or a relation file
the revision lacks, refuses the build with its JSON path. Without `--repo`, every
declared path is recorded as unverified.

When the model also declares `repository.url`, the page cites each component's
first file at that URL and revision: the first file of its first claim, in
path order within a directory. Archify does not cite a file of a sensitive
class, such as a path with a `secrets` segment; the page withholds such a file,
cites the component's next one and records the withheld file in the manifest.

A revision cannot name the commit that contains it, so a model kept in the
repository it describes pins an earlier commit.

### From version 1

A version 1 model listed its files in a `sources` catalog that components and
relations cited by id. `archpub migrate <model> --out <file>` writes it as
version 2: each component claims the files it cited, in their order, and each
relation cites its sources' files. A file that several components cited stays
with the first of them, and the command names it. Folding files into directory
claims is then the author's choice, since a directory also takes the files no
source named.

## Coverage

`coverage` declares the part of the repository the model describes:

```json
"coverage": {
  "include": ["src/"],
  "exclude": [{ "path": "src/vendor/", "reason": "Vendored code, not this system's architecture." }]
}
```

`include` lists repository paths; a path ending in `/` is a directory and any
other path is one file. A path holding `*`, `?` or `[` is a glob: `*` matches
within one path segment, `**` any number of segments, and `?` and `[…]` one
character, so `**/*_test.go` leaves out the tests that live beside the code.
Without `include`, the scope is the whole repository. `exclude` lists paths the
model leaves out, each with a reason. A path is relative, has no empty, `.` or
`..` segment and appears once across both lists.

```json
"coverage": {
  "include": ["cmd/", "internal/"],
  "exclude": [{ "path": "**/*_test.go", "reason": "Tests beside the code." }]
}
```

With `--repo`, `archpub check` reads the files at `repository.revision` and
reports how many of them, and how many of their bytes, are in the scope, owned
by a component, uncovered or excluded; the files relations cite outside the
scope; the declared paths that match no file; and the largest directories that
hold uncovered files and no owned one. Git matches each glob at that revision,
case-sensitively on every platform. With `--against <revision>`, it also
reports the first-parent commits since the model's revision and whether each
cited file is unchanged, modified, moved, with its new path, or deleted, as
Git's rename detection reads them. The report never refuses a model; deciding
what to claim stays with its author.

## Re-pinning

Before moving `repository.revision` to a later commit, check the model with
`--against <commit>`. Beside the currency counts, the check reports a re-pin
worklist from the model's claims resolved at both commits:

- each component's owned files that are modified, moved, with the component
  their new path falls to, or deleted, and the files its claims take in;
- each relation's cited files that changed;
- the claims that would own no file and the relation files that would be gone,
  which a build at the later commit refuses;
- the files of the scope that newly fall under no claim;
- for a model that names a guide, each line range its draft and diagrams cite:
  the same, shifted with its range at the later commit, moved with its file,
  touched when a change falls within its lines, or gone.

Archify checks only that a cited range exists, so after a re-pin a shifted
citation would cite other text: move it to its new range, and reread every
touched one. The JSON result holds the worklist in `coverage.currency.worklist`,
and it never refuses the check.

## Overview

`overview` names the work's overview composition: a Typst file, relative to the
model and within its directory, that sets one 16:9 page with the publisher's
house class. The page is designed for the work, as a document is written in a
document class; the class owns the page, the faces, the four type sizes and the
palette, and the composition places the work's own figure and text:

```typst
#import "/archpub/house.typ": *
#show: overview

#masthead([Shop], [Orders reach the store through one gateway], [How a request moves.])
#head(48pt, 140pt, [The request path])
#tx(48pt, 170pt, label-of("gateway"), weight: "semibold")
#dl(48pt, 200pt, 90pt, 600pt, (([Gateway], [checks the session]), ([Store], [keeps the orders])))
#imprint([Every view, step by step, is in the interactive page.])
```

The class provides `masthead` and `imprint`, which print the model's title, its
revision and, with `--repo`, the revision's commit date; `head`, `tx`, `txr` and
`txc` for text at a baseline, `dl` for definition lists, and `seg`, `ring`,
`disc`, `tick` and the arrowheads for lines and stations. Sizes are `title`,
`head`, `text` and `small`; colours are the class's `ink`, `green`, `mid`,
`soft`, `rule` and `ochre`. `label-of("<id>")` prints a component's label from
the model and refuses an id the model lacks. A composition may not import a
package, load a plugin, or set a size, face, colour or the page itself; the
[operations reference](operations.md#the-overview) lists the checks on the
typeset page.

## Guide

`guide` names the work's guide: an Archify
[explainer draft](https://github.com/tt-a1i/archify/blob/v3.2.0/archify/references/explainer-authoring.md), a Markdown file ending
in `.archify.md`, relative to the model and within its directory. The page
delivers the guide in place of the page the publisher generates. A guide is
written for its work: a conclusion and its reasons, then one panel per question
in the form that fits it, such as an architecture diagram, a sequence, steps
that walk a diagram, a table, a chart, a callout, a checklist or an excerpt of
the repository's code at the model's revision. Keep the guide and the files it
names in a directory of their own:

```text
model.json
guide/
  guide.archify.md
  parts.architecture.json
```

```md
# How does an order reach the store? {#shop}

The gateway checks the session and hands the order to the service.[](source:gateway)

@meta locale=en
@source gateway title="The gateway" path="src/gateway.js" lines=10:30

## Which parts take part? {#parts}

@diagram architecture id=parts-map source=parts.architecture.json title="The request path"
```

A draft names local files only in `@diagram source=`, `@chart data=` and
`@image path=`, each a regular file in the draft's own directory. A draft's
`@meta`, when it names `repo_url` or `repo_revision`, names the model's
repository URL and revision. `archpub scaffold guide` writes the page the
publisher generates as a starting guide, and the
[operations reference](operations.md#the-guide) describes how a guide is checked
and delivered.

## Groups

A group has an `id`, a `label` and the component ids of its `members`. A
component belongs to at most one group, and a group id may not equal a
component id. Groups shape the media in two places:

- A view's `tiers` may name groups.
- When a model has no views and is too large for one poster, the plan is an
  overview with one card per group followed by one view per group.

## Views

A view is drawn on a poster page, which holds one to three views, and as one
panel of the page, with its own diagram. It has an `id`, an optional `title`,
`question` and `summary`, and exactly one of:

- `tiers`: an ordered list of group ids or inline `{ id, label, members }`
  bands, drawn as labelled rows in that order. A component appears in at most
  one tier of a view, and a row holds at most five cards.
- `members`: component ids whose rows follow their relations, holding at most
  six cards per row.

The page names a view's diagram by its title, or by its question when it has
no title of its own; a later poster of one view leads with its title, or with
the model's.

Relations between the shown components are always drawn; neither form selects
relations. Rows that follow relations are chosen deterministically: every
relation points down or stays within one row, rows skipped by relations are
avoided first, then relations within one row, then extra rows. See
[the layout](operations.md#layout-and-media) for how rows become a poster.

A model may declare any number of views; each is one poster plate and one
panel of the page. Without `views`, the publisher draws one view of every
component when it fits its poster, and otherwise the group overview described
above, with one view for every group. `archpub check` lists the components and
relations that no planned view draws.
