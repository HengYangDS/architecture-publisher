import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { validateSvg } from "../packages/publisher/renderers/resvg/validation.mjs";
import { RASTER_LIMITS } from "../packages/publisher/renderers/resvg/limits.mjs";
import { root, hash, shape, withText, api, setup } from "./fixtures/static-raster.mjs";

test("the supplied XML parser rejects character references outside XML Char", () => {
  for (const value of ["&#0;", "&#xD800;", "&#xFFFF;", "&#x110000;"]) {
    const bytes = Buffer.from(shape.replace("</svg>", `<title>${value}</title></svg>`));
    assert.throws(() => validateSvg(bytes, [], 800), value);
  }
});

test("raster backend consumes selected bytes without Source Bundle authority", async (t) => {
  const { rasterizeBytes } = await import("../packages/publisher/renderers/resvg/index.mjs");
  assert.equal(typeof rasterizeBytes, "function");
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, "raster-bytes-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const plan = {
    svg: Buffer.from(shape),
    fonts: [],
    width: 800,
    output: path.join(dir, "figure.png"),
  };
  const result = await rasterizeBytes(plan);
  assert.equal(result.artifact.sha256, hash(await fs.readFile(plan.output)));
  assert.equal(Object.hasOwn(result, "source"), false);
  assert.equal(Object.hasOwn(result, "manifestSha256"), false);
  await assert.rejects(
    rasterizeBytes({ ...plan, source: { id: "unverified" }, output: path.join(dir, "extra.png") }),
    { code: "raster_plan_invalid" },
  );
  await assert.rejects(
    rasterizeBytes({ ...plan, svg: "<svg/>", output: path.join(dir, "invalid.png") }),
    { code: "raster_plan_invalid" },
  );
  await assert.rejects(rasterizeBytes({ ...plan, output: "relative.png" }), {
    code: "raster_path_required",
  });
  await assert.rejects(fs.stat(path.join(dir, "invalid.png")), { code: "ENOENT" });
});

test("raster backend binds caller bytes and output before its first await", async (t) => {
  const { rasterizeBytes } = await import("../packages/publisher/renderers/resvg/index.mjs");
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, "raster-snapshot-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const original = Buffer.from(shape);
  const output = path.join(dir, "selected.png");
  const unselected = path.join(dir, "unselected.png");
  const plan = { svg: Buffer.from(original), fonts: [], width: 800, output };
  const pending = rasterizeBytes(plan);
  plan.svg.fill(0);
  plan.width = 1600;
  plan.output = unselected;
  const result = await pending;
  assert.equal(result.width, 800);
  assert.equal(result.svgSha256, hash(original));
  assert.equal(result.artifact.sha256, hash(await fs.readFile(output)));
  await assert.rejects(fs.stat(unselected), { code: "ENOENT" });
});

test("rasterizes an explicit shape-only SVG without fonts or interactive dependencies", async (t) => {
  const f = await setup(t),
    rasterize = await api(),
    r = await rasterize(f.plan);
  const png = await fs.readFile(f.plan.output);
  assert.equal(r.status, "rendered");
  assert.equal(r.width, 800);
  assert.equal(r.height, 400);
  assert.equal(r.artifact.sha256, hash(png));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.readUInt32BE(16), 800);
  assert.equal(png.readUInt32BE(20), 400);
  assert.equal(r.browserAcceptance, "not-performed");
  assert.equal(r.semanticAcceptance, "not-performed");
  assert.deepEqual((await fs.readdir(f.dir)).sort(), ["figure.png", "input"]);
});

test("rasterizes supplied font bytes and changes output after authored text update", async (t) => {
  const a = await setup(t, withText("Verify"), true),
    b = await setup(t, withText("Observe"), true),
    rasterize = await api();
  const first = await rasterize(a.plan),
    second = await rasterize(b.plan);
  assert.notEqual(first.artifact.sha256, second.artifact.sha256);
  const repeated = await rasterize({
    ...a.plan,
    output: path.join(a.dir, "repeat.png"),
  });
  assert.equal(first.artifact.sha256, repeated.artifact.sha256);
});

