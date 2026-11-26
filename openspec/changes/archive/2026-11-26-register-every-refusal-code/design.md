## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` holds the census of 2026-11-20
and, in the section this Change adds, the count it rests on: 181 codes, of which the reference's table named 102;
2 are printed by a failed command, 103 are a refusal's code, 67 only a problem's, 8 a warning's and 1 internal; 12
are formed from a medium's name and 10 raised by the Typst classes. An independent review found 8 problem codes of
the projection's invariants that a first count had missed.

## Goals / Non-Goals

**Goals:**

- One place states each code and its meaning, and every raise of a code is held to it.
- The refusals reference says what the registry says and nothing else.

**Non-Goals:**

- Changing a code, a message, an exit status or what a refusal carries.
- The model's vocabulary and the other reference tables: the next Changes of the item.
- Codes of another product that a refusal passes on, such as Archify's: they are Archify's to state.

## Decisions

1. **The registry is data beside the refusal module.** `src/refusal.json` is keyed by code, in the reference's
   order; a code that shares another's meaning names it with `with`. The product reads it for a type alone
   (`Code` is `keyof typeof import("./refusal.json")` in JSDoc), so nothing loads it at run time. The tools of
   the repository import no module of the product's (the module boundaries test); the writer is the first to
   read a file under `src/`, and it reads it as data.
2. **The type check holds the raises it can see.** `refuse`, `Refusal`, a problem, the model's problem helpers
   and each function that passes a code on (`writeNew`, `commitOf`, `readAcceptance`, the invariants' `differ`)
   take `Code`, so a literal no key names fails `npm run check:types` at its line. A code built from Archify's
   answer, a warning's object or an error's own field is a string the types do not follow.
3. **A test reads every place a code stands.** It collects the literals in a code's places (a `code` field, the
   first argument of a raise, a fallback after `code ??`, a Typst `panic("code: …")`, and the Typst helpers'
   template over the media their type names) and holds that set equal to the registry's keys both ways, so a
   raise the types do not follow and a registered code that nothing raises any more both fail it.
4. **Three tables, one row each.** The codes a failed command names (the two the command line prints, then the
   refusals), the problems with the refusals that carry them, and warnings, each between two comment lines that
   name the writer. The writer formats the document with the repository's Prettier, so a written table reads as
   one set by hand. The internal code is registered and not printed.
5. **New meanings state no limit or pattern of the model.** They name the model's rule and leave its value to the
   model reference, so the next Change, which reads the model's vocabulary from its schema, has nothing more to
   remove here.
6. **Route defects are measures.** They rank candidate layouts and never reach a reader, so they name their kind
   in `kind`, not `code`.

## Risks / Trade-offs

- [Meanings in a data file are reviewed less than prose] → The written reference is in the diff of every Change
  that touches the registry, and the reader of the reference reviews it there.
- [A code formed by a template the test does not know, or raised in a place it does not read] → The test's
  places are the ones the source uses today; a new form of raise fails its second direction (the code is
  registered and found nowhere) until the test reads it.
