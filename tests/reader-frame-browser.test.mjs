import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sha } from "./fixtures/selected-native-edition.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/interactive-html.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import {
  browserOptions,
  runBrowser,
  authoredHtml,
  observeSystemTheme,
  geometry,
} from "./fixtures/reader-appearance.mjs";

test(
  "authored reader style is shared with its opaque frame and never replaced by source initialization",
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(html.toString(), { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "overview");
    await member.locator("svg").first().waitFor();
    assert.equal(
      await member.locator(".toolbar").isVisible(),
      true,
      "native presentation and export actions stay operable",
    );
    assert.equal(
      await page.locator("#interactive-style").count(),
      0,
      "an authored native preset has one control owner",
    );
    const publishedReader = await page
      .locator("#architecture-interactive-data")
      .evaluate((element) => JSON.parse(element.textContent).pages.overview.nativeReader);
    assert.equal(publishedReader, "archify/v1", "native ownership is an explicit adapter contract");
    const settle = async (style, theme) => {
      await page.waitForFunction(
        ({ style, theme }) => {
          const frame = globalThis.document.querySelector("#interactive-frame");
          return (
            frame?.dataset.page &&
            globalThis.document.documentElement.dataset.style === style &&
            globalThis.document.documentElement.dataset.theme === theme
          );
        },
        { style, theme },
        { timeout: 5000 },
      );
      await member.locator(`html[data-style="${style}"][data-theme="${theme}"]`).waitFor();
      await member.locator("html").evaluate(() => globalThis.Archify.layoutStability.whenStable());
    };
    const systemTheme = (theme) =>
      observeSystemTheme(member, theme, () => page.emulateMedia({ colorScheme: theme }));
    await settle("blueprint", "dark");
    await systemTheme("dark");
    await systemTheme("light");
    assert.equal(
      await member.locator("html").getAttribute("data-theme"),
      "dark",
      "a delivered system preference must not replace the explicit authored theme",
    );
    assert.equal(await member.locator("#theme-label").textContent(), "Dark");
    assert.equal(await member.locator("#btn-theme").getAttribute("aria-pressed"), "false");
    const baseline = await geometry(member, "svg text, [data-node-id], [data-edge-id]");
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await member.locator("#btn-preset").click();
        await member.locator(`[data-preset-value="${style}"]`).click();
        const currentTheme = await member.locator("html").getAttribute("data-theme");
        if (currentTheme !== theme) await member.locator("#btn-theme").click();
        await settle(style, theme);
        await systemTheme(theme === "light" ? "dark" : "light");
        assert.equal(
          await member.locator("html").getAttribute("data-theme"),
          theme,
          "native reader selection remains explicit in an opaque frame",
        );
        assert.deepEqual(
          await geometry(member, "svg text, [data-node-id], [data-edge-id]"),
          baseline,
        );
        const frameRoot = await member
          .locator("html")
          .evaluate((el) => globalThis.getComputedStyle(el).getPropertyValue("--bg").trim());
        const shellRoot = await page
          .locator("html")
          .evaluate((el) =>
            globalThis.getComputedStyle(el).getPropertyValue("--reader-paper").trim(),
          );
        assert.equal(frameRoot, shellRoot, "native paint remains the single palette owner");
        assert.equal(
          await member.locator("#theme-label").textContent(),
          theme === "dark" ? "Dark" : "Light",
        );
      }
    }
    await page.click("#interactive-inspect");
    await page.click("#interactive-inspect-back");
    await settle("signal-flow", "dark");
    assert.deepEqual(await geometry(member, "svg text, [data-node-id], [data-edge-id]"), baseline);
    assert.equal(
      await page.locator("#interactive-frame").getAttribute("sandbox"),
      "allow-scripts allow-downloads",
    );
    assert.deepEqual(errors, []);
  },
);

