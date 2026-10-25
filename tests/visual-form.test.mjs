import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { paintedContactCounts } from "./fixtures/painted-contact.mjs";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/edition.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import { composeStaticResponsibilityScene } from "../packages/publisher/src/scene/static/responsibility.mjs";
import { projectInteractivePage } from "../packages/publisher/renderers/interactive/model.mjs";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { responsibilityPageHtml } from "../packages/publisher/renderers/interactive/responsibility.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import { composeStaticResponsibilitySvg } from "../packages/publisher/renderers/svg/responsibility.mjs";
import { withOwnedProcessScope } from "../packages/publisher/src/runtime/process-tree.mjs";
import {
  interactiveDocument,
  interactivePage,
  selectedInteractiveMember,
} from "./fixtures/interactive-member.mjs";
import { browserExecutable, responsibilityFixture } from "./fixtures/visual-form.mjs";
import { contrast } from "./fixtures/reader-appearance.mjs";
import { sha } from "./fixtures/selected-native-edition.mjs";
import { fixture as claimFixture } from "./fixtures/claim-selection.mjs";

test("a source Claim responsibility handoff preserves its conditions without inventing a statement", async (t) => {
  const selected = await claimFixture(t);
  selected.project.scope.selections.push({
    id: "request",
    namespace: "fixture/claims",
    kind: "reference",
    reference: "relation:request",
    questions: ["condition"],
  });
  const view = selected.project.presentation.interactive.views[0];
  view.groups = ["client", "server"].map((id) => ({
    id,
    label: id,
    elements: [{ namespace: "fixture/claims", id }],
  }));
  view.form = {
    schema: "architecture.visual-form/v1",
    kind: "responsibility",
    roles: ["client", "server"].map((group) => ({ group, basis: "selected-claim" })),
    handoffs: [{ from: "client", to: "server", basis: "selected-claim" }],
  };
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project),
  );
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  const projected = projectInteractivePage(composeInteractiveEditionScene(meaning).pages[0], 0);
  assert.equal(projected.publicPage.form.handoffs[0].basis.kind, "source-claim");
  const rendered = await renderInteractiveEditionHtml(composeInteractiveEditionScene(meaning));
  const html = interactivePage(rendered.bytes);
  const handoff = html.match(/<span\b[^>]*data-note-item-id="h-0"[^>]*>[\s\S]*?<\/span>/u)?.[0];
  assert.ok(handoff);
  assert.doesNotMatch(handoff, /undefined/u);
  assert.match(handoff, /authorization: granted/u);
  assert.match(handoff, /environment: local/u);
  assert.doesNotMatch(handoff, /Editorial judgment/u);
});

test("responsibility fixture preparation does not execute the native parser before the actual assertion", async (t) => {
  const workers = [];
  await withOwnedProcessScope(
    {
      registerOwned: async (pid) => workers.push(pid),
      releaseOwned: async () => {},
    },
    async () => {
      const { selected, members } = await responsibilityFixture(t);
      assert.deepEqual(members, [
        { namespace: "fixture/model", id: "alpha" },
        { namespace: "fixture/model", id: "beta" },
      ]);
      assert(selected.model.toString().includes("alpha = component 'Alpha'"));
      assert(selected.model.toString().includes("beta = component 'Beta'"));
    },
  );
  assert.deepEqual(workers, [], "Only the actual system-under-test call may start the parser");
});

test("attributed responsibility roles and handoff survive pre-layout selection", async (t) => {
  const { selected, view } = await responsibilityFixture(t);
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  assert.deepEqual(meaning.editorial.presentation.interactive.views[0].form, view.form);
  assert.equal(
    meaning.assertions.find(({ id }) => id === "handoff-basis").semanticStatus,
    "editor-attributed-unverified",
  );
});