test("supports internal gradient, clipping and use references", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g"><stop offset="0" stop-color="#29372f"/><stop offset="1" stop-color="#b9bfb2"/></linearGradient><path id="line" d="M 10 20 H 80"/><clipPath id="clip"><rect width="90" height="90"/></clipPath></defs><rect width="100" height="100" fill="url(#g)"/><use href="#line" stroke="#fff" clip-path="url(#clip)"/></svg>';
  const f = await setup(t, svg),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).width, 800);
});

for (const [name, definition, body] of [
  [
    "fill",
    '<rect id="target" width="20" height="20"/>',
    '<rect width="100" height="100" fill="url(#target)"/>',
  ],
  [
    "stroke",
    '<clipPath id="target"><rect width="20" height="20"/></clipPath>',
    '<path d="M10 50 H90" stroke="url(#target)"/>',
  ],
  [
    "clip-path",
    '<linearGradient id="target"><stop offset="0" stop-color="red"/></linearGradient>',
    '<rect width="100" height="100" clip-path="url(#target)"/>',
  ],
  ...["marker-start", "marker-mid", "marker-end"].map((kind) => [
    kind,
    '<path id="target" d="M0 0 L10 5 L0 10 Z"/>',
    `<path d="M10 50 H50 H90" stroke="black" ${kind}="url(#target)"/>`,
  ]),
  [
    "linearGradient href",
    '<rect id="target" width="20" height="20"/><linearGradient id="paint" href="#target"/>',
    '<rect width="100" height="100" fill="url(#paint)"/>',
  ],
  [
    "radialGradient xlink:href",
    '<rect id="target" width="20" height="20"/><radialGradient id="paint" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#target"/>',
    '<rect width="100" height="100" fill="url(#paint)"/>',
  ],
]) {
  test(`rejects wrong internal reference target type for ${name} without publishing`, async (t) => {
    const f = await setup(
      t,
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs>${definition}</defs>${body}</svg>`,
    );
    await assert.rejects((await api())(f.plan), {
      code: "raster_svg_reference_type_invalid",
    });
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    assert.deepEqual(await fs.readdir(f.dir), ["input"]);
  });
}

test("preserves cross-kind gradient templates and actual marker rendering", async (t) => {
  const stops = '<stop offset="0" stop-color="#29372f"/><stop offset="1" stop-color="#b9bfb2"/>';
  const wrap = (definition, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs>${definition}</defs>${body}</svg>`;
  const rasterize = await api();
  for (const [template, paint] of [
    ["linearGradient", "radialGradient"],
    ["radialGradient", "linearGradient"],
  ]) {
    const body = '<rect width="100" height="100" fill="url(#paint)"/>';
    const inherited = await setup(
      t,
      wrap(
        `<${template} id="template">${stops}</${template}><${paint} id="paint" href="#template"/>`,
        body,
      ),
    );
    const direct = await setup(t, wrap(`<${paint} id="paint">${stops}</${paint}>`, body));
    assert.equal(
      (await rasterize(inherited.plan)).artifact.sha256,
      (await rasterize(direct.plan)).artifact.sha256,
    );
  }
  const marker =
    '<marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z"/></marker>';
  const line = '<path d="M20 50 H50 H80" stroke="black"';
  const baseline = await setup(t, wrap(marker, line + "/>"));
  const baselineHash = (await rasterize(baseline.plan)).artifact.sha256;
  for (const kind of ["marker-start", "marker-mid", "marker-end"]) {
    const marked = await setup(t, wrap(marker, line + ` ${kind}="url(#arrow)"/>`));
    assert.notEqual((await rasterize(marked.plan)).artifact.sha256, baselineHash);
  }
});

for (const body of [
  '<rect width="20" height="20" fill="not-a-color"/>',
  '<path d="M0 0 L"/>',
  '<g transform="translate(banana)"/>',
  '<path stroke-width="NaN"/>',
  '<path stroke-linecap="triangle"/>',
]) {
  test(`invalid SVG value never publishes a PNG: ${body}`, async (t) => {
    const f = await setup(t, shape.replace("</svg>", body + "</svg>"));
    await assert.rejects((await api())(f.plan), {
      code: "raster_svg_value_invalid",
    });
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    assert.deepEqual(await fs.readdir(f.dir), ["input"]);
  });
}

for (const [name, svg] of [
  ["script", shape.replace("</svg>", "<script>alert(1)</script></svg>")],
  ["event handler", shape.replace("<rect", '<rect onclick="run()"')],
  ["external use", shape.replace("</svg>", '<use href="file:///private/input.svg#x"/></svg>')],
  [
    "entity-encoded external reference",
    shape.replace("</svg>", '<use href="&#104;ttps://example.invalid/x.svg#x"/></svg>'),
  ],
  ["stylesheet", shape.replace("</svg>", "<style>rect{fill:red}</style></svg>")],
  [
    "embedded HTML",
    shape.replace(
      "</svg>",
      '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject></svg>',
    ),
  ],
  ["animation", shape.replace("</svg>", '<animate attributeName="opacity" values="0;1"/></svg>')],
  ["DTD", '<!DOCTYPE svg SYSTEM "file:///private/source">' + shape],
  ["processing instruction", '<?xml-stylesheet href="https://example.invalid/style.css"?>' + shape],
  ["image", shape.replace("</svg>", '<image href="data:image/png;base64,AA=="/></svg>')],
  [
    "external CSS paint",
    shape.replace('fill="#f5f3ed"', 'fill="url(https://example.invalid/paint)"'),
  ],
  ["inline CSS", shape.replace("<rect", '<rect style="fill:red"')],
  [
    "foreign namespace",
    shape.replace("</svg>", '<x:path xmlns:x="urn:unknown" d="M0 0 H10"/></svg>'),
  ],
  ["malformed XML", shape.replace("</svg>", "</g>")],
  ["unbound internal reference", shape.replace("</svg>", '<use href="#absent"/></svg>')],
  ["duplicate identity", shape.replace("</svg>", '<g id="same"/><g id="same"/></svg>')],
  [
    "cyclic use",
    shape.replace(
      "</svg>",
      '<defs><g id="cycle"><use href="#cycle"/></g></defs><use href="#cycle"/></svg>',
    ),
  ],
])
  test(`rejects ${name} instead of silently dropping it`, async (t) => {
    const f = await setup(t, svg),
      rasterize = await api();
    await assert.rejects(rasterize(f.plan));
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
  });

test("preserves explicit font declarations inside a referenced group", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs><g id="caption" font-family="JetBrains Mono"><text x="10" y="50">Verify</text></g></defs><use href="#caption" font-family="Missing"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).status, "rendered");
});

