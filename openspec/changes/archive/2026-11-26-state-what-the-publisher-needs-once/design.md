## Context

See [proposal.md](proposal.md). The census of 2026-11-20 on the research page `docs/research/one-source.md` counted
the Typst version in eight lines of four reference documents beside its owners; three of them are the refusals'
rows, which the registry's meanings now hold. The committee of 2026-11-26 chose one written table in one document,
filled from each version's own owner, with the prose pointing to it (the page's section "How the rest of the
references are written").

## Goals / Non-Goals

**Goals:**

- Each version the documents state is read from one owner and written by the command.

**Non-Goals:**

- The development tools' versions, which `.config/mise/config.toml` and its lock own and the configuration reference
  points to.
- Changing a version or what the publisher refuses.

## Decisions

1. **The package states what it needs of its host.** Node.js's floor already stands in `engines`; the Typst release
   joins it as `engines.typst`, which npm ignores as it ignores every key but `node` and `npm`, so the field states
   it and the publisher's own check enforces it; the lock's root entry carries it too. `src/names.mjs` reads
   it from the package, as the command line reads the package's version, so the product and the writer read one
   statement, and the tools import no product module.
2. **The bundled Archify's version is its supply manifest's.** `renderers/archify/supply/supply.json`, which the
   supply check verifies.
3. **One table, the prose points to it.** "What it needs" stands under the operations reference's installation; the
   other documents link to it, and the configuration reference names the owner of Taplo's tag instead of the tag.
4. **The registry's meanings say `{typst}`.** The writer fills the package's release in, so a refusal's meaning
   cannot name another.

## Risks / Trade-offs

- [The development pin of Typst in `.config/mise/config.toml` and `engines.typst` part] → CI typesets with Mise's
  Typst, and a release archive takes its Typst from the same lock, while the publisher refuses any release but
  `engines.typst`: every pipeline and the archive's own test fail at once. Deriving the Mise pin needs its lock
  rewritten, which stays a supply Change's step.
- [A version read in a reworded field] → The writer refuses with `references_source_unreadable` and names the
  fields; the writer's test changes the table by hand and is refused.
