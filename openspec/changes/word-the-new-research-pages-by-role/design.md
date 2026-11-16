## Context

`tests/role-neutral-wording.test.mjs` reads every document, the Skill and the shipped source and refuses wording
that presumes who holds a role. The lane's check before the proof ran the static checks and the browser tests, and
not this test, so the proof's behaviour gate found it after 22 minutes.

## Goals / Non-Goals

**Goals:**

- The two pages pass the test and say what they meant.

**Non-Goals:**

- The study's finding does not change: some checks of a picture cannot be gated by a machine.

## Decisions

1. The pages name the role, and the study's word is reported once.
   - Rests on: the requirement "Roles name no kind of holder" of `product-identity`.
   - Considered: an exception for research pages in the test.
   - Chosen because: a research page is a document of the product like any other, and "a reviewer's judgement"
     is what the product's own acceptance calls it. The study's word is kept as a report, not as the product's
     voice.
   - Applies to: the two pages.

## Risks / Trade-offs

- [Other tests that read the whole tree may fail the same way] → The tests that read every tracked document are
  run in the lane before the proof is asked for again.
