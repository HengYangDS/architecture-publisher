import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { prepareArchitecturePublisherEdition } from "../editions/self/src/edition/index.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { request, root } from "./fixtures/self-edition.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

/** Measure the real native document, including its transformed selected title. */
function sourceViewportState({ id, legible = false, theme = null, focused = false }) {
  const svg = globalThis.document.querySelector(".diagram-container > svg");
  const node = [...svg.querySelectorAll("g[data-node-id]")].find(
    (element) => element.dataset.nodeId === id,
  );
  const title = node?.querySelector("text[data-node-label]");
  const matrix = title?.getScreenCTM();
  const size = Number(title?.getAttribute("font-size")) * (matrix?.a ?? 0);
  const bounds = title?.getBoundingClientRect();
  const canvas = svg.closest(".diagram-container").getBoundingClientRect();
  const inside =
    bounds &&
    bounds.left >= Math.max(0, canvas.left) &&
    bounds.right <= Math.min(globalThis.innerWidth, canvas.right) &&
    bounds.top >= Math.max(0, canvas.top) &&
    bounds.bottom <= Math.min(globalThis.innerHeight, canvas.bottom);
  const current = {
    size,
    minimum: Number(svg.getAttribute("data-reader-primary-text")),
    inside: Boolean(inside),
    label: node?.dataset.nodeLabel,
    active: globalThis.Archify.focus.active(),
    view: globalThis.Archify.view.state(),
    theme: globalThis.document.documentElement.dataset.theme,
    nodes: [...svg.querySelectorAll("g[data-node-id]")].map((item) => item.dataset.nodeId).sort(),
    relations: [...svg.querySelectorAll('[data-edge-id][data-logical-relation="true"]')]
      .map((item) => item.dataset.edgeId)
      .sort(),
  };
  if (legible && (!(size >= current.minimum) || !inside)) return null;
  if (theme !== null && current.theme !== theme) return null;
  if (focused && current.active !== id) return null;
  return current;
}

