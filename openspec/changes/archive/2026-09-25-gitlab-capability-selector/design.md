## Context

See the proposal for the routing gap. GitLab project 1323 currently has one
locked project runner, #82. It is online, advertises only
`ci-linux-arm64-docker`, and accepts untagged work. The sole `verify` job has
an empty tag list. Project shared runners are disabled.

## Goals / Non-Goals

**Goal:** Make job-to-capability selection explicit without changing what the
job executes or the runner's trust boundary.

**Non-goals:** Moving #82 from its current OrbStack manager to the Linux VM,
changing GitHub CI, adding a manager, or changing publisher behavior.

## Decisions

- Put the stable capability tag directly on `verify`. A project-specific or
  machine-name tag would bind source to one registration and obstruct a later
  exact-job-verified VM cutover. A second tag alias would increase ambiguity.
- Retain the runner's project lock and existing access level. The tag selects
  execution capability, not trust; project assignment and ref policy remain
  GitLab's authorization boundary.
- Close `run_untagged` only after the published commit's real pipeline passes
  on #82 with the requested tag. CI lint and local checks cannot prove routing.

## Risks / Trade-offs

- A typo or missing runner capability would strand the job. Before publishing,
  compare the selector with live #82 metadata and validate the CI document;
  keep untagged admission open until the new job succeeds.
- Changing #82 policy too early would break the old tagless commit. Roll back
  `run_untagged` first if the post-cutover job fails, then revert the source
  selector through the normal repository lifecycle if needed.

## Migration Plan

Validate locally and with GitLab CI lint; land and publish the signed source
change through the repository's existing governance. Observe the exact published
SHA and a successful `verify` job on #82 with `ci-linux-arm64-docker`. Then set
only #82's `run_untagged=false`, read back all identity/trust fields, and
observe that the project still has one locked runner. Retire this Work Lane
only after the source and runner policy agree.
