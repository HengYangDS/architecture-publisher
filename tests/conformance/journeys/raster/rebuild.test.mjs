import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../../../..");
const verifier = path.join(root, "tools/raster/resvg/verify.mjs");

test("native Cargo and wasm-bindgen reproduce the admitted raster witness", async (t) => {
  const archive = process.env.ARCHPUB_RESVG_SOURCE_ARCHIVE;
  const bindgen = process.env.ARCHPUB_RESVG_BINDGEN;
  assert(archive && path.isAbsolute(archive), "select an absolute frozen source archive");
  assert(bindgen && path.isAbsolute(bindgen), "select an absolute matching wasm-bindgen");
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, "packages/publisher/renderers/resvg/supply/resvg/source.json"),
    ),
  );
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const work = await fs.mkdtemp(path.join(base, "raster source Δ "));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const invoke = (command, args, cwd = work, env = process.env) => {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    assert.equal(result.error, undefined, `${command}: ${result.error}`);
    assert.equal(result.status, 0, `${command}: ${result.stdout}${result.stderr}`);
    return result.stdout.trim();
  };
  const selectedEnv = {
    ...process.env,
    RUSTUP_TOOLCHAIN: manifest.toolchain.rust,
    CARGO_NET_OFFLINE: "true",
  };
  const observe = (command) => {
    const verbose = invoke(command, ["-vV"], work, selectedEnv);
    const fields = Object.fromEntries(
      [...verbose.matchAll(/^([a-z-]+): (.+)$/gmu)].map((match) => [match[1], match[2]]),
    );
    for (const field of ["release", "commit-hash", "host"]) assert(fields[field], verbose);
    assert.equal(fields.release, manifest.toolchain.rust);
    return { release: fields.release, commit: fields["commit-hash"], host: fields.host };
  };
  const tools = {
    rustc: observe("rustc"),
    cargo: observe("cargo"),
    wasmBindgen: invoke(bindgen, ["--version"]).replace(/^wasm-bindgen /u, ""),
  };
  assert.equal(tools.rustc.host, tools.cargo.host);
  assert.equal(tools.wasmBindgen, manifest.toolchain.wasmBindgen);
  const identityPath = path.join(work, "native tool identity.json");
  await fs.writeFile(identityPath, JSON.stringify(tools));
  const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const snapshot = async (directory, prefix = "") => {
    const files = [];
    for (const item of await fs.readdir(directory, { withFileTypes: true })) {
      const relative = prefix + item.name;
      const selected = path.join(directory, item.name);
      assert(!item.isSymbolicLink(), relative);
      if (item.isDirectory()) files.push(...(await snapshot(selected, relative + "/")));
      else {
        assert(item.isFile(), relative);
        files.push([relative, sha(await fs.readFile(selected))]);
      }
    }
    return files.sort(([left], [right]) => left.localeCompare(right));
  };
  const builds = [];
  for (const name of ["first source Δ", "second source Ω"]) {
    invoke(process.execPath, [verifier, "--archive", archive]);
    const extraction = path.join(work, name);
    await fs.mkdir(extraction);
    invoke("tar", ["-xf", archive, "-C", extraction]);
    const source = path.join(
      extraction,
      `architecture-publisher-resvg-wasm-${manifest.source.version}`,
    );
    invoke(process.execPath, [verifier, "--inputs", source]);
    const inputs = await snapshot(source);
    const target = path.join(work, `target ${builds.length} Δ`);
    await assert.rejects(fs.lstat(target), { code: "ENOENT" });
    invoke(
      "cargo",
      ["build", "--release", "--target", manifest.toolchain.target, "--offline", "--frozen"],
      source,
      {
        ...selectedEnv,
        CARGO_TARGET_DIR: target,
        CARGO_ENCODED_RUSTFLAGS: `--remap-path-prefix=${source}=${manifest.build.pathRemap}`,
      },
    );
    const output = path.join(extraction, "native output Δ");
    invoke(bindgen, [
      path.join(
        target,
        manifest.toolchain.target,
        "release/architecture_publisher_resvg_wasm.wasm",
      ),
      "--target",
      "bundler",
      "--out-dir",
      output,
      "--out-name",
      "index",
      "--no-typescript",
      "--omit-default-module-path",
    ]);
    invoke(process.execPath, [verifier, "--inputs", source]);
    assert.deepEqual(await snapshot(source), inputs, "all extracted source bytes remain unchanged");
    await assert.rejects(fs.lstat(path.join(source, "target")), { code: "ENOENT" });
    const outputs = [];
    for (const selected of manifest.outputs) {
      const bytes = await fs.readFile(path.join(output, selected.nativeFile));
      outputs.push({ nativeFile: selected.nativeFile, bytes: bytes.length, sha256: sha(bytes) });
    }
    builds.push({ output, inputsSha256: sha(JSON.stringify(inputs)), outputs });
  }
  assert.equal(builds[0].inputsSha256, builds[1].inputsSha256);
  assert.deepEqual(builds[0].outputs, builds[1].outputs, "independent relocated outputs agree");
  invoke(process.execPath, [verifier, "--archive", archive]);
  const canonical = path.join(root, "packages/publisher/renderers/resvg/supply/resvg");
  const modules = [];
  for (const directory of [canonical, ...builds.map((build) => build.output)]) {
    const binding = path.join(directory, "index.mjs");
    if (directory !== canonical) await fs.copyFile(path.join(directory, "index_bg.js"), binding);
    const resvg = await import(pathToFileURL(binding).href);
    const module = new WebAssembly.Module(await fs.readFile(path.join(directory, "index_bg.wasm")));
    const instance = new WebAssembly.Instance(module, { "./index_bg.js": resvg });
    resvg.__wbg_set_wasm(instance.exports);
    instance.exports.__wbindgen_start();
    modules.push({
      resvg,
      interface: {
        imports: WebAssembly.Module.imports(module),
        exports: WebAssembly.Module.exports(module),
      },
    });
  }
  const fontRoot = path.join(root, "packages/publisher/renderers/fonts/supply");
  const fonts = JSON.parse(await fs.readFile(path.join(fontRoot, "supply.json")));
  const selectedFonts = [];
  for (const font of fonts.files.filter((font) => font.weight)) {
    const bytes = await fs.readFile(path.join(fontRoot, font.path));
    assert.equal(bytes.length, font.bytes);
    assert.equal(sha(bytes), font.sha256);
    selectedFonts.push({ ...font, bytes });
  }
  const shape = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24"><rect width="32" height="24" fill="#678"/></svg>',
  );
  const authored = await fs.readFile(path.join(root, "examples/job-lifecycle.svg"));
  const observations = [];
  for (const { resvg, interface: exposed } of modules) {
    const renderer = new resvg.Renderer();
    const observed = { interface: exposed, png: [], measurement: [], errors: [] };
    try {
      const png = Buffer.from(renderer.render(shape, 32));
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(png.readUInt32BE(16), 32);
      assert.equal(png.readUInt32BE(20), 24);
      observed.png.push(sha(png));
      for (const font of selectedFonts) renderer.addFont(font.bytes);
      for (const font of selectedFonts) {
        const text = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="64"><text id="architecture-measure-0" x="12" y="40" font-family="${fonts.family}" font-size="24" font-weight="${font.weight}">Architecture to outcome Δ</text></svg>`,
        );
        const measured = [...renderer.measureText(text, 1)];
        assert.equal(measured.length, 4);
        assert(measured.every(Number.isFinite));
        assert(measured[2] > 0 && measured[3] > 0);
        observed.measurement.push(measured);
        observed.png.push(sha(Buffer.from(renderer.render(text, 420))));
      }
      const authoredPng = Buffer.from(renderer.render(authored, 1440));
      assert.equal(authoredPng.readUInt32BE(16), 1440);
      assert.equal(authoredPng.readUInt32BE(20), 780);
      observed.png.push(sha(authoredPng));
      for (const [call, expected] of [
        [() => renderer.render(shape, 0), "width_invalid"],
        [() => renderer.render(Buffer.from("not SVG"), 32), "svg_invalid"],
        [() => renderer.measureText(shape, 0), "measurement_limit"],
        [() => renderer.measureText(Buffer.from("not SVG"), 1), "svg_invalid"],
        [() => renderer.measureText(shape, 1), "measurement_text_missing"],
      ]) {
        assert.throws(call, { message: expected });
        observed.errors.push(expected);
      }
    } finally {
      renderer.free();
    }
    observations.push(observed);
  }
  for (const observed of observations.slice(1)) assert.deepEqual(observed, observations[0]);
  t.diagnostic(
    JSON.stringify({
      platform: process.platform,
      arch: process.arch,
      sourceArchiveSha256: manifest.source.archiveSha256,
      tools,
      builds: builds.map(({ inputsSha256, outputs }) => ({ inputsSha256, outputs })),
      behavior: observations[0],
    }),
  );
  for (const { output } of builds)
    invoke(process.execPath, [verifier, "--outputs", output, identityPath]);
});
