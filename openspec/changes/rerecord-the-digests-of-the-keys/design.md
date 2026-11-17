## Context

`tests/pinned-face-bytes.test.mjs` holds the digests of three fixtures' shapes, runs and keys, so that a change
of the drawing which was not meant shows. The first Change of this lane means to change a key's words. The lane's
check before the proof ran the three test files that name those words and not this one, which reads them through
the plates it composes; the proof's behaviour gate found it.

## Goals / Non-Goals

**Goals:**

- The test passes with the digests of the keys as the first Change draws them, and still pins every other byte.

**Non-Goals:**

- No change of what is drawn.

## Decisions

1. Only the digests that the test itself reports as different are recorded again.
   - Rests on: `docs/research/figure-language.md`, "Measured on 2026-11-16" (a strip's length is the fact
     `owned-bytes`, which the first Change's words now say), and the test's own report in the failed proof: three `.legend` digests differ, and the digests of every
     `.svg` and `.runs` are equal.
   - Considered: recording all twelve digests again from a fresh run.
   - Chosen because: a digest that did not differ needs no new record, and recording only what the report names
     keeps the test's evidence that nothing else moved.
   - Applies to: `tests/pinned-face-bytes.test.mjs`.

## Risks / Trade-offs

- [Another test that reads the key through composed plates fails the same way] → The proof ran the whole suite
  and one test of 520 failed; the kit now lists, before a proof, every test file that reaches a changed module
  through its imports, and runs them.
