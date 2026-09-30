import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const deadlineMs = Number(process.argv[2]);
if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0 || deadlineMs > 35_000) process.exit(1);
const deadline = setTimeout(() => process.exit(1), deadlineMs);
try {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (
    request?.schema !== 'architecture.interactive-layout-request/v1' ||
    !Array.isArray(request.graphs) ||
    !request.graphs.length ||
    request.graphs.length > 256
  )
    throw new Error('invalid request');
  const privateLayoutUrl = pathToFileURL(path.join(process.cwd(), 'elk.cjs')).href;
  const { default: ELK } = await import(privateLayoutUrl);
  const elk = new ELK();
  const layouts = [];
  for (const graph of request.graphs) layouts.push(await elk.layout(graph));
  process.stdout.write(
    JSON.stringify({ status: 'ok', layouts }, (key, value) => (key === '$H' ? undefined : value)) +
      '\n',
  );
} catch {
  process.stdout.write(
    JSON.stringify({ status: 'error', code: 'render_interactive_layout_execution_failed' }) + '\n',
  );
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
}
