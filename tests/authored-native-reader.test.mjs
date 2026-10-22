import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { meaningFor, sceneFor, compose, ref } from "./fixtures/authored-routes.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { editionFixture } from "./fixtures/edition.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";
import { semanticArchitectureProjections } from "../packages/publisher/src/scene/contract.mjs";
import { interactiveArchitectureScene } from "../packages/publisher/src/scene/interactive/architecture.mjs";
import { createHash } from "node:crypto";
import { sourceReadingFixture, sha, sourceReference } from "./fixtures/source-reading.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { pathToFileURL } from "node:url";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;

const runBrowser = { skip: !path.isAbsolute(browserPath ?? "") };

test("architecture assembly preserves the complete official executable runtime", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-original-reader-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const manifest = JSON.parse(
    await fs.readFile(
      new URL("../packages/publisher/renderers/archify/supply/supply.json", import.meta.url),
    ),
  );
  const entries = manifest.files
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))
    .sort(({ path: left }, { path: right }) => left.localeCompare(right));
  const originalDigest = createHash("sha256").update(JSON.stringify(entries)).digest("hex");
  const { model, edition } = editionFixture();
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
  const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
  for (const node of scene.nodes) {
    node.figureKind = "component";
    node.icon = "lucide:box";
  }
  for (const edge of scene.edges) edge.semanticIds = [ref("relation", edge.id)];
  const exploration = {
    nodes: scene.nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
    relations: scene.edges.map(({ id, from, to }) => ({
      id,
      reference: ref("relation", id),
      from,
      to,
      label: model.relations[id].type,
      edgeId: id,
    })),
    limits: [],
  };
  const output = path.join(root, "architecture.html");
  const result = await renderArchitectureScene({ scene, exploration, output });
  assert.equal(result.supplies.find(({ id }) => id === "runtime").sha256, originalDigest);
  const template = await fs.readFile(
    new URL("../packages/publisher/renderers/archify/supply/assets/template.html", import.meta.url),
    "utf8",
  );
  const html = await fs.readFile(output, "utf8");
  const executable = (value) =>
    [...value.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attrs]) => !/type="application\/json"/u.test(attrs))
      .map(([, , source]) => source);
  assert.deepEqual(executable(html), executable(template));
  assert.equal(result.nativeValidation.checksPassed, 9);
  assert(html.includes('data-logical-relation="true"'));
  assert(!html.includes("publicationTypeIcon("));
});

test("architecture assembly refuses exploration that is not bound to the exact scene", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-graph-binding-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const { model, edition } = editionFixture();
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
  const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
  for (const node of scene.nodes) {
    node.figureKind = "component";
    node.icon = "lucide:box";
  }
  for (const edge of scene.edges) edge.semanticIds = [ref("relation", edge.id)];
  const exploration = {
    nodes: scene.nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
    relations: scene.edges.map(({ id, from, to }) => ({
      id,
      reference: ref("relation", id),
      from,
      to,
      label: model.relations[id].type,
      edgeId: id,
    })),
    limits: [],
  };
  exploration.nodes[0].id = "unbound-source";
  const output = path.join(root, "invalid.html");
  await assert.rejects(renderArchitectureScene({ scene, exploration, output }), {
    code: "render_exploration_invalid",
  });
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});

test("native reader translations retain the declared count placeholders", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-wording-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const { model, edition } = editionFixture();
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
  const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
  for (const node of scene.nodes) {
    node.figureKind = "component";
    node.icon = "lucide:box";
  }
  for (const edge of scene.edges) edge.semanticIds = [ref("relation", edge.id)];
  const exploration = {
    nodes: scene.nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
    relations: scene.edges.map(({ id, from, to }) => ({
      id,
      reference: ref("relation", id),
      from,
      to,
      label: model.relations[id].type,
      edgeId: id,
    })),
    limits: [],
  };
  const output = path.join(root, "architecture.html");
  const receipt = await renderArchitectureScene({
    scene,
    exploration,
    output,
  });
  const html = await fs.readFile(output, "utf8");
  const { messages } = JSON.parse(
    html.match(/<script\b[^>]*\bid="archify-i18n-data"[^>]*>([\s\S]*?)<\/script>/u)[1],
  );
  assert.equal(messages["viewer.lens.legend.inspect.one"], "Inspect {label}, {count} figure");
  assert.equal(messages["viewer.lens.legend.inspect.other"], "Inspect {label}, {count} figures");
  assert.equal(receipt.nativeValidation.warnings, 0);
});

