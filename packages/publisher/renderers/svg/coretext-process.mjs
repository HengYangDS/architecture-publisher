import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROCESS_CLEANUP_MS,
  runOwnedProcess,
  terminatePosixGroup,
} from '../../src/runtime/process-tree.mjs';
import { fail, hasExactFields as fields } from '../../src/protocol/values.mjs';

const worker = fileURLToPath(new URL('./coretext-worker.mjs', import.meta.url));
const responseFields = [
  'status',
  'exitCode',
  'signal',
  'processError',
  'stdoutBase64',
  'diagnostics',
];

function stageFailure(stage, result) {
  const code =
    stage === 'compile'
      ? 'coretext_compile_failed'
      : result.processError === 'ETIMEDOUT'
        ? 'coretext_execution_timeout'
        : 'coretext_execution_failed';
  return Object.assign(new Error(code), { code, ...result });
}

async function reclaimStageGroup(pid) {
  await terminatePosixGroup(pid);
  const deadline = Date.now() + PROCESS_CLEANUP_MS;
  while (Date.now() < deadline) {
    try {
      process.kill(-pid, 0);
    } catch (error) {
      if (error.code === 'ESRCH') return;
      if (error.code !== 'EPERM') throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  fail('coretext_stage_cleanup_unproved');
}

async function stageDiagnostics(scratch) {
  try {
    const diagnostics = await fs.readFile(path.join(scratch, 'coretext-stage-diagnostics.txt'), {
      encoding: 'utf8',
      signal: AbortSignal.timeout(1000),
    });
    return { diagnostics: diagnostics.slice(-4000) };
  } catch (error) {
    return { diagnostics: '', diagnosticsObservation: `unobserved:${error.code ?? 'UNKNOWN'}` };
  }
}

/** Two stage callers share one private lifecycle, not a general subprocess interface. */
export async function runCoreTextStage({
  stage,
  executable,
  args,
  env,
  input = '',
  scratch,
  timeoutMs,
  maximumBytes,
}) {
  if (
    !['compile', 'execution'].includes(stage) ||
    typeof executable !== 'string' ||
    !path.isAbsolute(executable) ||
    typeof scratch !== 'string' ||
    !path.isAbsolute(scratch) ||
    !Array.isArray(args) ||
    args.some((value) => typeof value !== 'string') ||
    !env ||
    typeof env !== 'object' ||
    Array.isArray(env) ||
    Object.values(env).some((value) => typeof value !== 'string') ||
    typeof input !== 'string' ||
    Buffer.byteLength(input) > 64 * 1024 * 1024 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > (stage === 'compile' ? 120_000 : 30_000) ||
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    maximumBytes > 16 * 1024 * 1024
  )
    fail('coretext_stage_plan_invalid');
  const requestPath = path.join(scratch, `coretext-${stage}-request.json`);
  const request = { executable, args, env, input, scratch, timeoutMs, maximumBytes };
  await fs.writeFile(path.join(scratch, 'coretext-stage-diagnostics.txt'), '');
  await fs.writeFile(requestPath, JSON.stringify(request), { flag: 'wx' });
  let primary;
  try {
    return await runOwnedProcess({
      worker,
      args: [String(timeoutMs + PROCESS_CLEANUP_MS + 1_000)],
      requestPath,
      scratch,
      timeoutMs,
      maximumBytes: Math.ceil(maximumBytes / 3) * 4 + 16_384,
      failurePrefix: 'coretext_stage',
      ...(process.platform === 'win32' ? {} : { terminateTree: reclaimStageGroup }),
      async decode(raw, state, reason) {
        if (reason === 'timeout') {
          primary = stageFailure(stage, {
            exitCode: state.closed?.code ?? null,
            signal: state.closed?.signal ?? null,
            processError: 'ETIMEDOUT',
            ...(await stageDiagnostics(scratch)),
          });
          throw primary;
        }
        if (!['reply', 'closed'].includes(reason) || state.stderrBytes) {
          primary = stageFailure(stage, {
            exitCode: state.closed?.code ?? null,
            signal: state.closed?.signal ?? null,
            processError: reason,
            ...(await stageDiagnostics(scratch)),
          });
          throw primary;
        }
        let reply;
        try {
          reply = JSON.parse(raw);
        } catch {
          fail('coretext_stage_response_invalid');
        }
        if (
          !fields(reply, responseFields) ||
          reply.status !== 'exited' ||
          !(reply.exitCode === null || Number.isSafeInteger(reply.exitCode)) ||
          !(reply.signal === null || typeof reply.signal === 'string') ||
          !(reply.processError === null || typeof reply.processError === 'string') ||
          typeof reply.stdoutBase64 !== 'string' ||
          typeof reply.diagnostics !== 'string' ||
          reply.diagnostics.length > 4000
        )
          fail('coretext_stage_response_invalid');
        const stdout = Buffer.from(reply.stdoutBase64, 'base64');
        if (stdout.toString('base64') !== reply.stdoutBase64 || stdout.length > maximumBytes)
          fail('coretext_stage_response_invalid');
        const result = {
          exitCode: reply.exitCode,
          signal: reply.signal,
          processError: reply.processError,
          stdout: stdout.toString('utf8'),
          diagnostics: reply.diagnostics,
        };
        if (
          result.processError ||
          result.signal ||
          (stage === 'compile' && result.exitCode !== 0)
        ) {
          primary = stageFailure(stage, result);
          throw primary;
        }
        return result;
      },
    });
  } catch (error) {
    if (['coretext_stage_cleanup_failed', 'coretext_stage_cleanup_unproved'].includes(error.code)) {
      if (primary) error.primaryFailure = primary;
      error.scratch = scratch;
    }
    throw error;
  }
}
