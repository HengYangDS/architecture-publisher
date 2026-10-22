import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import {
  browserExecutable,
  createInteractiveReadingFixture,
} from "./fixtures/interactive-browser.mjs";

const runBrowser = { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 90_000 };

async function nativeMember(page, id = "overview") {
  const member = await selectedInteractiveMember(page, id);
  await member.locator(".diagram-container > svg").waitFor({ timeout: 8_000 });
  await member.waitForFunction(() => !!globalThis.Archify?.layoutStability);
  await member.evaluate(() => globalThis.Archify.layoutStability.whenStable());
  return member;
}

async function assertAccessible(target, label) {
  await target.addScriptTag({ content: axe.source });
  const violations = await target.evaluate(async () => {
    const result = await globalThis.axe.run(globalThis.document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return result.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map(({ target }) => target),
    }));
  });
  assert.deepEqual(violations, [], `${label} accessibility violations`);
}

function graphReading(member) {
  return member.evaluate(() => {
    const svg = globalThis.document.querySelector(".diagram-container > svg");
    const nodes = [...svg.querySelectorAll("g[data-node-id]")];
    const relations = [...svg.querySelectorAll("path[data-composition-points]")];
    const boxes = nodes.map((node) => node.getBoundingClientRect());
    const overlap = boxes.some((left, index) =>
      boxes
        .slice(index + 1)
        .some(
          (right) =>
            Math.min(left.right, right.right) > Math.max(left.left, right.left) &&
            Math.min(left.bottom, right.bottom) > Math.max(left.top, right.top),
        ),
    );
    const scale = Math.hypot(svg.getScreenCTM().a, svg.getScreenCTM().b);
    const textSize = (text) =>
      Number(globalThis.getComputedStyle(text).fontSize.slice(0, -2)) * scale;
    return {
      nodeCount: nodes.length,
      relationCount: relations.length,
      effectiveFontSize: Math.min(
        ...nodes.flatMap((node) => [...node.querySelectorAll("text")].map(textSize)),
      ),
      effectiveEdgeFontSize: Math.min(
        ...[...svg.querySelectorAll("[data-intrinsic-relation-label] text")].map(textSize),
      ),
      overlap,
      edgeLabels: [...svg.querySelectorAll("[data-intrinsic-relation-label] text")].map((text) => ({
        label: text.textContent,
        paint: text.getBoundingClientRect().toJSON(),
      })),
      exactPaths: relations.every((relation) => {
        const expected = relation.dataset.compositionPoints
          .split(";")
          .map((point, index) => {
            const [x, y] = point.split(",");
            return `${index ? "L" : "M"} ${x} ${y}`;
          })
          .join(" ");
        return relation.getAttribute("d") === expected;
      }),
      hasCanvas: svg.querySelector("canvas") !== null,
      bounds: svg.getBoundingClientRect().toJSON(),
      viewport: [globalThis.innerWidth, globalThis.innerHeight],
    };
  });
}

test("superseded page callbacks do not fit a hidden viewport camera", runBrowser, async (t) => {
  const candidate = await renderInteractiveEditionHtml(interactiveEditionScene());
  const browser = await browserLifetime(t).acquire(() =>
    chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 10_000,
    }),
  );
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(candidate.bytes.toString(), { waitUntil: "load" });
  const previous = await nativeMember(page);
  await page.evaluate(() => {
    const first = globalThis.document.querySelector('[data-interactive-page="overview"]');
    first.click();
    first.click();
    globalThis.document.querySelector('[data-interactive-page="limit"]').click();
  });
  await nativeMember(page, "limit");
  assert(previous.isDetached(), "the replaced member cannot retain a hidden camera");
  assert.equal(await page.locator("#interactive-frame").count(), 1);
  await page.locator('[data-interactive-page="overview"]').click();
  const current = await nativeMember(page);
  const camera = await current.evaluate(() => {
    const matrix = globalThis.document.querySelector(".diagram-container > svg").getScreenCTM();
    return { scale: matrix.a, determinant: matrix.a * matrix.d - matrix.b * matrix.c };
  });
  assert(camera.scale > 0 && camera.determinant > 0);
  assert.deepEqual(errors, []);
});

