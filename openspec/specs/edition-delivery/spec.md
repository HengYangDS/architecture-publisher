# edition-delivery Specification

## Purpose

Write deterministic deliveries with a manifest, record one acceptance and
publish accepted deliveries as immutable versions.

## Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet exist: the print edition
`<model id>.pdf`, the interactive page `<model id>.html`, the edition's images in `images/`, its figures in
`figures/`, `model.json`, the data `<model id>.json`, the reader file `<model id>.md` and `manifest.json`, and
nothing else at the top of the delivery. It SHALL stage the delivery and move it into place only after every
artifact succeeds, so a refused or failed build leaves no output.

#### Scenario: Semantic names

- **WHEN** a model `route` with a composition whose first view is `route` is built with `--png 3840,6000`
- **THEN** the delivery holds `route.pdf`, `route.html`, `route.json`, `route.md`, `model.json` and `manifest.json`
  beside `images/00-overview.png`, `images/01-route.png`, `images/01-route-6000.png`, `figures/01-route.png` and
  `figures/01-route.svg`

#### Scenario: An existing output directory

- **WHEN** the output directory already exists
- **THEN** the build refuses without changing it

#### Scenario: A failure during rendering

- **WHEN** the page fails after the edition was written to the staging area
- **THEN** the build refuses and neither the output directory nor the staging area remains

#### Scenario: A refused overview

- **WHEN** the overview is refused after the plates were composed
- **THEN** the build refuses and neither the output directory nor the staging area remains

#### Scenario: A refused projection

- **WHEN** a plate's data face differs from its view's statement set
- **THEN** the build refuses and neither the output directory nor the staging area remains

### Requirement: Deterministic manifest

The manifest SHALL contain no timestamps, host paths or user names, so the
same model built with the same version on one platform yields the same
manifest.

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version on one platform
- **THEN** both manifests are byte-identical

### Requirement: Manifest records

The manifest SHALL record its format and version 9; the publisher's name and version; the model's id, title,
language, SHA-256 and size; the declared repository; the build's quality and media; the binding's state and the
number of files it recorded; the digests of the font, house, measuring and icon supplies and, when it delivers the
page, Archify's; the plan, each view naming the number of its plate; each plate's record; and every artifact's
path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 9, the publisher's name and version and the model's
  id, title, language, digest and size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest counts that path among the binding's files and holds no record of it
- **AND** the data's evidence table records it once, with its digest, size, last change date, the component as its
  owner and the relation's id

#### Scenario: An earlier delivery

- **WHEN** `archpub verify`, `archpub accept`, `archpub compare` or `archpub publish` is given a delivery whose
  manifest states version 7 or 8
- **THEN** the command treats it as before this version, and refuses nothing for its version

### Requirement: Check without output

`archpub check` SHALL run validation, source binding, planning, poster
composition, the page's Archify checks and, for a model that states an
overview, the drawing of the overview and its checks, and SHALL report the
result without writing a delivery; what Archify and Typst measure is written to
a temporary directory and removed.

#### Scenario: Checking an oversized model

- **WHEN** a model with an oversized view is checked
- **THEN** the result reports the refusal for that view
- **AND** no file is written

#### Scenario: Checking an overview

- **WHEN** a model whose overview statement is too tall for the page at both spacings is checked
- **THEN** the result refuses with `overview_too_tall`
- **AND** no file is written

### Requirement: Machine-readable results

Every command SHALL accept `--json` and then print exactly one JSON object with
`ok` and either its outputs or its diagnostics. The exit status SHALL be 0 on
success, 1 for a refused input, 2 for a usage error and 3 for any other
failure, whose JSON object SHALL carry the code `internal_error` and a message.
A result MAY carry `warnings`, each with a code and a message, which text output
prints one to a line.

#### Scenario: A refused build with JSON output

- **WHEN** a build with `--json` refuses an invalid model
- **THEN** standard output holds one JSON object with `ok: false` and the
  diagnostics
- **AND** the exit status is 1

#### Scenario: A manifest that cannot be read

- **WHEN** `archpub accept --json` meets a `manifest.json` that is a directory
- **THEN** standard output holds one JSON object with `ok: false` and the code
  `internal_error`
- **AND** the exit status is 3

#### Scenario: The version

- **WHEN** `archpub --version --json` runs
- **THEN** standard output holds one JSON object with `ok: true` and the
  package version

### Requirement: The caller's environment

Git and Archify SHALL run with only the caller's `PATH`, `PATHEXT`, `HOME`,
`USERPROFILE`, `TMPDIR`, `TEMP`, `TMP` and `SystemRoot` variables, so that no
other variable of the caller changes what they read or decide.

#### Scenario: A caller's Git and Archify variables

- **WHEN** the caller sets `GIT_DIR` to another repository and
  `ARCHIFY_EXPLAINER_PREPARED` to a missing file
- **THEN** sources are read from the checkout `--repo` names
- **AND** the page is delivered byte for byte as without those variables

### Requirement: One acceptance record

`archpub accept` SHALL verify every artifact of a delivery against its manifest
and SHALL write `acceptance.json` as an in-toto Statement v1 whose subjects are
`manifest.json` and `colophon.pdf` by SHA-256 and whose predicate names the
reviewer, the optional seal name and note, the UTC time, the model and, when
signed, the signing key; `--sign` SHALL write `acceptance.sig`, an SSH signature
of the record's bytes. It SHALL refuse when any artifact differs from the
manifest.

#### Scenario: An artifact changed after the build

- **WHEN** a poster was edited after the build
- **THEN** acceptance refuses and names the changed artifact

#### Scenario: A signed acceptance

- **WHEN** a reviewer accepts with `--sign` and an SSH key
- **THEN** the record names the key's SHA-256 fingerprint, `ssh-keygen -Y verify`
  accepts `acceptance.sig` over the bytes of `acceptance.json` for the reviewer,
  and `archpub verify --allowed-signers` with that key passes

#### Scenario: A key ssh-keygen cannot use

- **WHEN** `--sign` names a file that is not a key, or a public key whose private
  half is neither beside it nor held by ssh-agent
- **THEN** acceptance refuses with `acceptance_sign_failed` and writes nothing

### Requirement: Immutable versioned publication

