## MODIFIED Requirements

### Requirement: Command help

`archpub --help` SHALL print the commands grouped by the role that runs them, the author, the reviewer and the
publisher, then those every role runs, each with one line of what it does; `archpub <command> --help` that
command's usage with the options it cannot run without, what it does and its options, `--json` among them; and
`archpub --version` the package version, each with status 0. A usage error SHALL say what is wrong and, for a
mistyped command or option, name the nearest one.

#### Scenario: One command's usage

- **WHEN** `archpub build --help` runs
- **THEN** standard output holds the usage of `archpub build` and its options
- **AND** the usage line names `--out <directory>`, whose description ends in `(required)`
- **AND** the exit status is 0

#### Scenario: A mistyped command

- **WHEN** `archpub` is given the unknown command 'chek' with a model
- **THEN** the output says `unknown command 'chek'` and names `check`
- **AND** the exit status is 2

## ADDED Requirements

### Requirement: Results for a reader at a terminal

Without `--json` a command SHALL print its result as marked lines: one line for each fact, with a mark that tells
passed, needs attention, refused and merely noted apart without colour, under a heading for each group, and the
next command to run when there is one, with the checkout a check read. A refusal SHALL name the command's first
argument as typed and list each problem on a line with its path.

#### Scenario: A check with a plate that misses a gate

- **WHEN** `archpub check` admits a model one of whose plates misses a balance gate
- **THEN** that plate's line carries the mark for needs attention and names the gate, what was measured and its limit

#### Scenario: A check that read a checkout

- **WHEN** `archpub check model.json --repo shop` admits the model
- **THEN** the closing line is `Next: archpub build model.json --repo shop --out <directory>`

#### Scenario: A refused model

- **WHEN** `archpub check` refuses a model with two problems
- **THEN** the title names the command and the model as it was typed
- **AND** the output names the refusal and lists each problem with its path

### Requirement: Reports fit the terminal

No line of a report but its closing line SHALL be wider than the terminal it is written to, or than 80 columns
when it is written to no terminal: a value and a title that are longer SHALL continue on further lines, a value
under its own first column. The closing line SHALL be one line however long, so that the command it names is
copied whole. A path inside the working directory SHALL be printed relative to it, while the `--json` result
keeps the whole path.

#### Scenario: A value longer than the terminal

- **WHEN** a report with a value of 200 characters is written to a terminal 80 columns wide
- **THEN** no line of the report is wider than 80 columns
- **AND** the value's further lines start in the column its first line starts in

#### Scenario: A next command longer than the terminal

- **WHEN** a report whose next command is 150 characters long is written to a terminal 80 columns wide
- **THEN** the closing line holds the whole command on one line

#### Scenario: A delivery built inside the working directory

- **WHEN** `archpub build model.json --out delivery` runs
- **THEN** the report names the directory `delivery` and the next command `archpub accept delivery --reviewer <name>`
- **AND** with `--json` the result's `out` is the directory's whole path

### Requirement: Progress on a terminal

A build or a check whose standard error is a terminal SHALL show on it the step it is at. With `--json`, or when
standard error is no terminal, it SHALL show none, and standard output SHALL hold the same bytes either way.

#### Scenario: A build piped to a file

- **WHEN** `archpub build` runs with standard error redirected to a file
- **THEN** the file holds no progress, and standard output equals that of a run on a terminal
