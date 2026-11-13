---
subject: architecture-publisher:how-to
role: how-to
state: canonical
relations:
  governed_by: product-contract.md
---

# How-to guides

Short recipes for tasks you already know you need. The
[tutorial](tutorial.md) walks through a first work end to end; the
[model](reference/model.md) and [operations](reference/operations.md)
references give every detail.

## Install the command

With [mise](https://mise.jdx.dev), one line installs the archive for your
machine, which holds `archpub` with its own Node.js and Typst and needs only
Git:

```sh
mise use -g github:HengYangDS/architecture-publisher
```

Each release has an archive for Linux and Windows on ARM64 and x86-64 and for
macOS on ARM64. By default mise does not offer a release in its first 24 hours,
so on the day of a release this line installs the one before it. Name the
version to take it at once:

```sh
mise use -g github:HengYangDS/architecture-publisher@<version>
```

That keeps the version you named. To follow the newest release without the wait
instead, exempt this tool from it once and run the first line again:

```sh
mise settings add minimum_release_age_excludes github:HengYangDS/architecture-publisher
```

To pin a version by its checksums in a project instead, copy the release's
`architecture-publisher-<version>.mise.toml` into the project's mise
configuration, as the [operations reference](reference/operations.md#installation)
shows.

With [Homebrew](https://brew.sh) on macOS on ARM64 or on Linux, a formula
installs the same archive:

```sh
brew install HengYangDS/tap/archpub
```

Without either, download `archpub-<version>-<platform>.tar.gz` from the
[releases](https://github.com/HengYangDS/architecture-publisher/releases),
unpack it anywhere and put its `archpub/bin` on your path. Where Node.js 22.13
or later is already present, `npm install --global --ignore-scripts architecture-publisher`
installs the same command as an npm package; it needs Typst 0.15.1 on the path
to build the print edition.

`archpub --version` prints the installed version, and `archpub <command> --help`
explains each command.

## Start from a LikeC4 workspace

```sh
archpub import likec4 <workspace> --out model.json --id <id>
```

The import writes a model from the workspace's elements, relationships and
views and lists, with its file and line, each construct a model cannot hold.
`--locale` sets the model's language. Add `repository`, each component's
`files` and each relation's `files` before checking it with `--repo`;
[`examples/likec4-shop`](../examples/likec4-shop/README.md) is a workspace to try.

## Write the guide

The guide is the page that explains the system in your words. Start from the
page the publisher would generate:

```sh
archpub scaffold guide model.json --out guide
```

Name `guide/guide.archify.md` in the model's `guide`, then rewrite the draft:
the conclusion and its reasons first, then one question per panel in the form
that fits it, such as a sequence for an exchange, a table for a comparison or a
code excerpt for a guarantee. Cite each claim with a line range at the model's
revision, and keep to four native diagrams. Run
`archpub check model.json --repo <checkout>` until Archify's writing checks and
its repository checks pass; [the guide](reference/operations.md#the-guide)
explains both.

## Compose an overview

An overview is one page of the print edition, after its contents, that you
compose in Typst with the publisher's house class. Name the file in the model's
`overview`; the [model reference](reference/model.md#overview) lists what the
class provides and what a composition may not do, and `archpub check` refuses a
composition at its line.

## Re-pin a work to a later commit

```sh
archpub check model.json --repo <checkout> --against <commit>
```

The re-pin worklist names, for each component, the files that changed, moved or
went and the files its claims now take in; the relations whose files changed;
what a build at that commit would refuse; the newly uncovered files; and every
guide citation that shifted, moved, was touched or is gone. Update the model and
the guide for each, move every shifted citation to its new range, reread every
touched one, then set `repository.revision` to the commit and build a new
delivery.

## Build one medium while you work

```sh
archpub build model.json --repo <checkout> --out <new-directory> --media edition
```

`--media edition` builds the print edition and its images without running
Archify; `--media page` builds the page without Typst. `--png` sets the widths of
the edition's images.

## Hand a work to a reviewer

```sh
archpub accept <delivery> --reviewer "<name>"
archpub publish <delivery> --to <root>
```

Only the person named accepts. `accept` refuses a delivery whose files changed
since the build, and `publish` copies only an accepted delivery, to
`<root>/<model id>/<version>/`.

## Let an agent write the model

```sh
archpub skill
```

prints the agent Skill that ships with the installed version: how to agree on
the reader's question, claim files, plan views, check, write the guide, build
and hand the work to a person to accept. Give it to your agent, or install it
where your agent reads Skills.