test("static responsibility nodes and Legend share the global Edition figure vocabulary", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = composeStaticResponsibilityScene(meaning);
  assert.deepEqual(scene.visualPolicy.figureTypes, { component: "lucide:box" });
  assert(scene.nodes.every((node) => node.kind === "component" && node.icon === "lucide:box"));
  const icons = await loadFigureIconSupply();
  const svg = composeStaticResponsibilitySvg(scene, { icons }).bytes.toString("utf8");
  assert.equal((svg.match(/data-semantic-sigil="lucide:box"/gu) ?? []).length, 3);
  assert.equal((svg.match(/data-legend-kind="component"/gu) ?? []).length, 1);
});

test("a bare structural view cannot become responsibility authority", async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles[0].basis = "overview";
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, "edition_visual_form_basis_unsupported");
      const subject = { ...error.diagnostics?.[0]?.subject };
      delete subject.editionSha256;
      assert.deepEqual(subject, {
        kind: "edition-visual-form-role",
        editionId: selected.project.id,
        medium: "interactive",
        viewId: "overview",
        questionId: "shape",
        groupId: "first-role",
        basisAssertionId: "overview",
      });
      assert.match(error.diagnostics[0].subject.editionSha256, /^[a-f0-9]{64}$/u);
      return true;
    },
  );
});

test("a selected responsibility form builds an independent interactive role work", async (t) => {
  const { selected } = await responsibilityFixture(t);
  const output = path.join(selected.root, "responsibility-candidate");
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, "built");
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const html = interactivePage(document);
  assert.equal(interactiveDocument(document).pages.overview.nativeReader, "archify/v1");
  assert.match(html, /data-group-id="g-0"/u);
  assert.match(html, /data-group-id="g-1"/u);
  assert.match(html, /data-note-card-id="role-0"/u);
  assert.match(html, /data-note-card-id="role-1"/u);
  assert.match(html, /data-note-card-id="handoff-0"/u);
  assert.match(html, /First responsibility/u);
  assert.match(html, /Second responsibility/u);
  assert.match(html, /The first component hands control to the second/u);
  assert.match(html, /Alpha/u);
  assert.match(html, /Beta/u);
  const nodeGroups = [...html.matchAll(/<g\b[^>]*data-node-id="n-\d+"[^>]*>([\s\S]*?)<\/g>/gu)];
  assert.equal(nodeGroups.length, 2);
  for (const [, markup] of nodeGroups) assert.match(markup, /data-semantic-sigil="lucide:box"/u);
  const legend = html.match(/<g\b[^>]*data-legend-kind="component"[^>]*>[\s\S]*?<\/text>/u)?.[0];
  assert.ok(legend);
  assert.match(legend, /data-semantic-sigil="lucide:box"[\s\S]*?<text\b[^>]*>component<\/text>/u);
  assert.doesNotMatch(legend, /badge|count|ordinal/u);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json"), "utf8"));
  assert.equal(candidate.qualification, "unqualified");
  assert.deepEqual(Object.keys(candidate.media), ["interactive"]);
});

test("responsibility notes avoid duplicate generic cards without merging same-text identities", async (t) => {
  const { selected, writeProject } = await responsibilityFixture(t);
  selected.project.editorialAssertions.push({
    ...selected.project.editorialAssertions[0],
    id: "distinct-basis",
  });
  await writeProject();
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = composeInteractiveEditionScene(meaning);
  const projected = projectInteractivePage(scene.pages[0]).publicPage;
  assert.equal(projected.form.roles[0].basis.graphicId, projected.editorialAssertions[0].graphicId);
  const disclosure = responsibilityPageHtml(projected, 0, [], await loadFigureIconSupply());
  assert.match(disclosure, /Additional editorial assertions/u);
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = interactivePage(rendered.bytes);
  for (const index of [0, 1, 2])
    assert(!html.includes(`data-note-card-id="editorial-card-${index}"`));
  assert.match(html, /data-note-card-id="editorial-card-3"/u);
  for (const id of ["role-0", "role-1", "handoff-0"])
    assert(html.includes(`data-note-card-id="${id}"`));
  const facts = interactiveDocument(rendered.bytes).pages.overview.facts;
  const references = facts
    .filter(({ reference }) => JSON.parse(reference)[1] === "editorial")
    .map(({ reference }) => JSON.parse(reference)[2]);
  assert.deepEqual(references.sort(), [
    "distinct-basis",
    "first-basis",
    "handoff-basis",
    "second-basis",
  ]);
  const first = facts.find(({ reference }) => JSON.parse(reference)[2] === "first-basis");
  const distinct = facts.find(({ reference }) => JSON.parse(reference)[2] === "distinct-basis");
  assert.notEqual(first.reference, distinct.reference);
  assert.deepEqual(first.facts, distinct.facts);
});

