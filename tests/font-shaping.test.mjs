import assert from "node:assert/strict";

import fs from "node:fs/promises";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import * as rasterRuntime from "../packages/publisher/renderers/resvg/supply/resvg/index.mjs";

import { sha } from "./fixtures/authored-fonts.mjs";

test("exact normal 400 500 600 700 faces measure without synthetic weight fallback", async () => {
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(
    supply,
    ["400", "500", "600", "700"].map((weight) => ({
      text: "Source route",
      fontSize: 16,
      weight,
      family: "JetBrains Mono",
      anchor: "start",
      x: 30,
      baseline: 60,
    })),
  );
  for (const weight of ["400", "500", "600", "700"]) {
    const box = measurer.box({
      text: "Source route",
      fontSize: 16,
      weight,
      family: "JetBrains Mono",
      anchor: "start",
      x: 30,
      baseline: 60,
    });
    assert(box.width > 0 && box.height > 0);
  }
  assert.throws(
    () =>
      measurer.box({
        text: "Source route",
        fontSize: 16,
        weight: "500",
        family: "Unselected Family",
        anchor: "start",
        x: 30,
        baseline: 60,
      }),
    { code: "authored_canvas_font_unselected" },
  );
});

test("measurement refuses a declared family or weight that disagrees with actual font bytes", async () => {
  const supply = await loadBundledFonts();
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: supply.fonts.map((face) => ({ ...face, family: "Invented Family" })),
    }),
    { code: "authored_canvas_font_identity_mismatch" },
  );
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: supply.fonts.map((face) => (face.weight === 400 ? { ...face, weight: 600 } : face)),
    }),
    { code: "authored_canvas_font_identity_mismatch" },
  );
});

test("measurement refuses malformed or over-budget font sets before native execution", async () => {
  const supply = await loadBundledFonts();
  const face = supply.fonts[0];
  for (const fonts of [
    Array.from({ length: 17 }, () => face),
    [null],
    [{ ...face, bytes: "not font bytes" }],
    [{ ...face, bytes: Buffer.alloc(8 * 1024 * 1024 + 1) }],
    Array.from({ length: 5 }, () => ({ ...face, bytes: Buffer.alloc(8 * 1024 * 1024) })),
    [{ ...face, weight: 900 }],
  ])
    await assert.rejects(createBundledTextMeasurer({ ...supply, fonts }), {
      code: "authored_canvas_font_measurement_invalid",
    });
});

test("same actual face with different bytes cannot overwrite a selected measured identity", async () => {
  const supply = await loadBundledFonts();
  const regular = supply.fonts.find(({ weight }) => weight === 400);
  const different = Buffer.concat([regular.bytes, Buffer.from("different exact resource")]);
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: [...supply.fonts, { ...regular, bytes: different, sha256: sha(different) }],
    }),
    { code: "authored_canvas_font_identity_ambiguous" },
  );
});

test("native raster supply measures shaped text in one bounded source-font batch", async () => {
  assert.equal(typeof rasterRuntime.Renderer.prototype.measureText, "function");
  const module = new WebAssembly.Module(
    await fs.readFile(
      new URL("../packages/publisher/renderers/resvg/supply/resvg/index_bg.wasm", import.meta.url),
    ),
  );
  const instance = new WebAssembly.Instance(module, { "./index_bg.js": rasterRuntime });
  rasterRuntime.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  const renderer = new rasterRuntime.Renderer();
  try {
    const fonts = await loadBundledFonts();
    for (const { bytes } of fonts.fonts) renderer.addFont(bytes);
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" font-family="JetBrains Mono"><text id="architecture-measure-0" x="100" y="200" font-size="16" font-weight="400">-&gt;</text><text id="architecture-measure-1" x="100" y="300" text-anchor="middle" font-size="16" font-weight="700">AV office ffi</text></svg>',
    );
    const boxes = renderer.measureText(svg, 2);
    assert.equal(boxes.length, 8);
    assert([...boxes].every(Number.isFinite));
    assert(boxes[2] > 0 && boxes[3] > 0 && boxes[6] > 0 && boxes[7] > 0);
    assert.throws(() => renderer.measureText(svg, 4097), /measurement_limit/u);
    assert.throws(() => renderer.measureText(svg, 3), /measurement_text_missing/u);
  } finally {
    renderer.free();
  }
});

test("authored measurer caches native shaped boxes and rejects an unprepared request", async () => {
  const fonts = await loadBundledFonts();
  const label = { text: "->", fontSize: 16, weight: "400", anchor: "start", x: 100, baseline: 200 };
  const measured = await createBundledTextMeasurer(fonts, [label]);
  const box = measured.box(label);
  assert(Math.abs(box.width - 16.64) <= 0.01);
  assert(Math.abs(box.height - 9.44) <= 0.01);
  assert.throws(() => measured.box({ ...label, text: "AV" }), {
    code: "authored_canvas_measurement_unprepared",
  });
});

