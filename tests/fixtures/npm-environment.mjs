import { fileURLToPath } from 'node:url';

for (const name of Object.keys(process.env))
  if (name.toLowerCase().startsWith('npm_config_')) delete process.env[name];

process.env.npm_config_userconfig = fileURLToPath(new URL('./npm-user.npmrc', import.meta.url));
process.env.npm_config_globalconfig = fileURLToPath(new URL('./npm-global.npmrc', import.meta.url));
process.env.npm_config_save = 'false';
process.env.npm_config_package_lock = 'false';
