---
subject: architecture-publisher:command-line
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Command line reference

What `archpub` prints, for a reader at a terminal and for a program. What each
command does is in the [operations reference](operations.md#commands).

## Help and usage errors

`archpub --help` lists the commands under the role that runs them: the author's
`check`, `build`, `scaffold guide`, `import likec4` and `migrate`, the
reviewer's `compare`, `accept` and `verify`, the publisher's `publish`, and under
`Every role` the `skill` and `help` that any of them runs. `archpub <command>
--help` prints that command's usage, what it does and the options it takes,
`--json` among them; an option the command cannot run without stands in the
usage line, as in `Usage: archpub build --out <directory> [options]
<model.json>`, and ends in `(required)`. `check` words the options it shares
with `build` as what it checks, since it writes nothing. A usage error says what is wrong and where the usage
is, and for a mistyped command or option names the nearest one:

```text
error: unknown command 'chek'
(Did you mean check?)
(archpub --help lists the commands)
```

## Exit statuses and JSON results

Exit status 0 means success, 1 a refused input, 2 a usage error and 3 an
internal error, any other failure, such as a file the command cannot read or
write. With `--json`, the command prints one JSON object: `{ "ok": true, ... }`
with the result, `{ "ok": false, "code", "message", "problems" }` for a refusal,
where each problem has a `code`, a JSON `path` into the model and a `message`,
`{ "ok": false, "code": "usage", "message" }` for a usage error, or `{ "ok":
false, "code": "internal_error", "message" }`. `--json` may stand anywhere on
the command line, and no command asks a question: each runs without a terminal.

## Reports

Without `--json`, the same result is a report for a reader at a terminal: a
title with the command and its subject, which is the model's id for `check`
and `build` and the command's first argument as it was typed for every other
command, groups of facts under a heading, each
fact one line with a mark, a label and a value, and a closing line with the
command to run next when there is one. No line but the last is wider than
the terminal: a value that is longer continues on the lines below, under its
own column and beside the guide, and a long title continues beside the guide;
a pipe or a file is written for 80 columns. The closing line is one line
however long, so that the command it names is copied whole; after a check with
`--repo` that command names the same checkout. Labels are
aligned by the width the terminal shows them at. A path inside the working
directory is printed relative to it, as it was typed, while `--json` keeps the
whole path; the command to run next quotes a path that holds a space.

```text
┌  archpub check · big-bank
│
│  Model
◆  Views    2 views admitted
●  Files    none claimed or cited
▲  Uncited  8 components (customer, web, spa, mobile, api, db, mainframe, email)
│           and 10 relations (r1, r2, r3, r4, r5, r6, r7, r8, r9, r10)
│
│  Plates
▲  01  containers-tiers · figure 100% of the body · misses emptyShare 0.182
│      (limit 0.12) and holes 0.441 (limit 0.4)
▲  02  containers-automatic · figure 100% of the body · misses emptyShare 0.124
│      (limit 0.12)
│
│  Warnings
▲  marks_fallback  The edition draws its parts as cards: a strip is drawn from
│                  the files a part owns, and this build reads none.
│
└  Next: archpub build examples/big-bank/model.json --out <directory>
```

`◆` marks a fact that passed, `▲` one that needs attention, such as a plate that
misses a balance gate, a statement no view draws or a file no component owns,
`■` what is refused and `●` a plain note. A plate that misses a gate names it
with what was measured and the limit, as in `emptyShare 0.182 (limit 0.12)`,
and says `reached` after a limit the measure only equals; the components and
relations that no view draws or that cite no file are named. With `--against`,
the guide's citations follow the re-pin worklist in a group of their own: how
many met each fate, then each citation that is not the same under its fate. Every state has its own mark; colour
repeats it where the terminal has colour and carries nothing else, and
`NO_COLOR` or a pipe turns it off. A refusal or a failure names the command's
first argument as it was typed, then its code and message, and then lists each
problem on a line with its path:

```text
┌  archpub check · model.json
│
│  Refused
■  model_invalid  The model is invalid.
│
│  Problems
■  /components/1/label  is required
■  /components/1/labl   is not a model field; did you mean label?
■  /components/1/label  must be non-blank text of at most 2000 characters
│
└  Exit status 1: refused
```

## Comparison of two deliveries

`archpub compare <delivery> <delivery>` first checks each delivery against its
own manifest, as `accept` does, and refuses a directory that is no delivery or
whose files changed after its build, naming the delivery and each such file. It
then compares, byte for byte, every file the two manifests list and the
manifests themselves, and writes nothing. A file differs when its bytes do or
when one delivery alone holds it. The acceptance record, its signature and the
colophon page are not compared: `accept` writes them after the build, with the
reviewer and the time, so a delivery compares the same before and after it is
accepted.

The exit status is 0 whether or not the deliveries differ: a difference is a
finding, not a refusal, and a program reads `identical`. With `--json` the
result of two deliveries that differ in one plate's image is

```json
{
  "ok": true,
  "first": "/work/first",
  "second": "/work/second",
  "identical": false,
  "plates": [
    {
      "page": 2,
      "views": ["containers-automatic"],
      "files": [
        { "path": "images/02-containers-automatic.png", "first": "<sha256>", "second": "<sha256>" }
      ]
    }
  ],
  "files": [{ "path": "manifest.json", "first": "<sha256>", "second": "<sha256>" }]
}
```

`plates` holds each plate with a page image that differs, in the order of the
plates' numbers: its `page`, its `views` and, under `files`, its images that
differ, at every width delivered. These are the plates a reviewer looks at.
`files` holds every other file that differs, the files of the whole edition:
the print edition, the page and what it loads, the overview's images and the
manifest, which records every file's digest and so differs whenever a file
does. Each file carries its SHA-256 in the `first` and in the `second`
delivery, and `null` for a delivery that does not hold it. `first` and `second`
are the two directories as whole paths. `identical` is true exactly when
`plates` and `files` are empty.

The report names both deliveries, then each plate that differs by its number
and views, as a check names it, and the files of the whole edition that differ.
Its closing line counts them, or says that the deliveries are identical:

```text
┌  archpub compare · build/first
│
│  Deliveries
◆  First   build/first · its files match its manifest
◆  Second  build/second · its files match its manifest
│
│  Plates that differ
▲  02  containers-automatic · images/02-containers-automatic.png differs
│
│  Files of the whole edition that differ
▲  manifest.json  differs
│
└  1 plate and 1 file of the whole edition differ.
```

Two builds of one model are the same bytes only when one platform built them
with one date source: the pinned commit under `--repo`, or one
`SOURCE_DATE_EPOCH` without it. The bundled example built twice so, by one
commit of the publisher, was the same in all five of its files, the manifest
among them, so the comparison leaves out no file and no field of a build. The
manifest records neither the platform nor the publisher's commit, so the
command cannot tell whether two builds are comparable; the reviewer knows how
each was built.

## Progress

`archpub skill` prints the Skill as it is written, with no frame. A `check` or a
`build` whose standard error is a terminal draws the step it is at there:
reading the model, verifying files, planning views, laying out the plates,
preparing the page, typesetting the edition and delivering the page. With
`--json`, or when standard error is a pipe or a file, it draws none, and
standard output holds the same bytes either way.
