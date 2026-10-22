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
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { embedFonts } from "../packages/publisher/src/compiler/media.mjs";
import {
  observeGlyphPaintEnvelope,
  observeDiagramGlyphContainment,
} from "./fixtures/font-paint.mjs";
import { browserOptions, runBrowser } from "./fixtures/reader-appearance.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

test(
  "interactive source values preserve exact whitespace in diagrams and Inspect",
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-exact-value-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const values = ["  first  second\nthird\t fourth  ", "  next  item\nvalue\t remains  "];
    const condition = "  if  selected\nthen\t admitted  ";
    const revision = "a".repeat(64);

    for (const kind of ["claims", "mixed", "responsibility"]) {
      const mixed = kind !== "claims";
      const scene = interactiveEditionScene();
      const selected = scene.pages[mixed ? 0 : 1];
      selected.claimCards = values.map((value, index) => ({
        namespace: "private/model",
        id: `claim-${index}`,
        sha256: revision,
        facts: [
          { label: "Claim plane", value: "implemented" },
          { label: "Value", value },
          { label: "Condition", value: condition },
        ],
      }));
      selected.sourceAssertionCarriers.push(
        ...values.map((_, index) => ({
          assertionId: `source-value-${index}`,
          kind: "claim",
          nodeRefs: [],
          relationRefs: [],
          claimRefs: [
            { namespace: "private/model", reference: `claim-${index}`, sha256: revision },
          ],
        })),
      );
      if (mixed) {
        selected.sourceAssertionCarriers.push({
          assertionId: "source-relation",
          kind: "relation",
          nodeRefs: [],
          relationRefs: [
            { namespace: "private/model", reference: "relation:4:2", sha256: revision },
          ],
        });
        selected.claimRelationLinks = values.map((_, index) => ({
          claimAssertionId: `source-value-${index}`,
          relationAssertionId: "source-relation",
        }));
        if (kind === "responsibility") {
          selected.groups = [
            {
              id: "first",
              label: "First responsibility",
              elements: [{ namespace: "private/model", id: "secret-alpha" }],
            },
            {
              id: "second",
              label: "Second responsibility",
              elements: [{ namespace: "private/model", id: "secret-beta" }],
            },
          ];
          selected.visualForm = {
            schema: "architecture.visual-form/v1",
            kind: "responsibility",
            roles: [
              { group: "first", basis: "source-value-0" },
              { group: "second", basis: "source-value-0" },
            ],
            handoffs: [{ from: "first", to: "second", basis: "source-value-0" }],
          };
        }
      }
      const file = path.join(root, `${kind}.html`);
      await fs.writeFile(file, (await renderInteractiveEditionHtml(scene)).bytes);
      await page.goto(pathToFileURL(file).href);
      await page.locator(`[data-interactive-page="${selected.id}"]`).click();
      const frame = await selectedInteractiveMember(page, selected.id);
      await frame.evaluate(async () => {
        await globalThis.document.fonts.ready;
        await globalThis.Archify.readerLayout.whenStable();
      });
      const rows = await frame
        .locator("[data-note-item-id]")
        .evaluateAll((items) =>
          items.map((item) => ({ text: item.textContent, visible: item.innerText })),
        );
      for (const value of [
        ...values.map((value) => `Value: ${value}`),
        `Condition: ${condition}`,
      ]) {
        const matches = rows.filter((row) => row.text === value);
        assert(matches.length, "every selected source value must retain a visible carrier");
        for (const row of matches)
          assert.equal(row.visible, value, "reading must preserve exact source whitespace");
      }
      if (kind === "responsibility") {
        const rows = await frame
          .locator('[data-note-card-id^="role-"] [data-note-item-id]')
          .evaluateAll((items) =>
            items.map((item) => ({ text: item.textContent, visible: item.innerText })),
          );
        const conditions = rows.filter((row) => row.text === `Condition: ${condition}`);
        assert.equal(
          conditions.length,
          2,
          "each source-backed role retains its selected condition",
        );
        for (const row of conditions) assert.equal(row.visible, row.text);
      }
      await page.locator("#interactive-inspect").click();
      for (const [index, value] of values.entries()) {
        await page.locator(`#interactive-inspect-index [data-graphic-id="c-${index}"]`).click();
        const record = page
          .locator('#interactive-inspect-content [data-reference-kind="claim"] > details')
          .first();
        if (!(await record.evaluate((element) => element.open)))
          await record.locator(":scope > summary").click();
        const fields = await record
          .locator("dd")
          .evaluateAll((items) =>
            items.map((item) => ({ text: item.textContent, visible: item.innerText })),
          );
        for (const expected of [value, condition]) {
          const matches = fields.filter((field) => field.text === expected);
          assert(matches.length, "Inspect retains each complete selected Claim field");
          for (const field of matches) assert.equal(field.visible, expected);
        }
      }
    }

    const sourceBytes = Buffer.from(JSON.stringify({ value: values[0] }));
    const content = Buffer.from(
      '<!doctype html><html><head><title>Selected Claim</title></head><body><div data-node-id="carrier">Selected Claim</div></body></html>',
    );
    const source = {
      id: "source",
      kind: "native",
      namespace: "example/claims",
      sha256: sha(sourceBytes),
      claimant: "fixture:owner",
    };
    const html = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: "Source value reading",
      framing: "Source values remain exact in the publication reader.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: "2".repeat(64),
        semanticDigest: "3".repeat(64),
      },
      editionId: "value-reading",
      overview: "overview",
      sources: [source],
      pages: [
        {
          id: "overview",
          label: "Source values",
          shortLabel: "Values",
          purpose: "overview",
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["source"],
          content,
          subjectSources: { carrier: ["source"] },
          facts: [
            {
              reference: JSON.stringify([source.namespace, "claim", "value"]),
              sourceSha256: source.sha256,
              graphicId: "carrier",
              title: "Selected Claim",
              facts: [{ label: "Value", value: values[0] }],
            },
          ],
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
    const details = page.locator("#interactive-inspect-content details");
    for (const item of await details.all())
      if ((await item.getAttribute("open")) === null) await item.locator("summary").click();
    const row = await page
      .locator("#interactive-inspect-content dd")
      .filter({ hasText: "first" })
      .evaluate((item) => ({ text: item.textContent, visible: item.innerText }));
    assert.equal(row.text, values[0]);
    assert.equal(row.visible, values[0], "Inspect must preserve the exact selected value");
  },
);

