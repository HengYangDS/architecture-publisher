import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { sourceReadingFixture, sourceReference, sha } from "./fixtures/source-reading.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { browserOptions, runBrowser } from "./fixtures/reader-appearance.mjs";
import {
  interactiveDocument,
  selectedInteractiveMember,
  selectedSourceMember,
} from "./fixtures/interactive-member.mjs";

test(
  "the bundled native reader preserves repeated relationship occurrences and returns to each exact occurrence",
  { ...runBrowser, timeout: 60_000 },
  async (t) => {
    const { root } = await sourceReadingFixture(t);
    const refinementPath = path.join(root, "edition/refinement.json");
    const refinement = JSON.parse(await fs.readFile(refinementPath, "utf8"));
    const scene = refinement.media.interactive.pages[0].scene;
    scene.edges.push({
      ...structuredClone(scene.edges.find(({ id }) => id === "alpha-call")),
      id: "alpha-call-copy",
      label: "Calls again",
      fromSide: "top",
      toSide: "top",
    });
    await fs.writeFile(refinementPath, JSON.stringify(refinement) + "\n");
    const input = path.join(root, "build-request.json");
    const output = path.join(root, "candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const file = path.join(output, "interactive/architecture.html");
    const data = interactiveDocument(await fs.readFile(file));
    const selected = data.sourceReading.pages.connections.bindings;
    const relations = data.sourceReading.projection.relations;
    assert.equal(relations.length, 2, "repeated artwork does not duplicate source assertions");
    const alpha = sourceReference("alpha", "relation", "r");
    assert.deepEqual(
      data.sourceReading.projection.pages[0].occurrences
        .find(({ reference }) => reference === alpha)
        .graphicIds.slice()
        .sort(),
      ["alpha-call", "alpha-call-copy"],
    );
    const browser = await browserLifetime(t).acquire(() => chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push(message.text());
    });
    const url = pathToFileURL(file).href;
    await page.route("**/*", async (route) => {
      const address = new URL(route.request().url());
      address.hash = "";
      address.search = "";
      if (address.href === url) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(url, { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "connections");
    let detachedDisclosure = null;
    t.after(() => detachedDisclosure?.dispose());
    for (const [graphicId, reference] of [
      ["alpha-call", alpha],
      ["alpha-call-copy", alpha],
      ["beta-call", sourceReference("beta", "relation", "r")],
    ]) {
      const occurrence = member.locator(`[data-inspect-id="${graphicId}"][tabindex]`).first();
      await occurrence.press("i");
      await page.locator("#interactive-inspector").waitFor({ state: "visible" });
      const declaration = page.locator(
        '#interactive-inspect-content [data-reference-kind="relation"] > details',
      );
      const facts = await declaration
        .locator(":scope > dl")
        .evaluate((list) =>
          Object.fromEntries(
            [...list.children]
              .filter((element) => element.tagName === "DT")
              .map((term) => [
                term.textContent,
                term.nextElementSibling.querySelector(".inspect-original-value > pre")
                  ?.textContent ?? term.nextElementSibling.textContent,
              ]),
          ),
        );
      const expected = data.pages.connections.facts.find(
        (fact) => fact.graphicId === graphicId && fact.reference === reference,
      );
      assert(expected, "this occurrence retains its exact relation declaration");
      assert.deepEqual(
        facts,
        Object.fromEntries(expected.facts.map(({ label, value }) => [label, value])),
        "canonical source facts remain inspectable beside each graphical occurrence",
      );
      await declaration.locator(".inspect-source-diagram > summary").click();
      const native = await selectedSourceMember(page);
      await native.waitForFunction(
        (id) => globalThis.Archify.focus.relationship()?.id === id,
        selected[reference].id,
        { timeout: 5_000 },
      );
      const relation = relations.find((item) => item.reference === reference);
      const pinned = await native.evaluate(() => globalThis.Archify.focus.relationship());
      assert.equal(pinned.from, selected[relation.from].id);
      assert.equal(pinned.to, selected[relation.to].id);
      const edges = native.locator('svg > path[data-logical-relation="true"]');
      assert.deepEqual(
        await edges.evaluateAll((items) =>
          items.map((edge) => edge.dataset.publicationSourceReference).sort(),
        ),
        relations.map((item) => item.reference).sort(),
        "every source relation is present exactly once",
      );
      assert.equal(await native.locator("svg g[data-node-id]").count(), 4);
      assert.equal(
        await native
          .locator(
            `svg > path[data-publication-source-reference=${JSON.stringify(reference)}][data-relationship-preview]`,
          )
          .count(),
        1,
        "exact canonical relationship is selected independently of occurrence geometry",
      );
      if (detachedDisclosure) {
        await detachedDisclosure.evaluate(async (element) => {
          if (element.isConnected)
            throw new Error("Expected the previous disclosure to be detached");
          await new Promise((resolve) => {
            element.addEventListener("toggle", resolve, { once: true });
            element.open = false;
            element.open = true;
          });
        });
        assert.equal(
          await native.evaluate(() => globalThis.Archify.focus.relationship()?.id),
          selected[reference].id,
          "a delayed toggle from detached disclosure cannot dispose the active reader",
        );
        assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 1);
        await detachedDisclosure.dispose();
      }
      detachedDisclosure = await declaration.locator(".inspect-source-diagram").elementHandle();
      await page.locator("#interactive-inspect-back").click();
      assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 0);
      await member.waitForFunction(
        (id) => globalThis.document.activeElement?.getAttribute("data-inspect-id") === id,
        graphicId,
      );
    }
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);