test(
  "typed native figures refuse neutral fallback and suppression before rendering",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-icon-default-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const { model, edition } = editionFixture();
    const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
    const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
    for (const [index, node] of scene.nodes.entries()) {
      node.figureKind = index === 2 ? "backend" : "none";
      if (index === 1) node.icon = "none";
    }
    for (const edge of scene.edges) edge.semanticIds = [ref("relation", edge.id)];
    const exploration = {
      nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
      relations: scene.edges.map(({ id, from, to }) => ({
        id,
        reference: ref("relation", id),
        from,
        to,
        label: model.relations[id].type,
        edgeId: id,
      })),
      limits: [],
    };
    const output = path.join(root, "architecture.html");
    await assert.rejects(renderArchitectureScene({ scene, exploration, output }), {
      code: "figure_type_glyph_unsupported",
    });
    await assert.rejects(fs.stat(output), { code: "ENOENT" });
  },
);

test("checked source relations remain logical edges when their physical segments are shared", () => {
  const page = compose(meaningFor("interactive"), "interactive").pages[0];
  assert.deepEqual(page.exploration.nodes, [
    { id: "client", label: "client", kind: "component" },
    { id: "server", label: "server", kind: "component" },
  ]);
  assert.deepEqual(page.exploration.relations, [
    {
      id: "route-request",
      reference: ref("relation", "request"),
      from: "client",
      to: "server",
      label: "calls",
      direction: "forward",
      routeId: "route-request",
    },
    {
      id: "route-telemetry",
      reference: ref("relation", "telemetry"),
      from: "client",
      to: "server",
      label: "calls",
      direction: "forward",
      routeId: "route-telemetry",
    },
  ]);
  assert.deepEqual(page.exploration.limits, []);
});

test("repeated source occurrences declare a query limit instead of choosing an arbitrary endpoint", () => {
  const meaning = meaningFor("interactive");
  const scene = sceneFor(meaning, "interactive");
  scene.nodes.push({
    ...structuredClone(scene.nodes[0]),
    id: "client-copy",
    position: { x: 128, y: 280 },
  });
  const page = compose(meaning, "interactive").pages[0];
  assert.deepEqual(page.exploration.limits, ["nonbijective-source-membership"]);
  assert.deepEqual(page.exploration.relations, []);
  assert.equal(page.carriers[0].graphicIds.includes("client-copy"), true);
});

test("homogeneous aggregate occurrences retain their declared source type", () => {
  const meaning = meaningFor("interactive");
  sceneFor(meaning, "interactive").nodes[0].semanticIds.push(ref("entity", "server"));
  const page = compose(meaning, "interactive").pages[0];
  assert.equal(page.exploration.nodes.find(({ id }) => id === "client").kind, "component");
  assert.deepEqual(page.exploration.relations, []);
  assert.deepEqual(page.exploration.limits, ["nonbijective-source-membership"]);
});

test("authored figure roles preserve mixed source kinds, labels and exact Inspect facts", () => {
  const source = claimModel();
  source.vocabulary.entities.push("database");
  source.entities.server.type = "database";
  const meaning = meaningFor("interactive", false, source);
  const scene = sceneFor(meaning, "interactive");
  const original = scene.nodes[0];
  scene.nodes[0] = {
    id: original.id,
    label: "Source pair",
    figureKind: "source",
    visualRole: "frontend",
    position: original.position,
    size: original.size,
    semanticIds: [ref("entity", "client"), ref("entity", "server")],
  };
  meaning.editorial.visualPolicy = { profile: "neutral", figureTypes: { source: "lucide:files" } };
  const page = compose(meaning, "interactive").pages[0];
  assert.deepEqual(
    page.exploration.nodes.find(({ id }) => id === "client"),
    {
      id: "client",
      label: "Source pair",
      kind: "source",
    },
  );
  assert.deepEqual(page.exploration.limits, ["nonbijective-source-membership"]);
  assert.deepEqual(page.exploration.relations, []);
  const kinds = page.facts
    .filter(
      ({ graphicId, reference }) =>
        graphicId === "client" &&
        [ref("entity", "client"), ref("entity", "server")].includes(reference),
    )
    .map(({ facts }) => facts.find(({ label }) => label === "Entity kind").value);
  assert.deepEqual(kinds, ["component", "database"]);
});

