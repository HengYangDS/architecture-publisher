# Architecture Publisher

`architecture-publisher` is the domain-neutral compiler and recoverable
publication engine for source-bound Architecture Editions. Its sole public CLI
is `archpub`.

New authoring selects a Build Request with direct native inputs, an authored
Edition Project, and optional Edition Providers. Historical Source Bundle,
Claim Model, and Edition inputs retain their original contract. The package
also accepts explicit Qualification Set and publication inputs. It does not
discover repositories, import project-specific schemas, execute source-product
governance, or install a concrete Edition implicitly.

Public package boundaries are `source`, `semantics`, `edition`, `scene`,
`compiler`, `rendering`, `qualification`, `publication`, `runtime`, and the
explicit renderer adapters. Use `archpub --help` for the matching command
surface.

## Input and output

1. Select native source files, such as LikeC4 DSL, or an attributed Claim Model.
2. Write an Edition Project: audience, reader questions, exact source references,
   omissions, and separate static and interactive view choices.
3. Name those inputs and their hashes in a Build Request. A Provider is optional;
   it is not required for a direct file build.
4. Build into a new directory:

```sh
archpub edition build request.json --sha256 <request-digest> --output <new-directory>
```

The Candidate contains the requested SVG/PNG or standalone HTML, an input lock,
and a manifest. A person, script, or agent can author the inputs; running the
compiler requires no agent. The question text is a prompt for the reader, not an
executable query. Visible-content checks do not prove source truth, answer
adequacy, acceptance, or publication authority.
