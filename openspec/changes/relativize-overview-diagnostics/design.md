## Context

See proposal.md for why. `typesetOverview` stages the composition, the house
class and the model in a temporary root and runs Typst with that root as its
working directory and `--root`. `typstProblems` reads Typst's human-readable
diagnostics and names the last place in the trace outside the staged class. It
assumed every reported path was relative to the staged root.

## Goals / Non-Goals

**Goals:**

- A refusal names `overview.typ:<line>` whichever form of path Typst reports
  for a staged file.

**Non-Goals:**

- Changing what Typst renders or which diagnostics refuse.

## Decisions

- **Strip the staged root the typesetter created.** The typesetter knows the
  root, so a reported path that starts with it becomes relative to it, after
  backslashes become slashes and a verbatim `\\?\` prefix is removed. A path
  outside the root stays as reported. Recognising each platform's path form
  instead was rejected: the root is the one fact every form shares.
- **Compare with the root as created and as resolved.** The temporary root can
  be reached through a symbolic link, such as macOS's `/var`, and a tool may
  report the resolved form. Passing both forms keeps one rule for both.
- **Keep the file's path, not only its name.** Matching the name `overview.typ`
  alone was rejected: the trace must still tell the staged class in `archpub/`
  from the composition.

## Risks / Trade-offs

- [Typst reports a staged file in a form neither root matches] → The path
  stays as reported, so the refusal still names a file and a line, and the test
  fixes the three forms seen so far.
- [The Windows form is verified only on hosted CI] → The test feeds the exact
  verbatim form, and the next CI round runs the refusal tests on Windows.