test(
  "aggregate and repeated figures retain exact source reading through the public build",
  runBrowser,
  async (t) => {
    const { root } = await sourceReadingFixture(t, { repeatMember: true });
    const request = path.join(root, "build-request.json");
    const output = path.join(root, "candidate");
    await compileEditionCandidateInput(request, sha(await fs.readFile(request)), output);
    const file = path.join(output, "interactive/architecture.html");
    const html = await fs.readFile(file, "utf8");
    const payload = JSON.parse(
      html.match(
        /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
      )[1],
    );
    const occurrences = payload.sourceReading.projection.pages[0].occurrences;
    assert.deepEqual(occurrences, [
      { reference: sourceReference("alpha", "entity", "a"), graphicIds: ["a", "a-copy"] },
      { reference: sourceReference("alpha", "entity", "b"), graphicIds: ["b"] },
      { reference: sourceReference("alpha", "relation", "r"), graphicIds: ["alpha-call"] },
      { reference: sourceReference("beta", "entity", "b"), graphicIds: ["b"] },
      { reference: sourceReference("beta", "entity", "c"), graphicIds: ["c"] },
      { reference: sourceReference("beta", "relation", "r"), graphicIds: ["beta-call"] },
    ]);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    const requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      globalThis.readerDisclosureEvents = [];
      globalThis.document.addEventListener(
        "toggle",
        (event) => {
          if (!event.target.matches(".inspect-source-diagram")) return;
          globalThis.readerDisclosureEvents.push({
            open: event.target.open,
            connected: event.target.isConnected,
            graphicId: event.target.dataset.sourceGraphic,
          });
        },
        true,
      );
    });
    const url = pathToFileURL(file).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(url, { waitUntil: "load" });
    const member = page.frameLocator("#interactive-frame");
    for (const id of ["a", "a-copy", "b"]) {
      const figure = member.locator(`[data-inspect-id="${id}"][tabindex]`).first();
      await figure.press("i");
      await page.locator("#interactive-inspector").waitFor({ state: "visible" });
      const declarations = page.locator(
        '#interactive-inspect-content [data-reference-kind="entity"] > details',
      );
      assert.equal(
        await declarations.count(),
        id === "b" ? 2 : 1,
        JSON.stringify({
          requested: id,
          title: await page.locator("#interactive-inspect-title").textContent(),
          declarations: await declarations.allTextContents(),
        }),
      );
      assert.match(await declarations.first().textContent(), /alpha-owner/u);
      if (id === "b") assert.match(await declarations.nth(1).textContent(), /beta-owner/u);
      const record = declarations.first();
      if (!(await record.evaluate((element) => element.open)))
        await record.locator(":scope > summary").click();
      await record.locator(".inspect-source-diagram > summary").click();
      const reading = record.locator(".inspect-source-diagram").frameLocator("iframe");
      await reading.locator("svg [data-node-id]").first().waitFor({ timeout: 8_000 });
      assert.equal(await reading.locator(".diagram-container > svg [data-node-id]").count(), 4);
      assert.equal(
        await reading
          .locator(".diagram-container > svg [data-logical-relation][data-edge-from]")
          .count(),
        2,
      );
      assert.equal(
        await reading.locator(".diagram-container > svg").getAttribute("data-relationship-queries"),
        "complete",
      );
      await page.locator("#interactive-inspect-back").click();
      const restored = await selectedInteractiveMember(page, "connections");
      await restored.waitForFunction(
        (id) => globalThis.document.activeElement?.getAttribute("data-inspect-id") === id,
        id,
        { timeout: 5_000 },
      );
    }
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test("a raw physical route is not admitted to native graph queries without checked source bindings", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-raw-route-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = structuredClone(compose(meaningFor("interactive"), "interactive").pages[0].scene);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.doesNotMatch(html, /<path\b[^>]*data-edge-(?:from|to)="junction"/);
  assert.match(html, /data-literal-segment-id="bridge"/);
});

test("limited native reader wording cannot leak into a complete relationship publication", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-locale-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const [index, limited] of [false, true, false].entries()) {
    const meaning = meaningFor("interactive");
    const raw = sceneFor(meaning, "interactive");
    if (limited)
      raw.nodes.push({
        ...structuredClone(raw.nodes[0]),
        id: "client-copy",
        position: { x: 128, y: 280 },
      });
    const measurer = await createBundledTextMeasurer(await loadBundledFonts(), raw.texts);
    raw.texts = raw.texts.map((label) => ({ ...label, box: measurer.box(label) }));
    const composed = compose(meaning, "interactive").pages[0];
    const output = path.join(root, `publication-${index}.html`);
    await renderArchitectureScene({
      scene: composed.scene,
      ...(limited ? { interaction: "presentation" } : {}),
      exploration: composed.exploration,
      output,
    });
    const html = await fs.readFile(output, "utf8");
    if (limited) {
      assert.doesNotMatch(html, /<script\b/iu);
      assert.match(html, /publication-reader" content="presentation\/v1/u);
      continue;
    }
    const { messages } = JSON.parse(
      html.match(/<script\b[^>]*\bid="archify-i18n-data"[^>]*>([\s\S]*?)<\/script>/u)[1],
    );
    assert.equal(
      messages["viewer.passport.relationship.summary"],
      "{out} outgoing · {in} incoming{loops}",
    );
    assert.doesNotMatch(messages["viewer.guide.facts"], /unavailable/i);
  }
});