test(
  "the neutral HTML preserves offline native selection, Inspect and exact page meaning",
  runBrowser,
  async (t) => {
    const { server, page, errors } = await createInteractiveReadingFixture({ t });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith(`${origin}/`) || /^(?:data|blob):/u.test(url)) return route.continue();
      errors.push(`external-request:${url}`);
      return route.abort();
    });
    const response = await page.goto(`${origin}/edition.html`, {
      waitUntil: "load",
      timeout: 15_000,
    });
    assert.equal(response.status(), 200);
    let member = await nativeMember(page);
    const initial = await member.evaluate(() => globalThis.Archify.view.state());
    await member.evaluate(() => {
      globalThis.dispatchEvent(new globalThis.PageTransitionEvent("pagehide", { persisted: true }));
      globalThis.dispatchEvent(new globalThis.PageTransitionEvent("pageshow", { persisted: true }));
    });
    await member.getByRole("button", { name: "Zoom in", exact: true }).click();
    assert((await member.evaluate(() => globalThis.Archify.view.state())).scale > initial.scale);
    await member.getByRole("button", { name: /Reset diagram view/u }).click();
    const alpha = member.locator('g[data-node-id="n-0"]');
    await alpha.press("Enter");
    assert.equal(await alpha.getAttribute("aria-pressed"), "true");
    assert.equal(await member.evaluate(() => globalThis.Archify.focus.active()), "n-0");
    await member.locator("#btn-focus-clear").click();
    assert.equal(await alpha.getAttribute("aria-pressed"), "false");
    const selected = member.locator('g[data-node-id="n-11"]');
    await selected.press("Enter");
    assert.equal(await selected.getAttribute("aria-label"), "Focus Client 9");
    assert.equal(await selected.getAttribute("aria-pressed"), "true");
    await selected.press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert.equal(await page.locator("#interactive-inspect-title").textContent(), "Client 9");
    assert.equal(
      await page
        .locator('#interactive-inspect-index [data-graphic-id="n-11"]')
        .getAttribute("aria-current"),
      "true",
    );
    await page.locator("#interactive-inspect-back").click();
    const relation = member.locator('[data-relationship-hit-key="r-0"]');
    await relation.press("Enter");
    assert.equal(await relation.getAttribute("aria-pressed"), "true");
    await member.locator("#btn-focus-clear").click();
    await member.getByRole("button", { name: /Reset diagram view/u }).click();
    assert.deepEqual(await member.evaluate(() => globalThis.Archify.view.state()), initial);
    assert.equal(await member.locator(".diagram-container > svg").count(), 1);
    assert.equal(await member.locator(".diagram-container canvas").count(), 0);
    await page.locator('[data-interactive-page="limit"]').click();
    const editorial = await nativeMember(page, "limit");
    assert.equal(
      await editorial
        .getByText("Runtime safety is not established.", { exact: true })
        .first()
        .isVisible(),
      true,
    );
    assert.equal(
      await page.locator("#interactive-page-label").textContent(),
      "What remains uncertain?",
    );
    await page.locator('[data-interactive-page="overview"]').click();
    member = await nativeMember(page);
    assert.equal(
      await member.locator('g[data-node-id="n-0"]').getAttribute("aria-pressed"),
      "false",
    );
    assert.deepEqual(errors, []);
    await assertAccessible(page, "publication shell");
    await assertAccessible(member, "native overview");
    await page.goto(`${origin}/hostile.html`, { waitUntil: "load", timeout: 15_000 });
    member = await nativeMember(page);
    assert.equal(await member.evaluate(() => globalThis.__archpub_injected ?? false), false);
    assert.equal(
      await member.locator('g[data-node-id="n-0"] text').textContent(),
      "<img src=x onerror=x>",
    );
    assert.equal(await member.locator("img[src=x]").count(), 0);
    assert.deepEqual(errors, []);
  },
);

test(
  "native complete figures preserve desktop text, routes, groups and type labels",
  runBrowser,
  async (t) => {
    const { server, page, errors } = await createInteractiveReadingFixture({ t });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const [name, nodes, relations] of [
      ["chain", 5, 4],
      ["branching", 7, 6],
    ]) {
      await page.goto(`${origin}/${name}.html`, { waitUntil: "load", timeout: 15_000 });
      const member = await nativeMember(page);
      const graphic = await graphReading(member);
      assert.deepEqual([graphic.nodeCount, graphic.relationCount], [nodes, relations]);
      assert.equal(graphic.overlap, false);
      assert(graphic.effectiveFontSize >= 12, JSON.stringify(graphic));
      assert.equal(graphic.exactPaths, true);
      assert.equal(graphic.hasCanvas, false);
      if (name === "branching") {
        assert(graphic.effectiveEdgeFontSize >= 11, JSON.stringify(graphic));
        assert(graphic.edgeLabels.every(({ paint }) => paint.width > 0 && paint.height > 0));
      }
    }
    await page.goto(`${origin}/grouped.html`, { waitUntil: "load", timeout: 15_000 });
    let member = await nativeMember(page);
    const groups = await member.locator("rect[data-group-id]").evaluateAll((frames) =>
      frames.map((frame) => ({
        id: frame.dataset.groupId,
        bounds: frame.getBoundingClientRect().toJSON(),
      })),
    );
    assert.deepEqual(
      groups.map(({ id }) => id),
      ["g-0", "g-1"],
    );
    assert(
      groups[0].bounds.right <= groups[1].bounds.left ||
        groups[0].bounds.bottom <= groups[1].bounds.top,
      JSON.stringify(groups),
    );
    assert.deepEqual(
      await member.locator('[data-graph-role="structural-frame-label"] text').allTextContents(),
      ["Input", "Effect"],
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${origin}/compact.html`, { waitUntil: "load", timeout: 15_000 });
    member = await nativeMember(page);
    const compact = await graphReading(member);
    assert(
      compact.bounds.right <= compact.viewport[0] + 1 &&
        compact.bounds.bottom <= compact.viewport[1] + 1,
      JSON.stringify(compact),
    );
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
      ),
      true,
    );
    await page.goto(`${origin}/dedup.html`, { waitUntil: "load", timeout: 15_000 });
    member = await nativeMember(page);
    assert.equal(
      await member.locator('g[data-node-id="n-0"]').getAttribute("aria-label"),
      "Focus Precontract",
    );
    const registry = member.locator('g[data-node-id="n-1"]');
    assert.equal(await registry.getAttribute("aria-label"), "Focus Client registry");
    assert.deepEqual(
      await member
        .locator("[data-legend-kind]")
        .evaluateAll((entries) => entries.map((entry) => entry.dataset.legendKind)),
      ["contract", "registry"],
    );
    await registry.press("i");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert.equal(await page.locator("#interactive-inspect-title").textContent(), "Client registry");
    assert.deepEqual(errors, []);
    await assertAccessible(page, "selected declaration reading");
  },
);
