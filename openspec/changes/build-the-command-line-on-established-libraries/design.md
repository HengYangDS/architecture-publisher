## Context

See [proposal.md](proposal.md). `runCli(args)` returns an exit status and the text to print, and every test and the
executable go through it. That seam stays. Behind it stand a hand-written parser (`parseArguments`), one usage
string, a table of commands with a `text` function each, and one `catch` that maps errors to the four exit statuses.
The package has no runtime dependency today: its supplies are vendored under `renderers/` and `supplies/`, and a
test refuses any import that is neither Node.js nor the publisher's own.

## Goals / Non-Goals

**Goals:**

- A reader at a terminal sees where to start, what passed, what needs attention and what to run next.
- An agent gets exactly what it gets today: one JSON object with `--json`, the same fields, the same exit statuses.
- The parser, the help and the report layout are a library's, not ours.

**Non-Goals:**

- Interactive prompts. Every command stays runnable without a terminal.
- A new command, option or result field, apart from the nearest-name suggestion and the progress lines.
- Colour as a carrier of meaning: every state has its own mark, and colour only repeats it.
- A machine-readable help. An agent's entry is the Skill, which `archpub skill` prints.

## Decisions

### commander for commands, clack for reports

Looked up on the npm registry on 2026-11-14: commander 15.1.0 has no dependency, needs Node.js 22.12, and gives
grouped help, the nearest-name suggestion, required options and custom help styles. `@clack/prompts` 1.9.0 has
four small dependencies and gives status lines, notes, a spinner, a progress bar and a task log on any stream.
Rejected: yargs, with six dependencies for the same result; ink, with 23, made for interactive interfaces; citty
and clipanion, neither yet at a stable 1.0; a renderer of our own on `node:util`, which the owner ruled out. A
prototype of both libraries, over the real result of a check, is what the proposal describes.

### The seam and the JSON stay

`runCli` keeps its signature. `--json` is taken out of the arguments before commander sees them, as now, and
selects the JSON body. commander runs with `exitOverride` and its output captured, so a usage error becomes exit
status 2 and a JSON body with `code: "usage"`; the message is commander's, such as `unknown command 'chek'`, with
`(Did you mean check?)`.

### Help by role

The commands are grouped under Author (`check`, `build`, `scaffold guide`, `import likec4`, `migrate`), Reviewer
(`accept`, `verify`), Publisher (`publish`) and Agents (`skill`). The contract's roles are the headings, and the
headings say nothing of who holds a role.

### One module holds the report contract

`src/cli/report.mjs` turns a result into clack calls and is the only module that imports clack. Its contract: a
title line with the command and its subject; groups of facts, each one line with a mark, a label and a value; the
marks are those clack draws for success, warning and error; a refusal's problems each on a line with its path; a
closing line with the next command when there is one. A plate that misses a balance gate is marked as needing
attention, so the fact the sentences buried is on the screen.

### Progress goes to the terminal alone

`buildDelivery` and `checkModel` take an optional listener and call it at each step they already have: reading
the model, verifying files, planning views, laying out each plate, typesetting, delivering the page. The command
line passes a listener only when standard error is a terminal and `--json` is absent, and draws it with clack's
task log on standard error. Standard output carries the same bytes with or without it.

### The dependencies are bundled

`package.json` lists both under `dependencies` and `bundleDependencies`, so `npm pack` puts them, with what they
depend on, into the package the archive is assembled from; the lock records each tarball's integrity. Their
licences join the archive's `licenses/`. The import test admits the bundled packages for modules under `src/cli/`
and still refuses them everywhere else, so the model, the layout and the renderers keep to Node.js alone.

## Risks / Trade-offs

- [clack's lines carry a gutter that reads heavy in a long report] → the report module uses its plain message
  lines for facts and a note only for a group that needs a frame; a reviewer other than the author reads the
  reports at 80 and 120 columns, with and without colour, before the lane is proved.
- [A bundled dependency changes the bytes of the package and its size] → the packed size is measured before and
  after and recorded in the tasks; the archive test compares the bundled files with the lock.
- [Progress lines leak into captured output] → a test runs the executable with standard error as a pipe and as a
  pseudo-terminal and compares standard output byte for byte.
- [commander's messages differ from the ones agents may match on] → the JSON `code` stays `usage` for all of them;
  the CHANGELOG lists the change under Breaking.

## Migration Plan

None for models or deliveries. A caller that matched the text of a usage error matches `code` instead.

## Open Questions

None.
