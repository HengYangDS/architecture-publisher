import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fail, hasExactFields, isDigest } from "../../src/protocol/values.mjs";
import { portablePath } from "../../src/file-input/contract.mjs";
import { loadFigureIconSupply } from "../icons/index.mjs";
import { validateInteractiveArchitectureInput } from "../../src/scene/interactive/architecture.mjs";
import { loadBundledFonts } from "../fonts/index.mjs";
export { nativeRelationTraversals } from "./semantics.mjs";

const supplyRoot = fileURLToPath(new URL("./supply/", import.meta.url));
const supplyDigest = "9fe51ac623ef8b7572dedcd99e8b31f928f11c3b203b6a38e74928f7cabef1f8";
const types = new Set(["architecture", "workflow", "sequence", "dataflow", "lifecycle"]);
const maxDiagramBytes = 4 * 1024 * 1024;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function bytes(file, maximum, code) {
  let stat;
  try {
    stat = await fs.lstat(file);
  } catch {
    fail(code);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximum) fail(code);
  let result;
  try {
    result = await fs.readFile(file);
  } catch {
    fail(code);
  }
  if (result.length !== stat.size) fail(code);
  return result;
}
async function supply() {
  const raw = await bytes(
    path.join(supplyRoot, "supply.json"),
    1024 * 1024,
    "render_supply_invalid",
  );
  if (sha(raw) !== supplyDigest) fail("render_supply_invalid");
  const manifest = JSON.parse(raw);
  const members = [];
  const expected = new Set(["supply.json"]);
  for (const file of manifest.files) {
    portablePath(file.path);
    const value = await bytes(
      path.join(supplyRoot, file.path),
      4 * 1024 * 1024,
      "render_supply_invalid",
    );
    if (value.length !== file.bytes || sha(value) !== file.sha256) fail("render_supply_invalid");
    members.push({ path: file.path, content: value });
    expected.add(file.path);
  }
  async function walk(directory, prefix = "") {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) fail("render_supply_invalid");
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), name + "/");
      else if (!entry.isFile() || !expected.delete(name)) fail("render_supply_invalid");
    }
  }
  await walk(supplyRoot);
  if (expected.size) fail("render_supply_invalid");
  return members;
}

async function runtimeDigest(directory, excluded = []) {
  const members = [];
  async function collect(root, prefix = "") {
    for (const entry of await fs.readdir(root, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (excluded.includes(name)) continue;
      if (entry.isSymbolicLink()) fail("render_adaptation_receipt_invalid");
      if (entry.isDirectory()) await collect(path.join(root, entry.name), name + "/");
      else if (entry.isFile()) {
        const value = await bytes(
          path.join(root, entry.name),
          4 * 1024 * 1024,
          "render_adaptation_receipt_invalid",
        );
        members.push({ path: name, bytes: value.length, sha256: sha(value) });
      } else fail("render_adaptation_receipt_invalid");
    }
  }
  await collect(directory);
  members.sort(({ path: left }, { path: right }) => left.localeCompare(right));
  return sha(Buffer.from(JSON.stringify(members)));
}

async function nativeArtifactPublication(native, notice) {
  const original = await fs.readFile(path.join(native, "assets/template.html"), "utf8");
  if (
    !original.includes('<style id="archify-fonts">') ||
    (original.match(/data:font\/woff2;base64,/gu) ?? []).length !== 6 ||
    !original.includes("SIL OPEN FONT LICENSE") ||
    original.includes("src: local(")
  )
    fail("render_font_seam_invalid");
  return {
    supplies: [],
    transformRendered(rendered) {
      const html = rendered.toString("utf8");
      const svgRoot = /<svg\b[^>]*\brole="img"[^>]*>/gu;
      if ([...html.matchAll(svgRoot)].length !== 1) fail("render_svg_accessibility_seam_invalid");
      // Publication owns the generated document's accessible container and
      // attribution. Native executable scripts and runtime files stay intact.
      return Buffer.from(
        html
          .replace(svgRoot, (root) => root.replace('role="img"', 'role="group"'))
          .replace("<head>", '<head>\n<meta name="publication-reader" content="archify/v1">')
          .replace("</head>", "<!-- " + notice.replaceAll("--", "—") + "-->\n</head>"),
      );
    },
  };
}

function offlineInput(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "repository" && child) ||
      (key === "sources" && Array.isArray(child) && child.length)
    )
      fail("render_external_effect_unsupported");
    if (
      key === "brand" &&
      child &&
      (typeof child !== "string" ||
        /^[a-z][a-z\d+.-]*:/i.test(child.trim()) ||
        child.trim().startsWith("//"))
    )
      fail("render_external_effect_unsupported");
    offlineInput(child);
  }
}

