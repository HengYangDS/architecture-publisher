import assert from "node:assert/strict";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";

import fs from "node:fs/promises";

import http from "node:http";

import path from "node:path";

import test from "node:test";

import axe from "axe-core";

import { chromium } from "playwright-core";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { browserLifetime } from "./fixtures/browser-lifetime.mjs";

import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";

import {
  modelNamespace,
  fixture,
  groupedMixedFixture,
  assertAuthoredFormCannotDisappear,
  disagreementFixture,
} from "./fixtures/claim-selection.mjs";

test("an unrelated Claim Model builds source-checked interactive HTML", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["interactive"] });
  selected.project.presentation.interactive.views[0].groups = structuredClone(
    selected.project.presentation.static.views[0].groups,
  );
  selected.project.visualPolicy.override = "refinement.json";
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const ref = (kind, id) => JSON.stringify([modelNamespace, kind, id]);
  const resource = {
    schema: "architecture.scene-refinement/v1",
    media: {
      interactive: {
        kind: "authored-architecture",
        pages: [
          {
            id: "overview",
            label: "Source relation and claim",
            purpose: "overview",
            scene: {
              schema: "architecture.interactive-scene/v1",
              id: "overview",
              title: selected.project.title,
              subtitle: "Source relation and claim",
              viewport: { width: 960, height: 540 },
              nodes: [
                {
                  id: "client",
                  label: "Client",
                  visualRole: "external",
                  position: { x: 70, y: 180 },
                  size: { width: 220, height: 100 },
                  semanticIds: [ref("entity", "client")],
                },
                {
                  id: "server",
                  label: "Server",
                  visualRole: "backend",
                  position: { x: 620, y: 180 },
                  size: { width: 220, height: 100 },
                  semanticIds: [ref("entity", "server")],
                },
              ],
              groups: [],
              edges: [
                {
                  id: "request",
                  from: "client",
                  to: "server",
                  label: "request",
                  visualRole: "emphasis",
                  fromSide: "right",
                  toSide: "left",
                  route: "straight",
                  semanticIds: [ref("relation", "request")],
                },
              ],
            },
          },
        ],
      },
    },
  };
  const resourcePath = path.join(selected.root, "edition/refinement.json");
  await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  const output = path.join(selected.root, "authored-interactive");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const match = html.match(
    /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
  );
  assert(match);
  const atlas = JSON.parse(match[1]);
  assert.equal(atlas.schema, "architecture.interactive-html/v1");
  assert.deepEqual(atlas.order, ["overview"]);
  assert.deepEqual(atlas.pages.overview.subjectSources, {
    client: ["selected-1"],
    server: ["selected-1"],
    request: ["selected-1"],
  });
  assert(
    atlas.pages.overview.facts.some(({ facts }) =>
      facts.some(({ label, value }) => label === "Claim plane" && value === "intended"),
    ),
  );
  assert(
    atlas.pages.overview.facts.some(({ facts }) =>
      facts.some(({ label, value }) => label === "Condition" && value.includes("authorization")),
    ),
  );
  assert(!Object.hasOwn(atlas.sources["selected-1"], "base64"));
  assert(!html.includes(JSON.stringify(selected.model)));
  await assertAuthoredFormCannotDisappear(selected, "interactive");

  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  assert.deepEqual(
    composeAuthoredInteractiveArchitecture(meaning).pages.map(({ id }) => id),
    ["overview"],
  );
  for (const [name, mutate, code] of [
    [
      "wrong refinement kind",
      (value) => (value.refinement.media.interactive.kind = "foreign"),
      "authored_interactive_input_invalid",
    ],
    [
      "page count mismatch",
      (value) =>
        value.refinement.media.interactive.pages.push(
          structuredClone(value.refinement.media.interactive.pages[0]),
        ),
      "authored_interactive_input_invalid",
    ],
    [
      "duplicate assertion identity",
      (value) => value.assertions.push(structuredClone(value.assertions[0])),
      "authored_interactive_input_invalid",
    ],
    [
      "duplicate native selection identity",
      (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
      "authored_interactive_input_invalid",
    ],
    [
      "page identity mismatch",
      (value) => (value.refinement.media.interactive.pages[0].id = "other"),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "page subtitle mismatch",
      (value) => (value.refinement.media.interactive.pages[0].label = "Other meaning"),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "missing source assertion",
      (value) => (value.media.interactive.views[0].assertionIds = []),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "editorial assertion substituted for source evidence",
      (value) => (value.assertions[0].kind = "editorial"),
      "authored_interactive_editorial_unadmitted",
    ],
    [
      "unselected source assertion",
      (value) => (value.assertions[0].selection = "missing"),
      "authored_interactive_source_unadmitted",
    ],
    [
      "malformed qualified reference",
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] = "not-json"),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "noncanonical qualified reference",
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] =
          '[ "fixture/claims", "entity", "client" ]'),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "unselected entity on a visible node",
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] = ref(
          "entity",
          "other",
        )),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "node without a semantic binding",
      (value) => delete value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds,
      "authored_interactive_semantic_mismatch",
    ],
    [
      "relation without an entity carrier",
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds = [
          ref("relation", "request"),
        ]),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "repeated client cannot replace the required server carrier",
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[1].semanticIds = [
          ...value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds,
        ]),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "relation put inside a node without both endpoints",
      (value) =>
        value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds.push(
          ref("relation", "request"),
        ),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "edge without semantic binding",
      (value) => delete value.refinement.media.interactive.pages[0].scene.edges[0].semanticIds,
      "authored_interactive_semantic_mismatch",
    ],
    [
      "edge identity collides with a node",
      (value) => (value.refinement.media.interactive.pages[0].scene.edges[0].id = "client"),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "edge loses one relation endpoint",
      (value) => (value.refinement.media.interactive.pages[0].scene.edges[0].to = "client"),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "selected relation is absent from the scene",
      (value) => (value.refinement.media.interactive.pages[0].scene.edges = []),
      "authored_interactive_semantic_mismatch",
    ],
    [
      "relation rendered in reverse direction",
      (value) => {
        const edge = value.refinement.media.interactive.pages[0].scene.edges[0];
        [edge.from, edge.to] = [edge.to, edge.from];
      },
      "authored_interactive_semantic_mismatch",
    ],
    [
      "missing declared provenance authority",
      (value) => {
        for (const item of value.native.selections) item.provenanceSources = {};
      },
      "edition_claim_card_invalid",
    ],
    [
      "mechanism page substituted for the overview",
      (value) => (value.refinement.media.interactive.pages[0].purpose = "mechanism"),
      "authored_interactive_narrative_invalid",
    ],
  ]) {
    const mutated = structuredClone(meaning);
    mutate(mutated);
    assert.throws(() => composeAuthoredInteractiveArchitecture(mutated), { code }, name);
  }

  resource.media.interactive.pages[0].scene.edges[0].semanticIds = [ref("relation", "invented")];
  await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, "forged-interactive"),
    ),
    { code: "authored_interactive_semantic_mismatch" },
  );
});

