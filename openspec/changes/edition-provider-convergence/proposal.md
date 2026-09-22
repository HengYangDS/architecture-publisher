# Proposal

## Why

Architecture Publisher 0.2 proves that self, ETHOS, and AIGW can cross one
generic semantic publication kernel, but the two external adopters still use
implicit and physically asymmetric integration forms. ETHOS retains an overly
broad executable integration while AIGW stores declarative product input below
`docs/`; neither form is named by one narrow provider contract that makes
ownership, dependency direction, portability, qualification, artifact custody,
and exit behavior mechanically comparable.

## What Changes

- Introduce one versioned `Edition Provider` contract with a tagged
  `declarative` or `executable` delivery mode.
- Require both modes to materialize the same existing Source Bundle, Claim
  Model, Edition, and optional evolution values with exact provenance.
- Make the dependency direction explicit: a provider may consume public
  Architecture Publisher contracts, while the generic product may not import,
  discover, dispatch on, or authorize a source product.
- Bound executable providers to semantic adaptation and Edition authorship;
  generic rendering, browser execution, qualification mechanics, and
  publication transactions remain Architecture Publisher responsibilities.
- Define artifact custody separately from semantic ownership and generation:
  the described product owns acceptance and release, Architecture Publisher
  owns transformation, and release or artifact storage holds generated media.
- Add one provider-neutral conformance profile used by self, ETHOS, AIGW, and
  future adopters.
- Provide destructive migration and removal criteria for the existing ETHOS and
  AIGW integration forms without compatibility facades or parallel authorities.

## Capabilities

### New Capabilities

- `edition-provider`: Defines provider identity, delivery modes, semantic output,
  dependency direction, portability, conformance, artifact custody, feedback,
  and retirement.

### Modified Capabilities

- `ecosystem-adoption`: Requires every adopter to cross the product boundary
  through the same Edition Provider contract and conformance predicates.
- `edition-publication`: Places provider materialization before Edition build and
  prevents provider execution from claiming compilation, qualification,
  acceptance, or publication.
- `publication-contract`: Separates subject-product ownership, Publisher
  transformation, release authorization, artifact custody, and feedback.

## Impact

The public package gains a small provider contract and validation/materialization
surface integrated into the existing `archpub edition build` flow; no second CLI
root or persistent provider registry is introduced. Architecture Publisher self
use and conformance fixtures migrate first, then AIGW and ETHOS migrate in their
own governed repositories. The immutable 0.2 release, historical alpha.7 bytes,
source-product governance, and product-owned release decisions remain unchanged.
