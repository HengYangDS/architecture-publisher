# Structural examples

These examples demonstrate portable, source-bound use of the generic product.
They are intentionally small and do not claim flagship visual acceptance or
support for every architecture domain.

Each example contains independently authored interactive JSON and static SVG
with shared semantic identities. Neither medium is derived from the other.
Updated variants make real semantic changes rather than title-only changes.

## Interactive rendering

```sh
archpub render interactive architecture service-topology.json \
  --sha256 <json-digest> --output <artifact.html>

archpub render interactive lifecycle job-lifecycle.json \
  --sha256 <json-digest> --output <artifact.html>
```

## Static rendering

Create a closed `architecture.source-bundle/v1` containing the selected SVG and
font files, then provide an external raster request:

```sh
archpub render raster <request.json>
```

The request selects the manifest digest, SVG member, font members and weights,
target width, and an absent PNG output. It resolves relative paths from the
request file and never discovers system fonts.

The resulting local bundle may be verified with:

```sh
archpub source verify <manifest.json> --sha256 <manifest-digest>
```

This proves byte identity only. Browser behavior, accessibility, human review,
and recoverable publication require their own exact evidence.

`tests/example-journeys.test.mjs` installs the packed core into an isolated
consumer, uses empty user configuration, and exercises original and updated
examples through both media. It verifies deterministic output, relocated input,
semantic identity, directed relations, visible conditions, and bundle integrity.
