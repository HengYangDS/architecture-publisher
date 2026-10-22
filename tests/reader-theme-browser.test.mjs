import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { selectedNativeEdition, sha } from "./fixtures/selected-native-edition.mjs";
import {
  browserOptions,
  runBrowser,
  authoredHtml,
  observeSystemTheme,
  geometry,
  contrast,
} from "./fixtures/reader-appearance.mjs";

async function selectNativeAppearance(page, member, style, theme) {
  await member.locator("#btn-preset").click();
  await member.locator(`[data-preset-value="${style}"]`).click();
  if ((await member.locator("html").getAttribute("data-theme")) !== theme)
    await member.locator("#btn-theme").click();
  await member.waitForFunction(
    ({ style, theme }) =>
      globalThis.document.documentElement.dataset.preset === style &&
      globalThis.document.documentElement.dataset.theme === theme,
    { style, theme },
  );
  await page.waitForFunction(
    ({ style, theme }) =>
      globalThis.document.documentElement.dataset.style === style &&
      globalThis.document.documentElement.dataset.theme === theme,
    { style, theme },
  );
  await member.evaluate(async () => globalThis.Archify.layoutStability.whenStable());
}

test(
  "real desktop neutral builds switch every appearance without changing graph geometry",
  runBrowser,
  async (t) => {
    const fixture = await selectedNativeEdition(t, { media: ["interactive"] });
    fixture.project.presentation.interactive.appearance = {
      style: "classic",
      theme: "dark",
    };
    await fs.writeFile(
      path.join(fixture.root, "edition/project.json"),
      JSON.stringify(fixture.project) + "\n",
    );
    const output = path.join(fixture.root, "candidate");
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const html = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(html, { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "overview");
    await member.waitForFunction(() => Boolean(globalThis.Archify?.preset));
    const drawing = "svg [data-node-id] text, svg [data-node-id]>rect, svg [data-edge-from]";
    const baseline = await geometry(member, drawing);
    assert(baseline.length >= 5, "the selected complete diagram is actually painted");
    const colors = new Set();
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await selectNativeAppearance(page, member, style, theme);
        assert.deepEqual(await geometry(member, drawing), baseline);
        const background = await page
          .locator("html")
          .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor);
        colors.add(background);
        const nodeFill = await member
          .locator("svg [data-node-id]>rect.c-mask")
          .first()
          .evaluate((el) => globalThis.getComputedStyle(el).fill);
        assert.notEqual(nodeFill, background);
        assert(
          (await contrast(member, "svg [data-node-id] text", "fill")) >= 4.5,
          `${style}/${theme}: node text contrast`,
        );
        assert(
          (await contrast(member, "svg [data-composition-points]", "stroke")) >= 3,
          `${style}/${theme}: route contrast`,
        );
        assert(
          (await contrast(
            page,
            ".chapters button[aria-current=page]",
            "color",
            ".chapters button[aria-current=page]",
          )) >= 4.5,
          `${style}/${theme}: selected navigation text contrast`,
        );
      }
    }
    assert.equal(colors.size, 8);
    assert.deepEqual(errors, []);
  },
);

test(
  "responsibility appearance covers the actual figure, not just the surrounding toolbar",
  runBrowser,
  async (t) => {
    const fixture = await selectedNativeEdition(t, { media: ["interactive"] });
    const namespace = fixture.request.sources[0].namespace;
    const view = fixture.project.presentation.interactive.views[0];
    view.groups = ["alpha", "beta"].map((id, index) => ({
      id: `role-${index + 1}`,
      label: `Responsibility ${index + 1}`,
      elements: [{ namespace, id }],
    }));
    view.form = {
      schema: "architecture.visual-form/v1",
      kind: "responsibility",
      roles: [
        { group: "role-1", basis: "first-role" },
        { group: "role-2", basis: "second-role" },
      ],
      handoffs: [{ from: "role-1", to: "role-2", basis: "handoff" }],
    };
    fixture.project.editorialAssertions = [
      ["first-role", "The first component has the first responsibility."],
      ["second-role", "The second component has the second responsibility."],
      ["handoff", "The first component hands work to the second."],
    ].map(([id, statement]) => ({
      id,
      statement,
      proponent: fixture.project.editor,
      basis: ["overview"],
      questions: ["shape"],
    }));
    await fs.writeFile(
      path.join(fixture.root, "edition/project.json"),
      JSON.stringify(fixture.project) + "\n",
    );
    const output = path.join(fixture.root, "candidate");
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(
      await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
      { waitUntil: "load" },
    );
    const member = await selectedInteractiveMember(page, "overview");
    await member.waitForFunction(() => Boolean(globalThis.Archify?.preset));
    const drawing = "svg [data-node-id] text, svg [data-node-id]>rect, svg [data-edge-from]";
    const baseline = await geometry(member, drawing);
    assert.equal(await member.locator("svg [data-group-id]").count(), 2);
    assert(baseline.length >= 5, "the complete responsibility figure is actually painted");
    const surfaces = new Set();
    for (const style of ["editorial", "blueprint", "classic", "signal-flow"]) {
      for (const theme of ["light", "dark"]) {
        await selectNativeAppearance(page, member, style, theme);
        surfaces.add(
          await member
            .locator("body")
            .evaluate((el) =>
              [
                globalThis.getComputedStyle(el).backgroundColor,
                globalThis.getComputedStyle(el.querySelector("text")).fill,
              ].join("|"),
            ),
        );
        assert.deepEqual(await geometry(member, drawing), baseline);
        assert(
          (await contrast(member, "svg [data-boundary-label]", "fill")) >= 4.5,
          `${style}/${theme}: role detail contrast`,
        );
        assert(
          (await contrast(member, "svg [data-node-id] text", "fill")) >= 4.5,
          `${style}/${theme}: graph text contrast`,
        );
      }
    }
    assert.equal(
      surfaces.size,
      8,
      "the whole responsibility figure follows every offered appearance",
    );
  },
);

