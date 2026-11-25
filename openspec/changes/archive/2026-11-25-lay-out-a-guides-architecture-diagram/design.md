## Context

See [proposal.md](proposal.md). The measures and the census lie in `docs/research/page-figures.md`; the kit that
applies this Change in the checkout's ignored `build/runtime/work/page-figures/`.

## Goals / Non-Goals

**Goals:**

- A guide's architecture file that places nothing builds, laid out as well as the generated page's diagrams.

**Non-Goals:**

- The other kinds (erd, class, workflow), the refusal of a placed file and the repository from the model: later
  Changes of the item.

## Decisions

1. Archify places, the publisher chooses.
   - Rests on: `docs/research/page-figures.md`: the chooser over Archify's automatic layout ranks before the authors'
     placing in 21 of 22 files.
   - Considered: the publisher's own grid as row and column candidates, as the generated page builds them, which
     needs a view made from a guide's file.
   - Chosen because: the measures leave it nothing to win; it can join the candidates later if a work needs it.
   - Applies to: `src/map/guide-figures.mjs`.
2. One choice among candidates, shared.
   - Rests on: the generated page's chooser measures, repairs and pins documents, whatever made them.
   - Considered: a second chooser for guides.
   - Chosen because: one ranking holds every page's diagrams to the same reading.
   - Applies to: `chooseAmong`, `chooseDiagram`.
3. The manifest keeps the author's file; Archify draws the chosen one.
   - Rests on: the manifest records what the work states, and the citations read the author's sources.
   - Considered: recording the drawn file, which changes with the publisher.
   - Chosen because: a work's digests change only when its author's files do.
   - Applies to: `guidePage`, `writePage`.

## Risks / Trade-offs

- Each placeless architecture diagram costs its chooser's runs, at every build and every check: about 8 s a diagram
  on this host, four Archify processes at a time. The answers kept between processes (`ARCHPUB_ARCHIFY_ANSWERS`)
  hold the candidates' answers as they hold the generated page's.
- A file that states a connection's side, route or label place counts as placing, and is drawn as written: the
  chooser re-sides and pins connections, which would override the author.
- The chosen diagram is measured without the file's sources and repository, which Archify verifies only against the
  checkout; the layout does not depend on them.
- In one of the 22 files the chosen diagram keeps a route along an edge that the author's placing avoided, against
  four misread labels it removes.
