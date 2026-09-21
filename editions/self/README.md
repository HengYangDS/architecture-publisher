# Architecture Publisher Self Edition

This source-owned package authors the first-party Architecture Publisher
Edition. It accepts explicit, digest-bound product sources and emits the
standard Source Bundle, Claim Model, Edition, and build request consumed by the
generic `architecture-publisher` package.

It is a downstream consumer, not part of the generic kernel. It does not scan a
repository, infer product intent, grant acceptance, authorize publication, or
retain generated artifacts as source.

The package also owns the self-Edition's authored static and interactive
compositions. Its independent build entries emit a 6000-pixel SVG/PNG pair and
a single-file interactive Atlas with a complete overview, complete mechanism
chapters, navigation, focus, trace, and Source Bundle inspection. Both entries
consume only a prepared, digest-bound Source Bundle and Edition, verify their
runtime source bytes against selected provenance, and emit unqualified
candidates. Generation does not imply human acceptance or publication.