test("checks referenced text in the instance font context, not the definition ancestors", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" font-family="JetBrains Mono"><defs font-weight="400"><g id="caption"><text x="10" y="50">Verify</text></g></defs><use href="#caption" font-weight="700"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: "raster_font_unbound" });
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("resolves nested text instances from explicitly selected use fonts", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs><g id="caption"><text x="10" y="50">Verify</text></g><g id="nested"><use href="#caption"/></g></defs><use href="#nested" font-family="JetBrains Mono"/></svg>';
  const direct =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50" font-family="JetBrains Mono">Verify</text></svg>';
  const a = await setup(t, svg, true),
    b = await setup(t, direct, true),
    rasterize = await api();
  assert.equal(
    (await rasterize(a.plan)).artifact.sha256,
    (await rasterize(b.plan)).artifact.sha256,
  );
});

test("checks every text instance even when another instance already passed", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" font-family="JetBrains Mono"><defs><text id="caption" x="10" y="50">Verify</text></defs><use href="#caption"/><use href="#caption" font-weight="700"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: "raster_font_unbound" });
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("rejects undeclared font families inherited through use", async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs font-family="JetBrains Mono"><text id="caption" x="10" y="50">Verify</text></defs><use href="#caption" font-family="Missing"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: "raster_font_unbound" });
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("bounds SVG bytes, nesting, elements and reference chains before rendering", () => {
  const base = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">${body}</svg>`;
  const check = (svg) => validateSvg(Buffer.from(svg), [], 800);
  assert.throws(() => validateSvg(Buffer.alloc(RASTER_LIMITS.svgBytes + 1), [], 800), {
    code: "raster_svg_size_exceeded",
  });
  assert.throws(
    () => check(base("<g>".repeat(RASTER_LIMITS.depth) + "</g>".repeat(RASTER_LIMITS.depth))),
    { code: "raster_svg_limit" },
  );
  assert.throws(() => check(base("<g/>".repeat(RASTER_LIMITS.elements))), {
    code: "raster_svg_limit",
  });
  // Reverse references catch a cached-subgraph traversal that checks only
  // current recursion depth rather than the longest expanded path.
  const chain = [
    '<g id="n0"/>',
    ...Array.from(
      { length: RASTER_LIMITS.referenceDepth + 1 },
      (_, i) => `<use id="n${i + 1}" href="#n${i}"/>`,
    ),
  ];
  assert.throws(() => check(base("<defs>" + chain.join("") + "</defs>")), {
    code: "raster_svg_limit",
  });
});

