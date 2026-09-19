---
name: architecture-publication
description: Use when publishing explicit source-bound architecture through the repository's installed public CLI.
---

# Architecture Publication

Use this Skill only after the source project has supplied explicit architecture
meaning and an authored view plan. The Skill is a replaceable caller; it does
not own intent, workflow state, authorization, or generated artifacts.

1. Select the source manifest, semantic member, authoring file and their current
   SHA-256 digests. Do not discover sibling repositories or infer architecture
   from code.
2. Run `architecture publish semantic <plan.json> --sha256 <plan-sha256>` and
   inspect the JSON result. A successful compile establishes only the reported
   source-bound structure.
3. When browser evidence is required, run the repository's explicit observer
   against the exact output manifest. Keep browser, human and hosted acceptance
   separate.
4. For delivery, run `architecture publish files plan <input.json>`, inspect the
   returned plan, obtain the source product's explicit decision, then use the
   public apply or recover command. Never synthesize authorization.
5. Report facts, evidence, unproved limits and the next action. This Skill does not grant acceptance or authority. It must not bypass repository governance.
