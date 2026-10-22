import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { inspectModuleBoundaries } from "./fixtures/module-boundaries.mjs";
import {
  root,
  runtimeRoots,
  declaredPackageExports,
  declaredDependencyImports,
  inventory,
} from "./fixtures/module-inventory.mjs";

test("runtime owners are package-scoped and old owner roots are absent", async () => {
  for (const directory of [
    "packages/publisher/src/source",
    "packages/publisher/src/semantics",
    "packages/publisher/src/edition",
    "packages/publisher/src/scene",
    "packages/publisher/src/compiler",
    "packages/publisher/src/rendering",
    "packages/publisher/src/qualification",
    "packages/publisher/src/publication",
    "packages/publisher/renderers",
    "editions/self/src/edition",
  ])
    assert((await fs.stat(path.join(root, directory))).isDirectory(), directory);
  for (const directory of ["src", "renderers", "assets", "adapters"])
    await assert.rejects(fs.access(path.join(root, directory)), { code: "ENOENT" });
  for (const directory of [
    "packages/extensions",
    "packages/publisher/assets",
    "examples/self-host",
    "examples/aigw",
  ])
    await assert.rejects(fs.access(path.join(root, directory)), { code: "ENOENT" });
});

test("core owners cannot import concrete extensions", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const problems = inspectModuleBoundaries(
    "packages/publisher/src/file-input/read.mjs",
    "import '@architecture-publisher/self-edition/edition';",
    paths,
    packageExports,
  );
  assert(problems.some(({ reason }) => reason.includes("forbidden dependency")));
});

test("protocol and file input stay below Source Bundle and renderer semantics", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/src/file-input/read.mjs",
      "import '../protocol/values.mjs';",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/protocol/values.mjs",
      "import '../file-input/contract.mjs';",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
  assert.deepEqual(
    inspectModuleBoundaries(
      "packages/publisher/renderers/dagre/layout.mjs",
      "import '../../src/file-input/contract.mjs';",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      "packages/publisher/renderers/dagre/layout.mjs",
      "import '../../src/source/manifest.mjs';",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
});

test("media backends cannot acquire Source Bundle authority", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const [backend, sourceImport] of [
    ["renderers/resvg/index.mjs", "import '../../src/source/bundle.mjs';"],
    ["renderers/svg/coretext.mjs", "import '../../src/source/write.mjs';"],
  ]) {
    const problems = inspectModuleBoundaries(
      `packages/publisher/${backend}`,
      sourceImport,
      paths,
      packageExports,
    );
    assert(
      problems.some(({ reason }) => reason.includes("forbidden dependency")),
      backend,
    );
  }
});

test("compiler media composition does not mint a disposable Source Bundle", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const problems = inspectModuleBoundaries(
    "packages/publisher/src/compiler/media.mjs",
    "import { writeSourceBundle } from '../source/write.mjs';",
    paths,
    packageExports,
  );
  assert(problems.some(({ reason }) => reason.includes("forbidden dependency")));
});

test("extensions depend inward through public package exports", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert.deepEqual(
    inspectModuleBoundaries(
      "editions/self/src/edition/refinement.mjs",
      "import { loadBundledFonts } from 'architecture-publisher/renderers/fonts';",
      paths,
      packageExports,
    ),
    [],
  );
  const deep = inspectModuleBoundaries(
    "editions/self/src/edition/refinement.mjs",
    "import '../../../../packages/publisher/src/source/bundle.mjs';",
    paths,
    packageExports,
  );
  assert(
    deep.some(({ reason }) => reason.includes("cross-package dependency must use a public export")),
  );
});

test("all shipped modules satisfy the package and semantic dependency graph", async () => {
  const { paths, modules } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const externals = new Map();
  for (const directory of ["packages/publisher", "editions/self"]) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, "package.json")));
    externals.set(directory, new Set(Object.keys(manifest.dependencies ?? {})));
  }
  const problems = [];
  for (const file of modules) {
    const owner = [...externals.keys()].find((directory) => file.startsWith(`${directory}/`));
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), "utf8"),
        paths,
        packageExports,
        externals.get(owner) ?? new Set(),
      ),
    );
  }
  assert.deepEqual(problems, []);
  assert(
    inspectModuleBoundaries(
      "packages/publisher/src/edition/authoring.mjs",
      "import 'unlisted-package';",
      paths,
      packageExports,
      externals.get("packages/publisher"),
    ).some(({ reason }) => reason.includes("declared external")),
  );
});

