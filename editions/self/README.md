# Architecture Publisher Self Edition

This source-owned package authors the first-party Architecture Publisher
Edition. It accepts explicit, digest-bound product sources and emits the
standard Source Bundle, Claim Model, Edition, and build request consumed by the
generic `architecture-publisher` package.

It is a downstream consumer, not part of the generic kernel. It does not scan a
repository, infer product intent, grant acceptance, authorize publication, or
retain generated artifacts as source.

The package also owns the self-Edition's authored static composition, recorded
typography input, scene compiler, and SVG/PNG build entry. That entry consumes
only a prepared, digest-bound self Source Bundle and Edition, verifies those
runtime source bytes against the selected provenance, and emits an unqualified
candidate. Static generation does not imply human acceptance or publication.