/** Native checked rendering, not source-semantic or browser acceptance. */
export async function renderDiagram(plan) {
  if (!plan || !types.has(plan.type)) fail("render_type_unsupported");
  if (!isDigest(plan.inputSha256)) fail("render_input_digest_required");
  if (
    typeof plan.input !== "string" ||
    !path.isAbsolute(plan.input) ||
    typeof plan.output !== "string" ||
    !path.isAbsolute(plan.output)
  )
    fail("render_path_required");
  const input = await bytes(plan.input, maxDiagramBytes, "render_input_type_invalid");
  if (sha(input) !== plan.inputSha256) fail("render_input_digest_mismatch");
  return renderNativeDiagram(
    { type: plan.type, inputBytes: input, output: plan.output },
    nativeArtifactPublication,
  );
}

/** Render one backend-neutral architecture scene through the Archify adapter. */
async function prepareArchitectureScene(plan) {
  if (!plan || typeof plan !== "object") fail("render_scene_plan_invalid");
  if (plan.readingContext !== undefined && !["overview", "source"].includes(plan.readingContext))
    fail("render_scene_plan_invalid");
  const supplied = structuredClone(plan.scene);
  const intrinsic = !Object.hasOwn(supplied ?? {}, "viewport");
  const figureIcons = new Map((supplied?.nodes ?? []).map(({ id, icon }) => [id, icon]));
  const input = validateInteractiveArchitectureInput(
    intrinsic
      ? {
          ...supplied,
          nodes: supplied?.nodes?.map((node) => {
            const inputNode = { ...node };
            delete inputNode.icon;
            return inputNode;
          }),
        }
      : supplied,
  );
  await supply();
  const { validatedExploration } = await import("./semantics.mjs");
  let composed = { scene: input, supplies: [] };
  if (!Object.hasOwn(input, "viewport")) {
    const { composeIntrinsicArchitecture } = await import("./layout.mjs");
    composed = await composeIntrinsicArchitecture(
      input,
      plan.fontSupply ?? null,
      plan.exploration,
      plan.readingContext,
    );
  }
  const textFamilies = new Map(
    (plan.fontSupply?.texts ?? []).map(({ id, family }) => [id, family]),
  );
  const scene = {
    ...composed.scene,
    nodes: composed.scene.nodes.map((node) => ({
      ...node,
      ...(figureIcons.get(node.id) ? { icon: figureIcons.get(node.id) } : {}),
    })),
    ...(composed.scene.texts
      ? {
          texts: composed.scene.texts.map((text) => ({
            ...text,
            ...(textFamilies.get(text.id) ? { family: textFamilies.get(text.id) } : {}),
          })),
        }
      : {}),
  };
  const icons = await loadFigureIconSupply();
  const exploration =
    plan.exploration === undefined ? undefined : validatedExploration(plan.exploration, scene);
  return { scene, icons, exploration, composed };
}

/** One byte-producing native assembly serves direct and file-based consumers. */
export async function assembleArchitectureScene(scene, options = {}) {
  const plan = { ...options, scene };
  const prepared = await prepareArchitectureScene(plan);
  const { assembleArchitecturePage } = await import("./assembly.mjs");
  const fonts = plan.fontSupply ?? (await loadBundledFonts());
  const assembled = await assembleArchitecturePage(prepared.scene, {
    fonts,
    icons: prepared.icons,
    exploration: prepared.exploration,
    physical: prepared.composed.physical ?? null,
    nodeText: prepared.composed.nodeText ?? null,
    interaction: plan.interaction ?? "native",
    readingContext: plan.readingContext ?? "overview",
  });
  const supplies = new Map();
  for (const supply of [
    ...prepared.composed.supplies,
    ...assembled.supplies,
    { id: "archify", sha256: supplyDigest },
    { id: "runtime", sha256: await runtimeDigest(supplyRoot, ["supply.json"]) },
    { id: "node-fonts", sha256: fonts.sha256 },
    { id: "figure-icons", sha256: prepared.icons.manifestSha256 },
  ]) {
    const previous = supplies.get(supply.id);
    if (previous && previous.sha256 !== supply.sha256) fail("render_adaptation_receipt_invalid");
    supplies.set(supply.id, supply);
  }
  const runtime = await supply();
  const notice = runtime.find((member) => member.path === "LICENSE").content.toString("utf8");
  const published = Buffer.from(
    assembled.bytes.toString("utf8").replace("</head>", () => `<!-- ${notice} -->\n</head>`),
  );
  return { scene: prepared.scene, bytes: published, supplies: [...supplies.values()] };
}