test(
  "interactive responsibility paths attach to their visible source nodes",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 35_000 },
  async (t) => {
    const { selected } = await responsibilityFixture(t);
    const output = path.join(selected.root, "attached-responsibility-candidate");
    await compileEditionCandidateInput(selected.file, selected.digest, output);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(pathToFileURL(path.join(output, "interactive/architecture.html")).href, {
      waitUntil: "load",
      timeout: 15_000,
    });
    const member = await selectedInteractiveMember(page, "overview");
    await member.locator(".diagram-container > svg").waitFor({ state: "visible", timeout: 8_000 });
    await member.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.readerLayout.whenStable();
    });
    const result = await member.evaluate(() => {
      const figure = globalThis.document.querySelector(".diagram-container");
      if (!figure) return { figure: false };
      const path = figure.querySelector('path[data-edge-id="r-0"]:not([data-logical-relation])');
      if (!path) return { figure: true, path: false };
      const svg = path.ownerSVGElement;
      const matrix = svg.getScreenCTM();
      const point = (at) => {
        const value = path.getPointAtLength(at);
        return new globalThis.DOMPoint(value.x, value.y).matrixTransform(matrix);
      };
      const near = (at, id) => {
        const box = figure.querySelector(`[data-node-id="${id}"] rect`).getBoundingClientRect();
        const p = point(at);
        const x = Math.max(box.left, Math.min(p.x, box.right));
        const y = Math.max(box.top, Math.min(p.y, box.bottom));
        return Math.hypot(p.x - x, p.y - y);
      };
      const memberships = [0, 1].map((index) => {
        const group = figure.querySelector(`[data-group-id="g-${index}"]`).getBoundingClientRect();
        const node = figure
          .querySelector(`[data-node-id="n-${index}"] rect`)
          .getBoundingClientRect();
        return Math.min(
          node.left - group.left,
          node.top - group.top,
          group.right - node.right,
          group.bottom - node.bottom,
        );
      });
      const handoff = globalThis.document.querySelector('[data-note-item-id="h-0"]');
      return {
        figure: true,
        path: true,
        sourceGap: near(0, "n-0"),
        targetGap: near(path.getTotalLength(), "n-1"),
        memberships,
        handoff: handoff?.innerText,
        bottom: figure.getBoundingClientRect().bottom,
      };
    });
    assert.equal(result.figure, true);
    assert.equal(result.path, true);
    assert(result.sourceGap <= 12, `source gap ${result.sourceGap}`);
    assert(result.targetGap <= 12, `target gap ${result.targetGap}`);
    assert(
      result.memberships.every((clearance) => clearance >= 12),
      "declared roles contain their own source nodes with reading clearance",
    );
    assert.match(result.handoff, /First responsibility → Second responsibility/u);
    assert.match(result.handoff, /The first component hands control to the second/u);
    assert.match(result.handoff, /Editorial judgment · fixture-editor · unverified/u);
    assert(result.bottom <= 1000, `map bottom ${result.bottom}`);
  },
);

