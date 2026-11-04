---
name: architecture-publisher
description: Use when publishing a repository's architecture as posters, an overview and a guide page with the archpub command.
---

# Architecture Publisher

Use this Skill to describe a repository's architecture in an Architecture Model
and publish it with `archpub`. The model states the architecture; `archpub`
only draws and verifies what the model states.

1. Agree on the reader's question and the scope with the user: which system,
   which parts and what the figures must explain. Record known gaps as `limits`.
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
4. Plan the views: usually an overview with `tiers` that name groups
   in reading order, then views of the mechanisms the question needs. Give each
   view a short `title`, such as `Overview` or `Proof plane`, and its own
   `question`: the page names a view's diagram by its title, and a view without
   one is named by its question there and by the model's title on its poster. A
   tier holds at most five cards and a view of `members` at most six per row.
5. Run `archpub check model.json --repo <checkout> --json` and fix every
   reported problem at its path. A view no page can lay out is refused with its
   counts and the page size: split it or reorder its tiers. A view no balanced
   page holds is refused with `poster_unbalanced` and each gate its closest page
   misses: give it more of the model to show or merge it with a neighbour. Never
   drop meaning to pass. A claim that owns no file in the scope names its path:
   drop it, or narrow a deeper claim that takes all its files.
   Declare `coverage` for the part of the repository the model describes,
   leaving out with a reason what is not its architecture, such as
   `**/*_test.go` beside Go code, and claim the largest uncovered directories
   the report lists until what is left is outside the question's scope. A
   version 1 model converts with `archpub migrate model.json --out <file>`.
6. Write the guide, the page that explains the system to its reader. Run
   `archpub scaffold guide model.json --out guide` for a starting draft and name
   `guide/guide.archify.md` in the model's `guide`. Then rewrite it: lead with
   the conclusion and its reasons, answer one question per panel in the form
   that fits it, such as a sequence for an exchange, a workflow for a process,
   a table for a comparison or a code excerpt for a guarantee, cite each claim
   with a line range at the revision, and keep to four native diagrams. Check it
   with `archpub check model.json --repo <checkout>` until Archify's strict
   writing checks and its repository checks pass.
7. Run `archpub build model.json --repo <checkout> --out <new-directory>` and
   look at every poster, the overview and the page before showing them to the
   user.
8. Only the user accepts. Run `archpub accept <delivery> --reviewer <name>` with
   the name the user gives, then `archpub publish <delivery> --to <root>` to the
   destination the user chose.

Report what the model covers and leaves out, the checks that passed and what
remains unverified. A successful build is not acceptance, and tests do not
replace the user's review.