test(
  "claim media remain visible, accessible, and offline in Chrome",
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ""),
    timeout: 60_000,
  },
  async (t) => {
    const selected = await fixture(t);
    const output = path.join(selected.root, "candidate");
    await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
    const html = await fs.readFile(path.join(output, "interactive/architecture.html"));
    const svg = await fs.readFile(path.join(output, "static/architecture.svg"));
    const disagreement = await disagreementFixture(t);
    const disagreementOutput = path.join(disagreement.root, "candidate");
    await compileEditionCandidateInput(
      disagreement.requestPath,
      disagreement.requestSha256,
      disagreementOutput,
    );
    const assets = new Map([
      ["/architecture.html", { type: "text/html; charset=utf-8", bytes: html }],
      ["/architecture.svg", { type: "image/svg+xml; charset=utf-8", bytes: svg }],
      [
        "/disagreement.html",
        {
          type: "text/html; charset=utf-8",
          bytes: await fs.readFile(path.join(disagreementOutput, "interactive/architecture.html")),
        },
      ],
      [
        "/disagreement.svg",
        {
          type: "image/svg+xml; charset=utf-8",
          bytes: await fs.readFile(path.join(disagreementOutput, "static/architecture.svg")),
        },
      ],
    ]);
    const server = http.createServer((request, response) => {
      const asset = assets.get(request.url);
      if (!asset) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { "Content-Type": asset.type });
      response.end(asset.bytes);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const lifetime = browserLifetime(t);
    lifetime.use(server);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    lifetime.use(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route("**/*", (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    await page.goto(`${origin}/architecture.html`, { waitUntil: "load" });
    let member = await selectedInteractiveMember(page, "overview");
    await member.evaluate(() => globalThis.document.fonts.ready);
    const claim = member.locator('[data-note-card-id="claim-card-0"]');
    assert.equal(await claim.count(), 1);
    assert.match(await claim.innerText(), /authorization: granted/u);
    assert.match(await claim.innerText(), /Declared product contract/u);
    assert.equal(await member.locator("canvas").count(), 0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const state of ["paused", "live", "yielding", "suspended"]) {
      const name = await member.evaluate((state) => {
        const governor = globalThis.Archify.motionGovernor;
        governor.pause();
        if (state !== "paused") governor.resume();
        const token = state === "yielding" ? governor.claim("route") : undefined;
        const release = state === "suspended" ? governor.suspend("acceptance") : undefined;
        const button = globalThis.document.querySelector("#btn-motion");
        const result = {
          visible: globalThis.document.querySelector("#motion-label").textContent.trim(),
          accessible: button.getAttribute("aria-label"),
        };
        if (release) release();
        if (token !== undefined) governor.release(token);
        return result;
      }, state);
      assert(name.visible, state);
      assert(
        name.accessible.toLowerCase().includes(name.visible.toLowerCase()),
        `${state}: ${JSON.stringify(name)}`,
      );
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await member.locator("#btn-motion:disabled").waitFor();
    await page.addScriptTag({ content: axe.source });
    await member.addScriptTag({ content: axe.source });
    const violations = () =>
      member.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        }));
      });
    assert.deepEqual(await violations(), []);
    await page.goto(`${origin}/architecture.svg`, { waitUntil: "load" });
    assert.equal((await page.locator('[data-graphic-id="c-0"] text').count()) > 0, true);
    const collisions = () =>
      page.evaluate(() => {
        const canvas = globalThis.document.querySelector("svg").getBoundingClientRect();
        const text = [...globalThis.document.querySelectorAll("svg text")].map((element) => ({
          value: element.textContent,
          box: element.getBoundingClientRect(),
        }));
        const gaps = [];
        for (const [index, left] of text.entries()) {
          if (
            left.box.left < canvas.left - 1 ||
            left.box.right > canvas.right + 1 ||
            left.box.top < canvas.top - 1 ||
            left.box.bottom > canvas.bottom + 1
          )
            gaps.push(`outside:${left.value}`);
          for (const right of text.slice(index + 1)) {
            const width =
              Math.min(left.box.right, right.box.right) - Math.max(left.box.left, right.box.left);
            const height =
              Math.min(left.box.bottom, right.box.bottom) - Math.max(left.box.top, right.box.top);
            if (width > 1 && height > 1) gaps.push(`overlap:${left.value}:${right.value}`);
          }
        }
        return gaps;
      });
    assert.deepEqual(await collisions(), []);
    await page.goto(`${origin}/disagreement.html`, { waitUntil: "load" });
    member = await selectedInteractiveMember(page, "overview");
    await member.evaluate(() => globalThis.document.fonts.ready);
    const cards = member.locator('[data-note-card-id^="claim-card-"]');
    assert.equal(await cards.count(), 2);
    const readings = await cards.evaluateAll((nodes) =>
      nodes.map((node) =>
        Object.fromEntries(
          [...node.querySelectorAll("li")].map((field) => {
            const value = field.textContent.trim();
            const separator = value.indexOf(": ");
            return [value.slice(0, separator), value.slice(separator + 2)];
          }),
        ),
      ),
    );
    assert.deepEqual(
      readings
        .map((record) => ({
          plane: record["Claim plane"],
          validity: record["Claimant-declared validity"],
        }))
        .sort((left, right) => left.plane.localeCompare(right.plane)),
      [
        { plane: "implemented", validity: "refuted" },
        { plane: "intended", validity: "affirmed" },
      ],
    );
    const boxes = await cards.evaluateAll((nodes) =>
      nodes.map((node) => {
        const { top, bottom, left, right } = node.getBoundingClientRect();
        return { top, bottom, left, right };
      }),
    );
    assert(
      boxes[1].top >= boxes[0].bottom - 1 || boxes[1].left >= boxes[0].right - 1,
      JSON.stringify(boxes),
    );
    assert.equal(
      await member.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.window.innerWidth,
      ),
      true,
    );
    await member.addScriptTag({ content: axe.source });
    assert.deepEqual(await violations(), []);
    await page.goto(`${origin}/disagreement.svg`, { waitUntil: "load" });
    const painted = (await page.locator("svg text").allTextContents()).join(" ");
    for (const phrase of [
      "Claim plane: intended",
      "Claim plane: implemented",
      "Claimant-declared validity: affirmed",
      "Claimant-declared validity: refuted",
    ])
      assert(painted.includes(phrase), phrase);
    assert.deepEqual(await collisions(), []);
    assert.deepEqual(errors, []);
  },
);
