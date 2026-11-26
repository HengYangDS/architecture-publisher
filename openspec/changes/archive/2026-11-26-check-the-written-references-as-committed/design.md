## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` recorded the tables that restate the
source and how they came to be written from it. The pipelines' preparation (`.config/ci/pipeline.cue`, its
`toolPreparation`), the proof's `runtime-generation` gate (`.ethos/profile.toml`) and the publish job run
`npm run generate` before the check of generated inputs; `generate` wrote the tables and the LikeC4 supply's manifest
and notices before that check read them.

## Goals / Non-Goals

**Goals:**

- Every check of generated inputs, locally, in the proof and in a pipeline, reads the committed tables and supply
  files as committed.

**Non-Goals:**

- Finishing the queue item: its review found clauses still unmet (the model reference's table of top-level fields
  and a table of refusal codes in `docs/reference/data.md` written by hand, a track's name checked by hand, the
  categories named again beside their looks). They are the item's next Changes.

## Decisions

1. **Generation writes only what the repository ignores.** `generate` runs `likec4.mjs --parser`, which writes
   `supplies/likec4/parser.mjs` and verifies the directory whole; the manifest and notices it no longer writes are
   refused when they differ. `--write` keeps writing the whole supply for an update of the packages. The three
   consumers keep calling `generate`, so no pipeline step, projected CI file or gate changes. Alternative: keep
   `generate` and fail on `git diff --exit-code` after it. Not taken: it would need a step in each consumer, the proof's
   gate included, where each writer's own check already names the file.
2. **The writer is run by its own command.** Its refusal, `references_drift`, names the command to run; no npm script
   is added for it. The configuration reference says it once, and the development reference links there.
3. **No test holds `generate` to the ignored file.** A regression that wrote a committed file again would show only
   in review: a test would have to fix the script's text or run the generation in the repository. The three
   consumers run it on every proof and pipeline, where a stale file now fails.

## Risks / Trade-offs

- [This Change's proposal pipeline is the first to compare the committed tables and supply files on the Linux and
  macOS runners] → The writers run with only `PATH` (and `NO_COLOR` for the sample), and the parser's build is
  reproducible from the lock; that pipeline is the evidence.
- [A developer runs `npm run generate` after changing a table's source and expects the tables written] → The check
  refuses the document and names the command; the configuration reference says it.