test(
  "complete source reading keeps its selected subject legible across theme and desktop resize without pruning context",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""), timeout: 120_000 },
  async (t) => {
    const work = path.join(root, "build/test-work");
    await fs.mkdir(work, { recursive: true });
    const scratch = await fs.mkdtemp(path.join(work, "source-viewport-"));
    t.after(() => fs.rm(scratch, { recursive: true, force: true }));
    const prepared = await prepareArchitecturePublisherEdition(
      await request(path.join(scratch, "prepared")),
    );
    const candidate = path.join(scratch, "candidate");
    await compileEditionCandidateInput(
      prepared.buildRequest,
      prepared.buildRequestSha256,
      candidate,
    );
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
    const url = pathToFileURL(path.join(candidate, "interactive/architecture.html")).href;
    await page.route("**/*", async (route) => {
      if (route.request().url() === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(url, { waitUntil: "load" });
    const data = await page
      .locator("#architecture-interactive-data")
      .evaluate((script) => JSON.parse(script.textContent));
    const expectedIdentities = (pageId) => ({
      nodes: Object.values(data.sourceReading.pages[pageId].bindings)
        .filter((binding) => binding.kind === "entity")
        .map((binding) => binding.id)
        .sort(),
      relations: Object.values(data.sourceReading.pages[pageId].bindings)
        .filter((binding) => binding.kind === "relation")
        .map((binding) => binding.id)
        .sort(),
    });
    const assertIdentities = (state, pageId) =>
      assert.deepEqual(
        { nodes: state.nodes, relations: state.relations },
        expectedIdentities(pageId),
      );
    const subject = data.sourceReading.projection.elements.find(
      (item) => item.label === "Edition Project",
    );
    assert.ok(subject, "the selected subject comes from the checked source projection");
    const openSource = async (pageId, element) => {
      await page.locator(`[data-interactive-page="${pageId}"]`).click();
      const member = await selectedInteractiveMember(page, pageId);
      const fact = data.pages[pageId].facts.find((item) => item.reference === element.reference);
      assert.ok(fact, `${pageId} has an exact source occurrence`);
      const figure = member.locator(`[data-inspect-id="${fact.graphicId}"][tabindex]`).first();
      await figure.focus();
      await figure.press("i");
      const disclosure = page
        .locator(
          `.inspect-source-diagram[data-source-reference=${JSON.stringify(element.reference)}]`,
        )
        .first();
      const declaration = page
        .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
        .filter({ has: disclosure })
        .first();
      if (!(await declaration.evaluate((item) => item.open)))
        await declaration.locator(":scope > summary").click();
      await disclosure.locator(":scope > summary").click();
      const handle = await disclosure.locator("iframe").elementHandle();
      assert.ok(handle, "native source reading has one isolated document");
      let native;
      try {
        native = await handle.contentFrame();
      } finally {
        await handle.dispose();
      }
      assert.ok(native, "native source reading is an actual frame");
      await native.locator(".diagram-container > svg").waitFor({ timeout: 8_000 });
      return {
        native,
        member,
        fact,
        id: data.sourceReading.pages[pageId].bindings[element.reference].id,
      };
    };
    const read = async (native, id, options = {}) => {
      const handle = await native.waitForFunction(
        sourceViewportState,
        { id, ...options },
        { timeout: 5_000 },
      );
      try {
        return await handle.jsonValue();
      } finally {
        await handle.dispose();
      }
    };
    const first = await openSource("overview", subject);
    let state = await read(first.native, first.id, { legible: true, focused: true });
    assert.equal(state.nodes.length, 38);
    assert.equal(state.relations.length, 50);
    assert.equal(state.label, subject.label);
    assertIdentities(state, "overview");
    for (const width of [1200, 1600, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["dark", "light"]) {
        if ((await first.native.locator("html").getAttribute("data-theme")) !== theme)
          await first.native.evaluate(() => globalThis.Archify.theme.toggle());
        state = await read(first.native, first.id, { legible: true, focused: true, theme });
        assertIdentities(state, "overview");
      }
    }
    const search = first.native.locator("#btn-node-finder");
    const input = first.native.locator("#node-finder-input");
    const destination = data.sourceReading.projection.elements.find(
      (item) => item.label === "Exact before and after inputs",
    );
    assert.ok(destination, "the later searched subject retains its source identity");
    const destinationId = data.sourceReading.pages.overview.bindings[destination.reference].id;
    await first.native.evaluate(() => globalThis.Archify.finder.open());
    await input.fill(destination.label);
    await input.press("Escape");
    await first.native.locator("#node-finder").waitFor({ state: "hidden" });
    const cancelled = await read(first.native, first.id, { focused: true });
    assert.ok(
      Math.abs(cancelled.size - state.size) < 0.05,
      "cancelled search does not reframe focus",
    );
    for (const element of [destination, destination, subject, subject]) {
      await search.click();
      await input.fill(element.label);
      const id = data.sourceReading.pages.overview.bindings[element.reference].id;
      await first.native.locator(`#node-finder-results button[data-node-id="${id}"]`).click();
      const selected = await read(first.native, id, { legible: true, focused: true });
      assertIdentities(selected, "overview");
      const samples = await first.native.evaluate(async (selection) => {
        const values = [],
          start = globalThis.performance.now();
        do {
          await new Promise(globalThis.requestAnimationFrame);
          const svg = globalThis.document.querySelector(".diagram-container > svg");
          const title = svg.querySelector(`g[data-node-id="${selection}"] text[data-node-label]`);
          values.push({
            size: Number(title.getAttribute("font-size")) * title.getScreenCTM().a,
            focused: globalThis.Archify.focus.active() === selection,
          });
        } while (globalThis.performance.now() - start < 600);
        return values;
      }, id);
      assert.ok(samples.length > 1, "readability is sampled beyond one frame");
      assert.ok(
        samples.every((sample) => sample.size >= selected.minimum && sample.focused),
        "native focus remains legible through camera settling and repeated selection",
      );
    }
    await first.native.locator('[data-view="out"]').click();
    const manual = await read(first.native, first.id);
    assert.equal(manual.view.mode, "manual");
    await first.native.evaluate(() => globalThis.Archify.theme.toggle());
    const preserved = await read(first.native, first.id);
    assert.deepEqual(
      preserved.view,
      manual.view,
      "appearance does not seize manual camera ownership",
    );
    await first.native.locator('[data-view="reset"]').click();
    const overview = await read(first.native, first.id);
    assert.equal(overview.active, null);
    assert.equal(overview.view.mode, "overview");
    assert.ok(overview.size < state.size, "explicit Reset retains the complete overview");
    assertIdentities(overview, "overview");
    await search.click();
    await input.fill(destination.label);
    await input.press("Escape");
    await first.native.locator("#node-finder").waitFor({ state: "hidden" });
    assert.deepEqual(
      (await read(first.native, destinationId)).view,
      overview.view,
      "cancelled search preserves explicit overview framing",
    );
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await first.member
        .locator("html")
        .evaluate(() => globalThis.document.activeElement?.getAttribute("data-inspect-id")),
      first.fact.graphicId,
    );
    assert.equal(await page.locator("[data-source-reader-root] iframe").count(), 0);
    for (const pageId of Object.keys(data.sourceReading.pages)) {
      const selectedPage = data.sourceReading.projection.pages.find((item) => item.id === pageId);
      const element = data.sourceReading.projection.elements.find((item) =>
        selectedPage.elements.includes(item.reference),
      );
      const current = await openSource(pageId, element);
      const reading = await read(current.native, current.id, { legible: true, focused: true });
      assertIdentities(reading, pageId);
      await page.locator("#interactive-inspect-back").click();
      assert.equal(
        await current.member
          .locator("html")
          .evaluate(() => globalThis.document.activeElement?.getAttribute("data-inspect-id")),
        current.fact.graphicId,
      );
      assert.equal(await page.locator("[data-source-reader-root] iframe").count(), 0);
    }
    await page.locator('[data-interactive-page="overview"]').click();
    await selectedInteractiveMember(page, "overview");
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
  },
);
