import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("relocated offline public build preserves independent owned-text media and refuses invalid ownership", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-owner-installed-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const consumer = path.join(root, "consumer");
  const home = path.join(root, "home");
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  const user = path.join(root, "user.npmrc");
  const global = path.join(root, "global.npmrc");
  await fs.writeFile(user, "");
  await fs.writeFile(global, "");
  const setup = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: user,
    npm_config_globalconfig: global,
    npm_config_cache: path.join(root, "cache"),
    npm_config_offline: "true",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
  };
  const invoke = (command, args, cwd, env) => {
    const result = spawnNativeSync(command, args, {
      cwd,
      env,
      timeout: 120000,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  const packed = parseNpmPackRecord(
    invoke(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", root],
      fileURLToPath(new URL("../packages/publisher/", import.meta.url)),
      setup,
    ),
  );
  invoke(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(root, packed.filename),
    ],
    consumer,
    setup,
  );
  const input = path.join(consumer, "input");
  await fs.mkdir(path.join(input, "edition"), { recursive: true });
  await fs.mkdir(path.join(input, "sources"));
  const model = claimModel();
  const bytes = Buffer.from(JSON.stringify(model));
  await fs.writeFile(path.join(input, "sources/model.json"), bytes);
  const reference = JSON.stringify(["example/owner", "entity", "client"]);
  const sceneFor = (medium) => {
    const x = medium === "static" ? 180 : 280;
    const y = medium === "static" ? 180 : 140;
    const shared = {
      title: "Source client",
      subtitle: "Independent media, explicit label allocation",
      nodes: [
        {
          id: "client",
          ...(medium === "static"
            ? { box: { x, y, width: 300, height: 100 } }
            : { position: { x, y }, size: { width: 300, height: 100 } }),
          semanticIds: [reference],
          primitives: [
            {
              kind: "rect",
              box: { x: 0, y: 0, width: 300, height: 100 },
              fill: "paper",
              stroke: "ink",
              strokeWidth: 1.2,
            },
          ],
        },
      ],
      texts: [
        {
          id: "label",
          text: "Source client",
          owner: "client",
          x: x + 20,
          baseline: y + 46,
          fontSize: 14,
          weight: "400",
          anchor: "start",
          tone: "ink",
          visible: true,
          semanticIds: [reference],
          box: { x: x + 20, y: y + 32, width: 110, height: 14 },
        },
      ],
      edges: [],
      requiredSemanticIds: [reference],
    };
    return medium === "static"
      ? {
          ...shared,
          schema: "architecture.authored-static-scene/v1",
          width: 900,
          height: 460,
          referenceWidth: 900,
          spine: [],
          decorations: [],
          paint: { paper: "#f3f0e8", ink: "#26362f" },
        }
      : {
          ...shared,
          schema: "architecture.interactive-scene/v1",
          id: "overview",
          viewport: { width: 900, height: 460 },
          groups: [],
        };
  };
  const staticScene = sceneFor("static");
  const interactiveScene = sceneFor("interactive");
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...staticScene.texts,
    ...interactiveScene.texts,
  ]);
  for (const scene of [staticScene, interactiveScene])
    for (const label of scene.texts) label.box = measurer.box(label);
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: { kind: "authored-canvas", scene: staticScene },
      interactive: {
        kind: "authored-architecture",
        pages: [
          {
            id: "overview",
            label: "Independent media, explicit label allocation",
            purpose: "overview",
            scene: interactiveScene,
          },
        ],
      },
    },
  };
  const project = {
    schema: "architecture.edition-project/v1",
    id: "owner-reading",
    editor: "example:editor",
    title: "Source client",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "Which client is represented?" }],
    scope: {
      sourceNamespaces: ["example/owner"],
      selections: [
        {
          id: "client",
          namespace: "example/owner",
          kind: "reference",
          reference: "entity:client",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "One explicit source component, independent media." },
    presentation: {
      static: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "Read the client.",
        width: 1800,
      },
      interactive: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "Inspect the client.",
      },
    },
    visualPolicy: { profile: "neutral", override: "refinement.json" },
  };
  await fs.writeFile(path.join(input, "edition/project.json"), JSON.stringify(project));
  const refinementFile = path.join(input, "edition/refinement.json");
  await fs.writeFile(refinementFile, JSON.stringify(refinement));
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "model",
        namespace: "example/owner",
        format: { id: "architecture.claim-model", version: "2" },
        claimant: model.owner,
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "pin", path: "sources/model.json", sha256: sha(bytes) },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  const requestPath = path.join(input, "request.json");
  const requestBytes = Buffer.from(JSON.stringify(request));
  await fs.writeFile(requestPath, requestBytes);
  const env = {
    HOME: home,
    PATH: "",
    NODE_PATH: "",
    NODE_OPTIONS: "",
    LANG: "C.UTF-8",
    ...(process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}),
    ...(process.platform === "win32" && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const cli = path.join(consumer, "node_modules/architecture-publisher/src/cli/main.mjs");
  const output = path.join(consumer, "candidate");
  const args = ["edition", "build", requestPath, "--sha256", sha(requestBytes), "--output", output];
  invoke(process.execPath, [cli, ...args], consumer, env);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json"), "utf8"));
  assert.ok(candidate.media.static);
  assert.ok(candidate.media.interactive);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = await fs.readFile(path.join(output, "interactive/architecture.html"));
  assert.match(svg, /data-graphic-id="text:label"/u);
  assert.match(svg, /x="200"/u);
  const data = JSON.parse(
    html
      .toString()
      .match(
        /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
      )[1],
  );
  const paintedPage = data.pages.overview.pieces
    .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
    .join("");
  assert.match(paintedPage, /data-text-id="label"/u);
  assert.match(paintedPage, /x="300"/u);
  if (process.env.ARCHPUB_BROWSER_EXECUTABLE) {
    const lifetime = browserLifetime(t);
    const server = http.createServer((_request, response) =>
      response.writeHead(200, { "Content-Type": "text/html" }).end(html),
    );
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    lifetime.use(server);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    lifetime.use(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "load" });
    const label = page.frameLocator("#interactive-frame").locator('[data-inspect-id="label"]');
    await label.waitFor();
    const paint = await label.evaluate(async (node) => {
      await node.ownerDocument.fonts.ready;
      const b = node.getBBox();
      return {
        text: node.textContent,
        x: b.x,
        y: b.y,
        right: b.x + b.width,
        bottom: b.y + b.height,
      };
    });
    assert.equal(paint.text, "Source client");
    assert.ok(paint.x >= 288 && paint.y >= 148 && paint.right <= 572 && paint.bottom <= 232);
    assert.deepEqual(errors, []);
  }
  refinement.media.interactive.pages[0].scene.texts[0].owner = "missing";
  await fs.writeFile(refinementFile, JSON.stringify(refinement));
  const rejected = spawnNativeSync(
    process.execPath,
    [cli, ...args.slice(0, -1), path.join(consumer, "invalid")],
    {
      cwd: consumer,
      env,
      timeout: 120000,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    },
  );
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stdout + rejected.stderr, /authored_text_owner_invalid/u);
  await assert.rejects(fs.stat(path.join(consumer, "invalid")), { code: "ENOENT" });
});
