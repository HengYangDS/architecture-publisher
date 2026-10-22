import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/index.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import {
  interactiveDocument,
  selectedInteractiveMember,
  selectedSourceMember,
  copyNativeReadingLink,
} from "./fixtures/interactive-member.mjs";
import { browserOptions, runBrowser, authoredHtml } from "./fixtures/reader-appearance.mjs";
import { sourceReadingFixture, sourceReference, sha } from "./fixtures/source-reading.mjs";

test(
  "public source reading reconciles native state and same-page history",
  { ...runBrowser, timeout: 90_000 },
  async (t) => {
    const { root } = await sourceReadingFixture(t, { repeatMember: true });
    const request = path.join(root, "build-request.json");
    const candidate = path.join(root, "candidate");
    await compileEditionCandidateInput(request, sha(await fs.readFile(request)), candidate);
    const file = path.join(candidate, "interactive/architecture.html");
    const document = interactiveDocument(await fs.readFile(file));
    const bindings = document.sourceReading.pages.connections.bindings;
    const source = sourceReference("alpha", "entity", "a");
    const target = sourceReference("alpha", "entity", "b");
    const relation = sourceReference("alpha", "relation", "r");
    const browser = await browserLifetime(t).acquire(() => chromium.launch(browserOptions));
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [],
      requests = [];
    context.on("page", (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) errors.push(message.text());
      });
    });
    const base = pathToFileURL(file).href;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      url.hash = "";
      url.search = "";
      if (url.href === base) return route.continue();
      requests.push(route.request().url());
      await route.abort();
    });
    const origin = await context.newPage();
    await origin.goto(base + "#page=connections", { waitUntil: "load" });
    const member = await selectedInteractiveMember(origin, "connections");
    await member.locator('[data-inspect-id="a-copy"][tabindex]').press("i");
    const declaration = origin
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .first();
    if (!(await declaration.evaluate((element) => element.open)))
      await declaration.locator(":scope > summary").click();
    await declaration.locator(".inspect-source-diagram > summary").click();
    const native = await selectedSourceMember(origin);
    await native.evaluate((id) => {
      globalThis.Archify.focus.set(id, { toggle: false });
      globalThis.Archify.focus.reach("downstream", { reveal: false });
    }, bindings[source].id);
    const copied = await copyNativeReadingLink(native);
    const changeAddress = (state) => {
      const url = new URL(copied);
      const hash = new URLSearchParams(url.hash.slice(1));
      hash.set("sourceReader", state);
      url.hash = hash.toString();
      return url.href;
    };
    const targetAddress = changeAddress(`focus=${bindings[target].id}`);
    const relationAddress = changeAddress(`relation=${bindings[relation].id}`);
    const pushAddress = (page, address) =>
      page.evaluate((url) => {
        globalThis.history.pushState(null, "", url);
        globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate"));
      }, address);
    const assertFocus = async (page, reference) => {
      const frame = await selectedSourceMember(page);
      await frame.waitForFunction(
        (id) => globalThis.Archify.focus.active() === id,
        bindings[reference].id,
        { timeout: 8_000 },
      );
      const hash = new URLSearchParams(new URL(page.url()).hash.slice(1));
      assert.equal(hash.get("source"), source, "native focus preserves declaration ownership");
      assert.equal(hash.get("inspect"), "a-copy", "replay preserves the initiating occurrence");
      assert.deepEqual(
        await frame
          .locator("svg g[data-node-id]")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.dataset.publicationSourceReference).sort(),
          ),
        Object.keys(bindings)
          .filter((key) => bindings[key].kind === "entity")
          .sort(),
        "replay does not add, lose or aggregate selected source identities",
      );
      return frame;
    };
    await t.test("same-page replay restores the newly requested native subject", async () => {
      const page = await context.newPage();
      try {
        await page.goto(copied, { waitUntil: "load" });
        await assertFocus(page, source);
        await pushAddress(page, targetAddress);
        const frame = await assertFocus(page, target);
        assert.equal(await copyNativeReadingLink(frame), targetAddress);
        await pushAddress(page, copied);
        const returned = await assertFocus(page, source);
        assert.deepEqual(
          await returned.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot().nodeIds),
          [bindings[source].id, bindings[target].id],
        );
      } finally {
        await page.close();
      }
    });
    await t.test("same-turn supersession retains only the latest native state", async () => {
      const page = await context.newPage();
      try {
        await page.goto(copied, { waitUntil: "load" });
        await assertFocus(page, source);
        await page.evaluate(
          (addresses) => {
            for (const address of addresses) {
              globalThis.history.pushState(null, "", address);
              globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate"));
            }
          },
          [targetAddress, relationAddress, copied],
        );
        const frame = await assertFocus(page, source);
        assert.equal(await copyNativeReadingLink(frame), copied);
        assert.equal(await frame.evaluate(() => globalThis.Archify.focus.relationship()), null);
        assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 1);
      } finally {
        await page.close();
      }
    });
    for (const entry of ["page-tab", "public-navigation"])
      await t.test(`${entry} clears obsolete source reading before reload`, async () => {
        const page = await context.newPage();
        try {
          await page.goto(copied, { waitUntil: "load" });
          await assertFocus(page, source);
          if (entry === "page-tab") await page.locator('[data-interactive-page="release"]').click();
          else
            await page.evaluate(() =>
              globalThis.window.__architectureInteractive.navigate("release"),
            );
          await selectedInteractiveMember(page, "release");
          assert.equal(await page.locator("#interactive-inspector").isVisible(), false);
          assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 0);
          assert.equal(page.url(), base + "#page=release");
          await page.reload({ waitUntil: "load" });
          await selectedInteractiveMember(page, "release");
          assert.equal(await page.locator("#interactive-inspector").isVisible(), false);
          assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 0);
          assert.equal(page.url(), base + "#page=release");
        } finally {
          await page.close();
        }
      });
    await t.test("same-page focused and relationship states follow Back and Forward", async () => {
      const page = await context.newPage();
      try {
        await page.goto(copied, { waitUntil: "load" });
        await assertFocus(page, source);
        await pushAddress(page, targetAddress);
        await assertFocus(page, target);
        await pushAddress(page, relationAddress);
        let frame = await selectedSourceMember(page);
        await frame.waitForFunction(
          (id) => globalThis.Archify.focus.relationship()?.id === id,
          bindings[relation].id,
          { timeout: 8_000 },
        );
        assert.equal(await copyNativeReadingLink(frame), relationAddress);
        await page.goBack();
        frame = await assertFocus(page, target);
        assert.equal(await copyNativeReadingLink(frame), targetAddress);
        await page.goBack();
        frame = await assertFocus(page, source);
        assert.equal(await copyNativeReadingLink(frame), copied);
        await page.goForward();
        await assertFocus(page, target);
        await page.goForward();
        frame = await selectedSourceMember(page);
        await frame.waitForFunction(
          (id) => globalThis.Archify.focus.relationship()?.id === id,
          bindings[relation].id,
          { timeout: 8_000 },
        );
        assert.equal(page.url(), relationAddress);
      } finally {
        await page.close();
      }
    });
    const invalid = new URL(copied);
    const invalidHash = new URLSearchParams(invalid.hash.slice(1));
    invalidHash.set("edition", "0".repeat(64));
    invalid.hash = invalidHash.toString();
    for (const [name, incoming] of [
      ["unaddressed", base + "#page=connections"],
      ["invalid", invalid.href],
    ])
      await t.test(
        `Back to an ${name} entry disposes stale reading without rewriting history`,
        async () => {
          const page = await context.newPage();
          try {
            await page.goto(incoming, { waitUntil: "load" });
            await selectedInteractiveMember(page, "connections");
            await pushAddress(page, copied);
            await assertFocus(page, source);
            await page.goBack();
            await page
              .locator("[data-source-reader-root] > iframe")
              .waitFor({ state: "detached", timeout: 8_000 });
            assert.equal(page.url(), incoming);
            assert.equal(await page.locator(".inspect-source-diagram[open]").count(), 0);
            await page.goForward();
            await assertFocus(page, source);
            assert.equal(page.url(), copied);
          } finally {
            await page.close();
          }
        },
      );
    await t.test("dismissal during replay cannot resurrect disposed reading", async () => {
      const page = await context.newPage();
      try {
        await page.goto(copied, { waitUntil: "load" });
        await assertFocus(page, source);
        await page.evaluate((address) => {
          globalThis.history.pushState(null, "", address);
          globalThis.dispatchEvent(new globalThis.PopStateEvent("popstate"));
          globalThis.window.__architectureInteractive.closeInspect();
        }, targetAddress);
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
            ),
        );
        assert.equal(await page.locator("#interactive-inspector").isVisible(), false);
        assert.equal(await page.locator("[data-source-reader-root] > iframe").count(), 0);
        const hash = new URLSearchParams(new URL(page.url()).hash.slice(1));
        assert.equal(hash.has("sourceReader"), false);
        assert.equal(hash.has("inspect"), false);
      } finally {
        await page.close();
      }
    });
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  },
);

