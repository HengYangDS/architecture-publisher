## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "Names the source forms": the
labels that Typst sets and the JavaScript queries, five names each a bare string on both sides; the files staged for
Typst, written by name and read by name; and a plate's key, formed in `overview/drawn.typ` as well as in the
JavaScript. Its "What follows" names the kind: a string two languages of the source share with no table between
them. This is the third Change of the item `one-source`; the second left the staged model and a plate's staged
figure for it, and it adds its searches to `tests/one-source.test.mjs`.

Drafting found three more of the kind: the class attaches the model to the edition under the delivered name
`model.json`, which `src/names.mjs` states for the delivery; the overview's inputs, `overview-inputs.json`, and a
plate's staged figure, `plates/NN.svg`, are each written by one module and read by another.

One fact bounds the Change. `stage()` in `src/overview/typeset.mjs` hands back the SHA-256 of the class, the
drawing and the staged tokens, and the manifest records it twice, as `edition.house` and `overview.house`. Any edit
of `house.typ` or `drawn.typ` changes those two values in every delivery's `manifest.json`. The holder ruled on
2026-11-21 that those two may change, and nothing else of a delivery may.

## Goals / Non-Goals

**Goals:**

- Each label the class sets for the publisher to query, each file staged for the class and its directory, the
  directory of the plates' figures, what a plate's key begins with, and the delivered model's name that the class
  sets too, is stated once, in a table that the JavaScript and the class both read.
- A test refuses one of them written again in either language, and holds the one name both must state, the
  table's own.
- Every file a delivery lists keeps its bytes; its `manifest.json` changes in `edition.house` and `overview.house`
  alone.

**Non-Goals:**

- The class's own files, `house.typ`, `drawn.typ` and `colophon.typ`: Typst imports each by the name of its source,
  as the JavaScript imports a module, and the staging copies each under that name.
- The keys of `--input` (`edition`, `revision`, `date`, `density`) and the fields of the records: the names of an
  interface's fields, which a table would name again by its own keys.
- The labels the class sets for itself or that only tests query (`archpub-contents`, `-cover`, `-cover-lines`,
  `-index`, `-page-name`, `-front-rule`, `-list-end`), and the literals of the tests.
- The colophon page's second reading of the tokens beside the class it imports, and the class's measures: the next
  Change of the item.

## Decisions

1. One declarative table beside the source, read by both languages.
   - Rests on: the research page's "What follows" and its rows of the labels and the staged files; the class
     already reads its tokens from a JSON file staged beside it.
   - Considered: the names passed as `--input`, which the colophon page does not take and which reach the class as
     one string a run; the class stating them and the JavaScript reading them by `typst query`, a Typst run before
     any staging; the names written into each record, which states them again in the edition's record, the
     colophon's and the overview's inputs.
   - Chosen because: the unit `names` reads the table once, read-only, and the staging copies it beside the class,
     which reads it with `json` as it reads its tokens; a name changes in one file.
   - Applies to: `src/shared.json`, `src/names.mjs`, `stage()` in `src/overview/typeset.mjs`.
2. The table's own name is the one name both languages state.
   - Rests on: the class must name the file it reads; nothing else can tell it.
   - Considered: an `--input` key carrying the table's place, which is a name on both sides as well and is not
     passed to the colophon page.
   - Chosen because: the JavaScript states the name once, in the table's address in `src/names.mjs`, and stages the
     file under its source's own name; the class states it once, in `house.typ`, and the drawing and the colophon
     page take the table from the class they import. The test holds these two places and no other.
   - Applies to: `src/names.mjs`, `src/overview/typeset.mjs`, `src/overview/house.typ`.
3. Each label is set by `label(...)` from the table, and each query is formed from it.
   - Rests on: Typst markup attaches a label value to the element before it, as it attaches `<…>`; the class already
     sets a plate's heading so (`#label(p.key)`), and reads a plate's staged figure from a path the record holds.
   - Considered: the literals kept on both sides with a test holding them equal, which refuses a disagreement and is
     not a source (the first Change's Decision 4).
   - Chosen because: every label keeps its string, so Typst builds the same document. `recordsUnder` forms
     `query(<label>).map(it => it.value)` once for the overview's four labels and the colophon's one.
   - Applies to: `house.typ`, `drawn.typ`, `colophon.typ`; `src/overview/typeset.mjs`, `src/edition/typeset.mjs`,
     `src/edition/colophon.mjs`.
4. The delivered model's name moves to the table.
   - Rests on: `house.typ` attaches the staged model to the edition as `model.json`, the name a delivery carries
     the model by, which the second Change stated in `src/names.mjs` alone.
   - Considered: the name passed in the edition's record, which every record a test builds by hand would lack; the
     literal left in the class.
   - Chosen because: `MODEL` in `src/names.mjs` reads `delivered.model` from the table and the class attaches by
     it. The staged model is `files.model`, spelt alike and not the same fact.
   - Applies to: `src/shared.json`, `src/names.mjs`, `house.typ`.
5. The class's digest covers the table, and this is the one change a delivery shows.
   - Rests on: the holder's ruling of 2026-11-21 in the item's cut; the class reads the table, so a name changed in
     it changes what the class sets, as a token does.
   - Considered: the digest kept over the class, the drawing and the tokens, which changes anyway with the edited
     class and would miss a later change of the table.
   - Chosen because: the digest records the class's inputs. Exactly these bytes change: in every delivery's
     `manifest.json`, the 64 hexadecimal digits of `edition.house` and of `overview.house`. So the manifest's own
     digest differs, which `archpub compare` lists as the one file `manifest.json`, and a build accepted at the head
     has an acceptance record and a colophon page that name that digest. The pages, images, figures, the edition,
     the data, the reader file and the model are the same bytes, since every label, path and name keeps its string.
   - Applies to: `stage()` in `src/overview/typeset.mjs`.
6. The search reads both languages and derives what it refuses from the table.
   - Rests on: the first two Changes' searches, which refuse a repetition in the forms the census found.
   - Considered: a list of the names in the test, which states each again beside the table.
   - Chosen because: a staged or delivered file's name is found as a word; a directory where a path is formed (at
     its head, joined by `path.join`, or given whole to a name), not as a JSON pointer, a field read by name, a word
     of prose or the command `archpub`; a label whole between quotes or angle brackets; and a quoted text that
     begins as a plate's key does, a search the second Change held for the JavaScript alone. A source file's
     address, `new URL(…, import.meta.url)`, names a file of `src/` and is passed over.
   - Applies to: `tests/one-source.test.mjs`.

## Risks / Trade-offs

- [No Typst ran while this was drafted] → The lane's builds and the test files that typeset run every edited Typst
  line; a refusal or a changed byte is fixed in the source, never excluded from the comparison.
- [Typst resolves a path read from the table, or places a label value, otherwise than a literal] → The path is
  resolved from the call in the class, as `read(p.file)` already is, and a label value attaches as `#label(p.key)`
  does; the comparison of pages and figures shows any difference.
- [`archpub compare` does not report the pairs identical] → It lists `manifest.json`, whose two digests change; the
  proof requires that file alone and a manifest that differs in the two values only.
- [A word spelt as a directory's name] → The search refuses a directory in the forms a staged path takes; a new
  form joins the test when it is found.
