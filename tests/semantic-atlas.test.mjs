import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { browserOptions, runBrowser } from "./fixtures/reader-appearance.mjs";
import { writeSourceBundle } from "../packages/publisher/src/source/write.mjs";
import { readSourceBundle } from "../packages/publisher/src/source/bundle.mjs";
import { claimModelDigest } from "../packages/publisher/src/semantics/document.mjs";
import { compileEditionCandidate } from "../packages/publisher/src/compiler/edition.mjs";
import {
  editionCandidateDigest,
  validateEditionCandidate,
} from "../packages/publisher/src/compiler/candidate.mjs";
import { sha, encode, fixture } from "./fixtures/semantic-publication.mjs";

test("compiles complete source-bound structure into static and interactive media", async (t) => {
  const value = await fixture(t);
  const result = await compileEditionCandidate(value.plan);
  const output = await readSourceBundle(result.manifestPath, result.manifestSha256);
  const members = new Map(output.members.map((item) => [item.path, item.content]));
  const candidate = validateEditionCandidate(JSON.parse(members.get("candidate.json")));
  assert.deepEqual(JSON.parse(members.get("semantic.json")), value.document);
  assert.deepEqual(JSON.parse(members.get("edition.json")), value.edition);
  assert.equal(candidate.schema, "architecture.edition-candidate/v1");
  assert.equal(candidate.source.manifestSha256, value.plan.sourceSha256);
  assert.equal(candidate.claimModel.digest, claimModelDigest(value.document));
  assert.equal(candidate.edition.sha256, value.plan.editionSha256);
  assert.equal(result.editionDigest, candidate.edition.digest);
  assert.equal(result.staticSceneDigest, candidate.media.static.sceneSha256);
  assert.equal(result.interactiveSceneDigest, candidate.media.interactive.sceneSha256);
  assert.equal(result.candidateSha256, editionCandidateDigest(candidate));
  assert.deepEqual(candidate.obligations, [
    { kind: "accessibility", predicate: "keyboard-and-reduced-motion" },
    { kind: "coverage", predicate: "required-claims-visible" },
    ...["aesthetic", "faithful", "intelligible"].flatMap((predicate) => [
      {
        kind: "human",
        predicate,
        scope: {
          kind: "viewport",
          medium: "interactive",
          artifact: "overview",
          width: 1440,
          height: 1000,
        },
      },
      {
        kind: "human",
        predicate,
        scope: {
          kind: "physical",
          medium: "static",
          artifact: "overview-png",
          width: 6000,
          height: 3375,
        },
      },
      {
        kind: "human",
        predicate,
        scope: {
          kind: "viewport",
          medium: "interactive",
          artifact: "registry-flow",
          width: 1440,
          height: 1000,
        },
      },
    ]),
    { kind: "installed", predicate: "offline-reproduction" },
    { kind: "interactive", predicate: "browser-behavior" },
    { kind: "semantic", predicate: "claim-model-valid" },
    { kind: "static", predicate: "static-geometry" },
  ]);
  assert.deepEqual(
    candidate.media.interactive.artifacts.map(({ id }) => id),
    ["overview", "registry-flow"],
  );
  for (const medium of Object.values(candidate.media)) {
    assert(
      medium.artifacts.every(({ bytes, sha256 }) => bytes > 0 && /^[a-f0-9]{64}$/.test(sha256)),
    );
    assert(medium.supplies.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  }
  const overview = members.get("views/overview.html").toString();
  const mechanism = members.get("views/registry-flow.html").toString();
  const svg = members.get("overview.svg").toString();
  const png = members.get("overview.png");
  assert.match(svg, /@font-face/);
  assert.match(svg, /data:font\/ttf;base64,/);
  assert.match(svg, /SIL OPEN FONT LICENSE/);
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(svg, /var\(--|data-preset=|archify/i);
  assert.match(svg, /font-family="JetBrains Mono"/);
  const dimensions = svg.match(/<svg[^>]* width="([0-9]+)" height="([0-9]+)"/);
  assert(dimensions);
  assert.match(
    svg,
    new RegExp(`<rect width="${dimensions[1]}" height="${dimensions[2]}" fill="#181611"`),
  );
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  assert.equal(png.readUInt32BE(16), 2400);
  assert.equal(
    candidate.media.static.artifacts.find(({ id }) => id === "overview-png").sha256,
    sha(png),
  );
  const scripts = (html) =>
    [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attributes]) => !/type=["']application\/json["']/u.test(attributes))
      .map(([, , content]) => content);
  const template = await fs.readFile(
    new URL("../packages/publisher/renderers/archify/supply/assets/template.html", import.meta.url),
    "utf8",
  );
  assert.deepEqual(scripts(overview), scripts(template));
  assert.deepEqual(scripts(mechanism), scripts(template));
  for (const text of [overview, svg]) {
    for (const id of ["cli", "registry", "adapter"])
      assert.match(text, new RegExp(`data-node-id="${id}"`));
    for (const id of ["cli-registry", "registry-adapter"])
      assert.match(text, new RegExp(`data-edge-id="${id}"`));
  }
  assert.match(mechanism, /data-node-id="registry"/);
  assert.match(mechanism, /data-node-id="adapter"/);
  assert.doesNotMatch(mechanism, /data-node-id="cli"/);
  await t.test("native appearances do not display template badges", runBrowser, async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const file of ["views/overview.html", "views/registry-flow.html"]) {
      await page.goto(pathToFileURL(path.join(value.plan.output, file)).href);
      await page.waitForFunction(() => !!globalThis.Archify?.preset);
      for (const preset of ["classic", "signal-flow", "blueprint", "editorial"]) {
        const badges = await page.evaluate((preset) => {
          globalThis.Archify.preset.apply(preset);
          return [".header-row", ".diagram-container"].flatMap((selector) =>
            ["::before", "::after"].map(
              (pseudo) =>
                globalThis.getComputedStyle(globalThis.document.querySelector(selector), pseudo)
                  .content,
            ),
          );
        }, preset);
        assert(
          badges.every((content) => ["none", "normal", '""'].includes(content)),
          `${file}: ${preset}`,
        );
      }
    }
  });
  assert.equal(Object.hasOwn(result, "qualification"), false);
  assert.equal(Object.hasOwn(result, "publication"), false);
});

