## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "The proofs
of seven days (2026-11-22)". The queue's history in the contract: `performance` joined before `edition-map` on
2026-11-18, when the owner directed that performance be optimised to the limit in every repository ETHOS governs;
three items the owner had asked for and that nothing held joined before it on 2026-11-19; `edition-map` moved before
it the same day for its contents and last page; `one-source` and `derived-references` joined before it on 2026-11-20.

## Goals / Non-Goals

**Goals:**

- The publisher's suite and proof, the largest share of the host's proof time, are worked on next after `one-source`.

**Non-Goals:**

- Any change to the suite, a gate or a build: those are `performance`'s own Changes, each measured before and after.
- The rest of `edition-map`: its Changes that change how a page looks go to the owner as drawings first, which needs
  no lane and goes on beside `performance`.

## Decisions

1. `performance` before the open rest of `edition-map`.
   - Rests on: the research page's seven days: 41 proofs, 13.0 hours, the behaviour gate a median of 927 seconds and
     at most 1881, the format gate a median of 145; by the count of the session that measures the host, about half
     the proof time of its thirteen repositories with records. Its 66 guest pipelines ran 40.9 hours, 19.1 of them a
     commit's second and later pipelines, which the owner's trial of the same day takes up (the Change
     `no-gitlab-pipeline-for-a-dev-push-or-a-tag`).
   - Considered: keeping the order. Each Change of the rest of `edition-map`, `page-figures`, `reader-file` and
     `derived-references` would pay the present suite in its proof and its two pipelines, and so would every other
     repository's work waiting for the same slot.
   - Chosen because: the reason `edition-map` moved before `performance` on 2026-11-19, its contents and last page,
     is met (Change `set-the-contents-and-the-index`); what is left of it changes how plates look and starts with
     drawings for the owner.
   - Applies to: the order of the queue.
2. After `one-source`, not before it.
   - Rests on: `one-source` has its last publisher Change drafted and rehearsed, and the publications' Change that
     follows it; stopping it now would leave a finished item open.
3. `one-source` is ticked here, and the publisher refuses no derivable template.
   - Rests on: its six Changes landed, the last in this train; the publications' input check refuses a template a
     work's address implies since 2026-11-23.
   - Considered: a seventh Change in which the publisher refuses such a template, the cut's open question of
     2026-11-21.
   - Chosen because: a model that states it builds the same pages, and the contract's Evolution makes a refusal of
     a model another release accepted a breaking release; the owner's works hold the rule by their own check.
   - Applies to: the contract's queue and `docs/research/one-source.md`.

## Risks / Trade-offs

- The rest of `edition-map` waits longer. Its drawings go to the owner meanwhile, so its Changes start drafted.
