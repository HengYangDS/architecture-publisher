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
relation. Its author writes
it, or `archpub import likec4` converts a LikeC4 workspace into one. The
publisher never infers architecture from code; the model is the only source of
meaning.

The machine-readable schema is
[`src/model/schema.json`](../../src/model/schema.json).
`archpub check` validates a model, reports every problem with its JSON path in
one pass and builds nothing.

## A minimal model

This is the smallest model the schema accepts. It builds, but three components
leave most of the edition's body blank, so the manifest records the balance
gates its plate misses. The
[Big Bank example](../../examples/big-bank/README.md) is a larger model with
kinds, details and views.

```json
{
  "format": "architecture-publisher.model",
  "version": 3,
  "id": "shop",
  "title": "Shop",
  "question": "How does an order reach the warehouse?",
  "components": [
    { "id": "web", "label": "Web shop", "kind": "frontend" },
    { "id": "orders", "label": "Order service", "kind": "service" },
    { "id": "db", "label": "Order store", "kind": "store" }
  ],
  "relations": [
    {
      "id": "web-orders",
      "from": "web",
      "to": "orders",
      "label": "places orders"
    },
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

<!-- fields: written from src/model/schema.json by tools/docs/references.mjs; do not edit -->

| Field        | Required | Meaning                                                                                                                                    |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `format`     | yes      | Always `architecture-publisher.model`. The kind of file: an Architecture Publisher model.                                                  |
| `version`    | yes      | Always `3`. `archpub migrate` converts a model of an earlier version.                                                                      |
| `id`         | yes      | The model's id; it names the delivery's files and the directory `archpub publish` copies them to.                                          |
| `locale`     | no       | The language the model is written in; the publisher sets its own words in it. One of `en`, `zh-CN`, `zh-TW`, `es`, `ko`; `en` by default.  |
| `title`      | yes      | The edition's title, and the title of any view without its own.                                                                            |
| `question`   | yes      | The question the model answers, and that of any view without its own: on the edition's title page and at the head of the page.             |
| `summary`    | no       | A short answer under the question on the title page, and the page's conclusion.                                                            |
| `editors`    | no       | Who edited the model: the edition's authors. At least one.                                                                                 |
| `license`    | no       | The licence of the model and its editions, as an SPDX licence expression such as `MIT`.                                                    |
| `scope`      | no       | What the model covers and leaves out, beside the edition's contents and in the page's scope.                                               |
| `limits`     | no       | Known limits of the description, printed with the scope.                                                                                   |
| `repository` | no       | The repository the model describes, pinned at one commit.                                                                                  |
| `kinds`      | no       | The catalog of kinds, keyed by a kind's id.                                                                                                |
| `components` | yes      | The parts the model describes, those of the categories `person` and `external` among them. At least one.                                   |
| `relations`  | yes      | The relations between components. May be empty.                                                                                            |
| `groups`     | no       | Named sets of components.                                                                                                                  |
| `views`      | no       | The views, each one plate of the edition and one panel of the page. At least one.                                                          |
| `coverage`   | no       | The repository paths the model describes and those it leaves out.                                                                          |
| `overview`   | no       | The overview: what one page after the contents says, as blocks without positions, which the publisher lays out.                            |
| `guide`      | no       | The guide: an Archify explainer draft, named by its path from the model, which the page delivers in place of the one the publisher writes. |
| `edition`    | no       | The print edition's palette.                                                                                                               |
| `$schema`    | no       | The schema an editor checks the model against; the publisher ignores it.                                                                   |

<!-- end of fields -->

### Values

Each value of these kinds, wherever it stands in the model, keeps to its rule.

<!-- vocabulary: written from src/model/schema.json by tools/docs/references.mjs; do not edit -->

| Value           | Rule                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An id           | matches `^[a-z0-9][a-z0-9._-]{0,127}$`; the model's own id also matches no `^(?:con\|prn\|aux\|nul\|com[0-9]\|lpt[0-9])(?:\.\|$)\|\.$`, so it names no Windows device and does not end in a dot |
| A text          | 1 to 2000 characters, not blank, with no NUL character; a character outside the Basic Multilingual Plane, such as most emoji, counts as two                                                     |
| A status        | one of `implemented`, `planned`, `retired`                                                                                                                                                      |
| A detail's name | matches `^(?![0-9]+$)[^:\n]{1,64}$`: no colon or line feed, and not digits alone                                                                                                                |
| A path          | 1 to 1024 characters, counted as in a text, relative, with no backslash, line feed, carriage return or NUL, and no empty, `.` or `..` segment                                                   |

<!-- end of vocabulary -->

A model file is at most 4 MiB. Unknown fields are refused, so a misspelt field
never disappears silently.

## Language

The publisher sets the few words it writes itself in the model's language: the
edition's contents,
reading note, index and foot, the key's boundary and status entries, the
details it derives for an overview, and how it joins details, lists and
sentences. The
page declares the language to Archify, whose controls and viewer then speak it.
Text in Latin, Greek, Cyrillic, Han, Kana and Hangul can be set; text in a
right-to-left or shaped script, such as Arabic, Hebrew or Devanagari, is
refused with `script_unsupported`, since the figure is measured glyph by glyph
without shaping. Lines break at spaces, and between Han and Kana characters,
with closing punctuation kept on the line before. A no-break space, such as
U+00A0 between `60` and `s`, keeps the words beside it on one line.

## Components and relations

A component has an `id`, a `label` and optionally a `kind`, `details`, a
`status` and `files`. A relation has an `id`, `from` and `to` component ids,
a `label` and the same optional `details`, `status` and `files`. A relation
may not connect a component to itself.

- `details` maps a short name to text or a list of texts, such as
  `{ "technology": "Go", "owns": ["accounts", "tokens"] }`. A name keeps to its
  [rule](#values). A plate sets a component's details on its card where it has
  [the room](#parts-and-palette); on the page, its diagram card shows the first
  detail it holds whole, or none, and its step lists every detail. A relation's
  details are printed under its label. The delivery's data lists every detail.
- `status` is one of the statuses the [table of values](#values) names. On
  plates, planned components and relations are drawn dashed and retired ones
  dotted and muted; on the page, planned and retired relations are dashed.
- A component's `files` are the repository paths it owns, and a relation's
  `files` are the files that evidence it; see
  [Files and the repository](#files-and-the-repository).

## Kinds

Each kind has an optional `label`, `category` and `icon`. A component without a
kind, or with a kind the catalog does not declare, takes the default category;
an undeclared kind is labelled with its id.

<!-- categories: written from src/model/schema.json and src/categories.json by tools/docs/references.mjs; do not edit -->

| Category     | Default icon   | Drawn as                                                       |
| ------------ | -------------- | -------------------------------------------------------------- |
| `person`     | `user`         | Outside the system boundary; Archify's `external` type.        |
| `external`   | `box`          | Outside the system boundary; Archify's `external` type.        |
| `frontend`   | `app-window`   | Archify's `frontend` type.                                     |
| `backend`    | `server`       | Archify's `backend` type; the default.                         |
| `database`   | `database`     | Archify's `database` type.                                     |
| `cloud`      | `cloud`        | Archify's `cloud` type.                                        |
| `messagebus` | `waypoints`    | Archify's `messagebus` type.                                   |
| `security`   | `shield-check` | Archify's `security` type; on plates, in the palette's accent. |

<!-- end of categories -->

`icon` names any icon in the bundled Lucide artwork, such as `server` or
`database`; each category has the default the table names. An unknown icon is
refused. The artwork's version stands in `.config/release/icons/policy.toml`.

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
every owned file and every file a relation cites is recorded in the delivery's
[data](data.md#the-evidence-table) with its digest, its owner and the relations that cite it; that record is the
edition's lock. A claim that owns no file in the scope, because the scope leaves
its files out, none exists or deeper claims take them all, or a relation file
the revision lacks, refuses the build with its JSON path. Without `--repo`, every
declared path is recorded as unverified.

When the model also declares `repository.url`, the page cites each component's
first file at that URL and revision: the first file of its first claim, in
path order within a directory. Archify does not cite a file of a sensitive
class, such as a path with a `secrets` segment; the page withholds such a file,
cites the component's next one and records the withheld file in the manifest.

When the model declares `repository.browse`, a URL holding `{revision}` and
`{path}`, such as `https://github.com/o/r/blob/{revision}/{path}`, each card
title on the edition's plates links to the component's first file at the
pinned revision, its path encoded segment by segment. A model whose
`repository.url` is an `https` address on GitHub or GitLab need not declare it:
the address without a trailing `.git`, then `/blob/{revision}/{path}` on GitHub
or `/-/blob/{revision}/{path}` on GitLab, is the template it implies. A declared
template stands; any other address implies none.