test("static and interactive projections are compositionally independent", async (t) => {
  const baseline = await fixture(t);
  const first = await compileEditionCandidate(baseline.plan);
  const firstBundle = await readSourceBundle(first.manifestPath, first.manifestSha256);
  const firstMembers = new Map(firstBundle.members.map((item) => [item.path, item.content]));

  const interactive = await fixture(t);
  interactive.edition.scenes.interactive.overview.composition.groups[0].label =
    "Interactive control plane";
  await fs.writeFile(interactive.plan.edition, encode(interactive.edition));
  interactive.plan.editionSha256 = sha(await fs.readFile(interactive.plan.edition));
  const second = await compileEditionCandidate(interactive.plan);
  const secondBundle = await readSourceBundle(second.manifestPath, second.manifestSha256);
  const secondMembers = new Map(secondBundle.members.map((item) => [item.path, item.content]));
  assert(firstMembers.get("overview.svg").equals(secondMembers.get("overview.svg")));
  assert(firstMembers.get("overview.png").equals(secondMembers.get("overview.png")));
  assert(!firstMembers.get("views/overview.html").equals(secondMembers.get("views/overview.html")));

  const staticOnly = await fixture(t);
  staticOnly.edition.scenes.static.composition.groups[0].label = "Static control plane";
  await fs.writeFile(staticOnly.plan.edition, encode(staticOnly.edition));
  staticOnly.plan.editionSha256 = sha(await fs.readFile(staticOnly.plan.edition));
  const third = await compileEditionCandidate(staticOnly.plan);
  const thirdBundle = await readSourceBundle(third.manifestPath, third.manifestSha256);
  const thirdMembers = new Map(thirdBundle.members.map((item) => [item.path, item.content]));
  assert(!firstMembers.get("overview.svg").equals(thirdMembers.get("overview.svg")));
  assert(!firstMembers.get("overview.png").equals(thirdMembers.get("overview.png")));
  assert(firstMembers.get("views/overview.html").equals(thirdMembers.get("views/overview.html")));
});

