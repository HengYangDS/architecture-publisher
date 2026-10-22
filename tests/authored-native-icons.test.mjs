import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { ref } from "./fixtures/authored-routes.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { editionFixture } from "./fixtures/edition.mjs";
import { semanticArchitectureProjections } from "../packages/publisher/src/scene/contract.mjs";
import { interactiveArchitectureScene } from "../packages/publisher/src/scene/interactive/architecture.mjs";

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;

const runBrowser = { skip: !path.isAbsolute(browserPath ?? "") };

test(
  "native icons remain decorative while Legend and Lens use explicit figure roles",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-type-marks-")));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const { model, edition } = editionFixture();
    const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
    const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
    const icons = ["lucide:notebook-pen", "lucide:notebook-pen", "lucide:panels-top-left"];
    for (const [index, node] of scene.nodes.entries()) {
      node.figureKind = index === 2 ? "scene" : "editorial project";
      node.icon = icons[index];
    }
    for (const edge of scene.edges) edge.semanticIds = [ref("relation", edge.id)];
    const exploration = {
      nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
      relations: scene.edges.map(({ id, from, to }) => ({
        id,
        reference: ref("relation", id),
        from,
        to,
        label: model.relations[id].type,
        edgeId: id,
      })),
      limits: [],
    };
    const output = path.join(root, "architecture.html");
    await renderArchitectureScene({ scene, exploration, output });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, "utf8"), { waitUntil: "load" });
    const typeMark = (locator, artwork, selector = null) =>
      locator.evaluate(
        (element, { artwork, labelSelector }) => {
          const style = globalThis.getComputedStyle(element, "::before");
          const mask = style.maskImage.match(/data:image\/svg\+xml;base64,([^"')]+)/u)?.[1];
          const parser = new globalThis.DOMParser();
          const drawing = mask
            ? parser.parseFromString(globalThis.atob(mask), "image/svg+xml").documentElement
            : null;
          const expected = parser.parseFromString(
            `<svg xmlns="http://www.w3.org/2000/svg">${artwork}</svg>`,
            "image/svg+xml",
          ).documentElement;
          // Native SVG equality avoids XML-versus-HTML serialization differences.
          // https://developer.mozilla.org/en-US/docs/Web/API/Node/isEqualNode
          const drawingMatches =
            Boolean(drawing) &&
            drawing.children.length > 0 &&
            drawing.children.length === expected.children.length &&
            [...drawing.children].every((child, index) =>
              child.isEqualNode(expected.children[index]),
            );
          const container = globalThis.getComputedStyle(element);
          const box = element.getBoundingClientRect();
          const range = globalThis.document.createRange();
          range.selectNodeContents(
            labelSelector ? element.querySelector(labelSelector) : element.lastChild,
          );
          const label = range.getBoundingClientRect();
          const width = Number.parseFloat(style.width);
          const iconRight =
            box.left +
            Number.parseFloat(container.borderLeftWidth) +
            Number.parseFloat(container.paddingLeft) +
            width;
          return {
            content: style.content,
            drawingMatches,
            width,
            height: Number.parseFloat(style.height),
            gap: label.left - iconRight,
            labelWidth: label.width,
          };
        },
        { artwork, labelSelector: selector },
      );
    const sourceKinds = [...new Set(exploration.nodes.map(({ kind }) => kind))];
    assert.deepEqual(
      await page
        .locator("[data-legend-kind]")
        .evaluateAll((entries) => entries.map((entry) => entry.getAttribute("data-legend-kind"))),
      sourceKinds,
    );
    for (const [index, member] of exploration.nodes.entries()) {
      const node = page.locator(`.diagram-container > svg [data-node-id="${member.id}"]`);
      assert.equal(await node.getAttribute("data-node-kind"), member.kind);
      assert.equal(await node.locator(".c-backend").count(), 1);
      assert.equal(await node.locator("[data-node-type]").count(), 0);
      assert.equal(
        await node.locator(`[data-semantic-sigil="${icons[index]}"]`).count(),
        icons[index] === "none" ? 0 : 1,
      );
      assert.doesNotMatch(await node.locator("title").textContent(), /Backend|Frontend|Security/i);
      await page.evaluate((id) => globalThis.Archify.focus.set(id, { toggle: false }), member.id);
      const passport = page.locator("#focus-kind");
      assert.equal((await passport.textContent()).trim().toLowerCase(), member.kind);
      const mark = await typeMark(
        passport,
        await node.locator("[data-semantic-sigil]").innerHTML(),
      );
      assert.equal(mark.content, '""', "a decorative CSS mark must add no accessible text");
      assert.equal(
        mark.drawingMatches,
        true,
        "Passport must preserve the exact source icon artwork",
      );
      assert.ok(mark.width >= 14 && mark.width <= 18, JSON.stringify(mark));
      assert.equal(mark.width, mark.height);
      assert.ok(mark.gap >= 4, "Passport glyph needs measured clearance before its type label");
      await page.evaluate(() => globalThis.Archify.focus.clear());
    }
    const legend = page.locator(`[data-legend-kind="${sourceKinds[0]}"]`);
    assert.deepEqual(
      await legend
        .locator("[data-semantic-sigil]")
        .evaluateAll((marks) => marks.map((mark) => mark.getAttribute("data-semantic-sigil"))),
      ["lucide:notebook-pen"],
    );
    assert.equal(await legend.getAttribute("data-legend-count"), "2");
    assert.equal(await legend.locator("[data-legend-count-badge]:visible").count(), 0);
    assert.equal(await legend.locator("text:visible").textContent(), "editorial project");
    assert.equal(await legend.getAttribute("aria-label"), "Inspect editorial project, 2 figures");
    await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
    const hitGeometry = await legend.evaluate((entry) => {
      const hit = entry.querySelector("[data-legend-hit]").getBoundingClientRect();
      const label = entry
        .querySelector("text:not([data-legend-bridge-runtime])")
        .getBoundingClientRect();
      const icons = [...entry.querySelectorAll("[data-semantic-sigil]")].map((mark) =>
        mark.getBoundingClientRect(),
      );
      const covers = (box) =>
        box.left >= hit.left &&
        box.right <= hit.right &&
        box.top >= hit.top &&
        box.bottom <= hit.bottom;
      const center = globalThis.document.elementFromPoint(
        (hit.left + hit.right) / 2,
        (hit.top + hit.bottom) / 2,
      );
      return {
        label: covers(label),
        icons: icons.every(covers),
        iconBeforeLabel: icons.every((icon) => icon.right + 3 <= label.left),
        iconsSeparated: icons.every(
          (icon, index) => !index || icons[index - 1].right + 3 <= icon.left,
        ),
        target: entry.contains(center),
      };
    });
    assert.deepEqual(hitGeometry, {
      label: true,
      icons: true,
      iconBeforeLabel: true,
      iconsSeparated: true,
      target: true,
    });
    const entrySpacing = await page.locator("[data-legend-kind]").evaluateAll((entries) => {
      const boxes = entries.map((entry) =>
        entry.querySelector("[data-legend-hit]").getBoundingClientRect(),
      );
      return boxes.slice(1).map((box, index) => box.left - boxes[index].right);
    });
    assert(
      entrySpacing.every((gap) => gap >= 8),
      `Legend targets collide: ${entrySpacing}`,
    );
    await legend.click();
    assert.equal(await page.locator("#semantic-lens").isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.match(await page.locator("#semantic-lens-status").textContent(), /2/);
    for (const member of exploration.nodes) {
      const kind = page.locator(`#semantic-lens-kinds [data-kind="${member.kind}"]`);
      const icon = member.kind === "scene" ? icons[2] : icons[0];
      assert.equal(await kind.locator(".semantic-lens-swatch:visible, em:visible").count(), 0);
      const source = page
        .locator(`.diagram-container > svg [data-semantic-sigil="${icon}"]`)
        .first();
      const mark = await typeMark(kind, await source.innerHTML(), "strong");
      assert.equal(mark.content, '""');
      assert.equal(mark.drawingMatches, true, "Lens must preserve the exact source icon artwork");
      assert.ok(mark.width >= 14 && mark.width <= 18, JSON.stringify(mark));
      assert.equal(mark.width, mark.height);
      assert.ok(mark.gap >= 4, "Lens glyph needs measured clearance before its type label");
      assert.ok(mark.labelWidth > 20, "Lens must reserve readable type-label space");
    }
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#semantic-lens").isVisible(), false);
    assert.equal(await legend.getAttribute("aria-pressed"), "true");
    await legend.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#semantic-lens").isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute("aria-pressed"),
      "false",
    );
    await page.keyboard.press("Escape");
    await legend.focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#semantic-lens").isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.evaluate(() => globalThis.Archify.semanticLens.clear({ closePanel: true }));
    await page.evaluate(() => globalThis.Archify.finder.open());
    for (const [index, member] of exploration.nodes.entries()) {
      const result = page.locator(`.node-finder-result[data-node-id="${member.id}"] small`);
      const source = page
        .locator(`.diagram-container > svg [data-semantic-sigil="${icons[index]}"]`)
        .first();
      const mark = await typeMark(result, await source.innerHTML());
      assert.equal(mark.content, '""');
      assert.equal(mark.drawingMatches, true, "Finder must preserve the exact source icon artwork");
      assert.ok(mark.width >= 14 && mark.width <= 18, JSON.stringify(mark));
      assert.equal(mark.width, mark.height);
      assert.ok(mark.gap >= 4, "Finder glyph needs measured clearance before its type label");
      assert.ok(mark.labelWidth > 20, "Finder must reserve readable type-label space");
    }
    await page.evaluate(() => globalThis.Archify.finder.close({ restoreFocus: false }));
    const downloaded = page.waitForEvent("download", { timeout: 15000 });
    await page.evaluate(() => globalThis.Archify.exportMenu.run("svg"));
    const exported = await fs.readFile(await (await downloaded).path(), "utf8");
    assert.match(exported, /data-semantic-sigil="lucide:notebook-pen"/);
    assert.match(exported, /data-semantic-sigil="lucide:panels-top-left"/);
    assert.doesNotMatch(exported, /data-semantic-sigil="(?:backend|clock)"/);
    assert.match(exported, /<desc id="figure-icon-license">/);
    assert.equal(
      await page.evaluate((source) => {
        const document = new globalThis.DOMParser().parseFromString(source, "image/svg+xml");
        return document.querySelectorAll(
          "[data-node-type], [data-legend-selected], [data-lens-match]",
        ).length;
      }, exported),
      0,
    );
    assert.deepEqual(errors, []);
  },
);
