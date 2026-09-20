# ETHOS Architecture Extension

`@architecture-publisher/ethos` maps an explicitly selected ETHOS projection
into Architecture Publisher contracts and owns the ETHOS-specific authored
Edition.

Exports:

```text
@architecture-publisher/ethos/adapter
@architecture-publisher/ethos/edition
@architecture-publisher/ethos/runtime
```

The package is an independently installable downstream consumer of
`architecture-publisher`. It exposes input-driven JavaScript APIs rather than a
second CLI. It does not own ETHOS intent, Commitments, Work Lanes, proof, CAS
effects, Attestations, or acceptance.
