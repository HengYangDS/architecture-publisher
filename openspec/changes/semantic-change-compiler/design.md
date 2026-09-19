## Context and ownership

The approved increment belongs to workline E, not a replacement for worklines
A (accepted delivery), B (tool availability), C (ETHOS development) or D (mechanism
research). The existing product design owns their relationship; this Change owns
only implementation and acceptance of the bounded semantic compiler.

## Contract

`architecture.semantic-document/v1` contains one source owner, a declared entity
and relation vocabulary, content-bound provenance, identity-keyed entities,
relations, assertions and opaque context. Entity and relation qualifiers retain
complete JSON values, including conditions, direction, quantifiers, scope and
maturity. Assertions retain original values and either an explicit proposition
or an opaque statement with unknown dependency coverage. No parser invents a
formal meaning for prose. Provenance binds bytes and a declared owner, not trust.

References use section/id pairs. Relation endpoints and proposition endpoints
create dependencies; assertions declare further references and whether coverage
is complete. Cycles are traversed by a finite fixed point, not recursive guessing.
Contradictions mean opposite polarity of the same explicit proposition under
identical qualifiers. Other contradictions are not claimed detectable.

## Change and impact

Complete values produce sorted add/remove/change sets. Labels do not identify
entities. Rename/split/merge require disjoint removed and added identities plus
digest-bound source locations; they record correspondence, not equivalence.
Unchanged identity does not hide changed qualifiers. Source-owner changes fail.

Impact includes both before and after dependency graphs so removed and rewired
relations cannot disappear. Unknown coverage, unrepresented change, source or
opaque-context changes broaden impact to all selected views. View dependencies
also propagate transitively. Rebuild, verify and review are distinct obligations
with reasons, not executed operations or transferred approval. New bytes always
need applicable evidence; no acceptance cache is created.

## Existing consumer

The ETHOS adapter maps admitted projection values without dropping unknown
attributes. Copy assertions remain opaque because current source does not provide
a complete formal dependency model. Contracts and presentation remain explicit
opaque context. Existing output fields are a projection of the single generic
comparison result, not a parallel diff algorithm. Candidate preparation retains
its real refresh-only rendering boundary and exposes compiler obligations.

## Portable command

`architecture semantic compare <plan.json> --sha256 <digest>` reads a bounded,
digest-selected plan and before/after documents. Paths resolve relative to the
plan, use the existing regular-file/symlink guards, and require no repository,
network, credentials or external executable. Output is JSON on stdout; reading
does not publish, approve or modify input. The format is versioned and strict.

## Execution and verification

The bounded mechanism reading used Bazel Skyframe's explicit dependency and
invalidation model (`https://bazel.build/reference/skyframe`) and W3C PROV-DM's
separation of revision, derivation and identity (`https://www.w3.org/TR/prov-dm/`),
read on 2026-09-19. The adopted mechanisms are explicit dependencies, conservative
invalidation and declared lineage rather than equivalence. No Bazel runtime,
RDF store, source-authenticity claim or general provenance inference is imported.
Broader workline D source/implementation comparisons remain separate work.

Representation reachability is computed once backward from selected views;
impact is computed once forward from changed identities. Both traversals are
linear in the admitted graph, including cyclic declarations. They do not execute
source code or evaluate arbitrary predicates.

1. Implement the contract, change algebra and dependency compiler with failing
   tests for meaningful qualifiers, identity correspondence, unknown coverage,
   contradictions, cycles, reordering, growth and invalid inputs.
2. Adapt the real ETHOS comparison and candidate consumer. Preserve frozen replay
   behavior; test both its supported refresh and unsupported changes.
3. Add the public command, relocated/offline installed tests and examples.
4. Review the entire branch, run native proof gates, integrate and publish signed
   source and an admitted compiler package. Do not rebuild unchanged artwork.
5. Verify publication and preservation, close the native Change and retire only
   this owned lane and disposable execution residue.

There is no general solver or layout claim: label/density changes yield explicit
rebuild/check obligations and unsupported authoring fails at its existing owner.
The product keeps zero runtime dependencies and existing source-file readers.

## Closeout authority

Implementation tasks end with observed release and download verification.
Archive, metadata synchronization and lane retirement remain required by step 5
and the native lifecycle, not a self-referential task that must be checked before
its own archive or worktree removal. Native receipts and final observed state
prove those effects; no unchecked operation is declared complete in advance.

The default native gates execute 488 tests: 479 pass and nine require opt-in
historical inputs. Six current artifact checks and one retained-delivery rehearsal
were separately exercised. Two legacy checks require the original 18-member
static/historical-review bundles and remain outside this release's qualified
input set; substituting the current 12-member bundle was rejected, not hidden.
The current 13-page alpha.3 atlas replays byte-identically. Its artwork and browser
acceptance are preserved, not newly granted by compiler tests.
