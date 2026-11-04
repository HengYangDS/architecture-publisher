## Context

See proposal.md for why. `prepare` in `src/build.mjs` resolves the model's
`overview` against the model's directory and passes the path to
`typesetOverview`, which stages the composition's directory and runs Typst on
the composition's name. It already refuses, with `overview_composition_missing`,
an overview asked of a model that names no composition. Nothing checked that
the named file exists.

## Goals / Non-Goals

**Goals:**

- A named composition that is not there is refused before staging, naming the
  model's value and the path looked at.

**Non-Goals:**

- Changing how a composition that exists is staged, linted or typeset.
- Changing the refusals for a composition's directory that holds a link or an
  `archpub` entry.

## Decisions

- **Check in `prepare`, beside the refusal for no composition.** Both answer
  whether the model's composition can be read, and `prepare` knows the model's
  own value, which a refusal from the typesetter could not name. A check in the
  typesetter's staging was rejected for that reason.
- **Reuse `overview_composition_missing`.** A composition that is not there is
  as missing as one that is not named; a new code would split one remedy, name
  the file, across two codes.
- **Follow links when checking.** The check asks whether a file is at the path;
  a composition that is a link still reaches staging, which refuses links with
  `overview_composition_invalid` as before.

## Risks / Trade-offs

- [A directory at the composition's path] → It is not a file, so it is refused
  as missing, which names the path the author can correct.
