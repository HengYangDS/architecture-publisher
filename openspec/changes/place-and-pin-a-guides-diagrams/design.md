## Context

See [proposal.md](proposal.md). The census of the published files lies in `docs/research/page-figures.md`; the kit in
the checkout's ignored `build/runtime/work/page-figures/` (`d/`, `copy-d/`).

## Goals / Non-Goals

**Goals:**

- A guide's diagram file states what its diagram shows; where it goes, and the repository it cites, are the
  publisher's.

**Non-Goals:**

- A dataflow's rows and a sequence's heights, which Archify requires and the publisher does not yet set: a later
  Change. Their other places and sizes are refused now.

## Decisions

1. One declared table of the publisher's fields, by kind, and one refusal that names every field of every file, as
   the guide is read.
   - Rests on: Archify 3.3.0's schemas, which name every field that places, sizes or routes; the census: the 78
     published files state no route, and their places are all of a kind the publisher now lays out.
   - Considered: removing the fields without a word; drawing a placed file as written, as the earlier Changes do.
   - Chosen because: the manifest records the author's file, which must say what the page draws; and a field drawn as
     written keeps a hand-placed page possible.
   - Applies to: `PUBLISHERS`, `publishersPaths`, `refuseStatedPlaces`, `readGuide`. A file's kind is the one its
     name ends in and its `diagram_type` states; a file where they differ reaches Archify as written.
2. The repository from the model, the Forge and link mode from the draft, and only with a checkout.
   - Rests on: Archify reads a public Forge (`github.com`, `gitlab.com`, `gitee.com`) from the address and a self-hosted
     GitLab only from a hint, which a guide's draft already gives as `repo_provider`; an internal host needs
     `repo_link_mode=local-only`, which the draft may also name. Archify refuses a diagram that names a repository
     when it has no checkout to verify it (`repository-evidence/root-required`, asked of 3.3.0 on 2026-11-25).
   - Considered: a Forge column in the model's table of addresses, a second source for what Archify reads itself;
     the repository in every build, which a build without `--repo` would then refuse.
   - Chosen because: each fact keeps one source, and a build without a checkout keeps working as before.
   - Applies to: `withRepository`, `guidePage`, `draftRepository`.
3. The scaffold writes the generated diagrams as an author may state them.
   - Rests on: the generated page's diagrams carry the chooser's layout and routes, which the refusal now refuses.
   - Considered: a scaffold that keeps them, for an author who edits by hand.
   - Chosen because: a scaffolded guide must build, and the same table defines both (`asAuthored`).
   - Applies to: `scaffoldGuide`.

## Risks / Trade-offs

- Breaking: a guide that places anything is refused. The works build on 0.18.0, and drop their places and repository
  blocks in the release train that takes this Change.
- A timeline's or waterfall's width and a tree's gaps are refused although the publisher sets none: Archify's defaults
  draw them. One published timeline states a width.
- A tree's direction, a timeline's breaks and a line's weight stay the author's: they say what the diagram shows,
  not where it sits.
- The spec delta modifies the requirements Changes (a), (b) and (c) add: it is archived after them.