test(
  "opaque native members retain their exact runtime and explicit theme across system and page transitions",
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t, true);
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(html.toString(), { waitUntil: "load" });
    const expectedScripts = await page.evaluate(() => {
      const data = JSON.parse(
        globalThis.document.getElementById("architecture-interactive-data").textContent,
      );
      const source = data.pages.overview.pieces
        .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
        .join("");
      const selected = new globalThis.DOMParser().parseFromString(source, "text/html");
      return [...selected.scripts]
        .filter(
          (script) =>
            !script.type || ["text/javascript", "application/javascript"].includes(script.type),
        )
        .map((script) => script.textContent);
    });
    const member = await selectedInteractiveMember(page, "overview");
    const actualScripts = await member.evaluate(() =>
      [...globalThis.document.scripts].map((script) => script.textContent),
    );
    assert.deepEqual(
      actualScripts
        .filter((script) => expectedScripts.includes(script))
        .map((script) => sha(Buffer.from(script))),
      expectedScripts.map((script) => sha(Buffer.from(script))),
      "The publication boundary preserves every selected native executable script byte",
    );
    assert.equal(await member.locator("html").getAttribute("data-theme"), "dark");
    await observeSystemTheme(member, "dark", () => page.emulateMedia({ colorScheme: "dark" }));
    await observeSystemTheme(member, "light", () => page.emulateMedia({ colorScheme: "light" }));
    assert.equal(await member.locator("html").getAttribute("data-theme"), "dark");
    await member.locator("#btn-theme").click();
    await observeSystemTheme(member, "dark", () => page.emulateMedia({ colorScheme: "dark" }));
    assert.equal(await member.locator("html").getAttribute("data-theme"), "light");
    await page.waitForFunction(() => globalThis.document.documentElement.dataset.theme === "light");
    await page.getByRole("button", { name: "Relations", exact: true }).click();
    const successor = await selectedInteractiveMember(page, "relations");
    assert.equal(await successor.locator("html").getAttribute("data-theme"), "light");
    assert.equal(await successor.locator("#theme-label").textContent(), "Light");
    assert.equal(
      await page.locator("#interactive-frame").getAttribute("sandbox"),
      "allow-scripts allow-downloads",
    );
    assert.deepEqual(errors, []);
  },
);

test(
  "native appearance reception is installed before an opaque child begins initialization",
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t);
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const observation = `<script>(() => {
      let receiving = false;
      const add = window.addEventListener;
      window.addEventListener = function (type, listener, options) {
        if (type === 'message' && String(listener).includes('architecture-interactive:native-appearance')) receiving = true;
        return add.call(this, type, listener, options);
      };
      const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
      window.appearanceReception = [];
      Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', {
        configurable: true, get: descriptor.get,
        set(value) {
          window.appearanceReception.push(receiving);
          descriptor.set.call(this, value);
        }
      });
    })();</script>`;
    await page.setContent(html.toString().replace("<head>", "<head>" + observation), {
      waitUntil: "load",
    });
    await page.frameLocator("#interactive-frame").locator("[data-interactive-member]").waitFor();
    assert.deepEqual(await page.evaluate(() => globalThis.appearanceReception), [true]);
  },
);

test(
  "native system-theme observation times out and releases its listener when no change is delivered",
  runBrowser,
  async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ colorScheme: "light" });
    const member = page.mainFrame();
    await assert.rejects(
      observeSystemTheme(
        member,
        "dark",
        () =>
          member.evaluate(() => {
            globalThis.expiredSystemThemeObservation = globalThis.systemThemeObservation;
          }),
        200,
      ),
      { message: "The real browser did not deliver the dark preference within 200ms" },
    );
    assert.equal(
      await member.evaluate(() => typeof globalThis.systemThemeObservation),
      "undefined",
    );
    await observeSystemTheme(member, "dark", () => page.emulateMedia({ colorScheme: "dark" }));
    assert.equal(
      await member.evaluate(() => globalThis.expiredSystemThemeObservation.settled),
      false,
      "the expired listener does not observe a later real media event",
    );
  },
);
