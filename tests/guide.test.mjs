import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel, scaffoldGuide } from "../src/build.mjs";
import {
  draftRepository,
  guideCitations,
  guidePage,
  readGuide,
  referencedFiles,
} from "../src/map/guide.mjs";
import { publishersPaths } from "../src/map/guide-figures.mjs";
import { PARTS, URL, draft, guideWork } from "./fixtures/guide-work.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";
import { MAIN } from "./fixtures/repository.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

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

test("a guide cites its sources' line ranges and its diagrams' node sources", () => {
  const text = [
    '@source main title="Main" path="src/main.mjs" lines=3:7',
    '@source one title="One line" path="src/one.mjs" lines=5',
    '@source file title="A whole file" path="README.md"',
    "```md",
    '@source ignored title="In a fence" path="src/ignored.mjs" lines=1:2',
    "```",
  ].join("\n");
  const parts = {
    components: [
      {
        id: "x",
        sources: [
          { path: "src/x.mjs", line: 2, end_line: 4, label: "X" },
          { path: "src/y.mjs", label: "Y" },
        ],
      },
    ],
  };
  const entries = [
    { name: "guide.archify.md", bytes: Buffer.from(text) },
    { name: "parts.architecture.json", bytes: Buffer.from(JSON.stringify(parts)) },
    { name: "size.csv", bytes: Buffer.from("part,lines\n") },
  ];
  assert.deepEqual(guideCitations(entries), [
    { where: "@source main", path: "src/main.mjs", lines: [3, 7] },
    { where: "@source one", path: "src/one.mjs", lines: [5, 5] },
    { where: "@source file", path: "README.md", lines: null },
    { where: "parts.architecture.json/components/0/sources/0", path: "src/x.mjs", lines: [2, 4] },
    { where: "parts.architecture.json/components/0/sources/1", path: "src/y.mjs", lines: null },
  ]);
  const broken = [entries[0], { name: "parts.architecture.json", bytes: Buffer.from("{") }];
  assert.throws(() => guideCitations(broken), { code: "guide_file_invalid" });
});

test("a draft's @meta names the repository it cites", () => {
  assert.deepEqual(draftRepository(draft("a".repeat(40))), {
    url: URL,
    revision: "a".repeat(40),
    provider: null,
    link_mode: null,
  });
  assert.deepEqual(
    draftRepository(
      "# Title {#t}\n\n@meta locale=en repo_provider=gitlab repo_link_mode=local-only\n",
    ),
    { url: null, revision: null, provider: "gitlab", link_mode: "local-only" },
  );
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
  // A diagram file that places a part is refused as the guide is read, so a check refuses what a build would.
  const placed = JSON.parse(PARTS);
  placed.components[0].pos = [40, 40];
  await fs.writeFile(path.join(directory, "placed.architecture.json"), JSON.stringify(placed));
  await refused(
    "@diagram architecture id=a source=placed.architecture.json\n",
    "page_diagram_publisher_field",
  );
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
  assert.ok((await read("first", "minimal.html")).toString().includes(MAIN.trim()));
  assert.deepEqual(await read("second", "manifest.json"), await read("first", "manifest.json"));
  assert.deepEqual(await read("second", "minimal.html"), await read("first", "minimal.html"));
  assert.equal(work.source.git("status", "--porcelain"), "");
  assert.equal(work.source.git("remote"), "");
});

test("a guide whose checkout cannot be cloned is refused", async (t) => {
  const work = await guideWork(t);
  const guide = await readGuide(path.join(work.root, "guide/guide.archify.md"));
  const model = JSON.parse(await fs.readFile(work.model, "utf8"));
  await assert.rejects(
    guidePage(model, guide, {
      quality: "showcase",
      repo: await temporaryDirectory(t, "archpub-not-a-repository-"),
    }),
    { code: "guide_repository_unavailable" },
  );
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

test("a scaffold writes today's page as a guide that places nothing and builds", async (t) => {
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
  for (const name of result.files) {
    const document = JSON.parse(await fs.readFile(path.join(root, "guide", name), "utf8"));
    assert.deepEqual(
      publishersPaths("architecture", document),
      [],
      `${name} states what an author may`,
    );
  }
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

test("a guide's architecture file builds, the publisher laying it out, and the manifest keeps the author's file", async (t) => {
  // The queue item `page-figures`: the page's diagrams are laid out by the publisher.
  const work = await guideWork(t);
  const authored = PARTS;
  const out = await temporaryDirectory(t, "archpub-guide-out-");
  const options = { repo: work.source.root, media: ["page"] };
  await buildDelivery(work.model, path.join(out, "built"), options);
  const manifest = JSON.parse(await fs.readFile(path.join(out, "built", "manifest.json"), "utf8"));
  assert.deepEqual(manifest.page.guide.files, [
    { name: "parts.architecture.json", sha256: sha256(authored) },
  ]);
  assert.ok(
    (await fs.readFile(path.join(out, "built", "minimal.html"), "utf8")).includes("Service"),
  );
});
