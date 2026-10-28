import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { importLikeC4 } from "../packages/publisher/src/importers/likec4.mjs";
import { verifySupply } from "../packages/publisher/src/supply.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";

const SHOP = fileURLToPath(new URL("./fixtures/likec4/shop/", import.meta.url));
const WORKER = fileURLToPath(
  new URL("../packages/publisher/src/importers/likec4-worker.mjs", import.meta.url),
);

async function workspace(t, files) {
  const root = await temporaryDirectory("archpub-likec4-");
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), text);
  }
  return root;
}

/**
 * The parser worker's reply to one message. The importer runs the worker under the Permission
 * Model, which keeps a child from writing coverage, so this runs it as a plain child.
 */
async function ask(input) {
  const { root } = await verifySupply("likec4");
  const child = spawnSync(process.execPath, [WORKER], {
    cwd: root,
    input,
    encoding: "utf8",
    timeout: 60_000,
  });
  return { exit: child.status, reply: JSON.parse(child.stdout.trim().split("\n").at(-1) ?? "") };
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
  // One view more than a page holds.
  const views = Array.from(
    { length: 5 },
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
  assert.equal(model.views.length, 4);
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

test("the parser worker answers one message with the model, its errors or its failure", async () => {
  const model = [
    "specification {",
    "  element actor",
    "  element service",
    "}",
    "model {",
    "  customer = actor 'Customer'",
    "  shop = service 'Shop' {",
    "    api = service 'API' 'Takes orders' {",
    "      technology 'Node'",
    "    }",
    "  }",
    "  customer -> shop.api 'orders'",
    "}",
    "views {",
    "  view index {",
    "    title 'Overview'",
    "    include *",
    "  }",
    "}",
    "",
  ].join("\n");
  const at = (line) => ({ file: "model.c4", line });
  const element = (id, kind, title, parent, line, technology = null, description = null) => ({
    id,
    kind,
    title,
    technology,
    description,
    parent,
    location: at(line),
  });
  assert.deepEqual(await ask(JSON.stringify({ files: { "model.c4": model } })), {
    exit: 0,
    reply: {
      status: "ok",
      elements: [
        element("customer", "actor", "Customer", null, 6),
        element("shop", "service", "Shop", null, 7),
        element("shop.api", "service", "API", "shop", 8, "Node", "Takes orders"),
      ],
      relations: [
        {
          source: "customer",
          target: "shop.api",
          title: "orders",
          technology: null,
          bidirectional: false,
          location: at(12),
        },
      ],
      views: [
        {
          id: "index",
          type: "element",
          title: "Overview",
          generated: false,
          elements: ["customer", "shop"],
          location: at(15),
        },
      ],
    },
  });
  const invalid = await ask(JSON.stringify({ files: { "bad.c4": "model {\n  a = \n}\n" } }));
  assert.equal(invalid.exit, 0);
  assert.equal(invalid.reply.status, "invalid");
  assert.deepEqual(
    invalid.reply.errors.map(({ file, line }) => [file, line]),
    [["bad.c4", 3]],
  );
  const failed = await ask("not a message");
  assert.equal(failed.exit, 1);
  assert.equal(failed.reply.status, "failed");
  assert.match(failed.reply.message, /JSON/u);
});