test("standalone native reading survives page and browser history", runBrowser, async (t) => {
  const html = await authoredHtml(t, true);
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-reading-history-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, "architecture.html");
  await fs.writeFile(file, html);
  for (const disableCache of [false, true])
    await t.test(
      disableCache ? "without back-forward cache" : "with default browser cache",
      async (t) => {
        const lifetime = browserLifetime(t);
        const browser = lifetime.use(
          await chromium.launch({
            ...browserOptions,
            args: disableCache ? ["--disable-features=BackForwardCache"] : [],
          }),
        );
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (["warning", "error"].includes(message.type())) errors.push(message.text());
        });
        const routeHash = "page=relations&reader=" + encodeURIComponent("route=client~server");
        await page.goto(pathToFileURL(file).href + "#" + routeHash, {
          waitUntil: "load",
        });
        async function currentFrame(id, predicate) {
          await page.waitForFunction(
            (id) => globalThis.document.querySelector("#interactive-frame").dataset.page === id,
            id,
          );
          const handle = await page.locator("#interactive-frame").elementHandle();
          const frame = await handle.contentFrame();
          await frame.waitForFunction(predicate);
          return frame;
        }
        const nativeReady = () => !!globalThis.Archify?.routeProbe;
        const routeReady = () => !!globalThis.Archify?.routeProbe?.exportSnapshot();
        async function selectedRoute() {
          const frame = await currentFrame("relations", routeReady);
          assert.deepEqual(
            await frame.evaluate(() => globalThis.Archify.routeProbe.exportSnapshot().nodeIds),
            ["client", "server"],
          );
          assert.equal(
            await frame.evaluate(() => globalThis.Archify.routeProbe.isJourneyPlaying()),
            false,
          );
          return frame;
        }
        let frame = await selectedRoute();
        const addressed = await frame.evaluate(async () => {
          let value;
          globalThis.document.execCommand = (command) => {
            if (command !== "copy") return false;
            value = globalThis.document.querySelector("textarea[readonly]")?.value;
            return true;
          };
          return {
            passed: await globalThis.Archify.routeProbe.copyLink(),
            value,
          };
        });
        assert.equal(addressed.passed, true);
        assert.equal(new URL(addressed.value).hash.slice(1), routeHash);
        const initialLength = await page.evaluate(() => globalThis.history.length);
        await page.locator('[data-interactive-page="overview"]').click();
        frame = await currentFrame("overview", nativeReady);
        assert.equal(
          await frame.evaluate(() => globalThis.Archify.routeProbe.exportSnapshot()),
          null,
        );
        assert.equal(await page.evaluate(() => globalThis.history.length), initialLength + 1);
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.evaluate(() => globalThis.history.forward());
        await currentFrame("overview", nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.evaluate(() => {
          globalThis.location.hash =
            "page=relations&reader=" + encodeURIComponent("focus=client&reach=downstream");
        });
        frame = await currentFrame(
          "relations",
          () => !!globalThis.Archify?.focus?.reachabilitySnapshot(),
        );
        assert.deepEqual(
          await frame.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot().nodeIds),
          ["client", "server"],
        );
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.reload({ waitUntil: "load" });
        frame = await selectedRoute();
        const instance = await page.locator("#interactive-frame").elementHandle();
        await frame.evaluate(() => globalThis.Archify.view.zoomIn());
        assert.equal(
          await instance.evaluate(
            (node) => node === globalThis.document.querySelector("#interactive-frame"),
          ),
          true,
        );
        await page.goto("about:blank", { waitUntil: "load" });
        await page.goBack({ waitUntil: "load" });
        await selectedRoute();
        await page.evaluate(() => {
          globalThis.window.__architectureInteractive.navigate("overview");
          globalThis.window.__architectureInteractive.navigate("relations");
          globalThis.window.__architectureInteractive.navigate("overview");
        });
        await currentFrame("overview", nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await currentFrame("relations", nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await currentFrame("overview", nativeReady);
        await page.evaluate(() => globalThis.history.back());
        frame = await selectedRoute();
        const downloaded = page.waitForEvent("download", { timeout: 15000 });
        await frame.evaluate(() => globalThis.Archify.exportMenu.run("svg"));
        const canonical = await fs.readFile(await (await downloaded).path(), "utf8");
        assert.doesNotMatch(
          canonical,
          /data-publication-uri|about:srcdoc|location[.](?:replace|hash)/,
        );
        assert.equal(canonical.includes(root), false);
        assert.deepEqual(errors, []);
      },
    );
});