test(
  "interactive responsibility labels retain WCAG AA contrast without inventing a source predicate",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 35_000 },
  async (t) => {
    const { selected } = await responsibilityFixture(t);
    selected.model = Buffer.from(
      selected.model.toString().replace("alpha -> beta", "alpha -> beta 'configures'"),
    );
    await fs.writeFile(path.join(selected.root, "sources/model.c4"), selected.model);
    selected.request.sources.find(({ id }) => id === "model").input.sha256 = sha(selected.model);
    const request = Buffer.from(JSON.stringify(selected.request) + "\n");
    await fs.writeFile(selected.file, request);
    selected.digest = sha(request);
    const output = path.join(selected.root, "accessible-responsibility-candidate");
    await compileEditionCandidateInput(selected.file, selected.digest, output);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto(pathToFileURL(path.join(output, "interactive/architecture.html")).href, {
      waitUntil: "load",
      timeout: 15_000,
    });
    const member = await selectedInteractiveMember(page, "overview");
    await member.locator(".diagram-container > svg").waitFor({ state: "visible", timeout: 8_000 });
    await member.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.readerLayout.whenStable();
    });
    const roleLabels = member.locator("[data-boundary-label]");
    assert.equal(await roleLabels.count(), 2);
    for (let index = 0; index < 2; index++) {
      const label = roleLabels.nth(index);
      await label.scrollIntoViewIfNeeded();
      const ratio = await contrast(
        member,
        `[data-composition-frame-id="${index}"] [data-boundary-label]`,
        "fill",
      );
      assert(ratio >= 4.5, `role-label contrast ${ratio.toFixed(2)}:1`);
    }
    const relation = member.locator('[data-intrinsic-relation-label="r-0"] text');
    await relation.waitFor({ state: "visible", timeout: 8_000 });
    await relation.scrollIntoViewIfNeeded();
    const relationContrast = await contrast(
      member,
      '[data-intrinsic-relation-label="r-0"] text',
      "fill",
    );
    assert(relationContrast >= 4.5, `relation-label contrast ${relationContrast.toFixed(2)}:1`);
    await member.addScriptTag({ content: axe.source });
    const violations = await member.evaluate(async () => {
      const result = await globalThis.axe.run(globalThis.document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      }));
    });
    assert.deepEqual(violations, []);
  },
);

test("interactive projection retains only bound responsibility roles and handoffs", async (t) => {
  const { selected } = await responsibilityFixture(t);
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const page = composeInteractiveEditionScene(meaning).pages[0];
  const projected = projectInteractivePage(page, 0).publicPage;
  assert.equal(projected.form.roles.length, 2);
  assert.equal(projected.form.handoffs.length, 1);
  assert.equal(projected.form.roles[0].basis.kind, "editorial");
  assert.equal(projected.form.handoffs[0].basis.kind, "editorial");

  for (const [name, mutate] of [
    ["schema substitution", (copy) => (copy.visualForm.schema = "other-form/v1")],
    ["missing role", (copy) => copy.visualForm.roles.pop()],
    ["missing groups", (copy) => delete copy.groups],
    ["duplicate group", (copy) => (copy.visualForm.roles[1].group = "first-role")],
    ["unknown group", (copy) => (copy.visualForm.roles[1].group = "unknown-role")],
    ["unknown basis", (copy) => (copy.visualForm.roles[0].basis = "unknown-basis")],
    ["non-Claim source basis", (copy) => (copy.visualForm.roles[0].basis = "overview")],
    ["same-group handoff", (copy) => (copy.visualForm.handoffs[0].to = "first-role")],
    ["unknown handoff group", (copy) => (copy.visualForm.handoffs[0].to = "unknown-role")],
    ["unknown handoff basis", (copy) => (copy.visualForm.handoffs[0].basis = "unknown-basis")],
  ]) {
    const copy = structuredClone(page);
    mutate(copy);
    assert.throws(
      () => projectInteractivePage(copy, 0),
      {
        code: "render_responsibility_form_invalid",
      },
      name,
    );
  }
});

