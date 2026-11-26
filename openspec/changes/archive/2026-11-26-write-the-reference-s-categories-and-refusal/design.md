## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` found the model's vocabulary written
in the schema and again elsewhere. The vocabulary, fields and categories Changes of 2026-11-26 stated it once in the
publisher's code; their non-goals left the reference documents' tables, sentences and sample to this Change, the
queue item's last.

## Goals / Non-Goals

**Goals:**

- The model reference's categories and statuses and the command line reference's sample refusal are written from
  their sources by the reference writer, and the check of generated inputs refuses them changed by hand.

**Non-Goals:**

- What a category looks like, and the words of a refusal's messages.
- The model reference's row of versions, which stays written by hand (Risks).

## Decisions

1. **The categories' looks in a registry.** The writer may not import the publisher's source
   (`tests/module-boundaries.test.mjs`, "repository tools stay independent of the product source"); it reads the
   registries `src/refusal.json`, `src/delivery.json` and the schema, and runs the command line. The looks move from
   `src/kinds.mjs` into `src/categories.json`, which `src/kinds.mjs` reads by its URL, frozen, as `src/names.mjs`
   reads `src/delivery.json`; the module keeps its exports, so no reader changes. Alternatives: a command that prints
   the looks, which adds a surface for a document only; or an exception to the boundary, which the boundary exists to
   refuse.
2. **The table and the status written from the schema and the registry.** The categories in the schema's order, each
   with its default icon, Archify's type, whether it lies outside the system and takes the accent, and the schema's
   default marked; the statuses as a row of the table of values, to which the item on `status` points. The table
   gains the default icon, which the prose said each category has without naming it, and two rows say what the code
   does: `external` takes Archify's external type, `security` the palette's accent on plates.
3. **The sample refusal is the command's own output.** The writer copies `docs/reference/refused-model.json` into a
   scratch directory as `model.json`, the name the page shows, runs `archpub check model.json` with `NO_COLOR=1` and
   only `PATH`, and writes the output as the page's block; the page links the sample, whose second component
   misspells `label`. Only the refusal the sample is built for is written: an accepted sample
   (`references_sample_accepted`), a refusal other than `model_invalid`, such as a bundled supply that differs from its
   manifest (`references_sample_unexpected`), and a failure (`references_sample_unreadable`) each stop the writer
   before it writes anything, with what the command printed. A sample that is not JSON stopped it with the second
   (2026-11-26, in the copy); the first is not tested, as a check of a model the publisher accepts draws its page,
   which is heavy work for a unit test. Alternatives: a test fixture, which ties the writer to the tests; or a model
   the writer derives from a fixture, which a reader cannot open.
4. **The earlier versions named once in the documents.** The model reference's section on earlier versions is the
   one place that names them, with what each held and how it converts; its row of `version`, the operations
   reference's item on `migrate` and the shipped Skill point to it or say "an earlier version", and the operations
   reference drops its copy of the section's rules. The commands block written from `archpub --help --json` holds
   only the usage, so no document can point there. Alternative: write the row of `version` from the schema's `const`
   and the help's description of `migrate`. Not taken: the row stands in a table written by hand, and the
   description is a sentence the writer would have to take apart.
5. **The overview on a page of its own.** `docs/reference/model.md` stood at 500 non-blank lines, the cap. Its
   overview section, 84 lines, moves to `docs/reference/overview.md` with the references' front matter; the model
   reference keeps a pointer, now 423 lines, and the three links to the section and the references' index follow.
6. **Faces after the model.** A check loaded the icons and the faces together, then the model. The faces took 0.47 s
   of the 0.53 to 0.79 s a check of the sample took by the host's load, and a refused model needs none; the writer runs one per check of
   generated inputs, and its test fifteen. A check, a build and a guide's scaffold now read the model with the icons
   and load the faces only once it is admitted: a refused check takes 0.12 s, and an accepted one loses the 6 ms the
   icons took, which no longer overlap the faces. What the loader refuses is reported before the font supply is
   verified, so a font supply that differs from its manifest no longer hides those problems; this follows from the
   order and is not tested. A model's id that takes the name of a delivery's file (`delivery_name_taken`) is still
   refused after the faces: that check belongs to a delivery, which a guide's scaffold does not make.

## Risks / Trade-offs

- [The writer runs the command line twice] → The check of generated inputs takes 0.57 s where it took 0.48 s; its
  test takes 10.8 s where it took 5.2 s, with three cases more, and took 16 s with five before decision 6.
- [The writer's test links `renderers/`, 40 MB, into its tree] → The command it runs reads the icons' supply and the
  writer reads Archify's manifest; the test changes neither.
- [A message of the publisher changes the sample] → The check of generated inputs fails until the writer writes it
  again, which is the point.
- [The current version, `3`, stands by hand in the model reference's row and its example] → Both are in text written
  by hand; the schema's `const` is the source, and the earlier versions stand in the loader's code, which the writer
  may not read. A registry of versions read by the loader and the writer would let it fill them, a change of its own.
- [`src/categories.json` keys its looks by the schema's categories and names the default again] → As the code did
  before: the drawing units may not read the model, and the categories' looks test holds the two equal. A registry of
  the categories that the schema is written from would remove it; recorded against the queue item.
- [The sample shows a missing `label` twice, as required and as text that is not valid] → The loader reports so
  today, and the sample shows what it reports; a missing field that is also reported as invalid is recorded against
  the queue item.