`archpub publish` SHALL require a delivery that verifies, copy it with its
colophon page, acceptance record and any signature to
`<root>/<model id>/<version>/`, verify every copied digest, refuse to replace an
existing version with different content and leave every other version
untouched. The default version SHALL be the first twelve hexadecimal digits of
the manifest digest.

#### Scenario: Publishing twice

- **WHEN** the same accepted delivery is published twice to the same root
- **THEN** the second publication reports the existing identical version and
  changes nothing

#### Scenario: A conflicting version

- **WHEN** a different delivery is published under an existing version name
- **THEN** publication refuses and the existing version is unchanged

#### Scenario: An unaccepted delivery

- **WHEN** a delivery without an acceptance record is published
- **THEN** publication refuses and copies nothing

#### Scenario: A signed delivery

- **WHEN** a signed delivery is published
- **THEN** the published version holds `colophon.pdf`, `acceptance.json` and
  `acceptance.sig` byte for byte

### Requirement: Overview inputs in the manifest

When a delivery holds the overview, its manifest SHALL record the statement's
digest, the house class's digest, the house supply's digest and the Typst
version.

#### Scenario: The overview's inputs

- **WHEN** a model with an overview statement is built with the overview
- **THEN** its manifest records the statement's digest, the class's and the house supply's digests and Typst
  0.15.1

### Requirement: Guide inputs in the manifest

When the page is a guide, the manifest SHALL record the draft's path and
digest, each staged file's name and digest, the writing level and whether the
guide's sources were verified at the revision.

#### Scenario: The guide's inputs

- **WHEN** a model with a guide is built with a checkout
- **THEN** its manifest records the draft's path and digest, each staged file,
  the writing level `strict` and the guide's sources as verified

### Requirement: Edition image names

At each `--png` width, `images/` SHALL hold one image of the overview's page
and one of each plate's page, named `00-overview.png` and `NN-<view>.png` at
3840 px and `00-overview-<width>.png` and `NN-<view>-<width>.png` at any other,
where `NN` is the plate's two-digit number from 01 in reading order.

#### Scenario: Images at two widths

- **WHEN** a model `route` with a composition and one view `route` is built
  with `--png 3840,6000`
- **THEN** `images/` holds `00-overview.png`, `00-overview-6000.png`,
  `01-route.png` and `01-route-6000.png`

### Requirement: Media

`archpub build` and `archpub check` SHALL accept `--media` with any of `edition`
and `page`, by default both; `--png` with comma-separated widths from 1 to
6000 px, by default 3840, for the edition's images; and `--quality` with
`showcase`, the default, or `standard`, for the page. A build SHALL compose only
the media it delivers, and SHALL refuse an option outside these values with
`build_media_invalid`, `build_png_invalid` or `build_quality_invalid` before
reading the model.

#### Scenario: The edition alone

- **WHEN** a model is built with `--media edition`
- **THEN** the delivery holds the print edition, its images and its figures alone and no `<model id>.html`
- **AND** its manifest records no page and no Archify supply

#### Scenario: An unknown medium

- **WHEN** a build names `--media posters`
- **THEN** it refuses with `build_media_invalid` and writes nothing

### Requirement: Print edition

The print edition SHALL be typeset by the bundled Typst with the house class: a title page of the work's name,
question and summary over a byline of its release, editors, licence and publisher; the contents; the overview,
when the model states one; one plate per view; and the index.

#### Scenario: The contents link to the plates

- **WHEN** a model with an overview statement and six views is built
- **THEN** its PDF holds ten pages
- **AND** the overview's entry and each of the six contents rows link to their pages

### Requirement: Edition page frame

Every page after the title page SHALL share one frame on the 1600 by 900 point
page: a head of a label at the margin, a title at 124 points and a lead line; a
body from 112 to 826 points; and a foot of a rule at 866 points, the work's
title, release, revision and date linked to the contents, and the folio. A
title wider than its line SHALL be refused with `edition_title_too_long`.

#### Scenario: A foot that returns to the contents

- **WHEN** a reader follows the foot of any plate
- **THEN** it opens the contents page

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title, its question and its line back. Its key SHALL list what its figure shows and
cannot say where it stands, and no more, on one line where the body holds it, its baseline at 850 points on every
plate and each mark centred on its label's mid-line: what the age bands count from and the bands, the scale bar,
the citation count, the hub, the boundary, the statuses and the ground of a part outside the repository. It SHALL
list no kind.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists the boundary on one line above the foot and neither kind, and each card names its kind
  beside the kind's icon

#### Scenario: A strip plate's key

- **WHEN** a plate shows files in all three bands and relations that cite files and no hub
- **THEN** its key says that the bands count back from the commit and names the three bands, the scale bar and the
  citation count, and no hub

#### Scenario: A part outside the repository

- **WHEN** a plate shows a part outside the repository
- **THEN** its key holds the ground of such a part with the edition's word for outside

#### Scenario: Marks of different heights

- **WHEN** a plate's key holds a band, a sample strip, a citation count, a hub's line and a boundary's outline
- **THEN** each is centred on the same line as the labels' text

### Requirement: Plate reading

Where a plate's figure leaves part of the body's width, the plate SHALL set
its view's reading beside the figure, 40 points from it: the view's summary,
and then, when they fit, under the publisher's heading for where each part
lives, each shown component's label with its claimed paths as the model
declares them, in reading order. The heading SHALL be in the model's language.

#### Scenario: A summary beside a narrow figure

- **WHEN** a view with a summary is set on a plate whose figure takes 65
  percent of the body
- **THEN** the summary can be extracted as text from that plate's page
- **AND** each shown component that claims files is listed with its paths

### Requirement: Reading measure

A summary beside a figure SHALL be justified as the edition's prose is, at any
width of its column and in any language, with its last line set short. A
reading beside a figure whose summary and paths are taller than the body SHALL
set its summary alone, without the heading or the paths. A summary alone
taller than the body, or paths taller than the body beside no summary, SHALL be
refused with `edition_reading_too_long` and the view's title, since text is
never shrunk.

#### Scenario: A summary in a narrow column

- **WHEN** a view's figure takes 80 percent of the body and its reading column
  holds about 15 em
- **THEN** every line of the summary but the last ends at the column's edge

