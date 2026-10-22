import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { assembleArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { esc } from "../packages/publisher/renderers/archify/supply/renderers/shared/utils.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/index.mjs";
import {
  validateInteractiveArchitectureInput,
  validateInteractiveArchitectureScene,
} from "../packages/publisher/src/scene/interactive/architecture.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { nativeSourceDocument } from "./fixtures/interactive-html.mjs";
import { pageStartTags } from "../packages/publisher/src/rendering/document-input.mjs";

const entity = '["fixture/claims","entity","compiler"]';
const references = ["first", "second"].map((id) => JSON.stringify(["fixture/claims", "claim", id]));
const records = [
  { subject: "compiler", object: null, predicate: "releases", condition: { approval: "required" } },
  { subject: "compiler", object: "compiler", predicate: "retains", scope: { history: "complete" } },
];

async function claimDocument() {
  const rendered = await assembleArchitectureScene({
    schema: "architecture.interactive-scene/v1",
    id: "claims",
    title: "Selected source relationships",
    subtitle: "Two declarations about the same component",
    nodes: [{ id: "n-0", label: "Compiler", visualRole: "backend" }],
    groups: [],
    edges: [],
    notes: records.map((record, index) => ({
      id: `claim-card-${index}`,
      title: `Selected source Claim: ${index + 1}`,
      items: [
        {
          id: `claim-record-${index}`,
          text: JSON.stringify(record),
          semanticIds: [references[index]],
        },
      ],
    })),
  });
  const input = nativeSourceDocument();
  const source = input.sources[0];
  input.sourceReading.projection.claims = records.map((record, index) => ({
    source,
    sourceClass: "native",
    owner: "fixture-maintainer",
    reference: references[index],
    subject: entity,
    object: record.object === null ? null : entity,
    record,
  }));
  for (const page of input.pages) {
    page.facts.push(
      ...records.map((record, index) => ({
        reference: references[index],
        sourceSha256: source.sha256,
        graphicId: "compiler",
        title: `Claim ${index + 1}`,
        facts: [{ label: "Selected declaration", value: JSON.stringify(record) }],
      })),
    );
  }
  for (const page of input.sourceReading.projection.pages) {
    page.claims = references;
    page.occurrences.push(
      ...references.map((reference) => ({ reference, graphicIds: ["compiler"] })),
    );
  }
  let content = rendered.bytes.toString();
  for (const [index, reference] of [entity, ...references].entries()) {
    const field = index ? "data-note-id" : "data-node-id";
    const id = index ? `claim-record-${index - 1}` : "n-0";
    for (const { tag, attributes } of pageStartTags(content, assert.fail)) {
      if (attributes.get(field) !== id) continue;
      content = content.replace(tag, () =>
        tag.replace(
          /\/?\s*>$/u,
          (closing) => ` data-publication-source-reference="${esc(reference)}"${closing}`,
        ),
      );
    }
  }
  for (const page of input.sourceReading.pages) {
    page.content = Buffer.from(content);
    for (const [index, reference] of references.entries()) {
      page.bindings[reference] = { kind: "claim", id: `claim-record-${index}` };
    }
  }
  return input;
}

test("native Claim cards expose unique ordinary HTML anchors without posing as nodes", async () => {
  const input = await claimDocument();
  const content = input.sourceReading.pages[0].content.toString();
  for (let index = 0; index < records.length; index++) {
    const carrier = pageStartTags(content, assert.fail).find(
      ({ attributes }) => attributes.get("data-note-id") === `claim-record-${index}`,
    );
    assert.ok(carrier);
    assert.equal(carrier.attributes.get("id"), `claim-record-${index}`);
    assert.equal(carrier.attributes.has("data-node-id"), false);
    assert.equal(carrier.attributes.get("role"), "button");
    assert.equal(carrier.attributes.get("tabindex"), "0");
    assert.equal(content.match(new RegExp(`\\sid="claim-record-${index}"`, "gu"))?.length, 1);
  }
  assert.ok(Buffer.isBuffer(composeInteractiveHtml(input)));
});

test("source Claim composition refuses missing, duplicated or misplaced fragment targets", async () => {
  const baseline = await claimDocument();
  for (const mutate of [
    (content) => content.replace(' id="claim-record-0"', ""),
    (content) => content.replace("</body>", '<span id="claim-record-0"></span></body>'),
    (content) =>
      content
        .replace(' id="claim-record-0"', "")
        .replace("</body>", '<span id="claim-record-0"></span></body>'),
  ]) {
    const input = structuredClone(baseline);
    input.pages = baseline.pages;
    input.sourceReading.pages = baseline.sourceReading.pages.map((page) => ({
      ...page,
      content: Buffer.from(mutate(page.content.toString())),
    }));
    assert.throws(() => composeInteractiveHtml(input), {
      code: "interactive_html_source_reader_invalid",
    });
  }
});

test("complete note prose survives both native input forms without weakening short identities", async () => {
  const declaration = `Condition:\tapproval remains required.\r\n${"The source declaration is retained in full. ".repeat(100)}\nScope: selected operators only.\n`;
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "full-prose",
    title: "Complete declaration",
    subtitle: "No abbreviation or whitespace loss",
    nodes: [{ id: "n-0", label: "Compiler", visualRole: "backend" }],
    groups: [],
    edges: [],
    notes: [
      {
        id: "source-note",
        title: "Selected source declaration",
        items: [{ id: "declaration", text: declaration, semanticIds: [references[0]] }],
      },
    ],
  };
  assert.equal(validateInteractiveArchitectureInput(scene).notes[0].items[0].text, declaration);
  const rendered = await assembleArchitectureScene(scene);
  assert.equal(
    validateInteractiveArchitectureScene(rendered.scene).notes[0].items[0].text,
    declaration,
  );
  const content = rendered.bytes.toString();
  const carrier = pageStartTags(content, assert.fail).find(
    ({ attributes }) => attributes.get("data-note-id") === "declaration",
  );
  assert.ok(carrier);
  const start = content.indexOf(carrier.tag) + carrier.tag.length;
  const escaped = content.slice(start, content.indexOf(`</${carrier.name}>`, start));
  assert.equal(escaped, esc(declaration));
  for (const value of ["", " \n\t", "text\0body", "text\x7fbody"]) {
    const invalid = structuredClone(scene);
    invalid.notes[0].items[0].text = value;
    assert.throws(() => validateInteractiveArchitectureInput(invalid));
    const resolved = structuredClone(rendered.scene);
    resolved.notes[0].items[0].text = value;
    assert.throws(() => validateInteractiveArchitectureScene(resolved), {
      code: "interactive_scene_note_invalid",
    });
  }
  const invalid = structuredClone(scene);
  invalid.notes[0].title = "t".repeat(2049);
  assert.throws(() => validateInteractiveArchitectureInput(invalid));
  invalid.notes[0].title = "Selected source declaration";
  invalid.notes[0].items[0].id = "n-0";
  assert.throws(() => validateInteractiveArchitectureInput(invalid), {
    code: "interactive_scene_note_invalid",
  });
});

