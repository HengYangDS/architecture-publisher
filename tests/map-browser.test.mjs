import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { deliverExplainer, explainerPage } from "../packages/publisher/src/map/explainer.mjs";
import { loadModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { AIGW_MODEL, BIG_BANK_MODEL, temporaryDirectory } from "./fixtures/models.mjs";

/** The CI browser, or Playwright's own headless build; a developer machine without one skips. */
async function launch(t) {
  const executablePath = process.env.ARCHPUB_BROWSER_EXECUTABLE;
  try {
    return await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  } catch (error) {
    if (executablePath || process.env.CI === "true") throw error;
    t.skip(`no browser: ${String(/** @type {Error} */ (error).message).split("\n")[0]}`);
    return null;
  }
}

/** The projected size of each primary component label, in CSS px. */
const labelSizes = (/** @type {Element[]} */ labels) =>
  labels.map((element) => {
    const matrix = /** @type {SVGGraphicsElement} */ (element).getScreenCTM();
    return (matrix?.a ?? 0) * Number.parseFloat(element.getAttribute("font-size") ?? "0");
  });

// CI runs this test alone, right after installing the browser, to admit it
// before the suite.
test("the CI browser opens a standalone page", async (t) => {
  const browser = await launch(t);
  if (!browser) return;
  t.after(() => browser.close());
  const file = path.join(await temporaryDirectory(t, "archpub-browser-"), "index.html");
  await fs.writeFile(file, "<!doctype html><title>archpub</title><p>ready</p>\n");
  const page = await browser.newPage();
  await page.goto(pathToFileURL(file).href);
  assert.equal(await page.textContent("p"), "ready");
});

// Building two pages measures a few hundred candidate diagrams, each through
// Archify's own command line in processes of its own; on a hosted Windows
// runner that alone takes about five minutes.
const PAGE_BUILDS = 15 * 60 * 1000;

test(
  "delivered pages fit every preview and set component labels at 13.25 px there and 14 px in the full viewer at 1440 × 900",
  { timeout: PAGE_BUILDS },
  async (t) => {
    const browser = await launch(t);
    if (browser) {
      t.after(() => browser.close());
      for (const file of [AIGW_MODEL, BIG_BANK_MODEL]) {
        const { model } = await loadModel(file);
        const views = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
        const directory = await temporaryDirectory(t, "archpub-page-browser-");
        const explained = await explainerPage(model, views);
        const { output } = await deliverExplainer(explained, directory);
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
          reducedMotion: "reduce",
        });
        await page.goto(pathToFileURL(output).href);
        // The reader marks each preview once it has fitted it to its panel.
        await page.waitForFunction(() =>
          [...globalThis.document.querySelectorAll(".diagram-preview")].every(
            (preview) => /** @type {HTMLElement} */ (preview).dataset.diagramFit,
          ),
        );
        const sizes = await page.$$eval(".diagram-preview text[data-node-label]", labelSizes);
        assert.equal(
          sizes.length,
          views.reduce((sum, view) => sum + view.components.length, 0),
          file,
        );
        // Beside its steps a preview is drawn just wide enough for its 9-unit sublabels to reach
        // Archify's reading floor, three quarters of the 14.5 px body text: 11 / 9 × 10.875 px.
        assert.ok(
          Math.min(...sizes) >= 13.25,
          `${file} previews a label at ${Math.min(...sizes)} px`,
        );
        const fits = await page.$$eval(".diagram-preview", (previews) =>
          previews.map((preview) => /** @type {HTMLElement} */ (preview).dataset.diagramFit),
        );
        assert.deepEqual(new Set(fits), new Set(["fit"]), file);
        // A card shows a detail whole or not at all, and the steps carry every detail.
        const cut = await page.$$eval(
          ".diagram-preview text",
          (texts) => texts.filter((text) => text.textContent?.includes("…")).length,
        );
        assert.equal(cut, 0, `${file} cuts text in a preview`);
        const notices = await page.$$eval(
          ".diagram-fit-status",
          (statuses) =>
            statuses.filter((status) => !(/** @type {HTMLElement} */ (status).hidden)).length,
        );
        assert.equal(notices, 0, file);
        // The reader sets each preview beside its steps exactly where the choice
        // predicted it would.
        const beside = await page.$$eval(".guided", (guides) =>
          guides.map((guide) => guide.classList.contains("beside")),
        );
        assert.deepEqual(
          beside,
          explained.diagrams.map((diagram) => diagram.beside),
          file,
        );
        const diagrams = await page.$$eval("button[data-open-diagram]", (buttons) =>
          buttons.map((button) => /** @type {HTMLElement} */ (button).dataset.openDiagram),
        );
        assert.equal(diagrams.length, views.length, file);
        for (const id of diagrams) {
          await page.click(`button[data-open-diagram="${id}"]`);
          await page.waitForSelector(`#diagram-dialog[data-native-ready="true"] iframe`);
          const frame = await (await page.$("#diagram-dialog iframe"))?.contentFrame();
          assert.ok(frame, `${file} ${id} opens no viewer`);
          await frame.waitForSelector("text[data-node-label]");
          const full = await frame.$$eval("text[data-node-label]", labelSizes);
          assert.ok(
            Math.min(...full) >= 14,
            `${file} ${id} draws a label at ${Math.min(...full)} px`,
          );
          await page.click("#diagram-dialog [data-close-diagram]");
        }
        await page.close();
      }
    }
  },
);