A revision cannot name the commit that contains it, so a model kept in the
repository it describes pins an earlier commit.

### Which address to state

`repository.url` is the one address an edition states: under its index, and in
the page's citations. State the address a reader of the edition can open, and
no other; `repository.browse` follows the same rule. Public means reachable
from the internet without signing in: a repository that asks for an account or
a permission, or stands on an internal network, is not public.

| The repository is           | State                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| on GitHub alone, public     | that address                                                                                                                                |
| on GitHub alone, not public | no address: the edition prints the repository's `name` alone                                                                                |
| on GitLab alone, public     | that address                                                                                                                                |
| on GitLab alone, not public | no address                                                                                                                                  |
| on both, both public        | one address: the main repository, where the work is done and issues are handled; where neither is the main one, either, the same throughout |
| on both, one public         | the public one                                                                                                                              |
| on both, neither public     | no address                                                                                                                                  |

Another host is treated as GitLab is here. An edition that stays among readers
who can open the repository may state an address that is not public. The
publisher cannot tell from an address whether a repository is public and
checks none of this: what the model states is what the edition prints.

### From earlier versions

A version 1 model listed its files in a `sources` catalog that components and
relations cited by id. `archpub migrate <model> --out <file>` writes it as the
current version: each component claims the files it cited, in their order, and each
relation cites its sources' files. A file that several components cited stays
with the first of them, and the command names it. Folding files into directory
claims is then the author's choice, since a directory also takes the files no
source named.

