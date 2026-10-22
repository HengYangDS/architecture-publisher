import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { sourceReadingFixture, sha } from "./fixtures/source-reading.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import { prepareSourceReader } from "../packages/publisher/renderers/interactive/source-reader.mjs";
import { compose, meaningFor } from "./fixtures/authored-routes.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { inspectRgbaPngCanvas } from "../packages/publisher/src/qualification/static/png.mjs";

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;
const nativeBrowser = { skip: !path.isAbsolute(browserPath ?? ""), timeout: 90_000 };

async function browserPage(t, url) {
  const browser = await browserLifetime(t).acquire(() =>
    chromium.launch({
      executablePath: browserPath,
      headless: true,
      chromiumSandbox: true,
    }),
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [],
    requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    if (route.request().url() === url) return route.continue();
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto(url, { waitUntil: "load" });
  return { page, errors, requests };
}

test(
  "standalone public reading operates native paths, focus, Legend and exact Inspect offline",
  nativeBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-direct-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const file = path.join(root, "architecture.html");
    const rendered = await renderInteractiveEditionHtml(interactiveEditionScene());
    await fs.writeFile(file, rendered.bytes);
    const { page, errors, requests } = await browserPage(t, pathToFileURL(file).href);
    const member = await selectedInteractiveMember(page, "overview");
    const route = await member.evaluate(() => {
      globalThis.Archify.routeProbe.begin({ source: "n-0", focusNode: false });
      globalThis.Archify.routeProbe.choose("n-1");
      return globalThis.Archify.routeProbe.exportSnapshot();
    });
    assert.deepEqual(route.nodeIds, ["n-0", "n-1"]);
    assert.deepEqual(
      route.edges.map(({ id }) => id),
      ["r-0"],
    );
    const reach = await member.evaluate(() => {
      globalThis.Archify.routeProbe.clear();
      globalThis.Archify.focus.set("n-0", { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
      return globalThis.Archify.focus.reachabilitySnapshot();
    });
    assert.deepEqual(reach.nodeIds, ["n-0", "n-1"]);
    await member.evaluate(() => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.semanticLens.toggle();
    });
    assert(await member.locator("#semantic-lens").isVisible());
    await member.locator("#semantic-lens-close").click();
    const node = member.locator('svg [data-node-id="n-0"]');
    await node.focus();
    await node.press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert.match(await page.locator("#interactive-inspect-content").textContent(), /Alpha & one/u);
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await member.evaluate(() =>
        globalThis.document.activeElement.getAttribute("data-inspect-id"),
      ),
      "n-0",
    );
    await page.locator('[data-interactive-page="limit"]').click();
    const limit = await selectedInteractiveMember(page, "limit");
    await limit.locator('[data-text-id="editorial-0"]').focus();
    await limit.locator('[data-text-id="editorial-0"]').press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#interactive-inspect-content").textContent(),
      /editor-attributed-unverified/u,
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "one bidirectional assertion exposes two native traversals without reversing its predicate",
  nativeBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-bidirectional-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const scene = interactiveEditionScene();
    scene.pages = [scene.pages[0]];
    const selected = scene.pages[0];
    selected.nodes.push({ ...selected.nodes[1], id: "secret-gamma", label: "Gamma" });
    selected.relations[0].direction = "bidirectional";
    selected.relations[0].label = "owns";
    selected.relations.push({
      ...selected.relations[0],
      id: "relation:4:3",
      from: { namespace: "private/model", id: "secret-beta" },
      to: { namespace: "private/model", id: "secret-gamma" },
      direction: "forward",
      label: "calls",
    });
    selected.sourceAssertionCarriers[0].nodeRefs.push({
      namespace: "private/model",
      id: "secret-gamma",
    });
    selected.sourceAssertionCarriers[0].relationRefs.push({
      namespace: "private/model",
      reference: "relation:4:3",
      sha256: selected.nodes[0].sha256,
    });
    const before = JSON.stringify(scene);
    const rendered = await renderInteractiveEditionHtml(scene);
    assert.equal(JSON.stringify(scene), before);
    const file = path.join(root, "architecture.html");
    await fs.writeFile(file, rendered.bytes);
    const { page, errors, requests } = await browserPage(t, pathToFileURL(file).href);
    const member = await selectedInteractiveMember(page, "overview");
    const carriers = await member
      .locator("svg [data-edge-from][data-edge-to]")
      .evaluateAll((edges) =>
        edges.map((edge) => ({
          id: edge.getAttribute("data-edge-id"),
          key: edge.getAttribute("data-edge-key"),
          from: edge.getAttribute("data-edge-from"),
          to: edge.getAttribute("data-edge-to"),
          label: edge.getAttribute("data-edge-label"),
          points: edge.getAttribute("d"),
        })),
      );
    assert.equal(carriers.length, 3);
    assert.equal(new Set(carriers.map(({ id }) => id)).size, 3);
    assert.equal(new Set(carriers.map(({ key }) => key)).size, 3);
    const reverse = carriers.find(({ from, to }) => from === "n-1" && to === "n-0");
    assert.match(reverse.label, /Reverse traversal.*Alpha & one.*Beta.*owns/u);
    const route = await member.evaluate(() => {
      globalThis.Archify.routeProbe.begin({ source: "n-1", focusNode: false });
      globalThis.Archify.routeProbe.choose("n-0");
      return globalThis.Archify.routeProbe.exportSnapshot();
    });
    assert.deepEqual(route.nodeIds, ["n-1", "n-0"]);
    assert.equal(route.edges.length, 1);
    assert.equal(route.edges[0].id, reverse.id);
    const reach = await member.evaluate(() => {
      globalThis.Archify.routeProbe.clear();
      globalThis.Archify.focus.set("n-2", { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
      return globalThis.Archify.focus.reachabilitySnapshot();
    });
    assert.equal(reach, null, "a downstream dead end must not acquire a reverse path");
    assert.equal(
      await member
        .locator('svg [data-composition-edge-from="n-0"][data-composition-edge-to="n-1"]')
        .count(),
      1,
    );
    const paint = member.locator(
      'svg [data-composition-edge-from="n-0"][data-composition-edge-to="n-1"]',
    );
    assert(await paint.getAttribute("marker-start"));
    assert(await paint.getAttribute("marker-end"));
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "source reader pins both directions, preserves self loops and replays native addresses",
  nativeBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-source-directions-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const source = {
      namespace: "fixture/native-directions",
      claimant: "example-source-owner",
      sha256: sha("source"),
    };
    const reference = (kind, id) => JSON.stringify([source.namespace, kind, id]);
    const record = (id, from, to, direction) => ({
      id,
      kind: "connection",
      label: id,
      direction,
      from: { namespace: source.namespace, id: from },
      to: { namespace: source.namespace, id: to },
      origin: {
        namespace: source.namespace,
        range: { start: { line: id === "peers" ? 1 : 2, character: 0 } },
      },
    });
    const references = [
      reference("entity", "a"),
      reference("entity", "b"),
      reference("relation", "relation:2:1"),
      reference("relation", "relation:3:1"),
    ];
    const imported = {
      subjectLockSha256: sha("lock"),
      claimModels: [],
      likec4: {
        sources: [source],
        elements: ["a", "b"].map((id) => ({
          namespace: source.namespace,
          id,
          kind: "component",
          label: id.toUpperCase(),
          parent: null,
        })),
        relations: [
          record("peers", "a", "b", "bidirectional"),
          record("self", "b", "b", "bidirectional"),
        ],
      },
    };
    const inputPages = [
      {
        id: "directions",
        label: "Source directions",
        sourceReading: {
          references,
          occurrences: references.map((reference) => ({ reference, graphicIds: ["selected"] })),
        },
      },
    ];
    const before = JSON.stringify(imported);
    const rendered = await prepareSourceReader(imported, inputPages, { component: "lucide:box" });
    assert.equal(JSON.stringify(imported), before);
    const file = path.join(root, "source.html");
    await fs.writeFile(file, rendered.pages[0].content);
    const { page, errors, requests } = await browserPage(t, pathToFileURL(file).href);
    const carriers = await page.locator("svg [data-edge-from][data-edge-to]").evaluateAll((edges) =>
      edges.map((edge) => ({
        id: edge.getAttribute("data-edge-id"),
        key: edge.getAttribute("data-edge-key"),
        from: edge.getAttribute("data-edge-from"),
        to: edge.getAttribute("data-edge-to"),
        reference: edge.getAttribute("data-publication-source-reference"),
      })),
    );
    assert.equal(carriers.length, 3);
    assert.equal(carriers.filter(({ from, to }) => from === to).length, 1);
    const peers = carriers.filter(({ from, to }) => from !== to);
    assert.equal(new Set(peers.map(({ reference }) => reference)).size, 1);
    assert.equal(new Set(peers.map(({ key }) => key)).size, 2);
    await page.evaluate(() => globalThis.Archify.guide.toggle());
    assert.match(await page.locator("#diagram-guide").textContent(), /3 directed traversals/u);
    await page.locator("#diagram-guide-close").click();
    for (const { id } of peers) {
      const pin = await page.evaluate((id) => {
        globalThis.Archify.focus.clear();
        const selected = globalThis.Archify.focus.inspectRelationshipById(id);
        return {
          selected,
          record: globalThis.Archify.focus.relationship(),
          hash: globalThis.location.hash,
        };
      }, id);
      assert.equal(pin.selected, true);
      assert.equal(pin.record.id, id);
      assert.equal(new URLSearchParams(pin.hash.slice(1)).get("relation"), id);
      await page.evaluate(() => globalThis.Archify.focus.clear());
      await page.evaluate((hash) => {
        globalThis.location.hash = hash;
      }, pin.hash);
      await page.waitForFunction((id) => globalThis.Archify.focus.relationship()?.id === id, id, {
        timeout: 5_000,
      });
    }
    await page.evaluate(() => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.focus.set("n-0", { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
    });
    const reach = await page.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot());
    assert.deepEqual(reach.nodeIds, ["n-0", "n-1"]);
    assert.match(await page.locator("#focus-reach-status").textContent(), /directed traversals/u);
    const reachDownload = page.waitForEvent("download", { timeout: 10_000 });
    await page.evaluate(() => globalThis.Archify.exportMenu.downloadReachShareCard());
    const reachPng = inspectRgbaPngCanvas(await fs.readFile(await (await reachDownload).path()));
    assert.equal(reachPng.width, 1200);
    assert.equal(reachPng.height, 630);
    assert(reachPng.inkPixels > 1000);
    assert.deepEqual(
      await page.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot()),
      reach,
    );
    assert.equal(await page.locator("html").getAttribute("data-last-export-variant"), "reach");
    assert.equal(await page.locator("html").getAttribute("data-last-export-canonical"), "false");
    const reverseRoute = await page.evaluate(() => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.routeProbe.begin({ source: "n-1", focusNode: false });
      globalThis.Archify.routeProbe.choose("n-0");
      return globalThis.Archify.routeProbe.exportSnapshot();
    });
    assert.deepEqual(reverseRoute.nodeIds, ["n-1", "n-0"]);
    assert.equal(reverseRoute.edges.length, 1);
    assert.equal(reverseRoute.edges[0].id, peers.find(({ from }) => from === "n-1").id);
    const routeDownload = page.waitForEvent("download", { timeout: 10_000 });
    await page.evaluate(() => globalThis.Archify.exportMenu.downloadRouteShareCard());
    const routePng = inspectRgbaPngCanvas(await fs.readFile(await (await routeDownload).path()));
    assert.equal(routePng.width, 1200);
    assert.equal(routePng.height, 630);
    assert(routePng.inkPixels > 1000);
    assert.deepEqual(
      await page.evaluate(() => globalThis.Archify.routeProbe.exportSnapshot()),
      reverseRoute,
    );
    assert.equal(await page.locator("html").getAttribute("data-last-export-variant"), "route");
    assert.equal(
      await page.locator("html").getAttribute("data-last-export-route-state-clean"),
      "true",
    );
    assert.equal(await page.locator("html").getAttribute("data-last-export-canonical"), "false");
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test("canonical bidirectional traversal reverses every segment of a shared literal route", async () => {
  const input = structuredClone(meaningFor("interactive"));
  for (const selection of input.native.selections)
    for (const relation of selection.members.relations)
      if (relation.id === "request") relation.direction = "bidirectional";
  const fonts = await loadBundledFonts();
  const texts = input.refinement.media.interactive.pages[0].scene.texts;
  const measure = await createBundledTextMeasurer(fonts, texts);
  for (const text of texts) {
    text.box = measure.box(text);
  }
  const before = JSON.stringify(input);
  const page = compose(input, "interactive").pages[0];
  assert.equal(
    page.exploration.relations.find(({ id }) => id === "route-request").direction,
    "bidirectional",
  );
  const { assembleArchitectureScene } =
    await import("../packages/publisher/renderers/archify/index.mjs");
  const result = await assembleArchitectureScene(page.scene, { exploration: page.exploration });
  const html = result.bytes.toString();
  const forward = html.match(
    /<path\b(?=[^>]*data-edge-id="route-request")(?=[^>]*data-logical-relation="true")[^>]*\sd="([^"]+)"/u,
  );
  const reverse = html.match(
    /<path\b(?=[^>]*data-edge-from="server")(?=[^>]*data-edge-to="client")(?=[^>]*data-logical-relation="true")[^>]*\sd="([^"]+)"/u,
  );
  assert.equal(forward?.[1], "M 152 200 L 400 200 L 432 200 L 688 200");
  assert.equal(reverse?.[1], "M 688 200 L 432 200 L 400 200 L 152 200");
  assert.match(
    html,
    /data-source-direction-marker="true"[^>]*marker-start="url\(#arrowhead-start\)"/u,
  );
  assert.equal(JSON.stringify(input), before);
});

