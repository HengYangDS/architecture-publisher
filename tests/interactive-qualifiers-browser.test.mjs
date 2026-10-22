import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { browserExecutable } from "./fixtures/interactive-browser.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

async function standaloneCandidate(lifetime, bytes) {
  const workspace = new URL("../build/runtime/work/", import.meta.url);
  await fs.mkdir(workspace, { recursive: true });
  const root = await fs.mkdtemp(new URL("native-qualifiers-", workspace));
  lifetime.defer(async () => {
    await fs.rm(root, { recursive: true, force: true });
    await assert.rejects(fs.stat(root), { code: "ENOENT" });
  });
  const file = path.join(root, "architecture.html");
  await fs.writeFile(file, bytes);
  return pathToFileURL(file).href;
}

test(
  "the native overview fits while exact qualifiers remain readable in both note placements",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 20_000 },
  async (t) => {
    const lifetime = browserLifetime(t);
    const scene = interactiveEditionScene();
    const selected = scene.pages[0];
    const node = selected.nodes[0];
    const relation = selected.relations[0];
    selected.nodes = [
      "Operator",
      "Plan",
      "Native projection",
      "Native client",
      "Observation",
      "Recovery",
    ].map((label, index) => ({ ...node, id: `source-${index}`, label }));
    selected.relations = Array.from({ length: 5 }, (_, index) => ({
      ...relation,
      id: `source-relation-${index}`,
      from: { namespace: "private/model", id: `source-${index}` },
      to: { namespace: "private/model", id: `source-${index + 1}` },
      label: index ? "configures" : "guards",
      direction: index ? "forward" : "bidirectional",
    }));
    selected.relations[0].sourceQualifiers = [
      { name: "compensation", value: '"unchanged-postimage-only"' },
    ];
    selected.claimCards = [];
    selected.sourceAssertionCarriers[0].nodeRefs = selected.nodes.map(({ namespace, id }) => ({
      namespace,
      id,
    }));
    selected.sourceAssertionCarriers[0].relationRefs = selected.relations.map(({ id }) => ({
      namespace: "private/model",
      reference: id,
      sha256: "a".repeat(64),
    }));
    const candidate = await renderInteractiveEditionHtml(scene);
    const url = await standaloneCandidate(lifetime, candidate.bytes);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 10_000,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "load" });
    const frame = await selectedInteractiveMember(page, "overview");
    await frame.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.readerLayout.whenStable();
    });
    const metrics = await frame.evaluate(() => {
      const diagram = globalThis.document.querySelector(".diagram-container");
      const stage = diagram.getBoundingClientRect();
      const cards = globalThis.document.querySelector(".cards").getBoundingClientRect();
      const text = globalThis.document.querySelector(
        '[data-note-item-id="relation-0-qualifier-0"]',
      );
      return {
        placement: globalThis.document.documentElement.getAttribute("data-reader-rail"),
        cardsTop: cards.top,
        stageBottom: stage.bottom,
        stageRight: stage.right,
        fontSize: Number.parseFloat(globalThis.getComputedStyle(text).fontSize),
        qualifier: text.textContent,
        nodeCount: new Set(
          [...diagram.querySelectorAll("[data-node-id][data-node-label]")].map(
            (node) => node.dataset.nodeId,
          ),
        ).size,
        relationCount: new Set(
          [
            ...diagram.querySelectorAll(
              "path[data-edge-id][data-composition-edge-from][data-composition-edge-to]",
            ),
          ].map((relation) => relation.dataset.edgeId),
        ).size,
        viewport: globalThis.innerHeight,
        overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
      };
    });
    assert.equal(metrics.placement, "bottom");
    assert(metrics.cardsTop >= metrics.stageBottom + 16, JSON.stringify(metrics));
    assert(metrics.stageBottom < metrics.viewport, JSON.stringify(metrics));
    assert(metrics.fontSize >= 14, JSON.stringify(metrics));
    assert.equal(metrics.qualifier, 'compensation: "unchanged-postimage-only"');
    assert.equal(metrics.nodeCount, 6);
    assert.equal(metrics.relationCount, 5);
    assert.equal(metrics.overflow, false);

    await frame.locator("#rail-placement").click();
    await frame.evaluate(() => globalThis.Archify.readerLayout.whenStable());
    const docked = await frame.evaluate(() => {
      const diagram = globalThis.document
        .querySelector(".diagram-container")
        .getBoundingClientRect();
      const cards = globalThis.document.querySelector(".cards").getBoundingClientRect();
      const note = globalThis.document.querySelector(
        '[data-note-item-id="relation-0-qualifier-0"]',
      );
      return {
        placement: globalThis.document.documentElement.getAttribute("data-reader-rail"),
        gap: cards.left - diagram.right,
        fontSize: Number.parseFloat(globalThis.getComputedStyle(note).fontSize),
        qualifier: note.textContent,
        overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
      };
    });
    assert.equal(docked.placement, "true");
    assert(docked.gap >= 20, JSON.stringify(docked));
    assert(docked.fontSize >= 14, JSON.stringify(docked));
    assert.equal(docked.qualifier, metrics.qualifier);
    assert.equal(docked.overflow, false);
    await frame.locator("#rail-placement").press("Enter");
    await frame.evaluate(() => globalThis.Archify.readerLayout.whenStable());
    assert.equal(
      await frame.evaluate(() => globalThis.document.documentElement.dataset.readerRail),
      "bottom",
    );
    assert.deepEqual(errors, []);
  },
);

