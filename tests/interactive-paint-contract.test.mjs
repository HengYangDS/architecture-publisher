import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { paintedContactCounts } from "./fixtures/painted-contact.mjs";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { inspectRgbaPngCanvas } from "../packages/publisher/src/qualification/static/png.mjs";
import { browserExecutable, assertGraphicPaint } from "./fixtures/interactive-paint-contract.mjs";

const runBrowser = { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 120_000 };

async function nativePage(t, scene) {
  const candidate = await renderInteractiveEditionHtml(scene);
  const browser = await browserLifetime(t).acquire(() =>
    chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 10_000,
    }),
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(candidate.bytes.toString(), { waitUntil: "load" });
  const member = await selectedInteractiveMember(page, "overview");
  await member.locator(".diagram-container > svg").waitFor();
  await member.evaluate(() => globalThis.Archify.layoutStability.whenStable());
  return { browser, page, member, errors };
}

test(
  "actual SVG glyphs, route strokes, and arrowheads preserve the exact grouped cyclic scene",
  runBrowser,
  async (t) => {
    const scene = interactiveEditionScene();
    const first = scene.pages[0];
    const nodeTemplate = first.nodes[0],
      edgeTemplate = first.relations[0];
    first.nodes = ["Alpha", "Beta", "Gamma"].map((label, index) => ({
      ...nodeTemplate,
      id: `source-${index}`,
      label,
    }));
    first.relations = [
      [0, 1, "selects"],
      [0, 1, "observes"],
      [1, 2, "controls"],
      [2, 0, "returns"],
      [2, 2, "retries"],
    ].map(([from, to, label], index) => ({
      ...edgeTemplate,
      id: `relation-${index}`,
      direction: index === 0 ? "bidirectional" : "forward",
      label,
      from: { namespace: nodeTemplate.namespace, id: first.nodes[from].id },
      to: { namespace: nodeTemplate.namespace, id: first.nodes[to].id },
    }));
    first.groups = [
      {
        id: "source",
        label: "Source ownership",
        elements: first.nodes.slice(0, 1).map(({ namespace, id }) => ({ namespace, id })),
      },
      {
        id: "execution",
        label: "Execution",
        elements: first.nodes.slice(1).map(({ namespace, id }) => ({ namespace, id })),
      },
    ];
    first.sourceAssertionCarriers[0].nodeRefs = first.nodes.map(({ namespace, id }) => ({
      namespace,
      id,
    }));
    first.sourceAssertionCarriers[0].relationRefs = first.relations.map(({ id, origin }) => ({
      namespace: origin.namespace,
      reference: id,
      sha256: origin.sha256,
    }));
    const { browser, member, errors } = await nativePage(t, scene);
    assert.deepEqual(await member.locator("g[data-node-id] text").allTextContents(), [
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    assert.deepEqual(
      await member.locator("[data-intrinsic-relation-label] text").allTextContents(),
      first.relations.map(({ label }) => label),
    );
    const graphic = await member.locator(".diagram-container > svg").evaluate((element) => {
      const clone = element.cloneNode(true);
      clone.removeAttribute("style");
      for (const overlay of clone.querySelectorAll(
        "[data-relationship-hit-overlay],[data-legend-bridge-runtime]",
      ))
        overlay.remove();
      return clone.outerHTML;
    });
    const styles = await member.locator("style").allTextContents();
    const appearance = await member
      .locator("html")
      .evaluate((el) => ({ style: el.dataset.style, theme: el.dataset.theme }));
    const dimensions = await member
      .locator("svg")
      .first()
      .evaluate((svg) => ({
        width: Math.ceil(svg.viewBox.baseVal.width),
        height: Math.ceil(svg.viewBox.baseVal.height),
      }));
    const layers = await browser.newPage({ viewport: dimensions, deviceScaleFactor: 1 });
    await layers.setContent(
      `<!doctype html><html data-style="${appearance.style}" data-theme="${appearance.theme}"><head><style>${styles.join("\n")}html,body,svg{background:transparent!important}html,body{margin:0!important;padding:0!important}svg{display:block!important;transform:none!important;width:${dimensions.width}px!important;height:${dimensions.height}px!important}.legend{transform:none!important}</style><style id="mask-mode"></style></head><body>${graphic}</body></html>`,
    );
    await layers.evaluate(() => globalThis.document.fonts.ready);
    const expected = await layers.evaluate(() => {
      const svg = globalThis.document.querySelector("svg");
      const labels = [...svg.querySelectorAll("text")].map((el) => ({
        text: el.textContent,
        x: el.getAttribute("x"),
        y: el.getAttribute("y"),
        fontSize: el.getAttribute("font-size"),
        weight: el.getAttribute("font-weight"),
      }));
      const frame = (element, id, selector) => ({
        id,
        selector,
        x: Number(element.getAttribute("x")),
        y: Number(element.getAttribute("y")),
        width: Number(element.getAttribute("width")),
        height: Number(element.getAttribute("height")),
      });
      const nodes = [...svg.querySelectorAll("g[data-node-id]")].map((el) =>
        frame(
          el.querySelector("rect:not(.c-mask)"),
          el.dataset.nodeId,
          `g[data-node-id="${el.dataset.nodeId}"]>rect:not(.c-mask)`,
        ),
      );
      const groups = [...svg.querySelectorAll("rect[data-group-id]")].map((el) =>
        frame(el, el.dataset.groupId, `rect[data-group-id="${el.dataset.groupId}"]`),
      );
      const relations = [...svg.querySelectorAll("path[data-composition-points]")].map((el) => ({
        id: el.dataset.edgeId,
        selector: `path[data-composition-points][data-edge-id="${el.dataset.edgeId}"]`,
        points: el.dataset.compositionPoints.split(";").map((value) => {
          const [x, y] = value.split(",").map(Number);
          return { x, y };
        }),
        markers: ["marker-start", "marker-end"].flatMap((property) => {
          const id = el.getAttribute(property)?.match(/url\(#([^)]*)\)/u)?.[1];
          if (!id) return [];
          const marker = globalThis.document.getElementById(id);
          return [
            {
              property,
              refX: Number(marker.getAttribute("refX")),
              width: Number(marker.getAttribute("markerWidth")),
              height: Number(marker.getAttribute("markerHeight")),
              scale:
                marker.getAttribute("markerUnits") === "userSpaceOnUse"
                  ? 1
                  : Number(el.getAttribute("stroke-width")),
            },
          ];
        }),
      }));
      const matrix = svg.getScreenCTM();
      return {
        labels,
        nodes,
        groups,
        relations,
        matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
        clippedText: [...svg.querySelectorAll("text")]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return (
              b.left < 0 ||
              b.top < 0 ||
              b.right > globalThis.innerWidth ||
              b.bottom > globalThis.innerHeight
            );
          })
          .map((el) => el.textContent),
      };
    });
    assert.deepEqual(expected.matrix, [1, 0, 0, 1, 0, 0]);
    assert.deepEqual(expected.clippedText, []);
    assert.equal(expected.nodes.length, 3);
    assert.equal(expected.relations.length, 5);
    assert.equal(expected.relations[0].markers.length, 2);
    const { textLayer, markLayer } = await assertGraphicPaint(browser, layers, expected);
    const analysis = await browser.newPage();
    assert.deepEqual(await paintedContactCounts(analysis, textLayer, markLayer), {
      contact: 0,
      withinTwoPixels: 0,
    });
    for (const [css, reason] of [
      ["[data-intrinsic-relation-label]{opacity:0!important}", "missing painted glyph"],
      ["path[data-composition-points]{stroke:transparent!important}", "missing painted route"],
      ["svg marker polygon{fill:transparent!important}", "missing painted arrow"],
      ["g[data-node-id]>rect:not(.c-mask){stroke:transparent!important}", "missing painted frame"],
    ]) {
      const defect = await layers.addStyleTag({ content: css });
      try {
        await assert.rejects(assertGraphicPaint(browser, layers, expected), (error) =>
          error.message.includes(reason),
        );
      } finally {
        await defect.evaluate((el) => el.remove());
      }
    }
    const caption = layers.locator("[data-intrinsic-relation-label] text").first();
    const originalCaption = await caption.textContent();
    await caption.evaluate((el) => {
      el.textContent = el.textContent.slice(0, 1);
    });
    await assert.rejects(assertGraphicPaint(browser, layers, expected), /painted text differs/u);
    await caption.evaluate((el, text) => {
      el.textContent = text;
    }, originalCaption);
    await layers.evaluate(() => {
      const svg = globalThis.document.querySelector("svg"),
        box = svg.querySelector("text").getBBox();
      const line = globalThis.document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute(
        "d",
        `M ${box.x} ${box.y + box.height / 2} L ${box.x + box.width} ${box.y + box.height / 2}`,
      );
      line.setAttribute("stroke", "#24362e");
      line.setAttribute("stroke-width", "3");
      svg.append(line);
    });
    const detected = await paintedContactCounts(
      analysis,
      textLayer,
      await layers.screenshot({ omitBackground: true }),
    );
    assert(detected.contact > 0);
    assert(detected.withinTwoPixels >= detected.contact);
    assert.deepEqual(errors, []);
  },
);

test(
  "neutral production-size labels paint within renderer-native shaped ink under one text profile",
  runBrowser,
  async (t) => {
    const scene = interactiveEditionScene();
    scene.pages[0].nodes[0].label = "AV office ffi -> ==";
    scene.pages[0].nodes[1].label = "Exact output";
    for (const relation of scene.pages[0].relations) relation.label = "ffi -> ==";
    const { browser, member, errors } = await nativePage(t, scene);
    const observed = await member
      .locator("g[data-node-id] text,[data-intrinsic-relation-label] text")
      .evaluateAll((texts) =>
        texts.map((el) => ({
          text: el.textContent,
          fontSize: Number(el.getAttribute("font-size")),
          weight: el.getAttribute("font-weight"),
          family: globalThis.getComputedStyle(el).fontFamily.replaceAll('"', ""),
          anchor: el.getAttribute("text-anchor"),
          x: 300,
          baseline: 120,
          emitted: el.outerHTML,
          profile: {
            rendering: globalThis.getComputedStyle(el).textRendering,
            synthesis: globalThis.getComputedStyle(el).fontSynthesis,
            whitespace: globalThis.getComputedStyle(el).whiteSpace,
          },
        })),
      );
    assert.deepEqual(
      observed.map(({ text }) => text),
      ["AV office ffi -> ==", "Exact output", "ffi -> =="],
    );
    const measure = await createBundledTextMeasurer(await loadBundledFonts(), observed);
    const styles = await member.locator("style").allTextContents();
    const inkPage = await browser.newPage({ viewport: { width: 600, height: 180 } });
    const assertInk = (observed, expected) => {
      const detail = JSON.stringify({ observed, expected });
      assert(Math.abs(observed.left - expected.x) <= 1.1, `native ink left: ${detail}`);
      assert(Math.abs(observed.top - expected.y) <= 1.1, `native ink top: ${detail}`);
      assert(
        Math.abs(observed.right + 1 - expected.x - expected.width) <= 1.1,
        `native ink right: ${detail}`,
      );
      assert(
        Math.abs(observed.bottom + 1 - expected.y - expected.height) <= 1.1,
        `native ink bottom: ${detail}`,
      );
    };
    let probed = false;
    for (const label of observed) {
      assert.equal(label.profile.rendering, "geometricprecision");
      assert.equal(label.profile.synthesis, "none");
      assert.equal(label.profile.whitespace, "pre");
      const text = label.emitted
        .replace(/\sx="[^"]+"/u, ' x="300"')
        .replace(/\sy="[^"]+"/u, ' y="120"');
      await inkPage.setContent(
        `<style>${styles.join("\n")}html,body,svg{background:transparent!important}html,body{margin:0!important;padding:0!important}svg{display:block!important;transform:none!important;width:600px!important;height:180px!important}svg text{fill:#111!important}</style><svg width="600" height="180" viewBox="0 0 600 180">${text}</svg>`,
      );
      await inkPage.evaluate(() => globalThis.document.fonts.ready);
      const paint = async () =>
        inspectRgbaPngCanvas(await inkPage.locator("svg").screenshot({ omitBackground: true }), {
          background: [0, 0, 0, 0],
          colorDistance: 0,
        }).envelope;
      const expected = measure.box(label);
      assertInk(await paint(), expected);
      if (!probed) {
        await inkPage.locator("text").evaluate((el) => el.setAttribute("x", "304"));
        const shifted = await paint();
        assert.throws(() => assertInk(shifted, expected), /native ink/u);
        probed = true;
      }
    }
    assert.equal(probed, true);
    assert.deepEqual(errors, []);
  },
);