test(
  "glyph containment uses the exact painted letters without counting preserved trailing spaces as ink",
  runBrowser,
  async (t) => {
    const fonts = await loadBundledFonts();
    const rows = [
      { text: "Bind existing roots; ", x: 114.483985900879, baseline: 63.44 },
      { text: "expose conflicts", x: 96.5919914245605, baseline: 82.9240002059937 },
    ].map((row) => ({ ...row, fontSize: 12, weight: "400", anchor: "middle" }));
    const canvas = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="96" viewBox="0 0 192 96"><g data-node-id="prepare"><rect x="0" y="0" width="192" height="96" fill="none"/><text data-detail="context" font-family="JetBrains Mono" font-size="12" font-weight="400" text-anchor="middle" xml:space="preserve">' +
        rows
          .map(
            (row) => '<tspan x="' + row.x + '" y="' + row.baseline + '">' + row.text + "</tspan>",
          )
          .join("") +
        "</text></g></svg>",
    );
    const html =
      '<style>html,body{margin:0;background:transparent}svg{display:block}</style><div class="diagram-container">' +
      embedFonts(canvas, fonts.fonts, fonts.license).toString("utf8") +
      "</div>";
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 768, height: 384 } });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const before = await page.locator("svg").evaluate((svg) => svg.outerHTML);
    const observed = await observeDiagramGlyphContainment(page);
    assert.deepEqual(observed.outside, [], JSON.stringify(observed.outside));
    assert.deepEqual(observed.clipped, [], JSON.stringify(observed.clipped));
    const after = await page.locator("svg").evaluate((svg) => svg.outerHTML);
    assert.equal(after, before, "Measurement must not rewrite source text or geometry");
    const measure = await createBundledTextMeasurer(fonts, rows);
    for (const row of rows) {
      const native = measure.box(row);
      assert(native.x >= 4 && native.x + native.width <= 188);
    }
    await page.locator("svg").evaluate((svg) => {
      svg.style.width = "768px";
      svg.style.height = "384px";
    });
    const painted = await observeGlyphPaintEnvelope(
      page,
      await page.locator("svg").screenshot({ omitBackground: true }),
      4,
    );
    const edge = painted.samples[0].logical;
    assert(
      edge.x >= 4 && edge.x + edge.width <= 188,
      "Real four-times-alpha footprint fits the unchanged inset",
    );
    await page
      .locator("tspan")
      .first()
      .evaluate((element) =>
        element.setAttribute("x", String(Number(element.getAttribute("x")) + 16)),
      );
    const crossed = await observeDiagramGlyphContainment(page);
    assert.equal(crossed.outside.length, 1, "A real displaced glyph must remain a failure");
  },
);