A version 2 model named its authors in a free-text `attribution`, which the
command never parses into names: declare `editors` beside it, and the command
writes the current version without the attribution, or refuses with
`attribution_not_migrated`, quoting the text, and writes nothing.

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
  their new path falls to, or deleted, and the files it now owns;
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

## Parts and palette

The print edition draws every part as one card, and the optional `edition`
object names the palette it is drawn in. The page keeps Archify's own themes.

```json
"edition": { "palette": "indigo" }
```

`edition` holds a palette and nothing else. A model that names `marks` there
is refused with `model_field_retired` at `/edition/marks`: the field is
retired, since every part is one card, and is to be removed.

A card is made of regions, from its top: its part's name; the strip of the
files the part owns; a caption, the kind's icon before the kind's label and
then the number of files and their size; and the part's details. A region is
drawn where the part has the fact: a part that owns no file has no strip and
no count, and a build that reads no checkout, or a model that claims no files,
draws every card without a strip and raises no warning of it. The captions of
one plate have one form: each count stands beside its kind, at the card's
right, where every card of the plate has the room for that line, and under its
kind on every card otherwise. The card's outline tells its part's status and
its ground whether the part lies inside the repository; a neighbour that a
group's view shows for context stands on the ground of a part outside.

A plate is composed for cards without their details, so what its parts state
costs it neither wiring nor type. Its cards then set every detail when the
view lays out with them in the same width and height, at the same type step,
with no more crossings and, at equal crossings, no more route defects;
otherwise none of its cards sets a detail. The data and the reader file hold
every detail of every part.

A strip is as long as the files its part owns are large, whatever their type,
on one scale for the whole edition, so a part of 200 KB is ten times as long
as a part of 20 KB on every plate; a part with any bytes is at least 2 px
long, and every strip has the same thickness. The largest part is 320 px long;
a strip is never shortened to fit its column, so an edition one of whose views
cannot hold its strips draws them all at 208 px. Each file the part owns is one
segment, in path order, as wide as its share of the part's bytes and in the dye
of its age band, and a file too narrow to draw apart joins a neighbour of its
band.

Every edition sorts its files into the same three age bands, counted back from
the pin's commit: changed within a week, over a week and within three months,
and earlier; the key names the middle band by both bounds. A file's age is the
time from its last change at or before the pin to the pin.
The bands are the same for every edition, so two editions can be compared; the
newest takes the palette's palest dye and the oldest its darkest.

Where an edition draws strips, every relation's line carries the number of
files the relation cites, near its source. The build checks that a cited file
exists at the pin, not that it proves the relation. The part with the most
incoming relations of a view, when it has at least three and more than any
other part, is the view's hub, and the relations into it are drawn twice as
heavy, in the oldest dye. The weights and patterns are the rows of the
[line values](lines.md).

A plate's key names what its figure shows and a card does not say where it
stands, and only that: the age bands with the pin's date, a scale bar, the
count, the hub, the boundary, the ground of a part outside the repository, the
ground of a neighbour shown for context, of which it says that it lies outside
the group, and the statuses. It lists no kind, since every card names its kind
beside the kind's icon, and in an edition that draws no strip it holds no band,
date, scale bar, count or hub.

`palette` (配色) names a built-in palette or gives one of your own. Each built-in is
named for the dye or pigment its colours come from:

<!-- palettes: written from src/house.json and src/model/schema.json by tools/docs/references.mjs; do not edit -->

| `palette`   | Name           | Colours                                                         |
| ----------- | -------------- | --------------------------------------------------------------- |
| `indigo`    | 靛蓝 Indigo    | Indigo blues on a warm white, with a brown accent; the default. |
| `persimmon` | 柿漆 Persimmon | Persimmon-tannin browns, with a slate blue accent.              |
| `soot`      | 松烟 Soot      | The greys of pine-soot ink, with a warm grey accent.            |
| `patina`    | 铜绿 Patina    | The green that grows on bronze, with a brown accent.            |

<!-- end of palettes -->

A palette of your own names a ground, an ink, three dye steps from new to old
and an optional accent:

