---
subject: architecture-publisher:edition-contract
role: policy
state: canonical
relations:
  governed_by: product-contract.md
---

# Architecture Edition v1 contract

This page describes the historical Edition v1 input, which selects one exact
Claim Model. The selected-input successor first released in
`v0.3.0-alpha.4` also admits native sources without a tracked duplicate Claim
Model. It does not retroactively change valid v1 Editions or establish an
adopter's acceptance.

An Edition is the smallest complete public unit of Architecture Publisher. It is
not a theme, diagram file, renderer preset, or copy of the source model. It is a
deliberate answer to a bounded set of reader questions over one exact Claim
Model.

## Required identity

Every Edition binds:

- stable Edition ID and owner;
- exact product and semantic schema versions;
- source and Claim Model digests;
- class: `structural` or `flagship`;
- audience and reader questions;
- required claims and explicit omission policy;
- narrative and reading order;
- visual grammar;
- one complete static scene;
- one complete interactive overview plus optional complete mechanism scenes;
- qualification obligations.

## Authority

Source owners determine facts and accepted meaning. An Edition may select,
aggregate, annotate, and sequence claims, but may not change their plane, scope,
condition, maturity, validity, or provenance. Any editorial assertion introduced
by the Edition is itself a source-bound claim.

Omission is a decision, not absence. Every source claim is either represented in
a declared view or classified by an explicit omission rule. Unknown dependency
coverage expands review; it never licenses omission.

## Source ownership

An independent Edition may be maintained outside any selected source repository.
ETHOS and AIGW retain authority over their native assertions, while each
designated editor owns its Edition's selection, omissions, and presentation.
A source product may elect co-location or an external editor; neither physical
choice grants source endorsement or approval. Architecture Publisher owns the
Edition contract and compiler, not adopter Edition content or source policy.

The Publisher self-Edition is therefore owned by the Architecture Publisher
repository. Historical Provider v1 may deliver portable standard values or one
independently installed package export. Its delivery metadata stays in outer
provenance under that historical contract. The successor may combine direct and
multiple Provider v2 inputs. Equal selected-input locks across delivery modes
do not imply equal Candidates: closure, disclosed limits, scenes, or media can
differ and require separate qualification. Installed use must not depend on an
adjacent checkout, ambient repository search, or hard-coded workstation path.
Publisher may retain compact immutable fixtures and receipts, not a second
mutable adopter Edition after its designated owner accepts a successor.

## Audience and questions

An Edition begins with readers and decisions, not available code symbols. Each
question identifies:

- the intended audience;
- the decision or understanding it supports;
- the claims needed to answer it;
- the acceptable level of detail;
- the risk of omission or ambiguity.

The overview answers the Edition's root question completely. A mechanism page
answers one narrower question completely. Navigation cannot substitute for a
missing overview.

## Independent scenes

### Static scene

The static scene owns a single-frame hierarchy, grouping, spatial grammar,
typography, routing, annotation, canvas and export size. It must remain useful
when printed or viewed without interaction.

An authored static refinement targets that complete medium, including every
ordered static view, rather than selecting one view again. Publisher checks the
union of source assertions against the authored scene and retains per-view
assertion attribution in its carrier identity. This permits source-owned whole-
page art direction without accepting pre-rendered media or transferring a
relation or claim between reader questions. Neutral composition remains an
explicit alternative, not an automatic fallback from a failed refinement.
An explicitly selected relation supplies its exact endpoint members to the
static scene; the editor does not need duplicate entity selections merely to
draw those endpoints.

### Interactive scenes

The interactive scene set owns responsive composition, navigation, focus,
trace, progressive disclosure, source inspection and motion. Its overview must
remain a complete diagram. Detail pages deepen understanding rather than split a
single diagram into incomplete fragments.

Static and interactive scenes reuse semantic identities and design tokens where
useful. They never share required coordinates, DOM structure, or artifact bytes.
Each medium identity binds the normalized scene declaration and the exact entity
and relation values that its renderer consumes. A scene may also bind one exact
authored-input digest; changing that input invalidates only the owning scene and
medium unless another declared Edition dependency also changed.

Scene contracts use renderer-neutral nodes, groups, edges, viewports and visual
roles. A selected renderer owns its supported-role vocabulary and translation to
backend protocol fields; an Edition or generic scene never emits an Archify,
SVG, browser or raster protocol directly.

## Visual grammar

A flagship visual grammar declares:

- semantic hierarchy and emphasis levels;
- typography roles and minimum painted sizes;
- restrained palette and contrast obligations;
- shape meanings;
- line, direction, boundary and uncertainty conventions;
- spacing and density limits;
- motion purpose and reduced-motion behavior;
- permitted annotation and legal-notice surfaces.

Irregular shapes, curves, gradients, animation, and whitespace have no inherent
value. Each must make a semantic distinction or improve reading. Decorative
novelty is rejected.

## Qualification

An Edition lists non-substitutable predicates. At minimum a flagship requires:

1. source and Claim Model integrity;
2. required-claim and omission coverage;
3. cross-medium semantic agreement;
4. painted glyph, node, stroke, endpoint, label, and canvas geometry;
5. browser behavior at declared viewports;
6. keyboard, focus, contrast, text-scale, and reduced-motion accessibility;
7. installed offline reproduction;
8. exact replacement and interrupted-effect recovery;
9. human review of `faithful`, `intelligible`, and `restrained`, declared
   separately for each exact static artifact and interactive viewport.

Every qualification binds exact subjects, verifier identity, observations,
verdict, and limitations. A changed artifact needs fresh applicable evidence.
One medium's human decision never satisfies another medium's obligation.
An authored static SVG may carry an editor-authored `description` distinct from
its visible subtitle. The SVG title is its accessible name; the selected
description is exposed separately. Without one, the subtitle remains the only
text alternative, which does not by itself qualify a complex architecture
figure. The Edition editor owns whether the alternative conveys its causal
relationships and limits; the renderer cannot infer that meaning from geometry.
Static painted-output qualification also checks the delivered raster for
per-element paint, stray paint, minimum canvas fill, and bounded center offset;
analytic scene geometry or a valid SVG alone cannot substitute for it.

## Evolution

The complete before and after Editions are the sole authority for dependencies
from claims and questions to static and interactive scenes. Claim Model
comparison reports semantic identity and dependency changes; Edition evolution
combines that result with authored Edition changes and computes six independent
obligation classes:

- `rebuild` selects the publication bundle, atlas, and affected scenes;
- `semanticVerification` rechecks meaning and coverage;
- `mediumVerification` rechecks only the applicable static, interactive,
  installed-use, and recovery predicates;
- `humanReview` emits one exact predicate-and-scope obligation for each affected
  artifact or viewport declared by the Edition;
- `acceptance` records the need to accept, reaccept, or withdraw the Edition;
- `publication` records the need to publish, replace, or withdraw selected
  output.

Compilation performs none of these effects and never edits generated artifacts,
infers equivalence, or approves new bytes. Unknown coverage and unrepresented
meaning broaden the affected Edition. Stable identities preserve the reader's
mental model; explicit rename, split, and merge evidence records genuine
structural change without transferring prior approval. Removed scenes and
Editions produce explicit withdrawal obligations.

Unknown claim coverage is detected independently of declared graph reachability.
When model meaning changes, only Editions and scenes that actually represent the
unknown claim are broadened; an explicit out-of-scope omission and a source-only
identity change do not fabricate scene work.
