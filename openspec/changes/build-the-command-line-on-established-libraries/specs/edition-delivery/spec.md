## MODIFIED Requirements

### Requirement: Command help

`archpub --help` SHALL print the commands grouped by the role that runs them, the author, the reviewer, the
publisher and agents, each with one line of what it does; `archpub <command> --help` that command's usage, what
it does and the options it takes; and `archpub --version` the package version, each with status 0. A usage error
SHALL say what is wrong and, for a mistyped command or option, name the nearest one.

#### Scenario: One command's usage

- **WHEN** `archpub build --help` runs
- **THEN** standard output holds the usage of `archpub build` and its options
- **AND** the exit status is 0

#### Scenario: A mistyped command

- **WHEN** `archpub chek model.json` runs
- **THEN** the output says that `chek` is unknown and names `check`
- **AND** the exit status is 2

## ADDED Requirements

### Requirement: Results for a reader at a terminal

Without `--json` a command SHALL print its result as marked lines: one line for each fact, with a mark that tells
passed, needs attention and refused apart without colour, under a heading for each group, and the next command to
run when there is one. A refusal SHALL list each problem on a line with its path.

#### Scenario: A check with a plate that misses a gate

- **WHEN** `archpub check` admits a model one of whose plates misses a balance gate
- **THEN** that plate's line carries the mark for needs attention and names the gate

#### Scenario: A refused model

- **WHEN** `archpub check` refuses a model with two problems
- **THEN** the output names the refusal and lists each problem with its path

### Requirement: Progress on a terminal

A build or a check whose standard error is a terminal SHALL show on it the step it is at. With `--json`, or when
standard error is no terminal, it SHALL show none, and standard output SHALL hold the same bytes either way.

#### Scenario: A build piped to a file

- **WHEN** `archpub build` runs with standard error redirected to a file
- **THEN** the file holds no progress, and standard output equals that of a run on a terminal
