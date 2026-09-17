## Context

The installed CLI composes existing source, rendering and ETHOS-specific
publication commands. `src/publication/files.mjs` already owns exact-target
paired installation, inventory comparison, interruption handling and recovery.

## Goals / Non-Goals

Expose that file operation to independent users without copying its algorithm.
Make the complete product boundary available from the successor source and
installed package. Do not implement semantic compilation, managed upgrades,
arbitrary destination counts, a registry service or a second approval system.

## Decisions

Add `architecture publish files plan <input.json>` and
`architecture publish files apply|recover <plan.json> <authorization.json>`.
Resolve only planning-input paths relative to that input file; emitted plans
bind exact absolute targets and must not be relocated or reinterpreted.
Read bounded regular JSON with no symlink ancestors. Reject unknown operation
names and unsupported input fields. Delegate all effects and authorization
checks to the existing file owner. The adapter does not mint authorization.

Retain the existing two destination keys, `native` and `atlas`, as file slots;
their contents are not required to be ETHOS artifacts. Generalizing cardinality
would change the recovery protocol and is not needed for the approved pair.
Return file-integrity scope explicitly; raw installation never grants semantic,
visual, browser or ETHOS-qualified acceptance.

`docs/product-design.md` owns current design intent. README owns usage and
implemented limits; specifications own behavior. Preserve the predecessor
design without editing it and identify it as historical decision evidence.

## Risks / Trade-offs

The raw command can install caller-selected bytes without checking architecture
meaning, just as a file-copy tool can; document this boundary and never label
it qualified publication. Existing collision, prestate and recovery checks stay
mandatory. The file slots and shared-parent requirement remain deliberate limits.

## Migration Plan

Add regression tests before implementation. Add the thin adapter and CLI branch,
then package the current design and document the public contract. Run focused
installed-package tests and existing file/ETHOS publication regressions, followed
by exact-HEAD native proof, archive, land and publication. Selected release inputs
must move to the resulting accepted commit; old candidate proof cannot cover it.
