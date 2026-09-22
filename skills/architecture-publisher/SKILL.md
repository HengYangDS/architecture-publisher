---
name: architecture-publisher
description: Use when publishing explicit source-bound architecture through the repository's installed public CLI.
---

# Architecture Publisher

Use this Skill only after the source project has supplied explicit architecture
meaning and an authored view plan. The Skill is a replaceable caller; it does
not own intent, workflow state, authorization, or generated artifacts.

1. Select either the exact source manifest, semantic member, Edition file, and
   their SHA-256 digests or one exact `architecture.edition-provider/v1`
   manifest. Prefer a declarative Provider when portable values already exist;
   use an executable Provider only for necessary source adaptation through one
   independently installed export. Do not discover sibling repositories or
   infer architecture from code.
2. To assess evolution, run
   `archpub evolution plan <request.json> --sha256 <request-sha256>` over exact
   before/after Claim Models and Edition sets. Treat `rebuild`,
   `semanticVerification`, `mediumVerification`, `humanReview`, `acceptance`,
   and `publication` as independent obligations. The command performs none of
   them, and unknown or unrepresented meaning requires conservative handling.
3. Run `archpub edition build <request.json> --sha256 <request-sha256>` and
   inspect the JSON result and bundled Edition Candidate. This is the only build
   command for direct and Provider inputs. A successful build establishes only
   the reported source-bound structure, Edition, scene, renderer, artifact, and
   optional Provider provenance identities. It performs no qualification or
   publication.
4. Admit an externally produced exact Qualification Set with
   `archpub qualify verify <request.json> --sha256 <digest>`. The request selects
   the exact Claim Model, Edition, Candidate, and Qualification Set. Verification
   rederives Candidate authority and its conjunctive verdict; it neither executes
   predicates nor manufactures acceptance.
5. When browser evidence is required, run the repository's explicit observer
   against the exact output manifest. Keep browser, human and hosted acceptance
   separate.
6. For delivery, run `archpub publish plan <input.json>`, inspect the
   returned plan, obtain the source product's explicit decision, then use the
   public apply or recover command. Never synthesize authorization.
7. Keep `subject`, `producer`, `authorizationOwner`, and `custodian` distinct.
   Report facts, evidence, unproved limits, and the next action. This Skill does not grant acceptance or authority.
   It must not bypass repository governance.