test(
  "native appearance follows current page frame and refuses predecessor messages",
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t, true);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await page.setContent(html.toString(), { waitUntil: "load" });
    const member = page.frameLocator("#interactive-frame");
    await member.locator("[data-interactive-member]").waitFor();
    await member.locator(".diagram-container > svg").waitFor();
    await page.evaluate(() => {
      globalThis.oldNativeWindow =
        globalThis.document.getElementById("interactive-frame").contentWindow;
    });
    await page.getByRole("button", { name: "Relations", exact: true }).click();
    await member.locator('[data-interactive-member="relations"]').waitFor();
    await member.locator(".diagram-container > svg").waitFor();
    await member.locator("#btn-theme").click();
    const selectedTheme = await member.locator("html").getAttribute("data-theme");
    await page.waitForFunction(
      (theme) => globalThis.document.documentElement.dataset.theme === theme,
      selectedTheme,
      { timeout: 2000 },
    );
    const framePalette = await member
      .locator("html")
      .evaluate((el) => globalThis.getComputedStyle(el).getPropertyValue("--bg").trim());
    assert.equal(
      await page
        .locator("html")
        .evaluate((el) =>
          globalThis.getComputedStyle(el).getPropertyValue("--reader-paper").trim(),
        ),
      framePalette,
    );
    const opposite = selectedTheme === "dark" ? "light" : "dark";
    await page.evaluate(
      ({ selectedTheme, opposite }) => {
        const frame = globalThis.document.getElementById("interactive-frame");
        const palette = {
          paper: "#ffffff",
          panel: "#ffffff",
          ink: "#000000",
          muted: "#111111",
          rule: "#222222",
          line: "#333333",
          accent: "#444444",
          onAccent: "#ffffff",
          soft: "#555555",
          cool: "#666666",
          control: "#777777",
          warm: "#888888",
          alert: "#999999",
        };
        const message = {
          type: "architecture-interactive:native-appearance",
          page: "relations",
          style: "classic",
          theme: opposite,
          palette,
        };
        globalThis.dispatchEvent(
          new globalThis.MessageEvent("message", {
            source: globalThis.oldNativeWindow,
            data: message,
          }),
        );
        if (globalThis.document.documentElement.dataset.theme !== selectedTheme)
          throw new Error("Predecessor altered current appearance");
        globalThis.dispatchEvent(
          new globalThis.MessageEvent("message", {
            source: frame.contentWindow,
            data: { ...message, page: "overview" },
          }),
        );
        if (globalThis.document.documentElement.dataset.theme !== selectedTheme)
          throw new Error("Wrong page altered current appearance");
      },
      { selectedTheme, opposite },
    );
    assert.equal(
      await page.locator("#interactive-frame").getAttribute("sandbox"),
      "allow-scripts allow-downloads",
    );
  },
);