test("only qualified publication admission may read Candidate and qualification predicates", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const target of ["../compiler/candidate.mjs", "../qualification/policy.mjs"]) {
    const source = `import '${target}';`;
    assert.deepEqual(
      inspectModuleBoundaries(
        "packages/publisher/src/publication/qualified.mjs",
        source,
        paths,
        packageExports,
      ),
      [],
    );
    assert(
      inspectModuleBoundaries(
        "packages/publisher/src/publication/files.mjs",
        source,
        paths,
        packageExports,
      ).some(({ reason }) => reason.includes("forbidden dependency")),
    );
  }
});

test("the build coordinator may invoke only the emitted-artifact predicate", async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const caller = "packages/publisher/src/compiler/successor.mjs";
  assert.deepEqual(
    inspectModuleBoundaries(caller, "import '../scene/emitted-path.mjs';", paths, packageExports),
    [],
  );
  assert(
    inspectModuleBoundaries(
      caller,
      "import '../qualification/policy.mjs';",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("forbidden dependency")),
  );
});

test("development tools use declared package owners and dependencies", async () => {
  const { paths, modules } = await inventory([...runtimeRoots, "tools"], [".config"]);
  const packageExports = await declaredPackageExports();
  const workspace = JSON.parse(await fs.readFile(path.join(root, "package.json")));
  const declared = await declaredDependencyImports(workspace.devDependencies ?? {});
  const problems = [];
  for (const file of modules.filter((name) => name.startsWith("tools/")))
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), "utf8"),
        paths,
        packageExports,
        declared,
      ),
    );
  assert.deepEqual(problems, []);
});

test("check configuration is a declared resource, not an executable module dependency", async () => {
  const { paths, modules } = await inventory([...runtimeRoots, "tools"], [".config"]);
  const packageExports = await declaredPackageExports();
  assert(paths.has(".config/checks/file-budget/policy.toml"));
  assert(!modules.some((file) => file.startsWith(".config/")));
  for (const target of [
    ".config/checks/file-budget/policy.toml",
    ".config/checks/typescript/tsconfig.json",
  ])
    assert.deepEqual(
      inspectModuleBoundaries(
        "tools/checks/policy.mjs",
        `new URL('../../${target}', import.meta.url);`,
        paths,
        packageExports,
      ),
      [],
    );
  for (const [file, source, reason] of [
    [
      "tools/checks/policy.mjs",
      "import '../../.config/checks/eslint/eslint.config.mjs';",
      "forbidden dependency",
    ],
    [
      "tools/checks/policy.mjs",
      "new URL('../../.config/release/icons/policy.toml', import.meta.url);",
      "forbidden dependency",
    ],
    [
      "tools/checks/policy.mjs",
      "new URL('../../.config/checks/absent/policy.toml', import.meta.url);",
      "missing dependency",
    ],
    [
      "packages/publisher/src/protocol/values.mjs",
      "new URL('../../../../.config/checks/file-budget/policy.toml', import.meta.url);",
      "forbidden dependency",
    ],
  ])
    assert(
      inspectModuleBoundaries(file, source, paths, packageExports).some((problem) =>
        problem.reason.includes(reason),
      ),
      source,
    );
});

test("supply tools may list built-ins without admitting an alternate loader", async () => {
  const { paths } = await inventory([...runtimeRoots, "tools"]);
  const packageExports = await declaredPackageExports();
  const file = "tools/supply/likec4.mjs";
  assert.deepEqual(
    inspectModuleBoundaries(
      file,
      "import { builtinModules } from 'node:module';",
      paths,
      packageExports,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      file,
      "import { createRequire } from 'node:module';",
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes("alternate module loaders")),
  );
});