export async function renderArchitectureScene(plan) {
  if (!plan || typeof plan !== "object") fail("render_scene_plan_invalid");
  if (plan.readingContext !== undefined) fail("render_scene_plan_invalid");
  const assembled = await assembleArchitectureScene(plan.scene, plan);
  const { adaptArchitectureScene } = await import("./architecture.mjs");
  const { architectureReaderTranslations } = await import("./semantics.mjs");
  const scene = assembled.scene;
  const diagram = adaptArchitectureScene(scene, {
    intrinsic: !Object.hasOwn(plan.scene ?? {}, "viewport"),
  });
  if (plan.exploration !== undefined)
    diagram.meta.translations = await architectureReaderTranslations(plan.exploration);
  const inputBytes = Buffer.from(JSON.stringify(diagram, null, 2) + "\n");
  return renderNativeDiagram(
    { type: "architecture", inputBytes, output: plan.output },
    async () => {
      return {
        supplies: assembled.supplies.filter(({ id }) => !["archify", "runtime"].includes(id)),
        artifactBytes: assembled.bytes,
      };
    },
  );
}

/** Internal code-owned edition seam. Never selected by input data or plugin paths. */
export async function renderNativeDiagram(plan, adaptRuntime) {
  if (!plan || !types.has(plan.type)) fail("render_type_unsupported");
  if (!Buffer.isBuffer(plan.inputBytes) || plan.inputBytes.length > maxDiagramBytes)
    fail("render_input_type_invalid");
  if (typeof plan.output !== "string" || !path.isAbsolute(plan.output))
    fail("render_path_required");
  if (typeof adaptRuntime !== "function") fail("render_adaptation_required");
  const input = Buffer.from(plan.inputBytes),
    inputSha256 = sha(input);
  let diagram;
  try {
    diagram = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input));
  } catch {
    fail("render_input_json_invalid");
  }
  if (diagram?.diagram_type !== plan.type) fail("render_type_mismatch");
  if (diagram?.meta?.quality_profile !== "showcase") fail("render_showcase_required");
  offlineInput(diagram);
  // The public output path owns publication. Archify's required meta.output is
  // only the private candidate slot; the caller's original bytes retain identity.
  const nativeInput = Buffer.from(
      JSON.stringify({
        ...diagram,
        meta: { ...diagram.meta, output: "candidate.html" },
      }) + "\n",
    ),
    nativeInputSha256 = sha(nativeInput);
  if (nativeInput.length > maxDiagramBytes) fail("render_input_type_invalid");
  const parent = path.dirname(plan.output);
  let stat;
  let resolvedParent;
  try {
    stat = await fs.lstat(parent);
    resolvedParent = await fs.realpath(parent);
  } catch {
    fail("render_output_parent_invalid");
  }
  if (!stat.isDirectory() || stat.isSymbolicLink() || resolvedParent !== parent)
    fail("render_output_parent_invalid");
  try {
    await fs.lstat(plan.output);
    fail("render_output_exists");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const runtime = await supply();
  const notice = runtime.find((member) => member.path === "LICENSE").content.toString("utf8");
  const scratch = await fs.mkdtemp(path.join(parent, ".architecture-render-"));
  try {
    const native = path.join(scratch, "runtime"),
      home = path.join(scratch, "home");
    await fs.mkdir(home);
    for (const member of runtime) {
      const file = path.join(native, member.path);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, member.content, { flag: "wx" });
    }
    const adaptation = await adaptRuntime(native, notice),
      adaptedRuntimeSha256 = await runtimeDigest(native),
      supplies = [
        { id: "archify", sha256: supplyDigest },
        { id: "runtime", sha256: adaptedRuntimeSha256 },
        ...(adaptation?.supplies ?? []),
      ];
    if (
      !Array.isArray(adaptation?.supplies ?? []) ||
      supplies.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          !hasExactFields(item, ["id", "sha256"]) ||
          typeof item.id !== "string" ||
          !item.id ||
          !isDigest(item.sha256),
      ) ||
      new Set(supplies.map(({ id }) => id)).size !== supplies.length
    )
      fail("render_adaptation_receipt_invalid");
    const selected = path.join(scratch, "input.json"),
      candidate = path.join(scratch, "candidate.html");
    await fs.writeFile(selected, nativeInput, { flag: "wx" });
    const assembled = adaptation?.artifactBytes !== undefined;
    if (assembled) {
      if (
        !Buffer.isBuffer(adaptation.artifactBytes) ||
        adaptation.artifactBytes.length > 32 * 1024 * 1024
      )
        fail("render_artifact_invalid");
      await fs.writeFile(candidate, adaptation.artifactBytes, { flag: "wx" });
    }
    const execution = spawnSync(
      process.execPath,
      assembled
        ? [path.join(native, "scripts/check-render-output.mjs"), candidate]
        : [
            path.join(native, "bin/archify.mjs"),
            "deliver",
            plan.type,
            selected,
            candidate,
            "--quality",
            "showcase",
            "--json",
          ],
      {
        cwd: scratch,
        env: {
          HOME: home,
          PATH: home,
          TMPDIR: scratch,
          TMP: scratch,
          TEMP: scratch,
          LANG: "C.UTF-8",
          ARCHIFY_UPDATE_CHECK_DISABLED: "1",
        },
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    if (execution.error) fail("render_process_failed", execution.error.code);
    let receipt;
    try {
      receipt = JSON.parse(execution.stdout);
    } catch {
      fail("render_receipt_invalid");
    }
    if (execution.status !== 0 || receipt.ok !== true) {
      throw Object.assign(new Error("Native renderer rejected the diagram"), {
        code: "render_native_rejected",
        diagnostics: receipt.diagnostics ?? [],
        native: receipt,
      });
    }
    if (assembled) {
      receipt.validation = {
        checkCount: receipt.checks?.length,
        checksPassed: receipt.checks?.filter(({ ok }) => ok).length,
        compositionProfile: receipt.composition?.profile,
        errors: receipt.composition?.summary.errors,
        warnings: receipt.composition?.summary.warnings,
      };
    }
    const checks = receipt.validation;
    if (
      (!assembled &&
        (receipt.command !== "deliver" ||
          receipt.type !== plan.type ||
          receipt.specification?.sha256 !== nativeInputSha256 ||
          receipt.specification?.bytes !== nativeInput.length)) ||
      checks?.checkCount !== 9 ||
      checks.checksPassed !== 9 ||
      checks.compositionProfile !== "showcase" ||
      checks.errors !== 0 ||
      checks.warnings !== 0 ||
      (!assembled &&
        (receipt.update?.status !== "unavailable" || receipt.update.reason !== "disabled"))
    )
      fail("render_receipt_invalid");
    const rendered = await bytes(candidate, 32 * 1024 * 1024, "render_artifact_invalid");
    if (receipt.artifact?.sha256 !== sha(rendered) || receipt.artifact.bytes !== rendered.length)
      fail("render_artifact_invalid");
    if (adaptation?.verifyRendered) adaptation.verifyRendered(rendered);
    const published = adaptation?.transformRendered
      ? adaptation.transformRendered(rendered)
      : rendered;
    if (!Buffer.isBuffer(published) || published.length > 32 * 1024 * 1024)
      fail("render_artifact_invalid");
    const artifact = published.equals(rendered)
      ? receipt.artifact
      : { ...receipt.artifact, bytes: published.length, sha256: sha(published) };
    try {
      await fs.writeFile(plan.output, published, { flag: "wx" });
    } catch (error) {
      if (error.code === "EEXIST") fail("render_output_exists");
      throw error;
    }
    if (sha(await fs.readFile(plan.output)) !== artifact.sha256) fail("render_output_changed");
    return {
      status: "rendered",
      type: plan.type,
      inputSha256,
      output: plan.output,
      artifact,
      ...(published.equals(rendered) ? {} : { nativeArtifact: receipt.artifact }),
      nativeValidation: checks,
      supplies,
      browserAcceptance: "not-performed",
      semanticAcceptance: "not-performed",
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
