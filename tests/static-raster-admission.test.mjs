import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { RASTER_LIMITS } from "../packages/publisher/renderers/resvg/limits.mjs";
import { root, hash, shape, withText, api, setup } from "./fixtures/static-raster.mjs";

test("raster bundle handoff rejects unselected paths and malformed font selectors", async (t) => {
  const f = await setup(t);
  const rasterize = await api();
  await assert.rejects(rasterize({ ...f.plan, manifest: "input/manifest.json" }), {
    code: "raster_path_required",
  });
  await assert.rejects(rasterize({ ...f.plan, output: "relative.png" }), {
    code: "raster_path_required",
  });
  await assert.rejects(rasterize({ ...f.plan, fonts: [{ path: "figure.svg" }] }), {
    code: "raster_fonts_invalid",
  });
  await assert.rejects(
    rasterize({
      ...f.plan,
      fonts: [{ path: "figure.svg", family: () => "invalid", weight: 400 }],
    }),
    { code: "raster_plan_invalid" },
  );
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("raster bundle handoff rejects oversized selections before cloning members", async (t) => {
  const f = await setup(t);
  const rasterize = await api();
  const fonts = Array.from({ length: RASTER_LIMITS.fonts + 1 }, () => ({}));
  let reads = 0;
  Object.defineProperty(fonts, 0, {
    get() {
      reads += 1;
      return {};
    },
  });
  await assert.rejects(rasterize({ ...f.plan, fonts }), { code: "raster_fonts_invalid" });
  assert.equal(reads, 0);
});

test("raster bundle handoff retains its selected plan across asynchronous reading", async (t) => {
  const f = await setup(t);
  const rasterize = await api();
  const selected = structuredClone(f.plan);
  const output = selected.output;
  const unselected = path.join(f.dir, "unselected.png");
  const pending = rasterize(selected);
  selected.svg = "absent.svg";
  selected.width = 1600;
  selected.output = unselected;
  selected.fonts.push({ path: "figure.svg" });
  const result = await pending;
  assert.equal(result.width, 800);
  assert.equal(result.artifact.sha256, hash(await fs.readFile(output)));
  await assert.rejects(fs.stat(unselected), { code: "ENOENT" });
});

test("rejects excess font count, individual bytes and aggregate bytes before rendering", async (t) => {
  const rasterize = await api();
  const count = await setup(t);
  await assert.rejects(
    rasterize({
      ...count.plan,
      fonts: Array(RASTER_LIMITS.fonts + 1).fill({}),
    }),
    { code: "raster_fonts_invalid" },
  );
  const member = await setup(t, shape, false, [
    {
      path: "oversize.ttf",
      content: Buffer.alloc(RASTER_LIMITS.fontBytes + 1),
    },
  ]);
  await assert.rejects(
    rasterize({
      ...member.plan,
      fonts: [
        {
          path: "oversize.ttf",
          family: "Oversize",
          weight: 400,
        },
      ],
    }),
    { code: "raster_fonts_invalid" },
  );
  const members = Array.from({ length: 5 }, (_, i) => ({
    path: `font-${i}.ttf`,
    content: Buffer.alloc(RASTER_LIMITS.fontBytes),
  }));
  const aggregate = await setup(t, shape, false, members);
  await assert.rejects(
    rasterize({
      ...aggregate.plan,
      fonts: members.map(({ path }, i) => ({
        path,
        family: `Font ${i}`,
        weight: 400,
      })),
    }),
    { code: "raster_fonts_invalid" },
  );
  for (const f of [count, member, aggregate]) {
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    assert.deepEqual(await fs.readdir(f.dir), ["input"]);
  }
});

test("rejects corrupt, duplicated and unsupported font selections", async (t) => {
  const bytes = await fs.readFile(
    path.join(root, "packages/publisher/renderers/fonts/supply/JetBrainsMono-Regular.ttf"),
  );
  for (const [name, content, fonts, code] of [
    [
      "corrupt",
      Buffer.from("not a font"),
      [{ path: "other.ttf", family: "JetBrains Mono", weight: 400 }],
      "raster_font_invalid",
    ],
    [
      "duplicate identity",
      bytes,
      [
        { path: "fonts/regular.ttf", family: "JetBrains Mono", weight: 400 },
        { path: "other.ttf", family: "JetBrains Mono", weight: 400 },
      ],
      "raster_font_duplicate",
    ],
    [
      "duplicate member",
      bytes,
      Array(2).fill({
        path: "other.ttf",
        family: "JetBrains Mono",
        weight: 400,
      }),
      "raster_fonts_invalid",
    ],
  ]) {
    await t.test(name, async () => {
      const f = await setup(t, withText("Verify"), true, [{ path: "other.ttf", content }]);
      await assert.rejects((await api())({ ...f.plan, fonts }), { code });
      await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
      assert.deepEqual(await fs.readdir(f.dir), ["input"]);
    });
  }
  for (const attribute of ['font-style="italic"', 'font-family="Missing, JetBrains Mono"']) {
    const svg = attribute.startsWith("font-family")
      ? withText("Verify").replace('font-family="JetBrains Mono"', attribute)
      : withText("Verify").replace("<text ", `<text ${attribute} `);
    const f = await setup(t, svg, true);
    await assert.rejects((await api())(f.plan), {
      code: "raster_font_unbound",
    });
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
  }
});

test("rejects invalid XML encoding, SVG bytes and dimensions through public raster", async (t) => {
  for (const [svg, code] of [
    [Buffer.from([0xff, 0xfe]), "raster_svg_invalid"],
    [Buffer.alloc(RASTER_LIMITS.svgBytes + 1), "raster_svg_size_exceeded"],
    [shape.replace('height="100"', 'height="0.0001"'), "raster_dimensions_invalid"],
    [shape.replace('width="200"', 'width="1"'), "raster_dimensions_invalid"],
    [shape.replace('xmlns="http://www.w3.org/2000/svg"', ""), "raster_svg_unsupported"],
  ]) {
    const f = await setup(t, svg);
    await assert.rejects((await api())(f.plan), { code });
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    assert.deepEqual(await fs.readdir(f.dir), ["input"]);
  }
});

test("rejects absent font, missing glyph, mismatched family and missing weight", async (t) => {
  const rasterize = await api();
  for (const [text, fonts, change] of [
    ["Verify", false, (p) => p],
    ["问道", true, (p) => p],
    [
      "Verify",
      true,
      (p) => {
        p.fonts[0].family = "Unrelated";
        return p;
      },
    ],
    [
      "Verify",
      true,
      (p) => {
        p.fonts[0].weight = 600;
        return p;
      },
    ],
  ]) {
    const f = await setup(t, withText(text), fonts);
    await assert.rejects(rasterize(change(f.plan)));
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
  }
});

test("rejects extra plan fields and invalid dimensions before output", async (t) => {
  const f = await setup(t),
    rasterize = await api();
  for (const p of [
    { ...f.plan, plugin: "./arbitrary.mjs" },
    ...[0, -1, 1.5, 8193, Infinity].map((width) => ({ ...f.plan, width })),
  ])
    await assert.rejects(rasterize(p));
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
  const tall = await setup(t, shape.replace('height="100"', 'height="1000000"'));
  await assert.rejects(rasterize(tall.plan));
});

test("rejects changed bundle and missing SVG member", async (t) => {
  const f = await setup(t),
    rasterize = await api();
  await assert.rejects(rasterize({ ...f.plan, manifestSha256: "0".repeat(64) }));
  await assert.rejects(rasterize({ ...f.plan, svg: "absent.svg" }));
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("closed bundle failures never reserve raster output", async (t) => {
  for (const kind of ["changed", "missing", "extra", "symlink"]) {
    const f = await setup(t);
    const member = path.join(f.dir, "input/figure.svg");
    if (kind === "changed") await fs.writeFile(member, Buffer.alloc(Buffer.byteLength(shape), "x"));
    if (kind === "missing") await fs.unlink(member);
    if (kind === "extra") await fs.writeFile(path.join(f.dir, "input/extra"), "extra");
    if (kind === "symlink") {
      const target = path.join(f.dir, "physical.svg");
      await fs.writeFile(target, shape);
      await fs.unlink(member);
      await fs.symlink(target, member);
    }
    const before = (await fs.readdir(f.dir)).sort();
    await assert.rejects((await api())(f.plan), {
      code:
        kind === "changed"
          ? "member_digest_mismatch"
          : kind === "symlink"
            ? "bundle_symlink_forbidden"
            : "bundle_members_mismatch",
    });
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    assert.deepEqual((await fs.readdir(f.dir)).sort(), before);
  }
});

test("preserves occupied output and rejects symlink parent", async (t) => {
  const f = await setup(t),
    rasterize = await api();
  await fs.writeFile(f.plan.output, "keep");
  await assert.rejects(rasterize(f.plan), { code: "raster_output_exists" });
  assert.equal(await fs.readFile(f.plan.output, "utf8"), "keep");
  const link = path.join(f.dir, "link");
  await fs.symlink(f.dir, link);
  await assert.rejects(rasterize({ ...f.plan, output: path.join(link, "new.png") }), {
    code: "raster_output_parent_invalid",
  });
  const nested = path.join(f.dir, "nested");
  await fs.mkdir(nested);
  await assert.rejects(rasterize({ ...f.plan, output: path.join(link, "nested", "new.png") }), {
    code: "raster_output_parent_invalid",
  });
  assert.deepEqual(await fs.readdir(nested), []);
  const occupiedLink = path.join(f.dir, "occupied-link.png");
  await fs.symlink(f.plan.output, occupiedLink);
  await assert.rejects(rasterize({ ...f.plan, output: occupiedLink }), {
    code: "raster_output_exists",
  });
  assert.equal(await fs.readlink(occupiedLink), f.plan.output);
  assert.equal(await fs.readFile(f.plan.output, "utf8"), "keep");
});

test("concurrently arriving output is preserved", async (t) => {
  const { Worker } = await import("node:worker_threads");
  const f = await setup(t),
    rasterize = await api();
  const worker = new Worker(
    `
    const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs');
    const deadline=Date.now()+10000;
    const timer=setInterval(()=>{
      if(fs.readdirSync(workerData.dir).some(n=>n.startsWith('.architecture-raster-'))){
        fs.writeFileSync(workerData.output,'concurrent owner',{flag:'wx'});
        clearInterval(timer);parentPort.postMessage('written');
      }else if(Date.now()>deadline){clearInterval(timer);parentPort.postMessage('timeout');}
    },1);parentPort.postMessage('ready');
  `,
    { eval: true, workerData: { dir: f.dir, output: f.plan.output } },
  );
  t.after(() => worker.terminate());
  await new Promise((resolve, reject) => {
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  await assert.rejects(rasterize(f.plan), { code: "raster_output_exists" });
  assert.equal(await fs.readFile(f.plan.output, "utf8"), "concurrent owner");
  assert.deepEqual((await fs.readdir(f.dir)).sort(), ["figure.png", "input"]);
});