#### Scenario: Paths that do not fit beside a summary

- **WHEN** a view's summary fits the body but its summary and paths do not
- **THEN** the plate sets the summary alone
- **AND** it sets neither the heading for where each part lives nor any path

#### Scenario: A reading too long for its column

- **WHEN** a view's summary alone needs more than the body's height
- **THEN** the build refuses with `edition_reading_too_long` naming the view

### Requirement: Plate fit in check

`archpub check` SHALL report, for each plate, its figure's share of the body,
the balance gates it misses and whether its view's reading is set beside the
figure, set above it or set in the plate's head.

#### Scenario: A plate that left its reading out

- **WHEN** a view with a summary cannot give up width or height without more
  crossings or route defects
- **THEN** the edition sets the reading in the plate's head, in at most three lines, and `archpub check` names
  that plate so
- **AND** a reading that needs more lines, or a head too narrow for it, is refused with
  `edition_reading_too_long`

#### Scenario: A plate with its reading above the figure

- **WHEN** a view's summary is set above its figure
- **THEN** `archpub check` names that plate as setting its reading above the
  figure

### Requirement: Columns fill their pages

On the title page, each column's blocks SHALL be spaced equally over the band the column occupies, so that no
column leaves its paper in one block. On the contents' first page, each block of the left half SHALL begin on one
of the ten lines a half's rows stand on where the blocks fit so, on a line or half a line where they need more,
and share the height that is left equally where they fit neither way.

#### Scenario: The contents' left column

- **WHEN** the contents' first page is set, whatever the number of rows beside it
- **THEN** each block of its left half begins on a rule at the height of one of a half's ten lines

#### Scenario: Blocks that need more lines than a half has

- **WHEN** the left half's blocks need more than ten lines and no more than twenty half lines
- **THEN** each begins on a line or half a line, and the overview's entry stands level with the first row

### Requirement: Edition typography

Prose, the summary beside or above a figure, scope, limits and reading note,
SHALL be justified on optimized lines, hyphenated in the model's language, with
word spaces from 80 to 125 percent and tracking from −0.012 to +0.025 em, at
most 32 em to a line. Titles, questions, labels, paths and figure text SHALL NOT
be justified, except the details of parts in a language written without spaces
between words.

#### Scenario: Notes at a reading measure

- **WHEN** the scope is set on the contents
- **THEN** no line of it is wider than 32 em of its size

### Requirement: Links to cited files

Each card title on a plate SHALL link to its component's paragraph in the index. When the model's repository has a
browse template, declared or implied by its address, each path in a paragraph SHALL link to that template filled
with the pinned revision and the path. Without one, no path SHALL link.

#### Scenario: A browsable repository

- **WHEN** a model declares
  `browse: "https://github.com/o/r/blob/{revision}/{path}"` and a component owns
  `src/a.mjs`
- **THEN** that component's card title links to its paragraph in the index, and the path there links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`

#### Scenario: A GitHub address without a template

- **WHEN** a model declares `url: "https://github.com/o/r.git"` and no `browse`,
  and a component owns `src/a.mjs`
