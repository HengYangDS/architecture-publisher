# Architecture Publisher

`architecture-publisher` is the domain-neutral compiler and recoverable
publication engine for source-bound Architecture Editions. Its sole public CLI
is `archpub`.

It consumes explicit Source Bundle, Claim Model, Edition, build, Qualification
Set, and publication inputs. It does not discover repositories, import
project-specific schemas, execute source-product governance, or install a
concrete Edition implicitly.

Public package boundaries are `source`, `semantics`, `edition`, `scene`,
`compiler`, `rendering`, `qualification`, `publication`, `runtime`, and the
explicit renderer adapters. Use `archpub --help` for the matching command
surface.
