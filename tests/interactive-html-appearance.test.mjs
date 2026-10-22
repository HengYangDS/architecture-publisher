import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { fixture, html, sha256 } from "./fixtures/interactive-html.mjs";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/index.mjs";

test(
  "host appearance controls follow the current nonnative page",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const input = fixture();
    input.appearance = { style: "editorial", theme: "light" };
    for (const page of input.pages) {
      page.content = html(
        page.label,
        '<script>addEventListener("message", event => { if (event.source === parent && event.data?.type === "architecture-interactive:appearance") globalThis.receivedAppearance = event.data; });</script>',
      );
      page.sha256 = sha256(page.content);
    }
    const output = composeInteractiveHtml(input);
    const browser = await browserLifetime(t).acquire(() =>
      chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setContent(output.toString(), { waitUntil: "load" });
      await page.frameLocator("#interactive-frame").locator("svg").waitFor();
      await page.getByRole("button", { name: "Semantics", exact: true }).click();
      const member = page.frameLocator("#interactive-frame");
      await member.locator('[data-interactive-member="semantics"]').waitFor();
      const element = await page.locator("#interactive-frame").elementHandle();
      const frame = await element.contentFrame();
      await frame.waitForFunction(
        () =>
          globalThis.receivedAppearance?.style === "editorial" &&
          globalThis.receivedAppearance?.theme === "light",
        {},
        { timeout: 2000 },
      );
      await page.selectOption("#interactive-style", "classic");
      await page.selectOption("#interactive-theme", "dark");
      await frame.waitForFunction(
        () =>
          globalThis.receivedAppearance?.style === "classic" &&
          globalThis.receivedAppearance?.theme === "dark",
        {},
        { timeout: 2000 },
      );
      assert.deepEqual(errors, []);
      assert.equal(
        await page.locator("#interactive-frame").getAttribute("sandbox"),
        "allow-scripts allow-downloads",
      );
    } finally {
      await browser.close();
    }
  },
);
