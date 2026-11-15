import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel } from "../src/build.mjs";
import { pageModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";

const GUIDE = "guide/guide.archify.md";
const DIAGRAM = "parts.architecture.json";
const ABSENT = "docs/absent.md";

/**
 * Write the page model with a guide beside it and return the model's path. The model's first component claims
 * `src/` and its first relation cites a file there; the guide's draft cites one path of the repository in a
 * `@source`, and a node of its one diagram cites another.
 */
async function guidedModel(t, repositoryOf, { draft, diagram }) {
  const { components, relations } = pageModel();
  const file = await writeModel(
    t,
    pageModel({
      components: components.map((component, index) =>
        index ? component : { ...component, files: ["src/"] },
      ),
      relations: relations.map((relation, index) =>
        index ? relation : { ...relation, files: ["src/main.mjs"] },
      ),
      repository: repositoryOf,
      guide: GUIDE,
    }),
  );
  const directory = path.join(path.dirname(file), path.dirname(GUIDE));
  await fs.mkdir(directory);
  await fs.writeFile(
    path.join(directory, path.basename(GUIDE)),
    [
      "@meta title=Page",
      `@source cited title="Cited" path="${draft}" lines=1:1`,
      `@diagram source=${DIAGRAM}`,
      "",
      "# How does a request reach its store? {#guide}",
      "",
    ].join("\n"),
  );
  const node = { id: "parts-client", label: "Client", sources: [{ path: diagram }] };
  await fs.writeFile(
    path.join(directory, DIAGRAM),
    JSON.stringify({ diagram_type: "architecture", components: [node], connections: [] }),
  );
  return file;
}

test("a guide's citation of a file absent at the pin is refused with a checkout, whichever media are built", async (t) => {
  const { root: checkout, revision } = await repository(t);
  const repositoryOf = { name: "fixture", url: "https://example.invalid/fixture.git", revision };
  const root = await temporaryDirectory(t, "archpub-guide-files-");
  const out = path.join(root, "out");
  const cases = [
    // A source of the draft is named by its id; the diagram's node cites a file the binding already holds.
    [{ draft: ABSENT, diagram: "src/main.mjs" }, "@source cited"],
    // A source of a diagram's node is named by the diagram's file and the source's JSON pointer.
    [{ draft: "README.md", diagram: ABSENT }, `${DIAGRAM}/components/0/sources/0`],
  ];
  for (const [cited, where] of cases) {
    const model = await guidedModel(t, repositoryOf, cited);
    const refused = (error) => {
      assert.equal(error.code, "guide_file_missing");
      // The refusal names the guide, where the citation stands in it, the path and the revision.
      assert.ok(error.message.includes(GUIDE), error.message);
      assert.deepEqual(error.problems, [
        {
          code: "guide_file_missing",
          path: where,
          message: `${ABSENT} is not a file at ${revision}`,
        },
      ]);
      return true;
    };
    for (const media of [["edition"], ["page"], ["edition", "page"]]) {
      const options = { repo: checkout, media, png: [240] };
      await assert.rejects(checkModel(model, options), refused, `check, ${where}, ${media}`);
      await assert.rejects(
        buildDelivery(model, out, options),
        refused,
        `build, ${where}, ${media}`,
      );
    }
  }
  // Nothing was written: no delivery and no staging directory beside it.
  assert.deepEqual(await fs.readdir(root), []);
  // Without a checkout nothing is read at the pin and nothing is known to be absent: the same model builds, and
  // the absent path stands in the evidence table like every other, unverified and with no digest.
  const [[cited]] = cases;
  const model = await guidedModel(t, repositoryOf, cited);
  await buildDelivery(model, out, { media: ["edition"], png: [240] });
  const manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));
  const data = JSON.parse(await fs.readFile(path.join(out, "page.json"), "utf8"));
  assert.deepEqual(manifest.sources, { state: "unverified", count: 2 });
  assert.equal(manifest.data.statements.unchecked, 2);
  assert.deepEqual(
    data.evidence.map(({ path: file, state, ranges }) => [file, state, ranges.length]),
    [
      [ABSENT, "unverified", 1],
      ["src/", "unverified", 0],
      ["src/main.mjs", "unverified", 1],
    ],
  );
  assert.deepEqual(Object.keys(data.evidence[0]), ["path", "state", "relations", "ranges"]);
});
