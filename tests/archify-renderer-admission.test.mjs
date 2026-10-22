import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDiagram } from "../packages/publisher/renderers/archify/index.mjs";
import * as renderer from "../packages/publisher/renderers/archify/index.mjs";
import { serviceTopology } from "./fixtures/diagrams.mjs";
import { sha, setup } from "./fixtures/archify-renderer.mjs";

test("native renderer rejects malformed selection before loading supply or writing output", async (t) => {
  const f = await setup(t);
  const selected = { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output };
  for (const [plan, code] of [
    [null, "render_type_unsupported"],
    [{ ...selected, type: "unknown" }, "render_type_unsupported"],
    [{ ...selected, inputBytes: "not bytes" }, "render_input_type_invalid"],
    [{ ...selected, inputBytes: Buffer.alloc(4 * 1024 * 1024 + 1) }, "render_input_type_invalid"],
    [{ ...selected, output: "relative.html" }, "render_path_required"],
  ])
    await assert.rejects(
      renderer.renderNativeDiagram(plan, async () => {}),
      { code },
    );
  await assert.rejects(renderer.renderNativeDiagram(selected, null), {
    code: "render_adaptation_required",
  });
  await assert.rejects(
    renderer.renderNativeDiagram({ ...selected, inputBytes: Buffer.from("{") }, async () => {}),
    {
      code: "render_input_json_invalid",
    },
  );
  await assert.rejects(
    renderer.renderNativeDiagram({ ...selected, inputBytes: Buffer.from("{}") }, async () => {}),
    { code: "render_type_mismatch" },
  );
  const noShowcase = structuredClone(f.diagram);
  delete noShowcase.meta.quality_profile;
  await assert.rejects(
    renderer.renderNativeDiagram(
      { ...selected, inputBytes: Buffer.from(JSON.stringify(noShowcase)) },
      async () => {},
    ),
    { code: "render_showcase_required" },
  );
  await assert.rejects(
    renderer.renderNativeDiagram(
      { ...selected, output: path.join(f.root, "absent", "diagram.html") },
      async () => {},
    ),
    { code: "render_output_parent_invalid" },
  );
  assert.deepEqual(await fs.readdir(f.root), ["diagram.json"]);
});

test("private output normalization cannot exceed the admitted input bound", async (t) => {
  const f = await setup(t);
  const diagram = serviceTopology();
  const limit = 4 * 1024 * 1024;
  diagram.meta.title += "x".repeat(limit - Buffer.byteLength(JSON.stringify(diagram)));
  const inputBytes = Buffer.from(JSON.stringify(diagram));
  assert.equal(inputBytes.length, limit);
  let adapted = false;
  await assert.rejects(
    renderer.renderNativeDiagram(
      { type: "architecture", inputBytes, output: f.plan.output },
      async () => {
        adapted = true;
      },
    ),
    { code: "render_input_type_invalid" },
  );
  assert.equal(adapted, false);
  assert.deepEqual(await fs.readdir(f.root), ["diagram.json"]);
});

test("public renderer rejects invalid digest and non-absolute paths before effects", async (t) => {
  const f = await setup(t);
  for (const [plan, code] of [
    [null, "render_type_unsupported"],
    [{ ...f.plan, inputSha256: "wrong" }, "render_input_digest_required"],
    [{ ...f.plan, input: "relative.json" }, "render_path_required"],
    [{ ...f.plan, output: "relative.html" }, "render_path_required"],
  ])
    await assert.rejects(renderDiagram(plan), { code });
  await assert.rejects(renderer.renderArchitectureScene(null), {
    code: "render_scene_plan_invalid",
  });
  assert.deepEqual(await fs.readdir(f.root), ["diagram.json"]);
});

test("native renderer rejects adaptation receipts that misstate supplies", async (t) => {
  const f = await setup(t);
  const plan = { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output };
  for (const supplies of [
    "not-an-array",
    [null],
    [{ id: "font", sha256: "wrong" }],
    [{ id: "archify", sha256: "0".repeat(64) }],
    [{ id: "font", sha256: "0".repeat(64), extra: true }],
  ]) {
    await assert.rejects(
      renderer.renderNativeDiagram(plan, async () => ({ supplies })),
      {
        code: "render_adaptation_receipt_invalid",
      },
    );
    await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
  }
});

test("Archify supply faults never reach adaptation or create final HTML", async (t) => {
  const supplyRoot = fileURLToPath(
    new URL("../packages/publisher/renderers/archify/supply", import.meta.url),
  );
  const manifest = path.join(supplyRoot, "supply.json");
  const member = path.join(supplyRoot, "renderers/shared/utils.mjs");
  const shared = path.join(supplyRoot, "renderers/shared");
  const fakeEntry = (name, kind) => ({
    name,
    isSymbolicLink: () => kind === "link",
    isDirectory: () => false,
    isFile: () => kind === "file",
  });
  const corrupted = (value) => {
    const copy = Buffer.from(value);
    copy[0] ^= 1;
    return copy;
  };
  for (const [name, method, selected, alter] of [
    [
      "missing manifest",
      "lstat",
      (file) => file === manifest,
      () => {
        throw Error("gone");
      },
    ],
    [
      "unreadable manifest",
      "readFile",
      (file) => file === manifest,
      () => {
        throw Error("denied");
      },
    ],
    ["short manifest read", "readFile", (file) => file === manifest, (value) => value.subarray(1)],
    ["changed manifest bytes", "readFile", (file) => file === manifest, corrupted],
    ["changed selected member", "readFile", (file) => file === member, corrupted],
    [
      "unlisted file",
      "readdir",
      (directory) => path.resolve(directory) === path.resolve(supplyRoot),
      (entries) => [...entries, fakeEntry("unlisted.txt", "file")],
    ],
    [
      "linked entry",
      "readdir",
      (directory) => path.resolve(directory) === path.resolve(supplyRoot),
      (entries) => [...entries, fakeEntry("outside", "link")],
    ],
    [
      "missing inventory member",
      "readdir",
      (directory) => path.resolve(directory) === shared,
      (entries) => entries.filter(({ name: entry }) => entry !== "utils.mjs"),
    ],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      const original = fs[method].bind(fs);
      caseTest.mock.method(fs, method, async (target, ...rest) => {
        const value = await original(target, ...rest);
        return selected(target) ? alter(value) : value;
      });
      let adapted = false;
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async () => {
            adapted = true;
            return { supplies: [] };
          },
        ),
        { code: "render_supply_invalid" },
      );
      assert.equal(adapted, false);
      await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    });
});

