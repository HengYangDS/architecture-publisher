# Architecture Publisher Self Edition

[`model.json`](model.json) describes Architecture Publisher itself: the
command line, the stages, the build steps, the grid layout and the two media.
It pins one repository revision and records the SHA-256 digest of every source
file it cites. Its three views are the overview, the grid layout and the media.

Build it from the repository root; `--repo` verifies each source at the pinned
revision:

```bash
node packages/publisher/src/cli/main.mjs build editions/self/model.json --repo . --out build/runtime/work/self
```

The model is the only source. Posters, the map and the manifest are
reproducible output and stay under the ignored `build/` tree. A revision cannot
name the commit that contains it, so the model always describes an earlier
commit; after the described code changes, pin a newer commit and its digests.
