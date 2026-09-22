import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

try {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  const entrypoint = process.argv[2];
  delete process.env.NODE_V8_COVERAGE;
  const selectedEntrypointUrl = pathToFileURL(entrypoint).href;
  const module = await import(selectedEntrypointUrl);
  if (typeof module.materializeEditionProvider !== 'function')
    throw Object.assign(new Error('edition_provider_export_invalid'), {
      code: 'edition_provider_export_invalid',
    });
  const reply = await module.materializeEditionProvider(request);
  process.stdout.write(JSON.stringify({ status: 'ok', reply }));
} catch {
  process.stdout.write(
    JSON.stringify({ status: 'error', code: 'edition_provider_execution_failed' }),
  );
  process.exitCode = 1;
}
