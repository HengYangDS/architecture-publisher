## Context

See [proposal.md](proposal.md). The developer tools run in the repository's checks and in its
hosted jobs; none is bundled or shipped. The lock is refreshed by npm itself from the edited
declarations.

## Goals / Non-Goals

**Goals:**

- Run the repository's format, lint, dead-code and Markdown checks on the newest stable releases.

**Non-Goals:**

- Moving a package whose release changes a generated supply or the browser acceptance; those four
  moves have their own lane under the owner's method.
- Moving the bundled runtime dependencies, which are current.
- Changing any source, test, generated file or configuration of a check.

## Decisions

- Edit only the six declarations and let `npm install --package-lock-only` resolve the lock; refuse
  the result if the lock moves any package other than the expected ones.
- Accept the move with `mise run check`, which runs every static check, the tests with coverage and
  the packed-package check, and with Prettier 3.10.1 reformatting no tracked file.

## Risks / Trade-offs

- [A new rule of ESLint, knip or markdownlint reports an existing file] → The check fails before
  the commit; the lane stops and the finding is fixed at its owner or the pin stays where it was.

## Migration Plan

Move the pins, refresh and install the lock, check, record the Changelog line, prove the archived
head, publish the proposal and land on the landing owner's go. To roll back, revert the lane's
commits.
