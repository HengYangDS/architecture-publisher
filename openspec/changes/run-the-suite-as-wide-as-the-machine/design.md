## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "The suite's
width (2026-11-23)". ETHOS's behaviour gate reads the `test` script and runs it: a script whose first argument after
`node` is a file is run as it is, and the gate's reporter and coverage reach the test runner through the environment
it gives the command, which the launcher's child inherits. On a copy of `dev` on 2026-11-23 the gate ran the
launcher and passed it: 658 tests, 99.63 % of lines, no gap of its own.

## Goals / Non-Goals

**Goals:**

- The suite uses the cores a machine has, on the host, in the proof and on every guest.

**Non-Goals:**

- The six long end-to-end tests, which hold most of the suite's time: the next cause, measured apart.
- The guests' cores, which their keeper sets.
- A width above four, which no run has measured.

## Decisions

1. A launcher in the repository, not a number in `package.json`.
   - Rests on: Node's `--test-concurrency` takes a number only, and leaving it out runs one fewer file than the
     machine's cores, seventeen on the host, where a file keeps two to three cores busy.
   - Considered: four fixed everywhere, which would run four files on the Linux guest's four cores; three fixed.
   - Chosen because: one rule, read from the machine, gives each its width, and a measurement moves one constant.
   - Applies to: `npm test`, so the proof, the lane's check and every pipeline job.
2. The cores over 2.5, two at least, four at most.
   - Rests on: 5.96 cores at two files and 10.21 at four, the suite all passing at both.
   - Considered: over 3, which keeps the Windows and macOS guests at two.
   - Chosen because: the measured cores a file at four, 2.55; the bounds keep every machine at a measured width or
     between two measured ones.
   - Applies to: `tools/test/suite.mjs`, its test.

## Risks / Trade-offs

- The Windows and macOS guests run three files where they ran two, a width not measured on them: the Change's own
  pipeline reads it, and a slower leg takes the constant back.
- A proof's suite keeps about ten cores busy where it kept six; within the fourteen a ticket leaves.
