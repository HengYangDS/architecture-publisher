# Authored text ownership

## Decision and scope

Add optional `owner` to the existing authored text record. It names one
scene-local node, not a source entity, trust identity or runtime owner. An
omitted owner preserves the current external-label checks. No ownership is
inferred from visual proximity, shared source references or naming.

This bounded repair follows the requester's standing authorization to make
best decisions and remove incidental complexity. Source-specific art remains
outside Publisher. The current failure is reproduced by released alpha.10
through its ordinary `archpub edition build` entry point.

## Required invariants

1. The owner resolves to exactly one source-bearing node in the same medium.
2. The measured text box lies inside that node's semantic port box with an
   eight-unit inset. A larger primitive paint envelope cannot enlarge this
   allocation or move its ports.
3. Structural references carried by interior text must already belong to its
   owner. Source or editorial statements retain their existing independent
   carrier checks; an owner does not make wording verified.
4. Every other text, node, actual primitive, line and arrow remains an obstacle.
   The owner exemption applies only to containing node paint, not arbitrary
   decorations or unrelated paths. In primitive painting, only the first
   fill whose extent contains the semantic allocation may surround the text;
   subsequent or interior fills and every contour
   retain clearance. Native component paint already owns its labels and
   receives no blanket exemption for an additional authored label.
5. Geometry and painting consume the same admitted text/owner relation. Native
   font checks and renderer-native checks both retain it.
6. Static and interactive derive their own ownership, geometry and acceptance.
   A passing sibling grants no exemption.

## Alternatives

| Option                                       | Decision                                                       |
| -------------------------------------------- | -------------------------------------------------------------- |
| Move every label outside nodes               | Reject: changes the authored layout and increases clutter.     |
| Exempt text by overlap or shared meaning     | Reject: ambiguity and accidental collisions become acceptance. |
| Patch ETHOS's private renderer               | Reject: preserves duplicate mechanics and source coupling.     |
| Explicit owner in the existing text contract | Select: one small field, local checks, no new command plane.   |

## Implementation boundaries

The authored schema remains the single format authority. Its generated
validators are regenerated through the existing tool. The interactive scene
reader admits and checks the field; shared pure geometry handles containment
and non-owner clearance; Archify's existing text adapter carries the declared
relation into native validation. Static auditing uses the same declared owner
without acquiring interactive coordinates or approval.

Do not fork font measurement, route validation or publication. Correct the
smallest existing owners. Existing ownerless scenes must remain byte-identical.

## Acceptance and migration

First capture RED for valid interior text and its adversarial cases. Then
verify missing/prototype owners, adornment misuse, wrong structural binding,
inset violation, neighboring text/node collision and crossing routes. Exercise
the actual installed package and desktop browser, and keep all four coverage
dimensions at least 95 percent.

The ETHOS thirteen-page and independent static rehearsal remains unaccepted
until source-specific semantic and visual checks pass. This repair does not
authorize rebinding old hashes, dropping explanatory paths, source acceptance
or retirement. Historical signed packages, tags and approved media stay frozen.
