import assert from "node:assert/strict";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { embedFonts } from "../packages/publisher/src/compiler/media.mjs";

import { chromium } from "playwright-core";

import { rasterizeBytes } from "../packages/publisher/renderers/resvg/public.mjs";

import { inspectRgbaPngCanvas } from "../packages/publisher/src/qualification/static/png.mjs";

import { assertGlyphPaintBounds, observeGlyphPaintEnvelope } from "./fixtures/font-paint.mjs";

test(
  "native shaped ink matches real Chrome paint and exported exact-font SVG",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-shaping-paint-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const fonts = await loadBundledFonts();
    const cases = ["400", "500", "600", "700"].flatMap((weight) =>
      ["AV", "office", "ffi", "->", "==", "A  B"].map((text) => ({
        text,
        weight,
        fontSize: 40,
        anchor: "start",
        x: 80,
        baseline: 120,
      })),
    );
    const measure = await createBundledTextMeasurer(fonts, cases);
    const xml = (text) =>
      text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const observations = [];
    for (const [index, label] of cases.entries()) {
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" xml:space="preserve" text-rendering="geometricPrecision" font-family="JetBrains Mono"><text x="${label.x}" y="${label.baseline}" font-size="${label.fontSize}" font-weight="${label.weight}">${xml(label.text)}</text></svg>`,
      );
      const bound = measure.box(label);
      const selected = fonts.fonts.filter(({ weight }) => String(weight) === label.weight);
      const exactSvg = embedFonts(svg, selected, fonts.license);
      await page.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${exactSvg.toString("utf8")}`,
      );
      await page.evaluate(() => globalThis.document.fonts.ready);
      const browserMetrics = await page.locator("text").evaluate((node) => {
        const style = globalThis.getComputedStyle(node);
        const context = globalThis.document.createElement("canvas").getContext("2d");
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const measurements = {};
        for (const rendering of ["auto", "geometricPrecision"]) {
          context.textRendering = rendering;
          const observed = context.measureText(node.textContent);
          measurements[rendering] = {
            left: observed.actualBoundingBoxLeft,
            right: observed.actualBoundingBoxRight,
            ascent: observed.actualBoundingBoxAscent,
            descent: observed.actualBoundingBoxDescent,
            width: observed.width,
          };
        }
        return {
          text: node.textContent,
          weight: style.fontWeight,
          loaded: globalThis.document.fonts.check(`${style.fontWeight} 40px "JetBrains Mono"`),
          family: style.fontFamily,
          rendering: style.textRendering,
          measurements,
        };
      });
      assert.equal(browserMetrics.text, label.text);
      assert.equal(browserMetrics.weight, label.weight);
      assert.equal(browserMetrics.loaded, true);
      assert(browserMetrics.family.includes("JetBrains Mono"));
      const chromeBytes = await page.locator("svg").screenshot({ omitBackground: true });
      const chrome = inspectRgbaPngCanvas(chromeBytes, {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      const output = path.join(root, `${index}.png`);
      await rasterizeBytes({
        svg,
        fonts: selected.map(({ weight, bytes }) => ({ weight, bytes, family: "JetBrains Mono" })),
        width: 600,
        output,
      });
      const native = inspectRgbaPngCanvas(await fs.readFile(output), {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      t.diagnostic(
        JSON.stringify({
          label,
          bound,
          browserMetrics,
          native: native.envelope,
          chrome: chrome.envelope,
        }),
      );
      for (const observed of [native, chrome]) {
        assert(observed.envelope.left > 0 && observed.envelope.top > 0);
        assert(observed.envelope.right < 599 && observed.envelope.bottom < 179);
      }
      {
        const scale = 4;
        const enlarged = svg
          .toString("utf8")
          .replace(
            'width="600" height="180"',
            `width="${600 * scale}" height="${180 * scale}" viewBox="0 0 600 180"`,
          );
        await page.setViewportSize({ width: 600 * scale, height: 180 * scale });
        await page.setContent(
          `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${embedFonts(Buffer.from(enlarged), selected, fonts.license).toString("utf8")}`,
        );
        await page.evaluate(() => globalThis.document.fonts.ready);
        const scaledChrome = await page.locator("svg").screenshot({ omitBackground: true });
        const scaledOutput = path.join(root, `${index}-scale-${scale}.png`);
        await rasterizeBytes({
          svg,
          fonts: selected.map(({ weight, bytes }) => ({ weight, bytes, family: "JetBrains Mono" })),
          width: 600 * scale,
          output: scaledOutput,
        });
        const nativeBytes = await fs.readFile(output);
        const scaledNative = await fs.readFile(scaledOutput);
        const sampledNative = await observeGlyphPaintEnvelope(page, scaledNative, scale);
        const sampledChrome = await observeGlyphPaintEnvelope(page, scaledChrome, scale);
        for (const observed of [sampledNative, sampledChrome]) {
          assert.equal(observed.width, 600 * scale);
          assert.equal(observed.height, 180 * scale);
        }
        t.diagnostic(
          JSON.stringify({
            sampling: "Exact selected SVG font bytes; independent alpha envelopes at 1x and 4x",
            label,
            outline: bound,
            browser: await browser.version(),
            deviceScaleFactor: await page.evaluate(() => globalThis.devicePixelRatio),
            native: await observeGlyphPaintEnvelope(page, nativeBytes),
            chrome: await observeGlyphPaintEnvelope(page, chromeBytes),
            scaledNative: sampledNative,
            scaledChrome: sampledChrome,
          }),
        );
        // Outline edges are continuous; raster footprints include both outer pixel edges.
        assertGlyphPaintBounds(sampledNative, bound, 1.1);
        assertGlyphPaintBounds(sampledChrome, bound, 1.1);
        if (label.weight === "400" && label.text === "A  B") {
          await page.locator("text").evaluate((node) => (node.textContent = "A B"));
          const collapsed = await observeGlyphPaintEnvelope(
            page,
            await page.locator("svg").screenshot({ omitBackground: true }),
            scale,
          );
          assert.throws(() => assertGlyphPaintBounds(collapsed, bound, 1.1), /right/u);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
      }
      observations.push({ label, bound, browserMetrics, native, chrome });
    }
    assert.equal(observations.length, cases.length);
    assert.deepEqual(errors, []);
  },
);
