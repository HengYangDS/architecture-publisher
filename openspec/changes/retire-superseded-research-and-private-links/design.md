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
- The archived Changes, which are OpenSpec's own record. Whether those older than the first public release should
  leave the tree is a separate question, not yet checked against the proof gates.
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

A test lists the tracked files with `git ls-files`, reads each that is text, and refuses an IPv4 address in
10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16, naming the file and line. Received material is read too: nothing
there holds one today. Without a Git checkout, as in an unpacked package, the test is skipped. The CI projection's
own assertion about GitHub's workflow uses the same pattern, so that no test names a host.

### The migrator lives with the model

`src/model/migrate.mjs` takes the file whole; `src/cli/run.mjs` and the migrator's test follow. The command and its
behaviour do not change.

### The format-selection policy goes with its only rows

The policy listed the three research captures as immutable carriers and nothing else. With them gone the file has
no row; an empty policy is no policy, so the file and its line in the configuration reference go too.

## Risks / Trade-offs

- [A page held a decision recorded nowhere else] → each page was read for decisions the product still rests on;
  the boundary sentence was the one found, and it is moved before the pages go.
- [The guard refuses a version string of four numbers that starts with 10] → the test is run over the tree before
  it lands; no tracked file has one.
- [A proof gate needs the format-selection policy] → the document and format gates are run on the lane before it
  is proved.

## Migration Plan

None.

## Open Questions

None.
