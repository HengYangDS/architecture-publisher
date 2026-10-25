import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { browserLifetime } from "./browser-lifetime.mjs";
import { sha } from "./selected-native-edition.mjs";
import { composeInteractiveHtml } from "../../packages/publisher/src/rendering/interactive-html.mjs";
import { renderArchitectureScene } from "../../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../../packages/publisher/renderers/resvg/measurement.mjs";
import { meaningFor, compose, sceneFor, namespace } from "./authored-routes.mjs";

export const browserOptions = {
  executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
  headless: true,
  chromiumSandbox: true,
};

export const runBrowser = {
  skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
};

export async function authoredHtml(t, multiplePages = false) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-appearance-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor("interactive");
  const raw = sceneFor(meaning, "interactive");
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), raw.texts);
  raw.texts = raw.texts.map((label) => ({
    ...label,
    box: measurer.box(label),
  }));
  const composed = compose(meaning, "interactive").pages[0];
  const output = path.join(root, "page.html");
  await renderArchitectureScene({
    scene: composed.scene,
    exploration: composed.exploration,
    output,
  });
  const content = await fs.readFile(output);
  const source = meaning.native.selections[0].source;
  return composeInteractiveHtml({
    schema: "architecture.interactive-html-composition/v2",
    title: "Architecture reading",
    framing: "Source relationships and editorial explanation remain distinct.",
    appearance: { style: "blueprint", theme: "dark" },
    build: {
      lockSha256: "1".repeat(64),
      editionSha256: meaning.edition.sha256,
      semanticDigest: "2".repeat(64),
    },
    editionId: meaning.edition.id,
    overview: "overview",
    sources: [
      {
        id: "model",
        kind: "native",
        namespace,
        sha256: source.sha256,
        claimant: source.claimant,
      },
    ],
    pages: (multiplePages ? ["overview", "relations"] : ["overview"]).map((id) => ({
      id,
      label: id === "overview" ? composed.label : "Relations",
      shortLabel: id === "overview" ? "Overview" : "Relations",
      purpose: id === "overview" ? "overview" : "mechanism",
      path: `views/${id}.html`,
      sha256: sha(content),
      sourceIds: ["model"],
      subjectSources: Object.fromEntries(
        Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
          id,
          namespaces.length ? ["model"] : [],
        ]),
      ),
      content,
      facts: composed.facts,
    })),
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
  });
}

export async function observeSystemTheme(member, theme, deliver, timeout = 5000) {
  await member.evaluate((light) => {
    const media = globalThis.matchMedia("(prefers-color-scheme: light)");
    const observation = { settled: media.matches === light };
    const listener = (event) => {
      if (event.matches === light) observation.settled = true;
    };
    if (!observation.settled) media.addEventListener("change", listener, { once: true });
    observation.cancel = () => media.removeEventListener("change", listener);
    globalThis.systemThemeObservation = observation;
  }, theme === "light");
  try {
    await deliver();
    const settled = await member.waitForFunction(
      () => globalThis.systemThemeObservation.settled,
      undefined,
      { timeout },
    );
    await settled.dispose();
    assert.equal(
      await member.evaluate(() => globalThis.matchMedia("(prefers-color-scheme: light)").matches),
      theme === "light",
      "the real browser delivered the selected system preference",
    );
  } catch (cause) {
    if (cause.name === "TimeoutError")
      throw new Error(
        `The real browser did not deliver the ${theme} preference within ${timeout}ms`,
        {
          cause,
        },
      );
    throw cause;
  } finally {
    await member.evaluate(() => {
      globalThis.systemThemeObservation.cancel();
      delete globalThis.systemThemeObservation;
    });
  }
}

export async function geometry(frame, selector) {
  return frame.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      const style = globalThis.getComputedStyle(element);
      return {
        text: element.textContent,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        font: style.fontFamily,
        fontSize: style.fontSize,
        path: element.getAttribute("d"),
        transform: element.getAttribute("transform"),
      };
    }),
  );
}

