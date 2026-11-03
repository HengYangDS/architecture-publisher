import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel, scaffoldGuide } from "../src/build.mjs";
import { deliverGuide, draftRepository, readGuide, referencedFiles } from "../src/map/guide.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";
import { MAIN, repository } from "./fixtures/repository.mjs";

const URL = "https://github.com/example/shop.git";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A guide that draws the shop's parts from a local file, a request as a sequence, and cites a line. */
function draft(revision, { sentence = "The service is one module." } = {}) {
  return `# How does the shop answer a request? {#shop}

The front end calls the service, and the service answers from its own code.[](source:main)

- ${sentence}[](source:main)

@answer scope="A fixture for the guide tests."
@meta locale=en repo_url="${URL}" repo_revision=${revision}
@source main title="The service" path="src/main.mjs" lines=1:1

## Which parts are there? {#parts}

@diagram architecture id=parts-map source=parts.architecture.json title="The shop"

## Who talks to whom? {#talk}

@sequence id=talk-flow title="A request"
| actor web | Front end | frontend |
| actor api | Service | backend | source:main |
| web | api | request |
| api | web | answer | return |

@steps id=talk-steps
| step-ask | Front end | Sends one request. | talk-flow | web |
| step-answer | Service | Answers it.[](source:main) | talk-flow | api |

@code id=main-code source=main language=js
`;
}

const PARTS = `${JSON.stringify(
  {
    schema_version: 1,
    diagram_type: "architecture",
    meta: { title: "The shop", output: "parts.html", quality_profile: "showcase", locale: "en" },
    components: [
      { id: "web", type: "frontend", label: "Front end", pos: [40, 40], size: [180, 68] },
      { id: "api", type: "backend", label: "Service", pos: [340, 40], size: [180, 68] },
    ],
    connections: [{ id: "calls", from: "web", to: "api", label: "calls" }],
  },
  null,
  2,
)}\n`;

/** A model beside its guide, pinned to a fixture repository; returns the model's path and the checkout. */
async function guideWork(t, options = {}) {
  const source = await repository(t);
  const root = await temporaryDirectory(t, "archpub-guide-work-");
  await fs.mkdir(path.join(root, "guide"));
  const text = options.draft ?? draft(source.revision, options);
  await fs.writeFile(path.join(root, "guide/guide.archify.md"), text);
  await fs.writeFile(path.join(root, "guide/parts.architecture.json"), PARTS);
  await fs.writeFile(path.join(root, "guide/notes.txt"), "Not referenced.\n");
  const model = minimalModel({
    repository: { name: "shop", url: URL, revision: source.revision },
    guide: "guide/guide.archify.md",
  });
  const file = path.join(root, "model.json");
  await fs.writeFile(file, JSON.stringify(model));
  return { model: file, root, source, draft: text };
}

test("a draft's local files are those its diagrams, charts and images name", () => {
  const text = [
    '@diagram architecture id=a source=parts.architecture.json title="Parts"',
    '@chart type=bar data="size data.csv" x=part y=lines',
    '@image id=shot path=shot.png alt="A shot"',
    "@diagram architecture id=b source=parts.architecture.json",
    '@source main title="Main" path="src/main.mjs" lines=1:1',
    "```md",
    "@diagram architecture id=c source=ignored.json",
    "```",
  ].join("\n");
  assert.deepEqual(referencedFiles(text), ["parts.architecture.json", "size data.csv", "shot.png"]);
});

test("a draft's @meta names the repository it cites", () => {
  assert.deepEqual(draftRepository(draft("a".repeat(40))), { url: URL, revision: "a".repeat(40) });
  assert.deepEqual(draftRepository("# Title {#t}\n\n@meta locale=en\n"), {
    url: null,
    revision: null,
  });
});

test("a guide stages its draft and exactly the files it names", async (t) => {
  const work = await guideWork(t);
  const guide = await readGuide(path.join(work.root, "guide/guide.archify.md"));
  assert.deepEqual(
    guide.entries.map(({ name }) => name),
    ["guide.archify.md", "parts.architecture.json"],
  );
  assert.equal(guide.entries[1].sha256, sha256(PARTS));
  const directory = path.join(work.root, "guide");
  const refused = async (text, code) => {
    await fs.writeFile(path.join(directory, "other.archify.md"), text);
    await assert.rejects(readGuide(path.join(directory, "other.archify.md")), { code });
  };
  await refused(
    "@diagram architecture id=a source=../parts.architecture.json\n",
    "guide_file_invalid",
  );
  await refused("@diagram architecture id=a source=missing.json\n", "guide_file_invalid");
  await fs.symlink(
    path.join(directory, "parts.architecture.json"),
    path.join(directory, "link.json"),
  );
  await refused("@diagram architecture id=a source=link.json\n", "guide_file_invalid");
  await assert.rejects(readGuide(path.join(directory, "absent.archify.md")), {
    code: "guide_missing",
  });
});

