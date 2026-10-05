import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

for (const name of Object.keys(process.env))
  if (name.toLowerCase().startsWith('npm_config_')) delete process.env[name];

process.env.npm_config_userconfig = fileURLToPath(new URL('./npm-user.npmrc', import.meta.url));
process.env.npm_config_globalconfig = fileURLToPath(new URL('./npm-global.npmrc', import.meta.url));

if (process.env.CI === 'true') {
  const { chromium } = await import('playwright-core');
  const browser = process.env.ARCHPUB_BROWSER_EXECUTABLE ?? chromium.executablePath();
  try {
    if (!path.isAbsolute(browser) || !statSync(browser).isFile())
      throw new Error('invalid browser');
    accessSync(browser, constants.X_OK);
  } catch (cause) {
    throw new Error('CI requires an accessible absolute browser executable', { cause });
  }
  process.env.ARCHPUB_BROWSER_EXECUTABLE = browser;
}
