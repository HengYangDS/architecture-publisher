import { accessSync, constants, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Historical POSIX package identity includes member modes. Scope the mask to
// this test process and its owned children, never the Runner or user session.
if (process.platform !== "win32") process.umask(0o022);

for (const name of Object.keys(process.env))
  if (name.toLowerCase().startsWith("npm_config_")) delete process.env[name];

process.env.npm_config_userconfig = fileURLToPath(new URL("./npm-user.npmrc", import.meta.url));
process.env.npm_config_globalconfig = fileURLToPath(new URL("./npm-global.npmrc", import.meta.url));

if (process.env.CI === "true") {
  const { chromium } = await import("playwright-core");
  const browser = process.env.ARCHPUB_BROWSER_EXECUTABLE ?? chromium.executablePath();
  try {
    if (!path.isAbsolute(browser) || !statSync(browser).isFile())
      throw new Error("invalid browser");
    accessSync(browser, constants.X_OK);
  } catch (cause) {
    throw new Error("CI requires an accessible absolute browser executable", { cause });
  }
  process.env.ARCHPUB_BROWSER_EXECUTABLE = browser;
}