test(
  "a native qualifier card fills its reading track with clear heading and text spacing",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 20_000 },
  async (t) => {
    const lifetime = browserLifetime(t);
    const scene = interactiveEditionScene();
    scene.pages[0].limitsByQuestion = { shape: [] };
    scene.pages[0].relations[0].sourceQualifiers = [
      {
        name: "condition",
        value: '"retain the selected native state unless this operation created it"',
      },
    ];
    const candidate = await renderInteractiveEditionHtml(scene);
    const url = await standaloneCandidate(lifetime, candidate.bytes);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 10_000,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(url, { waitUntil: "load" });
    const frame = await selectedInteractiveMember(page, "overview");
    for (const width of [1600, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await frame.evaluate(async () => {
        await globalThis.document.fonts.ready;
        await globalThis.Archify.readerLayout.whenStable();
      });
      const metrics = await frame.evaluate(() => {
        const work = globalThis.document.querySelector(
          '[data-note-card-id="relation-qualifiers-0"]',
        );
        const article = work.querySelector("ul");
        const heading = work.querySelector("h3").getBoundingClientRect();
        const area = work.getBoundingClientRect();
        const item = article.getBoundingClientRect();
        const style = globalThis.getComputedStyle(work);
        return {
          innerWidth:
            area.width -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight) -
            Number.parseFloat(style.borderLeftWidth) -
            Number.parseFloat(style.borderRightWidth),
          articleWidth: item.width,
          headingBottom: heading.bottom,
          articleTop: item.top,
          value: article.querySelector('[data-note-item-id="relation-0-qualifier-0"]').textContent,
          overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
        };
      });
      assert(metrics.articleWidth > 200, JSON.stringify(metrics));
      assert(Math.abs(metrics.articleWidth - metrics.innerWidth) <= 1, JSON.stringify(metrics));
      assert(metrics.articleTop >= metrics.headingBottom + 16, JSON.stringify(metrics));
      assert.equal(
        metrics.value,
        'condition: "retain the selected native state unless this operation created it"',
      );
      assert.equal(metrics.overflow, false);
    }
  },
);

