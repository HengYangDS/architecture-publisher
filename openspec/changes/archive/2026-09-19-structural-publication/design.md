## Product boundary

The selected input is a closed source bundle containing one validated
`architecture.semantic-document/v1` and every byte named by that document's
sources. A separate authored publication binds the semantic digest and declares
views. The compiler validates rather than infers meaning.

Each view has one purpose (`overview` or `mechanism`) and a list of groups. A
group owns an ordered entity list; the union of groups is the view's exact entity
set. Relations are separately ordered. Each selected relation requires explicit
`fromSide`, `toSide` and route. The authored style map is a total mapping from the
selected semantic vocabulary to the finite Archify architecture vocabulary.
Labels and relation endpoints come from the semantic document, never copied into
the authored layout.

The constrained compositor uses stable bands: groups are stacked vertically and
their entities are placed left-to-right in declared order on a bounded grid.
Group boundaries are emitted from the same membership declaration. It does not
search arbitrary layouts. Unsupported cardinality, missing membership, duplicate
membership, unselected endpoints, contradictory semantic documents and renderer
quality failures stop before the output directory is promoted.

## Output and media

Every view is rendered through the pinned Archify backend and retains its complete
semantic subgraph. The overview must include every semantic entity and relation;
mechanism views may select a complete declared subgraph. The overview SVG is the
exact SVG embedded in its checked HTML, not a second drawing implementation.
The output manifest binds the source bundle, semantic digest, authored input,
each HTML page and the static SVG. Generated files are never edited.

Static and interactive media share semantic identities and routing declarations,
not coordinates. Existing renderer quality checks cover endpoint attachment,
route shape, composition and readable output. Product tests additionally verify
source membership, visible node/edge identity and source-to-output completeness.

## Real adopter

AIGW is selected because commit
`069c2a655a5a1b9124d656e64b2d323ff53baf11` introduced an ordered operational
client registry over parent `36a6a28336280b71c4dc8d793a75bdb2671bb73c`.
The source adds `internal/client/registry.go` and routes discovery, planning,
application, inspection, verification and withdrawal through the registry. The
adopter inputs cite exact Git blob bytes from those revisions. They are curated
architecture assertions, not automatic code inference or an AIGW approval.

The initial view describes the prior synchronizer with direct client-specific
paths. The evolved view adds the registry and adapter contract, regrouping client
operations behind the ordered registry. Both revisions produce a complete
overview and complete mechanism views. The installed journey runs from a copied
package with an empty HOME and PATH and without either source repository.

## Rejected alternatives

- Extending the ETHOS-only candidate schema would mix product-specific copy and
  generic structural publication.
- Treating the existing service-topology example as the adopter would prove only
  self-authored fixtures.
- Importing a graph-layout engine now would add supply and maintenance before the
  finite band compositor demonstrates a concrete gap.
- Extracting symbols automatically would confuse code reachability with intended
  architecture. Explicit source-bound curation remains the authority boundary.

## Completion boundary

This Change completes P1 and the initial/evolved offline publication portion of
P2. P2 visual/browser acceptance, P3 consolidation and P4 Skills/CI remain
separate dependent closures unless their evidence is completed here without
adding another authority.

## Observed cost and limits

On the September 19, 2026 acceptance host, fresh source-bound compilation took
668 ms for the initial AIGW structure and 975 ms for the evolved structure. The
uncompressed output bundles occupied 6,024,385 and 8,211,702 bytes. Bounded
Chromium 153 observations occupied 398,409 and 597,348 bytes and covered every
declared HTML view plus direct `image/svg+xml` paint of each overview. These are
observed values, not performance guarantees.

The reusable compiler is 412 lines and the dedicated browser observer/checker is
389 lines; focused semantic/adopter/browser-check tests are 599 lines. Portable
authoring and semantic inputs for both AIGW revisions are 399 lines, excluding exact selected
source copies. The compositor permits at most twelve views and eight entities
per group, supports a finite renderer vocabulary and three route forms, and
does not infer intent, search arbitrary layouts or grant human/independent
acceptance. Browser evidence covers the selected 1440 by 1000 viewport only.
The compact `examples/aigw/browser-acceptance.json` receipt binds the exact
publication and browser-report digests plus verifier bytes; raw screenshots and
reports remain disposable build evidence rather than Git payload.
