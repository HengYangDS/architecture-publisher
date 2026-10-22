import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { selectedNativeEdition } from "./fixtures/selected-native-edition.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

test(
  "a resolved native canvas uses its content height instead of an empty automatic reader area",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 60_000 },
  async (t) => {
    const fixture = await selectedNativeEdition(t, { media: ["interactive"] });
    const output = path.join(fixture.root, "candidate");
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const bytes = await fs.readFile(path.join(output, "interactive/architecture.html"));
    const lifetime = browserLifetime(t);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      }),
    );
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await page.setContent(bytes.toString("utf8"), { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "overview");
    await member.evaluate(() => globalThis.Archify.layoutStability.whenStable());
    const layout = await member.evaluate(() => {
      const stage = globalThis.document.querySelector(".diagram-container");
      const svg = stage.querySelector(":scope > svg");
      const box = stage.getBoundingClientRect();
      const painted = svg.getBoundingClientRect();
      const style = globalThis.getComputedStyle(stage);
      const nav = stage.querySelector(".diagram-nav").getBoundingClientRect();
      const toolbar = globalThis.document.querySelector(".toolbar").getBoundingClientRect();
      const header = globalThis.document.querySelector(".header").getBoundingClientRect();
      return {
        stageHeight: box.height,
        svgHeight: painted.height,
        padding: Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom),
        borders:
          Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth),
        width: box.width,
        svgWidth: painted.width,
        svgTop: painted.top,
        svgBottom: painted.bottom,
        stageTop: box.top,
        navTop: nav.top,
        navBottom: nav.bottom,
        toolbarTop: toolbar.top,
        toolbarBottom: toolbar.bottom,
        headerBottom: header.bottom,
        viewBox: svg.getAttribute("viewBox"),
        camera: globalThis.Archify.view.state(),
        nodes: stage.querySelectorAll("g[data-node-id]").length,
        relations: stage.querySelectorAll('[data-logical-relation="true"][data-edge-id]').length,
        firstNote: globalThis.document
          .querySelector(".card[data-note-card-id]")
          ?.getBoundingClientRect().top,
        stageBottom: box.bottom,
        viewportHeight: globalThis.innerHeight,
      };
    });
    assert(
      layout.stageHeight <= layout.svgHeight + layout.padding + layout.borders + 2,
      `resolved geometry must not acquire an empty automatic height reserve: ${JSON.stringify(layout)}`,
    );
    assert(layout.svgWidth / layout.width > 0.6, JSON.stringify(layout));
    assert(layout.stageBottom <= layout.viewportHeight, JSON.stringify(layout));
    assert(layout.navTop >= layout.svgBottom + 8, JSON.stringify(layout));
    assert(layout.navBottom <= layout.stageBottom + 1, JSON.stringify(layout));
    assert(layout.toolbarBottom <= layout.headerBottom + 1, JSON.stringify(layout));
    assert(layout.stageTop >= layout.toolbarBottom + 8, JSON.stringify(layout));
    assert.equal(layout.nodes, 2);
    assert.equal(layout.relations, 1);
    assert.deepEqual(layout.camera, { scale: 1, x: 0, y: 0, mode: "overview" });
    assert(layout.firstNote > layout.stageBottom, JSON.stringify(layout));
  },
);

