import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadBundledFonts } from "../../packages/publisher/renderers/fonts/index.mjs";
import { materializeBuildRequestInput } from "../../packages/publisher/src/compiler/build-input.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function selectedProject(supply) {
  return {
    schema: "architecture.edition-project/v1",
    id: "font-reading",
    editor: "example:editor",
    title: "Exact selected fonts",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "Which exact routes are connected?" }],
    scope: {
      sourceNamespaces: ["fixture/routes"],
      selections: [
        {
          id: "request",
          namespace: "fixture/routes",
          kind: "reference",
          reference: "relation:request",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "Read selected source routes with explicit font resources." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }], width: 1800 },
      interactive: { views: [{ id: "overview", questions: ["shape"] }] },
    },
    visualPolicy: {
      profile: "neutral",
      override: "refinement.json",
      fonts: [
        {
          id: "reading",
          family: "JetBrains Mono",
          faces: supply.fonts.map(({ weight, sha256 }) => ({
            weight: String(weight),
            ref: `fonts/${weight}.ttf`,
            sha256,
          })),
          distribution: [{ ref: "fonts/OFL.txt", sha256: supply.license.sha256 }],
        },
      ],
    },
  };
}
export async function fontInput(t) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "architecture-font-input-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const supply = await loadBundledFonts();
  const project = selectedProject(supply);
  const resources = new Map([
    ["refinement.json", Buffer.from('{"selected":"resource bytes"}')],
    ...supply.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", supply.license.bytes],
  ]);
  await fs.mkdir(path.join(root, "edition/fonts"), { recursive: true });
  await fs.mkdir(path.join(root, "sources"));
  const native = Buffer.from('{"selected":"source bytes"}');
  await fs.writeFile(path.join(root, "sources/model.json"), native);
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "source",
        namespace: "fixture/routes",
        format: { id: "example/native-json", version: "1" },
        claimant: "example:source",
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "pin", path: "sources/model.json", sha256: sha(native) },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  const requestBytes = Buffer.from(JSON.stringify(request));
  const requestPath = path.join(root, "build-request.json");
  await fs.writeFile(requestPath, requestBytes);
  const save = async () => {
    await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project));
    for (const [ref, bytes] of resources)
      await fs.writeFile(path.join(root, "edition", ref), bytes);
  };
  await save();
  return {
    root,
    project,
    resources,
    save,
    materialize: () => materializeBuildRequestInput(requestPath, sha(requestBytes)),
  };
}
export function renamedFontFace(face, family) {
  const original = Buffer.from("JetBrains Mono", "utf16le").swap16();
  const replacement = Buffer.from(family, "utf16le").swap16();
  assert.equal(
    replacement.length,
    original.length,
    "bounded test-name patch keeps the original table size",
  );
  const bytes = Buffer.from(face.bytes);
  let changed = 0;
  for (
    let offset = bytes.indexOf(original);
    offset !== -1;
    offset = bytes.indexOf(original, offset + original.length)
  ) {
    replacement.copy(bytes, offset);
    changed++;
  }
  assert(changed > 0);
  return { ...face, family, bytes, sha256: sha(bytes) };
}
