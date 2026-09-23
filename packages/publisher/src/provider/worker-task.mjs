import { pathToFileURL } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';

try {
  delete process.env.NODE_V8_COVERAGE;
  const module = await import(pathToFileURL(workerData.entrypoint).href);
  if (typeof module.materializeEditionProvider !== 'function')
    throw new Error('edition_provider_export_invalid');
  const reply = await module.materializeEditionProvider(workerData.request);
  if (process.exitCode !== undefined && process.exitCode !== 0)
    parentPort.postMessage({ status: 'error', code: 'edition_provider_process_failed' });
  else parentPort.postMessage({ status: 'ok', reply });
} catch {
  parentPort.postMessage({ status: 'error', code: 'edition_provider_execution_failed' });
}
