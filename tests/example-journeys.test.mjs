import test from "node:test";
import { npmPackageIdentity } from "./fixtures/package-identity.mjs";
import { spawnNativeSync, parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  root,
  publisher,
  sha,
  examples,
  checkGeometry,
  compareMeaning,
  compareInteractiveMeaning,
  assertSemanticUpdate,
} from "./fixtures/example-journeys.mjs";

for (const [name] of examples)
  test("authored semantic update is complete in both views: " + name, async () => {
    const original = JSON.parse(await fs.readFile(path.join(root, "examples", name + ".json")));
    const file = path.join(root, "examples", name + "-updated.json");
    assert.equal(
      await fs.access(file).then(
        () => true,
        () => false,
      ),
      true,
      "An authored semantic update is required; title-only substitution is insufficient",
    );
    const updated = JSON.parse(await fs.readFile(file));
    const svg = await fs.readFile(path.join(root, "examples", name + "-updated.svg"), "utf8");
    assertSemanticUpdate(name, original, updated);
    compareMeaning(updated, svg);
    await checkGeometry(svg);
    assert.throws(
      () => compareMeaning(original, svg),
      "Changed views must not pass as the original source",
    );
  });

for (const [name] of examples)
  test("static example preserves source meaning: " + name, async () => {
    const diagram = JSON.parse(await fs.readFile(path.join(root, "examples", name + ".json")));
    const svg = await fs.readFile(path.join(root, "examples", name + ".svg"), "utf8");
    compareMeaning(diagram, svg);
    await checkGeometry(svg);
    assert.throws(() => compareMeaning(diagram, svg.replace(/data-to="[^"]+"/, 'data-to="wrong"')));
    assert.throws(() =>
      compareMeaning(diagram, svg.replace(diagram.cards[0].items[0], "Condition removed")),
    );
    await assert.rejects(checkGeometry(svg.replace(/(<text )/, '$1visibility="hidden" ')));
    await assert.rejects(
      checkGeometry(svg.replace(/(data-edge-id="[^"]+"[^>]*d="M )\d+ /, "$1" + "0 ")),
    );
  });

test("installed non-ETHOS examples support both media, updates and local bundles", async (t) => {
  const base = process.env.ARCHITECTURE_EXAMPLE_EVIDENCE
    ? path.resolve(process.env.ARCHITECTURE_EXAMPLE_EVIDENCE)
    : path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  assert.equal(await fs.realpath(base), base);
  const dir = await fs.mkdtemp(path.join(base, "example journeys "));
  if (!process.env.ARCHITECTURE_EXAMPLE_EVIDENCE)
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root, env = process.env) => {
    const r = spawnNativeSync(cmd, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 60000,
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const pack = parseNpmPackRecord(
    run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", dir], publisher),
  );
  const consumer = path.join(dir, "independent consumer"),
    home = path.join(dir, "empty home");
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      consumer,
      path.join(dir, pack.filename),
    ],
    consumer,
  );
  const pkg = path.join(consumer, "node_modules/architecture-publisher");
  const invoke = (args) =>
    JSON.parse(
      run(process.execPath, [path.join(pkg, "src/cli/main.mjs"), ...args], home, {
        HOME: home,
        PATH: home,
      }),
    );
  const fontFiles = ["Regular", "Bold"].map((weight) => ({
    path: weight + ".ttf",
    input: path.join(pkg, "renderers/fonts/supply/JetBrainsMono-" + weight + ".ttf"),
  }));
  async function packFiles(output, source, selected) {
    const files = [];
    for (const item of selected) {
      const bytes = await fs.readFile(item.input);
      files.push({
        input: path.relative(path.dirname(output), item.input),
        path: item.path,
        bytes: bytes.length,
        sha256: sha(bytes),
      });
    }
    const plan = Buffer.from(
      JSON.stringify({
        schema: "architecture.pack-input/v1",
        source,
        files,
        output: path.basename(output),
      }),
    );
    const planPath = output + "-pack.json";
    await fs.writeFile(planPath, plan);
    const result = invoke(["source", "pack", planPath, "--sha256", sha(plan)]);
    assert.equal(result.status, "packed");
    assert.equal(result.semanticAcceptance, "not-performed");
    return result;
  }
  const observations = [];
  for (const [name, type] of examples) {
    const workspace = path.join(dir, name);
    await fs.mkdir(workspace);
    const source = await fs.readFile(path.join(root, "examples", name + ".json"));
    const svg = await fs.readFile(path.join(root, "examples", name + ".svg"));
    const diagram = JSON.parse(source);
    compareMeaning(diagram, svg.toString());
    const revisions = [];
    for (const update of [false, true]) {
      const revision = update ? "updated" : "original";
      const selected = update
        ? JSON.parse(await fs.readFile(path.join(root, "examples", name + "-updated.json")))
        : structuredClone(diagram);
      const staticInput = update
        ? await fs.readFile(path.join(root, "examples", name + "-updated.svg"))
        : Buffer.from(svg);
      if (update) assertSemanticUpdate(name, diagram, selected);
      const input = Buffer.from(JSON.stringify(selected, null, 2) + "\n");
      compareMeaning(selected, staticInput.toString());
      await checkGeometry(staticInput.toString());
      const file = path.join(workspace, revision + ".json");
      await fs.writeFile(file, input);
      const staticFile = path.join(workspace, revision + ".svg");
      await fs.writeFile(staticFile, staticInput);
      const html = path.join(workspace, revision + ".html");
      const interactive = invoke([
        "render",
        "interactive",
        type,
        file,
        "--sha256",
        sha(input),
        "--output",
        html,
      ]);
      assert.equal(interactive.nativeValidation.checksPassed, 9);
      assert.equal(interactive.browserAcceptance, "not-performed");
      const repeatedHtml = path.join(workspace, revision + "-repeat.html");
      const repeated = invoke([
        "render",
        "interactive",
        type,
        file,
        "--sha256",
        sha(input),
        "--output",
        repeatedHtml,
      ]);
      assert.equal(repeated.artifact.sha256, interactive.artifact.sha256);
      const bundle = await packFiles(
        path.join(workspace, revision + "-input"),
        { id: "example:" + name, revision },
        [{ path: "diagram.svg", input: staticFile }, ...fontFiles],
      );
      const planFile = path.join(workspace, revision + "-raster.json");
      await fs.writeFile(
        planFile,
        JSON.stringify({
          manifest: revision + "-input/manifest.json",
          manifestSha256: bundle.manifestSha256,
          svg: "diagram.svg",
          fonts: [
            { path: "Regular.ttf", family: "JetBrains Mono", weight: 400 },
            { path: "Bold.ttf", family: "JetBrains Mono", weight: 700 },
          ],
          width: 2400,
          output: revision + ".png",
        }),
      );
      const staticResult = invoke(["render", "raster", planFile]);
      assert.equal(staticResult.width, 2400);
      assert.equal(staticResult.semanticAcceptance, "not-performed");
      const png = await fs.readFile(path.join(workspace, revision + ".png"));
      assert.equal(sha(png), staticResult.artifact.sha256);
      const htmlBytes = await fs.readFile(html);
      assert.equal(sha(htmlBytes), interactive.artifact.sha256);
      compareInteractiveMeaning(selected, htmlBytes.toString());
      assert.throws(() =>
        compareInteractiveMeaning(
          selected,
          htmlBytes.toString().replace(/data-node-id="[^"]+"/, 'data-node-id="missing"'),
        ),
      );
      assert.throws(() =>
        compareInteractiveMeaning(
          selected,
          htmlBytes.toString().replace(/data-edge-to="[^"]+"/, 'data-edge-to="wrong"'),
        ),
      );
      assert(!htmlBytes.toString().includes(root), "No checkout path in HTML");
      const plan = JSON.parse(await fs.readFile(planFile));
      const repeatPlan = path.join(workspace, revision + "-repeat-raster.json");
      await fs.writeFile(repeatPlan, JSON.stringify({ ...plan, output: revision + "-repeat.png" }));
      assert.equal(
        invoke(["render", "raster", repeatPlan]).artifact.sha256,
        staticResult.artifact.sha256,
      );
      const publication = await packFiles(
        path.join(workspace, revision + "-publication"),
        { id: "example:" + name, revision },
        [
          { path: "diagram.json", input: file },
          { path: "diagram.svg", input: staticFile },
          {
            path: "diagram.png",
            input: path.join(workspace, revision + ".png"),
          },
          { path: "diagram.html", input: html },
          ...fontFiles,
          {
            path: "FONT-LICENSE.txt",
            input: path.join(pkg, "renderers/fonts/supply/OFL.txt"),
          },
        ],
      );
      const verified = invoke([
        "source",
        "verify",
        publication.manifestPath,
        "--sha256",
        publication.manifestSha256,
      ]);
      assert.equal(verified.status, "verified");
      assert.equal(verified.members.length, 7);
      const relocated = path.join(workspace, revision + "-relocated");
      await fs.cp(path.dirname(publication.manifestPath), relocated, {
        recursive: true,
        errorOnExist: true,
      });
      const replayPlan = path.join(workspace, revision + "-replay.json");
      await fs.writeFile(
        replayPlan,
        JSON.stringify({
          ...plan,
          manifest: revision + "-relocated/manifest.json",
          manifestSha256: publication.manifestSha256,
          output: revision + "-replayed.png",
        }),
      );
      assert.equal(
        invoke(["render", "raster", replayPlan]).artifact.sha256,
        staticResult.artifact.sha256,
      );
      assert.equal(
        invoke([
          "render",
          "interactive",
          type,
          path.join(relocated, "diagram.json"),
          "--sha256",
          sha(input),
          "--output",
          path.join(workspace, revision + "-replayed.html"),
        ]).artifact.sha256,
        interactive.artifact.sha256,
      );
      revisions.push({ png: sha(png), html: sha(htmlBytes) });
      observations.push({
        name,
        revision,
        semanticUpdate: update,
        nodeIds: (selected.components ?? selected.states).map((n) => n.id),
        relationIds: (selected.connections ?? selected.transitions).map((e) => e.id),
        inputSha256: sha(input),
        svgSha256: sha(staticInput),
        pngSha256: sha(png),
        htmlSha256: sha(htmlBytes),
        publicationSha256: publication.manifestSha256,
        repeatedBytesIdentical: true,
      });
    }
    assert.notEqual(revisions[0].png, revisions[1].png);
    assert.notEqual(revisions[0].html, revisions[1].html);
  }
  const packageIdentity = npmPackageIdentity(await fs.readFile(path.join(dir, pack.filename)));
  const result = {
    node: process.version,
    platform: process.platform,
    packageArchiveSha256: packageIdentity.archiveSha256,
    packageContentTarSha256: packageIdentity.contentTarSha256,
    observations,
    scope:
      "Installed rendering, source-bound example checks and bundle integrity only; no browser execution, visual approval or recoverable installation.",
  };
  await fs.writeFile(path.join(dir, "result.json"), JSON.stringify(result, null, 2) + "\n");
  t.diagnostic(JSON.stringify(result));
  if (process.env.ARCHITECTURE_EXAMPLE_EVIDENCE) t.diagnostic("Retained at " + dir);
});