test("untrusted native replies cannot mint a rendered artifact", async (t) => {
  for (const [name, source, code] of [
    ["malformed JSON", () => "process.stdout.write('{');", "render_receipt_invalid"],
    [
      "rejection without diagnostics",
      () => `process.stdout.write(${JSON.stringify(JSON.stringify({ ok: false }))});`,
      "render_native_rejected",
    ],
    [
      "unbound success",
      () => `process.stdout.write(${JSON.stringify(JSON.stringify({ ok: true }))});`,
      "render_receipt_invalid",
    ],
    [
      "false artifact digest",
      (f) => {
        const nativeInput = Buffer.from(
          JSON.stringify({ ...f.diagram, meta: { ...f.diagram.meta, output: "candidate.html" } }) +
            "\n",
        );
        const receipt = {
          ok: true,
          command: "deliver",
          type: f.plan.type,
          specification: { sha256: sha(nativeInput), bytes: nativeInput.length },
          validation: {
            checkCount: 9,
            checksPassed: 9,
            compositionProfile: "showcase",
            errors: 0,
            warnings: 0,
          },
          update: { status: "unavailable", reason: "disabled" },
          artifact: { sha256: "0".repeat(64), bytes: 13 },
        };
        return `import fs from 'node:fs'; fs.writeFileSync(process.argv[5], '<html></html>'); process.stdout.write(${JSON.stringify(JSON.stringify(receipt))});`;
      },
      "render_artifact_invalid",
    ],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async (native) => {
            await fs.writeFile(path.join(native, "bin/archify.mjs"), source(f));
            return { supplies: [] };
          },
        ),
        { code },
      );
      await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
      assert.deepEqual(await fs.readdir(f.root), ["diagram.json"]);
    });
});

test("adapted runtime inventory refuses non-regular members", async (t) => {
  for (const [name, kind] of [
    ["linked member", "link"],
    ["special member", "special"],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      const original = fs.readdir.bind(fs);
      caseTest.mock.method(fs, "readdir", async (directory, ...rest) => {
        const entries = await original(directory, ...rest);
        if (!directory.includes(".architecture-render-") || path.basename(directory) !== "runtime")
          return entries;
        return [
          ...entries,
          {
            name: "unselected",
            isSymbolicLink: () => kind === "link",
            isDirectory: () => false,
            isFile: () => false,
          },
        ];
      });
      let adapted = false;
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async () => {
            adapted = true;
            return { supplies: [] };
          },
        ),
        { code: "render_adaptation_receipt_invalid" },
      );
      assert.equal(adapted, true);
      await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
    });
});

test("template validation refuses a missing embedded font seam", async (t) => {
  const f = await setup(t);
  const original = fs.readFile.bind(fs);
  t.mock.method(fs, "readFile", async (file, ...rest) => {
    const result = await original(file, ...rest);
    return typeof file === "string" &&
      file.includes(".architecture-render-") &&
      file.endsWith(path.join("assets", "template.html"))
      ? result.replace('<style id="archify-fonts">', '<style id="missing-fonts">')
      : result;
  });
  await assert.rejects(renderDiagram(f.plan), { code: "render_font_seam_invalid" });
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("publication refuses a generated SVG without its native accessibility container", async (t) => {
  const f = await setup(t);
  const original = fs.writeFile.bind(fs);
  t.mock.method(fs, "writeFile", async (file, content, ...rest) => {
    const selected =
      typeof file === "string" &&
      file.includes(".architecture-render-") &&
      file.endsWith(path.join("renderers", "shared", "cli.mjs"))
        ? Buffer.from(
            content.toString().replace('return `role="img" lang=', 'return `role="svg" lang='),
          )
        : content;
    return original(file, selected, ...rest);
  });
  await assert.rejects(renderDiagram(f.plan), { code: "render_svg_accessibility_seam_invalid" });
  await assert.rejects(fs.stat(f.plan.output), { code: "ENOENT" });
});

test("a linked output parent cannot redirect a final Archify artifact", async (t) => {
  if (process.platform === "win32") {
    t.skip("symlink creation requires a separate native Windows privilege fixture");
    return;
  }
  const f = await setup(t);
  const destination = path.join(f.root, "destination");
  const alias = path.join(f.root, "alias");
  await fs.mkdir(destination);
  await fs.symlink(destination, alias);
  await assert.rejects(
    renderer.renderNativeDiagram(
      { type: f.plan.type, inputBytes: f.bytes, output: path.join(alias, "diagram.html") },
      async () => ({ supplies: [] }),
    ),
    { code: "render_output_parent_invalid" },
  );
  assert.deepEqual(await fs.readdir(destination), []);
});
