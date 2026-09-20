# Architecture Publisher Self Edition

This package authors the first-party Architecture Publisher Edition. It accepts
explicit, digest-bound product sources and emits the standard Source Bundle,
Claim Model, Edition, and build request consumed by the generic
`architecture-publisher` package.

It is a downstream consumer, not part of the generic kernel. It does not scan a
repository, infer product intent, grant acceptance, authorize publication, or
retain generated artifacts as source.