export async function contrast(frame, selector, property, backgroundSelector) {
  const target = frame.locator(selector).first();
  const observed = await target.evaluate(
    (element, args) => {
      const context = globalThis.document.createElement("canvas").getContext("2d");
      const channels = (value) => {
        if (!globalThis.CSS.supports("color", value))
          throw Error("The selected foreground is not a painted color");
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const rgba = [...context.getImageData(0, 0, 1, 1).data];
        return [...rgba.slice(0, 3), rgba[3] / 255];
      };
      const over = (foreground, background) => {
        const alpha = foreground[3] ?? 1;
        return foreground
          .slice(0, 3)
          .map((channel, index) => channel * alpha + background[index] * (1 - alpha));
      };
      const style = globalThis.getComputedStyle(element);
      const foreground = channels(style[args.property]);
      foreground[3] *= Number(
        args.property === "fill"
          ? style.fillOpacity
          : args.property === "stroke"
            ? style.strokeOpacity
            : 1,
      );
      for (let current = element; current; current = current.parentElement)
        foreground[3] *= Number(globalThis.getComputedStyle(current).opacity);
      if (!args.backgroundSelector) {
        const bounds = element.getBoundingClientRect();
        const point = (value) =>
          new globalThis.DOMPoint(value.x, value.y).matrixTransform(element.getScreenCTM());
        const points =
          typeof element.getNumberOfChars === "function"
            ? Array.from({ length: element.getNumberOfChars() }, (_, index) => {
                const box = element.getExtentOfChar(index);
                return point({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
              })
            : typeof element.getTotalLength === "function"
              ? Array.from({ length: 17 }, (_, index) =>
                  point(element.getPointAtLength((element.getTotalLength() * (index + 2)) / 20)),
                )
              : [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }];
        return {
          foreground,
          points: points.map(({ x, y }) => ({ x, y })),
          bounds: { x: bounds.x, y: bounds.y },
        };
      }
      const background = element.ownerDocument.querySelector(args.backgroundSelector);
      const layers = [];
      for (let current = background; current; current = current.parentElement) {
        const style = globalThis.getComputedStyle(current);
        if (Number(style.opacity) !== 1 || style.backgroundImage !== "none")
          throw Error("The selected contrast surface requires a separate compositing observer");
        const color = channels(style.backgroundColor);
        layers.push(color);
        if ((color[3] ?? 1) === 1) break;
      }
      if (!layers.length || (layers.at(-1)[3] ?? 1) !== 1)
        throw Error("The selected contrast surface has no observed opaque background");
      return {
        foreground,
        surfaces: [layers.reduceRight((below, above) => over(above, below), [0, 0, 0])],
      };
    },
    { property, backgroundSelector },
  );
  if (!observed.surfaces) {
    const page = typeof frame.page === "function" ? frame.page() : frame;
    const bounds = await target.boundingBox();
    if (!bounds) throw Error("The selected contrast foreground is not visible");
    const original = await target.getAttribute("style");
    let png;
    try {
      await target.evaluate(async (element) => {
        element.style.setProperty("transition", "none", "important");
        element.style.setProperty("opacity", "0", "important");
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        );
      });
      png = await page.screenshot();
    } finally {
      await target.evaluate(async (element, original) => {
        if (original === null) element.removeAttribute("style");
        else element.setAttribute("style", original);
        element.style.setProperty("transition", "none", "important");
        // Settle the restored opacity before reinstating its native transition.
        globalThis.getComputedStyle(element).opacity;
        // Synchronize SVG's pending CSSOM attribute before exact restoration.
        element.getAttribute("style");
        if (original === null) element.removeAttribute("style");
        else element.setAttribute("style", original);
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        );
      }, original);
    }
    observed.surfaces = await page.evaluate(
      async ({ base64, points }) => {
        const image = new globalThis.Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = globalThis.document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const scale = image.naturalWidth / globalThis.innerWidth;
        return points.map(({ x, y }) => {
          const px = Math.floor(x * scale),
            py = Math.floor(y * scale);
          if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
            throw Error("The selected contrast surface is outside the captured viewport");
          const rgba = [...context.getImageData(px, py, 1, 1).data];
          if (rgba[3] !== 255)
            throw Error("The selected contrast surface has no observed opaque paint");
          return rgba.slice(0, 3);
        });
      },
      {
        base64: png.toString("base64"),
        points: observed.points.map(({ x, y }) => ({
          x: x + bounds.x - observed.bounds.x,
          y: y + bounds.y - observed.bounds.y,
        })),
      },
    );
  }
  const luminance = (rgb) =>
    rgb
      .map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  assert(observed.surfaces.length > 0, "The contrast foreground has an observed paint footprint");
  return Math.min(
    ...observed.surfaces.map((surface) => {
      const foreground = luminance(
        observed.foreground
          .slice(0, 3)
          .map(
            (channel, index) =>
              channel * observed.foreground[3] + surface[index] * (1 - observed.foreground[3]),
          ),
      );
      const paper = luminance(surface);
      return (Math.max(foreground, paper) + 0.05) / (Math.min(foreground, paper) + 0.05);
    }),
  );
}

