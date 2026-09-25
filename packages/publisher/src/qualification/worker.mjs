import fs from 'node:fs';
import { hasExactFields } from '../source/manifest.mjs';
import { verifyQualificationInsideWorker } from './input.mjs';
import { withQualificationOwnership } from './process-boundary.mjs';

let envelope;
try {
  const invocation = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (
    !hasExactFields(invocation, ['schema', 'file', 'sha256', 'executionChoice']) ||
    invocation.schema !== 'architecture.qualification-invocation/v1' ||
    typeof invocation.file !== 'string' ||
    typeof invocation.sha256 !== 'string' ||
    !Array.isArray(invocation.executionChoice)
  )
    throw Object.assign(new Error('qualification_invocation_invalid'), {
      code: 'qualification_invocation_invalid',
    });
  const result = await withQualificationOwnership(() =>
    verifyQualificationInsideWorker(invocation.file, invocation.sha256, invocation.executionChoice),
  );
  envelope = { status: 'ok', result };
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  envelope = {
    status: 'error',
    code:
      typeof code === 'string' && /^[a-z][a-z0-9_]+$/u.test(code)
        ? code
        : 'qualification_worker_failed',
  };
}
process.stdout.write(JSON.stringify(envelope) + '\n');
setInterval(() => {}, 1000);
