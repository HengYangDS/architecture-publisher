## Context

See [proposal.md](proposal.md). The publisher's tools are selected by `.config/mise/config.toml` and its lock, its
npm packages by `package.json` and `package-lock.json`. Until now no file of the repository stated how old a
release must be before a resolution may take it.

## Goals / Non-Goals

**Goals:**

- A resolution in this repository, by Mise or by an npm that Mise runs, takes no release younger than 24 hours,
  on any machine.

**Non-Goals:**

- Moving a pin or a lock. The next supply Change reads each version's publication time under the new age.
- An exemption for a package or a tool. None is needed today; the form of exemptions is the paradigm's to state.

## Decisions

1. Each resolver's age stands in that resolver's own carrier.
   - Rests on: the owner's decisions of 2026-11-19, as the steward of the governed repositories relayed them; and
     the ETHOS paradigm contract of the runtime this repository is bound to, read on 2026-11-20, which names
     `.config/npm/npmrc` as the carrier of npm's policy and refuses a root `.npmrc`.
   - Considered: npm's age as a variable of the Mise environment, `npm_config_min_release_age`, one file instead
     of two. Read in this checkout on 2026-11-20 it works: npm takes the value and reports the user file's as
     overridden. The steward proposed it that morning and withdrew it the same hour.
   - Chosen because: the paradigm is the one source of where each tool's policy lives, and a line of npm's policy
     in Mise's file would be a second place for it. The age is stated once for Mise, `"24h"`, and once for npm,
     `1` day, each where its reader looks; Mise's settings take no template, so neither is filled in from the
     other here.
   - Applies to: `.config/mise/config.toml` and `.config/npm/npmrc`.
   - Reopened when: the owner sets another age, or the paradigm comes to write these lines for a governed
     repository.
2. Under Mise, npm's user configuration is the repository's carrier.
   - Rests on: npm's precedence, in which the environment names the user configuration; read on 2026-11-20 in
     this checkout, `npm config get userconfig` names the person's `~/.npmrc`.
   - Considered: no environment line, the carrier unread.
   - Chosen because: npm reads a user configuration from the path its environment names, and the paradigm's
     carrier is not a path npm looks at by itself. The two lines of the Mise environment state no age: they
     point npm at its carrier.
   - Applies to: every npm command run through Mise in this repository; a test run is not one, since
     `tests/fixtures/npm-environment.mjs` removes npm's variables and names its own files.

## Risks / Trade-offs

- npm run outside Mise in this checkout reads no age from the repository. → The repository's documented entry is
  Mise (`mise run bootstrap`, `mise run check`); the reference says so beside the new row.
- A person's own `~/.npmrc` no longer applies under Mise here: a registry mirror or a token set there is not
  read. → The publisher installs from the public registry with a lock; no step of it needs a person's token.
