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

| Editor's choice                      | Project field                                              | Meaning                                            |
| ------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------- |
| Who is reading?                      | `audiences`                                                | Named audiences, linked by ID                      |
| What must they understand?           | `questions`                                                | Reader-facing text, not executable queries         |
| Which material addresses it?         | `scope.selections`                                         | Exact namespace/reference and question IDs         |
| What is outside this work?           | Optional `omissions`, `scope.limits`                       | Explicit excluded meaning and reading limits       |
| Does a medium need different views?  | Optional `presentation.static`, `presentation.interactive` | Independent ordered views and intent               |
| Does a visual role need an override? | Optional `visualPolicy`                                    | Editorial roles or a selected data-only refinement |

The Build Request separately names source files and digests, optional Providers,
the Project, requested media, and the selected toolchain. Publisher derives the
input lock and emits a Candidate. Neither the Project nor the request proves
source truth, grants Provider execution consent, or accepts the result.

Normal authoring supplies the audience, questions and source selections once.
Without `presentation`, the compiler derives one `overview` in each requested
medium with all selected question IDs and a 6000-pixel static width. Without a
figure catalog, it derives distinct checked icons for the selected kinds.
Optional presentation and visual choices refine these defaults; they do not
transfer layout duties to the source owner or define another quality tier.
Direct source `locator` values capture selected current bytes in the generated
input lock; `pin` values require an exact digest and reject changed bytes.
Rebuilding from a locator does not alter an accepted lock or carry approval.
Question-to-scope choices remain editorial; default view lists, mechanical links
and type encodings belong to the existing compiler owners, not a second brief
format. Independent medium composition, installed behavior and complete-work
qualification remain separately checked under the active Change.

## Claim-backed Edition

The current `architecture.edition/v2` contract selects one exact Claim Model and
explicit scenes. It has no quality class: every publication retains the same
strict review requirements. Project authoring is also class-free. Schema
versions belong in their values, not in source filenames or a second editable
Edition.

Historical Edition v1 inputs retain exact bytes for recovery with their original
versioned executor. The current executor refuses those retired values and any
quality-class field; preserving history does not grant it current acceptance.

### Required identity

Every current Claim-backed Edition binds:

- stable Edition ID and owner;
- exact product and semantic schema versions;
- source and Claim Model digests;
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

Publication work is maintained outside the source products it describes.
ETHOS and AIGW supply existing, explicitly selected material read-only; drawing
does not add files, packages, exporters, configuration, tests or CI obligations
to either product. The independent editor owns source-specific adaptation,
selection, omissions and artwork. Source facts and editorial assertions retain
their distinct proponents. Architecture Publisher owns the generic contract,
compiler, composition and qualification, not source policy or adopter content.

The Publisher self-Edition belongs to the product as its own publication work,
not as a precedent for modifying unrelated source repositories. External work
selects pinned material without writing or executing drawing code there.
Providers, when selected, run under the external editor's ownership rather than
as source-product prerequisites. Historical Provider v1 may deliver portable standard values or one
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
assertion attribution in its carrier identity. This permits externally owned
whole-page art direction without accepting pre-rendered media or transferring a
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

An Edition's visual grammar declares:

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

One Edition-wide resolved catalog assigns an icon to each effective figure kind.
Normal authoring uses compiler-derived encodings; an optional editorial override
supplies `visualPolicy.figureTypes`. The same kind uses the same icon on every
page; different kinds need different resolved artwork. An icon alias is not
different artwork.

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
Passport, Lens, Finder and canonical exports use the same pinned offline glyphs
on every selected page. Reader controls reuse the painted glyph rather than
resolving a separate mapping. Type-identity rows place one icon before its label,
with bounded glyph size, readable label space and measured clearance; they do
not display occurrence counts. Native analysis can retain counts in accessible
descriptions and relationship summaries.
An occurrence cannot override or suppress its icon. An incomplete resolved
mapping, unsupported icons, reused artwork or insufficient clearance reject the
candidate; derivation cannot silently collapse kinds to fit the glyph supply.

A figure kind describes the reader-facing role, not a replacement source fact.
Source kinds and membership remain available in Inspect; a null source kind
stays null and requires the separate `source element` figure role. Automatic
derivation rejects a role that would merge distinct implicit source kinds,
including a missing kind and the literal declared kind `source element`.
Explicit editorial figure roles may group kinds without changing source facts.
Source-owned primitive artwork and adornments remain unchanged. The catalog belongs to the
Edition, which may live outside the source repository; Publisher supplies the
generic contract and checked glyph library, not a repository-specific taxonomy.

## Qualification

Every publication meets the same non-substitutable quality requirements:

1. exact selected source and semantic interpretation integrity;
2. required-claim and omission coverage;
3. cross-medium semantic agreement;
4. painted glyph, node, stroke, endpoint, label, and canvas geometry;
5. browser behavior at declared viewports;
6. keyboard, focus, contrast, text-scale, and reduced-motion accessibility;
7. installed offline reproduction;
8. exact replacement and interrupted-effect recovery;
9. human review of `faithful`, `intelligible`, and `aesthetic`, declared
   separately for each exact static artifact and interactive viewport.

Every qualification binds exact subjects, verifier identity, observations,
verdict, and limitations. A changed artifact needs fresh applicable evidence.
One medium's human decision never satisfies another medium's obligation.
Claim-backed Editions declare all three visual predicates for both media.
For selected Project builds, a complete publication policy must require human
`faithful`, `intelligible`, and `aesthetic` review of each selected PNG and
standalone HTML artifact. Question-only, candidate-wide, machine-only, or one-
medium review does not satisfy that floor. Maintainer self-review is permitted
when the designated policy allows it; it is not independent review. Policy
assessment remains submitted, unauthenticated evidence, not acceptance.
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
