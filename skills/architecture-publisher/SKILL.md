---
name: architecture-publisher
description: Use when publishing a repository's architecture with the archpub command, as a print edition of one plate per view and an interactive page, or when re-pinning such a work to a later commit.
---

# Architecture Publisher

Use this Skill to describe a repository's architecture in an Architecture Model
and publish it with `archpub`. The model states the architecture; `archpub`
only draws and verifies what the model states. `archpub skill` prints this
Skill as it ships with the installed version, and `archpub <command> --help`
explains each command.

A build delivers two media from one model: the print edition, a PDF with one
plate per view and an image of each page, and the page, an interactive
explainer with one panel per view or the guide the model names.

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
   detail, which its card prints. Map kinds to the eight categories.
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
6. Optionally name an `overview`: a Typst composition beside the model that
   sets one page of the edition, after its contents, with the publisher's house
   class. The model reference lists what the class provides and what a
   composition may not do.
7. Write the guide, the page that explains the system to its reader. Run
   `archpub scaffold guide model.json --out guide` for a starting draft and name
   `guide/guide.archify.md` in the model's `guide`. Then rewrite it: lead with
   the conclusion and its reasons, answer one question per panel in the form
   that fits it, such as a sequence for an exchange, a workflow for a process,
   a table for a comparison or a code excerpt for a guarantee, cite each claim
   with a line range at the revision, and keep to four native diagrams. Check it
   with `archpub check model.json --repo <checkout>` until Archify's strict
   writing checks and its repository checks pass.
8. Choose the edition's look only if the user asks: an `edition` object with
   `marks` (画法), 条带 `strip` (each part a strip as long as its code, its
   segments the files it owns dyed by age, the default) or 卡片 `card`, and a
   `palette` (配色), 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot`, 铜绿
   `patina` or the user's own colours, which the check holds to printable
   contrast, chroma, lightness and hue and refuses with
   `model_palette_rejected` at the colour that fails. A build without
   `--repo`, or of a model that claims no files, draws cards and warns
   `marks_fallback`, and refuses a model that names `strip` with
   `marks_need_files`.
9. Run `archpub build model.json --repo <checkout> --out <new-directory>`. Look
   at the edition's every page, its plates and the overview, and at the page
   before showing them to the user. `--media edition` or `--media page` builds
   one medium while you work on it.
10. The reviewer accepts, and the author of a work does not review it. Unless you
    hold the reviewer's role for this work, stop here and hand the delivery over.
    Holding it, run `archpub accept <delivery> --reviewer <name>` with
    the name your delegation gives, adding `--sign <private key>` when the user signs
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
files its claims now take in, the relations whose files changed, what a build
there would refuse, the newly uncovered files and every guide citation that
shifted, moved, was touched or is gone. Update the claims, relations and prose
for each, move every shifted citation to its new range, reread every touched
one, then set `repository.revision` to that commit and build a new delivery for
the user to accept.

Report what the model covers and leaves out, the checks that passed and what
remains unverified. A successful build is not acceptance, and tests do not
replace the user's review.