test(
  "native Claim prose remains multiline and complete in the actual reader",
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
    timeout: 60_000,
  },
  async (t) => {
    const rendered = await assembleArchitectureScene({
      schema: "architecture.interactive-scene/v1",
      id: "multiline-prose",
      title: "Complete source declaration",
      subtitle: "Whitespace belongs to the source text",
      nodes: [{ id: "n-0", label: "Compiler", visualRole: "backend", semanticIds: [entity] }],
      groups: [],
      edges: [],
      texts: [
        {
          id: "diagram-declaration",
          owner: "n-0",
          text: "Condition:\tapproval\r\n\r\nScope: operators\n",
          weight: "400",
          anchor: "middle",
          tone: "ink",
          visible: true,
          semanticIds: [references[1]],
        },
      ],
      notes: [
        {
          id: "source-note",
          title: "Selected declaration",
          items: [
            {
              id: "declaration",
              text: `  Condition:\tapproval remains required.\r\n${"Full source text. ".repeat(256)}\nScope: selected operators only.\n`,
              semanticIds: [references[0]],
            },
          ],
        },
      ],
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route("**/*", (route) => route.abort());
    await page.setContent(rendered.bytes.toString(), { waitUntil: "load" });
    const note = page.locator('[data-note-item-id="declaration"]');
    assert.equal(
      await note.textContent(),
      rendered.scene.notes[0].items[0].text.replaceAll("\r\n", "\n"),
    );
    assert.equal(
      await note.evaluate((element) => globalThis.getComputedStyle(element).whiteSpace),
      "pre-wrap",
    );
    assert.equal(
      await note.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      true,
    );
    const diagram = page.locator('[data-intrinsic-text="diagram-declaration"]');
    assert.equal(await diagram.textContent(), "Condition:    approvalScope: operators");
    const paint = await diagram.evaluate(async (element) => {
      await element.ownerDocument.fonts.ready;
      return [...element.querySelectorAll("tspan")].map((row) => {
        const box = row.getBBox();
        return { width: box.width, height: box.height, y: box.y };
      });
    });
    assert(paint.length >= 2);
    assert(paint.every(({ width, height }) => width > 0 && height > 0));
    assert(paint.slice(1).every((row, index) => row.y > paint[index].y + paint[index].height));
  },
);

test("complete multiline diagram prose retains source bytes through automatic paint", async () => {
  const declaration = "Selected source declaration";
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "statement-prose",
    title: "Selected source statement",
    subtitle: "No short-label substitution",
    nodes: [],
    groups: [],
    edges: [],
    texts: [
      {
        id: "declaration",
        text: declaration,
        weight: "400",
        anchor: "middle",
        tone: "ink",
        visible: true,
        semanticIds: [references[0]],
      },
    ],
  };
  assert.equal(validateInteractiveArchitectureInput(scene).texts[0].text, declaration);
  const rendered = await assembleArchitectureScene(scene);
  assert.equal(validateInteractiveArchitectureScene(rendered.scene).texts[0].text, declaration);
  assert.match(rendered.bytes.toString(), /data-intrinsic-text="declaration"/u);
  const multiline = structuredClone(scene);
  multiline.texts[0].text = "first\r\n\r\nsecond\tthird\n";
  const before = structuredClone(multiline);
  assert.equal(
    validateInteractiveArchitectureInput(multiline).texts[0].text,
    multiline.texts[0].text,
  );
  const complete = await assembleArchitectureScene(multiline);
  assert.deepEqual(multiline, before);
  assert.equal(complete.scene.texts[0].text, multiline.texts[0].text);
  const painted = complete.bytes
    .toString()
    .match(/<text(?=[^>]*data-intrinsic-text="declaration")[^>]*>([\s\S]*?)<\/text>/u)?.[1];
  assert(painted);
  assert.equal(painted.replace(/<[^>]+>/gu, ""), "firstsecond    third");
  for (const value of ["", " \n\t", "text\0body", "text\x7fbody"]) {
    const invalid = structuredClone(scene);
    invalid.texts[0].text = value;
    assert.throws(() => validateInteractiveArchitectureInput(invalid));
    assert.equal(invalid.texts[0].text, value);
  }
});

