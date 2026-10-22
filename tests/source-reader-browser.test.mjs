import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import {
  nativeSourceReadingFixture,
  sourceReadingFixture,
  sha,
} from "./fixtures/source-reading.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import { responsibilityFixture } from "./fixtures/visual-form.mjs";

test(
  "the public responsibility diagram uses the same complete Inspect and source reader",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""), timeout: 60_000 },
  async (t) => {
    const { selected } = await responsibilityFixture(t);
    const file = path.join(selected.root, "build-request.json"),
      output = path.join(selected.root, "candidate");
    await compileEditionCandidateInput(file, sha(await fs.readFile(file)), output);
    const browser = await browserLifetime(t).acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
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
    const url = pathToFileURL(path.join(output, "interactive/architecture.html")).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(url, { waitUntil: "load" });
    const member = page.frameLocator("#interactive-frame");
    await member.locator('svg[data-diagram-type="architecture"]').waitFor({ state: "visible" });
    for (const label of ["First responsibility", "Second responsibility"])
      assert.equal(await member.getByText(label, { exact: true }).first().isVisible(), true);
    assert.match(
      await member.locator("body").textContent(),
      /The first component hands control to the second\./u,
    );
    for (const id of ["n-0", "r-0", "g-0", "h-0"]) {
      const figure = member.locator(`[data-inspect-id="${id}"][tabindex]`).first();
      assert.equal(await figure.count(), 1, `${id} has a keyboard-readable native carrier`);
      await figure.focus();
      await figure.press("i");
      await page.locator("#interactive-inspector").waitFor({ state: "visible" });
      if (id === "h-0" || id === "g-0")
        assert.match(
          await page.locator("#interactive-inspect-content").textContent(),
          /editor-attributed-unverified/u,
        );
      else
        assert.match(
          await page.locator("#interactive-inspect-content").textContent(),
          /Source record/u,
        );
      await page.locator("#interactive-inspect-back").click();
      assert.equal(
        await member
          .locator("html")
          .evaluate(() => globalThis.document.activeElement?.getAttribute("data-inspect-id")),
        id,
      );
    }
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "the automatic public reader preserves Claims and visible editorial attribution offline",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""), timeout: 60_000 },
  async (t) => {
    const statement = "Selected release Claims do not establish current runtime behavior.";
    const { root } = await sourceReadingFixture(t, {
      authored: false,
      editorialAssertions: [
        {
          id: "editorial-release-boundary",
          statement,
          proponent: "fixture-editor",
          basis: ["release"],
          questions: ["release"],
        },
      ],
    });
    const input = path.join(root, "build-request.json"),
      output = path.join(root, "candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const browser = await browserLifetime(t).acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
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
    const selectedUrl = pathToFileURL(path.join(output, "interactive/architecture.html")).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === selectedUrl) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(selectedUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Release", exact: true }).click();
    const member = page.frameLocator("#interactive-frame");
    await member
      .locator('html[data-interactive-member="release"] svg[data-diagram-type="architecture"]')
      .first()
      .waitFor({ timeout: 8000 });
    assert.equal(
      await member.locator('[data-inspect-id="editorial-0"][tabindex]').isVisible(),
      true,
    );
    assert.equal(
      await member.locator('[data-inspect-id="editorial-0"][tabindex]').textContent(),
      statement,
    );
    for (const [id, expected] of [
      ["c-0", /Release remains conditional/u],
      ["editorial-0", /editor-attributed-unverified/u],
    ]) {
      const figure = member.locator(`[data-inspect-id="${id}"][tabindex]`).first();
      await figure.focus();
      await figure.press("i");
      await page.locator("#interactive-inspector").waitFor({ state: "visible" });
      assert.match(await page.locator("#interactive-inspect-content").textContent(), expected);
      if (id === "editorial-0") {
        assert.match(
          await page.locator("#interactive-inspect-content").textContent(),
          /fixture-editor/u,
        );
        assert.equal(await page.locator("[data-source-reader-root]").count(), 0);
      }
      await page.locator("#interactive-inspect-back").click();
      assert.equal(
        await member
          .locator("html")
          .evaluate(() => globalThis.document.activeElement?.getAttribute("data-inspect-id")),
        id,
      );
    }
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "one public build supplies source-native reading and exact keyboard return offline",
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
    timeout: 60_000,
  },
  async (t) => {
    const { root } = await sourceReadingFixture(t, { entityKind: "Type not declared by source" });
    const input = path.join(root, "build-request.json"),
      output = path.join(root, "candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const lifetime = browserLifetime(t);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
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
    const url = pathToFileURL(path.join(output, "interactive/architecture.html")).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(url, { waitUntil: "load" });
    const data = await page
      .locator("#architecture-interactive-data")
      .evaluate((script) => JSON.parse(script.textContent));
    const member = await selectedInteractiveMember(page, "connections");
    const figure = member.locator('[data-inspect-id="b"][tabindex]').first();
    await figure.focus();
    await figure.press("i");
    const disclosure = page
      .locator(".inspect-source-diagram[data-source-reference]")
      .filter({ has: page.locator("summary") })
      .first();
    const declaration = page
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .filter({ has: disclosure })
      .first();
    if (!(await declaration.evaluate((element) => element.open)))
      await declaration.locator(":scope > summary").click();
    await disclosure.locator(":scope > summary").click();
    const handle = await disclosure.locator("iframe").elementHandle();
    assert.ok(handle, "one isolated native source document is present");
    let native;
    try {
      native = await handle.contentFrame();
    } finally {
      await handle.dispose();
    }
    assert.ok(native);
    await native.locator('svg[data-diagram-type="architecture"]').waitFor({ timeout: 8_000 });
    const frameBounds = await disclosure.evaluate((element) => {
      const diagram = element.querySelector("[data-source-reader-root]").getBoundingClientRect();
      return {
        width: diagram.width,
        readingWidth: element.closest(".inspect-reading-scroll").getBoundingClientRect().width,
        scrollWidth: element.scrollWidth,
      };
    });
    assert.ok(frameBounds.width > frameBounds.readingWidth * 0.9);
    assert.ok(frameBounds.scrollWidth <= frameBounds.width + 1);
    const selected = data.sourceReading.pages.connections.bindings;
    const expectedNodes = Object.values(selected)
      .filter(({ kind }) => kind === "entity")
      .map(({ id }) => id)
      .sort();
    const nodes = await native.locator("svg g[data-node-id]").evaluateAll((items) =>
      items.map((item) => ({
        id: item.dataset.nodeId,
        reference: item.dataset.publicationSourceReference,
        kind: item.dataset.nodeKind,
      })),
    );
    assert.deepEqual(nodes.map(({ id }) => id).sort(), expectedNodes);
    assert.equal(nodes.length, 4, "shared publication figures preserve distinct source entities");
    assert.deepEqual(
      nodes.map(({ reference }) => reference).sort(),
      Object.keys(selected)
        .filter((key) => selected[key].kind === "entity")
        .sort(),
    );
    assert.ok(nodes.every(({ kind }) => kind === "Type not declared by source"));
    assert.equal(Object.hasOwn(selected, '["beta","entity","d"]'), false);
    const relationReference = '["alpha","relation","r"]',
      sourceId = selected['["alpha","entity","a"]'].id,
      targetId = selected['["alpha","entity","b"]'].id,
      disconnectedId = selected['["beta","entity","c"]'].id;
    const query = (target) =>
      native.evaluate(
        ({ source, target }) => {
          globalThis.Archify.routeProbe.begin({ source, focusNode: false });
          const accepted = globalThis.Archify.routeProbe.choose(target);
          return {
            accepted,
            route: globalThis.Archify.routeProbe.exportSnapshot(),
            state: globalThis.document.querySelector("#route-probe").dataset.state,
          };
        },
        { source: sourceId, target },
      );
    const disconnected = await query(disconnectedId);
    assert.equal(disconnected.accepted, false);
    assert.equal(disconnected.route, null, "disconnected sources cannot invent a traversal");
    assert.equal(disconnected.state, "error");
    const resolved = await query(targetId);
    assert.equal(resolved.accepted, true);
    assert.deepEqual(resolved.route.nodeIds, [sourceId, targetId]);
    assert.deepEqual(
      resolved.route.edges.map(({ key }) => key),
      [relationReference],
    );
    assert.equal(resolved.route.hops, 1);
    const same = await query(sourceId);
    assert.equal(same.accepted, false);
    assert.equal(same.route, null, "native distinct-endpoint queries cannot expose an old route");
    const readings = await native.evaluate((id) => {
      const api = globalThis.Archify;
      api.routeProbe.clear();
      api.focus.set(id, { toggle: false });
      const camera = api.view.state();
      const location = globalThis.location.href;
      const historyLength = globalThis.history.length;
      const records = [...globalThis.document.querySelectorAll(".relationship-lens-row")].map(
        (item) => ({
          direction: item.dataset.direction,
          reference: item.dataset.relationshipKey,
        }),
      );
      const kinds = api.semanticLens.kinds();
      const passive = {
        camera: api.view.state(),
        location: globalThis.location.href,
        historyLength: globalThis.history.length,
      };
      api.focus.reach("downstream", { reveal: false });
      const reach = api.focus.reachabilitySnapshot();
      return { camera, location, historyLength, passive, records, kinds, reach };
    }, sourceId);
    assert.deepEqual(readings.records, [{ direction: "out", reference: relationReference }]);
    assert.deepEqual(readings.kinds, [{ id: "Type not declared by source", count: 4 }]);
    assert.deepEqual(readings.passive, {
      camera: readings.camera,
      location: readings.location,
      historyLength: readings.historyLength,
    });
    assert.deepEqual(readings.reach.nodeIds, [sourceId, targetId]);
    assert.deepEqual(
      readings.reach.edges.map(({ key }) => key),
      [relationReference],
    );
    await native.evaluate((id) => globalThis.Archify.focus.set(id, { toggle: false }), targetId);
    assert.deepEqual(
      await native.locator(".relationship-lens-row").evaluateAll((items) =>
        items.map((item) => ({
          direction: item.dataset.direction,
          reference: item.dataset.relationshipKey,
        })),
      ),
      [{ direction: "in", reference: relationReference }],
    );
    await native.evaluate(() => globalThis.Archify.theme.toggle());
    await native.evaluate(() => globalThis.Archify.theme.toggle());
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await member.evaluate(() => globalThis.document.activeElement?.dataset.inspectId),
      "b",
    );
    await page.locator('[data-interactive-page="release"]').click();
    const claimMember = await selectedInteractiveMember(page, "release");
    await claimMember.locator('[data-inspect-id="release-statement"]').press("i");
    assert.match(
      await page.locator("#interactive-inspect-content").textContent(),
      /Release remains conditional/u,
    );
    const claimDisclosure = page.locator(".inspect-source-diagram").first();
    await claimDisclosure.locator(":scope > summary").click();
    const claimHandle = await claimDisclosure.locator("iframe").elementHandle();
    assert.ok(claimHandle);
    let claimNative;
    try {
      claimNative = await claimHandle.contentFrame();
    } finally {
      await claimHandle.dispose();
    }
    await claimNative.locator("svg g[data-node-id]").first().waitFor({ timeout: 8_000 });
    assert.equal(await claimNative.locator('svg [data-logical-relation="true"]').count(), 0);
    const claimBindings = data.sourceReading.pages.release.bindings;
    const claimReference = Object.keys(claimBindings).find(
      (reference) => JSON.parse(reference)[1] === "claim",
    );
    assert.ok(claimReference, "the statement retains a checked Claim identity");
    const record = await claimNative
      .locator('[data-note-id="' + claimBindings[claimReference].id + '"]')
      .textContent();
    assert.deepEqual(
      JSON.parse(record),
      data.sourceReading.projection.claims.find((claim) => claim.reference === claimReference)
        .record,
    );
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await claimMember.evaluate(() => globalThis.document.activeElement?.dataset.inspectId),
      "release-statement",
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test(
  "the same public reader serves an automatic native-source diagram offline",
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
    timeout: 60_000,
  },
  async (t) => {
    const { root } = await nativeSourceReadingFixture(t);
    const input = path.join(root, "build-request.json"),
      output = path.join(root, "candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const lifetime = browserLifetime(t);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
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
    const selectedUrl = pathToFileURL(path.join(output, "interactive/architecture.html")).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === selectedUrl) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(selectedUrl, { waitUntil: "load" });
    const member = page.frameLocator("#interactive-frame");
    await member
      .locator('html[data-interactive-member="calls"] svg[data-diagram-type="architecture"]')
      .waitFor({ state: "visible" });
    const figure = member.locator('[data-inspect-id="n-0"][tabindex]').first();
    await figure.focus();
    await figure.press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#interactive-inspect-content").textContent(),
      /requires-review/u,
    );
    const declaration = page
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .first();
    if (!(await declaration.evaluate((element) => element.open)))
      await declaration.locator(":scope > summary").click();
    await page.locator(".inspect-source-diagram > summary").first().click();
    const handle = await page.locator("[data-source-reader-root] iframe").elementHandle();
    assert.ok(handle, "automatic and refined diagrams share the isolated native reader");
    let native;
    try {
      native = await handle.contentFrame();
    } finally {
      await handle.dispose();
    }
    assert.ok(native);
    await native.locator("svg g[data-node-id]").first().waitFor({ timeout: 8_000 });
    assert.equal(await native.locator("svg g[data-node-id]").count(), 2);
    assert.equal(
      await native.locator('.diagram-container > svg > path[data-logical-relation="true"]').count(),
      1,
      "canonical relationships do not count native hit and pulse overlays",
    );
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await member
        .locator("html")
        .evaluate(() => globalThis.document.activeElement?.getAttribute("data-inspect-id")),
      "n-0",
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);