test(
  "unequal source claims read in order without stretched empty cards",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 20_000 },
  async (t) => {
    const lifetime = browserLifetime(t);
    const scene = interactiveEditionScene();
    const selected = scene.pages[0];
    const revision = "a".repeat(64);
    selected.sourceAssertionCarriers.push({
      assertionId: "relation-assertion",
      kind: "relation",
      nodeRefs: [],
      relationRefs: [{ namespace: "private/model", reference: "relation:4:2", sha256: revision }],
    });
    selected.claimCards = [1, 2, 3].map((index) => ({
      namespace: "private/model",
      id: `claim-${index}`,
      sha256: revision,
      facts: [
        { label: "Claim plane", value: "implemented" },
        { label: "Subject", value: "Alpha & one" },
        { label: "Predicate", value: "calls" },
        { label: "Object", value: "Beta" },
        {
          label: "Declared evidence authority",
          value: "Selected implementation evidence ".repeat(index === 2 ? 25 : 5),
        },
      ],
    }));
    for (const index of [1, 2, 3])
      selected.sourceAssertionCarriers.push({
        assertionId: `claim-assertion-${index}`,
        kind: "claim",
        nodeRefs: [],
        relationRefs: [],
        claimRefs: [{ namespace: "private/model", reference: `claim-${index}`, sha256: revision }],
      });
    selected.claimRelationLinks = [1, 2, 3].map((index) => ({
      claimAssertionId: `claim-assertion-${index}`,
      relationAssertionId: "relation-assertion",
    }));
    const html = await renderInteractiveEditionHtml(scene);
    const url = await standaloneCandidate(lifetime, html.bytes);
    const browser = await lifetime.acquire(() =>
      chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(url, { waitUntil: "load" });
    const frame = await selectedInteractiveMember(page, "overview");
    await frame.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.readerLayout.whenStable();
    });
    const reading = await frame.evaluate(() => {
      const cards = [
        ...globalThis.document.querySelectorAll('[data-note-card-id^="claim-card-"]'),
      ].map((card) => {
        const box = card.getBoundingClientRect();
        const facts = card.querySelector("ul").getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          blank: box.bottom - facts.bottom,
          text: card.textContent,
        };
      });
      return {
        count: cards.length,
        cards,
        painted: cards.every(({ width, height }) => width > 200 && height > 10),
      };
    });
    assert.equal(reading.count, 3);
    assert.equal(reading.painted, true, JSON.stringify(reading));
    assert(
      reading.cards.every(({ blank }) => blank < 30),
      JSON.stringify(reading),
    );
    assert(reading.cards[1].height > reading.cards[0].height, JSON.stringify(reading));
    for (const [index, card] of reading.cards.entries())
      assert(
        card.text.includes("Selected implementation evidence ".repeat(index === 1 ? 25 : 5)),
        JSON.stringify(card),
      );

    await frame.locator("#rail-placement").click();
    await frame.evaluate(() => globalThis.Archify.readerLayout.whenStable());
    const desktop = await frame.evaluate(() => ({
      placement: globalThis.document.documentElement.getAttribute("data-reader-rail"),
      cards: [...globalThis.document.querySelectorAll('[data-note-card-id^="claim-card-"]')].map(
        (card) => {
          const box = card.getBoundingClientRect();
          const facts = card.querySelector("ul").getBoundingClientRect();
          return {
            top: box.top,
            bottom: box.bottom,
            height: box.height,
            blank: box.bottom - facts.bottom,
          };
        },
      ),
    }));
    assert.equal(desktop.placement, "true", JSON.stringify(desktop));
    assert.equal(desktop.cards.length, 3);
    assert(
      desktop.cards.every(({ height }) => height > 10),
      JSON.stringify(desktop),
    );
    assert(
      desktop.cards.every(({ blank }) => blank < 30),
      JSON.stringify(desktop),
    );
    assert(
      desktop.cards.every(({ top }, index) => !index || top >= desktop.cards[index - 1].bottom),
      JSON.stringify(desktop),
    );
    await page.locator("#interactive-inspect").click();
    for (const [index, claim] of selected.claimCards.entries()) {
      await page.locator(`#interactive-inspect-index button[data-graphic-id="c-${index}"]`).click();
      const record = page.locator("#interactive-inspect-content section > details").first();
      if (!(await record.evaluate((element) => element.open)))
        await record.locator(":scope > summary").click();
      for (const { value } of claim.facts) assert((await record.textContent()).includes(value));
    }
    await page.addScriptTag({ content: axe.source });
    const violations = () =>
      page.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.map(({ id }) => id);
      });
    assert.deepEqual(await violations(), []);
  },
);
