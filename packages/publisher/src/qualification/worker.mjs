import fs from 'node:fs';
import { takeCoverage } from 'node:v8';
import { hasExactFields } from '../protocol/values.mjs';
import { verifyQualificationInsideWorker } from './input.mjs';
import { withQualificationOwnership } from './process-boundary.mjs';
import { replaySelectedCandidate } from './replay.mjs';

let envelope;
try {
  const invocation = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (
    !hasExactFields(invocation, [
      'schema',
      'operation',
      'selection',
      'executionChoice',
      ...(Object.hasOwn(invocation, 'policyChoice') ? ['policyChoice'] : []),
    ]) ||
    invocation.schema !== 'architecture.qualification-invocation/v1' ||
    !['input', 'replay'].includes(invocation.operation) ||
    (invocation.operation === 'input' &&
      (!hasExactFields(invocation.selection, ['file', 'sha256']) ||
        typeof invocation.selection.file !== 'string' ||
        typeof invocation.selection.sha256 !== 'string')) ||
    !Array.isArray(invocation.executionChoice) ||
    (Object.hasOwn(invocation, 'policyChoice') &&
      (invocation.operation !== 'input' ||
        !hasExactFields(invocation.policyChoice, ['file', 'sha256']) ||
        typeof invocation.policyChoice.file !== 'string' ||
        typeof invocation.policyChoice.sha256 !== 'string'))
  )
    throw Object.assign(new Error('qualification_invocation_invalid'), {
      code: 'qualification_invocation_invalid',
    });
  const result = await withQualificationOwnership(async () =>
    invocation.operation === 'input'
      ? verifyQualificationInsideWorker(
          invocation.selection.file,
          invocation.selection.sha256,
          invocation.executionChoice,
          invocation.policyChoice ?? null,
        )
      : (await replaySelectedCandidate(invocation.selection, invocation.executionChoice)).replay,
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
// The parent terminates this held worker after its reply, so flush test coverage first.
if (process.env.NODE_V8_COVERAGE) takeCoverage();
process.stdout.write(JSON.stringify(envelope) + '\n');
setInterval(() => {}, 1000);
