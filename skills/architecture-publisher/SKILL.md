---
name: architecture-publisher
description: Use when publishing explicit source-bound architecture through the repository's installed public CLI.
---

# Architecture Publisher

Use this Skill only after the source project has supplied explicit architecture
meaning and an authored view plan. The Skill is a replaceable caller; it does
not own intent, workflow state, authorization, or generated artifacts.

1. For new work, select one exact `architecture.build-request/v1` with direct
   sources and an authored `architecture.edition-project/v1`, or selected
   `architecture.edition-provider/v2` manifests for those inputs. Distinct
   Providers may be combined; their namespaces must not collide. Prefer
   declarative transport when portable values already exist. An executable
   Provider is an explicit code-execution trust decision, not a sandbox.
   Historical Provider v1 remains for exact replay. Do not discover sibling
   repositories or infer architecture from code.
2. To assess evolution, run
   `archpub evolution plan <request.json> --sha256 <request-sha256>` over exact
   before/after native Build Requests (`architecture.semantic-compare-input/v3`)
   or historical Claim Models and Edition sets (v2). Executable Provider
   comparison is not yet admitted. Treat `rebuild`,
   `semanticVerification`, `mediumVerification`, `humanReview`, `acceptance`,
   and `publication` as independent obligations. The command performs none of
   them, and unknown or unrepresented meaning requires conservative handling.
3. For a successor Build Request, run
   `archpub edition build <request.json> --sha256 <request-sha256> --output <candidate-directory>`.
   Inspect the JSON result and bundled Edition Candidate. This is the only build
   command for direct and Provider inputs. A successful build establishes only
   the reported source-bound structure, Edition, scene, renderer, artifact, and
   optional Provider provenance identities. Historical v1 plans retain their
   own output field. Neither route performs qualification or publication.
4. Run `archpub qualify verify <request.json> --sha256 <digest>` against an exact
   externally produced Qualification Set. Historical v1 selects the Claim Model,
   Edition, Candidate, and set and computes its conjunctive admission without
   executing predicates. Successor v2 replays the selected Candidate and binds
   submitted records. Replay runs an executable Provider again only when the
   invoker separately supplies `--execute-providers <id@digest,...>`. An invoker
   may also supply `--policy` and `--policy-sha256` to assess exact
   submitted-policy fit. V2 still reports `records-bound` and `admitted: false`.
   Neither route authenticates verifier or accepter identity or authorizes
   publication.
5. When browser evidence is required, run the repository's explicit observer
   against the exact output manifest. Keep browser, human and hosted acceptance
   separate.
6. For delivery, run `archpub publish plan <input.json>`, inspect the
   returned plan, obtain the source product's explicit decision, then use the
   public apply or recover command. Never synthesize authorization.
7. Keep `subject`, `producer`, `authorizationOwner`, and `custodian` distinct.
   Report facts, evidence, unproved limits, and the next action. This Skill
   grants no acceptance or authority and cannot bypass repository governance.