test("rejects cross-medium semantic drift before rendering", async (t) => {
  const value = await fixture(t);
  value.edition.scenes.interactive.overview.composition.groups[0].entities.pop();
  value.edition.scenes.interactive.overview.composition.relations.pop();
  await fs.writeFile(value.plan.edition, encode(value.edition));
  value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
  await assert.rejects(compileEditionCandidate(value.plan), {
    code: "edition_scene_claim_carrier_missing",
  });
  await assert.rejects(fs.access(value.plan.output));
});

for (const [name, mutate, error] of [
  [
    "omitted overview entity",
    (value) => {
      value.edition.scenes.static.composition.groups[0].entities.pop();
      value.edition.scenes.static.composition.relations.pop();
    },
    "edition_scene_claim_carrier_missing",
  ],
  [
    "duplicate membership",
    (value) =>
      value.edition.scenes.static.composition.groups.push({
        id: "duplicate",
        label: "Duplicate",
        entities: ["registry"],
      }),
    "edition_scene_entity_invalid",
  ],
  [
    "missing explicit port",
    (value) => delete value.edition.scenes.static.composition.relations[0].fromSide,
    "edition_scene_relation_invalid",
  ],
  [
    "unknown relation endpoint selection",
    (value) =>
      value.edition.scenes.interactive["registry-flow"].composition.groups[0].entities.pop(),
    "edition_scene_endpoint_missing",
  ],
  [
    "stale semantic identity",
    (value) => (value.edition.claimModel.digest = "0".repeat(64)),
    "edition_contract_invalid",
  ],
]) {
  test("rejects " + name + " before successful output", async (t) => {
    const value = await fixture(t);
    mutate(value);
    await fs.writeFile(value.plan.edition, encode(value.edition));
    value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
    await assert.rejects(compileEditionCandidate(value.plan), { code: error });
    await assert.rejects(fs.access(value.plan.output));
  });
}

test("rejects a semantic source whose selected bytes changed", async (t) => {
  const value = await fixture(t);
  const manifest = JSON.parse(
    await fs.readFile(path.join(value.directory, "source/manifest.json"), "utf8"),
  );
  const changed = await writeSourceBundle(
    path.join(value.directory, "changed-source"),
    manifest.source,
    [
      { path: "semantic.json", content: encode(value.document) },
      {
        path: "source/internal/client/registry.go",
        content: Buffer.from("changed while retaining the semantic source identity\n"),
      },
    ],
  );
  value.plan.sourceManifest = changed.manifestPath;
  value.plan.sourceSha256 = changed.manifestSha256;
  await assert.rejects(compileEditionCandidate(value.plan), {
    code: "semantic_source_binding_mismatch",
  });
  await assert.rejects(fs.access(value.plan.output));
});

test("rejects contradictory semantic claims before rendering", async (t) => {
  const value = await fixture(t, (document) => {
    document.claims.denied = {
      ...structuredClone(document.claims["cli-registry"]),
      validity: "refuted",
      coverage: "complete",
    };
  });
  await assert.rejects(compileEditionCandidate(value.plan), {
    code: "semantic_contradiction",
  });
  await assert.rejects(fs.access(value.plan.output));
});

test("rejects group cardinality beyond the finite compositor bound", async (t) => {
  const value = await fixture(t, (document) => {
    for (let index = 0; index < 6; index++)
      document.entities[`worker-${index}`] = {
        type: "component",
        label: `Worker ${index}`,
        qualifiers: {},
        provenance: ["registry-source"],
      };
  });
  value.edition.scenes.static.composition.groups[0].entities = Object.keys(value.document.entities);
  await fs.writeFile(value.plan.edition, encode(value.edition));
  value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
  await assert.rejects(compileEditionCandidate(value.plan), {
    code: "edition_scene_group_invalid",
  });
  await assert.rejects(fs.access(value.plan.output));
});

test("rejects static geometric infeasibility before rendering", async (t) => {
  const value = await fixture(t, (document) => {
    document.entities.registry.label = "Unbreakable".repeat(80);
  });
  await assert.rejects(compileEditionCandidate(value.plan), {
    code: "semantic_publication_static_label_infeasible",
  });
  await assert.rejects(fs.access(value.plan.output));
});
