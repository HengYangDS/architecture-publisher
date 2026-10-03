# Static arrow presence

## Decision

The generic static audit must qualify the geometry that is actually painted.
A literal segment always carries arrowGeometry, but arrow false means it has
no arrowhead. Existing `auditEmittedEdges` already distinguishes this boundary.

At the existing `scene/static/audit.mjs` owner, gate minimum terminal length
and arrow-envelope checks on `edge.arrow !== false`. This preserves historical
legacy arrows whose optional flag is absent. Do not delete bridges, fabricate
longer geometry, loosen clearance, or add a second arrow policy.

Unarrowed shafts retain finite orthogonal geometry, endpoint and text/node
collision checks. Declared source routes still require connected ordered
traversals and their final forward arrow; this repair cannot authorize an
unarrowed final source relation.

## Evidence and tests

Released alpha.11 rejects thirty-six two-to-four-unit junction bridges in the
exact selected ETHOS static rehearsal. The isolated two-unit counterexample
also receives an invented arrow envelope. Both native RED reports are retained
under the caller-owned migration evidence, not copied into a new authority.

Use the existing static audit fixture for true, false and absent flags. Capture
RED for valid short unarrowed segments and ignored inactive arrow parameters.
Retain short true/default-arrow refusal, actual arrow collision, shaft crossing
text, detached endpoints and malformed path refusal. Exercise canvas envelopes
and emitted literal geometry through the actual consumer.

After focused GREEN, verify sibling static and authored-route cases, the full
four-dimensional 95% coverage floor, and installed public builds with relocated
inputs. Existing self and neutral media remain unchanged where their inputs
are unchanged; whole Candidate supply identity may change. The ETHOS rehearsal
must retain all original nodes, routes, texts and source claims.

## Boundaries and release

No schema, command, persistent graph, supervisor or dependency is introduced.
Static and interactive remain independent. Source-specific design and glyph
fidelity are not asserted by a generic geometry fix. Publish a successor only
after its exact package and native gates pass; alpha.11 remains immutable.

Implementation tasks finish at verified release, handoff and closeout
prerequisites. Actual archival and Lane retirement are later required native
effects with their own receipts, not prerequisites of their own admission.
