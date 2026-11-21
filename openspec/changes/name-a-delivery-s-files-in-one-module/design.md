## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "Names the source forms": a
delivery's file names, `manifest.json`, the acceptance's three files, the delivered `model.json`, `images/` and
`figures/`, a number in two digits, a plate's key, a revision cut to seven characters and the Typst version are each
formed in two to six modules, counted twice. This is the second Change of the item `one-source`; it adds its searches
to the test the first one writes, `tests/one-source.test.mjs`.

Two facts bound it. The staged files and the labels that the JavaScript and the Typst class share are named on both
sides, and the class reads the staged `model.json` by name; giving them one source edits the class, and so the
manifest's digest of it, which is the next Change of the item. And the names that no unit could import before:
`src/delivery.mjs` held four of them as constants, but the manifest, the pinned edition, the edition and the command
line's reports stand beside or below the delivery in `tests/module-boundaries.test.mjs`.

## Goals / Non-Goals

**Goals:**

- Each name in the census's rows above stands in one module, and every module that writes, lists, reads or reports
  it takes it there.
- A test refuses a module that writes one of them again, in the forms the census found.
- Every delivered byte, every refusal and every help text stays as it is.

**Non-Goals:**

- The staged files (`edition.json`, `breaks.json`, `colophon.json`, `house.json`, `overview-inputs.json`, the
  directory `archpub`, a plate's staged `plates/NN.svg`) and the five labels: shared with the Typst class, the next
  Change of the item.
- The Typst version in the Mise configuration and the reference documents, and the delivery's files listed in the
  operations reference: carriers other than the JavaScript.
- The literals of the tests: a test may state what it holds the product to.

## Decisions

1. A unit that imports nothing names a delivery's files.
   - Rests on: `docs/research/one-source.md`, "Names the source forms"; `tests/module-boundaries.test.mjs`, where the
     delivery stands above the build, and the edition's typesetting is a medium the pinned edition and the command
     line may not import.
   - Considered: the delivery's constants exported to every reader, which the boundaries refuse below the delivery;
     the edition's typesetting, which already formed the page's, image's and figure's names, handing all of them on,
     which would have the manifest, the pinned edition and the command line import a medium.
   - Chosen because: a unit that imports nothing can be imported by every unit that names a file, as `house` is for
     the tokens. Its surface is names and the functions that form them, nothing that reads or writes.
   - Applies to: `src/names.mjs`, its fifteen importers, and the units `tests/module-boundaries.test.mjs` admits; the
     manifest's units become `map` and `names`.
2. A name formed from a value is formed by one function of the unit.
   - Rests on: the census rows of the files named by the model's id, a number in two digits, a plate's key and a
     revision cut to seven, each formed by a template or a call repeated in its modules.
   - Considered: constants for the extensions and the prefix, with each module forming the name as before, which
     keeps the form in every module.
   - Chosen because: the form is the fact: a reader takes `filesOf(id).edition`, `two(page)`, `plateKey(page)`,
     `plateNumber(key)` or `shortRevision(revision)`, and the unit's own test holds each to the name deliveries carry.
   - Applies to: the four files of a model's id, the page's name `NN-<view>` and its image and figure files, the
     overview's page and key, a plate's key, a short revision.
3. The staged `model.json` has a name of its own.
   - Rests on: the census's two rows "The delivered `model.json`" and "Files staged for Typst": two facts spelt
     alike, the second of which the class reads by name.
   - Considered: one name for both, which would move the staging with the delivery, or the delivery with a renamed
     staging, and give the next Change a name to split.
   - Chosen because: `STAGED_MODEL` is the staging's, read where the model is staged and where the edition's and the
     overview's Typst entries read it; the next Change moves it to the table the class reads.
   - Applies to: `src/overview/typeset.mjs`, `src/edition/typeset.mjs`.
4. The refusal of an id that names two files alike is derived from the names.
   - Rests on: the census row of `manifest.json`, which counts the table of `src/projection.mjs`: four ids listed
     beside the names they would take.
   - Considered: the same table with the names read from the unit, which still lists by hand which ids collide and
     misses a name the unit adds.
   - Chosen because: an id is refused when one of the files it names is a file the delivery names itself; the same
     four ids are refused with the same messages, and a name added to the unit is held without a new row.
   - Applies to: `requireDeliveryNames` in `src/projection.mjs`.
5. Words and help take the names as arguments.
   - Rests on: the census row of the acceptance's files: five languages' words and two help texts state them.
   - Considered: the words importing the names, which keeps each language joining two literal names.
   - Chosen because: the reading note already takes the page's name; the words state how a language joins two names,
     and the caller hands it the names. The help of `accept` and `verify` is a template on the same names.
   - Applies to: `colophonNote` in `src/edition/words.mjs` and its caller `src/edition/colophon.mjs`, and the help
     in `src/cli/run.mjs`.
6. The searches derive what they refuse from the unit.
   - Rests on: the research page's "What follows": a name formed in several modules is refused by a search for its
     form outside its one module; the first Change's search refuses a repetition, not a disagreement.
   - Considered: a list of the names in the test, which states each name again beside the unit.
   - Chosen because: every string the unit exports is searched: a file's name as a word of a text, between quotes,
     spaces or a path's slash, and a directory or page name whole or at the head of a path, so that a placeholder
     such as `<model.json>` and the word "images" in prose pass. The forms are searched as the census found them: a
     template ending in a delivered extension on a model's id, `padStart(2, "0")` but for a hexadecimal byte, a string
     beginning `plate-`, and `slice(0, 7)`.
   - Applies to: `tests/one-source.test.mjs`.

## Risks / Trade-offs

- [A name's value mistyped in the unit moves a delivered byte] → The unit's test holds each formed name to the name
  deliveries carry, and the lane builds at its base and its head and compares them byte for byte.
- [A string equal to a name, written for another reason] → The search refuses it, and the author names the fact in
  the unit where it is a name, as the staged model is, or writes it as the placeholder or prose it is.
- [A repetition in a form the search does not know] → The search found two the census had not counted, the reader
  file's command and the overview's entry; a new form joins the test when it is found.
- [The staged plate's file `plates/NN.svg` is formed twice, by the record and the typesetting] → It is a staged name
  the class reads; the next Change of the item gives it its one place with the other staged files.
