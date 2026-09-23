# Design

## Context

The canonical product contract owns cross-product boundaries. Its current
"One chain, distinct owners" table is too abstract for a product whose self
Edition and ETHOS Edition author their own flagship media. AIGW's Provider is
declarative and leaves generated artifacts untracked. The prior Authority Matrix
is archived history and must not be rewritten.

Read-only source snapshot on 2026-09-24: Publisher
`9adc9ad91a9d6ba8e6515b24f5b8fa4b095ceb77` self-Edition Candidate,
ETHOS `e534b5a9c7906ea865bf2b82b378eea90059c200` integration, and AIGW
`5515fd3f03dc56389d648198d233ea3ba6c06e97` Provider selection. These
source observations do not establish their later release or visual acceptance.

## Goals / Non-Goals

- Make one present-tense matrix describe decision, production, evidence,
  authorization, and custody roles across all three source products.
- Preserve the source-owned Edition and replaceable Skill boundaries.
- Do not add a second machine registry, command, runtime rule, or release asset.

## Decisions

- Replace the existing table in place, rather than append a second policy.
  "Source product" is Publisher for self, ETHOS for ETHOS, and AIGW for AIGW;
  co-location never transfers adopter authority to Publisher's generic core.
- Split source-specific flagship composition from generic Scene contracts,
  renderers, rasterization, Candidate identity, and recoverable file effects.
  The self-Edition package and ETHOS integration are the source evidence.
- Keep observed verifier results, human/source acceptance, and storage custody
  distinct. AIGW's selected Provider explicitly treats outputs as untracked
  reproducible artifacts; source Git may retain selection and receipts instead.

Copying the archived table would preserve its inaccurate renderer row. A new
machine-readable matrix would create a parallel authority; checking generated
files into every source repository would confuse authorship with custody.

## Risks / Trade-offs

- ETHOS has not completed its Provider/flagship migration. The matrix defines
  authority, not an implementation-completion claim.
- A future adopter may need a new composition backend. Require an exact consumer
  failure and keep the source/producer/authorizer/custodian separation intact.

## Migration Plan

No runtime migration. Validate one canonical table, current source examples,
strict OpenSpec, repository gates, and exact-head governance before publication.
