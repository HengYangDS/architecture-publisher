import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { importLikeC4 } from "../packages/publisher/src/importers/likec4.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";

const SHOP = fileURLToPath(new URL("./fixtures/likec4/shop/", import.meta.url));

async function workspace(t, files) {
  const root = await temporaryDirectory("archpub-likec4-");
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), text);
  }
  return root;
}

test("a LikeC4 workspace becomes a valid model and reports what it cannot carry", async () => {
  const { model, warnings, supplySha256 } = await importLikeC4(SHOP, { id: "shop", title: "Shop" });
  assert.match(supplySha256, /^[0-9a-f]{64}$/u);
  assert.equal(model.question, "How is Shop structured?");
  assert.deepEqual(
    model.components.map(({ id, kind }) => [id, kind]),
    [
      ["customer", "person"],
      ["payments", "externalsystem"],
      ["shop.web", "container"],
      ["shop.api", "container"],
      ["shop.db", "database"],
      ["platform.region.cache", "database"],
    ],
  );
  assert.deepEqual(model.kinds.externalsystem, { label: "externalSystem", category: "external" });
  assert.deepEqual(model.components[0].details, { description: "Buys things online" });
  assert.deepEqual(
    model.groups.map(({ id, members }) => [id, members]),
    [
      ["group-shop", ["shop.web", "shop.api", "shop.db"]],
      ["group-platform.region", ["platform.region.cache"]],
    ],
  );
  const placed = model.relations.find(({ id }) => id === "shop.web-shop.api");
  assert.deepEqual(placed.details, { technology: "HTTPS" });
  assert.equal(model.relations.find(({ to }) => to === "platform.region.cache").label, "uses");
  assert.deepEqual(
    model.views.map(({ id, members }) => [id, members.length]),
    [
      ["index", 6],
      ["internals", 6],
    ],
  );
  assert.deepEqual(
    warnings.map(({ code, path: where }) => [code, where]),
    [
      ["likec4_nested_parent", "model.c4:24"],
      ["likec4_relation_bidirectional", "model.c4:35"],
      ["likec4_relation_unrepresented", "model.c4:36"],
      ["likec4_view_unsupported", "views.c4:9"],
    ],
  );
});

test("views beyond the limit are reported and identities stay unique", async (t) => {
  const views = Array.from(
    { length: 6 },
    (_, index) => `  view v${index} {\n    include *\n  }\n`,
  ).join("");
  const root = await workspace(t, {
    "a.c4": [
      "specification {\n  element queue\n  element service\n}",
      "model {\n  bus = queue 'Bus'\n  Bus = service 'Other bus'\n  bus -> Bus 'feeds'\n}",
      `views {\n${views}}`,
    ].join("\n"),
    "ignored.txt": "not LikeC4",
    ".hidden/b.c4": "not parsed",
  });
  const { model, warnings } = await importLikeC4(root, {
    id: "bus",
    question: "What carries messages?",
  });
  assert.equal(model.title, "bus");
  assert.equal(model.question, "What carries messages?");
  assert.deepEqual(
    model.components.map(({ id }) => id),
    ["bus", "bus-2"],
  );
  assert.equal(model.kinds.queue.category, "messagebus");
  assert.equal(model.views.length, 5);
  assert.deepEqual(
    warnings.map(({ code }) => code),
    ["likec4_view_limit"],
  );
});

test("workspaces without sources, with errors or too large are refused", async (t) => {
  await assert.rejects(importLikeC4(await workspace(t, { "readme.md": "# none" }), { id: "x" }), {
    code: "likec4_sources_missing",
  });
  await assert.rejects(
    importLikeC4(await workspace(t, { "bad.c4": "model {\n  a = unknownKind 'A'\n}\n" }), {
      id: "x",
    }),
    (error) => error.code === "likec4_invalid" && error.problems[0].path.startsWith("bad.c4:"),
  );
  await assert.rejects(
    importLikeC4(await workspace(t, { "big.c4": `// ${"x".repeat(8 * 1024 * 1024)}\n` }), {
      id: "x",
    }),
    { code: "likec4_too_large" },
  );
});
