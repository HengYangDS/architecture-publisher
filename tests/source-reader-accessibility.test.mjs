import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember, selectedSourceMember } from "./fixtures/interactive-member.mjs";
import { browserOptions, runBrowser } from "./fixtures/reader-appearance.mjs";
import { sourceReadingFixture, sourceReference, sha } from "./fixtures/source-reading.mjs";

const require = createRequire(import.meta.url);

async function accessibleSource(t, reducedMotion = "reduce") {
  const { root } = await sourceReadingFixture(t);
  const request = path.join(root, "build-request.json");
  const candidate = path.join(root, "candidate");
  await compileEditionCandidateInput(request, sha(await fs.readFile(request)), candidate);
  const browser = await browserLifetime(t).acquire(() => chromium.launch(browserOptions));
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  });
  const errors = [],
    requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  const url = pathToFileURL(path.join(candidate, "interactive/architecture.html")).href;
  await page.route("**/*", async (route) => {
    const address = new URL(route.request().url());
    address.hash = "";
    address.search = "";
    if (address.href === url) return route.continue();
    requests.push(route.request().url());
    await route.abort();
  });
  await page.goto(url, { waitUntil: "load" });
  const member = await selectedInteractiveMember(page, "connections");
  await member.locator('[data-inspect-id="a"][tabindex]').first().press("i");
  const declaration = page
    .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
    .first();
  if (!(await declaration.evaluate((element) => element.open)))
    await declaration.locator(":scope > summary").click();
  await declaration.locator(".inspect-source-diagram > summary").click();
  return { page, member, native: await selectedSourceMember(page), errors, requests };
}

async function violations(frame) {
  if (!(await frame.evaluate(() => !!globalThis.axe)))
    await frame.addScriptTag({
      content: await fs.readFile(require.resolve("axe-core/axe.min.js"), "utf8"),
    });
  return frame.evaluate(async () => {
    const result = await globalThis.axe.run(globalThis.document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    });
    return result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    }));
  });
}

async function assertReadableSelection(native, id) {
  try {
    await native.waitForFunction(
      (id) => {
        const title = globalThis.document.querySelector(
          `svg g[data-node-id="${id}"] text[data-node-label]`,
        );
        return (
          globalThis.Archify.focus.active() === id &&
          Number(title?.getAttribute("font-size")) * (title?.getScreenCTM()?.a ?? 0) >= 14
        );
      },
      id,
      { timeout: 8_000 },
    );
  } catch (error) {
    const observed = await native.evaluate((id) => {
      const svg = globalThis.document.querySelector(".diagram-container > svg");
      const title = svg.querySelector(`g[data-node-id="${id}"] text[data-node-label]`);
      const matrix = title?.getScreenCTM();
      return {
        expected: id,
        active: globalThis.Archify.focus.active(),
        view: globalThis.Archify.view.state(),
        viewport: { width: globalThis.innerWidth, height: globalThis.innerHeight },
        minimum: svg.getAttribute("data-reader-primary-text"),
        fontSize: title?.getAttribute("font-size"),
        screenMatrix: matrix ? { a: matrix.a, d: matrix.d, e: matrix.e, f: matrix.f } : null,
        bounds: title?.getBoundingClientRect().toJSON(),
      };
    }, id);
    throw new Error(`Native reading state: ${JSON.stringify(observed)}`, { cause: error });
  }
}

test(
  "native source focus remains readable after animated Finder selection without taking manual camera control",
  { ...runBrowser, timeout: 60_000 },
  async (t) => {
    const { native, errors, requests } = await accessibleSource(t, "no-preference");
    await native.getByRole("button", { name: /Find a node/u }).click();
    await native.locator("#node-finder-input").fill("Alpha B");
    const result = native.locator("#node-finder-results button[data-node-id]");
    const id = await result.getAttribute("data-node-id");
    await result.click();
    await assertReadableSelection(native, id);
    await native.locator(".diagram-container.is-camera-moving").waitFor({ state: "hidden" });
    await assertReadableSelection(native, id);
    const before = await native.evaluate(() => globalThis.Archify.view.state());
    await native.getByRole("button", { name: "Zoom out", exact: true }).click();
    const after = await native.evaluate(() => globalThis.Archify.view.state());
    assert.equal(after.mode, "manual");
    assert.ok(after.scale < before.scale, "the reader retains native manual zoom control");
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
  },
);

