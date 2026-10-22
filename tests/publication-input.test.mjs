import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { filePublication } from "../packages/publisher/src/publication/input.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-input-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const directory of ["sources", "native", "atlas"])
    await fs.mkdir(path.join(root, directory));
  const native = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>\n'),
    atlas = Buffer.from("<!DOCTYPE html><title>Atlas</title>\n");
  await fs.writeFile(path.join(root, "sources/figure.svg"), native);
  await fs.writeFile(path.join(root, "sources/atlas.html"), atlas);
  const input = {
    options: {
      sourceRoots: ["sources"],
      destinations: { native: "native", atlas: "atlas" },
      recoveryRoot: "recovery",
    },
    source: { id: "publication-input-fixture" },
    payload: [
      {
        medium: "native",
        path: "terminal/figure.svg",
        source: "sources/figure.svg",
        bytes: native.length,
        sha256: sha256(native),
      },
      {
        medium: "atlas",
        path: "atlas/index.html",
        source: "sources/atlas.html",
        bytes: atlas.length,
        sha256: sha256(atlas),
      },
    ],
    entries: {
      native: { "index.html": "Open native", "README.md": "Native fixture" },
      atlas: { "index.html": "Open Atlas", "README.md": "Atlas fixture" },
    },
    dependencies: [],
  };
  const write = async (name, value) => {
    const file = path.join(root, name);
    await fs.writeFile(file, JSON.stringify(value) + "\n");
    return file;
  };
  return { root, input, write };
}

test("file-publication input resolves selected files and preserves plan authority", async (t) => {
  const { root, input, write } = await fixture(t);
  const planned = await filePublication("plan", await write("request.json", input));
  assert.equal(planned.status, "PLANNED");
  assert.equal(planned.scope, "file-integrity");
  assert.equal(planned.semanticAcceptance, "not-performed");
  assert.deepEqual(planned.plan.options.sourceRoots, [path.join(root, "sources")]);
  assert.equal(planned.plan.options.destinations.native, path.join(root, "native"));
  assert.equal(planned.plan.payload[0].source, path.join(root, "sources/figure.svg"));

  const planFile = await write("plan.json", planned.plan),
    authorizationFile = await write("authorization.json", {
      decision: "AUTHORIZED",
      planSha256: planned.plan.sha256,
    });
  const installed = await filePublication("apply", planFile, authorizationFile);
  assert.equal(installed.status, "INSTALLED");
  assert.equal(installed.semanticAcceptance, "not-performed");
  const recovered = await filePublication("recover", planFile, authorizationFile);
  assert.equal(recovered.status, "ALREADY_INSTALLED");
  assert.equal(
    await fs.readFile(path.join(root, "native/terminal/figure.svg"), "utf8"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>\n',
  );
});

test("file-publication input rejects ambiguous or unsafe selection before effects", async (t) => {
  const { root, input, write } = await fixture(t);
  const invalidLists = structuredClone(input);
  invalidLists.dependencies = null;
  await assert.rejects(filePublication("plan", await write("invalid-lists.json", invalidLists)), {
    code: "file_publication_input_invalid",
  });

  const missingSource = structuredClone(input);
  missingSource.payload[0].source = "";
  await assert.rejects(filePublication("plan", await write("missing-source.json", missingSource)), {
    code: "file_publication_path_invalid",
  });

  const extraField = structuredClone(input);
  extraField.unreviewed = true;
  await assert.rejects(filePublication("plan", await write("extra-field.json", extraField)), {
    code: "file_publication_input_invalid",
  });

  const safe = await write("safe.json", input);
  await fs.symlink(safe, path.join(root, "linked.json"));
  await assert.rejects(filePublication("plan", path.join(root, "linked.json")), /symlink|link/i);
  await assert.rejects(filePublication("unknown", safe), /Unsupported file operation/);
});

test("file-publication rejects repeated plan and authorization keys before effects", async (t) => {
  const { root, input, write } = await fixture(t);
  const ambiguousRequest =
    JSON.stringify(input).replace('"source":', '"source":{"id":"forged"},"source":') + "\n";
  const requestFile = path.join(root, "ambiguous-request.json");
  await fs.writeFile(requestFile, ambiguousRequest);
  await assert.rejects(filePublication("plan", requestFile), {
    code: "file_publication_input_json_duplicate_key",
  });

  const planned = await filePublication("plan", await write("valid-request.json", input));
  const planFile = await write("plan.json", planned.plan);
  const authorizationFile = path.join(root, "ambiguous-authorization.json");
  await fs.writeFile(
    authorizationFile,
    `{"decision":"DENIED","decision":"AUTHORIZED","planSha256":"${planned.plan.sha256}"}\n`,
  );
  await assert.rejects(filePublication("apply", planFile, authorizationFile), {
    code: "file_publication_input_json_duplicate_key",
  });
  assert.deepEqual(await fs.readdir(path.join(root, "native")), []);
  assert.deepEqual(await fs.readdir(path.join(root, "atlas")), []);
});

test("file-publication input treats replacement and dependencies as explicit selections", async (t) => {
  const { root, input, write } = await fixture(t);
  await assert.rejects(filePublication("plan", path.join(root, "sources")), {
    code: "file_publication_input_invalid",
  });

  const incomplete = structuredClone(input);
  incomplete.replacement = {};
  await assert.rejects(
    filePublication("plan", await write("replacement.json", incomplete)),
    /Explicit prior plan and authorization required/,
  );

  const selected = structuredClone(input);
  selected.dependencies.push({
    file: "sources/figure.svg",
    sha256: selected.payload[0].sha256,
  });
  const planned = await filePublication("plan", await write("dependency.json", selected));
  assert(
    planned.plan.dependencies.some(({ file }) => file === path.join(root, "sources/figure.svg")),
  );
});
