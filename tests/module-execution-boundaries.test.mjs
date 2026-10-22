import { parse as parseToml } from "smol-toml";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { inspectModuleBoundaries } from "./fixtures/module-boundaries.mjs";
import {
  root,
  runtimeRoots,
  declaredPackageExports,
  inventory,
} from "./fixtures/module-inventory.mjs";

test("only the LikeC4 supply owner may read the bundled parser resource", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const source = "new URL('../../supplies/likec4/', import.meta.url);";
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/src/semantics/supply.mjs",
      source,
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/semantics/native-likec4.mjs",
      source,
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/semantics/supply.mjs",
      "import(unselectedUrl);",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("computed dependency")),
  );
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/src/semantics/native-worker.mjs",
      "import(privateParserUrl);",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/semantics/native-worker.mjs",
      "import(installedParserUrl);",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("computed dependency")),
  );
});

test("the Dagre layout owner cannot import an unselected computed module", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert(
    inspectModuleBoundaries(
      "packages/publisher/renderers/dagre/layout.mjs",
      "import(unselectedUrl);",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("computed dependency")),
  );
});

test("the neutral process-tree owner serves only admitted protocol supervisors", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const source = "import '../runtime/process-tree.mjs';";
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/src/provider/supervisor.mjs",
      source,
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/provider/contract.mjs",
      source,
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/renderers/svg/coretext-process.mjs",
      "import '../../src/runtime/process-tree.mjs';",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/renderers/svg/architecture.mjs",
      "import '../../src/runtime/process-tree.mjs';",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
});

test("syntax failures and computed dependencies fail closed", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert.match(
    inspectModuleBoundaries(
      "packages/publisher/src/file-input/read.mjs",
      "export {",
      paths,
      packageExports,
    )[0].reason,
    /syntax/,
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/file-input/read.mjs",
      "await import(selected);",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("computed dependency")),
  );
});

test("Provider worker admits only its exact selected dynamic entrypoint", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const file = "packages/publisher/src/provider/worker-task.mjs";
  assert.deepEqual(
    inspectModuleBoundaries(file, "await import(selectedEntrypointUrl);", paths, packageExports),
    [],
  );
  assert(
    inspectModuleBoundaries(file, "await import(otherEntrypoint);", paths, packageExports).some(
      ({ reason }) => reason.includes("computed dependency"),
    ),
  );
});

test("gated worker admits only the registered selected worker import", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const file = "packages/publisher/src/runtime/gated-worker.mjs";
  assert.deepEqual(
    inspectModuleBoundaries(
      file,
      "await import(pathToFileURL(selected).href);",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      file,
      "await import(pathToFileURL(other).href);",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("computed dependency")),
  );
});

test("layout worker admits only its exact private verified geometry supply", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const file = "packages/publisher/renderers/elk/worker.mjs";
  assert.deepEqual(
    inspectModuleBoundaries(file, "await import(privateLayoutUrl);", paths, packageExports),
    [],
  );
  for (const other of ["otherLayoutUrl", "selectedEntrypointUrl", "privateParserUrl"])
    assert(
      inspectModuleBoundaries(file, `await import(${other});`, paths, packageExports).some(
        ({ reason }) => reason.includes("computed dependency"),
      ),
    );
});

test("provider and generic kernels reject forbidden dependency directions and adopter names", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const [specifier, reason] of [
    ["architecture-publisher/renderers/archify", "forbidden dependency"],
    ["../../renderers/archify/supply/assets/template.html", "forbidden dependency"],
    ["architecture-publisher/qualification", "forbidden dependency"],
    ["architecture-publisher/publication", "forbidden dependency"],
    ["simple-git", "declared external"],
    ["../../../../../ethos/src/index.mjs", "dependency escapes repository"],
  ])
    assert(
      inspectModuleBoundaries(
        "packages/publisher/src/provider/invalid.mjs",
        `import ${JSON.stringify(specifier)};`,
        paths,
        packageExports,
      ).some(({ reason: actual }) => actual.includes(reason)),
      specifier,
    );
  for (const name of ["ETHOS", "ethos", "AIGW", "aigw", "@example/architecture-edition-provider"])
    assert(
      inspectModuleBoundaries(
        "packages/publisher/src/compiler/invalid.mjs",
        `export const adopter = ${JSON.stringify(name)};`,
        paths,
        packageExports,
      ).some(({ reason }) => reason.includes("adopter identity")),
      name,
    );
  for (const name of ["ETHOS", "ethos", "AIGW", "aigw"])
    assert(
      inspectModuleBoundaries(
        "packages/publisher/src/compiler/invalid.mjs",
        `export const ${name} = null;`,
        paths,
        packageExports,
      ).some(({ reason }) => reason.includes("adopter identity")),
      name,
    );
  for (const file of [
    "packages/publisher/renderers/svg/canvas.mjs",
    "packages/publisher/renderers/archify/index.mjs",
  ])
    assert(
      inspectModuleBoundaries(
        file,
        "export const selectedEdition = edition.id === 'ethos';",
        paths,
        packageExports,
      ).some(({ reason }) => reason.includes("adopter identity")),
      file,
    );
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/src/provider/invalid.mjs",
      "// ETHOS is an example, not a dependency.\nexport const provider = null;",
      paths,
      packageExports,
    ),
    [],
  );
});

test("selected Provider modules cannot import historical Provider implementations", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const target of ["./contract.mjs", "./executable.mjs", "./protocol.mjs"]) {
    const problems = inspectModuleBoundaries(
      "packages/publisher/src/provider/executable-selection.mjs",
      `import ${JSON.stringify(target)};`,
      paths,
      packageExports,
    );
    assert(
      problems.some(({ reason }) => reason.includes("historical Provider dependency")),
      target,
    );
  }
});

test("first-party owner names stay precise outside vendored assets", async () => {
  const { modules } = await inventory([
    ...runtimeRoots,
    "tests/conformance/journeys/self-host",
    "tools",
  ]);
  const forbidden = /(?:^|\/)(?:core|common|shared|utils|legacy|compat)(?:\/|$)/;
  assert.deepEqual(
    modules.filter((file) => forbidden.test(file)),
    [],
  );
});

test("first-party source filenames name responsibilities, not protocol generations", async () => {
  const { modules } = await inventory([...runtimeRoots, "tools", "tests"]);
  const versioned = /(?:^|\/)[^/]*[-_.]v[0-9]+[^/]*\.(?:mjs|cjs|js)$/u;
  assert.match("tools/migration/semantic-v1-to-claim-v2.mjs", versioned);
  assert.doesNotMatch("tests/fixtures/migration/semantic-document-v1.json", versioned);
  assert.deepEqual(
    modules.filter((file) => versioned.test(file)),
    [],
  );
});

test("repository check composes one fail-closed static and acceptance graph", async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json")));
  const knip = parseToml(
    await fs.readFile(path.join(root, ".config/checks/knip/knip.toml"), "utf8"),
  );
  assert.equal(
    workspace.scripts.check,
    "npm run check:static && npm run test:coverage && npm run check:package",
  );
  assert.match(workspace.scripts["check:static"], /check:lint/);
  assert.match(workspace.scripts["check:static"], /check:types/);
  assert.match(workspace.scripts["check:static"], /check:imports/);
  assert.match(workspace.scripts["check:dead-code"], /^knip /);
  assert.doesNotMatch(workspace.scripts["check:dead-code"], /--fix/);
  assert.equal(knip.ignoreExportsUsedInFile, undefined);
});
