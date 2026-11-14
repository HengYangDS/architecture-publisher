## Context

See [proposal.md](proposal.md). The inventory dated each tracked file by the last commit that changed it and read
the 102 files older than a week that are neither received material nor archived Changes: each for a consumer, for
statements that no longer hold at 0.14.0, and for its place in the tree.

## Goals / Non-Goals

**Goals:**

- No tracked page presents a replaced design as current.
- No tracked file names a private network address, and a test keeps it so.
- Every tracked file has a consumer and stands where its like stands.

**Non-Goals:**

- Rewriting history. Earlier commits, tags and released archives keep the bytes they have; the address in them is
  a private one that no outside reader can reach.
- The archived Changes since the first public release, which are the record of the product as it is.
- Received material, which is pinned by digest and never edited.
- The Linux CI image's Playwright version, which belongs with the next supply change.

## Decisions

### The research pages are retired whole

Trimming them would leave pages about probes of D2, Graphviz, ELK, Dagre and ECharts, none of which the product
uses, and a custody readback of a private project. What the product does today is stated by the contract and the
references, and what was tried before is in Git. One sentence is kept: the product compiles sources and stated
meaning into publications and must not become a second intent store, a repository lifecycle, a workflow state
machine, a code-graph authority, an editor, a marketplace or a resident service. It becomes a boundary of the
contract. Alternative rejected: keeping the pages with a banner, which keeps 2 MB of captures and nine private
links for a history Git already holds.

### Alpha headings keep their text and lose their links

GitHub holds no tag before v0.4.0, so the 25 headings have no public target. Each stays as a heading without
brackets, and its link definition goes.

### The guard reads what Git tracks

A test lists the tracked files with `git ls-files`, reads each that is text, and refuses an IPv4 address in the
three ranges RFC 1918 reserves, naming the file and line. This Change names the ranges by that RFC and not by
their numbers, so that its own archive and the merged specification pass. Received material is read too: nothing
there holds one today. Without a Git checkout, as in an unpacked package, the test is skipped. The CI projection's
own assertion about GitHub's workflow uses the same pattern, so that no test names a host.

### Archived Changes from before the first public release leave the tree

Thirty-six Changes were archived between 15 September and 3 October, before 0.4.0 replaced the whole product.
They specify Source Bundles, Claim Models, Candidates, Providers and Qualifications, none of which exists now;
no tracked file outside the archive names any of them. Eight of the nine current specifications were written
anew when the product was replaced, the specifications before them were removed then, and the ninth,
`product-identity`, names no early part. Their 200 files leave the tree and Git keeps them. The 35 Changes archived since stay. The owner agreed
to retire them.

### The migrator stays an importer

The inventory read `src/importers/model.mjs`, which migrates a model from an earlier version, as mislaid beside
the LikeC4 importer. Moving it to `src/model/` failed the import layering: the command line may import the
importers and not the model, so every conversion into a current model, from LikeC4 or from an earlier version, is
an importer. The file stays where it is.

### The format-selection policy goes with its only rows

The policy listed the three research captures as immutable carriers and nothing else. With them gone the file has
no row; an empty policy is no policy, so the file and its line in the configuration reference go too.

## Risks / Trade-offs

- [A page held a decision recorded nowhere else] → each page was read for decisions the product still rests on;
  the boundary sentence was the one found, and it is moved before the pages go.
- [The guard refuses a version string of four numbers that starts with 10] → the test is run over the tree before
  it lands; no tracked file has one.
- [A proof gate needs the format-selection policy or the early archive] → the document, format and OpenSpec gates
  are run on the lane before it is proved.

## Migration Plan

None.

## Open Questions

None.
