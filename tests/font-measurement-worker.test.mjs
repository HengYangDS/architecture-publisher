import assert from "node:assert/strict";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import { pathToFileURL } from "node:url";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { withOwnedProcessScope } from "../packages/publisher/src/runtime/process-tree.mjs";

import { spawnSync } from "node:child_process";

async function selectedWorkerFixture(t, body) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-measure-worker-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const renderer = path.join(root, "packages/publisher/renderers/resvg");
  await fs.cp(new URL("../packages/publisher/renderers/resvg/", import.meta.url), renderer, {
    recursive: true,
  });
  await fs.cp(
    new URL("../packages/publisher/src/protocol/", import.meta.url),
    path.join(root, "packages/publisher/src/protocol"),
    { recursive: true },
  );
  await fs.cp(
    new URL("../packages/publisher/src/runtime/", import.meta.url),
    path.join(root, "packages/publisher/src/runtime"),
    { recursive: true },
  );
  await fs.writeFile(path.join(renderer, "worker.mjs"), body);
  const module = await import(pathToFileURL(path.join(renderer, "measurement.mjs")).href);
  return { root, module };
}

test("native shaping registers exactly one live worker and reclaims it before returning cached boxes", async () => {
  const fonts = await loadBundledFonts();
  const registrations = [];
  const releases = [];
  const label = {
    text: "AV office",
    fontSize: 16,
    weight: "600",
    anchor: "middle",
    x: 0,
    baseline: 0,
  };
  const measured = await withOwnedProcessScope(
    {
      registerOwned: async (pid) => registrations.push(pid),
      releaseOwned: async (pid) => releases.push(pid),
    },
    () => createBundledTextMeasurer(fonts, [label, { ...label, x: 100 }]),
  );
  assert.equal(registrations.length, 1);
  assert.deepEqual(releases, registrations);
  assert.throws(() => process.kill(registrations[0], 0), { code: "ESRCH" });
  assert(measured.box(label).width > 0);
  assert.equal(registrations.length, 1, "cache reads may not start another worker");
});

test("measurement worker enforces finite-file input resource flags and one selected request", async (t) => {
  const code = `import fs from 'node:fs';
const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const regular = fs.fstatSync(0).isFile();
const eof = fs.readSync(0, Buffer.alloc(1), 0, 1, null) === 0;
const bounded = process.execArgv.includes('--max-old-space-size=512') && process.execArgv.includes('--wasm-max-mem-pages=8192');
process.stdout.write(JSON.stringify({status:'measured',boxes:regular && eof && bounded && request.schema==='architecture.raster-measurement-request/v1' && request.count===1 ? [0,-10,20,10] : []})+'\\n');
setInterval(()=>{},1000);`;
  const { module } = await selectedWorkerFixture(t, code);
  const label = {
    text: "Exact",
    fontSize: 16,
    weight: "400",
    anchor: "start",
    x: 30,
    baseline: 60,
  };
  const measured = await module.createBundledTextMeasurer(await loadBundledFonts(), [label]);
  assert.deepEqual(measured.box(label), { x: 30, y: 50, width: 20, height: 10 });
});

test("native measurement refuses malformed interrupted and diagnostic worker replies", async (t) => {
  const selected = await selectedWorkerFixture(t, "");
  const worker = path.join(selected.root, "packages/publisher/renderers/resvg/worker.mjs");
  const font = await loadBundledFonts();
  const label = { text: "A", fontSize: 16, weight: "400", anchor: "start", x: 0, baseline: 0 };
  const replies = [
    ['process.stdout.write("{broken\\n");', "authored_canvas_measurement_response_invalid"],
    ['process.stdout.write("null\\n");', "authored_canvas_measurement_response_invalid"],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,1]}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,0,1]}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,1,"wrong"]}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"error","code":"measurement_text_missing"}\\n\');',
      "measurement_text_missing",
    ],
    [
      'process.stdout.write(\'{"status":"error","code":{}}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"error","code":"Bad-Error"}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"waiting","boxes":[0,0,1,1]}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":{}}\\n\');',
      "authored_canvas_measurement_response_invalid",
    ],
    ["process.exit(1);", "authored_canvas_measurement_execution_failed"],
    [
      'process.stderr.write("unexpected diagnostic");process.stdout.write(\'{"status":"measured","boxes":[0,0,1,1]}\\n\');',
      "authored_canvas_measurement_execution_failed",
    ],
    ['process.stdout.write("A".repeat(700000));', "authored_canvas_measurement_response_limit"],
  ];
  for (const [body, expected] of replies) {
    await t.test(body, async () => {
      const interrupted = body === "process.exit(1);";
      // Invalid replies still preserve a finite live root for native tree reclamation.
      const lifetime = interrupted ? "" : "setTimeout(() => process.exit(1), 36000);";
      await fs.writeFile(worker, `import fs from 'node:fs';fs.readFileSync(0);${lifetime}${body}`);
      const failure =
        interrupted && process.platform === "win32"
          ? { code: "authored_canvas_measurement_cleanup_unproved", originalFailure: expected }
          : { code: expected };
      await assert.rejects(selected.module.createBundledTextMeasurer(font, [label]), failure);
    });
  }
});

test("native raster worker refuses an unsupported measurement operation before native execution", async () => {
  const result = spawnSync(
    process.execPath,
    ["packages/publisher/renderers/resvg/worker.mjs", "36000"],
    {
      input: JSON.stringify({
        schema: "architecture.raster-measurement-request/v1",
        svg: "",
        fonts: [],
        count: 4097,
      }),
      encoding: "utf8",
      timeout: 5000,
    },
  );
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "error",
    code: "authored_canvas_measurement_request_invalid",
  });
});