test(
  "the public native source diagram preserves readable context and named keyboard controls in both themes",
  { ...runBrowser, timeout: 60_000 },
  async (t) => {
    const { page, member, native, errors, requests } = await accessibleSource(t);
    const ids = await native
      .locator("svg g[data-node-id]")
      .evaluateAll((nodes) =>
        Object.fromEntries(nodes.map((node) => [node.dataset.nodeLabel, node.dataset.nodeId])),
      );
    await assertReadableSelection(native, ids.A);
    const camera = await native.locator(".diagram-nav button[data-view]").evaluateAll((buttons) =>
      buttons.map((button) => ({
        name: button.getAttribute("aria-label"),
        height: button.getBoundingClientRect().height,
      })),
    );
    assert.equal(camera.length, 3);
    assert.ok(
      camera.every(({ name, height }) => name?.trim() && height >= 32 && height <= 40),
      JSON.stringify(camera),
    );
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      await native.evaluate((value) => globalThis.Archify.preset.apply(value), style);
      for (const theme of ["light", "dark"]) {
        await t.test(`${style}/${theme} retains accessible native reading`, async () => {
          if ((await native.locator("html").getAttribute("data-theme")) !== theme)
            await native.evaluate(() => globalThis.Archify.theme.toggle());
          await native.locator(`html[data-theme="${theme}"]`).waitFor();
          await assertReadableSelection(native, ids.A);
          assert.equal(await native.locator("svg g[data-node-id]").count(), 4);
          assert.equal(await native.locator('svg > path[data-logical-relation="true"]').count(), 2);
          assert.equal(await native.locator('svg [data-node-label="Global only"]').count(), 0);
          assert.deepEqual(
            await violations(native),
            [],
            `${style}/${theme}: native context and Passport must remain accessible`,
          );
          for (const name of ["Zoom in", "Zoom out"])
            await native.getByRole("button", { name, exact: true }).press("Enter");
          const reset = native.locator('button[data-view="reset"]');
          await reset.press("Enter");
          assert.match(await reset.getAttribute("aria-label"), /100%/u);
          const search = native.locator("#btn-node-finder");
          assert.ok((await search.getAttribute("aria-label"))?.trim(), "native Finder has a name");
          await search.press("Enter");
          const input = native.locator("#node-finder-input");
          await input.waitFor({ state: "visible", timeout: 5_000 });
          await input.fill("Alpha B");
          const results = native.locator("#node-finder-results button[data-node-id]");
          await results.first().waitFor();
          assert.equal(
            await results.count(),
            1,
            "search contains selected source declarations only",
          );
          assert.equal(await results.first().getAttribute("data-node-id"), ids["Alpha B"]);
          assert.deepEqual(
            await violations(native),
            [],
            `${theme}: Finder names and text remain accessible`,
          );
          await results.first().press("Enter");
          await native.locator("#node-finder").waitFor({ state: "hidden" });
          await assertReadableSelection(native, ids["Alpha B"]);
          assert.equal(await page.locator("#interactive-inspector").isVisible(), true);
          const passport = native.locator("#focus-chip");
          await passport.waitFor({ state: "visible" });
          assert.match(await passport.textContent(), /Alpha B/u);
          assert.deepEqual(
            await passport.locator(".relationship-lens-row").evaluateAll((rows) =>
              rows.map((row) => ({
                direction: row.dataset.direction,
                reference: row.dataset.relationshipKey,
              })),
            ),
            [{ direction: "in", reference: sourceReference("alpha", "relation", "r") }],
          );
          await search.press("Enter");
          await input.fill("Global only");
          assert.equal(await results.count(), 0, "Finder cannot expose unselected global subjects");
          await input.press("Escape");
          await native.locator("#node-finder").waitFor({ state: "hidden" });
          assert.equal(
            await page.locator("#interactive-inspector").isVisible(),
            true,
            "closing Finder does not close Inspect",
          );
          await passport.locator("#btn-focus-clear").press("Enter");
          await passport.waitFor({ state: "hidden" });
          assert.equal(
            await page.locator("#interactive-inspector").isVisible(),
            true,
            "closing native Passport does not close Inspect",
          );
          await native.locator(`svg g[data-node-id="${ids.A}"]`).press("Enter");
          await assertReadableSelection(native, ids.A);
        });
      }
    }
    await page.locator("#interactive-inspect-back").click();
    await member.waitForFunction(
      () => globalThis.document.activeElement?.getAttribute("data-inspect-id") === "a",
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
  },
);

test(
  "native relationship browsing preserves exact scope and keyboard return without external requests",
  { ...runBrowser, timeout: 60_000 },
  async (t) => {
    const { page, member, native, errors, requests } = await accessibleSource(t);
    const nodes = await native.locator("svg g[data-node-id]").evaluateAll((items) =>
      items.map((node) => ({
        id: node.dataset.nodeId,
        reference: node.dataset.publicationSourceReference,
      })),
    );
    const ids = new Map(nodes.map(({ reference, id }) => [reference, id]));
    const a = ids.get(sourceReference("alpha", "entity", "a"));
    const b = ids.get(sourceReference("alpha", "entity", "b"));
    const c = ids.get(sourceReference("beta", "entity", "c"));
    const relation = sourceReference("alpha", "relation", "r");
    await assertReadableSelection(native, a);
    const rows = native.locator(".relationship-lens-row");
    assert.deepEqual(
      await rows.evaluateAll((items) =>
        items.map((row) => ({
          direction: row.dataset.direction,
          reference: row.dataset.relationshipKey,
        })),
      ),
      [{ direction: "out", reference: relation }],
    );
    await native.locator("#btn-reach-downstream").press("Enter");
    const reach = await native.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot());
    assert.deepEqual(
      reach.nodeIds,
      [a, b],
      "source reach cannot cross an aggregated publication figure",
    );
    assert.deepEqual(
      reach.edges.map(({ key }) => key),
      [relation],
    );
    assert.equal(reach.nodeIds.includes(c), false);
    assert.deepEqual(await violations(native), [], "exact native reach remains named and readable");
    await native.locator("#btn-focus-copy").press("Escape");
    await native.waitForFunction(() => globalThis.Archify.focus.active() === null);
    assert.deepEqual(
      await native.locator("svg g[data-node-id]").evaluateAll((items) =>
        items.map((node) => ({
          id: node.dataset.nodeId,
          reference: node.dataset.publicationSourceReference,
        })),
      ),
      nodes,
      "dismissal changes reading state, never selected source identities",
    );
    await native.locator(`svg g[data-node-id="${b}"]`).press("Enter");
    await assertReadableSelection(native, b);
    assert.deepEqual(
      await rows.evaluateAll((items) =>
        items.map((row) => ({
          direction: row.dataset.direction,
          reference: row.dataset.relationshipKey,
        })),
      ),
      [{ direction: "in", reference: relation }],
    );
    await page.locator("#interactive-inspect-back").click();
    await member.waitForFunction(
      () => globalThis.document.activeElement?.getAttribute("data-inspect-id") === "a",
    );
    assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
  },
);
