# Architecture Publisher Self Edition

This source-owned package authors the first-party Architecture Publisher
Edition. It accepts explicit, digest-bound product sources and emits the
standard Source Bundle, Claim Model, Edition, and build request consumed by the
generic `architecture-publisher` package.

Preparation returns the exact `buildRequest` path and `buildRequestSha256`.
The portable `build-input/` directory contains the selected model, Edition
project, data-only scene refinement, and request. Move it as a unit; the generic
Core can build both media after this authoring package is removed.

It is a downstream consumer, not part of the generic kernel. It does not scan a
repository, infer product intent, grant acceptance, authorize publication, or
retain generated artifacts as source.

The package owns the self-Edition's art direction. Separate static and Atlas
builders remain only as migration comparison paths; they are not the terminal
build interface. Preparation emits selected inputs; the generic build emits an
unqualified Candidate. Neither grants human acceptance or publication.