- **THEN** the path in its paragraph links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`

### Requirement: Print edition conformance and metadata

The print edition SHALL conform to PDF/A-3a and PDF/UA-1, attach the model with
the relationship `source`, and take its title, authors, subject, keywords and
language from the model. Each plate SHALL be one figure with alt text of its
title and question, its shapes and key marks artifacts.

#### Scenario: Metadata and the attached model

- **WHEN** a model with `editors: [{ "name": "Yang HENG" }]` is built
- **THEN** the PDF's author is `Yang HENG`
- **AND** its attachment `model.json` equals the model's bytes

### Requirement: Edition date

The print edition SHALL be dated by the revision's commit when the build names
the checkout, otherwise by `SOURCE_DATE_EPOCH` when it is set, and otherwise by
the time it is typeset, and the manifest SHALL record which. Two builds of equal
inputs and date SHALL be byte-identical.

#### Scenario: Two builds

- **WHEN** a model is built twice at one revision with one `SOURCE_DATE_EPOCH`
  and no checkout
- **THEN** both PDFs and every image are byte-identical
- **AND** the manifest records the edition as dated by `SOURCE_DATE_EPOCH`

### Requirement: Cover title lines

A cover title that holds Han, Kana or Hangul text and is wider than its column
SHALL break at the space whose two lines both fit and whose wider line is
narrowest, or else into lines of balanced width, so no line holds one
character alone. A title in other scripts SHALL break at its spaces.

#### Scenario: A title of eight Han characters

- **WHEN** 数据部门工作指南 is wider than the cover's column
- **THEN** it is set as 数据部门 and 工作指南

#### Scenario: A title with a Latin word

- **WHEN** AIGW 客户端投影 is wider than the cover's column
- **THEN** it is set as AIGW and 客户端投影

#### Scenario: An English title

- **WHEN** an English title is wider than the cover's column
- **THEN** it breaks at its spaces as in 0.10.0

### Requirement: A summary above the figure

A view with a summary whose figure wires worse at 80 percent of the body's
width SHALL keep the full width and set its summary above the figure, under
the plate's question, when the figure wires no worse at the height left below
it than at the full body. The summary SHALL be set at 17 points within 32 em,
justified when that takes no more lines than the publisher reserved and
otherwise on the publisher's lines, flush left, without the heading for where
each part lives or the paths.

#### Scenario: A figure that cannot narrow but can shorten

- **WHEN** a view's figure crosses more wires at 80 percent of the width than at
  the full width, but no more at the full width below its summary
- **THEN** the plate sets the summary above the full-width figure, justified
- **AND** every line of the summary is at most 32 em of its size

#### Scenario: A justified summary that would need more lines

- **WHEN** the justified summary would take more lines than the publisher
  reserved above the figure
- **THEN** the plate sets the publisher's own lines, flush left

#### Scenario: A figure that can neither narrow nor shorten

- **WHEN** a view's figure wires worse both at 80 percent of the width and below
  its summary
- **THEN** the figure keeps the full body, and the summary stands in the plate's head

### Requirement: Command help

`archpub --help` SHALL print the commands grouped by the role that runs them, the author, the reviewer and the
publisher, then those every role runs, each with one line of what it does; `archpub <command> --help` that
command's usage with the options it cannot run without, what it does and its options, `--json` among them; and
`archpub --version` the package version, each with status 0. A usage error SHALL say what is wrong and, for a
mistyped command or option, name the nearest one.

#### Scenario: One command's usage

- **WHEN** `archpub build --help` runs
- **THEN** standard output holds the usage of `archpub build` and its options
- **AND** the usage line names `--out <directory>`, whose description ends in `(required)`
- **AND** the exit status is 0

#### Scenario: A mistyped command

- **WHEN** `archpub` is given the unknown command 'chek' with a model
- **THEN** the output says `unknown command 'chek'` and names `check`
- **AND** the exit status is 2

### Requirement: Edition palette in the manifest

The manifest SHALL record the palette's name or `custom`, the resolved palette
roles, and where the edition draws strips the spans of its age bands, the pin's
date and the length its largest part is drawn at. It SHALL record no marks.

#### Scenario: A custom palette

- **WHEN** a model gives its own palette
- **THEN** the manifest names the palette `custom` and records its ground, ink,
  dye steps and accent

#### Scenario: An edition without file facts

- **WHEN** a model is built without `--repo`
- **THEN** the manifest's style records the palette, null for its bands, and no length

### Requirement: Colophon page

`archpub accept` SHALL typeset `colophon.pdf` beside the delivery in the
edition's language: a round mark in cinnabar whose rim carries the publisher's
word for accepted and the ISO date of acceptance and whose band carries the
reviewer's name or the seal name, and nothing else; and beside it an acceptance
slip. Accepting SHALL leave every artifact of the manifest unchanged.

#### Scenario: Accepting keeps the edition

- **WHEN** a delivery is accepted
- **THEN** every artifact still matches the manifest and the delivery holds a
  colophon page whose digest the acceptance record names

#### Scenario: A name in another script

- **WHEN** a reviewer named `김민준` accepts an English edition
- **THEN** the mark's rim reads ACCEPTED and the date, and the name is set across
  the band in Hangul

#### Scenario: A name no face can set

- **WHEN** a reviewer's name holds a character no house face draws
- **THEN** acceptance refuses with `acceptance_name_unset`, names the characters
  and suggests `--seal-name`

#### Scenario: The mark states no digest

- **WHEN** one reviewer accepts two deliveries with different manifests on the
  same day
- **THEN** the two marks are the same and the two slips name different manifest
  digests

### Requirement: Name inside the band

The mark SHALL set the name at the largest size between 7% and 13% of its width
at which the name's ink fits inside the band on one line, or else on two lines at
that size before any smaller size is tried, breaking two lines where they are
most nearly even. Acceptance SHALL refuse with `acceptance_name_too_long` a name
that fits neither way at 7%.

#### Scenario: A short name

- **WHEN** `Yang HENG` accepts a delivery
- **THEN** the name is set on one line at 13% of the mark's width

#### Scenario: A name wraps before it shrinks

- **WHEN** `Александр Пушкин`, which fits one line above 7% of the mark's width,
  accepts a delivery
- **THEN** the name is set on the two lines `Александр` and `Пушкин`, and the ink
  of both lies inside the band

#### Scenario: A name too long for the band

- **WHEN** a reviewer's name of 55 letters without a space or hyphen accepts a
  delivery
- **THEN** acceptance refuses with `acceptance_name_too_long`, names the name and
  suggests `--seal-name`

### Requirement: Acceptance slip

The slip SHALL label, in the edition's language, the reviewer, the UTC time of
acceptance, the subject (title and release), the commit when the model pins one,
the manifest SHA-256, the signing key's fingerprint or Unsigned, and the note
when given. It SHALL state that acceptance records who accepted which bytes and
when and does not certify that the architecture is correct, and SHALL name the
published files that hold the record.

#### Scenario: A signed Chinese acceptance

- **WHEN** a Chinese edition is accepted with `--sign`
- **THEN** the slip's labels read 验收人, 验收时间, 对象, 提交, 清单 SHA-256 and
  签名密钥, the key's value is its `SHA256:` fingerprint, and the page names
  `acceptance.json` and `acceptance.sig`

#### Scenario: An unsigned English acceptance

- **WHEN** an English edition of a model that pins no revision is accepted
  without `--sign`
- **THEN** the slip has no Commit row, its Signing key reads Unsigned, and the
  page names `acceptance.json` alone

### Requirement: Verification

`archpub verify` SHALL check every artifact against the manifest, the record's
subjects against the manifest and the colophon page, and that `acceptance.sig`
is present exactly when the record names a signer; given `--allowed-signers`, it
SHALL check that `acceptance.sig` verifies the exact bytes of `acceptance.json`
for the reviewer in the namespace `archpub-acceptance`, made by the key the
record names. It SHALL refuse naming the first link that fails.

#### Scenario: A changed colophon page

- **WHEN** the colophon page is edited after acceptance
- **THEN** verification refuses and names `colophon.pdf`

#### Scenario: An unlisted signer

- **WHEN** the record is signed by a key the allowed signers do not list for the
  reviewer
- **THEN** verification refuses with `acceptance_signature_invalid`

#### Scenario: A record edited after signing

- **WHEN** the note in a signed `acceptance.json` is changed
- **THEN** verification with the allowed signers refuses with
  `acceptance_signature_invalid`

#### Scenario: A signature the record does not name

- **WHEN** `acceptance.sig` lies beside a record that names no signer
- **THEN** verification refuses with `acceptance_signature_invalid` without
  allowed signers

#### Scenario: An earlier record

- **WHEN** a delivery holds an acceptance record written by version 0.12
- **THEN** verification and publication refuse with
  `acceptance_version_unsupported`

### Requirement: Part details without word spaces

In an edition whose language is written without spaces between words, a part's
details SHALL wrap as a paragraph, each line filled by the width Typst sets it
in. Each line but a detail's last SHALL be spread to the details' measure,
unless its slack is more than a tenth of an em for each place it opens; any
other line stays flush left. A run Typst measures over half a point wider than
its measure SHALL be refused with `edition_text_wider`.

#### Scenario: A Chinese part with a two-line detail

- **WHEN** a Chinese edition sets a part whose detail takes two lines and whose
  first line fills its measure
- **THEN** the first line ends at the measure's right edge and the second line
  is flush left

#### Scenario: A line broken early

- **WHEN** a line of a detail has more slack than a tenth of an em for each
  place it opens, as a line broken before a long Latin word
- **THEN** that line is flush left

#### Scenario: A line of Han and letters

- **WHEN** a line of a detail holds Han and Latin letters
- **THEN** it holds as much as its measure takes at the width Typst sets it in,
  though the CJK face alone would measure it wider than the measure

#### Scenario: A list of Han items

- **WHEN** a detail lists items of Han text and the next item does not fit the
  line
- **THEN** the line ends inside that item, within a character of its measure

#### Scenario: An English part

- **WHEN** an English edition sets a part whose detail takes two lines
- **THEN** both lines are flush left, and a list's items are kept whole

### Requirement: Detail orphans

In an edition whose language is written without spaces between words, a
detail's last line SHALL NOT hold one character alone, with or without the
marks beside it: it SHALL take the unit before it from the line above, where
the two fit the measure.

#### Scenario: A detail that runs one character over

- **WHEN** a detail's text runs one Han character past the end of a line
- **THEN** its last line holds that character and the one before it, and the
  line above ends a character short

#### Scenario: A last line of two characters

- **WHEN** a detail's last line holds two Han characters, or a word of letters
- **THEN** its lines stay as they wrapped

### Requirement: A key longer than the body

A plate's key longer than the body is wide SHALL break between two entries onto
a second line, the two lines 16 points apart about 850 points, and no entry
SHALL be broken. A key that needs a third line, or holds an entry wider than
the body, SHALL be refused with `edition_key_too_long`.

#### Scenario: A key of two lines

- **WHEN** a plate's key is longer than the body is wide and two lines hold it
- **THEN** it stands on two lines at 842 and 858 points, each starting at the
  margin with an entry's mark and ending within the body

#### Scenario: A key of three lines

- **WHEN** a plate's key would need a third line
- **THEN** the build refuses with `edition_key_too_long` and names the plate

#### Scenario: An entry wider than the body

- **WHEN** one entry of a plate's key is wider than the body
- **THEN** the build refuses with `edition_key_too_long` and names the plate

### Requirement: Results for a reader at a terminal

Without `--json` a command SHALL print its result as marked lines: one line for each fact, with a mark that tells
passed, needs attention, refused and merely noted apart without colour, under a heading for each group, and the
next command to run when there is one, with the checkout a check read. A refusal SHALL name the command's first
argument as typed and list each problem on a line with its path.

#### Scenario: A check with a plate that misses a gate

- **WHEN** `archpub check` admits a model one of whose plates misses a balance gate
- **THEN** that plate's line carries the mark for needs attention and names the gate, what was measured and its limit

#### Scenario: A check that read a checkout

- **WHEN** `archpub check model.json --repo shop` admits the model
- **THEN** the closing line is `Next: archpub build model.json --repo shop --out <directory>`

#### Scenario: A refused model

- **WHEN** `archpub check` refuses a model with two problems
- **THEN** the title names the command and the model as it was typed
- **AND** the output names the refusal and lists each problem with its path

### Requirement: Reports fit the terminal

No line of a report but its closing line SHALL be wider than the terminal it is written to, or than 80 columns
when it is written to no terminal: a value and a title that are longer SHALL continue on further lines, a value
under its own first column. The closing line SHALL be one line however long, so that the command it names is
copied whole. A path inside the working directory SHALL be printed relative to it, while the `--json` result
keeps the whole path.

#### Scenario: A value longer than the terminal

- **WHEN** a report with a value of 200 characters is written to a terminal 80 columns wide
- **THEN** no line of the report is wider than 80 columns
- **AND** the value's further lines start in the column its first line starts in

#### Scenario: A next command longer than the terminal

- **WHEN** a report whose next command is 150 characters long is written to a terminal 80 columns wide
- **THEN** the closing line holds the whole command on one line

#### Scenario: A delivery built inside the working directory

- **WHEN** `archpub build model.json --out delivery` runs
- **THEN** the report names the directory `delivery` and the next command `archpub accept delivery --reviewer <name>`
- **AND** with `--json` the result's `out` is the directory's whole path

### Requirement: Progress on a terminal

A build or a check whose standard error is a terminal SHALL show on it the step it is at. With `--json`, or when
standard error is no terminal, it SHALL show none, and standard output SHALL hold the same bytes either way.

#### Scenario: A build piped to a file

- **WHEN** `archpub build` runs with standard error redirected to a file
- **THEN** the file holds no progress, and standard output equals that of a run on a terminal

### Requirement: Key samples from the value table

The key's sample of the hub's line, of the citation count and of the boundary SHALL be drawn with the weight,
pattern and type size the value table gives its row, at the plate's own scale. A key SHALL hold an entry for a row
of the table exactly when the plate's figure draws that row.

#### Scenario: The hub's entry

- **WHEN** a plate's figure draws lines into a hub
- **THEN** the key's sample of them is as heavy as those lines, in their colour, and its words name a heavy line
  and the hub in the edition's language

#### Scenario: The boundary's sample

- **WHEN** a plate's figure draws the system boundary
- **THEN** the key's sample of it has the dash and gap of the boundary on the plate

### Requirement: Comparison of two deliveries

`archpub compare <delivery> <delivery>` SHALL report every file that differs in bytes between two deliveries or
stands in one alone: a plate's page images, at every width, under that plate by its number and views, and every
other file a manifest lists, and the manifest itself, as a file of the whole edition. The result SHALL say that the
deliveries are identical exactly when no such file differs. The command SHALL write nothing.

#### Scenario: One model built twice

- **WHEN** one model is built twice by one commit of the publisher on one platform with one date source, and the two
  deliveries are compared
- **THEN** the result says the deliveries are identical and lists no plate and no file
- **AND** the exit status is 0

#### Scenario: One plate's image replaced

- **WHEN** one delivery holds another valid image in place of one plate's page image, with its manifest brought
  into line, and it is compared with the delivery as built
- **THEN** the result lists exactly that plate, with that image
- **AND** it lists the manifest among the files of the whole edition, and no other file

#### Scenario: One value of the table changed

- **WHEN** a model is built by the publisher and by a copy of it whose value table gives the boundary another gap,
  and the two deliveries are compared
- **THEN** the result lists exactly the plates whose figure draws the boundary, each with its image files
- **AND** it lists the print edition among the files of the whole edition
- **AND** no plate without a boundary is listed

#### Scenario: A file in one delivery alone

- **WHEN** one delivery holds a plate's image at a width the other was not built at
- **THEN** the result lists that image under its plate and says which delivery holds it

#### Scenario: A comparison with JSON output

- **WHEN** `archpub compare` runs with `--json` on two deliveries that differ in one plate
- **THEN** standard output holds one JSON object with `ok: true`, `identical: false`, that plate's number, views and
  changed files, each with its digest in either delivery, and the changed files of the whole edition

#### Scenario: A comparison's report

- **WHEN** `archpub compare` runs without `--json` on two deliveries that differ in one plate
- **THEN** the report's title names the first delivery as it was typed, a group lists that plate by its number and
  views, and the closing line says how many plates and files of the whole edition differ

### Requirement: What a comparison refuses and leaves out

`archpub compare` SHALL first check each delivery against its own manifest and refuse, with status 1 and the
delivery's name, a directory that is no delivery or whose files differ from its manifest. It SHALL exit with status
0 whenever it compared, whether or not they differ. It SHALL NOT compare an acceptance record, its signature or the
colophon page. Its help and the command line reference SHALL say that two builds are the same bytes only on one
platform with one date source.

#### Scenario: A delivery changed after its build

- **WHEN** one of the two deliveries holds an image edited after its build
- **THEN** the comparison refuses with `delivery_changed`, names that delivery and names the image
- **AND** the exit status is 1

#### Scenario: A directory that is no delivery

- **WHEN** one of the two directories holds no manifest
- **THEN** the comparison refuses with `delivery_manifest_missing` and names the directory

#### Scenario: Deliveries that differ

- **WHEN** the two deliveries differ in a plate's image
- **THEN** the exit status is 0

#### Scenario: An accepted delivery

- **WHEN** a delivery is compared with a copy of it that a reviewer has accepted
- **THEN** the result says the deliveries are identical

### Requirement: The manifest names the model, the data and the reader file

The manifest SHALL name the model's file `model.json`, the data's file with the counts of what it holds, and the
reader file with its size in bytes and the number of statements it lists, and SHALL list each of the three among
its artifacts with its size and digest.

#### Scenario: The three files

- **WHEN** a model `route` is built
- **THEN** the manifest names `model.json`, `route.json` and `route.md`, and lists each among its artifacts with
  its size and digest
- **AND** the size it records for the reader file is the size of `route.md`

### Requirement: Measures in the manifest

The manifest SHALL record each poster's composition and gate measurements, each view diagram's Archify metrics and
the files the page withholds. The record of each cited file and the details, statuses and files of every component
and relation SHALL stand in the data and SHALL NOT be repeated in the manifest.

#### Scenario: Evidence kept off the drawing

- **WHEN** a component has details and claims files
- **THEN** the data's statements list them under the component's id, and the manifest holds no `evidence`

#### Scenario: A plate's measures

- **WHEN** a model with one view is built
- **THEN** the manifest records that plate's composition and measures as before

### Requirement: The new files are compared

`archpub compare` SHALL compare `model.json`, `<model id>.json` and `<model id>.md` as files of the whole edition,
and SHALL list each that differs or that one delivery alone holds.

#### Scenario: Two builds of one state

- **WHEN** one model is built twice with the same version, checkout and date source on one platform
- **THEN** the comparison reports the two deliveries identical

#### Scenario: A delivery of the release before

- **WHEN** a delivery of manifest version 8 is compared with one of version 9 built from the same model
- **THEN** the comparison lists `manifest.json` and the reader file among the files that differ, and no plate

#### Scenario: One statement changed

- **WHEN** two deliveries of version 9 are built from models that differ in one detail of one relation
- **THEN** the comparison lists `model.json`, the data, the reader file and `manifest.json` among the files that
  differ

### Requirement: Check reports the data

The result of `archpub check --json` SHALL carry `data`, the counts a build's manifest records: of components,
relations and groups; of the statements cited, unchecked and uncited; of facts; of paths and cited ranges of
evidence; for each plate, of the components, groups and relations of its face; and for a guide, of its matched
nodes and connections, with the list of unmatched ones. The text report SHALL print them as one group. A check
SHALL write no file for them.

#### Scenario: A model with a checkout and a guide

- **WHEN** such a model is checked with `--json`
- **THEN** the result's `data` holds the counts and the list of the guide's unmatched nodes and connections
- **AND** no file is written

#### Scenario: A model without a checkout

- **WHEN** a model is checked without `--repo`
- **THEN** `data` holds the counts of statements and of facts, no cited statement, and for a guide no matched
  figure

### Requirement: A model id that takes a delivery's file name

`archpub build` and `archpub check` SHALL refuse with `delivery_name_taken` a model whose id is `model`,
`manifest`, `acceptance` or `colophon`, since `<model id>.json` or `<model id>.pdf` would then be another file of
the delivery, and SHALL name the file and the two things it would be. The model's own validation SHALL NOT change.

#### Scenario: A model named manifest

- **WHEN** a model whose id is `manifest` is built
- **THEN** the build refuses with `delivery_name_taken` and writes nothing

#### Scenario: A model named colophon

- **WHEN** a model whose id is `colophon` is checked
- **THEN** the check refuses with `delivery_name_taken`, since `colophon.pdf` is the page an acceptance writes

#### Scenario: A model named models

- **WHEN** a model whose id is `models` is built
- **THEN** the delivery holds `models.json` beside `model.json`

### Requirement: A guide is read for every medium

A build or a check of a model that names a guide SHALL read the guide's draft and the files it names whichever media
it delivers, since the reader file carries the draft and the data its citations, and SHALL refuse a guide that is
absent with `guide_missing`. With a checkout it SHALL refuse with `guide_file_missing` a citation of the guide whose
path is no file at the pin. Only a build or a check that delivers the page SHALL have Archify validate the guide.

#### Scenario: An absent guide and the edition alone

- **WHEN** a model names a guide that does not exist and is built or checked with `--media edition`
- **THEN** the command refuses with `guide_missing`, and a build writes nothing

#### Scenario: A guide and the edition alone

- **WHEN** a model with a guide is built with `--media edition`
- **THEN** the reader file ends with the guide's draft, and Archify does not run

#### Scenario: A guide's citation of a file absent at the pin

- **WHEN** a `@source` of a guide's draft, or a node of one of its diagrams, cites a path that is no file at the
  model's revision
- **THEN** a build or a check with `--repo` refuses with `guide_file_missing` for `--media edition`, `--media page`
  and both, names the guide, the place of the citation and the path, and a build writes nothing
- **AND** without `--repo` the model builds, and the path's row of evidence is `unverified`

### Requirement: The grounds in a key

A plate's key SHALL say of each sort of part on the outside ground what is true of it, exactly when the plate shows
one: of a part outside the repository, the edition's word for outside; of a neighbour that a group's view shows as
context, which lies inside the repository, that it stands outside the group.

#### Scenario: A part outside the repository

- **WHEN** a plate shows an external tool and no context neighbour
- **THEN** its key holds the outside ground once, with the word for outside

#### Scenario: A group's view

- **WHEN** a group's view shows two neighbours as context and no part outside the repository
- **THEN** its key holds the outside ground once, with the words for a neighbour outside the group, and does not
  say that anything lies outside the repository

### Requirement: A part without file facts

When a build has no bound file facts, because it reads no checkout or the model claims no files, the edition SHALL
draw every part without a strip and without a count, and its key SHALL hold no entry of a strip. The build SHALL
NOT warn of it: a part is drawn with the facts it has.

#### Scenario: No checkout

- **WHEN** a model is built without `--repo`
- **THEN** every part is a card with its name, its kind and its details, no strip is drawn, and the result carries
  no warning about marks

### Requirement: Figures alone

A build that delivers the edition's images SHALL also write, for each plate, the plate's figure and its key alone
into `figures/`, as `NN-<view>.png` and `NN-<view>.svg`: cut to what the figure draws on with a margin about it, on
no ground, at the scale of the widest image asked for. The key of a figure alone SHALL state the commit's date,
since no foot stands under it.

#### Scenario: A figure on another ground

- **WHEN** a work is built and a plate's figure in `figures/` is laid over a ground of another colour
- **THEN** that ground shows at the figure's corners, between its cards and under each relation's label

### Requirement: A figure's two forms

A figure's PNG SHALL have an alpha channel. Its SVG SHALL be one document of shapes whose text is outlined, with no
embedded image and no reference outside itself.

#### Scenario: One document of shapes

- **WHEN** a plate's SVG in `figures/` is read
- **THEN** it holds no `image` and no `text` element and no data URI

### Requirement: Figures in the delivery's record

The manifest and the data SHALL record a plate's two figure files in its `figures`, beside its images, and the
reader file SHALL name them on the view's line. A delivery whose figure file is changed, missing or unlisted SHALL
be refused as one whose image is.

#### Scenario: A figure file that the manifest does not hold

- **WHEN** a delivery's `figures/01-route.svg` is changed after the build and the delivery is verified
- **THEN** the delivery is refused, and the refusal names that file

### Requirement: One date a page

Every page of the edition SHALL state the commit and its date once: a plate's
page and the overview in their foot, the cover in its byline. The key of a page
SHALL state none.

#### Scenario: One date a page

- **WHEN** a plate's page is typeset from a pin with a commit date
- **THEN** the date stands in the page's foot and nowhere in its key

#### Scenario: The cover and the overview

- **WHEN** an edition with an overview is typeset from a pin
- **THEN** the cover states the date in its byline alone, and the overview states the commit and its date in its foot alone

### Requirement: Contents

The contents SHALL list the plates alone, one row a plate: its number, its title and its question, the whole row a
link to the plate, and no page number. Where the model states an overview, the left half of the first page SHALL
open with the overview's entry, its name and claim and no number, a link to the overview's page. Under it SHALL
stand the scope, the limits and a reading note, each under a rule across the half.

#### Scenario: The overview's entry

- **WHEN** a model with an overview statement and six views is built
- **THEN** the contents hold six rows and the overview's entry, and each of the seven links to its page

#### Scenario: A row names no page

- **WHEN** the contents are set
- **THEN** a row holds its plate's number, title and question and no other number

#### Scenario: The overview's entry is no plate

- **WHEN** the contents of a model with an overview statement are set
- **THEN** the entry's head is the overview's name in the capitals that head the scope, and it prints no number

### Requirement: Contents pages

A page of contents SHALL have two halves. The first page SHALL set its rows in the right half, and a further page
in both, the left first. A half SHALL take at most ten rows. Every page of contents SHALL have the edition's foot,
and where the contents take more than one page each SHALL say how many plates the edition has.

#### Scenario: Eleven plates

- **WHEN** a model with eleven views is built
- **THEN** its contents take two pages: ten rows in the first page's right half and the eleventh in the second
  page's left half
- **AND** both pages say that the edition has 11 plates

#### Scenario: Twenty-eight plates

- **WHEN** a model with twenty-eight views is built
- **THEN** its contents take two pages of ten, ten and eight rows
- **AND** both pages say that the edition has 28 plates

### Requirement: Contents pitch

A row of the contents SHALL be a tenth of the body high in every edition, whatever the number of its plates. The
rows SHALL stand in order from the top of each half, and no row SHALL be opened up to fill a half or a page: a
half of fewer than ten rows, and a page the rows end on, leave the rest of their height empty. A rule SHALL close
the rows of each half, under its last.

#### Scenario: Six plates

- **WHEN** a model with six views is built
- **THEN** its six rows stand on the first six of the ten lines of the right half, with a rule under the sixth

#### Scenario: A page of one row

- **WHEN** a model with eleven views is built
- **THEN** the eleventh row stands at the top of the second page, as high as any other, over a rule
- **AND** nothing else of the contents stands on that page but its title, the number of plates and its foot

### Requirement: A left half too tall

A first page of contents whose overview's entry, scope, limits and reading note are taller than the page's body
SHALL be refused with `edition_front_too_long`, with both heights.

#### Scenario: Limits that outgrow the page

- **WHEN** a model's limits are longer than the left half can hold beside its other blocks
- **THEN** the build refuses with `edition_front_too_long` and writes nothing

### Requirement: Index

The edition SHALL end with an index: every component once, in the order of the names, as a short paragraph. Its
first line SHALL hold the name, the kind and the numbers of the plates that draw it, each a link to its plate and
set as a plate's number is set in the contents, in lines of equal length where more stand than beside the name.
Under it SHALL stand the details the model states, the relations each way with the other part's name a link to its
paragraph, and the paths the component claims.

#### Scenario: A part and its plates

- **WHEN** a component is drawn on plates 02 and 05 of an edition
- **THEN** the index holds its name once, followed by 02 and 05, each a link to that plate

#### Scenario: A part on many plates

- **WHEN** a component is drawn on seventeen plates and six numbers stand beside its name
- **THEN** its numbers stand in three lines of six, six and five

#### Scenario: A part's paragraph

- **WHEN** a component of a kind states two details, calls another component and claims a folder and a file
- **THEN** its paragraph holds the kind, both details, the call with the other's name a link to the other's
  paragraph, and both paths

### Requirement: Index order

The index SHALL compare two names word by word: a word in Latin letters or digits before any other, two words of
one script as the model's language sorts them, and a name that begins another before it.

#### Scenario: Latin words first

- **WHEN** an index holds a name of two Latin words and a name of the same first word followed by a Chinese word
- **THEN** the name of two Latin words stands first

### Requirement: Index pages

The index SHALL set its paragraphs in two columns, one in each half of the page, each whole in one column. A
longer index SHALL take a further page with its title and foot. A paragraph taller than a page's body SHALL be
refused with `edition_index_too_long`; a component's paths past the house's `indexPaths` SHALL be counted, not
listed.

#### Scenario: An index of two pages

- **WHEN** an edition's index holds forty-two parts with nothing but their names and plates
- **THEN** forty stand on its first page and two at the top of the left column of a second page, which has its
  title and foot
- **AND** the page count includes both

### Requirement: Index pitch

A part with nothing but its name and plates SHALL take one line, a twentieth of the body high in every edition;
the further lines of a paragraph SHALL stand at the text's pitch. The paragraphs SHALL stand in order from the top
of the left column, and none SHALL be opened up to fill a column or a page. A rule SHALL close each column, under
its last paragraph.

#### Scenario: Twenty-six parts

- **WHEN** an edition's index holds twenty-six parts with nothing but their names and plates
- **THEN** twenty stand in the left column and six at the top of the right, all at one pitch, with a rule under
  the last of each column

### Requirement: What the edition rests on

Under the last page of the index, on the line where a plate has its key, the edition SHALL state the repository by
the one address the model states, without its scheme and as a link, the number of files read, and the names of
the page and of the data. It SHALL state no acceptance and no digest there.

#### Scenario: Four facts

- **WHEN** an edition is built from a checkout of a model that states a repository's address
- **THEN** the last page states the address, the number of files read, the page and the data on one line

### Requirement: A line back to the overview

Where an element of the overview names one of a plate's views, the plate's head
SHALL carry a line back on the question's line, after the question: the words of
the first such element in the statement's order, or the edition's word for the
overview where those words are the plate's title, linked to the overview's page.

#### Scenario: A block that names a view

- **WHEN** a block titled Terms is the first element that names a plate's view
- **THEN** the plate's head reads "↖ Terms" after its question, linked to the overview's page

#### Scenario: An element bearing the plate's title

- **WHEN** the first element that names a plate's view bears the plate's title
- **THEN** the line back reads "↖" and the edition's word for the overview

#### Scenario: A view the overview does not name

- **WHEN** no element of the overview names a plate's views
- **THEN** the plate's head has no line back

### Requirement: An answer in the head band

Where a plate's figure keeps the full body and sets no summary above it, the
plate's head SHALL set its view's summary right of the title and of the
question's line with its line back as shown, 48 points clear of the wider, from
the title's baseline at 17 points on a 24-point pitch, in three lines at most
above the body. A longer one SHALL be refused with `edition_reading_too_long`.

#### Scenario: A silent plate's answer

- **WHEN** a view's figure can neither narrow nor shorten below its summary
- **THEN** the summary begins on the title's baseline, clear of the question, and ends above the body

#### Scenario: An answer too long for the head

- **WHEN** the summary would take more than three lines there
- **THEN** the build refuses with `edition_reading_too_long`

#### Scenario: An answer beside a line back that gave way

- **WHEN** a plate's line back gave way to the edition's word for the overview
- **THEN** the answer stands 48 points clear of that word, not of the words that gave way

### Requirement: A line back that gives way

A line back whose words would pass the margin SHALL give way to the edition's
word for the overview, and where that would pass the margin too, the plate's
head SHALL carry no line back. A plate SHALL NOT be refused for its line back.

#### Scenario: An element's words too long for the room

- **WHEN** the question leaves too little room for the words of the element that names the plate's view
- **THEN** the line back reads "↖" and the edition's word for the overview

#### Scenario: A question too long for any line back

- **WHEN** the question leaves too little room even for the edition's word for the overview
- **THEN** the plate is built, and its head has no line back

### Requirement: The help as data

With `--json`, a help SHALL print `commands` beside `usage`: the program as data, each command with its name,
usage, group, description, arguments, options and the commands it holds. The operations reference's list of
commands SHALL be written from it by a command.

#### Scenario: An agent reads the commands

- **WHEN** `archpub --help --json` runs
- **THEN** its `commands` lists every command the help lists, with the options its own help lists
- **AND** the exit status is 0

#### Scenario: The reference differs from the program

- **WHEN** the operations reference's list of commands differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

### Requirement: A delivery's files in one table

Each file at the top of a delivery SHALL stand once in one table with its name or pattern, when it is written and
what it holds. The source SHALL take every name of a delivery's files from it, and the operations reference's table
of them SHALL be written from it by a command.

#### Scenario: A name the source forms

- **WHEN** the source forms the name of a delivery's file
- **THEN** the name is the table's row for that file, with the model's id or the plate filled in

#### Scenario: The reference differs from the table

- **WHEN** the operations reference's table of a delivery's files differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