test(
  "the composed native reader rejects infeasible literal geometry and preserves feasible desktop reading",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-reader-floor-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const scene = {
      schema: "architecture.interactive-scene/v1",
      id: "overview",
      title: "Independent source coordination",
      subtitle: "Fixed source geometry and native desktop reading",
      viewport: { width: 2160, height: 1290 },
      typography: { minimumTextPx: 12 },
      nodes: [
        {
          id: "origin",
          label: "Source coordination",
          detail: "An independent source owner",
          note: "Coordination does not grant permission",
          visualRole: "external",
          figureKind: "coordination",
          icon: "lucide:workflow",
          position: { x: 100, y: 240 },
          size: { width: 560, height: 160 },
        },
        {
          id: "destination",
          label: "Independent admission",
          detail: "An exact selected generation",
          note: "A separate decision and proof",
          visualRole: "backend",
          figureKind: "admission",
          icon: "lucide:shield-check",
          position: { x: 1500, y: 240 },
          size: { width: 560, height: 160 },
        },
      ],
      groups: [],
      edges: [
        {
          id: "request",
          from: "origin",
          to: "destination",
          label: "Request admission",
          visualRole: "emphasis",
          fromSide: "right",
          toSide: "left",
          route: "orthogonal-h",
          labelPlacement: { at: [1080, 180] },
          semanticIds: [JSON.stringify(["example/coordination", "relation", "request"])],
        },
      ],
    };
    const rejected = path.join(root, "infeasible.html");
    const original = structuredClone(scene);
    await assert.rejects(
      renderArchitectureScene({ scene, output: rejected }),
      (error) =>
        error.code === "render_native_rejected" &&
        error.diagnostics.some(({ code }) => code === "composition/desktop-readability"),
    );
    await assert.rejects(fs.stat(rejected), { code: "ENOENT" });
    assert.deepEqual(scene, original, "Refusal cannot rewrite literal geometry or source wording");
    scene.viewport.height = 1100;
    const before = structuredClone(scene);
    const output = path.join(root, "native.html");
    await renderArchitectureScene({
      scene,
      output,
      exploration: {
        nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
        relations: [
          {
            id: "request",
            reference: scene.edges[0].semanticIds[0],
            from: "origin",
            to: "destination",
            label: "Request admission",
            edgeId: "request",
          },
        ],
        limits: [],
      },
    });
    const content = await fs.readFile(output);
    const source = {
      id: "source",
      kind: "native",
      namespace: "example/coordination",
      sha256: "4".repeat(64),
      claimant: "fixture:source-owner",
    };
    const ids = ["origin", "destination", "request"];
    const html = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: scene.title,
      framing: "Source assertions and editorial presentation have separate owners.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: "2".repeat(64),
        semanticDigest: "3".repeat(64),
      },
      editionId: "native-reading",
      overview: "overview",
      sources: [source],
      pages: [
        {
          id: "overview",
          label: "Overview",
          shortLabel: "Overview",
          purpose: "overview",
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["source"],
          subjectSources: Object.fromEntries(ids.map((id) => [id, ["source"]])),
          content,
          facts: ids.map((id) => ({
            reference: JSON.stringify([
              source.namespace,
              id === "request" ? "relation" : "entity",
              id,
            ]),
            sourceSha256: source.sha256,
            graphicId: id,
            title: id,
            facts: [{ label: "Meaning", value: "Independent source coordination" }],
          })),
        },
      ],
      state: {
        qualification: "not-performed",
        humanAcceptance: "not-performed",
        publication: "not-performed",
      },
    });
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(html.toString(), { waitUntil: "load" });
    const frame = await (await page.locator("#interactive-frame").elementHandle()).contentFrame();
    await frame.waitForFunction(() => !!globalThis.Archify?.layoutStability);
    await frame.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    const observation = await frame.evaluate(() => {
      const svg = globalThis.document.querySelector(".diagram-container > svg");
      return {
        viewBox: svg.getAttribute("viewBox"),
        minimum: Number(svg.getAttribute("data-reader-min-text")),
        primary: Number(svg.getAttribute("data-reader-primary-text")),
        chrome: ["body", ".header", ".diagram-container", ".diagram-nav"].map((selector) => {
          const element = globalThis.document.querySelector(selector);
          const bounds = element.getBoundingClientRect();
          const style = globalThis.getComputedStyle(element);
          return {
            selector,
            top: bounds.top,
            bottom: bounds.bottom,
            height: bounds.height,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            css: element.style.cssText,
          };
        }),
        viewportHeight: globalThis.innerHeight,
        native: globalThis.Archify.viewerChromeLayout.receipt(),
        texts: [
          ...svg.querySelectorAll(
            'text[data-node-label], text[data-detail="context"], g[data-detail="context"] text, g[data-detail="fine"] text, [data-legend] > text, [data-legend-kind] > text',
          ),
        ].map((text) => {
          const matrix = text.getScreenCTM();
          return {
            text: text.textContent,
            projectedPx:
              parseFloat(globalThis.getComputedStyle(text).fontSize) *
              Math.hypot(matrix.a, matrix.b),
          };
        }),
        icons: [...svg.querySelectorAll("[data-semantic-sigil]")].map((icon) => {
          const box = icon.getBoundingClientRect();
          return {
            icon: icon.getAttribute("data-semantic-sigil"),
            projectedPx: Math.max(box.width, box.height),
          };
        }),
        navigation: (() => {
          const dock = globalThis.document.querySelector(".diagram-nav").getBoundingClientRect();
          const stage = svg.getBoundingClientRect();
          const gap = globalThis.Archify.viewerChromeLayout.receipt().gap;
          return {
            actualGap: dock.top - stage.bottom,
            requiredGap: gap,
            overlap:
              Math.max(0, Math.min(dock.right, stage.right) - Math.max(dock.left, stage.left)) *
              Math.max(0, Math.min(dock.bottom, stage.bottom) - Math.max(dock.top, stage.top)),
          };
        })(),
      };
    });
    assert.equal(observation.viewBox, "0 0 2160 1100");
    assert.equal(observation.minimum, 12);
    t.diagnostic(`Projected floor and actual dock: ${JSON.stringify(observation)}`);
    assert.ok(observation.texts.length >= 4, JSON.stringify(observation));
    assert.deepEqual(
      observation.texts.filter(({ projectedPx }) => projectedPx < 12 - 0.01),
      [],
      JSON.stringify(observation),
    );
    assert.equal(observation.icons.length, 4, JSON.stringify(observation));
    assert.deepEqual(
      observation.icons.filter(({ projectedPx }) => projectedPx < 12 - 0.01),
      [],
      JSON.stringify(observation),
    );
    assert.equal(observation.navigation.overlap, 0, JSON.stringify(observation.navigation));
    assert.ok(
      observation.navigation.actualGap >= observation.navigation.requiredGap - 1,
      JSON.stringify(observation.navigation),
    );
    await frame.evaluate(() =>
      globalThis.scrollTo({ top: globalThis.document.documentElement.scrollHeight }),
    );
    await frame.evaluate(async () => {
      await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));
      await globalThis.Archify.layoutStability.whenStable();
    });
    const reachedDock = await frame.evaluate(() => {
      const dock = globalThis.document.querySelector(".diagram-nav").getBoundingClientRect();
      const stage = globalThis.document
        .querySelector(".diagram-container > svg")
        .getBoundingClientRect();
      return {
        top: dock.top,
        bottom: dock.bottom,
        viewport: globalThis.innerHeight,
        stageGap: dock.top - stage.bottom,
      };
    });
    assert.ok(reachedDock.top >= 0, JSON.stringify(reachedDock));
    assert.ok(reachedDock.bottom <= reachedDock.viewport + 1, JSON.stringify(reachedDock));
    assert.ok(
      reachedDock.stageGap >= observation.navigation.requiredGap - 1,
      JSON.stringify(reachedDock),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(
      scene,
      before,
      "Feasible rendering retains exact literal geometry and wording",
    );
  },
);

test(
  "native camera accessible names include the visible readout after every action",
  runBrowser,
  async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent((await authoredHtml(t)).toString(), { waitUntil: "load" });
    const frame = page.frames().find((value) => value !== page.mainFrame());
    await frame.waitForFunction(() => Boolean(globalThis.Archify?.view));
    const control = frame.locator('[data-view="reset"]');
    for (const action of [null, "in", "in", "reset"]) {
      if (action) await frame.locator(`[data-view="${action}"]`).click();
      const name = await control.evaluate((element) => ({
        visible: element.innerText.replace(/\s+/gu, " ").trim(),
        accessible: element.getAttribute("aria-label"),
      }));
      assert(name.visible, JSON.stringify(name));
      assert(name.accessible.includes(name.visible), JSON.stringify(name));
      assert.match(name.accessible, /Reset diagram view/u);
    }
    const names = await frame.locator(".diagram-nav button").evaluateAll((elements) =>
      elements.map((element) => ({
        visible: element.innerText.replace(/\s+/gu, " ").trim().toLowerCase(),
        accessible: (element.getAttribute("aria-label") ?? "").toLowerCase(),
      })),
    );
    for (const name of names) assert(name.accessible.includes(name.visible), JSON.stringify(name));
  },
);