test(
  "the exact built Candidate remains legible, accessible, and offline in Chrome",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 35_000 },
  async (t) => {
    const fixture = await selectedNativeEdition(t, { width: 1800 });
    const lifetime = browserLifetime(t);
    const output = path.join(fixture.root, "candidate");
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const bytes = await fs.readFile(path.join(output, "interactive/architecture.html"));
    const svg = await fs.readFile(path.join(output, "static/architecture.svg"));
    const server = http.createServer((request, response) => {
      if (!["/architecture.html", "/architecture.svg"].includes(request.url)) {
        response.writeHead(404);
        response.end();
        return;
      }
      const isSvg = request.url === "/architecture.svg";
      response.writeHead(200, {
        "Content-Type": isSvg ? "image/svg+xml; charset=utf-8" : "text/html; charset=utf-8",
      });
      response.end(isSvg ? svg : bytes);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    lifetime.use(server);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      }),
    );
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route("**/*", (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    const response = await page.goto(`${origin}/architecture.html`, {
      waitUntil: "load",
      timeout: 15_000,
    });
    assert.equal(response.status(), 200);
    const member = await selectedInteractiveMember(page, "overview");
    member.on("pageerror", (error) => errors.push(error.message));
    await member.evaluate(() => globalThis.Archify.layoutStability.whenStable());
    const desktopLayout = await member.evaluate(() => {
      const container = globalThis.document.querySelector(".diagram-container");
      const graph = container.getBoundingClientRect();
      const viewport = container.querySelector(':scope > svg[data-diagram-type="architecture"]');
      const painted = viewport.getBoundingClientRect();
      const boundary = globalThis.document
        .querySelector('.card[data-note-card-id="reading-boundary"]')
        ?.getBoundingClientRect();
      const notes = globalThis.document
        .querySelector(".card[data-note-card-id]")
        ?.getBoundingClientRect();
      return {
        graphWidth: graph.width,
        paintedWidth: painted.width,
        camera: globalThis.Archify.view.state(),
        viewBox: viewport.getAttribute("viewBox"),
        nodePositions: [...viewport.querySelectorAll("g[data-node-id]")].map((node) => {
          const rect = node.querySelector("rect");
          return {
            id: node.dataset.nodeId,
            position: {
              x: Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2,
              y: Number(rect.getAttribute("y")) + Number(rect.getAttribute("height")) / 2,
            },
          };
        }),
        graphBottom: graph.bottom,
        boundaryTop: boundary?.top ?? null,
        graphRight: graph.right,
        notesTop: notes?.top ?? null,
      };
    });
    assert(
      desktopLayout.paintedWidth / desktopLayout.graphWidth > 0.6,
      `the graph canvas has excessive empty width: ${JSON.stringify(desktopLayout)}`,
    );
    assert.deepEqual(desktopLayout.camera, { scale: 1, x: 0, y: 0, mode: "overview" });
    assert(
      desktopLayout.boundaryTop > desktopLayout.graphBottom,
      "reading limits must follow the graph",
    );
    assert(desktopLayout.notesTop > desktopLayout.graphBottom, "evidence must follow the graph");
    assert.equal(await page.locator(".chapters button").first().innerText(), "Overview");
    assert.equal(await page.getByRole("button", { name: "Overview", exact: true }).count(), 1);
    assert.equal(await page.locator("#interactive-page-label").innerText(), "What is connected?");
    assert.equal(await member.locator('.diagram-nav [data-view="reset"]').count(), 1);
    for (const id of ["n-0", "n-1"])
      assert.equal(
        await member.locator(`g[data-node-id="${id}"][data-inspect-id="${id}"]`).count(),
        1,
      );
    assert.equal(
      await member.locator('.diagram-container > svg[data-diagram-type="architecture"]').count(),
      1,
    );
    assert.equal(await member.locator(".diagram-container canvas").count(), 0);
    await page.addScriptTag({ content: axe.source });
    await member.addScriptTag({ content: axe.source });
    const accessible = async (surface) =>
      surface.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        }));
      });
    assert.deepEqual(await accessible(page), []);
    assert.deepEqual(await accessible(member), []);
    assert.deepEqual(errors, []);
    await page.goto(`${origin}/architecture.svg`, { waitUntil: "load", timeout: 15_000 });
    assert.equal(await page.locator("svg").count(), 1);
    for (const carrier of ["n-0", "n-1", "r-0"]) {
      const visible = await page
        .locator(`[data-graphic-id="${carrier}"] text, text[data-graphic-id="${carrier}"]`)
        .first()
        .evaluate((element) => {
          const bounds = element.getBBox();
          const style = globalThis.getComputedStyle(element);
          return bounds.width > 0 && bounds.height > 0 && style.visibility !== "hidden";
        });
      assert.equal(visible, true, `${carrier} must be painted text, not an ID alone`);
    }
    assert.doesNotMatch(await page.content(), /fixture\/model|fixture\/views/u);
    assert.deepEqual(errors, []);
  },
);