```json
"palette": { "ground": "#f6f1f1", "ink": "#312124", "dye": ["#e2c5cf", "#b38294", "#76475c"], "accent": "#306751" }
```

It must print well; the check refuses it with `model_palette_rejected` at the
colour that fails, with its measure and the bound. Measured in OKLCH lightness
L, chroma C and hue, and WCAG contrast against the ground: the ground has L at
least 0.92 and C at most 0.02; the ink a contrast at least 7 and C at most
0.05; each dye step is at least 0.12 darker than the one before it, the newest
at least 0.07 darker than the ground and the oldest at a contrast of at least
4.5, each with C at most 0.08; the dye steps whose C exceeds 0.02 turn through
at most 60° of hue, so they read as one colour aging, not as three colours; the
accent, which defaults to the oldest dye, has a contrast of at least 4.5 and C
at most 0.12; and no colour lies within 0.06 of the acceptance mark's cinnabar
`#A93D31` in OKLab. Lightness alone tells the ages apart, so a photocopy keeps
them.

The example above is 苏芳 Sappan, the reds of sappanwood; 栗壳 Chestnut, the
red-browns of lacquer with a green accent, is another palette of your own that
passes these rules:

```json
"palette": { "ground": "#f5efe7", "ink": "#271c19", "dye": ["#d8b5a8", "#a87062", "#673e36"], "accent": "#316354" }
```

A model that names no palette, or no `edition`, is drawn in `indigo`.

The overview is drawn in the same palette: the class's `paper` is the ground,
`ink` the ink, `green` the oldest dye and `ochre` the accent.

## Overview

The [overview reference](overview.md) states the overview's blocks and their
fields.

## Guide

A guide is an Archify
[explainer draft](https://github.com/tt-a1i/archify/blob/v3.2.0/archify/references/explainer-authoring.md), a Markdown file ending
in `.archify.md` that lies within the model's directory. A guide is
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
repository URL and revision. A diagram file states what its diagram shows and leaves where it goes to the
publisher: the publisher lays out each architecture, entity-relationship,
class, workflow, dataflow and sequence file. A file that states a position, a size, a cell, a
column, a layout, a width or gap, the course of a line, a workflow's phases or
groups, or a repository is refused (`page_diagram_publisher_field`), every
field of every file named; so are a dataflow's rows and a sequence's message heights
and the segments and activations that span them. With `--repo`, every diagram
file names the model's repository URL and revision, and the Forge and link
mode the draft's `repo_provider` and `repo_link_mode` name. `archpub scaffold guide` writes the page the
publisher generates as a starting guide, and the
[operations reference](operations.md#the-guide) describes how a guide is checked
and delivered.

## Groups

A group has an `id`, a `label` and the component ids of its `members`. A
component belongs to at most one group, and a group id may not equal a
component id. Groups shape the media in two places:

- A view's `tiers` may name groups.
- When a model has no views and its whole is too large for one plate, the plan is an
  overview with one card per group followed by one view per group.

## Views

A view is drawn as one plate of the print edition, a page of its own, and as
one panel of the page, with its own diagram. It has an `id`, an optional `title`,
`question` and `summary`, and exactly one of the two forms below. A view's
`summary` is its reading: the plate sets it beside the figure, which gives up
a fifth of the body for it, with where each of the view's components lives. A
view without one carries no summary of its own; the model's summary is the
title page's.

- `tiers`: an ordered list of group ids or inline `{ id, label, members }`
  bands, drawn as labelled rows in that order. A component appears in at most
  one tier of a view, and a row holds at most five cards.
- `members`: component ids whose rows follow their relations, holding at most
  six cards per row.

A view may name its `composition`: `tiers`, rows of cards joined by lines, or
`matrix`, a row and a column for each part it draws and a cell for the
relations from one to another, holding their label. It names the composition of
the view's plate; the page's diagram of the view is not changed by it. Without
it, a view of at least eight parts (components, groups' cards and the neighbours
it shows) that declares no tiers is drawn as a matrix when its figure in tiers
would tangle, with at least two route defects at the full width, and a matrix
fits; every other view is drawn in tiers. A matrix that a view names and that
does not fit is drawn in tiers, and the build reports `plate_composition_unfitted`.

The page names a view's diagram by its title, or by its question when it has
no title of its own; its plate is headed by its title, or the model's, and
its question.

Relations between the shown components are always drawn; neither form selects
relations. Rows that follow relations are chosen deterministically: every
relation points down or stays within one row, rows skipped by relations are
avoided first, then relations within one row, then extra rows. See
[the layout](operations.md#layout-and-media) for how rows become a plate.

A model may declare any number of views. Without `views`, the publisher draws one view of every
component when it fits one plate, and otherwise the group overview described
above, with one view for every group. `archpub check` lists the components and
relations that no planned view draws.
