import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;

const runBrowser = { skip: !path.isAbsolute(browserPath ?? "") };

test("native layout and type exploration share one canonical Legend", runBrowser, async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-legend-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "native.html");
  await renderArchitectureScene({
    scene: {
      schema: "architecture.interactive-scene/v1",
      id: "overview",
      title: "Typed architecture",
      subtitle: "One canonical type Legend",
      viewport: { width: 1200, height: 650 },
      nodes: [
        {
          id: "source",
          label: "Selected source",
          figureKind: "source",
          icon: "lucide:workflow",
          visualRole: "external",
          position: { x: 240, y: 180 },
          size: { width: 420, height: 160 },
        },
      ],
      groups: [],
      edges: [],
    },
    output,
  });
  const browser = browserLifetime(t).use(
    await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true }),
  );
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(pathToFileURL(output).href);
  await page.waitForFunction(() => Boolean(globalThis.Archify?.layoutStability));
  await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
  const observation = await page.evaluate(() => {
    const svg = globalThis.document.querySelector(".diagram-container > svg");
    const layoutLegend = svg.querySelector("[data-legend]");
    const explorationLegend = svg.querySelector("[data-legend-bridge]");
    return {
      found: Boolean(layoutLegend),
      shared: Boolean(layoutLegend && layoutLegend === explorationLegend),
      nodeKinds: [
        ...new Set(
          [...svg.querySelectorAll("g[data-node-id]")].map((node) =>
            node.getAttribute("data-node-kind"),
          ),
        ),
      ].sort(),
      legendKinds: [...(layoutLegend?.querySelectorAll("[data-legend-kind]") ?? [])]
        .map((entry) => entry.getAttribute("data-legend-kind"))
        .sort(),
      textCount: layoutLegend?.querySelectorAll("text").length ?? 0,
    };
  });
  assert.equal(observation.found, true, JSON.stringify(observation));
  assert.equal(observation.shared, true, JSON.stringify(observation));
  assert.deepEqual(observation.legendKinds, observation.nodeKinds);
  assert.ok(observation.textCount >= observation.nodeKinds.length + 1);
});

test(
  "native Legend columns remain aligned across wrapped rows and offered appearances",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-legend-grid-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const kinds = [
      "contract",
      "carrier",
      "verdict",
      "execution",
      "selection",
      "repository_state",
      "durable_root",
      "recovery",
      "observation",
      "capability",
      "projection",
      "repository",
    ];
    const icons = [
      "layers",
      "files",
      "scale",
      "cpu",
      "list-filter",
      "git-branch",
      "database",
      "rotate-ccw",
      "eye",
      "plug",
      "panels-top-left",
      "folder-git-2",
    ];
    const scene = {
      schema: "architecture.interactive-scene/v1",
      id: "legend-grid",
      title: "Declared figure kinds",
      subtitle: "Exact source roles use one measured figure key",
      viewport: { width: 1200, height: 510 },
      typography: { minimumTextPx: 12 },
      nodes: kinds.map((kind, index) => ({
        id: "figure-" + index,
        label: "Figure " + index,
        figureKind: kind,
        icon: "lucide:" + icons[index],
        visualRole: "external",
        position: { x: 48 + (index % 6) * 184, y: 92 + Math.floor(index / 6) * 148 },
        size: { width: 148, height: 88 },
      })),
      groups: [],
      edges: [],
    };
    const lifetime = browserLifetime(t);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const context = await lifetime.acquire(() =>
      browser.newContext({ viewport: { width: 1600, height: 1100 } }),
    );
    const errors = [];
    for (const typed of [true, false]) {
      const input = structuredClone(scene);
      if (!typed) delete input.typography;
      const output = path.join(root, typed ? "typed.html" : "native-default.html");
      await renderArchitectureScene({
        scene: input,
        exploration: {
          nodes: scene.nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
          relations: [],
          limits: [],
        },
        output,
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setContent(await fs.readFile(output, "utf8"), { waitUntil: "load" });
      for (const style of ["classic", "signal-flow", "blueprint", "editorial"])
        for (const theme of ["light", "dark"]) {
          await page.evaluate(
            ({ style, theme }) => {
              globalThis.Archify.preset.apply(style);
              if (globalThis.document.documentElement.getAttribute("data-theme") !== theme)
                globalThis.document.getElementById("btn-theme").click();
            },
            { style, theme },
          );
          assert.equal(await page.locator("html").getAttribute("data-preset"), style);
          assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
          await page.evaluate(async () => {
            await globalThis.document.fonts.ready;
            await globalThis.Archify.layoutStability.whenStable();
          });
          const entries = await page.locator("[data-legend-kind]").evaluateAll((items) =>
            items.map((entry) => ({
              kind: entry.getAttribute("data-legend-kind"),
              x: Number(entry.getAttribute("data-legend-x")),
              baseline: Number(entry.getAttribute("data-legend-baseline")),
              labelX: Number(entry.querySelector("text").getAttribute("x")),
              text: entry.querySelector("text").textContent,
            })),
          );
          assert.deepEqual(
            entries.map(({ kind }) => kind),
            kinds,
          );
          assert.deepEqual(
            entries.map(({ text }) => text),
            kinds,
          );
          const baselines = [...new Set(entries.map(({ baseline }) => baseline))];
          assert(baselines.length > 1, "the complete legend exercises more than one row");
          const rows = baselines.map((baseline) =>
            entries.filter((entry) => entry.baseline === baseline),
          );
          for (const row of rows) {
            const gaps = row.slice(1).map((entry, index) => entry.x - row[index].x);
            assert(
              gaps.every((gap) => Math.abs(gap - gaps[0]) < 0.01),
              "Every consecutive icon rail uses the same horizontal advance",
            );
          }
          assert(
            rows.every((row) => row.length === rows[0].length),
            "complete rows share a balanced column count",
          );
          for (const row of rows.slice(1)) {
            assert.deepEqual(
              row.map(({ x }) => x),
              rows[0].map(({ x }) => x),
              "icon columns must not drift with the previous label length",
            );
            assert.deepEqual(
              row.map(({ labelX }) => labelX),
              rows[0].map(({ labelX }) => labelX),
              "type-label anchors share the same columns",
            );
          }
          const geometry = await page.locator("[data-legend-kind]").evaluateAll((items) =>
            items.map((entry) => ({
              hit: entry.querySelector("[data-legend-hit]").getBoundingClientRect().toJSON(),
              icon: entry.querySelector("[data-semantic-sigil]").getBoundingClientRect().toJSON(),
              label: entry.querySelector("text").getBoundingClientRect().toJSON(),
            })),
          );
          for (const entry of geometry) {
            assert(
              entry.icon.right + 3 <= entry.label.left,
              "native glyph stays before its complete type label",
            );
            for (const box of [entry.icon, entry.label]) {
              assert(
                box.left >= entry.hit.left &&
                  box.right <= entry.hit.right &&
                  box.top >= entry.hit.top &&
                  box.bottom <= entry.hit.bottom,
                "the native hit target covers complete ink",
              );
            }
          }
          for (const [index, entry] of geometry.entries())
            for (const other of geometry.slice(index + 1)) {
              assert(
                entry.hit.right + 8 <= other.hit.left ||
                  other.hit.right + 8 <= entry.hit.left ||
                  entry.hit.bottom + 8 <= other.hit.top ||
                  other.hit.bottom + 8 <= entry.hit.top,
                `legend target spacing is independent of row wrapping: ${JSON.stringify({ style, theme, entry: entry.hit, other: other.hit })}`,
              );
            }
        }
      await page.close();
    }
    assert.deepEqual(errors, []);
  },
);
