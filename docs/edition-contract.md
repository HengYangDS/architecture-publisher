---
subject: architecture-publisher:edition-contract
role: policy
state: canonical
relations:
  governed_by: product-contract.md
---

# Architecture Edition

An Edition is an editor's plan for explaining selected architecture to a
particular audience. It names the questions, selected source meaning, omissions,
reading order, and presentation choices. It is not a theme, source-code scan,
renderer preset, or publication approval.

## Current authoring

New builds select `architecture.edition-project/v1` through one
`architecture.build-request/v1`. A Project does not require a duplicate Claim
Model: the source may already be LikeC4 DSL or an attributed Claim Model v2.
The [complete small example](../examples/selected-edition/) shows the actual
files; [the build reference](reference/operations.md#edition-candidate) gives
the command and exact-input requirements.

| Editor's choice              | Project field                                     | Meaning                                                |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Who is reading?              | `audiences`                                       | Named audiences, linked by ID                          |
| What must they understand?   | `questions`                                       | Reader-facing text, not executable queries             |
| Which source answers it?     | `scope.selections`                                | Exact namespace/reference and question IDs             |
| What is outside this work?   | `omissions`, `scope.limits`                       | Explicit excluded meaning and reading limits           |
| What appears in each medium? | `presentation.static`, `presentation.interactive` | Independent ordered views and intent                   |
| How should it be expressed?  | `visualPolicy`                                    | Neutral composition or a selected data-only refinement |

The Build Request separately names source files and digests, optional Providers,
the Project, requested media, and the selected toolchain. Publisher derives the
input lock and emits a Candidate. Neither the Project nor the request proves
source truth, grants Provider execution consent, or accepts the result.

## Historical Edition v1

The retained `architecture.edition/v1` input selects one exact Claim Model and
explicit scenes. Its identity fields below remain valid for historical builds;
new Project authoring does not retroactively change it. Schema versions belong
in their values, not in source filenames or a parallel editable Edition.

### Required identity

Every historical v1 Edition binds:

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
condition, maturity, validity, or provenance. An editorial assertion retains its
named proponent and source-bound basis; it does not become source-endorsed
because Publisher can render it.

Omission is a decision, not absence. Historical v1 requires every source claim
to be represented or explicitly omitted. Current Projects declare their selected
scope; selected obligations cannot be silently dropped. Unknown dependency
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

The interactive scene set owns desktop composition, navigation, focus,
trace, progressive disclosure, contextual inspection and motion. Its overview must
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

### Figure types

One Edition-wide `visualPolicy.figureTypes` catalog assigns an icon to each
effective figure kind. The same kind uses the same icon on every selected page;
different kinds require different resolved artwork. A renamed icon alias does
not count as different artwork.

```json
{
  "profile": "neutral",
  "figureTypes": {
    "service": "lucide:server",
    "store": "lucide:database"
  }
}
```

Publisher resolves this catalog before rendering either medium. Nodes, Legends,
and canonical exports use the same pinned offline glyphs. Each Legend entry has
one icon first, followed by its kind label; occurrence counts are not displayed.
An occurrence cannot override or suppress its icon. Missing kinds, unsupported
icons, reused artwork, or insufficient painted clearance reject the candidate.

A figure kind describes the reader-facing role, not a replacement source fact.
Source kinds and membership remain available in Inspect; a null source kind
stays null and requires the separate `source element` figure role. Source-owned
primitive artwork and adornments remain unchanged. The catalog belongs to the
Edition, which may live outside the source repository; Publisher supplies the
generic contract and checked glyph library, not a repository-specific taxonomy.

## Qualification

An Edition lists non-substitutable predicates. At minimum a flagship requires:

1. exact selected source and semantic interpretation integrity;
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

New native-input comparisons use `architecture.semantic-compare-input/v3` with
independent before/after selections. The [evolution reference](reference/operations.md#evolution)
documents their command and execution-consent boundaries.

The complete before and after Editions are the sole authority for dependencies
from claims and questions to static and interactive scenes. Claim Model
comparison reports semantic identity and dependency changes; Edition evolution
combines that result with authored Edition changes and computes six independent
obligation classes:

- `rebuild` selects the publication bundle, interactive work, and affected scenes;
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
