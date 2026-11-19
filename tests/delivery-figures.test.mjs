import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { DELIVERY_FORMAT, digestTree } from "../src/build.mjs";
import { compareDeliveries, verifyAcceptance } from "../src/delivery.mjs";
import { plateSummary } from "../src/manifest.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";

// A figure set alone is a file of its delivery as a page image is: what verifies a delivery digests it, and a
// comparison reports it under its plate. The deliveries here are recorded by hand, so nothing is built.

/** One plate as a build records it in the manifest, with its image at one width and its figure's two files. */
const PLATE = plateSummary(
  {
    page: 1,
    views: ["a"],
    share: 0.6,
    reading: "beside",
    composition: {},
    measures: {},
    misses: [],
  },
  [960],
);
const IMAGE = "images/01-a-960.png";
const [PNG, SVG] = ["figures/01-a.png", "figures/01-a.svg"];
/** A file under `figures/` that no plate's record names. */
const LOOSE = "figures/loose.svg";

/** A directory that holds the given files and a manifest of them that records the plate. */
async function recorded(t, files) {
  const directory = await temporaryDirectory(t, "archpub-figures-");
  for (const [file, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await fs.writeFile(path.join(directory, file), text);
  }
  const manifest = {
    format: DELIVERY_FORMAT,
    plates: [PLATE],
    artifacts: await digestTree(directory),
  };
  await fs.writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest));
  return directory;
}

test("a plate's record names its figure's two files beside its image", () => {
  assert.deepEqual(
    [PLATE.images, PLATE.figures],
    [
      [{ width: 960, file: IMAGE }],
      [
        { format: "png", file: PNG },
        { format: "svg", file: SVG },
      ],
    ],
  );
});

test("a comparison reports a figure that differs under its plate, as it reports a page image", async (t) => {
  const first = await recorded(t, { [IMAGE]: "a", [PNG]: "a", [SVG]: "a", [LOOSE]: "a" });
  const second = await recorded(t, { [IMAGE]: "b", [PNG]: "b", [SVG]: "a", [LOOSE]: "b" });
  const compared = await compareDeliveries(first, second);
  assert.equal(compared.identical, false);
  // The SVG's bytes are the same in both, so it is no difference; the PNG stands beside the image.
  assert.deepEqual(
    compared.plates.map(({ page, views, files }) => [page, views, files.map((file) => file.path)]),
    [[1, ["a"], [PNG, IMAGE]]],
  );
  // A file no plate's record names is a file of the whole edition, under `figures/` as anywhere.
  assert.deepEqual(
    compared.files.map((file) => file.path),
    [LOOSE, "manifest.json"],
  );
  assert.equal((await compareDeliveries(first, first)).identical, true);
});

test("what verifies a delivery digests its figures: a changed, a missing or an unlisted one is refused", async (t) => {
  const files = { [IMAGE]: "a", [PNG]: "a", [SVG]: "a" };
  const refused = (said) => (error) =>
    error.code === "delivery_changed" &&
    error.problems.length === 1 &&
    error.problems[0].message === said;
  // Unchanged, the delivery passes the manifest's check: the verification goes on to the acceptance it lacks.
  await assert.rejects(verifyAcceptance(await recorded(t, files)), { code: "acceptance_missing" });
  for (const file of [PNG, SVG]) {
    const changed = await recorded(t, files);
    await fs.writeFile(path.join(changed, file), "b");
    await assert.rejects(verifyAcceptance(changed), refused(`${file} changed`));
    await fs.rm(path.join(changed, file));
    await assert.rejects(verifyAcceptance(changed), refused(`${file} is missing`));
  }
  const grown = await recorded(t, files);
  await fs.writeFile(path.join(grown, "figures", "02-b.svg"), "a");
  await assert.rejects(verifyAcceptance(grown), refused("figures/02-b.svg is not in the manifest"));
});
