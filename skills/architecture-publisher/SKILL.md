---
name: architecture-publisher
description: Use when drawing a repository's architecture as posters and an interactive map with the archpub command.
---

# Architecture Publisher

Use this Skill to describe a repository's architecture in an Architecture Model
and publish it with `archpub`. The model states the architecture; `archpub`
only draws and verifies what the model states.

1. Agree on the reader's question and the scope with the user: which system,
   which parts and what the figures must explain. Record known gaps as `limits`.
2. Read the repository's actual entry points, modules and configuration. Every
   component and relation in the model needs a file that supports it; cite
   those files in `sources` with repository-relative paths, and pin
   `repository.revision` to the full commit you read.
3. Write the model outside the described repository unless its owner asks for
   it there. Give components stable lowercase ids and short labels, relations
   verb labels such as `reads` or `publishes`, and each component one leading
   detail, which its card prints. Map kinds to the eight categories.
4. Plan at most five views: usually an overview with `tiers` that name groups
   in reading order, then views of the mechanisms the question needs. A tier
   holds at most five cards and a view of `members` at most six per row.
5. Run `archpub check model.json --repo <checkout> --json` and fix every
   reported problem at its path. A refused view names its measured size or the
   relations that overlap; split the view or reorder its tiers rather than
   dropping meaning. A digest mismatch names the actual digest at the revision.
6. Run `archpub build model.json --repo <checkout> --out <new-directory>` and
   look at every poster and at the map before showing them to the user.
7. Only the user accepts. Run `archpub accept <delivery> --reviewer <name>` with
   the name the user gives, then `archpub publish <delivery> --to <root>` to the
   destination the user chose.

Report what the model covers and leaves out, the checks that passed and what
remains unverified. A successful build is not acceptance, and tests do not
replace the user's review.