test("native shaped preparation preserves anchors all selected weights and exact supported text", async () => {
  const fonts = await loadBundledFonts();
  const labels = ["400", "500", "600", "700"].flatMap((weight) =>
    ["start", "middle", "end"].flatMap((anchor) =>
      ["AV", "office", "ffi", "->", "==", "αβ", "Привет", "A  B"].map((text) => ({
        text,
        weight,
        anchor,
        fontSize: 16,
        x: 0,
        baseline: 0,
      })),
    ),
  );
  const measured = await createBundledTextMeasurer(fonts, labels);
  for (const label of labels) {
    const original = measured.box(label);
    const moved = measured.box({ ...label, x: 100, baseline: 200 });
    assert.equal(moved.width, original.width);
    assert.equal(moved.height, original.height);
    assert.equal(moved.x, original.x + 100);
    assert.equal(moved.y, original.y + 200);
    original.width = 0;
    assert(measured.box(label).width > 0, "returned objects must not mutate the native cache");
  }
  for (const text of ["e\u0301", "a\u200Db", "\u202EAV", "שלום", "A\tB", "A\u00A0B"])
    await assert.rejects(createBundledTextMeasurer(fonts, [{ ...labels[0], text }]), {
      code: "authored_canvas_text_profile_unsupported",
    });
  await assert.rejects(createBundledTextMeasurer(fonts, [{ ...labels[0], text: "问道" }]), {
    code: "authored_canvas_glyph_missing",
  });
});

test("neutral wrapping prepares exact contiguous word candidates before native measurement", async () => {
  const textModule = await import("../packages/publisher/renderers/elk/text.mjs");
  assert.equal(typeof textModule.wrappedLabelRequests, "function");
  const label = "Alpha office == Omega";
  const requests = [...textModule.wrappedLabelRequests(label)];
  assert.equal(requests.length, 10);
  assert(requests.some(({ text }) => text === "office == Omega"));
  const measure = await createBundledTextMeasurer(await loadBundledFonts(), requests);
  const result = textModule.measuredLabel(label, measure, { maximumWidth: 125 });
  assert.equal(result.lines.join(" "), label);
  assert(result.lines.length > 1);
  await assert.rejects(
    createBundledTextMeasurer(
      await loadBundledFonts(),
      textModule.wrappedLabelRequests("A ".repeat(100)),
    ),
    { code: "authored_canvas_text_measurement_limit" },
  );
});

test("static framing participates in the same native request cache and glyph budget", async () => {
  const canvasModule = await import("../packages/publisher/renderers/svg/canvas.mjs");
  assert.equal(typeof canvasModule.authoredCanvasFramingRequest, "function");
  const request = canvasModule.authoredCanvasFramingRequest("example:editor");
  const fonts = await loadBundledFonts();
  const measure = await createBundledTextMeasurer(fonts, [request]);
  assert(measure.box(request).height > 0);
  assert.throws(() => measure.box(canvasModule.authoredCanvasFramingRequest("another:editor")), {
    code: "authored_canvas_measurement_unprepared",
  });
});

test("shaped-cache identity includes exact text weight size anchor and family", async () => {
  const fonts = await loadBundledFonts();
  const label = {
    text: "Exact",
    fontSize: 16,
    weight: "400",
    anchor: "start",
    x: 10,
    baseline: 20,
  };
  const measure = await createBundledTextMeasurer(fonts, [label]);
  for (const change of [{ text: "exact" }, { fontSize: 17 }, { weight: "500" }, { anchor: "end" }])
    assert.throws(() => measure.box({ ...label, ...change }), {
      code: "authored_canvas_measurement_unprepared",
    });
  for (const change of [
    { fontSize: 0 },
    { fontSize: 5000 },
    { x: Infinity },
    { baseline: 100001 },
    { anchor: "center" },
  ])
    assert.throws(() => measure.box({ ...label, ...change }), {
      code: "authored_canvas_text_metrics_invalid",
    });
  for (const requests of [null, {}, 1])
    await assert.rejects(createBundledTextMeasurer(fonts, requests), {
      code: "authored_canvas_measurement_request_invalid",
    });
  await assert.rejects(createBundledTextMeasurer(fonts, [null]), {
    code: "authored_canvas_text_metrics_invalid",
  });
  await assert.rejects(
    createBundledTextMeasurer(
      fonts,
      Array.from({ length: 4097 }, () => label),
    ),
    { code: "authored_canvas_text_measurement_limit" },
  );
  await assert.rejects(
    createBundledTextMeasurer(
      fonts,
      Array.from({ length: 50 }, (_, index) => ({
        ...label,
        text: `${index}`.padStart(4096, "A"),
      })),
    ),
    { code: "authored_canvas_text_measurement_limit" },
  );
});