test("a guide is the page, its cited lines pinned and the checkout untouched", async (t) => {
  const work = await guideWork(t);
  const out = await temporaryDirectory(t, "archpub-guide-out-");
  const options = { repo: work.source.root, media: ["page"] };
  await buildDelivery(work.model, path.join(out, "first"), options);
  await buildDelivery(work.model, path.join(out, "second"), options);
  const read = (name, file) => fs.readFile(path.join(out, name, file));
  const manifest = JSON.parse(await read("first", "manifest.json"));
  assert.deepEqual(manifest.page.guide, {
    path: "guide/guide.archify.md",
    sha256: sha256(work.draft),
    files: [{ name: "parts.architecture.json", sha256: sha256(PARTS) }],
    writing: "strict",
    sources: "verified",
  });
  assert.ok((await read("first", "index.html")).toString().includes(MAIN.trim()));
  assert.deepEqual(await read("second", "manifest.json"), await read("first", "manifest.json"));
  assert.deepEqual(await read("second", "index.html"), await read("first", "index.html"));
  assert.equal(work.source.git("status", "--porcelain"), "");
  assert.equal(work.source.git("remote"), "");
});

test("a guide whose checkout cannot be cloned is refused", async (t) => {
  const work = await guideWork(t);
  const { entries } = await readGuide(path.join(work.root, "guide/guide.archify.md"));
  const page = {
    kind: "guide",
    path: "guide/guide.archify.md",
    entries,
    quality: "showcase",
    writing: "strict",
    repo: await temporaryDirectory(t, "archpub-not-a-repository-"),
    repository: { url: URL, revision: work.source.revision },
  };
  await assert.rejects(deliverGuide(page, await temporaryDirectory(t)), {
    code: "guide_repository_unavailable",
  });
});

test("a guide for another revision or with a sentence too long is refused", async (t) => {
  const other = await guideWork(t, { draft: draft("0".repeat(40)) });
  await assert.rejects(checkModel(other.model, { repo: other.source.root, media: ["page"] }), {
    code: "guide_repository_mismatch",
  });
  const long = await guideWork(t, {
    sentence:
      "The service is one module that the front end calls for every request it sends, and it answers every one of those requests from the code it holds at the pinned revision of the repository today.",
  });
  await assert.rejects(checkModel(long.model, { repo: long.source.root, media: ["page"] }), {
    code: "page_refused",
    message: /explainer\/writing-sentence-length/u,
  });
  const relaxed = await checkModel(long.model, {
    repo: long.source.root,
    media: ["page"],
    quality: "standard",
  });
  assert.equal(relaxed.guide.writing, "warn");
});

test("a scaffold writes today's page as a guide that builds", async (t) => {
  const root = await temporaryDirectory(t, "archpub-scaffold-");
  const file = path.join(root, "model.json");
  const model = minimalModel({ summary: "Alpha calls Beta." });
  await fs.writeFile(file, JSON.stringify(model));
  const result = await scaffoldGuide(file, path.join(root, "guide"));
  assert.equal(result.draft, "guide.archify.md");
  const written = (await fs.readdir(path.join(root, "guide"))).sort();
  assert.deepEqual(written, ["guide.archify.md", ...result.files].sort());
  assert.ok(
    result.files.length && result.files.every((name) => name.endsWith(".architecture.json")),
  );
  await assert.rejects(scaffoldGuide(file, path.join(root, "guide")), {
    code: "scaffold_output_exists",
  });
  await fs.writeFile(file, JSON.stringify({ ...model, guide: "guide/guide.archify.md" }));
  const checked = await checkModel(file, { media: ["page"] });
  const digest = async (name) => sha256(await fs.readFile(path.join(root, "guide", name)));
  const files = [];
  for (const name of [...result.files].sort()) files.push({ name, sha256: await digest(name) });
  assert.deepEqual(checked.guide, {
    path: "guide/guide.archify.md",
    sha256: await digest("guide.archify.md"),
    files,
    writing: "strict",
    sources: "declared",
  });
});