test("rejects excessive pixel area and retains a valid large canvas bound", () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0 H100"/></svg>',
  );
  assert.throws(() => validateSvg(svg, [], 8192), {
    code: "raster_dimensions_invalid",
  });
  assert.equal(validateSvg(svg, [], 4096).height, 4096);
});

test("bounds reference fanout and distinct inherited font contexts", () => {
  const wrap = (body) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">${body}</svg>`);
  const definitions =
    '<defs><linearGradient id="paint"/><clipPath id="clip"/><marker id="mark"/></defs>';
  const referenced =
    '<path fill="url(#paint)" stroke="url(#paint)" clip-path="url(#clip)" marker-start="url(#mark)" marker-mid="url(#mark)" marker-end="url(#mark)"/>';
  assert.throws(
    () =>
      validateSvg(
        wrap(definitions + referenced.repeat(Math.floor(RASTER_LIMITS.references / 6) + 1)),
        [],
        100,
      ),
    { code: "raster_svg_limit" },
  );
  // Far fewer than the element/reference limits, but every host has a distinct
  // inherited context. A cached first instance must not erase the work bound.
  const children = 120;
  const hosts = Math.ceil(RASTER_LIMITS.fontContexts / children) + 1;
  const instances = Array.from(
    { length: hosts },
    (_, i) => `<use href="#cluster" font-family="Context ${i}"/>`,
  ).join("");
  assert.throws(
    () =>
      validateSvg(
        wrap('<defs><g id="cluster">' + "<path/>".repeat(children) + "</g></defs>" + instances),
        [],
        100,
      ),
    { code: "raster_svg_limit" },
  );
});

test("inherits explicitly selected fonts and resolves bold only to supplied weight", async (t) => {
  const svg = withText("Verify")
    .replace('font-family="JetBrains Mono"', "")
    .replace("<text", '<g font-family="JetBrains Mono"><text')
    .replace("</text>", "</text></g>");
  const f = await setup(t, svg, true),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).status, "rendered");
  const bold = await setup(t, svg.replace("<text", '<text font-weight="bold"'), true);
  await assert.rejects(rasterize(bold.plan), { code: "raster_font_unbound" });
});