test(
  "Inspect targets each exact Claim and restores native query state without rewriting it",
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
    timeout: 60_000,
  },
  async (t) => {
    const input = await claimDocument();
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
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
    await page.route("**/*", (route) => route.abort());
    await page.setContent(composeInteractiveHtml(input).toString(), { waitUntil: "load" });
    await page.locator("#interactive-inspect").click();
    await page.locator('#interactive-inspect-index button[data-graphic-id="compiler"]').click();
    for (const [index, reference] of references.entries()) {
      const selected = page.locator(
        `.inspect-source-diagram[data-source-reference=${JSON.stringify(reference)}]`,
      );
      await selected
        .locator("xpath=ancestor::details[1]")
        .locator(":scope > summary")
        .click({ timeout: 7000 });
      await selected.locator(":scope > summary").click({ timeout: 7000 });
      const frame = selected.frameLocator("iframe");
      const target = frame.locator(`[data-note-id="claim-record-${index}"]:target`);
      await target.waitFor({ state: "visible", timeout: 7000 });
      assert.equal(await frame.locator("[data-focus-selected]").count(), 0);
      assert.equal(await target.textContent(), JSON.stringify(records[index]));
      assert.equal(await frame.locator("[data-note-id]").count(), records.length);
      assert.equal(
        await frame.locator("html").evaluate(() => globalThis.location.hash),
        `#claim-record-${index}`,
      );
      assert.equal(await page.locator("[data-source-reader-root] iframe").count(), 1);
    }
    const state = "focus=n-0&reach=downstream";
    const hash = new URLSearchParams({
      page: input.overview,
      inspect: "compiler",
      source: references[1],
      edition: input.build.editionSha256,
      meaning: input.build.semanticDigest,
      sourceReader: state,
    }).toString();
    await page.evaluate((value) => {
      globalThis.location.hash = value;
    }, hash);
    const restored = page.frameLocator("[data-source-reader-root] iframe");
    await restored.locator("html").waitFor();
    await page.waitForFunction(() =>
      globalThis.document
        .querySelector("[data-source-reader-root] iframe")
        ?.srcdoc.includes("focus=n-0"),
    );
    assert.equal(
      await restored.locator("html").evaluate(() => globalThis.location.hash),
      `#${state}`,
    );
    assert.equal(await restored.locator("[data-note-id]:target").count(), 0);
    assert.equal(await page.locator("[data-source-reader-root] iframe").count(), 1);
    assert.deepEqual(errors, []);
  },
);
