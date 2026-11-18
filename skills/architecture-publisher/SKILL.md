---
name: architecture-publisher
description: Use when publishing a repository's architecture with the archpub command, as a print edition of one plate per view and an interactive page, or when re-pinning such a work to a later commit.
---

# Architecture Publisher

Use this Skill to describe a repository's architecture in an Architecture Model
and publish it with `archpub`. The model states the architecture; `archpub`
only draws and verifies what the model states. `archpub skill` prints this
Skill as it ships with the installed version, and `archpub <command> --help`
explains each command. Give every command `--json` and read its one JSON
object: `ok`, the result's fields or a refusal's `code`, `message` and
`problems`, and the exit status, 0 done, 1 refused, 2 usage, 3 internal.
Without `--json` the same result is a report for a reader at a terminal, one
marked line per fact; do not parse it.

A build delivers two media from one model: the print edition, a PDF with one
plate per view and an image of each page, and the page, an interactive
explainer with one panel per view or the guide the model names. Whichever media
it carries, a delivery also holds `model.json`, the model as read,
`<model id>.json`, the pinned edition as data, and `<model id>.md`, the reader file: a reader that works
from text starts from the reader file, which lists every statement under its
id with its files and facts and ends with the guide's text.

1. Agree on the reader's question and the scope with the user: which system,
   which parts and what the work must explain. Record known gaps as `limits`.
2. Read the repository's actual entry points, modules and configuration. Every
   component claims the repository paths it owns in `files`, a directory ending
   in `/` or one file, each path claimed once; a file belongs to its most
   specific claim. Each relation cites in `files` the files that evidence it,
   such as the modules that import the other component. Pin
   `repository.revision` to the full commit you read.
3. Write the model outside the described repository unless its owner asks for
   it there. Give components stable lowercase ids and short labels, relations
   verb labels such as `reads` or `publishes`, and each component one leading
   detail: a card of the generated page shows the first detail it holds, and a
   plate's card sets its details where the plate has the room. Map kinds to
   the eight categories; every card of a plate names its component's kind by
   the kind's label.
4. Plan the views: usually an overview with `tiers` that name groups in reading
   order, then views of the mechanisms the question needs. Give each view a
   short `title`, such as `Overview` or `Proof plane`, its own `question` and a
   `summary`, which its plate sets beside the figure as the view's reading. A
   tier row holds at most five cards and a view of `members` at most six per
   row.
5. Run `archpub check model.json --repo <checkout> --json` and fix every
   problem at its path. A view no plate lays out is refused with
   `plan_not_admitted` and its counts and the plate size: split it or reorder
   its tiers. Each plate reports its figure's share of the body and the balance
   gates it misses; a sparse plate needs more of the model to show or a merge
   with a neighbour. Never drop meaning to pass. A claim that owns no file is
   refused with `files_unresolved` and names its path: drop it, or narrow a
   deeper claim that takes all its files. A `repo_unused` warning means the
   model claims and cites no file yet, so nothing was verified. Declare
   `coverage` for the part of the repository the model describes, leaving out
   with a reason what is not its architecture, such as `**/*_test.go` beside Go
   code, and claim the largest uncovered directories the report lists until
   what is left is outside the question's scope. A version 1 or 2 model
   converts with `archpub migrate model.json --out <file>`.
6. Optionally state an `overview`, one page after the contents that tells the
   whole work at a glance: a claim and a lead, a course of steps with their
   stations, and lists, tables, further courses and headed texts in the order
   they are read, with no position. Name in `view`, on a step, a station or a
   block, the view that enlarges it: the page sets that plate's number there as
   a link, and a check warns of a view nothing on the overview names. The
   publisher lays the page out; the model reference lists every field.
7. Write the guide, the page that explains the system to its reader. Run
   `archpub scaffold guide model.json --out guide` for a starting draft and name
   `guide/guide.archify.md` in the model's `guide`. Then rewrite it: lead with
   the conclusion and its reasons, answer one question per panel in the form
   that fits it, such as a sequence for an exchange, a workflow for a process,
   a table for a comparison or a code excerpt for a guarantee, cite each claim
   with a line range at the revision, and keep to four native diagrams. Check it
   with `archpub check model.json --repo <checkout>` until Archify's strict
   writing checks and its repository checks pass.
8. Choose the edition's palette only if the user asks: an `edition` object
   with a `palette` (配色), 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot`, 铜绿
   `patina` or the user's own colours, which the check holds to printable
   contrast, chroma, lightness and hue and refuses with
   `model_palette_rejected` at the colour that fails. A model chooses no way
   of drawing its parts: each is one card of its name, the strip of the files
   it owns, as long as they are large and dyed by age, its kind and the number
   and size of its files, with its details where its plate has the room. A build
   without `--repo`, or of a model that claims no files, draws the cards
   without strips and raises no warning of it. A model that names
   `edition.marks` is refused with `model_field_retired`: remove the field.
9. Run `archpub build model.json --repo <checkout> --out <new-directory>`. Look
   at the edition's every page, its plates and the overview, and at the page
   before showing them to the user. `--media edition` or `--media page` builds
   one medium while you work on it; the guide the model names is read for
   either, so a guide that is not there yet is refused with `guide_missing`. A
   model whose id is `model`, `manifest`, `acceptance` or `colophon` is refused
   with `delivery_name_taken`: give it another id.
10. The reviewer accepts, and the author of a work does not review it. Unless you
    hold the reviewer's role for this work, stop here and hand the delivery over.
    Holding it, and given an earlier build of the same work, first run
    `archpub compare <earlier-delivery> <delivery>`: it names the plates whose
    images differ, which are the ones to look at before accepting. Then
    run `archpub accept <delivery> --reviewer <name>` with
    the name your delegation gives, adding `--sign <key>` when the user signs
    with an SSH key. It writes `colophon.pdf`, the colophon page whose mark sets
    the name, `acceptance.json`, the record of who accepted which bytes and when,
    and for a signed acceptance `acceptance.sig`. Acceptance does not certify
    that the architecture is correct; do not report it as if it did. A name with
    a character the house faces do not draw is refused with
    `acceptance_name_unset`; ask the user for a name they draw for the mark,
    which `--seal-name <name>` sets. Show the user the
    colophon page, run `archpub verify <delivery>`, or for a signed acceptance
    `archpub verify <delivery> --allowed-signers <file>` with the signers the user
    keeps, then `archpub publish <delivery> --to <root>` to the destination the
    user chose. A delivery accepted by an earlier release is refused with
    `acceptance_version_unsupported` until the user accepts it again.

To re-pin a work to a later commit, first run
`archpub check model.json --repo <checkout> --against <commit>`. Its re-pin
worklist names, per component, the files that changed, moved or went and the
files it now owns, the relations whose files changed, what a build
there would refuse, the newly uncovered files and every guide citation that
shifted, moved, was touched or is gone. Update the claims, relations and prose
for each, move every shifted citation to its new range, reread every touched
one, then set `repository.revision` to that commit and build a new delivery for
the user to accept.

Report what the model covers and leaves out, the checks that passed and what
remains unverified. A successful build is not acceptance, and tests do not
replace the user's review.