test(
  "authored aggregate figures and source exploration retain different honest native graphs",
  nativeBrowser,
  async (t) => {
    const { root } = await sourceReadingFixture(t, { authored: true });
    const input = path.join(root, "build-request.json"),
      output = path.join(root, "candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const { page, errors, requests } = await browserPage(
      t,
      pathToFileURL(path.join(output, "interactive/architecture.html")).href,
    );
    const member = await selectedInteractiveMember(page, "connections");
    assert.equal(
      await member.locator(".diagram-container > svg").getAttribute("data-relationship-queries"),
      "unavailable",
    );
    assert(await member.locator(".publication-query-limit").isVisible());
    const occurrence = member.locator('[data-inspect-id="b"][tabindex]').first();
    await occurrence.focus();
    await occurrence.press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    const declaration = page
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .first();
    await declaration.locator(":scope > summary").click();
    const disclosure = declaration.locator(".inspect-source-diagram");
    await disclosure.locator(":scope > summary").click();
    const source = disclosure.frameLocator("iframe");
    await source.locator("svg [data-node-id]").first().waitFor();
    assert.equal(await source.locator(".diagram-container > svg [data-node-id]").count(), 4);
    assert.equal(
      await source
        .locator(".diagram-container > svg [data-logical-relation][data-edge-from]")
        .count(),
      2,
    );
    assert.equal(
      await source.locator(".diagram-container > svg").getAttribute("data-relationship-queries"),
      "complete",
    );
    await declaration.locator(":scope > summary").click();
    await disclosure.locator("iframe").waitFor({ state: "detached" });
    await declaration.locator(":scope > summary").click();
    await disclosure.locator(":scope > summary").click();
    await source.locator("svg [data-node-id]").first().waitFor();
    const reference = await disclosure.getAttribute("data-source-reference");
    const setSourceAddress = async (state) =>
      page.evaluate(
        ({ reference, state }) => {
          const data = JSON.parse(
            globalThis.document.getElementById("architecture-interactive-data").textContent,
          );
          globalThis.location.hash = new URLSearchParams({
            page: "connections",
            inspect: "b",
            source: reference,
            edition: data.build.editionSha256,
            meaning: data.build.semanticDigest,
            sourceReader: state,
          }).toString();
        },
        { reference, state },
      );
    await setSourceAddress("focus=n-0");
    await source.locator('svg [data-node-id="n-0"][data-focus-selected]').waitFor();
    await setSourceAddress("focus=n-3");
    await source.locator('svg [data-node-id="n-3"][data-focus-selected]').waitFor();
    assert.equal(await page.locator(".inspect-source-diagram iframe").count(), 1);
    const opaque = "focus=n-0</script><script>globalThis.injectedSourceState=true</script>";
    await setSourceAddress(opaque);
    await source.locator("html").waitFor();
    const address = await source.locator("html").evaluate(() => ({
      state: globalThis.location.hash.slice(1),
      injected: globalThis.injectedSourceState === true,
    }));
    assert.equal(address.injected, false);
    assert.equal(decodeURIComponent(address.state), opaque);
    await page.evaluate(() => {
      const hash = new URLSearchParams(globalThis.location.hash.slice(1));
      hash.delete("sourceReader");
      globalThis.location.hash = hash.toString();
    });
    await disclosure.locator("iframe").waitFor({ state: "detached" });
    await disclosure.locator(":scope > summary").click();
    await source.locator("svg [data-node-id]").first().waitFor();
    await page.locator("#interactive-inspect-back").click();
    assert.equal(await page.locator(".inspect-source-diagram iframe").count(), 0);
    assert.equal(
      await member.evaluate(() =>
        globalThis.document.activeElement.getAttribute("data-inspect-id"),
      ),
      "b",
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);
