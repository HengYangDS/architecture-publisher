import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { sha } from "./fixtures/selected-native-edition.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/interactive-html.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { browserOptions, runBrowser, contrast } from "./fixtures/reader-appearance.mjs";

test(
  "contrast observes browser paint rather than color serialization or logical paths",
  runBrowser,
  async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:white">
    <div style="padding:40px;background:linear-gradient(white,#eee)">
      <span id="gradient" style="font:32px sans-serif;color:black">Readable paint</span>
    </div>
    <div style="padding:40px;background:white">
      <span id="modern" style="font:32px sans-serif;color:color(srgb 0.2 0.4 0.6)">Native color</span>
      <span id="translucent" style="font:32px sans-serif;color:rgb(0 0 0 / 50%)">Translucent ink</span>
    </div>
    <svg width="800" height="100" style="background:white">
      <path id="visible" d="M 40 50 L 760 50" stroke="black" stroke-width="4"/>
      <path id="logical" d="M 40 70 L 760 70" stroke="none"/>
    </svg>
  </body></html>`);
    const before = await page.locator("body").innerHTML();
    const modern = await contrast(page, "#modern", "color", "#modern");
    assert(modern > 5.99 && modern < 6.01, `browser-resolved sRGB: ${modern}`);
    const gradient = await contrast(page, "#gradient", "color");
    assert(gradient > 17 && gradient < 21, `actual gradient background: ${gradient}`);
    const translucent = await contrast(page, "#translucent", "color");
    assert(translucent > 3.8 && translucent < 4.1, `actual alpha compositing: ${translucent}`);
    assert.equal(await contrast(page, "#visible", "stroke"), 21);
    await assert.rejects(contrast(page, "#logical", "stroke"), /not a painted color/u);
    assert.equal(await page.locator("body").innerHTML(), before);
  },
);

test(
  "Inspect card states preserve measured contrast in every offered appearance",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-inspect-contrast-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const source = {
      id: "source",
      kind: "native",
      namespace: "example/claims",
      sha256: "4".repeat(64),
      claimant: "fixture:owner",
    };
    const content = Buffer.from(
      '<!doctype html><html><head><title>Claims</title></head><body><div data-node-id="first">First</div><div data-node-id="second">Second</div></body></html>',
    );
    const html = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: "Selected meaning",
      framing: "Source-attributed statements for independent reading.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: "2".repeat(64),
        semanticDigest: "3".repeat(64),
      },
      editionId: "inspect-reading",
      overview: "overview",
      sources: [source],
      pages: [
        {
          id: "overview",
          label: "Claims",
          shortLabel: "Claims",
          purpose: "overview",
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["source"],
          content,
          subjectSources: { first: ["source"], second: ["source"] },
          facts: ["first", "second"].map((graphicId) => ({
            reference: JSON.stringify([source.namespace, "claim", graphicId]),
            sourceSha256: source.sha256,
            graphicId,
            title: graphicId === "first" ? "First statement" : "Second statement",
            facts: [{ label: "Value", value: "Exact selected meaning" }],
          })),
        },
      ],
      state: {
        qualification: "not-performed",
        humanAcceptance: "not-performed",
        publication: "not-performed",
      },
    });
    const file = path.join(root, "inspect.html");
    await fs.writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.locator("#interactive-inspect").click();
    const cards = page.locator("#interactive-inspect-index button");
    assert.equal(await cards.count(), 2);
    const observations = [];
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.document.documentElement.dataset.style = style;
            globalThis.document.documentElement.dataset.theme = theme;
          },
          { style, theme },
        );
        for (const state of ["idle", "hover", "selected", "keyboard-focus"]) {
          await cards.nth(1).click();
          await page.mouse.move(1500, 80);
          if (state === "hover") await cards.first().hover();
          if (state === "selected" || state === "keyboard-focus") {
            await cards.first().click();
            await page.mouse.move(1500, 80);
          }
          if (state === "keyboard-focus") {
            await cards.nth(1).press("Shift+Tab");
            assert(await cards.first().evaluate((item) => item.matches(":focus-visible")));
          }
          observations.push({
            style,
            theme,
            state,
            title: await contrast(
              page,
              "#interactive-inspect-index strong",
              "color",
              "#interactive-inspect-index button",
            ),
            detail: await contrast(
              page,
              "#interactive-inspect-index small",
              "color",
              "#interactive-inspect-index button",
            ),
          });
        }
      }
    }
    assert.deepEqual(
      observations.filter((item) => item.title < 4.5 || item.detail < 4.5),
      [],
      "Inspect title and detail must remain readable in every state, style and theme",
    );
    t.diagnostic(
      `Measured ${observations.length} Inspect states; minimum title ${Math.min(...observations.map((item) => item.title))}, minimum detail ${Math.min(...observations.map((item) => item.detail))}`,
    );
  },
);

test(
  "native relationship captions keep text contrast in every offered appearance",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-caption-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const output = path.join(root, "architecture.html");
    await renderArchitectureScene({
      output,
      scene: {
        schema: "architecture.interactive-scene/v1",
        id: "overview",
        title: "Source-bound relationship",
        subtitle: "The caption is content, not a decorative stroke.",
        viewport: { width: 960, height: 540 },
        nodes: [
          {
            id: "source",
            label: "Source",
            visualRole: "external",
            position: { x: 70, y: 180 },
            size: { width: 220, height: 100 },
          },
          {
            id: "target",
            label: "Target",
            visualRole: "backend",
            position: { x: 620, y: 180 },
            size: { width: 220, height: 100 },
          },
        ],
        groups: [],
        edges: [
          {
            id: "relationship",
            from: "source",
            to: "target",
            label: "hands off",
            visualRole: "default",
            fromSide: "right",
            toSide: "left",
            route: "straight",
          },
        ],
      },
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(await fs.readFile(output, "utf8"), { waitUntil: "load" });
    await page.waitForFunction(() => !!globalThis.Archify?.layoutStability);
    await page.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    const sourceGeometry = () =>
      page
        .locator(".diagram-container>svg text, .diagram-container>svg path")
        .evaluateAll((elements) =>
          elements.map((element) => ({
            text: element.textContent,
            path: element.getAttribute("d"),
            x: element.getAttribute("x"),
            y: element.getAttribute("y"),
            fontFamily: globalThis.getComputedStyle(element).fontFamily,
            fontSize: globalThis.getComputedStyle(element).fontSize,
            fontWeight: globalThis.getComputedStyle(element).fontWeight,
            width: element.getBBox().width,
            height: element.getBBox().height,
          })),
        );
    const baseline = await sourceGeometry();
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.Archify.preset.apply(style);
            if (globalThis.document.documentElement.dataset.theme !== theme)
              globalThis.Archify.theme.toggle();
          },
          { style, theme },
        );
        await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        const observed = await page.locator("text.t-edge-default").evaluate((element) => {
          const color = (value) =>
            value
              .match(/[\d.]+/gu)
              .slice(0, 3)
              .map(Number)
              .map((channel) => {
                const normalized = channel / 255;
                return normalized <= 0.04045
                  ? normalized / 12.92
                  : ((normalized + 0.055) / 1.055) ** 2.4;
              })
              .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
          const foreground = globalThis.getComputedStyle(element).fill;
          const background = globalThis.getComputedStyle(
            element.parentElement.querySelector("rect.c-mask"),
          ).fill;
          const left = color(foreground),
            right = color(background);
          const route = element.ownerDocument.querySelector(
            ".diagram-container>svg path.a-default",
          );
          const stroke = globalThis.getComputedStyle(route).stroke;
          const strokeLuminance = color(stroke);
          return {
            foreground,
            background,
            ratio: (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05),
            stroke,
            strokeRatio:
              (Math.max(strokeLuminance, right) + 0.05) / (Math.min(strokeLuminance, right) + 0.05),
          };
        });
        assert(observed.ratio >= 4.5, `${style}/${theme}: ${JSON.stringify(observed)}`);
        assert(observed.strokeRatio >= 3, `${style}/${theme}: ${JSON.stringify(observed)}`);
        assert.deepEqual(await sourceGeometry(), baseline);
      }
    }
  },
);

test(
  "native node labels and details retain contrast over layered fills in every appearance",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-node-contrast-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const output = path.join(root, "architecture.html");
    const roles = [
      "frontend",
      "backend",
      "database",
      "cloud",
      "security",
      "messagebus",
      "external",
    ];
    await renderArchitectureScene({
      output,
      scene: {
        schema: "architecture.interactive-scene/v1",
        id: "overview",
        title: "Node content contrast",
        subtitle: "Labels and details remain readable over their actual paint layers.",
        viewport: { width: 1080, height: 560 },
        nodes: roles.map((visualRole, index) => ({
          id: visualRole,
          label: `Native ${visualRole}`,
          detail: "Readable node detail",
          visualRole,
          position: { x: 60 + (index % 3) * 310, y: 70 + Math.floor(index / 3) * 150 },
          size: { width: 260, height: 100 },
        })),
        groups: [],
        edges: [],
      },
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(await fs.readFile(output, "utf8"), { waitUntil: "load" });
    await page.waitForFunction(() => !!globalThis.Archify?.layoutStability);
    await page.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    const failures = [];
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.Archify.preset.apply(style);
            if (globalThis.document.documentElement.dataset.theme !== theme)
              globalThis.Archify.theme.toggle();
          },
          { style, theme },
        );
        await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        const observations = await page
          .locator(".diagram-container>svg [data-node-id]>text")
          .evaluateAll((elements) => {
            const channels = (value) => {
              const values = value.match(/[\d.]+/gu)?.map(Number) ?? [];
              if (value.startsWith("color(srgb "))
                return values.map((channel, index) => (index < 3 ? channel * 255 : channel));
              if (!value.startsWith("rgb")) throw Error("Unobserved node color space");
              return values;
            };
            const over = (foreground, background, opacity = 1) => {
              const alpha = (foreground[3] ?? 1) * opacity;
              return foreground
                .slice(0, 3)
                .map((channel, index) => channel * alpha + background[index] * (1 - alpha));
            };
            const luminance = (value) =>
              value
                .map((channel) => {
                  const normalized = channel / 255;
                  return normalized <= 0.04045
                    ? normalized / 12.92
                    : ((normalized + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
                  0,
                );
            return elements.map((element) => {
              const node = element.parentElement;
              const layers = [...node.querySelectorAll(":scope>rect")].map((rect) => {
                const paint = globalThis.getComputedStyle(rect);
                const fill = channels(paint.fill);
                if (fill.length < 3 || Number(paint.opacity) !== 1)
                  throw Error("Node paint requires a different compositing observer");
                return { fill, opacity: Number(paint.fillOpacity) };
              });
              if (!layers.length || (layers[0].fill[3] ?? 1) * layers[0].opacity !== 1)
                throw Error("Node text has no observed opaque paint base");
              const surface = layers.reduce(
                (below, above) => over(above.fill, below, above.opacity),
                [0, 0, 0],
              );
              const text = globalThis.getComputedStyle(element);
              const foreground = luminance(
                over(channels(text.fill), surface, Number(text.fillOpacity)),
              );
              const background = luminance(surface);
              return {
                node: node.dataset.nodeId,
                text: element.textContent,
                foreground: text.fill,
                layers,
                surface,
                ratio:
                  (Math.max(foreground, background) + 0.05) /
                  (Math.min(foreground, background) + 0.05),
              };
            });
          });
        assert.equal(observations.length, roles.length * 2);
        failures.push(
          ...observations
            .filter(({ ratio }) => ratio < 4.5)
            .map((observation) => ({ style, theme, ...observation })),
        );
      }
    }
    assert.deepEqual(failures, [], JSON.stringify(failures));
  },
);
