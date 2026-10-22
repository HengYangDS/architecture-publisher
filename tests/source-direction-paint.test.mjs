import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { assembleArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { meaningFor, compose } from "./fixtures/authored-routes.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";

test(
  "a source-direction arrow paints its marker without repainting the shared physical segment",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""), timeout: 60_000 },
  async (t) => {
    const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-marker-ink-")));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const input = structuredClone(meaningFor("interactive"));
    for (const selection of input.native.selections)
      for (const relation of selection.members.relations)
        if (relation.id === "request") relation.direction = "bidirectional";
    const texts = input.refinement.media.interactive.pages[0].scene.texts;
    const measure = await createBundledTextMeasurer(await loadBundledFonts(), texts);
    for (const text of texts) text.box = measure.box(text);
    const pageScene = compose(input, "interactive").pages[0];
    const rendered = await assembleArchitectureScene(pageScene.scene, {
      exploration: pageScene.exploration,
    });
    const file = path.join(root, "architecture.html");
    await fs.writeFile(file, rendered.bytes);
    const browser = await browserLifetime(t).acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const source = await browser.newPage({
      viewport: { width: 1200, height: 760 },
      reducedMotion: "reduce",
    });
    await source.goto(pathToFileURL(file).href, { waitUntil: "load" });
    await source.locator("[data-source-direction-marker]").waitFor({ state: "attached" });
    assert.equal(await source.locator("[data-literal-segment-id]").count(), 3);
    const paint = await source.evaluate(async () => {
      const marker = globalThis.document.querySelector("[data-source-direction-marker]");
      const line = marker.ownerSVGElement.querySelector('[data-literal-segment-id="approach"]');
      const definition = globalThis.document.getElementById("arrowhead-start");
      const clonePaint = (element) => {
        const clone = element.cloneNode(true);
        const originals = [element, ...element.querySelectorAll("*")];
        const copies = [clone, ...clone.querySelectorAll("*")];
        for (let index = 0; index < originals.length; index++)
          for (const property of ["stroke", "fill"])
            copies[index].style.setProperty(
              property,
              globalThis.getComputedStyle(originals[index])[property],
            );
        return clone.outerHTML;
      };
      const mutant = marker.cloneNode(true);
      mutant.style.stroke = globalThis.getComputedStyle(line).stroke;
      const bodies = [clonePaint(marker), mutant.outerHTML];
      const result = [];
      for (const body of bodies) {
        const url = URL.createObjectURL(
          new Blob(
            [
              `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="500" viewBox="0 0 960 500"><defs>${clonePaint(definition)}</defs>${body}</svg>`,
            ],
            { type: "image/svg+xml" },
          ),
        );
        try {
          const image = new globalThis.Image();
          image.src = url;
          await image.decode();
          const canvas = globalThis.document.createElement("canvas");
          canvas.width = 960;
          canvas.height = 500;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          result.push({
            line: [...context.getImageData(200, 196, 160, 8).data],
            arrow: [...context.getImageData(154, 194, 9, 4).data],
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      return result;
    });
    const ink = (pixels) => pixels.filter((_, index) => index % 4 === 3).some((alpha) => alpha > 0);
    assert.equal(ink(paint[0].line), false, "the added carrier cannot paint the physical line");
    assert.equal(ink(paint[0].arrow), true, "the added source marker must have visible ink");
    assert.equal(
      ink(paint[1].line),
      true,
      "a visible-stroke mutant must expose the original defect",
    );
  },
);
