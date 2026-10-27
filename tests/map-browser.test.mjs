import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { deliverMap, mapDocument } from "../packages/publisher/src/map/archify.mjs";
import { loadModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  BROWSER_USE_MODEL,
  CONTEXT_MODE_MODEL,
  temporaryDirectory,
} from "./fixtures/models.mjs";

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

test("delivered maps draw component labels at the 14 px floor at 1440 × 900", async (t) => {
  const browser = await launch(t);
  if (browser) {
    t.after(() => browser.close());
    for (const file of [AIGW_MODEL, BIG_BANK_MODEL, CONTEXT_MODE_MODEL, BROWSER_USE_MODEL]) {
      const { model } = await loadModel(file);
      const views = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
      const directory = await temporaryDirectory("archpub-map-browser-");
      t.after(() => fs.rm(directory, { recursive: true, force: true }));
      const { output } = await deliverMap(
        mapDocument(model, views, { state: "none", records: [] }),
        directory,
      );
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(pathToFileURL(output).href);
      await page.waitForSelector("text[data-node-label]");
      const sizes = await page.evaluate(() =>
        [...globalThis.document.querySelectorAll("text[data-node-label]")].map((element) => {
          const matrix = /** @type {SVGGraphicsElement} */ (element).getScreenCTM();
          return (matrix?.a ?? 0) * Number.parseFloat(element.getAttribute("font-size") ?? "0");
        }),
      );
      assert.equal(sizes.length, model.components.length, file);
      assert.ok(Math.min(...sizes) >= 14, `${file} draws a label at ${Math.min(...sizes)} px`);
      await page.close();
    }
  }
});