test("a static responsibility form paints its own source-bound visual argument", async (t) => {
  const { selected } = await responsibilityFixture(t, "static");
  const output = path.join(selected.root, "static-responsibility-candidate");
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, "built");
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const png = await fs.readFile(path.join(output, "static/architecture.png"));
  const visibleText = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(" ");
  assert.match(svg, /data-form="responsibility"/u);
  assert.match(visibleText, /Selected architecture/u);
  assert.match(visibleText, /First responsibility/u);
  assert.match(visibleText, /Second responsibility/u);
  assert.match(visibleText, /The first component hands control to the second/u);
  assert.match(visibleText, /First responsibility → Second responsibility/u);
  assert.match(visibleText, /Alpha/u);
  assert.match(visibleText, /Beta/u);
  assert.match(svg, /data-source-relation="r-0"/u);
  assert.doesNotMatch(svg, /SOURCE RELATIONS/u);
  const wrappedTitleBaseline = Number(
    svg.match(/<text[^>]* y="([0-9.]+)"[^>]*>responsibility<\/text>/u)?.[1],
  );
  const roleRule = Number(svg.match(/<line data-role-rule="g-1"[^>]* y1="([0-9.]+)"/u)?.[1]);
  assert(Number.isFinite(wrappedTitleBaseline) && Number.isFinite(roleRule));
  assert(roleRule - wrappedTitleBaseline >= 12);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json"), "utf8"));
  assert.deepEqual(Object.keys(candidate.media), ["static"]);
  const repeat = path.join(selected.root, "static-responsibility-repeat");
  await compileEditionCandidateInput(selected.file, selected.digest, repeat);
  for (const member of [
    "input-lock.json",
    "candidate.json",
    "manifest.json",
    "static/architecture.svg",
    "static/architecture.png",
  ])
    assert.deepEqual(
      await fs.readFile(path.join(output, member)),
      await fs.readFile(path.join(repeat, member)),
      member,
    );
});

test(
  "painted responsibility text clears paths and a controlled collision is detected",
  { skip: !path.isAbsolute(browserExecutable ?? ""), timeout: 35_000 },
  async (t) => {
    const { selected } = await responsibilityFixture(t, "static");
    const output = path.join(selected.root, "painted-responsibility-candidate");
    await compileEditionCandidateInput(selected.file, selected.digest, output);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await page.goto(pathToFileURL(path.join(output, "static/architecture.svg")).href, {
      waitUntil: "load",
      timeout: 15_000,
    });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const size = await page.evaluate(() => {
      const box = globalThis.document.documentElement.viewBox.baseVal;
      return { width: Math.ceil(box.width), height: Math.ceil(box.height) };
    });
    await page.setViewportSize(size);
    await page.evaluate(() => {
      const style = globalThis.document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.id = "mask-mode";
      globalThis.document.documentElement.append(style);
      style.textContent =
        "rect,path,line,polyline,polygon,circle,ellipse,image {visibility:hidden !important}";
    });
    const text = await page.screenshot({ omitBackground: true });
    await page.evaluate(() => {
      globalThis.document.getElementById("mask-mode").textContent =
        "rect,text,image {visibility:hidden !important}";
    });
    const marks = await page.screenshot({ omitBackground: true });
    const analysis = await browser.newPage();
    assert.deepEqual(await paintedContactCounts(analysis, text, marks), {
      contact: 0,
      withinTwoPixels: 0,
    });
    await page.evaluate(() => {
      const svg = globalThis.document.documentElement;
      const box = svg.querySelector("text").getBBox();
      const line = globalThis.document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(box.x));
      line.setAttribute("x2", String(box.x + box.width));
      line.setAttribute("y1", String(box.y + box.height / 2));
      line.setAttribute("y2", String(box.y + box.height / 2));
      line.setAttribute("stroke", "#24362e");
      line.setAttribute("stroke-width", "3");
      svg.append(line);
    });
    const controlled = await page.screenshot({ omitBackground: true });
    const detected = await paintedContactCounts(analysis, text, controlled);
    assert(detected.contact > 0);
    assert(detected.withinTwoPixels >= detected.contact);
  },
);
