# Build from native architecture files

This example explains one connection: **Alpha → Beta**. The architecture stays
in LikeC4; Publisher does not require a second model of its nodes and edges.

## Input

| File                   | What you edit                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| `model.c4`             | The components and their connection.                                    |
| `views.c4`             | The native view that selects those components.                          |
| `edition/project.json` | The reader, question, scope and separate PNG/HTML presentation choices. |
| `build-request.json`   | The exact files and media to build, pinned by SHA-256.                  |

The editorial Project asks an ordinary question:

```json
{
  "audiences": [{ "id": "maintainer", "label": "Maintainers" }],
  "questions": [
    {
      "id": "flow",
      "audience": "maintainer",
      "text": "What connects the two components?"
    }
  ]
}
```

This is an excerpt of `edition/project.json`, not another input file. Its
`scope.selections` associates `flow` with the existing `view:overview`.
The question guides explanation; it does not execute a query or invent a fact.

## Build and output

With Publisher installed, invoke its public command from this copied example:

```text
archpub edition build build-request.json --sha256 <request-sha256> --output <absent-output-directory>
```

`request-sha256` is the SHA-256 of the current `build-request.json` bytes.
After changing a selected native file, update its digest in the request before
computing the request digest. Changed bytes with an old digest are rejected.

The output directory contains independently composed siblings:

| Output                          | Purpose                                |
| ------------------------------- | -------------------------------------- |
| `static/architecture.png`       | Understand the connection at a glance. |
| `static/architecture.svg`       | The static vector carrier.             |
| `interactive/architecture.html` | Explore the complete desktop diagram.  |
| `candidate.json` and manifest   | Bind the selected inputs and outputs.  |

Construction does not constitute visual, source or publication approval.
Deterministic rebuilding requires no Agent.

## Keep the source repository untouched

The example may live in an external editorial project. Copy only the selected
native files, or consume a source-owned declarative Provider v2 manifest that
selects their exact bytes. The editor owns `project.json`; the source owner
retains the architecture facts. Neither needs Publisher source code, a custom
export script, an executable Provider or an added runtime in the source repository.

See the [Edition contract](../../docs/edition-contract.md) and
[Provider reference](../../docs/reference/edition-provider.md) for the existing
schemas and the [build reference](../../docs/reference/operations.md#edition-candidate)
for exact invocation rules.
