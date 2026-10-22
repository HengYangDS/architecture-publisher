import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { materializeBuildRequestInput } from "../../packages/publisher/src/compiler/build-input.mjs";
import { editionProviderPackageDigest } from "../../packages/publisher/src/provider/index.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const format = { id: "example/native-json", version: "1" };

const revision = { kind: "content", algorithm: "sha256" };

export function editionProject(namespaces) {
  const selections = namespaces.map((namespace, index) => ({
    id: `selected-${index}`,
    namespace,
    kind: "reference",
    reference: `item-${index}`,
    questions: ["shape"],
  }));
  return {
    schema: "architecture.edition-project/v1",
    id: "combined-atlas",
    editor: "combined-editor",
    title: "Combined architecture",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "What is selected?" }],
    scope: { sourceNamespaces: namespaces, selections, limits: [] },
    omissions: [],
    narrative: { summary: "Selected native sources." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }], intent: "A clear overview." },
      interactive: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "An explorable overview.",
      },
    },
    visualPolicy: { profile: "neutral" },
  };
}

function providerManifest(slug, namespace, native, projection) {
  return {
    schema: "architecture.edition-provider/v2",
    provider: { id: `${slug}-provider`, revision: "1" },
    selected: {
      native: [
        {
          id: "model",
          namespace,
          claimant: `${slug}-maintainer`,
          format,
          revision,
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [
        {
          id: "index",
          namespace: `${namespace}/index`,
          claimant: "adapter-maintainer",
          format: { id: "example/index", version: "1" },
          derivedFrom: ["model"],
          adapter: { id: "native-reader", version: "1", contentSha256: sha("adapter") },
          method: "extract/v1",
          bytes: projection.length,
          sha256: sha(projection),
        },
      ],
      edition: null,
    },
    delivery: {
      kind: "declarative",
      files: [
        { kind: "native", id: "model", path: "native.json" },
        { kind: "derived", id: "index", path: "index.json" },
      ],
    },
  };
}

export async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-join-v2-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "edition"));
  await fs.mkdir(path.join(root, "sources"));
  await fs.mkdir(path.join(root, "providers/alpha"), { recursive: true });
  await fs.mkdir(path.join(root, "providers/beta"), { recursive: true });
  const direct = Buffer.from('{"direct":true}\n');
  await fs.writeFile(path.join(root, "sources/direct.json"), direct);
  const providers = {};
  for (const slug of ["alpha", "beta"]) {
    const namespace = `org.example/${slug}`;
    const native = Buffer.from(`{"${slug}":true}\n`);
    const projection = Buffer.from(`{"index":"${slug}"}\n`);
    const directory = path.join(root, "providers", slug);
    await fs.writeFile(path.join(directory, "native.json"), native);
    await fs.writeFile(path.join(directory, "index.json"), projection);
    providers[slug] = {
      directory,
      native,
      projection,
      manifest: providerManifest(slug, namespace, native, projection),
      relativeManifest: `providers/${slug}/provider.json`,
    };
  }
  const state = {
    root,
    direct,
    providers,
    project: editionProject(["org.example/direct", "org.example/alpha", "org.example/beta"]),
    request: {
      schema: "architecture.build-request/v1",
      edition: { kind: "direct", root: "edition", manifest: "project.json" },
      sources: [
        {
          id: "direct-local",
          namespace: "org.example/direct",
          format,
          claimant: "direct-maintainer",
          revision,
          input: { kind: "locator", path: "sources/direct.json" },
        },
      ],
      providers: ["alpha", "beta"].map((slug) => ({
        id: `${slug}-selection`,
        manifest: providers[slug].relativeManifest,
        sha256: "0".repeat(64),
      })),
      media: ["static", "interactive"],
      toolchain: { profile: "portable" },
    },
  };
  state.save = async () => {
    const editionBytes = Buffer.from(JSON.stringify(state.project) + "\n");
    await fs.writeFile(path.join(root, "edition/project.json"), editionBytes);
    for (const item of Object.values(providers)) {
      if (item.manifest.selected.edition !== null) {
        item.manifest.selected.edition.bytes = editionBytes.length;
        item.manifest.selected.edition.sha256 = sha(editionBytes);
        await fs.writeFile(path.join(item.directory, "edition.json"), editionBytes);
      }
      const bytes = Buffer.from(JSON.stringify(item.manifest) + "\n");
      await fs.writeFile(path.join(item.directory, "provider.json"), bytes);
      const selection = state.request.providers.find(
        ({ manifest }) => manifest === item.relativeManifest,
      );
      if (selection) selection.sha256 = sha(bytes);
    }
    const requestBytes = Buffer.from(JSON.stringify(state.request) + "\n");
    const requestPath = path.join(root, "build-request.json");
    await fs.writeFile(requestPath, requestBytes);
    return { requestPath, digest: sha(requestBytes) };
  };
  state.materialize = async () => {
    const { requestPath, digest } = await state.save();
    return materializeBuildRequestInput(requestPath, digest);
  };
  return state;
}

export function supplyEdition(item, project) {
  item.manifest.selected.edition = {
    id: project.id,
    editor: project.editor,
    bytes: 0,
    sha256: "0".repeat(64),
    resources: [],
  };
  item.manifest.delivery.files.push({
    kind: "edition",
    id: project.id,
    path: "edition.json",
  });
}

export async function prepareExecutableAlpha(f) {
  const alpha = f.providers.alpha;
  const packageRoot = path.join(alpha.directory, "package");
  await fs.mkdir(packageRoot);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: "@fixture/alpha-provider",
      version: "1.0.0",
      type: "module",
      exports: { "./provider": "./provider.mjs" },
    }) + "\n",
  );
  await fs.writeFile(path.join(packageRoot, "package.json"), packageJson);
  await fs.writeFile(
    path.join(packageRoot, "provider.mjs"),
    `export async function materializeEditionProvider(request) {
  const source = JSON.parse(Buffer.from(request.inputs[0].contentBase64, 'base64').toString('utf8'));
  const index = Object.keys(source)[0];
  return {
    schema: 'architecture.edition-provider-reply/v2',
    derived: [{ id: 'index', contentBase64: Buffer.from(JSON.stringify({ index }) + '\\n').toString('base64') }],
  };
}
`,
  );
  alpha.manifest.delivery = {
    kind: "executable",
    package: {
      name: "@fixture/alpha-provider",
      version: "1.0.0",
      packageJsonSha256: sha(packageJson),
      contentSha256: await editionProviderPackageDigest(packageRoot),
      entrypoint: "./provider",
    },
    inputs: [
      {
        id: "source",
        path: "native.json",
        mediaType: "application/json",
        bytes: alpha.native.length,
        sha256: sha(alpha.native),
      },
    ],
    nativeInputs: [{ item: "model", input: "source" }],
    editionInput: null,
    editionResourceInputs: [],
  };
  f.request.providers[0].packageRoot = "providers/alpha/package";
  return alpha;
}

export async function materializeExecutableAlpha(f) {
  const { requestPath, digest } = await f.save();
  return materializeBuildRequestInput(requestPath, digest, [
    { id: "alpha-selection", manifestSha256: f.request.providers[0].sha256 },
  ]);
}
