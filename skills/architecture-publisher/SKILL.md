---
name: architecture-publisher
description: Use when publishing explicit source-bound architecture through the repository's installed public CLI.
---

# Architecture Publisher

Use this Skill only after the source project has supplied explicit architecture
meaning and an authored view plan. The Skill is a replaceable caller; it does
not own intent, workflow state, authorization, or generated artifacts.

1. Select the source manifest, semantic member, Edition file and their current
   SHA-256 digests. The Edition must bind its exact source manifest and Claim
   Model. Do not discover sibling repositories or infer architecture from code.
2. To assess evolution, run
   `archpub semantic compare <plan.json> --sha256 <plan-sha256>` over exact
   before/after Claim Models and Edition sets. Treat `rebuild`,
   `semanticVerification`, `mediumVerification`, `humanReview`, `acceptance`,
   and `publication` as independent obligations. The command performs none of
   them, and unknown or unrepresented meaning requires conservative handling.
3. Run `archpub publish semantic <plan.json> --sha256 <plan-sha256>` and
   inspect the JSON result and bundled publication receipt. A successful compile
   establishes only the reported source-bound structure and Edition identities.
4. When browser evidence is required, run the repository's explicit observer
   against the exact output manifest. Keep browser, human and hosted acceptance
   separate.
5. For delivery, run `archpub publish files plan <input.json>`, inspect the
   returned plan, obtain the source product's explicit decision, then use the
   public apply or recover command. Never synthesize authorization.
6. Report facts, evidence, unproved limits and the next action. This Skill does not grant acceptance or authority. It must not bypass repository governance.