export async function createInspectReadingFixture({ t }) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-inspect-organization-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const source = {
    id: "source",
    kind: "native",
    namespace: "example/declarations",
    sha256: "4".repeat(64),
    claimant: "fixture:source-owner",
  };
  const qualifiers =
    '{"attributes":{"coverage":"visible","reality_boundary":"target, not current","revision":2,"truth":false},"extensions":{"limits":[null,"none",2]}}';
  const nested =
    '{"level_0":{"level_1":{"level_2":{"level_3":{"level_4":{"level_5":{"left":true,"right":" exact\\n value "}}}}}}}';
  const values = [
    qualifiers,
    '{"truth":false,"truth":true}',
    '{ "truth": false }',
    JSON.stringify({ value: "long ".repeat(4096) }),
    JSON.stringify(Array.from({ length: 300 }, (_, index) => index)),
    JSON.stringify({ a: { b: { c: { d: { e: { f: { g: { h: { i: [] } } } } } } } } }),
    "first\n    second\nthird",
    "{}",
    "[]",
    '{"b":1,"a":2}',
    '{"10":"a","2":"b"}',
    '{"limits":["x"]}',
    '{"limits":{"[0]":"x"}}',
    nested,
  ];
  const declarations = [
    ["editorial", "source-sounding-title", "Claim"],
    ["claim", "entity-sounding-title", "Entity"],
    ["relation", "editorial-sounding-title", "Editorial"],
    ["entity", "claim-sounding-title", "Claim"],
    ["entity", "secondary-entity", "Second Entity"],
  ];
  const peerIds = Array.from({ length: 32 }, (_, index) => `peer-${index}`);
  const longPeerTitle =
    "Exact source declarations retain their complete meaning and do not imply publication acceptance. "
      .repeat(7)
      .trim();
  const exactStatement =
    "The selected statement remains complete in its reading detail, not repeated as a navigation title. ".repeat(
      6,
    );
  const content = Buffer.from(
    '<!doctype html><html><head><title>Selected declarations</title></head><body><div data-node-id="selected" data-node-label="Selected aggregate" data-node-sublabel="Only reviewed contributions" data-node-tag=" No acceptance inferred ">Selected graphic</div>' +
      peerIds
        .map(
          (id) =>
            `<div data-node-id="${id}" data-node-label="${id === "peer-0" ? longPeerTitle : id}">${id}</div>`,
        )
        .join("") +
      `<div data-note-id="statement" data-note-label="${exactStatement}">${exactStatement}</div>` +
      "</body></html>",
  );
  const facts = declarations.map(([kind, id, title]) => ({
    reference: JSON.stringify([
      kind === "editorial" ? "inspect-reading" : source.namespace,
      kind,
      id,
    ]),
    ...(kind === "editorial" ? { editionSha256: "2".repeat(64) } : { sourceSha256: source.sha256 }),
    graphicId: "selected",
    title,
    facts:
      kind === "entity"
        ? values.map((value, index) => ({ label: `Declared value ${index}`, value }))
        : [{ label: "Statement", value: `${kind}: exact selected declaration` }],
  }));
  const html = composeInteractiveHtml({
    schema: "architecture.interactive-html-composition/v2",
    title: "Typed reading",
    framing: "Selected declarations are attributed, not accepted by this reader.",
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
        label: "Declarations",
        shortLabel: "Declarations",
        purpose: "overview",
        path: "views/overview.html",
        sha256: sha(content),
        sourceIds: ["source"],
        content,
        subjectSources: {
          selected: ["source"],
          ...Object.fromEntries(peerIds.map((id) => [id, ["source"]])),
          statement: ["source"],
        },
        facts: [
          ...facts,
          ...peerIds.map((id) => ({
            reference: JSON.stringify([source.namespace, "entity", id]),
            sourceSha256: source.sha256,
            graphicId: id,
            title: id,
            facts: [{ label: "Declared identity", value: id }],
          })),
          {
            reference: JSON.stringify([source.namespace, "claim", "statement"]),
            sourceSha256: source.sha256,
            graphicId: "statement",
            title: "Declared evidence boundary",
            facts: [{ label: "Statement", value: exactStatement }],
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
  return { page, qualifiers, nested, values, longPeerTitle, exactStatement };
}
