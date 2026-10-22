import assert from "node:assert/strict";
import http from "node:http";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { browserLifetime } from "./browser-lifetime.mjs";
import {
  interactiveDocument,
  interactivePage,
  selectedInteractiveMember,
  selectedSourceMember,
} from "./interactive-member.mjs";
import { geometry } from "./reader-appearance.mjs";

export async function verifyInstalledSelfReader(browserTest, html) {
  const data = interactiveDocument(html);
  assert.equal(data.order.length, 8);
  const lifetime = browserLifetime(browserTest);
  const server = lifetime.use(
    http.createServer((request, response) => {
      if (request.url === "/favicon.ico") return response.writeHead(204).end();
      if (request.url !== "/architecture.html") return response.writeHead(404).end();
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
    }),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await lifetime.acquire(() =>
    chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const open = async (viewport) => {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push(message.text());
    });
    await page.route("**/*", (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    await page.goto(`${origin}/architecture.html`, { waitUntil: "load" });
    return page;
  };
  const violations = async (frame) => {
    await frame.addScriptTag({ content: axe.source });
    return frame.evaluate(async () => {
      const result = await globalThis.axe.run(globalThis.document, {
        iframes: false,
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      }));
    });
  };
  const select = async (page, id) => {
    await page.getByRole("button", { name: data.pages[id].shortLabel, exact: true }).click();
    await page.waitForFunction(
      (label) => globalThis.document.getElementById("interactive-page-label").textContent === label,
      data.pages[id].label,
    );
    const frame = await selectedInteractiveMember(page, id);
    await frame.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    assert.equal(await frame.locator('.diagram-container > svg[role="group"]').count(), 1, id);
    return frame;
  };
  const page = await open({ width: 1440, height: 900 });
  assert.deepEqual(await violations(page), []);
  const inspector = page.locator("#interactive-inspector");
  const inspect = page.getByRole("button", { name: "Inspect", exact: true });
  for (const id of data.order) {
    const selected = data.pages[id];
    assert.equal(
      interactivePage(html, id).match(/<meta name="publication-reader" content="([^"]+)">/u)?.[1],
      "archify/v1",
      `${id}: the original reader owns this member`,
    );
    const frame = await select(page, id);
    assert.deepEqual(await violations(frame), [], `${id}: artwork accessibility`);
    await inspect.focus();
    await page.keyboard.press("Enter");
    await inspector.waitFor({ state: "visible" });
    assert.equal(await page.locator("#interactive-frame").getAttribute("aria-hidden"), "true");
    assert.equal(
      await page
        .locator("#interactive-frame")
        .evaluate((element) => globalThis.getComputedStyle(element).visibility),
      "hidden",
    );
    assert.equal(
      await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth),
      true,
    );
    assert.equal(
      await inspector.evaluate(() => {
        const basis = globalThis.document.getElementById("interactive-inspect-basis");
        const content = globalThis.document.getElementById("interactive-inspect-content");
        return Boolean(
          content.compareDocumentPosition(basis) & globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
        );
      }),
      true,
    );
    const index = page.locator("#interactive-inspect-index button");
    assert.equal(
      await index.count(),
      new Set(selected.facts.map(({ graphicId }) => graphicId)).size,
      id,
    );
    let reachableFacts = 0;
    for (let item = 0; item < (await index.count()); item += 1) {
      const target = index.nth(item);
      const graphicId = await target.getAttribute("data-graphic-id");
      await target.click();
      assert.equal(await target.getAttribute("aria-current"), "true");
      assert.equal(
        await target.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return (
            box.left >= 0 &&
            box.right <= globalThis.innerWidth &&
            box.top >= 0 &&
            box.bottom <= globalThis.innerHeight
          );
        }),
        true,
        `${id}/${graphicId}: reachable subject`,
      );
      const actual = await page
        .locator("#interactive-inspect-content > section > details")
        .evaluateAll((entries) =>
          entries.map((entry) => {
            const fields = [...entry.querySelector(":scope > dl").children];
            return {
              title: entry.querySelector(":scope > summary").textContent,
              facts: fields
                .filter((element) => element.tagName === "DT")
                .map((term) => {
                  const value = term.nextElementSibling;
                  return {
                    label: term.textContent,
                    value:
                      value.querySelector(".inspect-original-value > pre")?.textContent ??
                      value.textContent,
                  };
                }),
            };
          }),
        );
      const expected = selected.facts
        .filter((fact) => fact.graphicId === graphicId)
        .map(({ title, facts }) => ({ title, facts }));
      const sorted = (items) => items.map((item) => JSON.stringify(item)).sort();
      assert.deepEqual(sorted(actual), sorted(expected), `${id}/${graphicId}: exact source facts`);
      reachableFacts += actual.length;
    }
    assert.equal(reachableFacts, selected.facts.length, `${id}: all facts reachable`);
    await page.locator("#interactive-inspect-search").fill("no matching architecture subject");
    assert.equal(await page.locator("#interactive-inspect-index button:visible").count(), 0);
    assert.equal(await page.locator("#interactive-inspect-empty").isVisible(), true);
    await page.locator("#interactive-inspect-search").fill("");
    assert.equal(await page.locator("#interactive-inspect-empty").isVisible(), false);
    await index.first().click();
    assert.deepEqual(await violations(page), [], `${id}: Inspect accessibility`);
    await page.keyboard.press("Escape");
    assert.equal(await inspector.isVisible(), false);
    assert.equal(await inspect.getAttribute("aria-expanded"), "false");
    assert.equal(
      await inspect.evaluate((element) => globalThis.document.activeElement === element),
      true,
    );
    assert.equal(await page.locator("#interactive-frame").getAttribute("aria-hidden"), null);
    const figure = frame.locator('[data-inspect-id][tabindex="0"]').first();
    const graphicId = await figure.getAttribute("data-inspect-id");
    await figure.focus();
    await figure.press("i");
    await inspector.waitFor({ state: "visible" });
    const declaration = page
      .locator("#interactive-inspect-content > section > details")
      .filter({ has: page.locator(".inspect-source-diagram") })
      .first();
    if (!(await declaration.evaluate((element) => element.open)))
      await declaration.locator(":scope > summary").click();
    await declaration.locator(".inspect-source-diagram > summary").click();
    const native = declaration.locator("[data-source-reader-root]");
    const sourceFrame = await selectedSourceMember(page);
    const nativeFit = await native.evaluate((element) => {
      const diagram = element.getBoundingClientRect();
      const reading = element.closest(".inspect-reading-scroll").getBoundingClientRect();
      return { width: diagram.width, readingWidth: reading.width };
    });
    assert(
      nativeFit.width > nativeFit.readingWidth * 0.9,
      `${id}: native source diagram spans the complete reading column`,
    );
    const bindings = Object.values(data.sourceReading.pages[id].bindings);
    for (const [kind, attribute] of [
      ["entity", "data-node-id"],
      ["relation", "data-edge-id"],
    ]) {
      const expected = [
        ...new Set(bindings.filter((item) => item.kind === kind).map(({ id }) => id)),
      ];
      const actual = await sourceFrame
        .locator(`svg g[${attribute}]`)
        .evaluateAll(
          (elements, attribute) => elements.map((element) => element.getAttribute(attribute)),
          attribute,
        );
      assert.deepEqual(actual.sort(), expected.sort(), `${id}: exact native ${kind} carriers`);
    }
    await page.locator("#interactive-inspect-back").click();
    assert.equal(
      await native.evaluate((element) => element.childNodes.length),
      0,
      `${id}: native source reader unmounted on return`,
    );
    await frame.waitForFunction(
      (graphicId) =>
        globalThis.document.activeElement?.getAttribute("data-inspect-id") === graphicId,
      graphicId,
      { timeout: 5_000 },
    );
  }
  const readerPage = await open({ width: 1280, height: 720 });
  for (const id of data.order) {
    const frame = await select(readerPage, id);
    const shellFits = await readerPage.evaluate(() => {
      const frame = globalThis.document.getElementById("interactive-frame").getBoundingClientRect();
      return (
        frame.right <= globalThis.innerWidth + 1 &&
        frame.bottom <= globalThis.innerHeight + 1 &&
        globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth &&
        globalThis.document.documentElement.scrollHeight <= globalThis.innerHeight
      );
    });
    assert.equal(shellFits, true, `${id}: complete desktop publication`);
    const fit = await frame.evaluate(() => {
      const svg = globalThis.document.querySelector(".diagram-container > svg");
      const aperture = svg.getBoundingClientRect();
      const visible = (element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        );
      };
      const painted = [...svg.querySelectorAll("text,[data-inspect-id]")].filter(visible);
      const inside = (box) =>
        box.left >= aperture.left - 1 &&
        box.right <= aperture.right + 1 &&
        box.top >= aperture.top - 1 &&
        box.bottom <= aperture.bottom + 1;
      const boxes = painted.map((element) => element.getBoundingClientRect());
      const controls = [
        ...globalThis.document.querySelectorAll("button,input,select,summary"),
      ].filter(visible);
      return {
        textCount: painted.filter((element) => element.tagName === "text").length,
        nodeCount: painted.filter((element) => element.hasAttribute("data-inspect-id")).length,
        clipped: painted
          .filter((element) => !inside(element.getBoundingClientRect()))
          .map((element) => element.textContent),
        widthFill:
          (Math.max(...boxes.map((box) => box.right)) - Math.min(...boxes.map((box) => box.left))) /
          aperture.width,
        bottomGapRatio:
          (aperture.bottom - Math.max(...boxes.map((box) => box.bottom))) / aperture.height,
        completeCanvas:
          aperture.left >= 0 &&
          aperture.right <= globalThis.innerWidth + 1 &&
          aperture.top >= 0 &&
          aperture.bottom <= globalThis.innerHeight + 1,
        controlsFit: controls.every((element) => {
          const box = element.getBoundingClientRect();
          return (
            box.left >= 0 &&
            box.right <= globalThis.innerWidth + 1 &&
            box.top >= 0 &&
            box.bottom <= globalThis.innerHeight + 1
          );
        }),
        artworkClear: controls.every((element) => {
          const control = element.getBoundingClientRect();
          return boxes.every(
            (box) =>
              Math.min(box.right, control.right) <= Math.max(box.left, control.left) ||
              Math.min(box.bottom, control.bottom) <= Math.max(box.top, control.top),
          );
        }),
        completeMember:
          globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth &&
          globalThis.document.documentElement.scrollHeight <= globalThis.innerHeight,
      };
    });
    assert(fit.textCount > 0 && fit.nodeCount > 0, `${id}: meaningful complete diagram`);
    assert.deepEqual(fit.clipped, [], `${id}: complete painted text and carriers`);
    assert.equal(fit.completeCanvas, true, `${id}: canvas fits`);
    assert.equal(fit.controlsFit, true, `${id}: controls fit`);
    assert.equal(fit.artworkClear, true, `${id}: artwork clear of controls`);
    assert.equal(fit.completeMember, true, `${id}: no hidden overflow`);
    assert(fit.widthFill > 0.6, `${id}: meaningful fill ${fit.widthFill}`);
    if (id === "overview")
      assert(fit.bottomGapRatio <= 0.14, `overview: bottom gap ${fit.bottomGapRatio}`);
    const baseline = await geometry(
      frame,
      ".diagram-container > svg text, .diagram-container > svg [data-graphic-id]",
    );
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await frame.locator("#btn-preset").click();
        await frame.locator(`[data-preset-value="${style}"]`).click();
        if ((await frame.locator("html").getAttribute("data-theme")) !== theme)
          await frame.locator("#btn-theme").click();
        await frame.waitForFunction(
          ({ style, theme }) =>
            globalThis.document.documentElement.dataset.style === style &&
            globalThis.document.documentElement.dataset.theme === theme,
          { style, theme },
        );
        await frame.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        assert.deepEqual(
          await geometry(
            frame,
            ".diagram-container > svg text, .diagram-container > svg [data-graphic-id]",
          ),
          baseline,
          `${id}/${style}/${theme}: immutable artwork geometry`,
        );
        assert.deepEqual(
          await violations(frame),
          [],
          `${id}/${style}/${theme}: appearance accessibility`,
        );
      }
    }
  }
  assert.deepEqual(errors, []);
}
