## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, which holds the census: the
facts, their places, and which counts the maintainer made twice. This Change orders the work; it builds none of it.

## Goals / Non-Goals

**Goals:**

- Every repetition the census found is named by an item of the queue, or is corrected here where a sentence
  corrects it.

**Non-Goals:**

- Building either item: each Change of an item is its own, in the queue's order, with a design that rests on the
  research page.
- A model's facts across its languages. Each language of a work is a whole model in a directory of its own, by
  the owner's ruling of 2026-11-09; one source for what two languages share is a change of the model's form and is
  weighed when that form is next opened.
- The published works' own files. A guide's diagram files lose their repository block with `page-figures`, in a
  Change of the publications.

## Decisions

1. Two items, not one.
   - Rests on: `docs/research/one-source.md`, "What follows": five kinds of repetition. Three lie in the source
     that draws an edition (a literal beside its token, a name formed in several modules, a string shared by the
     JavaScript and the Typst); two lie between the source and what describes it (the schema and the loader, a
     document's table).
   - Considered: one item for all five, before the rest of `edition-map`. It would hold the edition's open work
     behind a redesign of how a model is validated, which the census shows to be the largest part and which needs
     research of its own: what the loader refuses today, and what reading the schema would keep of its codes.
   - Chosen because: the first three are small, change no delivered byte, and are what the next Changes of
     `edition-map` write on: a plate's key, a label that the class sets and the publisher queries, the house's
     measures. The other two touch no page of an edition.
   - Applies to: the order of the queue.
2. `one-source` stands before the open rest of `edition-map`; `derived-references` before `performance`.
   - Rests on: the same page, "Names the source forms" and "The house's measures".
   - Considered: both after `edition-map`. Its open Changes (a plate tied to the overview, the answer in one
     place, the overview in three sizes) would then form the same names in more places first.
   - Chosen because: a repetition is cheapest to remove before more code repeats it. `performance` is open and
     ends by a measured condition; an item behind it waits for that.
   - What moves back: the rest of `edition-map` and every item after it by one; `performance` and every item
     after it by one more.
   - Applies to: the order of the queue.
3. The model reference names no version of the icons.
   - Rests on: the same page, "The reference documents": the package and the icons' policy hold 1.74.0, a tool
     holds them to the lock, and the reference said 1.73.0.
   - Considered: correcting the number. It would be wrong again at the next release of the icons.
   - Chosen because: the version has a source, `.config/release/icons/policy.toml`, and the sentence points to it.
   - Applies to: `docs/reference/model.md`. The other tables a document keeps by hand wait for
     `derived-references`, which writes them from the source.

## Risks / Trade-offs

- The open work of `edition-map` waits for the Changes of `one-source`. → They are two, and each lands in the time
  one Change takes.
- The census was read by agents; the maintainer counted eighteen of its rows again. → The research page marks
  which, and each Change of an item counts its own rows before it removes them.
