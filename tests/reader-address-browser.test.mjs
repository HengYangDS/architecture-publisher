import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { browserOptions, runBrowser, authoredHtml } from "./fixtures/reader-appearance.mjs";
import { sourceReadingFixture, sha } from "./fixtures/source-reading.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

test(
  "a public native relationship link restores its exact source and repeated graphic occurrence",
  { ...runBrowser, timeout: 90_000 },
  async (t) => {
    const { root } = await sourceReadingFixture(t, { repeatMember: true });
    const request = path.join(root, "build-request.json");
    const candidate = path.join(root, "candidate");
    await compileEditionCandidateInput(request, sha(await fs.readFile(request)), candidate);
    const browser = await browserLifetime(t).acquire(() => chromium.launch(browserOptions));
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [],
      requests = [];
    context.on("page", (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) errors.push(message.text());
      });
    });
    const url = pathToFileURL(path.join(candidate, "interactive/architecture.html")).href;
    await context.route("**/*", async (route) => {
      const target = new URL(route.request().url());
      target.search = "";
      target.hash = "";
      if (target.href === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    const page = await context.newPage();
    await page.goto(url + "#page=connections", { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "connections");
    await member.locator('[data-inspect-id="a-copy"][tabindex]').press("i");
    const declaration = page
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .first();
    if (!(await declaration.evaluate((element) => element.open)))
      await declaration.locator(":scope > summary").click();
    await declaration.locator(".inspect-source-diagram > summary").click();
    const sourceFrame = async (target) => {
      const element = await target.locator("[data-source-reader-root] > iframe").elementHandle();
      assert(element, "the selected source reader exists");
      try {
        const frame = await element.contentFrame();
        assert(frame, "the selected source reader has a document");
        await frame.waitForFunction(() => !!globalThis.Archify?.focus);
        return frame;
      } finally {
        await element.dispose();
      }
    };
    const references = [
      ["alpha", "entity", "a"],
      ["alpha", "entity", "b"],
      ["beta", "entity", "b"],
      ["beta", "entity", "c"],
    ].map((reference) => JSON.stringify(reference));
    const alpha = references[0];
    const assertSelectedSource = async (frame) => {
      const selected = await frame
        .locator("svg g[data-node-id]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-publication-source-reference")),
        );
      assert.deepEqual(selected.slice().sort(), references.slice().sort());
      assert.equal(await frame.locator('svg [data-node-label="Global only"]').count(), 0);
    };
    const copyNative = async (frame) => {
      const result = await frame.evaluate(async () => {
        let value;
        globalThis.document.execCommand = (command) => {
          if (command !== "copy") return false;
          value = globalThis.document.querySelector("textarea[readonly]")?.value;
          return true;
        };
        return { copied: await globalThis.Archify.focus.copyLink(), value };
      });
      assert.equal(result.copied, true);
      return result.value;
    };
    let native = await sourceFrame(page);
    await assertSelectedSource(native);
    const ids = await native
      .locator("svg g[data-node-id]")
      .evaluateAll((nodes) =>
        Object.fromEntries(
          nodes.map((node) => [
            node.getAttribute("data-publication-source-reference"),
            node.dataset.nodeId,
          ]),
        ),
      );
    await native.evaluate((id) => {
      globalThis.Archify.focus.set(id, { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
    }, ids[alpha]);
    const closure = await native.evaluate(() => {
      const snapshot = globalThis.Archify.focus.reachabilitySnapshot();
      return snapshot.nodeIds.map((id) =>
        globalThis.document
          .querySelector(`svg g[data-node-id="${id}"]`)
          .getAttribute("data-publication-source-reference"),
      );
    });
    assert.deepEqual(closure, references.slice(0, 2), "aggregate artwork cannot join source paths");
    const copied = await copyNative(native);
    const address = new URL(copied);
    const hash = new URLSearchParams(address.hash.slice(1));
    assert.equal(hash.get("page"), "connections");
    assert.equal(hash.get("inspect"), "a-copy");
    assert.equal(hash.get("source"), alpha);
    assert.equal(hash.get("sourceReader"), `focus=${ids[alpha]}&reach=downstream`);
    assert.equal(address.href.startsWith("about:srcdoc"), false);
    const restored = await context.newPage();
    await restored.goto(copied, { waitUntil: "load" });
    await restored.locator("#interactive-inspector").waitFor({ state: "visible", timeout: 8_000 });
    native = await sourceFrame(restored);
    await assertSelectedSource(native);
    await native.waitForFunction((id) => globalThis.Archify.focus.active() === id, ids[alpha]);
    assert.deepEqual(
      await native.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot().nodeIds),
      references.slice(0, 2).map((reference) => ids[reference]),
    );
    const beta = ids[references[1]];
    await native.locator(`svg g[data-node-id="${beta}"]`).press("Enter");
    await native.waitForFunction((id) => globalThis.Archify.focus.active() === id, beta);
    const nextUrl = await copyNative(native);
    const nextHash = new URLSearchParams(new URL(nextUrl).hash.slice(1));
    assert.equal(
      nextHash.get("source"),
      alpha,
      "native focus does not change declaration ownership",
    );
    assert.equal(nextHash.get("inspect"), "a-copy");
    assert.equal(nextHash.get("sourceReader"), `focus=${beta}`);
    await restored.goto(nextUrl, { waitUntil: "load" });
    native = await sourceFrame(restored);
    await native.waitForFunction((id) => globalThis.Archify.focus.active() === id, beta);
    const historyLength = await restored.evaluate(() => globalThis.history.length);
    await restored.evaluate(() => globalThis.window.__architectureInteractive.navigate("release"));
    await selectedInteractiveMember(restored, "release");
    assert.equal(
      new URLSearchParams(new URL(restored.url()).hash.slice(1)).has("sourceReader"),
      false,
    );
    assert.equal(await restored.locator("#interactive-inspector").isVisible(), false);
    assert.equal(await restored.evaluate(() => globalThis.history.length), historyLength + 1);
    await restored.goBack();
    assert.equal(
      new URLSearchParams(new URL(restored.url()).hash.slice(1)).get("sourceReader"),
      `focus=${beta}`,
      "disposing the outgoing reader must not erase the restored history entry",
    );
    native = await sourceFrame(restored);
    await native.waitForFunction((id) => globalThis.Archify.focus.active() === id, beta);
    await restored.goForward();
    await selectedInteractiveMember(restored, "release");
    assert.equal(await restored.locator("#interactive-inspector").isVisible(), false);
    await restored.goBack();
    await sourceFrame(restored);
    await restored.reload({ waitUntil: "load" });
    native = await sourceFrame(restored);
    await native.waitForFunction((id) => globalThis.Archify.focus.active() === id, beta);
    await native.locator("#btn-focus-copy").press("Escape");
    await native.waitForFunction(() => globalThis.Archify.focus.active() === null);
    await restored.locator("#interactive-inspect-back").click();
    const original = await selectedInteractiveMember(restored, "connections");
    await original.waitForFunction(
      () => globalThis.document.activeElement?.getAttribute("data-inspect-id") === "a-copy",
    );
    assert.equal(
      new URLSearchParams(new URL(restored.url()).hash.slice(1)).has("sourceReader"),
      false,
    );
    assert.equal(new URLSearchParams(new URL(restored.url()).hash.slice(1)).has("inspect"), false);
    for (const [key, value] of [
      ["edition", "0".repeat(64)],
      ["meaning", "0".repeat(64)],
      ["source", JSON.stringify(["beta", "entity", "unselected"])],
      ["inspect", "missing-occurrence"],
      ["page", "missing-page"],
      ["sourceReader", ""],
      ["sourceReader", "x".repeat(2049)],
    ]) {
      const invalid = new URL(copied);
      const invalidHash = new URLSearchParams(invalid.hash.slice(1));
      invalidHash.set(key, value);
      invalid.hash = invalidHash.toString();
      await restored.goto(invalid.href, { waitUntil: "load" });
      await selectedInteractiveMember(restored, "connections");
      assert.equal(
        await restored.locator("#interactive-inspector").isVisible(),
        false,
        `${key} must not restore a different or unavailable source state`,
      );
    }
    const unknown = new URL(copied);
    const unknownHash = new URLSearchParams(unknown.hash.slice(1));
    unknownHash.set("sourceReader", "focus=unselected-subject");
    unknown.hash = unknownHash.toString();
    await restored.goto(unknown.href, { waitUntil: "load" });
    native = await sourceFrame(restored);
    assert.equal(await native.evaluate(() => globalThis.Archify.focus.active()), null);
    await assertSelectedSource(native);
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "native reading remains truthful, addressable and operable through publication",
  runBrowser,
  async (t) => {
    const exact = await authoredHtml(t);
    const repeated = await sourceReadingFixture(t, { repeatMember: true });
    const request = path.join(repeated.root, "build-request.json");
    const candidate = path.join(repeated.root, "candidate");
    await compileEditionCandidateInput(request, sha(await fs.readFile(request)), candidate);
    const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-reading-")));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const file = path.join(root, "architecture.html");
    await fs.writeFile(file, exact);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
    const frame = page.frames().find((value) => value !== page.mainFrame());
    await frame.waitForFunction(() => !!globalThis.Archify?.routeProbe);
    await frame.evaluate(() => {
      globalThis.Archify.focus.set("client", { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
    });
    await frame.locator("#btn-export").click();
    assert.equal(await frame.locator('[data-action="reach-share-card"]').isEnabled(), true);
    const downloaded = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
    await frame.locator('[data-action="reach-share-card"]').click();
    const asset = await downloaded;
    assert.ok(asset);
    const bytes = await fs.readFile(await asset.path());
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 630);
    const addressed = await frame.evaluate(async () => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.routeProbe.begin({
        source: "client",
        focusNode: false,
      });
      globalThis.Archify.routeProbe.choose("server");
      let copied;
      globalThis.document.execCommand = (command) => {
        if (command !== "copy") return false;
        copied = globalThis.document.querySelector("textarea[readonly]")?.value;
        return true;
      };
      return { passed: await globalThis.Archify.routeProbe.copyLink(), copied };
    });
    assert.equal(addressed.passed, true);
    assert.equal(addressed.copied.startsWith("about:srcdoc"), false);
    const parameters = new URLSearchParams(new URL(addressed.copied).hash.slice(1));
    assert.equal(parameters.get("page"), "overview");
    assert.equal(parameters.get("reader"), "route=client~server");
    await page.close();
    const limitedPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    await limitedPage.goto(
      pathToFileURL(path.join(candidate, "interactive/architecture.html")).href +
        "#page=connections",
      { waitUntil: "load" },
    );
    const member = limitedPage.frameLocator("#interactive-frame");
    const occurrence = member.locator('g[data-inspect-id="a-copy"][tabindex]');
    await occurrence.waitFor({ state: "visible" });
    assert.equal(await member.locator('g[data-inspect-id="a"][tabindex]').count(), 1);
    const limitedReader = await selectedInteractiveMember(limitedPage, "connections");
    const noTraversal = await limitedReader.evaluate(() => {
      const ids = [...globalThis.document.querySelectorAll("svg g[data-node-id]")].map(
        (element) => element.dataset.nodeId,
      );
      const selected = globalThis.Archify.routeProbe.begin({ source: ids[0], focusNode: false });
      const found = globalThis.Archify.routeProbe.choose(ids[1]);
      const snapshot = globalThis.Archify.routeProbe.exportSnapshot();
      globalThis.Archify.routeProbe.clear();
      return {
        selected,
        found,
        snapshot,
        logicalEdges: globalThis.document.querySelectorAll("svg [data-edge-from][data-edge-to]")
          .length,
      };
    });
    assert.equal(
      noTraversal.found,
      false,
      "occurrence geometry cannot invent a directed source path",
    );
    assert.equal(noTraversal.snapshot, null);
    assert.equal(noTraversal.logicalEdges, 0);
    await occurrence.press("Enter");
    await limitedReader.waitForFunction(() => globalThis.Archify.focus.active() === "a-copy");
    assert.equal(await limitedPage.locator("#interactive-inspector").isVisible(), false);
    for (const gesture of ["inspect-key", "double-click"]) {
      if (gesture === "inspect-key") await occurrence.press("i");
      else await occurrence.dblclick();
      await limitedPage
        .locator("#interactive-inspector")
        .waitFor({ state: "visible", timeout: 8000 });
      assert.match(
        await limitedPage.locator("#interactive-inspect-content").textContent(),
        /alpha-owner/u,
      );
      await limitedPage.locator("#interactive-inspect-back").click();
      const restored = await selectedInteractiveMember(limitedPage, "connections");
      await restored.waitForFunction(
        () => globalThis.document.activeElement?.getAttribute("data-inspect-id") === "a-copy",
        undefined,
        { timeout: 5_000 },
      );
    }
    await limitedPage.close();
  },
);

test("standalone copy links do not invoke a policy-denied Clipboard API", runBrowser, async (t) => {
  const html = await authoredHtml(t);
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-copy-policy-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, "architecture.html");
  await fs.writeFile(file, html);
  const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) errors.push(message.text());
  });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  const handle = await page.locator("#interactive-frame").elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => !!globalThis.Archify?.routeProbe);
  const copied = await frame.evaluate(async () => {
    const policy = globalThis.document.permissionsPolicy ?? globalThis.document.featurePolicy;
    const denied = policy?.allowsFeature("clipboard-write") === false;
    const attempts = [];
    const payloads = [];
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(value) {
          attempts.push(value);
          return Promise.reject(new DOMException("Clipboard denied by policy", "NotAllowedError"));
        },
      },
    });
    globalThis.document.execCommand = (command) => {
      if (command !== "copy") return false;
      payloads.push(globalThis.document.querySelector("textarea[readonly]")?.value);
      return true;
    };
    globalThis.Archify.focus.set("client", { toggle: false });
    const focus = await globalThis.Archify.focus.copyLink();
    globalThis.Archify.focus.clear();
    globalThis.Archify.routeProbe.begin({ source: "client", focusNode: false });
    globalThis.Archify.routeProbe.choose("server");
    const route = await globalThis.Archify.routeProbe.copyLink();
    globalThis.Archify.routeProbe.clear();
    globalThis.Archify.semanticLens.select("component");
    const lens = await globalThis.Archify.semanticLens.copyLink();
    return { denied, attempts, payloads, results: [focus, route, lens] };
  });
  assert.equal(copied.denied, true);
  assert.deepEqual(copied.attempts, []);
  assert.deepEqual(copied.results, [true, true, true]);
  assert.deepEqual(
    copied.payloads.map((value) => new URLSearchParams(new URL(value).hash.slice(1)).get("reader")),
    ["focus=client", "route=client~server", "lens=component"],
  );
  assert.deepEqual(errors, []);
});
